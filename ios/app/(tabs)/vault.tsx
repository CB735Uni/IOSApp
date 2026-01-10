import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Image, Modal, TextInput, Alert, useWindowDimensions, Platform, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const VAULT_PIN_KEY = 'vaultPin';
const BIOMETRIC_ENABLED_KEY = 'vaultBiometricEnabled';
const AUTO_LOCK_KEY = 'vaultAutoLockTimeout';

// Platform-aware storage helpers
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

export default function AuditVaultScreen() {
  const [files, setFiles] = useState([
    { id: '1', title: 'OT Assessment.pdf', type: 'doc', date: '01/01/26' },
    { id: '2', title: 'Existing Bathroom (Before).jpg', type: 'img', date: '02/01/26', uri: 'https://via.placeholder.com/150' },
  ]);
  
  const [isLocked, setIsLocked] = useState(true);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [tempPin, setTempPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [autoLockTimeout, setAutoLockTimeout] = useState('5'); // in minutes
  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1b2026' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#0f1216' : '#f8f9fa';
  const border = colorScheme === 'dark' ? '#2d3238' : '#eaeaea';
  const muted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  useEffect(() => {
    initializeVault();
  }, []);

  // Auto-lock effect
  useEffect(() => {
    if (!isLocked && pinSet && autoLockTimeout !== 'never' && autoLockTimeout !== '0') {
      resetAutoLockTimer();
    }
    return () => {
      if (autoLockTimerRef.current) {
        clearTimeout(autoLockTimerRef.current);
      }
    };
  }, [isLocked, pinSet, autoLockTimeout]);

  // Handle "immediately" option - lock when navigating away or app goes to background
  useFocusEffect(
    React.useCallback(() => {
      // When screen gains focus, reload auto-lock setting
      const loadAutoLock = async () => {
        const timeout = await AsyncStorage.getItem(AUTO_LOCK_KEY);
        setAutoLockTimeout(timeout || '5');
      };
      loadAutoLock();

      // When screen loses focus, lock if "immediately" is enabled
      return () => {
        if (!isLocked && autoLockTimeout === '0') {
          setIsLocked(true);
          setShowPinInput(false);
          setPin('');
        }
      };
    }, [autoLockTimeout, isLocked])
  );

  // App state listener for background lock
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/active/) &&
        nextAppState === 'background' &&
        !isLocked &&
        autoLockTimeout === '0'
      ) {
        setIsLocked(true);
        setShowPinInput(false);
        setPin('');
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isLocked, autoLockTimeout]);

  const resetAutoLockTimer = () => {
    // Clear existing timer
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }

    // Don't set timer if vault is locked, timeout is 'never', or '0' (immediately)
    if (isLocked || autoLockTimeout === 'never' || autoLockTimeout === '0') {
      return;
    }

    // Calculate timeout in milliseconds
    const timeoutMs = parseInt(autoLockTimeout) * 60 * 1000;

    // Set new timer
    autoLockTimerRef.current = setTimeout(() => {
      setIsLocked(true);
      setShowPinInput(false);
      setPin('');
    }, timeoutMs);
  };

  const initializeVault = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setBiometricAvailable(compatible);
      
      const savedPin = await getSecureItem(VAULT_PIN_KEY);
      if (savedPin) {
        setPinSet(true);
        const bioEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        setBiometricEnabled(bioEnabled === 'true' && compatible);
        
        const timeout = await AsyncStorage.getItem(AUTO_LOCK_KEY);
        setAutoLockTimeout(timeout || '5');
        
        if (bioEnabled === 'true' && compatible) {
          attemptBiometric();
        }
      } else {
        setShowPinSetup(true);
        setIsLocked(false);
      }
    } catch (err) {
      console.error('Vault init error:', err);
    }
  };

  const attemptBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: 'Unlock your Vault',
      });
      if (result.success) {
        setIsLocked(false);
        resetAutoLockTimer();
      }
    } catch (err) {
      console.warn('Biometric auth error:', err);
      setShowPinInput(true);
    }
  };

  const setupPin = async () => {
    if (!/^\d+$/.test(tempPin)) {
      Alert.alert('Invalid PIN', 'PIN must contain only numbers (0-9)');
      return;
    }
    if (tempPin.length < 4) {
      Alert.alert('PIN too short', 'PIN must be at least 4 digits');
      return;
    }
    if (tempPin !== confirmPin) {
      Alert.alert('PIN mismatch', 'PINs do not match. Try again.');
      setTempPin('');
      setConfirmPin('');
      return;
    }
    
    try {
      await setSecureItem(VAULT_PIN_KEY, tempPin);
      setPinSet(true);
      setShowPinSetup(false);
      setIsLocked(false);
      setTempPin('');
      setConfirmPin('');
      Alert.alert('Success', 'Vault PIN set! Your vault is now secured.');
      resetAutoLockTimer();
    } catch (err) {
      Alert.alert('Error', 'Failed to save PIN');
    }
  };

  const verifyPin = async () => {
    try {
      const savedPin = await getSecureItem(VAULT_PIN_KEY);
      if (pin === savedPin) {
        setIsLocked(false);
        setPin('');
        setShowPinInput(false);
        setAttemptCount(0);
        resetAutoLockTimer();
      } else {
        const newCount = attemptCount + 1;
        setAttemptCount(newCount);
        Alert.alert('Incorrect PIN', `${3 - newCount} attempts remaining`);
        if (newCount >= 3) {
          Alert.alert('Locked', 'Too many failed attempts. Try again later.');
          setShowPinInput(false);
          setPin('');
          setAttemptCount(0);
        }
        setPin('');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to verify PIN');
    }
  };

  const toggleBiometric = async () => {
    if (!biometricAvailable) {
      Alert.alert('Not available', 'Biometric authentication not available on this device');
      return;
    }
    
    const newState = !biometricEnabled;
    try {
      if (newState) {
        const result = await LocalAuthentication.authenticateAsync({
          reason: 'Enable biometric unlock',
          disableDeviceFallback: false,
        });
        if (result.success) {
          await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric unlock enabled');
        }
      } else {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
        setBiometricEnabled(false);
        Alert.alert('Success', 'Biometric unlock disabled');
      }
    } catch (err) {
      console.warn('Biometric toggle error:', err);
    }
  };

  const addFile = () => {
    if (isLocked) {
      Alert.alert('Vault locked', 'Unlock the vault first');
      return;
    }
    alert("On web: This opens your Windows File Explorer.\nOn Mobile: This opens the Camera.");
    const newFile = { id: Date.now().toString(), title: 'New_Evidence.jpg', type: 'img', date: 'Today', uri: 'https://via.placeholder.com/150' };
    setFiles([newFile, ...files]);
  };

  // Lock Screen
  if (isLocked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
        <ThemedView style={[styles.lockContainer, { backgroundColor: surfaceAlt }]}>
          <Ionicons name="lock-closed" size={80} color="#007AFF" style={{ marginBottom: 20 }} />
          <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 8 }}>Vault Locked</ThemedText>
          <ThemedText style={[styles.lockSubtitle, { color: muted, textAlign: 'center' }]}>
            Enter your PIN or use biometrics to access
          </ThemedText>

          {showPinInput && (
            <View style={[styles.pinInputBox, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText style={{ marginBottom: 16, textAlign: 'center', fontWeight: 'bold' }}>Enter Vault PIN</ThemedText>
              <TextInput
                style={[styles.pinInput, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
                value={pin}
                onChangeText={setPin}
                placeholder="••••"
                placeholderTextColor={muted}
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                textAlign="center"
              />
              <TouchableOpacity style={[styles.verifyBtn, { backgroundColor: '#007AFF' }]} onPress={verifyPin}>
                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Unlock</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {biometricAvailable && biometricEnabled && !showPinInput && (
            <TouchableOpacity style={[styles.biometricBtn, { backgroundColor: surface, borderColor: border }]} onPress={attemptBiometric}>
              <Ionicons name="finger-print" size={48} color="#007AFF" />
              <ThemedText style={{ marginTop: 8 }}>Unlock with Biometric</ThemedText>
            </TouchableOpacity>
          )}

          {biometricAvailable && biometricEnabled && !showPinInput && (
            <TouchableOpacity onPress={() => setShowPinInput(true)}>
              <ThemedText style={{ color: '#007AFF', marginTop: 16, textAlign: 'center', fontWeight: '600' }}>Use PIN Instead</ThemedText>
            </TouchableOpacity>
          )}

          {!biometricAvailable && !showPinInput && (
            <TouchableOpacity style={[styles.biometricBtn, { backgroundColor: surface, borderColor: border }]} onPress={() => setShowPinInput(true)}>
              <Ionicons name="lock-open" size={48} color="#007AFF" />
              <ThemedText style={{ marginTop: 8 }}>Enter PIN</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </SafeAreaView>
    );
  }

  // PIN Setup Screen
  if (showPinSetup) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
        <ThemedView style={[styles.setupContainer, { backgroundColor: surfaceAlt }]}>
          <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 8 }}>Set Vault PIN</ThemedText>
          <ThemedText style={[styles.setupSubtitle, { color: muted, textAlign: 'center' }]}>
            Protect your sensitive documents with a PIN
          </ThemedText>

          <ScrollView style={[styles.setupForm, { backgroundColor: surface, borderColor: border }]} showsVerticalScrollIndicator={false}>
            <ThemedText style={{ marginBottom: 12, fontWeight: '600' }}>Enter PIN (min 4 digits)</ThemedText>
            <TextInput
              style={[styles.pinInput, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
              value={tempPin}
              onChangeText={setTempPin}
              placeholder="••••"
              placeholderTextColor={muted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              textAlign="center"
            />

            <ThemedText style={{ marginBottom: 12, marginTop: 20, fontWeight: '600' }}>Confirm PIN</ThemedText>
            <TextInput
              style={[styles.pinInput, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="••••"
              placeholderTextColor={muted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              textAlign="center"
            />

            <TouchableOpacity style={[styles.setupBtn, { backgroundColor: '#34a853' }]} onPress={setupPin}>
              <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Set PIN</ThemedText>
            </TouchableOpacity>

            {biometricAvailable && (
              <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: border }}>
                <ThemedText style={{ marginBottom: 12, fontWeight: '600' }}>Enable Biometric?</ThemedText>
                <TouchableOpacity style={[styles.bioSetupBtn, { backgroundColor: '#007AFF' }]} onPress={() => toggleBiometric()}>
                  <Ionicons name="finger-print" size={20} color="#fff" />
                  <ThemedText style={{ color: '#fff', marginLeft: 8, fontWeight: '600' }}>Enable Biometric Unlock</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Main Vault View
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
        <View style={styles.header}>
        <ThemedText type="title" style={{ color: palette.text }}>Audit Vault</ThemedText>
        <ThemedText style={[styles.sub, { color: muted }]}>Job: Smith Residence #4492</ThemedText>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => {
          Alert.alert('Vault Security', 'Biometric: ' + (biometricEnabled ? 'Enabled' : 'Disabled'), [
            { text: 'Toggle Biometric', onPress: () => toggleBiometric() },
            { text: 'Close' }
          ]);
        }}>
          <Ionicons name="settings-outline" size={20} color={palette.text} />
        </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 20, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sub: { color: '#666', fontSize: 14 },
  settingsBtn: { padding: 8 },
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
  guardText: { color: '#155724', fontSize: 12, marginLeft: 10, flex: 1 },
  lockContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  lockSubtitle: { fontSize: 16, marginBottom: 40 },
  pinInputBox: { width: '100%', padding: 24, borderRadius: 16, borderWidth: 1, marginTop: 30 },
  pinInput: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 20 },
  verifyBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  biometricBtn: { marginTop: 40, paddingVertical: 40, paddingHorizontal: 30, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  setupContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  setupSubtitle: { fontSize: 16, marginBottom: 30 },
  setupForm: { padding: 20, borderRadius: 16, borderWidth: 1 },
  setupBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  bioSetupBtn: { flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});