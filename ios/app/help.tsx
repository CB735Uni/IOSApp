import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function HelpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const surface = colorScheme === 'dark' ? '#1f2429' : '#fff';
  const surfaceAlt = colorScheme === 'dark' ? '#13171b' : '#f9f9f9';
  const border = colorScheme === 'dark' ? '#2d3238' : '#ddd';
  const textMuted = colorScheme === 'dark' ? '#aeb3b9' : '#666';

  const helpItems = [
    {
      icon: 'help-circle',
      title: 'FAQs',
      description: 'Common questions and answers',
      onPress: () => {},
    },
    {
      icon: 'book',
      title: 'User Guide',
      description: 'Learn how to use ModiProof',
      onPress: () => {},
    },
    {
      icon: 'school',
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      onPress: () => {},
    },
    {
      icon: 'chatbubbles',
      title: 'Contact Support',
      description: 'Get help from our team',
      onPress: () => Linking.openURL('mailto:support@modiproof.com.au'),
    },
  ];

  const faqData = [
    {
      question: 'How do I submit a claim?',
      answer: 'Go to the Claims tab, tap the + button, fill in the details, and submit.',
    },
    {
      question: 'Can I work offline?',
      answer: 'Yes! Enable offline mode in settings to capture data without internet.',
    },
    {
      question: 'How do I generate a quote?',
      answer: 'Navigate to Quoter from the home screen, select services, and generate.',
    },
    {
      question: 'Where are my documents stored?',
      answer: 'All documents are securely encrypted in the Vault with audit history.',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surfaceAlt }} edges={['top']}>
      <ThemedView style={[styles.container, { backgroundColor: surfaceAlt }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ color: palette.text }}>Help & Support</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemedText style={[styles.subtitle, { color: textMuted }]}>
            Get help and find answers to your questions
          </ThemedText>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>How can we help?</ThemedText>
            
            {helpItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.helpItem, { borderBottomColor: border }]}
                onPress={item.onPress}
              >
                <View style={[styles.iconContainer, { backgroundColor: surfaceAlt }]}>
                  <Ionicons name={item.icon as any} size={24} color={palette.tint} />
                </View>
                <View style={styles.helpText}>
                  <ThemedText style={[styles.helpTitle, { color: palette.text }]}>{item.title}</ThemedText>
                  <ThemedText style={[styles.helpDescription, { color: textMuted }]}>
                    {item.description}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>Frequently Asked Questions</ThemedText>
            
            {faqData.map((faq, index) => (
              <View key={index} style={[styles.faqItem, { borderBottomColor: border }]}>
                <ThemedText style={[styles.faqQuestion, { color: palette.text }]}>
                  {faq.question}
                </ThemedText>
                <ThemedText style={[styles.faqAnswer, { color: textMuted }]}>
                  {faq.answer}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={[styles.contactCard, { backgroundColor: surface, borderColor: '#007AFF' }]}>
            <Ionicons name="mail" size={32} color="#007AFF" />
            <ThemedText style={[styles.contactTitle, { color: palette.text }]}>Still need help?</ThemedText>
            <ThemedText style={[styles.contactText, { color: textMuted }]}>
              Email us at support@modiproof.com.au
            </ThemedText>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL('mailto:support@modiproof.com.au')}
            >
              <ThemedText style={styles.contactButtonText}>Contact Support</ThemedText>
            </TouchableOpacity>
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
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  helpText: { flex: 1 },
  helpTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  helpDescription: { fontSize: 13 },
  faqItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  faqQuestion: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  faqAnswer: { fontSize: 14, lineHeight: 20 },
  contactCard: {
    padding: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 20,
  },
  contactTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 8 },
  contactText: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  contactButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  contactButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
