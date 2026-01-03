import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppSplashScreen from '@/components/splashscreen';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAppState();
  }, []);

  // Secure Navigation Logic
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to dashboard if already logged in
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading]);

  const checkAppState = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      const userToken = await AsyncStorage.getItem('userToken'); // Check for login session

      if (hasLaunched === null) {
        setShowSplash(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      }

      if (userToken) {
        setIsAuthenticated(true);
      }
      
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <>
      {showSplash && <AppSplashScreen onFinish={() => setShowSplash(false)} />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}