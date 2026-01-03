import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Image, Modal, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function AuditVaultScreen() {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  useEffect(() => {
    loadVault();
  }, []);

  const loadVault = async () => {
    const savedFiles = await AsyncStorage.getItem('@audit_vault');
    if (savedFiles) setFiles(JSON.parse(savedFiles));
  };

  const addEvidence = async () => {
    // 1. Ask for permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "ModiProof needs camera access to capture audit evidence.");
      return;
    }

    // 2. Launch Camera (or library if on web)
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled) {
      const newFile = {
        id: Date.now().toString(),
        title: `Evidence_${files.length + 1}.jpg`,
        type: 'img',
        date: new Date().toLocaleDateString('en-AU'),
        uri: result.assets[0].uri,
      };

      const updatedFiles = [newFile, ...files];
      setFiles(updatedFiles);
      await AsyncStorage.setItem('@audit_vault', JSON.stringify(updatedFiles));
    }
  };

  const openViewer = (uri: string) => {
    setSelectedImage(uri);
    setIsViewerVisible(true);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Ionicons name="vault" size={24} color="#007AFF" />
          <ThemedText type="title">ModiProof™ Vault</ThemedText>
        </View>
        <ThemedText style={styles.sub}>Secure NDIS Evidence Storage</ThemedText>
      </View>

      {/* Action Button */}
      <TouchableOpacity style={styles.uploadBtn} onPress={addEvidence}>
        <Ionicons name="camera" size={24} color="#fff" />
        <ThemedText style={styles.uploadText}>Capture Site Proof</ThemedText>
      </TouchableOpacity>

      <ScrollView style={styles.fileList} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.label}>Mandatory Audit Documents:</ThemedText>
        
        {files.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={40} color="#ccc" />
            <ThemedText style={{color: '#999', marginTop: 10}}>Vault is empty.</ThemedText>
          </View>
        )}

        {files.map((file) => (
          <View key={file.id} style={styles.fileCard}>
            <View style={styles.iconCircle}>
              <Ionicons 
                name={file.type === 'doc' ? "document-text" : "image"} 
                size={24} 
                color="#007AFF" 
              />
            </View>
            <View style={styles.fileInfo}>
              <ThemedText type="defaultSemiBold" numberOfLines={1}>{file.title}</ThemedText>
              <ThemedText style={styles.dateText}>Verified: {file.date}</ThemedText>
            </View>
            <TouchableOpacity onPress={() => openViewer(file.uri)} style={styles.viewBtn}>
               <ThemedText style={styles.viewBtnText}>View</ThemedText>
               <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal visible={isViewerVisible} transparent={false} animationType="fade">
        <ThemedView style={styles.viewerContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setIsViewerVisible(false)}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
          
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          )}
          
          <View style={styles.viewerFooter}>
            <ThemedText style={styles.viewerMetadata}>
              <Ionicons name="shield-checkmark" size={14} /> ModiProof™ Verified Evidence
            </ThemedText>
          </View>
        </ThemedView>
      </Modal>

      {/* Compliance Status */}
      <View style={styles.guardBox}>
        <Ionicons name="shield-checkmark" size={20} color="#155724" />
        <ThemedText style={styles.guardText}>
          PACE Status: {files.length > 2 ? "**Audit Ready**" : "**Incomplete**"}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 20, marginTop: 10 },
  sub: { color: '#666', fontSize: 14, marginTop: 4 },
  uploadBtn: { 
    backgroundColor: '#007AFF', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 18, 
    borderRadius: 16, 
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  uploadText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  label: { fontSize: 11, color: '#888', marginBottom: 15, fontWeight: '700', textTransform: 'uppercase' },
  fileList: { flex: 1 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  fileCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 15, 
    marginBottom: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  iconCircle: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#f0f7ff', justifyContent: 'center', alignItems: 'center' },
  fileInfo: { flex: 1, marginLeft: 12 },
  dateText: { fontSize: 11, color: '#999', marginTop: 2 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  viewBtnText: { color: '#007AFF', fontSize: 13, fontWeight: '600', marginRight: 4 },
  
  // Viewer Styles
  viewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' },
  viewerFooter: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  viewerMetadata: { color: '#34a853', fontSize: 12, fontWeight: 'bold' },

  guardBox: { 
    backgroundColor: '#d4edda', 
    padding: 15, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    marginTop: 15
  },
  guardText: { color: '#155724', fontSize: 12, marginLeft: 10, flex: 1 }
});