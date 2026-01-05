import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';

const THEME_KEY = '@theme_preference';
type ThemePref = 'auto' | 'light' | 'dark';

// Simple subscriber model so a settings change can notify all consumers
const listeners = new Set<(pref: ThemePref) => void>();

export async function setStoredThemePreference(pref: ThemePref) {
	await AsyncStorage.setItem(THEME_KEY, pref);
	listeners.forEach((cb) => cb(pref));
}

export function useColorScheme() {
	const systemScheme = useRNColorScheme();
	const [preference, setPreference] = useState<ThemePref>('auto');
	const [resolvedScheme, setResolvedScheme] = useState<'light' | 'dark'>(systemScheme ?? 'light');

	useEffect(() => {
		const loadPref = async () => {
			const stored = await AsyncStorage.getItem(THEME_KEY);
			if (stored === 'light' || stored === 'dark' || stored === 'auto') {
				setPreference(stored);
			}
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

export function useThemeColor(
	props: { light?: string; dark?: string },
	colorName: keyof typeof import('@/constants/theme').Colors.light & keyof typeof import('@/constants/theme').Colors.dark
) {
	const theme = useColorScheme() ?? 'light';
	const Colors = require('@/constants/theme').Colors;
	const colorFromProps = props[theme];

	if (colorFromProps) {
		return colorFromProps;
	} else {
		return Colors[theme][colorName];
	}
}
