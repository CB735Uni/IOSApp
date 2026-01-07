import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface OfflineSettings {
  autoSync: boolean;
  syncOnWifiOnly: boolean;
  downloadDocuments: boolean;
  cacheImages: boolean;
  offlineMode: boolean;
}

export default function OfflineModeScreen() {
  const [settings, setSettings] = useState<OfflineSettings>({
    autoSync: true,
    syncOnWifiOnly: true,
    downloadDocuments: false,
    cacheImages: true,
    offlineMode: false,
  });
  const [storageUsed, setStorageUsed] = useState('2.4 MB');
  
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
      const saved = await AsyncStorage.getItem('@offline_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load offline settings");
    }
  };

  const updateSetting = async (key: keyof OfflineSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('@offline_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error("Failed to save offline settings");
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data? This will free up storage but may require re-downloading data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setStorageUsed('0 MB');
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleSyncNow = () => {
    Alert.alert('Syncing', 'Synchronizing data with server...');
  };

  const SettingRow = ({ 
    icon, 
    label, 
    description, 
    value, 
    onValueChange 
  }: { 
    icon: string; 
    label: string; 
    description: string; 
    value: boolean; 
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: surfaceAlt }]}>
          <Ionicons name={icon as any} size={20} color={palette.tint} />
        </View>
        <View style={styles.settingText}>
          <ThemedText style={[styles.settingLabel, { color: palette.text }]}>{label}</ThemedText>
          <ThemedText style={[styles.settingDescription, { color: textMuted }]}>{description}</ThemedText>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: border, true: '#007AFF80' }}
        thumbColor={value ? '#007AFF' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ color: palette.text }}>Offline Mode</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemedText style={[styles.subtitle, { color: textMuted }]}>
            Configure offline access and data synchronization
          </ThemedText>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>Sync Settings</ThemedText>
            
            <SettingRow
              icon="sync"
              label="Auto-Sync"
              description="Automatically sync data when online"
              value={settings.autoSync}
              onValueChange={(value) => updateSetting('autoSync', value)}
            />
            
            <SettingRow
              icon="wifi"
              label="Wi-Fi Only Sync"
              description="Only sync when connected to Wi-Fi"
              value={settings.syncOnWifiOnly}
              onValueChange={(value) => updateSetting('syncOnWifiOnly', value)}
            />

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#007AFF' }]} 
              onPress={handleSyncNow}
            >
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Sync Now</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>Offline Content</ThemedText>
            
            <SettingRow
              icon="cloud-offline"
              label="Offline Mode"
              description="Work without internet connection"
              value={settings.offlineMode}
              onValueChange={(value) => updateSetting('offlineMode', value)}
            />
            
            <SettingRow
              icon="document"
              label="Download Documents"
              description="Keep documents available offline"
              value={settings.downloadDocuments}
              onValueChange={(value) => updateSetting('downloadDocuments', value)}
            />
            
            <SettingRow
              icon="image"
              label="Cache Images"
              description="Store images locally for faster access"
              value={settings.cacheImages}
              onValueChange={(value) => updateSetting('cacheImages', value)}
            />
          </View>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>Storage</ThemedText>
            
            <View style={styles.storageRow}>
              <View style={styles.storageLeft}>
                <Ionicons name="server" size={24} color={palette.tint} />
                <View style={{ marginLeft: 12 }}>
                  <ThemedText style={[styles.storageLabel, { color: palette.text }]}>Cached Data</ThemedText>
                  <ThemedText style={[styles.storageValue, { color: textMuted }]}>{storageUsed}</ThemedText>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#ff4444' }]} 
              onPress={handleClearCache}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Clear Cache</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#1f2d3a' : '#e3f2fd', borderColor: colorScheme === 'dark' ? '#29435c' : '#c2dcfa' }]}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <ThemedText style={[styles.infoText, { color: colorScheme === 'dark' ? '#d4e5ff' : '#007AFF' }]}>
              Offline mode lets you capture evidence and notes without internet. Data will sync automatically when you're back online.
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
  section: { padding: 20, borderRadius: 15, borderWidth: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  settingDescription: { fontSize: 12 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginTop: 15,
    gap: 8,
  },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  storageLeft: { flexDirection: 'row', alignItems: 'center' },
  storageLabel: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  storageValue: { fontSize: 14 },
  infoBox: { flexDirection: 'row', marginTop: 10, padding: 15, borderRadius: 10, borderWidth: 1 },
  infoText: { fontSize: 12, marginLeft: 10, flex: 1 },
});
