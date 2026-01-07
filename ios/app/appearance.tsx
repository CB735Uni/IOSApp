import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { setStoredThemePreference, useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function AppearanceScreen() {
  const [themePreference, setThemePreference] = useState<'auto' | 'light' | 'dark'>('auto');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1f2429' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#13171b' : '#f9f9f9';
  const border = colorScheme === 'dark' ? '#2d3238' : '#ddd';
  const textMuted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme_preference');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
        setThemePreference(savedTheme as 'auto' | 'light' | 'dark');
      }
    } catch (e) {
      console.error("Failed to load theme");
    }
  };

  const handleThemeSelect = async (option: 'auto' | 'light' | 'dark') => {
    setThemePreference(option);
    await setStoredThemePreference(option);
    await AsyncStorage.setItem('@theme_preference', option);
    
    const existing = await AsyncStorage.getItem('@provider_settings');
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        parsed.themePreference = option;
        await AsyncStorage.setItem('@provider_settings', JSON.stringify(parsed));
      } catch {}
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ color: palette.text }}>Appearance</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemedText style={[styles.subtitle, { color: textMuted }]}>
            Customize how ModiProof looks on your device
          </ThemedText>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>Theme</ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: textMuted }]}>
              Choose how you want ModiProof to appear
            </ThemedText>

            <View style={styles.themeOptions}>
              {[
                { value: 'auto', label: 'Auto', icon: 'contrast', description: 'Match system settings' },
                { value: 'light', label: 'Light', icon: 'sunny', description: 'Always use light theme' },
                { value: 'dark', label: 'Dark', icon: 'moon', description: 'Always use dark theme' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.themeCard,
                    { backgroundColor: surfaceAlt, borderColor: border },
                    themePreference === option.value && { borderColor: '#007AFF', borderWidth: 2 }
                  ]}
                  onPress={() => handleThemeSelect(option.value as 'auto' | 'light' | 'dark')}
                >
                  <View style={[
                    styles.themeIconContainer,
                    { backgroundColor: themePreference === option.value ? '#007AFF' : colorScheme === 'dark' ? '#10213a' : '#f5f8ff' }
                  ]}>
                    <Ionicons
                      name={option.icon as any}
                      size={28}
                      color={themePreference === option.value ? '#fff' : '#007AFF'}
                    />
                  </View>
                  <ThemedText style={[styles.themeLabel, { color: palette.text }]}>
                    {option.label}
                  </ThemedText>
                  <ThemedText style={[styles.themeDescription, { color: textMuted }]}>
                    {option.description}
                  </ThemedText>
                  {themePreference === option.value && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#1f2d3a' : '#e3f2fd', borderColor: colorScheme === 'dark' ? '#29435c' : '#c2dcfa' }]}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <ThemedText style={[styles.infoText, { color: colorScheme === 'dark' ? '#d4e5ff' : '#007AFF' }]}>
              Theme changes apply immediately across the entire app
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  sectionSubtitle: { fontSize: 14, marginBottom: 20 },
  themeOptions: { gap: 15 },
  themeCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  themeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  themeLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  themeDescription: { fontSize: 13, textAlign: 'center' },
  selectedBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  infoBox: { flexDirection: 'row', marginTop: 10, padding: 15, borderRadius: 10, borderWidth: 1 },
  infoText: { fontSize: 12, marginLeft: 10, flex: 1 },
});
