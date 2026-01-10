import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const VAULT_PIN_KEY = 'vaultPin';
const BIOMETRIC_ENABLED_KEY = 'vaultBiometricEnabled';

// Platform-aware storage helpers
const getSecureItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

interface MenuOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  color?: string;
}

export default function MoreScreen() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1f2429' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#13171b' : '#f9f9f9';
  const border = colorScheme === 'dark' ? '#2d3238' : '#ddd';
  const textMuted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  useEffect(() => {
    initializeVaultStatus();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      initializeVaultStatus();
    }, [])
  );

  const initializeVaultStatus = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setBiometricAvailable(compatible);
      const savedPin = await getSecureItem(VAULT_PIN_KEY);
      setPinSet(!!savedPin);
      const bioEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      setBiometricEnabled(bioEnabled === 'true' && compatible);
      console.log('Vault status updated:', { pinSet: !!savedPin, bioEnabled: bioEnabled === 'true' });
    } catch (err) {
      console.warn('Vault status init error:', err);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('@provider_settings');
      await AsyncStorage.removeItem('@theme_preference');
      await AsyncStorage.removeItem('@onboarding_complete');
      
      setTimeout(() => {
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

  const handleVaultSettings = () => {
    console.log('handleVaultSettings called - pinSet:', pinSet, 'biometricEnabled:', biometricEnabled);
    const message = `PIN: ${pinSet ? 'Set' : 'Not Set'}\nBiometric: ${biometricEnabled ? 'Enabled' : 'Disabled'}`;
    console.log('Showing alert with message:', message);
    Alert.alert(
      'Vault Security',
      message,
      [
        { text: 'Toggle Biometric', onPress: () => toggleBiometricFromSettings() },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const toggleBiometricFromSettings = async () => {
    if (!biometricAvailable) {
      Alert.alert('Not available', 'Biometric authentication not available on this device');
      return;
    }
    if (!pinSet) {
      Alert.alert('PIN Required', 'Please set a PIN in the Vault first');
      return;
    }
    const newState = !biometricEnabled;
    try {
      if (newState) {
        const result = await LocalAuthentication.authenticateAsync({
          reason: 'Enable biometric unlock for Vault',
          disableDeviceFallback: false,
        });
        if (result.success) {
          await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric unlock enabled for Vault');
        }
      } else {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
        setBiometricEnabled(false);
        Alert.alert('Success', 'Biometric unlock disabled for Vault');
      }
    } catch (err) {
      console.warn('Biometric toggle error:', err);
    }
  };

  // Menu options configuration
  const menuSections: { title: string; options: MenuOption[] }[] = [
    {
      title: 'Account',
      options: [
        {
          id: 'profile',
          icon: 'person-outline',
          label: 'Business Profile',
          subtitle: 'Business name, ABN, provider details & logo',
          onPress: () => router.push('/business-profile'),
          showChevron: true,
        },
        {
          id: 'invoice',
          icon: 'receipt-outline',
          label: 'Invoice Settings',
          subtitle: 'Payment terms, bank details & account info',
          onPress: () => router.push('/invoice-settings'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'App Settings',
      options: [
        {
          id: 'appearance',
          icon: 'color-palette-outline',
          label: 'Appearance',
          subtitle: 'Theme & display settings',
          onPress: () => router.push('/appearance'),
          showChevron: true,
        },
        {
          id: 'notifications',
          icon: 'notifications-outline',
          label: 'Notifications',
          subtitle: 'Manage alerts & reminders',
          onPress: () => router.push('/notifications'),
          showChevron: true,
        },
        {
          id: 'offline',
          icon: 'cloud-offline-outline',
          label: 'Offline Mode',
          subtitle: 'Sync & data storage',
          onPress: () => router.push('/offline-mode'),
          showChevron: true,
        },
        {
          id: 'vault',
          icon: 'shield-checkmark-outline',
          label: 'Vault Security',
          subtitle: `PIN: ${pinSet ? 'Set' : 'Not Set'} • Biometric: ${biometricEnabled ? 'On' : 'Off'}`,
          onPress: () => router.push('/vault-settings'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Support',
      options: [
        {
          id: 'help',
          icon: 'help-circle-outline',
          label: 'Help & Support',
          subtitle: 'FAQs & contact us',
          onPress: () => router.push('/help'),
          showChevron: true,
        },
        {
          id: 'feedback',
          icon: 'chatbox-outline',
          label: 'Send Feedback',
          subtitle: 'Share your thoughts',
          onPress: () => {
            const email = 'feedback@modiproof.com.au';
            const subject = 'ModiProof Feedback';
            Alert.alert(
              'Send Feedback',
              'Would you like to send feedback via email?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Email', onPress: () => {} }
              ]
            );
          },
          showChevron: true,
        },
        {
          id: 'about',
          icon: 'information-circle-outline',
          label: 'About ModiProof',
          subtitle: 'v1.0.4 - Secure Build',
          onPress: () => router.push('/about'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Account Actions',
      options: [
        {
          id: 'logout',
          icon: 'log-out-outline',
          label: 'Sign Out',
          subtitle: 'Sign out of ModiProof',
          onPress: () => handleLogout(),
          showChevron: false,
          color: '#ff4444',
        },
      ],
    },
  ];

  const renderMenuItem = (option: MenuOption) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.menuItem, { backgroundColor: surface, borderColor: border }]}
      onPress={option.onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: option.color ? `${option.color}15` : surfaceAlt }]}>
        <Ionicons name={option.icon} size={22} color={option.color || palette.tint} />
      </View>
      <View style={styles.menuTextContainer}>
        <ThemedText style={[styles.menuLabel, { color: option.color || palette.text }]}>
          {option.label}
        </ThemedText>
        {option.subtitle && (
          <ThemedText style={[styles.menuSubtitle, { color: textMuted }]}>
            {option.subtitle}
          </ThemedText>
        )}
      </View>
      {option.showChevron && (
        <Ionicons name="chevron-forward" size={20} color={textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        >
          <ThemedText type="title" style={[styles.header, { color: palette.text }]}>
            More
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textMuted }]}>
            Account settings, support, and more
          </ThemedText>

          {menuSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: textMuted }]}>
                {section.title}
              </ThemedText>
              <View style={styles.menuGroup}>
                {section.options.map(renderMenuItem)}
              </View>
            </View>
          ))}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuGroup: {
    gap: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  
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
