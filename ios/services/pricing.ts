import AsyncStorage from '@react-native-async-storage/async-storage';

import bundledGuide from '../constants/price-guide.local.json';

type GuideSource = 'remote' | 'cache' | 'bundled';

type PriceItem = {
  id: string;
  title: string;
  code: string;
  price: number;
  unit?: string;
  category?: string;
  supportPurpose?: string;
};

export type PriceGuide = {
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  items: PriceItem[];
  updatedAt?: number;
  source?: GuideSource;
};

export type GuideStatus = {
  state: 'ok' | 'stale' | 'expired' | 'updated-local' | 'using-bundled' | 'no-remote' | 'error';
  message?: string;
  source: GuideSource;
};

const STORAGE_KEY = '@ndis_price_guide';
const REMOTE_URL = process.env.EXPO_PUBLIC_PRICE_GUIDE_URL;

const bundled: PriceGuide = {
  ...bundledGuide,
  source: 'bundled',
  updatedAt: Date.now(),
};

function validateGuide(payload: any): payload is PriceGuide {
  if (!payload || typeof payload !== 'object') return false;
  if (typeof payload.version !== 'string') return false;
  if (typeof payload.effectiveFrom !== 'string') return false;
  if (!Array.isArray(payload.items)) return false;
  return payload.items.every((item: any) =>
    item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.code === 'string' && typeof item.price === 'number'
  );
}

function isExpired(guide: PriceGuide): boolean {
  if (!guide.effectiveTo) return false;
  const today = new Date();
  return new Date(guide.effectiveTo).getTime() < today.setHours(0, 0, 0, 0);
}

function isNewerVersion(a: string, b: string): boolean {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i += 1) {
    const av = aParts[i] || 0;
    const bv = bParts[i] || 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

async function loadCachedGuide(): Promise<PriceGuide | null> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (!validateGuide(parsed)) return null;
    return { ...parsed, source: 'cache' };
  } catch (err) {
    console.warn('Failed to load cached price guide', err);
    return null;
  }
}

function buildStatus(guide: PriceGuide, source: GuideSource): GuideStatus {
  if (isExpired(guide)) {
    return {
      state: 'expired',
      source,
      message: 'Price guide is past its effective date. Please update before creating quotes.',
    };
  }
  if (source === 'bundled') {
    return {
      state: 'using-bundled',
      source,
      message: 'Using bundled price guide. Configure EXPO_PUBLIC_PRICE_GUIDE_URL to enable live updates.',
    };
  }
  return { state: 'ok', source };
}

export async function getCurrentGuide(): Promise<{ guide: PriceGuide; status: GuideStatus }> {
  const cached = await loadCachedGuide();
  let guide = cached || bundled;
  let source: GuideSource = cached ? 'cache' : 'bundled';

  // If bundled is newer than cache, prefer bundled
  if (cached && isNewerVersion(bundled.version, cached.version)) {
    guide = bundled;
    source = 'bundled';
  }

  const status = buildStatus(guide, source);
  return { guide, status };
}

export async function refreshPriceGuide(): Promise<{ guide: PriceGuide; status: GuideStatus }> {
  if (!REMOTE_URL) {
    const status: GuideStatus = {
      state: 'no-remote',
      source: 'bundled',
      message: 'Remote price guide URL is not configured (set EXPO_PUBLIC_PRICE_GUIDE_URL). Using bundled guide.',
    };
    return { guide: bundled, status };
  }

  try {
    const response = await fetch(REMOTE_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!validateGuide(payload)) throw new Error('Invalid price guide schema');
    const guide: PriceGuide = { ...payload, source: 'remote', updatedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(guide));
    const status: GuideStatus = isExpired(guide)
      ? { state: 'expired', source: 'remote', message: 'Downloaded guide is expired. Please check the source.' }
      : { state: 'ok', source: 'remote' };
    return { guide, status };
  } catch (err) {
    console.warn('Failed to refresh price guide', err);
    const fallback = await loadCachedGuide();
    const guide = fallback || bundled;
    const status: GuideStatus = {
      state: 'error',
      source: guide.source || 'bundled',
      message: 'Unable to refresh price guide. Using cached/bundled copy.',
    };
    return { guide, status };
  }
}
