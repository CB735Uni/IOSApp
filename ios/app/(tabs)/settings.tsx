import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { setStoredThemePreference } from '@/hooks/use-color-scheme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function SettingsScreen() {
  const [bizName, setBizName] = useState('');
  const [abn, setAbn] = useState('');
  const [providerNum, setProviderNum] = useState('');
  const [themePreference, setThemePreference] = useState<'auto' | 'light' | 'dark'>('auto');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1f2429' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#13171b' : '#f9f9f9';
  const border = colorScheme === 'dark' ? '#2d3238' : '#ddd';
  const textMuted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedData = await AsyncStorage.getItem('@provider_settings');
      const savedTheme = await AsyncStorage.getItem('@theme_preference');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setBizName(parsed.bizName || '');
        setAbn(parsed.abn || '');
        setProviderNum(parsed.providerNum || '');
        setThemePreference(parsed.themePreference || 'auto');
      }
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
        setThemePreference(savedTheme as 'auto' | 'light' | 'dark');
      }
    } catch (e) {
      console.error("Failed to load settings");
    }
  };

  const saveSettings = async () => {
    try {
      const settings = { bizName, abn, providerNum, themePreference };
      await AsyncStorage.setItem('@provider_settings', JSON.stringify(settings));
      await setStoredThemePreference(themePreference);
      Alert.alert("Success", "NDIS Credentials Saved!");
    } catch (e) {
      Alert.alert("Error", "Could not save settings.");
    }
  };

  const handleThemeSelect = async (option: 'auto' | 'light' | 'dark') => {
    setThemePreference(option);
    await setStoredThemePreference(option);
    await AsyncStorage.setItem('@theme_preference', option);
    // keep provider settings in sync for backward compatibility
    const existing = await AsyncStorage.getItem('@provider_settings');
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        parsed.themePreference = option;
        await AsyncStorage.setItem('@provider_settings', JSON.stringify(parsed));
      } catch {}
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
    <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}> 
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <ThemedText type="title" style={[styles.header, { color: palette.text }]}>Business Profile</ThemedText>
        <ThemedText style={[styles.sub, { color: textMuted }]}>These details will appear on all generated NDIS quotes.</ThemedText>

        <View style={[styles.form, { backgroundColor: surface, borderColor: border }]}> 
          <ThemedText style={styles.label}>Registered Business Name</ThemedText>
          <TextInput 
            style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]} 
            value={bizName} 
            onChangeText={setBizName} 
            placeholder="e.g. ModiProof Building Co."
            placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
          />

          <ThemedText style={styles.label}>ABN</ThemedText>
          <TextInput 
            style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]} 
            value={abn} 
            onChangeText={setAbn} 
            placeholder="00 000 000 000"
            keyboardType="numeric"
            placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
          />

          <ThemedText style={styles.label}>NDIS Provider Number (PRODA)</ThemedText>
          <TextInput 
            style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]} 
            value={providerNum} 
            onChangeText={setProviderNum} 
            placeholder="405000000"
            placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
          />

          <ThemedText style={styles.label}>Theme</ThemedText>
          <View style={styles.themeRow}>
            {['auto', 'light', 'dark'].map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.themePill, { borderColor: '#007AFF', backgroundColor: colorScheme === 'dark' ? '#10213a' : '#f5f8ff' }, themePreference === option && styles.themePillActive]}
                onPress={() => handleThemeSelect(option as 'auto' | 'light' | 'dark')}
              >
                <Ionicons
                  name={option === 'auto' ? 'contrast' : option === 'light' ? 'sunny' : 'moon'}
                  size={16}
                  color={themePreference === option ? '#fff' : '#007AFF'}
                />
                <ThemedText style={[styles.themeText, themePreference === option && styles.themeTextActive]}>
                  {option === 'auto' ? 'Auto' : option === 'light' ? 'Light' : 'Dark'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
            <Ionicons name="save" size={20} color="#fff" />
            <ThemedText style={styles.saveText}>Save Credentials</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#1f2d3a' : '#e3f2fd', borderColor: colorScheme === 'dark' ? '#29435c' : '#c2dcfa' }]}> 
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <ThemedText style={[styles.infoText, { color: colorScheme === 'dark' ? '#d4e5ff' : '#007AFF' }]}>
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
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2, borderWidth: 1 },
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
  themeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  themePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#007AFF', backgroundColor: '#f5f8ff' },
  themePillActive: { backgroundColor: '#007AFF' },
  themeText: { color: '#007AFF', fontWeight: '600' },
  themeTextActive: { color: '#fff' },
  
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