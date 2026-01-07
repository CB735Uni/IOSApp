import { useEffect, useState, useMemo, useRef } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const THEME_KEY = '@theme_preference';
type ThemePref = 'auto' | 'light' | 'dark';

// Web uses localStorage for speed; mirrors native API
const listeners = new Set<(pref: ThemePref) => void>();

export async function setStoredThemePreference(pref: ThemePref) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, pref);
    }
  } catch {}
  listeners.forEach((cb) => cb(pref));
}

export function useColorScheme() {
  const systemScheme = useRNColorScheme();
  const [preference, setPreference] = useState<ThemePref>('auto');
  const isLoadingRef = useRef(true);

  useEffect(() => {
    if (isLoadingRef.current) {
      const loadPref = () => {
        try {
          const stored = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_KEY) : null;
          if (stored === 'light' || stored === 'dark' || stored === 'auto') {
            setPreference(stored);
          }
        } catch {}
        isLoadingRef.current = false;
      };
      loadPref();
    }

    const listener = (pref: ThemePref) => setPreference(pref);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return useMemo(() => {
    if (preference === 'auto') return systemScheme ?? 'light';
    return preference;
  }, [preference, systemScheme]);
}
