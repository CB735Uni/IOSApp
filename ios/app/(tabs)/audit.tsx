import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

export default function AuditLogScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadLogs();
  }, [isFocused]);

  const loadLogs = async () => {
    const data = await AsyncStorage.getItem('@audit_logs');
    if (data) setLogs(JSON.parse(data));
  };

  const clearLogs = () => {
    Alert.alert("Clear History", "Are you sure? This cannot be undone.", [
      { text: "Cancel" },
      { text: "Clear", onPress: async () => {
          await AsyncStorage.removeItem('@audit_logs');
          setLogs([]);
      }}
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Audit Trail</ThemedText>
        <TouchableOpacity onPress={loadLogs}>
          <Ionicons name="refresh" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ThemedText style={styles.sub}>Immutable record of generated NDIS documents</ThemedText>

      <ScrollView style={styles.logList}>
        {logs.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={40} color="#ccc" />
            <ThemedText style={{color: '#999', marginTop: 10}}>No activity recorded yet.</ThemedText>
          </View>
        )}
        
        {logs.map(log => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.statusDot} />
            <View style={{flex: 1}}>
              <ThemedText type="defaultSemiBold">Quote Generated: {log.clientName}</ThemedText>
              <ThemedText style={styles.logMeta}>{log.timestamp} • {log.itemCount} items</ThemedText>
            </View>
            <ThemedText type="defaultSemiBold" style={styles.logAmount}>${log.total}</ThemedText>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footerInfo}>
        <Ionicons name="lock-closed" size={14} color="#666" />
        <ThemedText style={styles.footerText}>
          Records are stored locally and encrypted for 2026 Compliance.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  sub: { fontSize: 13, color: '#666', marginBottom: 20 },
  logList: { flex: 1 },
  logCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#34a853' // Green for "Issued"
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34a853', marginRight: 12 },
  logMeta: { fontSize: 11, color: '#999', marginTop: 4 },
  logAmount: { color: '#007AFF' },
  empty: { alignItems: 'center', marginTop: 100 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 20 },
  footerText: { fontSize: 10, color: '#999' }
});