import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Platform, Image, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ModiProofDashboard() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [bizInfo, setBizInfo] = useState<any>(null);
  const router = useRouter();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1f2429' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#0f1216' : '#f8f9fa';
  const border = colorScheme === 'dark' ? '#2d3238' : '#eee';
  const muted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  useEffect(() => {
    if (isFocused) {
      loadBusinessInfo();
    }
  }, [isFocused]);

  const loadBusinessInfo = async () => {
    const savedBiz = await AsyncStorage.getItem('@provider_settings');
    if (savedBiz) setBizInfo(JSON.parse(savedBiz));
  };

  const captureEvidence = async () => {
    setIsCapturing(true);
    try {

      console.log('Starting evidence capture process...');
      // 1. Request Permissions
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const locationStatus = await Location.requestForegroundPermissionsAsync();

      console.log('Location Permission Status:', JSON.stringify(locationStatus, null, 2));

      if (cameraStatus.status !== 'granted' || locationStatus.status !== 'granted') {
        Alert.alert(
          "Permission Required", 
          "ModiProof needs Camera and GPS access to verify audit evidence.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
        setIsCapturing(false);
        return;
      }

      // 2. Check location accuracy BEFORE taking photo
      console.log('Getting location to check accuracy...');
      const testLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      console.log('Location Data:', JSON.stringify(testLocation, null, 2));
      console.log('Accuracy Value (meters):', testLocation.coords.accuracy);

      // Check if iOS user has reduced accuracy enabled
      if (Platform.OS === 'ios' && testLocation.coords.accuracy && testLocation.coords.accuracy > 100) {
        Alert.alert(
          "Precise Location Required",
          `ModiProof requires precise location. Current accuracy: ${Math.round(testLocation.coords.accuracy)}m. Please enable 'Precise Location' in Settings.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
        setIsCapturing(false);
        return;
      }

      // 3. Launch Camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        // 4. Get Real GPS Coordinates with highest accuracy
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        console.log('Location Data:', JSON.stringify(location, null, 2));
        console.log('Accuracy Value:', location.coords.accuracy);

        // Check if iOS user has reduced accuracy enabled
        if (Platform.OS === 'ios' && location.coords.accuracy && location.coords.accuracy > 100) {
          Alert.alert(
            "Precise Location Required",
            "ModiProof requires precise location to verify exact GPS coordinates. Your current accuracy is reduced. Please enable 'Precise Location' in Settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          setIsCapturing(false);
          return;
        }
        
        const newPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          timestamp: new Date().toLocaleString('en-AU'),
          coords: `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`,
          verified: true
        };

        setPhotos([newPhoto, ...photos]);
      }
    } catch (e) {
      Alert.alert("Error", "Could not capture compliance photo.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={[styles.container, { backgroundColor: surfaceAlt }]} 
        contentContainerStyle={styles.content}
      >
      <ThemedView style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
          <ThemedText type="title" style={styles.brandTitle}>ModiProof™</ThemedText>
        </View>
        <ThemedText style={[styles.projectLabel, { color: muted }]}>Evidence Dashboard</ThemedText>
      </ThemedView>

      {/* Business Profile Warning */}
      {!bizInfo && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#b8860b" />
          <ThemedText style={styles.infoText}>
            Complete your business profile in Settings to unlock all features
          </ThemedText>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="arrow-forward-circle" size={24} color="#b8860b" />
          </TouchableOpacity>
        </View>
      )}

      {/* Audit Readiness Progress */}
      <View style={[styles.auditCard, { backgroundColor: surface, borderColor: border }]}> 
        <View style={styles.auditHeader}>
          <ThemedText style={[styles.auditTitle, { color: muted }]}>AUDIT READINESS</ThemedText>
          <ThemedText style={styles.auditPercent}>{photos.length > 0 ? '100%' : '20%'}</ThemedText>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colorScheme === 'dark' ? '#242b31' : '#333' }]}>
          <View style={[styles.progressBarFill, { width: photos.length > 0 ? '100%' : '20%', backgroundColor: '#34a853' }]} />
        </View>
      </View>

      {/* The Evidence Feed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultSemiBold" style={{ color: palette.text }}>Field Evidence Trail</ThemedText>
          <TouchableOpacity 
            onPress={captureEvidence} 
            disabled={isCapturing}
            style={[styles.addBtn, isCapturing && { opacity: 0.5 }]}
          >
             <Ionicons name="camera" size={18} color="#fff" />
             <ThemedText style={styles.addBtnText}>{isCapturing ? 'Verifying...' : 'Capture'}</ThemedText>
          </TouchableOpacity>
        </View>
        
        {photos.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: surface, borderColor: border }]}>
            <Ionicons name="images-outline" size={48} color="#ccc" />
            <ThemedText style={{color: '#aaa', marginTop: 10}}>No verified photos yet.</ThemedText>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
            {photos.map(photo => (
              <View key={photo.id} style={[styles.photoCard, { backgroundColor: surface, borderColor: border }]}>
                <Image source={{ uri: photo.uri }} style={styles.photoImg} />
                <View style={styles.metadataBox}>
                  <ThemedText style={styles.metaText}><Ionicons name="time" size={10} /> {photo.timestamp}</ThemedText>
                  <ThemedText style={styles.metaText}><Ionicons name="location" size={10} /> {photo.coords}</ThemedText>
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#fff" />
                  <ThemedText style={styles.verifiedText}>VERIFIED</ThemedText>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Action Grid */}
      <View style={styles.grid}>
        <ActionButton icon="document-text" title="Generate Quote" color="#007AFF" surface={surface} border={border} textColor={palette.text} onPress={() => router.push('/quoter')} />
        <ActionButton icon="list" title="Audit Logs" color="#fbbc05" surface={surface} border={border} textColor={palette.text} onPress={() => router.push('/audit')} />
        <ActionButton icon="clipboard" title="Claims" color="#8e44ad" surface={surface} border={border} textColor={palette.text} onPress={() => router.push('/claims')} />
        <ActionButton icon="lock-closed" title="Vault" color="#16a085" surface={surface} border={border} textColor={palette.text} onPress={() => router.push('/vault')} />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable ActionButton
function ActionButton({ icon, title, color, onPress, surface, border, textColor }: any) {
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: surface, borderColor: border }]} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <ThemedText style={[styles.cardTitle, { color: textColor }]}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20, maxWidth: 600, alignSelf: 'center', width: '100%' },
  header: { marginTop: 10, marginBottom: 20, backgroundColor: 'transparent' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbea', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ffd966' },
  infoText: { fontSize: 12, color: '#b8860b', flex: 1, lineHeight: 18 },
  brandTitle: { fontWeight: '800', letterSpacing: -0.5 },
  projectLabel: { color: '#666', fontSize: 14, marginTop: 4 },
  auditCard: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 16, marginBottom: 25 },
  auditHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  auditTitle: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  auditPercent: { color: '#34a853', fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: '#333', borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: '#34a853', borderRadius: 3 },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
  photoList: { flexDirection: 'row' },
  photoCard: { marginRight: 15, width: 180, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  photoImg: { width: '100%', height: 110 },
  metadataBox: { padding: 8 },
  metaText: { fontSize: 9, color: '#888', marginBottom: 2 },
  verifiedBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#34a853', flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  verifiedText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', width: '48%', padding: 20, borderRadius: 16, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0' },
  iconCircle: { padding: 12, borderRadius: 25, marginBottom: 8 },
  cardTitle: { fontWeight: '600', fontSize: 13 }
});