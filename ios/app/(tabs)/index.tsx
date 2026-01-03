import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

export default function NDISDashboard() {
  const [projectTitle] = useState("Smith Residence - Bathroom Mod");

  // Web-friendly mock data
  const [tasks, setTasks] = useState([
    { id: 1, label: "Upload OT Assessment (PDF)", done: true, code: "06_182499311" },
    { id: 2, label: "Initial Site Measurements", done: false, code: "06_182400321" },
    { id: 3, label: "Before Photos (Mandatory for Audit)", done: false, code: "Photo-Only" },
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header with 'Web vs Mobile' check */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">ModiProof Dashboard</ThemedText>
        <ThemedText type="subtitle">
          {projectTitle} {Platform.OS === 'web' ? '(Web Preview)' : ''}
        </ThemedText>
      </ThemedView>

      {/* 2. The 'Audit-Ready' Alert */}
      <View style={styles.alertBox}>
        <Ionicons name="shield-checkmark" size={24} color="#155724" />
        <ThemedText style={styles.alertText}>
          System Status: Compliance records are 60% complete.
        </ThemedText>
      </View>

      {/* 3. Action Grid (Interactive Buttons) */}
      <View style={styles.grid}>
        <ActionButton 
          icon="camera" 
          title="Field Photos" 
          onPress={() => alert('Camera requested. (On web, this will open file upload)')} 
        />
        <ActionButton 
          icon="document-text" 
          title="NDIS Quote" 
          onPress={() => alert('Opening Item Code Calculator...')} 
        />
        <ActionButton 
          icon="shield" 
          title="Audit Trail" 
          onPress={() => alert('Viewing historical logs...')} 
        />
        <ActionButton 
          icon="send" 
          title="Submit Claim" 
          onPress={() => alert('Reviewing documentation for errors...')} 
        />
      </View>

      {/* 4. Active Workflow (Vertical List) */}
      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold" style={{ marginBottom: 10 }}>Active Checklist</ThemedText>
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <Ionicons 
              name={task.done ? "checkbox" : "square-outline"} 
              size={24} 
              color={task.done ? "#28a745" : "#ccc"} 
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <ThemedText>{task.label}</ThemedText>
              <ThemedText style={styles.codeText}>Code: {task.code}</ThemedText>
            </View>
          </View>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

// Reusable Button Component
function ActionButton({ icon, title, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Ionicons name={icon} size={32} color="#007AFF" />
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { padding: 20, maxWidth: 600, alignSelf: 'center', width: '100%' },
  header: { marginTop: 20, marginBottom: 20, backgroundColor: 'transparent' },
  alertBox: { 
    flexDirection: 'row', 
    backgroundColor: '#d4edda', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c3e6cb'
  },
  alertText: { color: '#155724', marginLeft: 10, fontWeight: '500' },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  card: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: { marginTop: 8, fontWeight: '600', fontSize: 13 },
  section: { 
    padding: 20, 
    borderRadius: 15, 
    backgroundColor: '#fff',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  codeText: { fontSize: 12, color: '#888', marginTop: 2 }
});