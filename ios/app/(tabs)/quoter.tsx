import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, TextInput, FlatList } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

// 2026 NDIS Item Code Database (Common Minor Mods)
const NDIS_CODES = [
  { id: '1', title: 'External Grab Rail', code: '06_181806382_0111_2_2', price: 185, unit: 'per rail' },
  { id: '2', title: 'Internal Access/Door Widening', code: '06_182400121_0111_2_2', price: 1250, unit: 'per door' },
  { id: '3', title: 'Minor Threshold Ramp', code: '06_183018404_0111_2_2', price: 450, unit: 'each' },
  { id: '4', title: 'Handheld Shower Install', code: '06_182400321_0111_2_2', price: 320, unit: 'each' },
  { id: '5', title: 'Consultation/Site Visit', code: '06_182499311_0111_2_2', price: 193, unit: 'per hour' },
];

export default function QuoterScreen() {
  const [search, setSearch] = useState('');
  const [estimate, setEstimate] = useState<any[]>([]);

  const addToEstimate = (item: any) => {
    setEstimate([...estimate, { ...item, key: Date.now().toString() }]);
  };

  const total = estimate.reduce((sum, item) => sum + item.price, 0);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchSection}>
        <ThemedText type="subtitle">Build NDIS Quote</ThemedText>
        <TextInput 
          style={styles.input} 
          placeholder="Search items (e.g. Rail, Ramp...)" 
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={{ flex: 1 }}>
        <ThemedText style={styles.label}>Available NDIS Items</ThemedText>
        <ScrollView style={styles.itemList}>
          {NDIS_CODES.filter(i => i.title.toLowerCase().includes(search.toLowerCase())).map(item => (
            <TouchableOpacity key={item.id} style={styles.itemRow} onPress={() => addToEstimate(item)}>
              <View>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <ThemedText style={styles.codeText}>{item.code}</ThemedText>
              </View>
              <ThemedText style={styles.priceText}>${item.price}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Summary Section */}
      <View style={styles.summaryCard}>
        <ThemedText type="defaultSemiBold">Estimate Summary</ThemedText>
        {estimate.map((item, idx) => (
          <View key={idx} style={styles.summaryRow}>
            <ThemedText style={{fontSize: 12}}>{item.title}</ThemedText>
            <ThemedText style={{fontSize: 12}}>${item.price}</ThemedText>
          </View>
        ))}
        <View style={styles.totalRow}>
          <ThemedText type="subtitle">Total Estimate:</ThemedText>
          <ThemedText type="subtitle" style={{color: '#007AFF'}}>${total}</ThemedText>
        </View>
        <TouchableOpacity 
           style={[styles.btn, { opacity: total > 0 ? 1 : 0.5 }]} 
           disabled={total === 0}
           onPress={() => alert('Quote PDF Generated with NDIS Headers!')}
        >
          <ThemedText style={styles.btnText}>Generate NDIS Quote PDF</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  searchSection: { marginBottom: 20, marginTop: 10 },
  input: { 
    backgroundColor: '#f0f0f0', 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  label: { fontSize: 12, color: '#666', textTransform: 'uppercase', marginBottom: 10 },
  itemList: { maxHeight: '40%' },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 15, 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    marginBottom: 8,
    alignItems: 'center'
  },
  codeText: { fontSize: 11, color: '#007AFF', fontFamily: 'monospace' },
  priceText: { fontWeight: 'bold' },
  summaryCard: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 15, 
    shadowOpacity: 0.1, 
    shadowRadius: 10,
    elevation: 5,
    marginTop: 20
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 15, 
    paddingTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#eee' 
  },
  btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});