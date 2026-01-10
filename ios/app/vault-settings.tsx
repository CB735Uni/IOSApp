import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView, TextInput, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const VAULT_PIN_KEY = 'vaultPin';
const BIOMETRIC_ENABLED_KEY = 'vaultBiometricEnabled';
const AUTO_LOCK_KEY = 'vaultAutoLockTimeout';

// Cross-platform alert
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

// Helper functions to handle both web and native storage
const setSecureItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getSecureItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteSecureItem = async (key: string) => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export default function VaultSettingsScreen() {
  const [pinSet, setPinSet] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockTimeout, setAutoLockTimeout] = useState('5'); // in minutes, '0' = immediately, 'never' = never
  const [showChangePinForm, setShowChangePinForm] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1f2429' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#13171b' : '#f9f9f9';
  const border = colorScheme === 'dark' ? '#2d3238' : '#ddd';
  const textMuted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  useEffect(() => {
    loadVaultSettings();
  }, []);

  const loadVaultSettings = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setBiometricAvailable(compatible);
      
      const savedPin = await getSecureItem(VAULT_PIN_KEY);
      setPinSet(!!savedPin);
      
      const bioEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      setBiometricEnabled(bioEnabled === 'true' && compatible);
      
      const timeout = await AsyncStorage.getItem(AUTO_LOCK_KEY);
      setAutoLockTimeout(timeout || '5'); // default 5 minutes
    } catch (err) {
      console.warn('Failed to load vault settings:', err);
    }
  };

  const handleChangePIN = async () => {
    console.log('handleChangePIN called - pinSet:', pinSet, 'newPin length:', newPin.length, 'confirmNewPin length:', confirmNewPin.length);
    
    if (!pinSet) {
      // First time setup
      if (!/^\d+$/.test(newPin)) {
        console.log('PIN contains non-numeric characters');
        showAlert('Invalid PIN', 'PIN must contain only numbers (0-9)');
        return;
      }
      if (newPin.length < 4) {
        console.log('PIN too short');
        showAlert('PIN too short', 'PIN must be at least 4 digits');
        return;
      }
      if (newPin !== confirmNewPin) {
        console.log('PIN mismatch');
        showAlert('PIN mismatch', 'PINs do not match');
        return;
      }
      
      try {
        console.log('Setting PIN...');
        await setSecureItem(VAULT_PIN_KEY, newPin);
        console.log('PIN saved successfully');
        setPinSet(true);
        setShowChangePinForm(false);
        setNewPin('');
        setConfirmNewPin('');
        showAlert('Success', 'Vault PIN has been set');
        await loadVaultSettings(); // Refresh settings
      } catch (err) {
        console.error('Error setting PIN:', err);
        showAlert('Error', 'Failed to save PIN: ' + err.message);
      }
    } else {
      // Changing existing PIN
      try {
        const savedPin = await getSecureItem(VAULT_PIN_KEY);
        console.log('Checking current PIN...');
        if (currentPin !== savedPin) {
          console.log('Current PIN incorrect');
          showAlert('Incorrect PIN', 'Current PIN is incorrect');
          return;
        }
        
        if (!/^\d+$/.test(newPin)) {
          console.log('New PIN contains non-numeric characters');
          showAlert('Invalid PIN', 'New PIN must contain only numbers (0-9)');
          return;
        }
        if (newPin.length < 4) {
          console.log('New PIN too short');
          showAlert('PIN too short', 'New PIN must be at least 4 digits');
          return;
        }
        if (newPin !== confirmNewPin) {
          console.log('New PIN mismatch');
          showAlert('PIN mismatch', 'New PINs do not match');
          return;
        }
        
        console.log('Updating PIN...');
        await setSecureItem(VAULT_PIN_KEY, newPin);
        console.log('PIN updated successfully');
        setShowChangePinForm(false);
        setCurrentPin('');
        setNewPin('');
        setConfirmNewPin('');
        showAlert('Success', 'Vault PIN has been changed');
        await loadVaultSettings(); // Refresh settings
      } catch (err) {
        console.error('Error changing PIN:', err);
        showAlert('Error', 'Failed to change PIN: ' + err.message);
      }
    }
  };

  const handleRemovePIN = async () => {
    showConfirm(
      'Remove PIN',
      'Are you sure you want to remove your Vault PIN? This will disable vault security.',
      async () => {
        try {
          await deleteSecureItem(VAULT_PIN_KEY);
          await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
          setPinSet(false);
          setBiometricEnabled(false);
          showAlert('Success', 'Vault PIN has been removed');
        } catch (err) {
          showAlert('Error', 'Failed to remove PIN');
        }
      }
    );
  };

  const toggleBiometric = async (value: boolean) => {
    if (!biometricAvailable) {
      showAlert('Not available', 'Biometric authentication not available on this device');
      return;
    }
    
    if (!pinSet) {
      showAlert('PIN Required', 'Please set a PIN first before enabling biometric unlock');
      return;
    }
    
    try {
      if (value) {
        const result = await LocalAuthentication.authenticateAsync({
          reason: 'Enable biometric unlock for Vault',
          disableDeviceFallback: false,
        });
        if (result.success) {
          await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
          setBiometricEnabled(true);
        }
      } else {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
        setBiometricEnabled(false);
      }
    } catch (err) {
      console.warn('Biometric toggle error:', err);
    }
  };

  const handleAutoLockChange = async (value: string) => {
    try {
      await AsyncStorage.setItem(AUTO_LOCK_KEY, value);
      setAutoLockTimeout(value);
    } catch (err) {
      console.warn('Auto-lock setting error:', err);
    }
  };

  const getAutoLockLabel = (value: string) => {
    switch (value) {
      case '0': return 'When leaving vault';
      case '1': return 'After 1 minute';
      case '5': return 'After 5 minutes';
      case '15': return 'After 15 minutes';
      case '30': return 'After 30 minutes';
      case 'never': return 'Never';
      default: return 'After 5 minutes';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/settings')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ color: palette.text }}>Vault Security</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ThemedText style={[styles.subtitle, { color: textMuted }]}>
            Protect your sensitive documents with a PIN and biometric authentication.
          </ThemedText>

          {/* PIN Status */}
          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.statusRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.sectionLabel}>PIN Protection</ThemedText>
                <ThemedText style={[styles.statusText, { color: textMuted }]}>
                  {pinSet ? 'PIN is set and active' : 'No PIN set'}
                </ThemedText>
              </View>
              <Ionicons 
                name={pinSet ? "checkmark-circle" : "alert-circle-outline"} 
                size={28} 
                color={pinSet ? "#34a853" : textMuted} 
              />
            </View>

            {!showChangePinForm ? (
              <View style={styles.buttonGroup}>
                {pinSet ? (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#007AFF', borderColor: border }]}
                      onPress={() => setShowChangePinForm(true)}
                    >
                      <Ionicons name="key-outline" size={20} color="#fff" />
                      <ThemedText style={styles.actionButtonText}>Change PIN</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: surfaceAlt, borderColor: border }]}
                      onPress={handleRemovePIN}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff4444" />
                      <ThemedText style={[styles.actionButtonTextAlt, { color: '#ff4444' }]}>Remove PIN</ThemedText>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#34a853', borderColor: border }]}
                    onPress={() => setShowChangePinForm(true)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <ThemedText style={styles.actionButtonText}>Set PIN</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.pinForm}>
                {pinSet && (
                  <>
                    <ThemedText style={[styles.inputLabel, { color: palette.text }]}>Current PIN</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
                      value={currentPin}
                      onChangeText={setCurrentPin}
                      placeholder="Enter current PIN"
                      placeholderTextColor={textMuted}
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={6}
                    />
                  </>
                )}

                <ThemedText style={[styles.inputLabel, { color: palette.text }]}>
                  {pinSet ? 'New PIN' : 'PIN'} (min 4 digits)
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
                  value={newPin}
                  onChangeText={setNewPin}
                  placeholder="Enter PIN"
                  placeholderTextColor={textMuted}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                />

                <ThemedText style={[styles.inputLabel, { color: palette.text }]}>Confirm PIN</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
                  value={confirmNewPin}
                  onChangeText={setConfirmNewPin}
                  placeholder="Confirm PIN"
                  placeholderTextColor={textMuted}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                />

                <View style={styles.formButtons}>
                  <TouchableOpacity 
                    style={[styles.formButton, { backgroundColor: surfaceAlt, borderColor: border }]}
                    onPress={() => {
                      setShowChangePinForm(false);
                      setCurrentPin('');
                      setNewPin('');
                      setConfirmNewPin('');
                    }}
                  >
                    <ThemedText style={{ color: palette.text }}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formButton, { backgroundColor: '#34a853' }]}
                    onPress={handleChangePIN}
                  >
                    <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Save</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Biometric */}
          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.sectionLabel}>Biometric Unlock</ThemedText>
                <ThemedText style={[styles.statusText, { color: textMuted }]}>
                  {biometricAvailable 
                    ? (biometricEnabled ? 'Use fingerprint or face ID' : 'Enable fingerprint or face ID')
                    : 'Not available on this device'}
                </ThemedText>
              </View>
              <Switch 
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                disabled={!biometricAvailable || !pinSet}
              />
            </View>
          </View>

          {/* Auto-Lock */}
          {pinSet && (
            <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
              <View style={{ marginBottom: 16 }}>
                <ThemedText style={styles.sectionLabel}>Auto-Lock</ThemedText>
                <ThemedText style={[styles.statusText, { color: textMuted }]}>
                  Lock vault after inactivity
                </ThemedText>
              </View>
              
              {['0', '1', '5', '15', '30', 'never'].map((timeout) => (
                <TouchableOpacity
                  key={timeout}
                  style={[styles.radioOption, { borderBottomColor: border }]}
                  onPress={() => handleAutoLockChange(timeout)}
                >
                  <ThemedText style={{ color: palette.text, fontSize: 15 }}>
                    {getAutoLockLabel(timeout)}
                  </ThemedText>
                  <Ionicons
                    name={autoLockTimeout === timeout ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={autoLockTimeout === timeout ? '#007AFF' : textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#1f2d3a' : '#e3f2fd', borderColor: colorScheme === 'dark' ? '#29435c' : '#c2dcfa' }]}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <ThemedText style={[styles.infoText, { color: colorScheme === 'dark' ? '#d4e5ff' : '#007AFF' }]}>
              Your vault PIN is stored securely on this device and never shared. Biometric authentication requires a PIN to be set first.
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 20 },
  backButton: { marginRight: 15 },
  subtitle: { fontSize: 14, marginBottom: 30 },
  section: { padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 1 },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusText: { fontSize: 13 },
  buttonGroup: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 10, borderWidth: 1, gap: 8 },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  actionButtonTextAlt: { fontWeight: '600', fontSize: 14 },
  pinForm: { marginTop: 8 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 12 },
  input: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  formButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  formButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  radioOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  infoBox: { flexDirection: 'row', marginTop: 10, padding: 15, borderRadius: 10, borderWidth: 1 },
  infoText: { fontSize: 12, marginLeft: 10, flex: 1, lineHeight: 18 },
});
