import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ScrollView, Modal, ActivityIndicator } from 'react-native';
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ bizName?: string; abn?: string; providerNum?: string }>({});
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

  const validateABN = (abn: string): boolean => {
    const clean = abn.replace(/\s/g, '');
    // Must be 11 digits, no letters, cannot start with 0
    if (!/^(?!0)\d{11}$/.test(clean)) return false;

    // Official ABN checksum (weights 10,1,3,5,7,9,11,13,15,17,19)
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const digits = clean.split('').map(Number);
    digits[0] = digits[0] - 1; // subtract 1 from first digit
    const sum = digits.reduce((acc, digit, idx) => acc + digit * weights[idx], 0);
    return sum % 89 === 0;
  };

  const validateProviderNum = (num: string): boolean => {
    // Provider number should be 9 digits
    return /^\d{9}$/.test(num);
  };

  const saveSettings = async () => {
    // Clear previous errors
    setErrors({});

    // Validate inputs
    const newErrors: { bizName?: string; abn?: string; providerNum?: string } = {};

    if (!bizName.trim()) {
      newErrors.bizName = 'Business name is required';
    }

    if (!abn.trim()) {
      newErrors.abn = 'ABN is required';
    } else if (!validateABN(abn)) {
      newErrors.abn = 'ABN must be valid: 11 digits, not starting with 0, digits only, and pass the official checksum (e.g., 12 345 678 901)';
    }

    if (!providerNum.trim()) {
      newErrors.providerNum = 'Provider number is required';
    } else if (!validateProviderNum(providerNum)) {
      newErrors.providerNum = 'Provider number must be 9 digits';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const settings = { bizName, abn, providerNum, themePreference };
      await AsyncStorage.setItem('@provider_settings', JSON.stringify(settings));
      await setStoredThemePreference(themePreference);
      Alert.alert("Success", "NDIS Credentials Saved!");
    } catch (e) {
      Alert.alert("Error", "Could not save settings.");
    } finally {
      setIsLoading(false);
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
    console.log('handleLogout called');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try 
    {
      console.log('Logout confirmed, removing token');
      // Clear all authentication and settings data
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('@provider_settings');
      await AsyncStorage.removeItem('@theme_preference');
      await AsyncStorage.removeItem('@onboarding_complete');
      console.log('All auth data cleared');
      
      // Force navigation to auth screen
      setTimeout(() => {
        console.log('Navigating to auth');
        router.replace('/auth');
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}> 
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <ThemedText type="title" style={[styles.header, { color: palette.text }]}>Business Profile</ThemedText>
        <ThemedText style={[styles.sub, { color: textMuted }]}>These details will appear on all generated NDIS quotes.</ThemedText>

        <View style={[styles.form, { backgroundColor: surface, borderColor: border }]}> 
          <ThemedText style={[styles.label, { color: palette.text }]}>Registered Business Name</ThemedText>
          <TextInput 
            style={[
              styles.input, 
              { backgroundColor: surfaceAlt, borderColor: errors.bizName ? '#ff4444' : border, color: palette.text }
            ]} 
            value={bizName} 
            onChangeText={(text) => {
              setBizName(text);
              if (errors.bizName) setErrors({ ...errors, bizName: undefined });
            }}
            placeholder="e.g. ModiProof Building Co."
            placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
            editable={!isLoading}
          />
          {errors.bizName && (
            <ThemedText style={styles.errorText}>{errors.bizName}</ThemedText>
          )}

          <ThemedText style={[styles.label, { color: palette.text }]}>ABN</ThemedText>
          <TextInput 
            style={[
              styles.input, 
              { backgroundColor: surfaceAlt, borderColor: errors.abn ? '#ff4444' : border, color: palette.text }
            ]} 
            value={abn} 
            onChangeText={(text) => {
              setAbn(text);
              if (errors.abn) setErrors({ ...errors, abn: undefined });
            }}
            placeholder="00 000 000 000"
            keyboardType="numeric"
            placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
            maxLength={13}
            editable={!isLoading}
          />
          {errors.abn && (
            <ThemedText style={styles.errorText}>{errors.abn}</ThemedText>
          )}

          <ThemedText style={[styles.label, { color: palette.text }]}>NDIS Provider Number (PRODA)</ThemedText>
          <TextInput 
            style={[
              styles.input, 
              { backgroundColor: surfaceAlt, borderColor: errors.providerNum ? '#ff4444' : border, color: palette.text }
            ]} 
            value={providerNum} 
            onChangeText={(text) => {
              setProviderNum(text);
              if (errors.providerNum) setErrors({ ...errors, providerNum: undefined });
            }}
            placeholder="405000000"
            keyboardType="numeric"
            maxLength={9}
            placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
            editable={!isLoading}
          />
          {errors.providerNum && (
            <ThemedText style={styles.errorText}>{errors.providerNum}</ThemedText>
          )}

          <ThemedText style={[styles.label, { color: palette.text }]}>Theme</ThemedText>
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

          <TouchableOpacity 
            style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]} 
            onPress={saveSettings}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#fff" />
                <ThemedText style={styles.saveText}>Save Credentials</ThemedText>
              </>
            )}
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
          <ThemedText style={[styles.label, { color: palette.text }]}>Account Actions</ThemedText>
          
          <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: surface }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ff4444" />
            <ThemedText style={[styles.logoutText, { color: '#ff4444' }]}>Sign Out of ModiProof</ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={[styles.versionText, { color: textMuted }]}>v1.0.4 - Secure Build</ThemedText>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={cancelLogout}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.modalTitle, { color: palette.text }]}>Sign Out</ThemedText>
            <ThemedText style={[styles.modalMessage, { color: textMuted }]}>
              Are you sure you want to log out of ModiProof?
            </ThemedText>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: surfaceAlt, borderColor: border }]} 
                onPress={cancelLogout}
              >
                <ThemedText style={[styles.modalButtonText, { color: palette.text }]}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonDanger]} 
                onPress={confirmLogout}
              >
                <ThemedText style={styles.modalButtonTextDanger}>Logout</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginTop: 20 },
  sub: { fontSize: 14, marginBottom: 30 },
  form: { padding: 20, borderRadius: 15, elevation: 2, borderWidth: 1 },
  label: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  input: { 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    marginBottom: 8
  },
  errorText: {
    color: '#ff4444',
    fontSize: 11,
    marginBottom: 15,
    marginTop: -4,
  },
  saveBtn: { 
    backgroundColor: '#34a853', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 },
  infoBox: { flexDirection: 'row', marginTop: 30, padding: 15, borderRadius: 10 },
  infoText: { fontSize: 12, marginLeft: 10, flex: 1 },
  themeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  themePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#007AFF' },
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
    borderRadius: 10
  },
  logoutText: { color: '#ff4444', fontWeight: 'bold', marginLeft: 10 },
  versionText: { textAlign: 'center', fontSize: 10, marginTop: 15 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  modalButtonDanger: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  modalButtonTextDanger: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});