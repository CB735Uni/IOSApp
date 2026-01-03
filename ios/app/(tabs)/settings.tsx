import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const [bizName, setBizName] = useState('');
  const [abn, setAbn] = useState('');
  const [providerNum, setProviderNum] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedData = await AsyncStorage.getItem('@provider_settings');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setBizName(parsed.bizName || '');
        setAbn(parsed.abn || '');
        setProviderNum(parsed.providerNum || '');
      }
    } catch (e) {
      console.error("Failed to load settings");
    }
  };

  const saveSettings = async () => {
    try {
      const settings = { bizName, abn, providerNum };
      await AsyncStorage.setItem('@provider_settings', JSON.stringify(settings));
      Alert.alert("Success", "NDIS Credentials Saved!");
    } catch (e) {
      Alert.alert("Error", "Could not save settings.");
    }
  };

  // --- NEW LOGOUT LOGIC ---
  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out of ModiProof?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem('userToken'); // Clear session
          router.replace('/auth'); // Redirect to login
        }
      }
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.header}>Business Profile</ThemedText>
        <ThemedText style={styles.sub}>These details will appear on all generated NDIS quotes.</ThemedText>

        <View style={styles.form}>
          <ThemedText style={styles.label}>Registered Business Name</ThemedText>
          <TextInput 
            style={styles.input} 
            value={bizName} 
            onChangeText={setBizName} 
            placeholder="e.g. ModiProof Building Co."
          />

          <ThemedText style={styles.label}>ABN</ThemedText>
          <TextInput 
            style={styles.input} 
            value={abn} 
            onChangeText={setAbn} 
            placeholder="00 000 000 000"
            keyboardType="numeric"
          />

          <ThemedText style={styles.label}>NDIS Provider Number (PRODA)</ThemedText>
          <TextInput 
            style={styles.input} 
            value={providerNum} 
            onChangeText={setProviderNum} 
            placeholder="405000000"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
            <Ionicons name="save" size={20} color="#fff" />
            <ThemedText style={styles.saveText}>Save Credentials</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <ThemedText style={styles.infoText}>
            Registered providers must follow the NDIS Pricing Arrangements (2026).
          </ThemedText>
        </View>

        {/* --- ACCOUNT ACTIONS --- */}
        <View style={styles.accountSection}>
          <ThemedText style={styles.label}>Account Actions</ThemedText>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ff4444" />
            <ThemedText style={styles.logoutText}>Sign Out of ModiProof</ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={styles.versionText}>v1.0.4 - Secure Build</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginTop: 20 },
  sub: { color: '#666', fontSize: 14, marginBottom: 30 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2 },
  label: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#333', textTransform: 'uppercase' },
  input: { 
    backgroundColor: '#f9f9f9', 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    marginBottom: 20 
  },
  saveBtn: { 
    backgroundColor: '#34a853', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  saveText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 },
  infoBox: { flexDirection: 'row', marginTop: 30, padding: 15, backgroundColor: '#e3f2fd', borderRadius: 10 },
  infoText: { color: '#007AFF', fontSize: 12, marginLeft: 10, flex: 1 },
  
  // Account Styles
  accountSection: { marginTop: 40, marginBottom: 40 },
  logoutBtn: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 15, 
    borderWidth: 1, 
    borderColor: '#ff4444', 
    borderRadius: 10,
    backgroundColor: '#fff'
  },
  logoutText: { color: '#ff4444', fontWeight: 'bold', marginLeft: 10 },
  versionText: { textAlign: 'center', color: '#ccc', fontSize: 10, marginTop: 15 }
});