import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

export default function ClaimsScreen() {
  const claims = [
    { id: '1', client: 'J. Smith', amount: 12450.00, status: 'Paid', date: '28 Dec' },
    { id: '2', client: 'A. Wong', amount: 3200.00, status: 'Pending', date: '02 Jan' },
    { id: '3', client: 'M. Taylor', amount: 850.00, status: 'Action Required', date: '30 Dec' },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* 1. Cash Flow Overview */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
          <ThemedText style={styles.summaryLabel}>Owed (Pending)</ThemedText>
          <ThemedText style={styles.summaryAmount}>$4,050</ThemedText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
          <ThemedText style={styles.summaryLabel}>Paid (Last 30d)</ThemedText>
          <ThemedText style={styles.summaryAmount}>$12,450</ThemedText>
        </View>
      </View>

      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Recent Claims</ThemedText>
      
      <ScrollView>
        {claims.map((claim) => (
          <TouchableOpacity key={claim.id} style={styles.claimRow}>
            <View style={styles.claimInfo}>
              <ThemedText type="defaultSemiBold">{claim.client}</ThemedText>
              <ThemedText style={styles.dateText}>{claim.date}</ThemedText>
            </View>
            
            <View style={styles.amountInfo}>
              <ThemedText type="defaultSemiBold">${claim.amount.toLocaleString()}</ThemedText>
              <StatusBadge status={claim.status} />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 2. Proactive Alert for "Action Required" */}
      <View style={styles.warningBox}>
        <Ionicons name="alert-circle" size={22} color="#721c24" />
        <ThemedText style={styles.warningText}>
          The Taylor claim was rejected: **Missing OT Sign-off**. 
        </ThemedText>
      </View>
    </ThemedView>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    'Paid': { bg: '#d4edda', text: '#155724' },
    'Pending': { bg: '#fff3cd', text: '#856404' },
    'Action Required': { bg: '#f8d7da', text: '#721c24' },
  };
  const theme = colors[status] || colors['Pending'];

  return (
    <View style={[styles.badge, { backgroundColor: theme.bg }]}>
      <ThemedText style={[styles.badgeText, { color: theme.text }]}>{status}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, marginTop: 10 },
  summaryCard: { width: '48%', padding: 15, borderRadius: 12 },
  summaryLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase' },
  summaryAmount: { fontSize: 22, fontWeight: 'bold', color: '#000', marginTop: 5 },
  sectionTitle: { marginBottom: 15 },
  claimRow: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 12, 
    alignItems: 'center',
    shadowOpacity: 0.05,
    elevation: 2
  },
  claimInfo: { flex: 1 },
  amountInfo: { alignItems: 'flex-end', marginRight: 10 },
  dateText: { fontSize: 12, color: '#999', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 5 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  warningBox: { 
    flexDirection: 'row', 
    backgroundColor: '#f8d7da', 
    padding: 15, 
    borderRadius: 12, 
    marginTop: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f5c6cb'
  },
  warningText: { color: '#721c24', fontSize: 13, marginLeft: 10, flex: 1 }
});