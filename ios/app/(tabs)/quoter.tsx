import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, TextInput, Alert, Modal, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

const NDIS_CODES = [
  { id: '1', title: 'External Grab Rail', code: '06_181806382_0111_2_2', price: 185 },
  { id: '2', title: 'Internal Access/Door Widening', code: '06_182400121_0111_2_2', price: 1250 },
  { id: '3', title: 'Handheld Shower Install', code: '06_182400321_0111_2_2', price: 320 },
];

export default function QuoterScreen() {
  const [estimate, setEstimate] = useState<any[]>([]);
  const [bizInfo, setBizInfo] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const isFocused = useIsFocused();
  const totalPrice = estimate.reduce((s, i) => s + i.price, 0);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const savedBiz = await AsyncStorage.getItem('@provider_settings');
    const savedClients = await AsyncStorage.getItem('@ndis_clients');
    if (savedBiz) setBizInfo(JSON.parse(savedBiz));
    if (savedClients) setClients(JSON.parse(savedClients));
  };

  const saveToAuditLog = async () => {
    try {
      const logEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('en-AU'),
        clientName: selectedClient?.name || 'Unknown Client',
        total: totalPrice,
        itemCount: estimate.length,
        builder: bizInfo?.bizName || 'Unknown Builder'
      };

      const existingLogsRaw = await AsyncStorage.getItem('@audit_logs');
      const existingLogs = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
      
      const updatedLogs = [logEntry, ...existingLogs];
      await AsyncStorage.setItem('@audit_logs', JSON.stringify(updatedLogs));
    } catch (e) {
      console.error("Failed to save audit log", e);
    }
  };

  // --- NEW SHARE LOGIC ---
  const handleShare = async () => {
    const shareDetails = {
      title: `NDIS Quote - ${selectedClient?.name}`,
      text: `Hi ${selectedClient?.name}, here is your NDIS Home Mod quote from ${bizInfo?.bizName}.\n\nTotal: $${totalPrice}\nNDIS No: ${selectedClient?.ndisNum}\n\nGenerated via ModiProof.`,
    };

    if (Platform.OS === 'web' && navigator.share) {
      try {
        await navigator.share(shareDetails);
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback for desktop browsers or simulated mobile
      Alert.alert("Quote Summary Copied", shareDetails.text);
    }
  };

  const handleGeneratePress = () => {
    saveToAuditLog();
    setShowPreview(true);
  };

  const clearEstimate = () => {
    setEstimate([]);
    setSelectedClient(null);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <ThemedText type="subtitle">NDIS Quoter</ThemedText>
          <TouchableOpacity onPress={clearEstimate}>
            <ThemedText style={{color: '#ff4444', fontSize: 12}}>Reset</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.bizSub}>
          {bizInfo ? `Issuing as: ${bizInfo.bizName}` : "⚠️ Profile incomplete in Settings"}
        </ThemedText>
      </View>

      <View style={styles.pickerSection}>
        <ThemedText style={styles.label}>Select Participant:</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {clients.length === 0 && <ThemedText style={{fontSize: 12, color: '#999'}}>No clients found. Add them in the Clients tab.</ThemedText>}
          {clients.map(c => (
            <TouchableOpacity 
              key={c.id} 
              style={[styles.clientChip, selectedClient?.id === c.id && styles.activeChip]}
              onPress={() => setSelectedClient(c)}
            >
              <ThemedText style={[styles.chipText, selectedClient?.id === c.id && {color: '#fff'}]}>{c.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ThemedText style={styles.label}>Add Mod Items:</ThemedText>
      <ScrollView style={styles.list}>
        {NDIS_CODES.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.itemRow} 
            onPress={() => setEstimate([...estimate, item])}
          >
            <View>
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
              <ThemedText style={styles.codeText}>{item.code}</ThemedText>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <ThemedText type="defaultSemiBold">${item.price}</ThemedText>
              <Ionicons name="add-circle" size={18} color="#007AFF" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <ThemedText>Total (Inc. GST)</ThemedText>
          <ThemedText type="title" style={{color: '#007AFF'}}>${totalPrice}</ThemedText>
        </View>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: (bizInfo && selectedClient && estimate.length > 0) ? '#007AFF' : '#ccc' }]} 
          onPress={handleGeneratePress}
          disabled={!bizInfo || !selectedClient || estimate.length === 0}
        >
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
          <ThemedText style={styles.btnText}>Review & Log Quote</ThemedText>
        </TouchableOpacity>
      </View>

      <Modal visible={showPreview} animationType="slide">
        <ThemedView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
               <ThemedText style={{color: '#007AFF'}}>Back</ThemedText>
            </TouchableOpacity>
            
            <ThemedText type="defaultSemiBold">Compliance Preview</ThemedText>
            
            <View style={{flexDirection: 'row', gap: 20}}>
              {/* --- ADDED SHARE ICON --- */}
              <TouchableOpacity onPress={handleShare}>
                 <Ionicons name="share-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => Platform.OS === 'web' ? window.print() : Alert.alert("Print", "Connect to AirPrint device")}>
                 <Ionicons name="print" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.previewPaper}>
            <View style={styles.paperHeader}>
               <ThemedText type="title" style={{fontSize: 22}}>{bizInfo?.bizName}</ThemedText>
               <ThemedText>ABN: {bizInfo?.abn}</ThemedText>
               <ThemedText>Provider ID: {bizInfo?.providerNum}</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.paperSection}>
               <ThemedText style={styles.label}>To Participant:</ThemedText>
               <ThemedText type="defaultSemiBold" style={{fontSize: 18}}>{selectedClient?.name}</ThemedText>
               <ThemedText>NDIS No: {selectedClient?.ndisNum}</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.paperSection}>
               <ThemedText style={[styles.label, {marginBottom: 10}]}>Scope of Works</ThemedText>
               {estimate.map((item, index) => (
                 <View key={index} style={styles.previewItemRow}>
                   <View style={{flex: 1}}>
                     <ThemedText>{item.title}</ThemedText>
                     <ThemedText style={{fontSize: 10, color: '#666'}}>{item.code}</ThemedText>
                   </View>
                   <ThemedText type="defaultSemiBold">${item.price}</ThemedText>
                 </View>
               ))}
            </View>
            <View style={styles.paperTotal}>
               <ThemedText type="subtitle">Grand Total</ThemedText>
               <ThemedText type="subtitle" style={{color: '#007AFF'}}>${totalPrice}</ThemedText>
            </View>
            <View style={styles.complianceNote}>
               <Ionicons name="checkmark-seal" size={16} color="#34a853" />
               <ThemedText style={styles.footerNote}>
                 This document is an official NDIS Audit Trail record.
               </ThemedText>
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 15, marginTop: 10 },
  bizSub: { fontSize: 12, color: '#007AFF', fontWeight: 'bold', marginTop: 5 },
  label: { fontSize: 11, color: '#666', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  pickerSection: { marginBottom: 20 },
  chipScroll: { flexDirection: 'row' },
  clientChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee', marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
  activeChip: { backgroundColor: '#007AFF', borderColor: '#0056b3' },
  chipText: { fontSize: 13 },
  list: { flex: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, alignItems: 'center', shadowOpacity: 0.05, elevation: 1 },
  codeText: { fontSize: 10, color: '#888', marginTop: 4, fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier' },
  footer: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  btn: { padding: 18, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  previewContainer: { flex: 1, backgroundColor: '#f0f0f0' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  previewPaper: { padding: 30, backgroundColor: '#fff', margin: 15, borderRadius: 8, shadowOpacity: 0.1, minHeight: '80%' },
  paperHeader: { marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  paperSection: { marginBottom: 10 },
  previewItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  paperTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, paddingTop: 15, borderTopWidth: 2, borderTopColor: '#eee' },
  complianceNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40 },
  footerNote: { fontSize: 10, color: '#34a853', fontWeight: '600' }
});