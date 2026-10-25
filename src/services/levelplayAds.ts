import { Capacitor, registerPlugin } from '@capacitor/core';
import type { LevelPlayAdsConfig } from './adsSettings';

/**
 * Unity LevelPlay mediation rewarded + interstitial ads for the native
 * (Capacitor) app.
 *
 * - On the website every function here is an inert no-op returning
 *   'UNAVAILABLE' — mediation only exists inside the Android app.
 * - The native side is a small in-house Capacitor plugin,
 *   `LevelPlayAdsBridge` (android/app/src/main/java/click/taskmint/app),
 *   wrapping the LevelPlay SDK 9.5.
 * - Nothing about the owner's LevelPlay account is hardcoded: the App
 *   Key and ad unit IDs arrive from the admin-panel config
 *   (`app_settings/ads`, see services/adsSettings.ts).
 * - Money rule: callers may credit the user ONLY when the result status
 *   is 'COMPLETED' (the native side reports COMPLETED only when the
 *   SDK's reward callback fired). LevelPlay only signals completion —
 *   the credit itself stays in the app (handleCreditCoins, plan ladder).
 */

interface LevelPlayAdsBridgePlugin {
  initialize(options: { appKey: string; userId: string }): Promise<void>;
  showRewarded(options: { adUnitId: string }): Promise<{ state: string }>;
  showInterstitial(options: { adUnitId: string }): Promise<void>;
}

const LevelPlayAdsBridge = registerPlugin<LevelPlayAdsBridgePlugin>('LevelPlayAdsBridge');

export type LevelPlayRewardedResult =
  /** The ad was watched to completion — the only result that may pay. */
  | { status: 'COMPLETED' }
  /** The user closed the ad before the reward callback. Never pays. */
  | { status: 'SKIPPED' }
  /** No ad could be shown (web, disabled, no fill, error, timeout). */
  | { status: 'UNAVAILABLE'; reason: string };

const INIT_TIMEOUT_MS = 20_000;
const SHOW_TIMEOUT_MS = 120_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

let initialisedFor: string | null = null;
let initialising: Promise<boolean> | null = null;
let lastInitError = '';

/**
 * Initialises the LevelPlay SDK once per app session for the given
 * config + user. Safe to call repeatedly. Returns false on web or on
 * any SDK failure; never throws.
 */
export async function initLevelPlayAds(config: LevelPlayAdsConfig, userId: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (!config.levelplayAppKey) return false;

  const key = `${config.levelplayAppKey}|${userId}`;
  if (initialisedFor === key) return true;
  if (!initialising) {
    initialising = (async () => {
      try {
        await withTimeout(
          LevelPlayAdsBridge.initialize({ appKey: config.levelplayAppKey, userId }),
          INIT_TIMEOUT_MS,
          'LevelPlay initialisation',
        );
        initialisedFor = key;
        lastInitError = '';
        return true;
      } catch (error) {
        console.warn('LevelPlay initialisation failed:', error);
        lastInitError = error instanceof Error ? error.message : String(error);
        return false;
      } finally {
        initialising = null;
      }
    })();
  }
  return initialising;
}

/**
 * Full rewarded flow: initialise (once) → load + show (native side).
 * Resolves with a LevelPlayRewardedResult and never throws.
 */
export async function showLevelPlayRewarded(
  config: LevelPlayAdsConfig,
  userId: string,
): Promise<LevelPlayRewardedResult> {
  if (!Capacitor.isNativePlatform()) {
    return { status: 'UNAVAILABLE', reason: 'LevelPlay ads are only available in the app.' };
  }
  if (!config.levelplayEnabled || !config.levelplayAppKey || !config.levelplayRewardedUnitId) {
    return { status: 'UNAVAILABLE', reason: 'LevelPlay ads are not configured.' };
  }

  try {
    const ready = await initLevelPlayAds(config, userId);
    if (!ready) {
      if (lastInitError) console.warn('LevelPlay init detail:', lastInitError);
      return {
        status: 'UNAVAILABLE',
        reason: 'LevelPlay could not be initialised. Please try again shortly.',
      };
    }

    const { state } = await withTimeout(
      LevelPlayAdsBridge.showRewarded({ adUnitId: config.levelplayRewardedUnitId }),
      SHOW_TIMEOUT_MS,
      'LevelPlay ad show',
    );
    return state === 'COMPLETED' ? { status: 'COMPLETED' } : { status: 'SKIPPED' };
  } catch (error) {
    // Raw SDK detail stays in logs; the user-facing reason stays clean.
    console.warn('LevelPlay rewarded ad failed:', error);
    const detail = error instanceof Error ? error.message : String(error);
    const noFill = /failed to load|no fill|no ad/i.test(detail);
    return {
      status: 'UNAVAILABLE',
      reason: noFill
        ? 'No ad is available at the moment. Please try again in a little while.'
        : 'The ad could not be shown right now. Please try again shortly.',
    };
  }
}

/**
 * Best-effort page-change interstitial via LevelPlay. Resolves true when
 * an interstitial was displayed; never throws and never pays.
 */
export async function showLevelPlayInterstitial(
  config: LevelPlayAdsConfig,
  userId: string,
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (!config.levelplayEnabled || !config.levelplayAppKey || !config.levelplayInterstitialUnitId) {
    return false;
  }
  try {
    const ready = await initLevelPlayAds(config, userId);
    if (!ready) return false;
    await withTimeout(
      LevelPlayAdsBridge.showInterstitial({ adUnitId: config.levelplayInterstitialUnitId }),
      SHOW_TIMEOUT_MS,
      'LevelPlay interstitial',
    );
    return true;
  } catch (error) {
    console.warn('LevelPlay interstitial skipped:', error);
    return false;
  }
}
