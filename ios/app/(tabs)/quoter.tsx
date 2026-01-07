import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, TextInput, Alert, Modal, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const NDIS_CODES = [
  { id: '1', title: 'External Grab Rail', code: '06_181806382_0111_2_2', price: 185 },
  { id: '2', title: 'Internal Access/Door Widening', code: '06_182400121_0111_2_2', price: 1250 },
  { id: '3', title: 'Handheld Shower Install', code: '06_182400321_0111_2_2', price: 320 },
];

export default function QuoterScreen() {
  const isFocused = useIsFocused();
  const theme = useColorScheme();
  
  const { palette, surface, surfaceAlt, border, muted } = useMemo(() => {
    const p = Colors[theme ?? 'light'];
    return {
      palette: p,
      surface: theme === 'dark' ? '#1b2026' : '#fff',
      surfaceAlt: theme === 'dark' ? '#0f1216' : '#f8f9fa',
      border: theme === 'dark' ? '#2d3238' : '#eee',
      muted: theme === 'dark' ? '#aeb3b9' : '#666',
    };
  }, [theme]);

  const [estimate, setEstimate] = useState<any[]>([]);
  const [bizInfo, setBizInfo] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const totalPrice = useMemo(() => 
    estimate.reduce((sum, item) => sum + (item.price * item.qty), 0)
  , [estimate]);

  const loadData = useCallback(async () => {
    try {
      const [savedBiz, savedClients] = await Promise.all([
        AsyncStorage.getItem('@provider_settings'),
        AsyncStorage.getItem('@ndis_clients')
      ]);
      if (savedBiz) setBizInfo(JSON.parse(savedBiz));
      if (savedClients) setClients(JSON.parse(savedClients));
    } catch (e) {
      console.error("Failed to load data", e);
    }
  }, []);

  const themeColors = useMemo(() => ({
    primary: '#0066cc',
    headerText: theme === 'dark' ? '#e5e7eb' : '#1f2937',
    itemBg: theme === 'dark' ? '#2d3238' : '#f3f4f6',
  }), [theme]);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

  // Deep search logic
  const filteredClients = useMemo(() => {
    const query = clientSearch.toLowerCase();
    if (!query) return clients;
    return clients.filter(c => 
      c.name?.toLowerCase().includes(query) || 
      c.ndisNum?.includes(query) ||
      c.address?.toLowerCase().includes(query) ||
      c.notes?.toLowerCase().includes(query)
    );
  }, [clients, clientSearch]);

  const addItem = (codeItem: any) => {
    setEstimate(prev => {
      const existing = prev.find(i => i.id === codeItem.id);
      if (existing) {
        return prev.map(i => i.id === codeItem.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...codeItem, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setEstimate(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const generatePDF = async () => {
    const quoteNo = `QT-${Date.now().toString().slice(-8)}`;
    const quoteDate = new Date().toLocaleDateString('en-AU');
    const html = `
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica'; padding: 30px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background: #f3f4f6; text-align: left; padding: 10px; font-size: 10px; }
            .items-table td { padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; }
            .total-row { background: #f0f4ff; padding: 15px; border: 1px solid #0066cc; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              ${bizInfo?.logoBase64 ? `<img class="logo" src="data:image/png;base64,${bizInfo.logoBase64}" />` : ''}
              <div><h1>${bizInfo?.bizName || 'Service Provider'}</h1><p>ABN: ${bizInfo?.abn || 'N/A'}</p></div>
            </div>
            <div style="text-align: right"><h2>QUOTE</h2><p>No: ${quoteNo}</p></div>
          </div>
          <div>
            <strong>Participant:</strong> ${selectedClient?.name}<br/>
            NDIS: ${selectedClient?.ndisNum}<br/>
            ${selectedClient?.address || ''}
          </div>
          <table class="items-table">
            <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              ${estimate.map(item => `
                <tr>
                  <td>${item.title}<br/><small>${item.code}</small></td>
                  <td>${item.qty}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-row"><strong>TOTAL: $${totalPrice.toFixed(2)}</strong></div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri);
    } catch (e) { Alert.alert("Error", "Failed to generate PDF"); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}> 
        <View style={styles.header}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <ThemedText type="subtitle">NDIS Quoter</ThemedText>
            <TouchableOpacity onPress={() => { setEstimate([]); setSelectedClient(null); }}>
              <ThemedText style={{color: '#ff4444', fontSize: 12}}>Reset All</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Participant Selector - Full Details Restored */}
        <View style={styles.pickerSection}>
          <ThemedText style={styles.label}>Participant</ThemedText>
          {selectedClient ? (
            <View style={[styles.selectedCard, { backgroundColor: surface, borderColor: border }]}>
              <View style={{flex: 1}}>
                <ThemedText type="defaultSemiBold" style={{fontSize: 16}}>{selectedClient.name}</ThemedText>
                <ThemedText style={{fontSize: 12, color: '#007AFF', fontWeight: 'bold'}}>NDIS: {selectedClient.ndisNum}</ThemedText>
                {selectedClient.address && (
                  <ThemedText style={{fontSize: 11, color: muted, marginTop: 4}}><Ionicons name="location-outline" size={12}/> {selectedClient.address}</ThemedText>
                )}
                {selectedClient.notes && (
                  <View style={{marginTop: 6, padding: 6, backgroundColor: surfaceAlt, borderRadius: 4}}>
                    <ThemedText style={{fontSize: 10, color: muted}}><Ionicons name="document-text-outline" size={10}/> {selectedClient.notes}</ThemedText>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedClient(null)}><Ionicons name="close-circle" size={28} color="#ff4444" /></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.selectBtn, { backgroundColor: surface, borderColor: border }]} onPress={() => setShowClientPicker(true)}>
              <Ionicons name="person-outline" size={18} color="#007AFF" />
              <ThemedText style={{color: '#007AFF'}}>Select Client</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* RESTORED ESTIMATE SECTION WITH LINE TOTALS */}
        {estimate.length > 0 && (
          <View style={{ maxHeight: 180, marginBottom: 15 }}>
            <ThemedText style={styles.label}>Items to Quote</ThemedText>
            <ScrollView style={[styles.cartBox, { backgroundColor: surface, borderColor: border }]}>
              {estimate.map(item => (
                <View key={item.id} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontSize: 13 }} numberOfLines={1}>{item.title}</ThemedText>
                    {/* Display subtotal for this line item */}
                    <ThemedText style={{ fontSize: 11, color: '#007AFF', fontWeight: 'bold' }}>
                      ${(item.price * item.qty).toFixed(2)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.qtyControls}>
                    <TouchableOpacity onPress={() => updateQty(item.id, -1)}>
                      <Ionicons name="remove-circle-outline" size={24} color={muted} />
                    </TouchableOpacity>
                    
                    <ThemedText style={{ width: 30, textAlign: 'center', fontWeight: 'bold', color: palette.text }}>
                      {item.qty}
                    </ThemedText>
                    
                    <TouchableOpacity onPress={() => updateQty(item.id, 1)}>
                      <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Restore Catalog Section */}
        <ThemedText style={styles.label}>Catalog</ThemedText>
        <ScrollView style={{flex: 1}}>
          {NDIS_CODES.map(item => (
            <TouchableOpacity key={item.id} style={[styles.itemRow, { backgroundColor: surface, borderColor: border }]} onPress={() => addItem(item)}>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold" style={{fontSize: 14, color: palette.text}}>{item.title}</ThemedText>
                <ThemedText style={{fontSize: 10, color: muted}}>{item.code}</ThemedText>
              </View>
              <ThemedText type="defaultSemiBold" style={{color: palette.text}}>${item.price}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: border }]}>
          <View style={styles.totalRow}>
            <ThemedText>Total (Inc. GST)</ThemedText>
            <ThemedText type="title" style={{color: '#007AFF'}}>${totalPrice.toFixed(2)}</ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: (bizInfo && selectedClient && estimate.length > 0) ? '#007AFF' : '#ccc' }]} 
            onPress={() => setShowPreview(true)}
            disabled={!bizInfo || !selectedClient || estimate.length === 0}
          >
            <ThemedText style={{color: '#fff', fontWeight: 'bold'}}>Review & Export</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Client Picker Modal - Search & Full Details Restored */}
        <Modal visible={showClientPicker} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }}>
            <View style={[styles.modalHeader, { borderBottomColor: border, backgroundColor: surface }]}>
              <TouchableOpacity onPress={() => { setShowClientPicker(false); setClientSearch(''); }} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#007AFF" />
                <ThemedText style={{color: '#007AFF', fontWeight: 'bold'}}>Back</ThemedText>
              </TouchableOpacity>
              <ThemedText type="defaultSemiBold">Select Client</ThemedText>
              <View style={{width: 60}} />
            </View>

            <View style={{ padding: 15, backgroundColor: surface }}>
              <View style={[styles.searchContainer, { backgroundColor: surfaceAlt, borderColor: border }]}>
                <Ionicons name="search" size={20} color={muted} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Search name, address, or notes..."
                  placeholderTextColor={muted}
                  style={{ flex: 1, color: palette.text, height: 45 }}
                  value={clientSearch}
                  onChangeText={setClientSearch}
                />
                {clientSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setClientSearch('')}>
                    <Ionicons name="close-circle" size={22} color={muted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <FlatList 
              data={filteredClients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalItem, { backgroundColor: surface, borderColor: border }]} 
                  onPress={() => { setSelectedClient(item); setShowClientPicker(false); setClientSearch(''); }}>
                  <ThemedText type="defaultSemiBold" style={{fontSize: 16}}>{item.name}</ThemedText>
                  <ThemedText style={{fontSize: 12, color: '#007AFF'}}>NDIS: {item.ndisNum}</ThemedText>
                  {item.address && <ThemedText style={{fontSize: 11, color: muted}} numberOfLines={1}>{item.address}</ThemedText>}
                  {item.notes && <ThemedText style={{fontSize: 10, color: muted, fontStyle: 'italic'}} numberOfLines={1}>{item.notes}</ThemedText>}
                </TouchableOpacity>
              )}
              contentContainerStyle={{padding: 20}}
            />
          </SafeAreaView>
        </Modal>

        {/* Preview Modal Restored */}
        <Modal visible={showPreview} animationType="slide">
          <SafeAreaView style={{flex: 1, backgroundColor: surfaceAlt}}>
            <View style={[styles.modalHeader, { borderBottomColor: border, backgroundColor: surface }]}>
              <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#007AFF" />
                <ThemedText style={{color: '#007AFF', fontWeight: 'bold'}}>Back</ThemedText>
              </TouchableOpacity>
              <ThemedText type="defaultSemiBold">Review Quote</ThemedText>
              <TouchableOpacity onPress={generatePDF}><Ionicons name="share-outline" size={24} color="#007AFF"/></TouchableOpacity>
            </View>
            <ScrollView style={{padding: 20}}>
              <ThemedView style={{padding: 20, borderRadius: 12, backgroundColor: surface}}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
                  {bizInfo?.logoBase64 && (
                    <Image source={{ uri: `data:image/png;base64,${bizInfo.logoBase64}` }} style={{ height: 48, width: 120, resizeMode: 'contain', marginRight: 12 }} />
                  )}
                  <View style={{flex: 1}}>
                    <ThemedText type="title" style={{color: '#007AFF'}}>{bizInfo?.bizName || 'Service Provider'}</ThemedText>
                    <ThemedText style={{fontSize: 12, color: muted}}>ABN: {bizInfo?.abn || 'N/A'}</ThemedText>
                  </View>
                </View>
                <View style={{height: 1, backgroundColor: border, marginBottom: 16}} />
                <ThemedText type="defaultSemiBold">Total Quote: ${totalPrice.toFixed(2)}</ThemedText>
                <ThemedText style={{marginTop: 10}}>Items: {estimate.length}</ThemedText>
                <ThemedText style={{color: muted, marginTop: 5}}>For: {selectedClient?.name}</ThemedText>
              </ThemedView>
            </ScrollView>
          </SafeAreaView>
        </Modal>

      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { marginBottom: 15 },
  label: { fontSize: 9, color: '#888', textTransform: 'uppercase', marginBottom: 5, fontWeight: 'bold' },
  pickerSection: { marginBottom: 15 },
  selectBtn: { padding: 12, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  selectedCard: { padding: 15, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cartBox: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 10 },
  cartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemRow: { flexDirection: 'row', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 8, alignItems: 'center', justifyContent: 'space-between' },
  footer: { borderTopWidth: 1, paddingTop: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  btn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalItem: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 }
});