import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, View, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ClientManager() {
  const [clients, setClients] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const [newAddress, setNewAddress] = useState(''); // Added Address State
  const [newNotes, setNewNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', message: '' });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNdis, setEditNdis] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1b2026' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#0f1216' : '#f8f9fa';
  const border = colorScheme === 'dark' ? '#2d3238' : '#eee';
  const muted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    const data = await AsyncStorage.getItem('@ndis_clients');
    if (data) setClients(JSON.parse(data));
  };

  const stats = useMemo(() => {
    if (clients.length === 0) return { total: 0, latest: 'N/A' };
    const latestClient = [...clients].sort((a, b) => b.createdAt - a.createdAt)[0];
    return { total: clients.length, latest: latestClient.name };
  }, [clients]);

  const sortedClients = [...clients]
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.ndisNum.includes(searchQuery))
    .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : b.createdAt - a.createdAt);

  const addClient = async () => {
    const trimmedName = newName.trim();
    const trimmedId = newId.trim();
    const trimmedAddress = newAddress.trim();
    
    if (!trimmedName || !trimmedId) return showError("Missing Info", "Name and NDIS are required.");
    if (!/^\d{9}$/.test(trimmedId)) return showError("Invalid NDIS", "Must be 9 digits.");
    
    const updated = [...clients, { 
        id: Date.now().toString(), 
        name: trimmedName, 
        ndisNum: trimmedId, 
        address: trimmedAddress, // Saved to storage
        notes: newNotes.trim(), 
        createdAt: Date.now() 
    }];

    await AsyncStorage.setItem('@ndis_clients', JSON.stringify(updated));
    setClients(updated);
    setNewName(''); setNewId(''); setNewAddress(''); setNewNotes('');
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
    if (newSelection.size === 0) setSelectionMode(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedClients.length) {
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else {
      setSelectedIds(new Set(sortedClients.map(c => c.id)));
    }
  };

  const confirmBulkDelete = async () => {
    const updated = clients.filter(c => !selectedIds.has(c.id));
    await AsyncStorage.setItem('@ndis_clients', JSON.stringify(updated));
    setClients(updated);
    setSelectionMode(false);
    setSelectedIds(new Set());
    setShowDeleteModal(false);
  };

  const importClients = async () => {
    setShowMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json" });
      if (result.canceled) return;
      let content = Platform.OS === 'web' ? await (await fetch(result.assets[0].uri)).text() : await FileSystem.readAsStringAsync(result.assets[0].uri);
      const dataArray = Array.isArray(JSON.parse(content)) ? JSON.parse(content) : [JSON.parse(content)];
      
      const news = dataArray.map(c => ({
          id: c.id?.toString() || (Date.now() + Math.random()).toString(),
          name: c.name?.trim() || 'Unknown',
          ndisNum: c.ndisNum?.toString().trim() || '000000000',
          address: c.address || '',
          notes: c.notes || '',
          createdAt: c.createdAt || Date.now()
      }));

      const updated = [...clients, ...news];
      await AsyncStorage.setItem('@ndis_clients', JSON.stringify(updated));
      setClients(updated);
    } catch (e) { showError("Error", "Import failed."); }
  };

  const exportClients = async () => {
    setShowMenu(false);
    const fileName = `clients_${new Date().toISOString().split('T')[0]}.json`;
    const dataStr = JSON.stringify(clients, null, 2);
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([dataStr], { type: 'application/json' }));
      link.download = fileName; link.click();
    } else {
      const uri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(uri, dataStr);
      await Sharing.shareAsync(uri);
    }
  };

  const showError = (title: string, message: string) => {
    setErrorMessage({ title, message });
    setShowErrorModal(true);
  };

  const saveClientEdit = async () => {
    const trimmedName = editName.trim();
    const trimmedNdis = editNdis.trim();
    
    if (!trimmedName || !trimmedNdis) return showError("Missing Info", "Name and NDIS are required.");
    if (!/^\d{9}$/.test(trimmedNdis)) return showError("Invalid NDIS", "Must be 9 digits.");
    
    const updated = clients.map(c => 
      c.id === selectedClientDetail.id 
        ? { ...c, name: trimmedName, ndisNum: trimmedNdis, address: editAddress.trim(), notes: editNotes.trim() }
        : c
    );
    
    await AsyncStorage.setItem('@ndis_clients', JSON.stringify(updated));
    setClients(updated);
    setSelectedClientDetail({ ...selectedClientDetail, name: trimmedName, ndisNum: trimmedNdis, address: editAddress.trim(), notes: editNotes.trim() });
    setIsEditMode(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
        
        {/* HEADER */}
        <View style={styles.header}>
          {selectionMode ? (
            <View style={styles.selectionHeader}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => {setSelectionMode(false); setSelectedIds(new Set());}}>
                  <Ionicons name="close" size={24} color={palette.text} />
                </TouchableOpacity>
                <ThemedText style={styles.selectionTitle}>{selectedIds.size} Selected</ThemedText>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={toggleSelectAll} style={{ marginRight: 20 }}>
                  <Ionicons name={selectedIds.size === sortedClients.length ? "checkbox" : "checkbox-outline"} size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDeleteModal(true)}><Ionicons name="trash" size={24} color="#ff4444" /></TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <ThemedText type="title">Clients</ThemedText>
              <TouchableOpacity style={styles.moreBtn} onPress={() => setShowMenu(true)}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {!selectionMode && (
          <View style={[styles.addBox, { backgroundColor: surface, borderColor: border }]}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[styles.input, { flex: 2, backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]} maxLength={40} value={newName} onChangeText={setNewName} placeholder="Name" placeholderTextColor={muted} />
              <TextInput style={[styles.input, { flex: 1, backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]} maxLength={9} keyboardType="numeric" value={newId} onChangeText={setNewId} placeholder="NDIS No." placeholderTextColor={muted} />
            </View>
            
            {/* NEW ADDRESS INPUT */}
            <TextInput style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]} value={newAddress} onChangeText={setNewAddress} placeholder="Residential Address" placeholderTextColor={muted} />
            
            <TextInput style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text, height: 45 }]} multiline value={newNotes} onChangeText={setNewNotes} placeholder="Notes..." placeholderTextColor={muted} />
            <TouchableOpacity style={styles.addBtn} onPress={addClient}><ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Add Client</ThemedText></TouchableOpacity>
          </View>
        )}

        {/* SEARCH & SORT */}
        <View style={[styles.searchRow, { backgroundColor: surface, borderColor: border }]}>
          <Ionicons name="search" size={18} color={muted} />
          <TextInput style={[styles.searchInput, { color: palette.text }]} placeholder="Search clients..." value={searchQuery} onChangeText={setSearchQuery} />
          <View style={styles.sortToggle}>
            <TouchableOpacity onPress={() => setSortBy('date')} style={[styles.sortBtn, sortBy === 'date' && styles.activeSort]}><ThemedText style={[styles.sortText, sortBy === 'date' && { color: '#fff' }]}>New</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => setSortBy('name')} style={[styles.sortBtn, sortBy === 'name' && styles.activeSort]}><ThemedText style={[styles.sortText, sortBy === 'name' && { color: '#fff' }]}>A-Z</ThemedText></TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
          {sortedClients.map(client => {
            const isSelected = selectedIds.has(client.id);
            return (
              <TouchableOpacity 
                key={client.id} 
                onLongPress={() => {setSelectionMode(true); setSelectedIds(new Set([client.id]));}}
                onPress={() => {
                  if (selectionMode) {
                    toggleSelection(client.id);
                  } else {
                    setSelectedClientDetail(client);
                    setEditName(client.name);
                    setEditNdis(client.ndisNum);
                    setEditAddress(client.address || '');
                    setEditNotes(client.notes || '');
                    setIsEditMode(false);
                    setShowDetailModal(true);
                  }
                }}
                style={[styles.card, { backgroundColor: surface, borderColor: isSelected ? '#007AFF' : border, borderWidth: isSelected ? 2 : 1 }]}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold">{client.name}</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: '#007AFF', fontWeight: 'bold' }}>NDIS: {client.ndisNum}</ThemedText>
                  
                  {/* DISPLAY ADDRESS */}
                  {client.address ? (
                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4}}>
                       <Ionicons name="location-outline" size={12} color={muted} />
                       <ThemedText style={{ fontSize: 11, color: muted }}>{client.address}</ThemedText>
                    </View>
                  ) : null}

                  {client.notes ? <ThemedText style={styles.noteLine}>{client.notes}</ThemedText> : null}
                </View>
                {selectionMode && <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color={isSelected ? "#007AFF" : muted} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* STATS BAR */}
        {!selectionMode && (
          <View style={[styles.statsBar, { backgroundColor: surface, borderTopColor: border }]}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: muted }]}>TOTAL CLIENTS</ThemedText>
              <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: muted }]}>LATEST ADDED</ThemedText>
              <ThemedText style={styles.statValue} numberOfLines={1}>{stats.latest}</ThemedText>
            </View>
          </View>
        )}
        
        {/* Error Modal */}
        <Modal visible={showErrorModal} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.alert, { backgroundColor: surface }]}>
                    <ThemedText style={styles.alertTitle}>{errorMessage.title}</ThemedText>
                    <ThemedText style={{marginBottom: 20}}>{errorMessage.message}</ThemedText>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#007AFF' }]} onPress={() => setShowErrorModal(false)}>
                        <ThemedText style={{color: '#fff'}}>OK</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* Delete Confirmation */}
        <Modal visible={showDeleteModal} transparent>
          <View style={styles.overlay}>
            <View style={[styles.alert, { backgroundColor: surface }]}>
              <ThemedText style={styles.alertTitle}>Delete {selectedIds.size} clients?</ThemedText>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: border }]} onPress={() => setShowDeleteModal(false)}><ThemedText>Cancel</ThemedText></TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: '#ff4444' }]} onPress={confirmBulkDelete}><ThemedText style={{ color: '#fff' }}>Delete</ThemedText></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Client Detail Modal */}
        <Modal visible={showDetailModal} animationType="slide" onRequestClose={() => { setShowDetailModal(false); setIsEditMode(false); }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }}>
            <View style={[styles.modalHeader, { borderBottomColor: border, backgroundColor: surface }]}>
              <TouchableOpacity onPress={() => { setShowDetailModal(false); setIsEditMode(false); }} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#007AFF" />
                <ThemedText style={{color: '#007AFF', fontWeight: 'bold'}}>Back</ThemedText>
              </TouchableOpacity>
              <ThemedText type="defaultSemiBold">{isEditMode ? 'Edit Client' : 'Client Details'}</ThemedText>
              {!isEditMode && (
                <TouchableOpacity onPress={() => setIsEditMode(true)}>
                  <Ionicons name="create-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
              )}
              {isEditMode && <View style={{width: 24}} />}
            </View>
            
            {selectedClientDetail && (
              <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.detailCard, { backgroundColor: surface, borderColor: border }]}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={24} color="#007AFF" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={[styles.detailLabel, { color: muted }]}>Full Name</ThemedText>
                      {isEditMode ? (
                        <TextInput
                          style={[styles.editInput, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Full Name"
                          placeholderTextColor={muted}
                          maxLength={40}
                        />
                      ) : (
                        <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>{selectedClientDetail.name}</ThemedText>
                      )}
                    </View>
                  </View>

                  <View style={[styles.detailDivider, { backgroundColor: border }]} />

                  <View style={styles.detailRow}>
                    <Ionicons name="card" size={24} color="#007AFF" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={[styles.detailLabel, { color: muted }]}>NDIS Number</ThemedText>
                      {isEditMode ? (
                        <TextInput
                          style={[styles.editInput, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
                          value={editNdis}
                          onChangeText={setEditNdis}
                          placeholder="NDIS Number"
                          placeholderTextColor={muted}
                          keyboardType="numeric"
                          maxLength={9}
                        />
                      ) : (
                        <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>{selectedClientDetail.ndisNum}</ThemedText>
                      )}
                    </View>
                  </View>

                  <View style={[styles.detailDivider, { backgroundColor: border }]} />

                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={24} color="#007AFF" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={[styles.detailLabel, { color: muted }]}>Address</ThemedText>
                      {isEditMode ? (
                        <TextInput
                          style={[styles.editInput, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
                          value={editAddress}
                          onChangeText={setEditAddress}
                          placeholder="Residential Address"
                          placeholderTextColor={muted}
                        />
                      ) : (
                        <ThemedText style={{ fontSize: 15, lineHeight: 22 }}>{selectedClientDetail.address || 'Not provided'}</ThemedText>
                      )}
                    </View>
                  </View>

                  <View style={[styles.detailDivider, { backgroundColor: border }]} />

                  <View style={styles.detailRow}>
                    <Ionicons name="document-text" size={24} color="#007AFF" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={[styles.detailLabel, { color: muted }]}>Notes</ThemedText>
                      {isEditMode ? (
                        <TextInput
                          style={[styles.editInput, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text, height: 60 }]}
                          value={editNotes}
                          onChangeText={setEditNotes}
                          placeholder="Notes..."
                          placeholderTextColor={muted}
                          multiline
                        />
                      ) : (
                        <ThemedText style={{ fontSize: 15, lineHeight: 22 }}>{selectedClientDetail.notes || 'No notes'}</ThemedText>
                      )}
                    </View>
                  </View>

                  <View style={[styles.detailDivider, { backgroundColor: border }]} />

                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={24} color="#007AFF" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={[styles.detailLabel, { color: muted }]}>Added On</ThemedText>
                      <ThemedText style={{ fontSize: 15 }}>
                        {new Date(selectedClientDetail.createdAt).toLocaleDateString('en-AU', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {isEditMode && (
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                    <TouchableOpacity 
                      style={[styles.btn, { flex: 1, backgroundColor: border }]} 
                      onPress={() => {
                        setEditName(selectedClientDetail.name);
                        setEditNdis(selectedClientDetail.ndisNum);
                        setEditAddress(selectedClientDetail.address || '');
                        setEditNotes(selectedClientDetail.notes || '');
                        setIsEditMode(false);
                      }}
                    >
                      <ThemedText>Cancel</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.btn, { flex: 1, backgroundColor: '#34a853' }]} 
                      onPress={saveClientEdit}
                    >
                      <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Save Changes</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>

        {/* Menu Modal */}
        <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={() => setShowMenu(false)}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              style={[styles.menu, { backgroundColor: surface, borderColor: border }]}
            >
              <TouchableOpacity style={styles.menuItem} onPress={importClients}><Ionicons name="download-outline" size={20} color="#007AFF" /><ThemedText>Import JSON</ThemedText></TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={exportClients}><Ionicons name="share-outline" size={20} color="#34a853" /><ThemedText>Export JSON</ThemedText></TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { height: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  selectionHeader: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  selectionTitle: { fontSize: 18, fontWeight: 'bold' },
  moreBtn: { backgroundColor: '#007AFF', padding: 8, borderRadius: 8 },
  addBox: { padding: 12, borderRadius: 12, borderWidth: 1 },
  input: { padding: 10, borderWidth: 1, borderRadius: 8, marginBottom: 8, fontSize: 14 },
  addBtn: { backgroundColor: '#34a853', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 10, borderWidth: 1, marginTop: 15 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, paddingVertical: 4, outlineStyle: 'none' },
  sortToggle: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 6, padding: 2 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  activeSort: { backgroundColor: '#007AFF' },
  sortText: { fontSize: 10, fontWeight: 'bold' },
  card: { flexDirection: 'row', padding: 14, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  noteLine: { fontSize: 11, fontStyle: 'italic', marginTop: 6, color: '#888' },
  statsBar: { flexDirection: 'row', padding: 15, borderRadius: 12, marginTop: 10, borderTopWidth: 1, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: '60%', marginHorizontal: 10 },
  statLabel: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: 'bold' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menu: { width: 220, padding: 8, borderRadius: 12, borderWidth: 1, position: 'absolute', top: 60, right: 20 },
  menuItem: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'center' },
  alert: { width: '85%', padding: 20, borderRadius: 20 },
  alertTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  btn: { padding: 14, borderRadius: 10, alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16 },
  detailLabel: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  detailDivider: { height: 1, marginVertical: 4 },
  editInput: { padding: 10, borderWidth: 1, borderRadius: 8, marginTop: 4, fontSize: 15, outlineStyle: 'none' }
});