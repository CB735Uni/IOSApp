import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function InvoiceSettingsScreen() {
  const [invoiceTerms, setInvoiceTerms] = useState('7');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bsb, setBsb] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setInvoiceTerms(parsed.invoiceTerms ?? '7');
        setBankName(parsed.bankName ?? '');
        setAccountName(parsed.accountName ?? '');
        setBsb(parsed.bsb ?? '');
        setAccountNumber(parsed.accountNumber ?? '');
      }
    } catch (e) {
      console.error("Failed to load settings");
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const existingData = await AsyncStorage.getItem('@provider_settings');
      const existingSettings = existingData ? JSON.parse(existingData) : {};
      const settings = { 
        ...existingSettings, 
        invoiceTerms, bankName, accountName, bsb, accountNumber
      };
      await AsyncStorage.setItem('@provider_settings', JSON.stringify(settings));
      Alert.alert("Success", "Invoice settings saved!");
      router.canGoBack() ? router.back() : router.push('/(tabs)/settings');
    } catch (e) {
      Alert.alert("Error", "Could not save settings.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/settings')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ color: palette.text }}>Invoice Settings</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ThemedText style={[styles.subtitle, { color: textMuted }]}>
            Configure your payment terms and bank details for invoices.
          </ThemedText>

          <View style={[styles.form, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.label, { color: palette.text }]}>Default Payment Terms (Days)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
              value={invoiceTerms}
              onChangeText={setInvoiceTerms}
              placeholder="7"
              keyboardType="numeric"
              maxLength={3}
              placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
              editable={!isLoading}
            />

            <ThemedText style={[styles.label, { color: palette.text }]}>Bank Name</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. Commonwealth Bank"
              placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
              editable={!isLoading}
            />

            <ThemedText style={[styles.label, { color: palette.text }]}>Account Name</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="e.g. ModiProof Demo Pty Ltd"
              placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
              editable={!isLoading}
            />

            <ThemedText style={[styles.label, { color: palette.text }]}>BSB Number</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
              value={bsb}
              onChangeText={setBsb}
              placeholder="000000"
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
              editable={!isLoading}
            />

            <ThemedText style={[styles.label, { color: palette.text }]}>Account Number</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: surfaceAlt, borderColor: border, color: palette.text }]}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="00000000"
              keyboardType="numeric"
              maxLength={12}
              placeholderTextColor={colorScheme === 'dark' ? '#7c828a' : '#999'}
              editable={!isLoading}
            />

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
                  <ThemedText style={styles.saveText}>Save Settings</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#1f2d3a' : '#e3f2fd', borderColor: colorScheme === 'dark' ? '#29435c' : '#c2dcfa' }]}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <ThemedText style={[styles.infoText, { color: colorScheme === 'dark' ? '#d4e5ff' : '#007AFF' }]}>
              These details will appear on generated invoices and quotes.
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
  form: { padding: 20, borderRadius: 15, elevation: 2, borderWidth: 1 },
  label: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8
  },
  saveBtn: {
    backgroundColor: '#34a853',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 },
  infoBox: { flexDirection: 'row', marginTop: 30, padding: 15, borderRadius: 10 },
  infoText: { fontSize: 12, marginLeft: 10, flex: 1 },
});
