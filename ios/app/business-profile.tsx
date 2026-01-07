import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function BusinessProfileScreen() {
  const [bizName, setBizName] = useState('');
  const [abn, setAbn] = useState('');
  const [providerNum, setProviderNum] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
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
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setBizName(parsed.bizName || '');
        setAbn(parsed.abn || '');
        setProviderNum(parsed.providerNum || '');
        setLogoBase64(parsed.logoBase64 || null);
      }
    } catch (e) {
      console.error("Failed to load settings");
    }
  };

  const validateABN = (abn: string): boolean => {
    const clean = abn.replace(/\s/g, '');
    if (!/^(?!0)\d{11}$/.test(clean)) return false;

    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const digits = clean.split('').map(Number);
    digits[0] = digits[0] - 1;
    const sum = digits.reduce((acc, digit, idx) => acc + digit * weights[idx], 0);
    return sum % 89 === 0;
  };

  const validateProviderNum = (num: string): boolean => {
    return /^\d{9}$/.test(num);
  };

  const saveSettings = async () => {
    setErrors({});
    const newErrors: { bizName?: string; abn?: string; providerNum?: string } = {};

    if (!bizName.trim()) {
      newErrors.bizName = 'Business name is required';
    }

    if (!abn.trim()) {
      newErrors.abn = 'ABN is required';
    } else if (!validateABN(abn)) {
      newErrors.abn = 'ABN must be valid: 11 digits, not starting with 0, and pass checksum';
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
      const existingData = await AsyncStorage.getItem('@provider_settings');
      const existingSettings = existingData ? JSON.parse(existingData) : {};
      const settings = { 
        ...existingSettings, 
        bizName, abn, providerNum, logoBase64
      };
      await AsyncStorage.setItem('@provider_settings', JSON.stringify(settings));
      Alert.alert("Success", "Business profile saved!");
      router.back();
    } catch (e) {
      Alert.alert("Error", "Could not save settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const pickLogo = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Allow photo library access to select a logo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      // Prefer returned base64 if present; otherwise read from file
      if (asset.base64) {
        setLogoBase64(asset.base64);
      } else if (asset.uri) {
        const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        setLogoBase64(b64);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not pick logo.');
    }
  };

  const removeLogo = () => setLogoBase64(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ color: palette.text }}>Business Profile</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ThemedText style={[styles.subtitle, { color: textMuted }]}>
            These details will appear on all generated NDIS quotes.
          </ThemedText>

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

            <View style={{ marginTop: 10 }}>
              <ThemedText style={[styles.label, { color: palette.text }]}>Business Logo</ThemedText>
              {logoBase64 ? (
                <View style={{ alignItems: 'flex-start', marginBottom: 10 }}>
                  <Image
                    source={{ uri: `data:image/png;base64,${logoBase64}` }}
                    style={{ width: 120, height: 120, borderRadius: 8, backgroundColor: surfaceAlt, borderWidth: 1, borderColor: border }}
                    resizeMode="contain"
                  />
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity style={[styles.logoBtn]} onPress={pickLogo}>
                      <Ionicons name="images" size={18} color="#fff" />
                      <ThemedText style={styles.logoBtnText}>Change Logo</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.logoBtn, { backgroundColor: '#ff4444' }]} onPress={removeLogo}>
                      <Ionicons name="trash" size={18} color="#fff" />
                      <ThemedText style={styles.logoBtnText}>Remove</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={[styles.logoPicker, { backgroundColor: surfaceAlt, borderColor: border }]} onPress={pickLogo}>
                  <Ionicons name="images" size={20} color="#007AFF" />
                  <ThemedText style={{ color: '#007AFF', marginLeft: 8 }}>Select Logo</ThemedText>
                </TouchableOpacity>
              )}
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
                  <ThemedText style={styles.saveText}>Save Profile</ThemedText>
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
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 },
  infoBox: { flexDirection: 'row', marginTop: 30, padding: 15, borderRadius: 10 },
  infoText: { fontSize: 12, marginLeft: 10, flex: 1 },
  logoPicker: { padding: 12, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  logoBtn: { backgroundColor: '#007AFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  logoBtnText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
});
