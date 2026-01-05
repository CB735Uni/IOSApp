import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [errors, setErrors] = useState<{ 
    bizName?: string; 
    abn?: string; 
    ndisNumber?: string;
    address?: string;
    phone?: string;
    email?: string;
  }>({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  const draftTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savedInfo, setSavedInfo] = useState<{ 
    bizName: string;
    abn: string;
    address: string;
    phone: string;
    email: string;
    ndisNumber: string;
  }>();

  const totalSteps = 2;
  const DRAFT_KEY = '@onboarding_draft';
  const ONBOARDING_COMPLETE_KEY = '@onboarding_complete';

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateABN = (abn: string): boolean => {
    const clean = abn.replace(/\s/g, '');
    // Must be 11 digits, no letters, cannot start with 0
    if (!/^(?!0)\d{11}$/.test(clean)) return false;

    // Official ABN checksum (weights 10,1,3,5,7,9,11,13,15,17,19)
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const digits = clean.split('').map(Number);
    digits[0] = digits[0] - 1; // subtract 1 from first digit
    const sum = digits.reduce((acc, digit, idx) => acc + digit * weights[idx], 0);
    return sum % 89 === 0;
  };

  const validateNdisNumber = (num: string): boolean => {
    // NDIS number should be 9-10 digits
    return /^\d{9,10}$/.test(num);
  };

  const validatePhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Should be at least 10 digits for Australian numbers
    return cleanPhone.length >= 10;
  };

  // Load any saved draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem(DRAFT_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          setBizName(parsed.bizName ?? '');
          setAbn(parsed.abn ?? '');
          setAddress(parsed.address ?? '');
          setPhone(parsed.phone ?? '');
          setEmail(parsed.email ?? '');
          setNdisNumber(parsed.ndisNumber ?? '');
          if (parsed.step && typeof parsed.step === 'number') {
            setStep(parsed.step);
          }
        }
      } catch (e) {
        // ignore draft load errors
      } finally {
        setDraftLoaded(true);
      }
    };

    loadDraft();
  }, []);

  // Save draft whenever values change
  useEffect(() => {
    if (!draftLoaded) return;

    if (draftTimeout.current) {
      clearTimeout(draftTimeout.current);
    }

    draftTimeout.current = setTimeout(() => {
      const draft = {
        step,
        bizName,
        abn,
        address,
        phone,
        email,
        ndisNumber,
      };
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
    }, 300);

    return () => {
      if (draftTimeout.current) {
        clearTimeout(draftTimeout.current);
      }
    };
  }, [step, bizName, abn, address, phone, email, ndisNumber, draftLoaded]);

  const handleNext = () => {
    // Validate Step 1
    if (step === 1) {
      const newErrors: typeof errors = {};
      
      if (!bizName.trim()) {
        newErrors.bizName = 'Business name is required';
      } else if (bizName.trim().length < 3) {
        newErrors.bizName = 'Business name must be at least 3 characters';
      }

      if (!abn.trim()) {
        newErrors.abn = 'ABN is required';
      } else if (!validateABN(abn)) {
        newErrors.abn = 'ABN must be valid: 11 digits, not starting with 0, digits only, and pass the official checksum (e.g., 12 345 678 901)';
      }

      if (ndisNumber.trim() && !validateNdisNumber(ndisNumber)) {
        newErrors.ndisNumber = 'NDIS number must be 9-10 digits';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      setErrors({});
    }

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
    // Validate Step 2
    const newErrors: typeof errors = {};

    if (!address.trim()) {
      newErrors.address = 'Business address is required';
    } else if (address.trim().length < 10) {
      newErrors.address = 'Please enter a complete address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid Australian phone number';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
    await AsyncStorage.removeItem(DRAFT_KEY);
    setSavedInfo(businessInfo);
    setShowConfirm(true);
  };

  const handleUseDemoData = async () => {
    const demoData = {
      bizName: 'ModiProof Demo Pty Ltd',
      abn: '12 345 678 901',
      ndisNumber: '4050012345',
      address: '123 Demo Street, Sydney NSW 2000',
      phone: '0412 345 678',
      email: 'demo@modiproof.com.au',
    };

    // Persist demo data and skip onboarding
    await AsyncStorage.setItem('@provider_settings', JSON.stringify(demoData));
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    await AsyncStorage.removeItem(DRAFT_KEY);

    // Jump straight to auth
    router.replace('/auth');
  };

  const handleConfirmContinue = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    await AsyncStorage.removeItem(DRAFT_KEY);
    setShowConfirm(false);
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
                <View style={[styles.inputContainer, errors.bizName && styles.inputError]}>
                  <Ionicons name="briefcase-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g., ModiCare Services Pty Ltd"
                    placeholderTextColor="#999"
                    value={bizName}
                    onChangeText={(text) => {
                      setBizName(text);
                      if (errors.bizName) setErrors({ ...errors, bizName: undefined });
                    }}
                  />
                </View>
                {errors.bizName && (
                  <ThemedText style={styles.errorText}>{errors.bizName}</ThemedText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Australian Business Number (ABN) *</ThemedText>
                <View style={[styles.inputContainer, errors.abn && styles.inputError]}>
                  <Ionicons name="card-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="12 345 678 901"
                    placeholderTextColor="#999"
                    value={abn}
                    onChangeText={(text) => {
                      setAbn(text);
                      if (errors.abn) setErrors({ ...errors, abn: undefined });
                    }}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                </View>
                {errors.abn && (
                  <ThemedText style={styles.errorText}>{errors.abn}</ThemedText>
                )}
                {!errors.abn && (
                  <ThemedText style={styles.helperText}>
                    ABN must be 11 digits, cannot start with 0, digits only, and must pass the official ABN checksum (GST/PAYG branch numbers are separate).
                  </ThemedText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>NDIS Registration Number (Optional)</ThemedText>
                <View style={[styles.inputContainer, errors.ndisNumber && styles.inputError]}>
                  <Ionicons name="shield-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g., 4050012345"
                    placeholderTextColor="#999"
                    value={ndisNumber}
                    onChangeText={(text) => {
                      setNdisNumber(text);
                      if (errors.ndisNumber) setErrors({ ...errors, ndisNumber: undefined });
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                {errors.ndisNumber && (
                  <ThemedText style={styles.errorText}>{errors.ndisNumber}</ThemedText>
                )}
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
                <View style={[styles.inputContainer, errors.address && styles.inputError]}>
                  <Ionicons name="home-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="123 Main Street, Melbourne VIC 3000"
                    placeholderTextColor="#999"
                    value={address}
                    onChangeText={(text) => {
                      setAddress(text);
                      if (errors.address) setErrors({ ...errors, address: undefined });
                    }}
                    multiline
                  />
                </View>
                {errors.address && (
                  <ThemedText style={styles.errorText}>{errors.address}</ThemedText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Phone Number *</ThemedText>
                <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                  <Ionicons name="call-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="(03) 1234 5678"
                    placeholderTextColor="#999"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
                {errors.phone && (
                  <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email Address *</ThemedText>
                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={18} color="#666" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="contact@yourcompany.com.au"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && (
                  <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
                )}
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
          <TouchableOpacity style={styles.demoBtn} onPress={handleUseDemoData}>
            <Ionicons name="flash" size={18} color="#007AFF" />
            <ThemedText style={styles.demoBtnText}>Use Demo Data</ThemedText>
          </TouchableOpacity>

          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color="#007AFF" />
              <ThemedText style={styles.backBtnText}>Back</ThemedText>
            </TouchableOpacity>
          )}
          
          {step < totalSteps ? (
            <TouchableOpacity 
              style={styles.nextBtn} 
              onPress={handleNext}
            >
              <ThemedText style={styles.nextBtnText}>Next</ThemedText>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.nextBtn} 
              onPress={handleComplete}
            >
              <ThemedText style={styles.nextBtnText}>Complete Setup</ThemedText>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Confirmation Modal */}
        <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Setup Complete</ThemedText>
              <ThemedText style={styles.modalSubtitle}>Here’s what we saved:</ThemedText>

              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Business</ThemedText>
                <ThemedText style={styles.summaryValue}>{savedInfo?.bizName || '—'}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>ABN</ThemedText>
                <ThemedText style={styles.summaryValue}>{savedInfo?.abn || '—'}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>NDIS</ThemedText>
                <ThemedText style={styles.summaryValue}>{savedInfo?.ndisNumber || 'Not provided'}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Address</ThemedText>
                <ThemedText style={styles.summaryValue}>{savedInfo?.address || '—'}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Phone</ThemedText>
                <ThemedText style={styles.summaryValue}>{savedInfo?.phone || '—'}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Email</ThemedText>
                <ThemedText style={styles.summaryValue}>{savedInfo?.email || '—'}</ThemedText>
              </View>

              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleConfirmContinue}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <ThemedText style={styles.modalPrimaryText}>Continue to Login</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setShowConfirm(false)}>
                <ThemedText style={styles.modalSecondaryText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 30, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
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
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
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
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 5,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 5,
    lineHeight: 16,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#000',
    flex: 1.3,
    textAlign: 'right',
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalSecondaryBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSecondaryText: {
    color: '#007AFF',
    fontWeight: '600',
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
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#f5f9ff'
  },
  demoBtnText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14
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
