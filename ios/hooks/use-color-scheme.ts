import { useEffect, useState, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';

const THEME_KEY = '@theme_preference';
type ThemePref = 'auto' | 'light' | 'dark';

const listeners = new Set<(pref: ThemePref) => void>();

export async function setStoredThemePreference(pref: ThemePref) {
    await AsyncStorage.setItem(THEME_KEY, pref);
    listeners.forEach((cb) => cb(pref));
}

export function useColorScheme() {
    const systemScheme = useRNColorScheme();
    const [preference, setPreference] = useState<ThemePref>('auto');
    const isLoadingRef = useRef(true);

    useEffect(() => {
        if (isLoadingRef.current) {
            // Load initial preference
            AsyncStorage.getItem(THEME_KEY).then(stored => {
                if (stored === 'light' || stored === 'dark' || stored === 'auto') {
                    setPreference(stored);
                }
                isLoadingRef.current = false;
            }).catch(() => {
                isLoadingRef.current = false;
            });
        }

        const listener = (pref: ThemePref) => setPreference(pref);
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    }, []);

    // Memoize the result so it doesn't change unless preference or system changes
    return useMemo(() => {
        if (preference === 'auto') return systemScheme ?? 'light';
        return preference;
    }, [preference, systemScheme]);
}

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: any
) {
    const theme = useColorScheme();
    const Colors = require('@/constants/theme').Colors;
    const colorFromProps = props[theme];

    return colorFromProps ?? Colors[theme][colorName];
}