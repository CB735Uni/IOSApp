import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppSplashScreen from '@/components/splashscreen';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        // First time! Show splash and save to storage
        setShowSplash(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  };

  if (isLoading) return null; // Wait for storage check

  return (
    <>
      {showSplash && <AppSplashScreen onFinish={() => setShowSplash(false)} />}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}