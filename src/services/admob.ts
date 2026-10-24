import { Capacitor } from '@capacitor/core';

/**
 * AdMob initialisation for the native (Capacitor) app only.
 *
 * - On the website this module is a no-op: the website build is completely
 *   unaffected.
 * - The native app currently uses Google's TEST ad configuration only
 *   (test App ID in AndroidManifest.xml). No real ad units exist yet.
 * - Ads must never be placed in the watch-earn / rewarded flow. This module
 *   only initialises the SDK; it does not show any ad.
 */

let initialised = false;

export async function initAdMob(): Promise<void> {
  if (initialised) return;
  if (!Capacitor.isNativePlatform()) return;
  initialised = true;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.initialize({
      initializeForTesting: true,
    });
  } catch (error) {
    // Ad initialisation must never break the app itself.
    console.warn('AdMob initialisation skipped:', error);
  }
}

/**
 * TEST HELPER ONLY — loads and shows a single Google test interstitial.
 * Not wired into any user flow. Use it on a real device to verify that the
 * AdMob SDK and the test App ID are working, then remove or gate it before
 * release. Never call this from the watch-earn / reward flow.
 */
export async function showTestInterstitial(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.prepareInterstitial({
      // Google's public test interstitial ad unit (Android).
      adId: 'ca-app-pub-3940256099942544/1033173712',
      isTesting: true,
    });
    await AdMob.showInterstitial();
  } catch (error) {
    console.warn('Test interstitial failed:', error);
  }
}
