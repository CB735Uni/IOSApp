import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const router = useRouter();

  const handleUseDemo = async () => {
    setErrors({});
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      await AsyncStorage.setItem('userToken', 'demo-token');
      router.replace('/(tabs)');
    } catch (error) {
      setErrors({ general: 'Unable to start demo session. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleAuth = async () => {
    // Clear previous errors
    setErrors({});

    // Validate inputs
    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate API login
      await AsyncStorage.setItem('userToken', 'fake-secure-id-123');
      // Navigate to dashboard after successful login
      router.replace('/(tabs)');
    } catch (error) {
      setErrors({ general: 'Authentication failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <ThemedView style={styles.container}>
      {/* 1. Branded Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Ionicons name="shield-checkmark" size={40} color="#007AFF" />
        </View>
        <ThemedText type="title" style={styles.title}>ModiProof</ThemedText>
        <ThemedText style={styles.subtitle}>
          {isLogin ? 'Welcome back, Builder' : 'Start your NDIS Compliance Journey'}
        </ThemedText>
      </View>

      {/* 2. Form Fields */}
      <View style={styles.form}>
        {errors.general && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#ff4444" />
            <ThemedText style={styles.errorText}>{errors.general}</ThemedText>
          </View>
        )}

        <View style={[styles.inputContainer, errors.email && styles.inputError]}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
          <TextInput 
            style={styles.input} 
            placeholder="Work Email" 
            value={email} 
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
        </View>
        {errors.email && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorFieldText}>{errors.email}</ThemedText>
          </View>
        )}

        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            secureTextEntry 
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            editable={!isLoading}
          />
        </View>
        {errors.password && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorFieldText}>{errors.password}</ThemedText>
          </View>
        )}

        {!isLogin && (
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={20} color="#666" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Company Name (Optional)" 
              value={companyName}
              onChangeText={setCompanyName}
              editable={!isLoading}
            />
          </View>
        )}

        <TouchableOpacity 
          style={[styles.mainBtn, isLoading && styles.mainBtnDisabled]} 
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.btnText}>
              {isLogin ? 'Login to Dashboard' : 'Create Free Account'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Toggle & Footer */}
      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggle}>
        <ThemedText style={styles.toggleText}>
          {isLogin ? "Don't have an account? Sign Up" : "Already use ModiProof? Log In"}
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Ionicons name="lock-closed" size={12} color="#999" />
        <ThemedText style={styles.footerNote}>Secure NDIS Data Encryption Active</ThemedText>
      </View>

      <TouchableOpacity style={styles.demoBtn} onPress={handleUseDemo} disabled={isLoading}>
        <Ionicons name="flash" size={18} color="#007AFF" />
        <ThemedText style={styles.demoBtnText}>Launch Demo Session</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f7ff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  subtitle: { color: '#666', textAlign: 'center', marginTop: 5 },
  form: { width: '100%' },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5', 
    borderRadius: 12, 
    marginBottom: 15, 
    paddingHorizontal: 15 
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: 55, fontSize: 16 },
  mainBtn: { 
    backgroundColor: '#007AFF', 
    height: 55, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  mainBtnDisabled: { opacity: 0.6 },
  toggle: { marginTop: 25, alignItems: 'center' },
  toggleText: { color: '#007AFF', fontWeight: '600' },
  footer: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerNote: { fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 1 },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#f5f9ff'
  },
  demoBtnText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 14
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderColor: '#ff4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    gap: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 13,
    flex: 1,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  errorContainer: {
    marginTop: -10,
    marginBottom: 10,
  },
  errorFieldText: {
    color: '#ff4444',
    fontSize: 12,
    marginLeft: 15,
  },
});