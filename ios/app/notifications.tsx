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

interface NotificationSettings {
  pushEnabled: boolean;
  claimsReminders: boolean;
  auditAlerts: boolean;
  documentExpiry: boolean;
  quotesFollowUp: boolean;
  emailNotifications: boolean;
}

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    claimsReminders: true,
    auditAlerts: true,
    documentExpiry: true,
    quotesFollowUp: false,
    emailNotifications: true,
  });
  
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
      const saved = await AsyncStorage.getItem('@notification_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load notification settings");
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('@notification_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error("Failed to save notification settings");
    }
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
          <ThemedText type="title" style={{ color: palette.text }}>Notifications</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemedText style={[styles.subtitle, { color: textMuted }]}>
            Manage your notification preferences
          </ThemedText>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>Push Notifications</ThemedText>
            
            <SettingRow
              icon="notifications"
              label="Enable Push Notifications"
              description="Receive push notifications on this device"
              value={settings.pushEnabled}
              onValueChange={(value) => updateSetting('pushEnabled', value)}
            />
          </View>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>Activity Alerts</ThemedText>
            
            <SettingRow
              icon="calendar"
              label="Claims Reminders"
              description="Get reminded about upcoming claim deadlines"
              value={settings.claimsReminders}
              onValueChange={(value) => updateSetting('claimsReminders', value)}
            />
            
            <SettingRow
              icon="shield-checkmark"
              label="Audit Alerts"
              description="Notifications for audit-related activities"
              value={settings.auditAlerts}
              onValueChange={(value) => updateSetting('auditAlerts', value)}
            />
            
            <SettingRow
              icon="document-text"
              label="Document Expiry"
              description="Alerts when documents are about to expire"
              value={settings.documentExpiry}
              onValueChange={(value) => updateSetting('documentExpiry', value)}
            />
            
            <SettingRow
              icon="receipt"
              label="Quotes Follow-up"
              description="Reminders to follow up on pending quotes"
              value={settings.quotesFollowUp}
              onValueChange={(value) => updateSetting('quotesFollowUp', value)}
            />
          </View>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>Email Notifications</ThemedText>
            
            <SettingRow
              icon="mail"
              label="Email Notifications"
              description="Receive notifications via email"
              value={settings.emailNotifications}
              onValueChange={(value) => updateSetting('emailNotifications', value)}
            />
          </View>

          <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#1f2d3a' : '#e3f2fd', borderColor: colorScheme === 'dark' ? '#29435c' : '#c2dcfa' }]}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <ThemedText style={[styles.infoText, { color: colorScheme === 'dark' ? '#d4e5ff' : '#007AFF' }]}>
              You can manage device notification permissions in your system settings
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
  infoBox: { flexDirection: 'row', marginTop: 10, padding: 15, borderRadius: 10, borderWidth: 1 },
  infoText: { fontSize: 12, marginLeft: 10, flex: 1 },
});
