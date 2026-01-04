import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ClaimsScreen() {
  const claims = [
    { id: '1', client: 'J. Smith', amount: 12450.00, status: 'Paid', date: '28 Dec' },
    { id: '2', client: 'A. Wong', amount: 3200.00, status: 'Pending', date: '02 Jan' },
    { id: '3', client: 'M. Taylor', amount: 850.00, status: 'Action Required', date: '30 Dec' },
  ];

  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1b2026' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#0f1216' : '#f8f9fa';
  const border = colorScheme === 'dark' ? '#2d3238' : '#e5e5e5';
  const muted = colorScheme === 'dark' ? '#aeb3b9' : '#555';
  const summaryTint1 = colorScheme === 'dark' ? 'rgba(0,122,255,0.12)' : '#e3f2fd';
  const summaryTint2 = colorScheme === 'dark' ? 'rgba(46,204,113,0.12)' : '#e8f5e9';
  const [selectedClaim, setSelectedClaim] = useState<typeof claims[0] | null>(null);
  const [showModal, setShowModal] = useState(false);

  const openClaim = (claim: typeof claims[0]) => {
    setSelectedClaim(claim);
    setShowModal(true);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
      {/* 1. Cash Flow Overview */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: summaryTint1, borderColor: border }] }>
          <ThemedText style={[styles.summaryLabel, { color: muted }]}>Owed (Pending)</ThemedText>
          <ThemedText style={[styles.summaryAmount, { color: palette.text }]}>$4,050</ThemedText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: summaryTint2, borderColor: border }] }>
          <ThemedText style={[styles.summaryLabel, { color: muted }]}>Paid (Last 30d)</ThemedText>
          <ThemedText style={[styles.summaryAmount, { color: palette.text }]}>$12,450</ThemedText>
        </View>
      </View>

      <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: palette.text }]}>Recent Claims</ThemedText>
      
      <ScrollView>
        {claims.map((claim) => (
          <TouchableOpacity key={claim.id} style={[styles.claimRow, { backgroundColor: surface, borderColor: border }]} onPress={() => openClaim(claim)}> 
            <View style={styles.claimInfo}>
              <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>{claim.client}</ThemedText>
              <ThemedText style={[styles.dateText, { color: muted }]}>{claim.date}</ThemedText>
            </View>
            
            <View style={styles.amountInfo}>
              <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>${claim.amount.toLocaleString()}</ThemedText>
              <StatusBadge status={claim.status} />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 2. Proactive Alert for "Action Required" */}
      <View style={[styles.warningBox, { backgroundColor: colorScheme === 'dark' ? '#3a2022' : '#f8d7da', borderColor: colorScheme === 'dark' ? '#5a2f32' : '#f5c6cb' }]}> 
        <Ionicons name="alert-circle" size={22} color={colorScheme === 'dark' ? '#f7c6c8' : '#721c24'} />
        <ThemedText style={[styles.warningText, { color: colorScheme === 'dark' ? '#fbe9ea' : '#721c24' }]}>
          The Taylor claim was rejected: **Missing OT Sign-off**. 
        </ThemedText>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: surface, borderColor: border }]}> 
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={{ color: palette.text }}>Claim Details</ThemedText>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={muted} />
              </TouchableOpacity>
            </View>

            <DetailRow label="Client" value={selectedClaim?.client ?? '-'} muted={muted} textColor={palette.text} />
            <DetailRow label="Amount" value={selectedClaim ? `$${selectedClaim.amount.toLocaleString()}` : '-'} muted={muted} textColor={palette.text} />
            <DetailRow label="Status" value={selectedClaim?.status ?? '-'} muted={muted} textColor={palette.text} />
            <DetailRow label="Date" value={selectedClaim?.date ?? '-'} muted={muted} textColor={palette.text} />
            <View style={[styles.divider, { backgroundColor: border }]} />
            <DetailRow label="Next Step" value="Review missing OT sign-off and re-submit" muted={muted} textColor={palette.text} />
            <DetailRow label="Notes" value="Attach timecard and supervisor approval." muted={muted} textColor={palette.text} />

            <TouchableOpacity style={[styles.closeButton, { backgroundColor: palette.tint }]} onPress={() => setShowModal(false)}>
              <ThemedText type="defaultSemiBold" style={{ color: '#000000ff', textAlign: 'center' }}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    'Paid': { bg: '#d4edda', text: '#155724', bgDark: '#1a3323', textDark: '#b1e6c3' },
    'Pending': { bg: '#fff3cd', text: '#856404', bgDark: '#332a12', textDark: '#f2d891' },
    'Action Required': { bg: '#f8d7da', text: '#721c24', bgDark: '#3a2022', textDark: '#f7c6c8' },
  };
  const theme = colors[status] || colors['Pending'];
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? theme.bgDark : theme.bg;
  const text = isDark ? theme.textDark : theme.text;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <ThemedText style={[styles.badgeText, { color: text }]}>{status}</ThemedText>
    </View>
  );
}

function DetailRow({ label, value, muted, textColor }: { label: string; value: string; muted: string; textColor: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={{ color: muted }}>{label}</ThemedText>
      <ThemedText style={{ color: textColor, textAlign: 'right', flex: 1, marginLeft: 12 }}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, marginTop: 10 },
  summaryCard: { width: '48%', padding: 15, borderRadius: 12, borderWidth: 1 },
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
    elevation: 2,
    borderWidth: 1
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
  warningText: { color: '#721c24', fontSize: 13, marginLeft: 10, flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderWidth: 1
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 10
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10
  }
});