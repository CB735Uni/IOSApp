import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

export default function ClientManager() {
  const [clients, setClients] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    const data = await AsyncStorage.getItem('@ndis_clients');
    if (data) setClients(JSON.parse(data));
  };

  const addClient = async () => {
    if (!newName || !newId) return Alert.alert("Error", "Name and NDIS Number required");
    const updated = [...clients, { id: Date.now().toString(), name: newName, ndisNum: newId }];
    await AsyncStorage.setItem('@ndis_clients', JSON.stringify(updated));
    setClients(updated);
    setNewName(''); setNewId('');
  };

  const deleteClient = async (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    await AsyncStorage.setItem('@ndis_clients', JSON.stringify(updated));
    setClients(updated);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Client Manager</ThemedText>
      
      {/* Add New Client Form */}
      <View style={styles.addBox}>
        <TextInput style={styles.input} placeholder="Full Name" value={newName} onChangeText={setNewName} />
        <TextInput style={styles.input} placeholder="NDIS Number" value={newId} onChangeText={setNewId} keyboardType="numeric" />
        <TouchableOpacity style={styles.addBtn} onPress={addClient}>
          <ThemedText style={{color: '#fff', fontWeight: 'bold'}}>+ Add Client</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={{marginTop: 20}}>
        {clients.map(client => (
          <View key={client.id} style={styles.clientCard}>
            <View>
              <ThemedText type="defaultSemiBold">{client.name}</ThemedText>
              <ThemedText style={styles.idText}>NDIS: {client.ndisNum}</ThemedText>
            </View>
            <TouchableOpacity onPress={() => deleteClient(client.id)}>
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  addBox: { backgroundColor: '#fff', padding: 15, borderRadius: 12, elevation: 3 },
  input: { borderBottomWidth: 1, borderColor: '#eee', padding: 10, marginBottom: 10 },
  addBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  clientCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  idText: { fontSize: 12, color: '#666' }
});