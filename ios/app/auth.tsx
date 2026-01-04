import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

    const handleAuth = async () => {
    // Simulate API login
    await AsyncStorage.setItem('userToken', 'fake-secure-id-123');
    // Navigate to dashboard after successful login
    router.replace('/(tabs)');
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
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
          <TextInput 
            style={styles.input} 
            placeholder="Work Email" 
            value={email} 
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {!isLogin && (
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={20} color="#666" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Company Name (Optional)" />
          </View>
        )}

        <TouchableOpacity style={styles.mainBtn} onPress={handleAuth}>
          <ThemedText style={styles.btnText}>
            {isLogin ? 'Login to Dashboard' : 'Create Free Account'}
          </ThemedText>
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
  toggle: { marginTop: 25, alignItems: 'center' },
  toggleText: { color: '#007AFF', fontWeight: '600' },
  footer: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerNote: { fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }
});