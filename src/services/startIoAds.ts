import { Capacitor, registerPlugin } from '@capacitor/core';
import type { StartIoAdsConfig } from './adsSettings';

/**
 * Start.io (StartApp) rewarded ads for the native (Capacitor) app.
 *
 * - On the website every function here is an inert no-op returning
 *   'UNAVAILABLE' — the website build has no Start.io SDK and never shows
 *   Start.io UI (callers also gate on `Capacitor.isNativePlatform()`).
 * - The native side is a small in-house Capacitor plugin,
 *   `StartIoAdsBridge` (android/app/src/main/java/click/taskmint/app),
 *   wrapping the Start.io InApp SDK 5.x.
 * - Nothing about the owner's Start.io account is hardcoded: the app ID
 *   and test mode arrive from the admin-panel config (`app_settings/ads`,
 *   see services/adsSettings.ts).
 * - Money rule: callers may credit the user ONLY when the result status
 *   is 'COMPLETED' (the native side reports COMPLETED only when the
 *   video actually played to its end). 'SKIPPED' and 'UNAVAILABLE'
 *   never pay.
 */

interface StartIoAdsBridgePlugin {
  initialize(options: { appId: string; testMode: boolean }): Promise<void>;
  showRewarded(): Promise<{ state: string }>;
  resetPending(): Promise<void>;
}

const StartIoAdsBridge = registerPlugin<StartIoAdsBridgePlugin>('StartIoAdsBridge');

export type StartIoRewardedResult =
  /** The ad was watched to completion — the only result that may pay. */
  | { status: 'COMPLETED' }
  /** The user closed the ad before it finished. Never pays. */
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
 * Initialises the Start.io SDK once per app session for the given
 * config. Safe to call repeatedly. Returns false on web or on any SDK
 * failure; never throws.
 */
export async function initStartIoAds(config: StartIoAdsConfig): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (!config.startioAppId) return false;

  const key = `${config.startioAppId}|${config.startioTestMode ? 'test' : 'live'}`;
  if (initialisedFor === key) return true;
  if (!initialising) {
    initialising = (async () => {
      try {
        await withTimeout(
          StartIoAdsBridge.initialize({
            appId: config.startioAppId,
            testMode: config.startioTestMode,
          }),
          INIT_TIMEOUT_MS,
          'Start.io initialisation',
        );
        initialisedFor = key;
        lastInitError = '';
        return true;
      } catch (error) {
        console.warn('Start.io initialisation failed:', error);
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
 * Resolves with a StartIoRewardedResult and never throws.
 */
export async function showStartIoRewarded(
  config: StartIoAdsConfig,
): Promise<StartIoRewardedResult> {
  if (!Capacitor.isNativePlatform()) {
    return { status: 'UNAVAILABLE', reason: 'Start.io ads are only available in the app.' };
  }
  if (!config.startioEnabled || !config.startioAppId) {
    return { status: 'UNAVAILABLE', reason: 'Start.io ads are not configured.' };
  }

  try {
    const ready = await initStartIoAds(config);
    if (!ready) {
      return {
        status: 'UNAVAILABLE',
        reason: lastInitError
          ? `Start.io could not be initialised. (${lastInitError})`
          : 'Start.io could not be initialised.',
      };
    }

    let state: string;
    try {
      ({ state } = await withTimeout(
        StartIoAdsBridge.showRewarded(),
        SHOW_TIMEOUT_MS,
        'Start.io ad show',
      ));
    } catch (showError) {
      // Un-poison the native side so the next attempt can proceed.
      try { await StartIoAdsBridge.resetPending(); } catch {}
      throw showError;
    }
    return state === 'COMPLETED'
      ? { status: 'COMPLETED' }
      : { status: 'SKIPPED' };
  } catch (error) {
    console.warn('Start.io rewarded ad failed:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return {
      status: 'UNAVAILABLE',
      reason: `No Start.io ad is available right now. (${detail})`,
    };
  }
}
