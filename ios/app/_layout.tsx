import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppSplashScreen from '@/components/splashscreen';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAppState();
  }, []);

  // Secure Navigation Logic
  useEffect(() => {
    if (isLoading) return;

    const checkAuthAndNavigate = async () => {
      // Re-check token and onboarding status on every navigation change
      const userToken = await AsyncStorage.getItem('userToken');
      const onboardingDone = await AsyncStorage.getItem('@onboarding_complete');
      const authenticated = !!userToken;
      const onboardingCompleted = onboardingDone === 'true';
      
      // Update state if it changed
      if (authenticated !== isAuthenticated) {
        setIsAuthenticated(authenticated);
      }
      if (onboardingCompleted !== onboardingComplete) {
        setOnboardingComplete(onboardingCompleted);
      }

      const inAuthGroup = segments[0] === 'auth';
      const inOnboarding = segments[0] === 'onboarding';

      // Priority 1: Onboarding must be completed first
      if (!onboardingCompleted && !inOnboarding) {
        router.replace('/onboarding');
        return;
      }

      // Priority 2: Authentication
      if (!authenticated && !inAuthGroup && onboardingCompleted) {
        router.replace('/auth');
      } else if (authenticated && inAuthGroup) {
        router.replace('/(tabs)');
      }
    };

    checkAuthAndNavigate();
  }, [segments, isLoading]);

  const checkAppState = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      const userToken = await AsyncStorage.getItem('userToken');
      const onboardingDone = await AsyncStorage.getItem('@onboarding_complete');

      if (hasLaunched === null) {
        setShowSplash(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      }

      if (userToken) {
        setIsAuthenticated(true);
      }

      if (onboardingDone === 'true') {
        setOnboardingComplete(true);
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
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}