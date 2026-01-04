import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function AuditVaultScreen() {
  const [files, setFiles] = useState([
    { id: '1', title: 'OT Assessment.pdf', type: 'doc', date: '01/01/26' },
    { id: '2', title: 'Existing Bathroom (Before).jpg', type: 'img', date: '02/01/26', uri: 'https://via.placeholder.com/150' },
  ]);
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1b2026' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#0f1216' : '#f8f9fa';
  const border = colorScheme === 'dark' ? '#2d3238' : '#eaeaea';
  const muted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  const addFile = () => {
    // In a real app, this would use Expo ImagePicker or DocumentPicker
    alert("On web: This opens your Windows File Explorer.\nOn Mobile: This opens the Camera.");
    const newFile = { id: Date.now().toString(), title: 'New_Evidence.jpg', type: 'img', date: 'Today', uri: 'https://via.placeholder.com/150' };
    setFiles([newFile, ...files]);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={{ color: palette.text }}>Audit Vault</ThemedText>
        <ThemedText style={[styles.sub, { color: muted }]}>Job: Smith Residence #4492</ThemedText>
      </View>

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadBtn} onPress={addFile}>
        <Ionicons name="cloud-upload" size={24} color="#fff" />
        <ThemedText style={styles.uploadText}>Add Evidence (Photo/Doc)</ThemedText>
      </TouchableOpacity>

      <ScrollView style={styles.fileList}>
        <ThemedText style={[styles.label, { color: muted }]}>Mandatory Evidence for PACE Claims:</ThemedText>
        
        {files.map((file) => (
          <View key={file.id} style={[styles.fileCard, { backgroundColor: surface, borderColor: border }]}> 
            <Ionicons 
              name={file.type === 'doc' ? "document-text" : "image"} 
              size={32} 
              color="#007AFF" 
            />
            <View style={styles.fileInfo}>
              <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>{file.title}</ThemedText>
              <ThemedText style={[styles.dateText, { color: muted }]}>Uploaded: {file.date}</ThemedText>
            </View>
            <TouchableOpacity>
               <Ionicons name="eye-outline" size={24} color={colorScheme === 'dark' ? '#c8ccd2' : '#666'} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* PACE Compliance Guard */}
      <View style={[styles.guardBox, { backgroundColor: colorScheme === 'dark' ? '#102d1a' : '#d4edda', borderColor: colorScheme === 'dark' ? '#1f4a2f' : 'transparent' }]}>
        <Ionicons name="shield-checkmark" size={20} color={colorScheme === 'dark' ? '#8ae2a2' : '#155724'} />
        <ThemedText style={[styles.guardText, { color: colorScheme === 'dark' ? '#d8f5e3' : '#155724' }]}>
          Audit Readiness: **High**. All required "Before" photos are GPS-tagged.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 20, marginTop: 10 },
  sub: { color: '#666', fontSize: 14 },
  uploadBtn: { 
    backgroundColor: '#007AFF', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    padding: 18, 
    borderRadius: 12, 
    marginBottom: 20 
  },
  uploadText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 },
  label: { fontSize: 12, color: '#666', marginBottom: 15, fontWeight: '700' },
  fileList: { flex: 1 },
  fileCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    alignItems: 'center',
    shadowOpacity: 0.05,
    elevation: 2,
    borderWidth: 1
  },
  fileInfo: { flex: 1, marginLeft: 15 },
  dateText: { fontSize: 12, color: '#999' },
  guardBox: { 
    backgroundColor: '#d4edda', 
    padding: 15, 
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1
  },
  guardText: { color: '#155724', fontSize: 12, marginLeft: 10, flex: 1 }
});