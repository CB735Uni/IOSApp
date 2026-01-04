import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // Business Info
  const [bizName, setBizName] = useState('');
  const [abn, setAbn] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ndisNumber, setNdisNumber] = useState('');

  const totalSteps = 2;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    // Save business info
    const businessInfo = {
      bizName,
      abn,
      address,
      phone,
      email,
      ndisNumber,
    };

    await AsyncStorage.setItem('@provider_settings', JSON.stringify(businessInfo));
    await AsyncStorage.setItem('@onboarding_complete', 'true');
    
    // Navigate to auth
    router.replace('/auth');
  };

  const isStep1Valid = bizName.trim() !== '' && abn.trim() !== '';
  const isStep2Valid = address.trim() !== '' && phone.trim() !== '' && email.trim() !== '';

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={40} color="#007AFF" />
            </View>
            <ThemedText type="title" style={styles.title}>Welcome to ModiProof</ThemedText>
            <ThemedText style={styles.subtitle}>
              Let's set up your NDIS provider profile
            </ThemedText>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
            </View>
            <ThemedText style={styles.progressText}>Step {step} of {totalSteps}</ThemedText>
          </View>

          {/* Step 1: Business Basics */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Ionicons name="business" size={24} color="#007AFF" />
                <ThemedText type="subtitle" style={styles.stepTitle}>Business Information</ThemedText>
              </View>
              <ThemedText style={styles.stepDescription}>
                This information will appear on all your quotes and documents
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Business Name *</ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="briefcase-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g., ModiCare Services Pty Ltd"
                    value={bizName}
                    onChangeText={setBizName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Australian Business Number (ABN) *</ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="card-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="12 345 678 901"
                    value={abn}
                    onChangeText={setAbn}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>NDIS Registration Number (Optional)</ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="shield-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g., 4050012345"
                    value={ndisNumber}
                    onChangeText={setNdisNumber}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Contact Details */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Ionicons name="location" size={24} color="#007AFF" />
                <ThemedText type="subtitle" style={styles.stepTitle}>Contact Details</ThemedText>
              </View>
              <ThemedText style={styles.stepDescription}>
                How participants and auditors can reach you
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Business Address *</ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="home-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="123 Main Street, Melbourne VIC 3000"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Phone Number *</ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="(03) 1234 5678"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email Address *</ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="contact@yourcompany.com.au"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="lock-closed" size={16} color="#34a853" />
            <ThemedText style={styles.infoText}>
              Your information is stored securely on your device and never shared without consent
            </ThemedText>
          </View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color="#007AFF" />
              <ThemedText style={styles.backBtnText}>Back</ThemedText>
            </TouchableOpacity>
          )}
          
          {step < totalSteps ? (
            <TouchableOpacity 
              style={[styles.nextBtn, !isStep1Valid && styles.disabledBtn]} 
              onPress={handleNext}
              disabled={!isStep1Valid}
            >
              <ThemedText style={styles.nextBtnText}>Next</ThemedText>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.nextBtn, !isStep2Valid && styles.disabledBtn]} 
              onPress={handleComplete}
              disabled={!isStep2Valid}
            >
              <ThemedText style={styles.nextBtnText}>Complete Setup</ThemedText>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 30, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  logoCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#f0f7ff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  subtitle: { color: '#666', textAlign: 'center', fontSize: 14 },
  
  progressContainer: { marginBottom: 30 },
  progressBar: { 
    height: 6, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 3, 
    overflow: 'hidden',
    marginBottom: 8 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#007AFF', 
    borderRadius: 3 
  },
  progressText: { 
    fontSize: 12, 
    color: '#666', 
    textAlign: 'center' 
  },

  stepContainer: { marginBottom: 20 },
  stepHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginBottom: 8 
  },
  stepTitle: { fontSize: 20 },
  stepDescription: { 
    fontSize: 13, 
    color: '#666', 
    marginBottom: 25,
    lineHeight: 20 
  },

  inputGroup: { marginBottom: 20 },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 8 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5', 
    borderRadius: 12, 
    paddingHorizontal: 15,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  icon: { marginRight: 10 },
  input: { 
    flex: 1, 
    fontSize: 15,
    color: '#000',
    paddingVertical: 12
  },

  infoBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: '#f0fdf4', 
    padding: 15, 
    borderRadius: 12, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d0f0e0'
  },
  infoText: { 
    fontSize: 12, 
    color: '#34a853', 
    flex: 1,
    lineHeight: 18
  },

  footer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 15
  },
  backBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  backBtnText: { 
    color: '#007AFF', 
    fontWeight: '600',
    fontSize: 15
  },
  nextBtn: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12
  },
  nextBtnText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 15
  },
  disabledBtn: {
    backgroundColor: '#ccc',
    opacity: 0.6
  }
});
