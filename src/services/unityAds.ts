import { Capacitor, registerPlugin } from '@capacitor/core';
import type { UnityAdsConfig } from './adsSettings';

/**
 * Unity Ads (rewarded) for the native (Capacitor) app.
 *
 * - On the website every function here is an inert no-op returning
 *   'UNAVAILABLE' — the website build has no Unity SDK and never shows
 *   Unity UI (callers also gate on `Capacitor.isNativePlatform()`).
 * - The native side is a small in-house Capacitor plugin,
 *   `UnityAdsBridge` (android/app/src/main/java/click/taskmint/app),
 *   wrapping the Unity Ads SDK 4.x.
 * - Nothing about the owner's Unity account is hardcoded: the game ID,
 *   placement ID and test mode arrive from the admin-panel config
 *   (`app_settings/ads`, see services/adsSettings.ts).
 * - Money rule: callers may credit the user ONLY when the result status
 *   is 'COMPLETED'. 'SKIPPED' (user closed the ad early) and
 *   'UNAVAILABLE' (not native, not configured, no fill, SDK error,
 *   timeout) never pay.
 */

interface UnityAdsBridgePlugin {
  initialize(options: { gameId: string; testMode: boolean }): Promise<void>;
  load(options: { placementId: string }): Promise<void>;
  isReady(options: { placementId: string }): Promise<{ ready: boolean }>;
  show(options: { placementId: string }): Promise<{ state: string }>;
}

const UnityAdsBridge = registerPlugin<UnityAdsBridgePlugin>('UnityAdsBridge');

export type UnityRewardedResult =
  /** The ad was watched to completion — the only result that may pay. */
  | { status: 'COMPLETED' }
  /** The user closed the ad before it finished. Never pays. */
  | { status: 'SKIPPED' }
  /** No ad could be shown (web, disabled, no fill, error, timeout). */
  | { status: 'UNAVAILABLE'; reason: string };

const INIT_TIMEOUT_MS = 20_000;
const LOAD_TIMEOUT_MS = 30_000;

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
 * Initialises the Unity Ads SDK once per app session for the given
 * config. Safe to call repeatedly — later calls are no-ops when the same
 * game ID / test mode was already initialised. Returns false on web or
 * on any SDK failure; never throws.
 */
async function tryInitialiseOnce(config: UnityAdsConfig): Promise<void> {
  await withTimeout(
    UnityAdsBridge.initialize({
      gameId: config.unityGameId,
      testMode: config.unityTestMode,
    }),
    INIT_TIMEOUT_MS,
    'Unity Ads initialisation',
  );
}

export async function initUnityAds(config: UnityAdsConfig): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (!config.unityGameId) return false;

  const key = `${config.unityGameId}|${config.unityTestMode ? 'test' : 'live'}`;
  if (initialisedFor === key) return true;
  if (!initialising) {
    initialising = (async () => {
      try {
        await tryInitialiseOnce(config);
        initialisedFor = key;
        lastInitError = '';
        return true;
      } catch (firstError) {
        // One retry after a short pause: first-launch initialisation can
        // fail on a transient network hiccup while the SDK warms up.
        console.warn('Unity Ads initialisation failed, retrying:', firstError);
        await new Promise((resolve) => setTimeout(resolve, 2500));
        try {
          await tryInitialiseOnce(config);
          initialisedFor = key;
          lastInitError = '';
          return true;
        } catch (error) {
          console.warn('Unity Ads initialisation failed:', error);
          lastInitError =
            error instanceof Error ? error.message : String(error);
          return false;
        }
      } finally {
        initialising = null;
      }
    })();
  }
  return initialising;
}

/**
 * Interstitial flow for page transitions (owner's spec: an ad is shown
 * when the user opens another section of the app). Best-effort and
 * reward-free by design: resolves true when an ad was shown, false when
 * unavailable — callers must never block navigation on it.
 */
export async function showUnityInterstitial(
  config: UnityAdsConfig,
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (!config.unityEnabled || !config.unityGameId) return false;
  const placementId =
    config.unityInterstitialPlacementId || 'Interstitial_Android';
  try {
    const ready = await initUnityAds(config);
    if (!ready) return false;
    await withTimeout(
      UnityAdsBridge.load({ placementId }),
      LOAD_TIMEOUT_MS,
      'Unity interstitial load',
    );
    await UnityAdsBridge.show({ placementId });
    return true;
  } catch (error) {
    console.warn('Unity interstitial failed:', error);
    return false;
  }
}

/**
 * Full rewarded flow: initialise (once) → load → show.
 *
 * Resolves with a UnityRewardedResult and never throws, so the UI layer
 * only has to branch on the status.
 */
export async function showUnityRewarded(
  config: UnityAdsConfig,
): Promise<UnityRewardedResult> {
  if (!Capacitor.isNativePlatform()) {
    return { status: 'UNAVAILABLE', reason: 'Unity ads are only available in the app.' };
  }
  if (!config.unityEnabled || !config.unityGameId) {
    return { status: 'UNAVAILABLE', reason: 'Unity ads are not configured.' };
  }

  const placementId =
    config.unityRewardedPlacementId || 'Rewarded_Android';

  try {
    const ready = await initUnityAds(config);
    if (!ready) {
      return {
        status: 'UNAVAILABLE',
        reason: lastInitError
          ? `Unity Ads could not be initialised. (${lastInitError})`
          : 'Unity Ads could not be initialised.',
      };
    }

    await withTimeout(
      UnityAdsBridge.load({ placementId }),
      LOAD_TIMEOUT_MS,
      'Unity ad load',
    );

    const { state } = await UnityAdsBridge.show({ placementId });
    return state === 'COMPLETED'
      ? { status: 'COMPLETED' }
      : { status: 'SKIPPED' };
  } catch (error) {
    console.warn('Unity rewarded ad failed:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return {
      status: 'UNAVAILABLE',
      reason: `No Unity ad is available right now. (${detail})`,
    };
  }
}
