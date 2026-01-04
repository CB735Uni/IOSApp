import { useEffect, useState } from 'react';
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
  const [resolvedScheme, setResolvedScheme] = useState<'light' | 'dark'>(systemScheme ?? 'light');

  useEffect(() => {
    const loadPref = () => {
      try {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_KEY) : null;
        if (stored === 'light' || stored === 'dark' || stored === 'auto') {
          setPreference(stored);
        }
      } catch {}
    };
    loadPref();

    const listener = (pref: ThemePref) => setPreference(pref);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  useEffect(() => {
    setResolvedScheme(preference === 'auto' ? (systemScheme ?? 'light') : preference);
  }, [preference, systemScheme]);

  return resolvedScheme;
}
