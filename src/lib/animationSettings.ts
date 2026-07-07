/**
 * Client-side animation settings store (localStorage).
 * Admin panel writes here. Consumers read via useAnimationSettings().
 *
 * Cross-tab sync via `storage` event + intra-tab sync via CustomEvent.
 */
import { useEffect, useState } from 'react';
import deliveryBoy from '@/assets/delivery-boy.png';
import deliveryTruck from '@/assets/delivery-truck.png';

export type HeroStyle = 'cinematic' | 'kenBurns' | 'crossfade' | 'staticSplit';
export type DeliveryStyle = 'classic' | 'neon' | 'minimal';
export type FlashSaleStyle = 'pulse' | 'glow' | 'marquee' | 'plain';
export type PerfMode = 'auto' | 'high' | 'low';
export type Speed = 'slow' | 'normal' | 'fast';

export type StickerAnimation =
  | 'floatY'
  | 'bounce'
  | 'driveAcross'
  | 'spin'
  | 'wobble'
  | 'orbit'
  | 'pulse'
  | 'swing';

export interface StickerConfig {
  id: string;
  name: string;
  imageUrl: string; // http URL or data: URL
  enabled: boolean;
  animation: StickerAnimation;
  sizePx: number;         // 24 - 160
  xPercent: number;       // 0 - 100 (left)
  yPercent: number;       // 0 - 100 (top)
  durationSec: number;    // 2 - 40
  opacity: number;        // 0.1 - 1
  rotateDeg: number;      // -180 - 180
}

export interface AnimationSettings {
  version: 2;
  performance: PerfMode;
  hero: {
    enabled: boolean;
    style: HeroStyle;
    speed: Speed;
  };
  deliveryRoad: {
    enabled: boolean;
    style: DeliveryStyle;
    speed: Speed;
    showTruck: boolean;
    showScooter: boolean;
  };
  flashSale: {
    style: FlashSaleStyle;
  };
  stickers: StickerConfig[];
}

const KEY = 'trendra:animation-settings:v2';
const EVT = 'trendra:animation-settings-change';

export const DEFAULT_SETTINGS: AnimationSettings = {
  version: 2,
  performance: 'auto',
  hero: { enabled: true, style: 'cinematic', speed: 'normal' },
  deliveryRoad: {
    enabled: true,
    style: 'classic',
    speed: 'normal',
    showTruck: true,
    showScooter: true,
  },
  flashSale: { style: 'pulse' },
  stickers: [
    {
      id: 'sticker-boy',
      name: 'Delivery Boy',
      imageUrl: deliveryBoy,
      enabled: false,
      animation: 'floatY',
      sizePx: 72,
      xPercent: 8,
      yPercent: 70,
      durationSec: 4,
      opacity: 1,
      rotateDeg: 0,
    },
    {
      id: 'sticker-truck',
      name: 'Delivery Truck',
      imageUrl: deliveryTruck,
      enabled: false,
      animation: 'driveAcross',
      sizePx: 88,
      xPercent: 0,
      yPercent: 85,
      durationSec: 18,
      opacity: 1,
      rotateDeg: 0,
    },
  ],
};

export const loadSettings = (): AnimationSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // shallow-merge to survive schema additions
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      hero: { ...DEFAULT_SETTINGS.hero, ...(parsed.hero || {}) },
      deliveryRoad: { ...DEFAULT_SETTINGS.deliveryRoad, ...(parsed.deliveryRoad || {}) },
      flashSale: { ...DEFAULT_SETTINGS.flashSale, ...(parsed.flashSale || {}) },
      stickers: Array.isArray(parsed.stickers) ? parsed.stickers : DEFAULT_SETTINGS.stickers,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (s: AnimationSettings) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch (e) {
    console.warn('[animationSettings] save failed', e);
  }
};

export const resetSettings = () => saveSettings(DEFAULT_SETTINGS);

/** Reactive subscription. */
export const useAnimationSettings = () => {
  const [settings, setSettings] = useState<AnimationSettings>(() => loadSettings());

  useEffect(() => {
    const sync = () => setSettings(loadSettings());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return settings;
};

/**
 * Detects if the device is likely to struggle with heavy animation.
 * Rough heuristics: low CPU cores, low memory, save-data, slow connection,
 * or user prefers-reduced-motion.
 */
export const detectLowPowerDevice = (): { low: boolean; reason: string } => {
  if (typeof window === 'undefined') return { low: false, reason: 'ssr' };
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const reasons: string[] = [];
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) reasons.push('reduced-motion');
  if ((nav.hardwareConcurrency ?? 8) <= 4) reasons.push(`cpu:${nav.hardwareConcurrency ?? '?'}`);
  if ((nav.deviceMemory ?? 8) <= 3) reasons.push(`ram:${nav.deviceMemory ?? '?'}GB`);
  if (nav.connection?.saveData) reasons.push('save-data');
  if (nav.connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(nav.connection.effectiveType)) {
    reasons.push(`net:${nav.connection.effectiveType}`);
  }
  return { low: reasons.length >= 2, reason: reasons.join(', ') || 'ok' };
};

/** Resolves whether heavy animations should run given user setting + device. */
export const useEffectivePerformance = () => {
  const { performance: mode } = useAnimationSettings();
  const [detected] = useState(() => detectLowPowerDevice());
  const low =
    mode === 'low' ||
    (mode === 'auto' && detected.low);
  return { low, mode, detected };
};

export const speedFactor = (s: Speed) => (s === 'slow' ? 1.5 : s === 'fast' ? 0.6 : 1);
