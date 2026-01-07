import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function AboutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1f2429' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#13171b' : '#f9f9f9';
  const border = colorScheme === 'dark' ? '#2d3238' : '#ddd';
  const textMuted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  const features = [
    { icon: 'shield-checkmark', title: 'Secure Vault', description: 'Encrypted document storage' },
    { icon: 'receipt', title: 'Quote Generator', description: 'NDIS-compliant quotes' },
    { icon: 'checkmark-done', title: 'Audit Ready', description: 'Complete audit trail' },
    { icon: 'people', title: 'Client Management', description: 'Participant tracking' },
    { icon: 'cloud-offline', title: 'Offline First', description: 'Work without internet' },
    { icon: 'location', title: 'GPS Evidence', description: 'Field capture tools' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ color: palette.text }}>About ModiProof</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.logoSection, { backgroundColor: surface, borderColor: border }]}>
            <View style={[styles.logoContainer, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="shield-checkmark" size={48} color="#fff" />
            </View>
            <ThemedText style={[styles.appName, { color: palette.text }]}>ModiProof</ThemedText>
            <ThemedText style={[styles.appTagline, { color: textMuted }]}>
              NDIS Provider Toolkit
            </ThemedText>
            <View style={styles.versionBadge}>
              <ThemedText style={[styles.versionText, { color: palette.text }]}>Version 1.0.4</ThemedText>
              <View style={[styles.badge, { backgroundColor: '#34a853' }]}>
                <ThemedText style={styles.badgeText}>Secure Build</ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>What is ModiProof?</ThemedText>
            <ThemedText style={[styles.description, { color: textMuted }]}>
              ModiProof is an NDIS provider toolkit designed for field crews and compliance teams. 
              It streamlines onboarding, daily service delivery, evidence capture, quoting, and 
              audit readiness in one mobile-first experience.
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>Key Features</ThemedText>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={[styles.featureCard, { backgroundColor: surfaceAlt }]}>
                  <Ionicons name={feature.icon as any} size={28} color="#007AFF" />
                  <ThemedText style={[styles.featureTitle, { color: palette.text }]}>
                    {feature.title}
                  </ThemedText>
                  <ThemedText style={[styles.featureDescription, { color: textMuted }]}>
                    {feature.description}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>Legal</ThemedText>
            
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://modiproof.com.au/privacy')}>
              <ThemedText style={[styles.linkText, { color: palette.tint }]}>Privacy Policy</ThemedText>
              <Ionicons name="open-outline" size={18} color={palette.tint} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://modiproof.com.au/terms')}>
              <ThemedText style={[styles.linkText, { color: palette.tint }]}>Terms of Service</ThemedText>
              <Ionicons name="open-outline" size={18} color={palette.tint} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://modiproof.com.au')}>
              <ThemedText style={[styles.linkText, { color: palette.tint }]}>Visit Website</ThemedText>
              <Ionicons name="open-outline" size={18} color={palette.tint} />
            </TouchableOpacity>
          </View>

          <View style={[styles.creditSection, { borderColor: border }]}>
            <ThemedText style={[styles.creditText, { color: textMuted }]}>
              Built for field crews and compliance teams
            </ThemedText>
            <ThemedText style={[styles.creditText, { color: textMuted }]}>
              © 2026 ModiProof. All rights reserved.
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
  logoSection: {
    padding: 40,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appName: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  appTagline: { fontSize: 16, marginBottom: 20 },
  versionBadge: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  versionText: { fontSize: 14, fontWeight: '600' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  section: { padding: 20, borderRadius: 15, borderWidth: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  description: { fontSize: 14, lineHeight: 22 },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  featureTitle: { fontSize: 14, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  featureDescription: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkText: { fontSize: 15, fontWeight: '500' },
  creditSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    alignItems: 'center',
    marginBottom: 40,
  },
  creditText: { fontSize: 12, textAlign: 'center', marginVertical: 4 },
});
