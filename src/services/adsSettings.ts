import { doc, getDoc } from 'firebase/firestore';
import { get, ref } from 'firebase/database';
import { db, rtdb } from '../firebase';

/**
 * Admin-panel-driven ads configuration.
 *
 * The owner controls ad networks from the admin panel, which writes the
 * Firestore document `app_settings/ads`. This module reads that document
 * once per app session (the result is cached) and hands the rest of the
 * app a fully-defaulted config — a missing document or missing fields can
 * never break the app; they simply leave features disabled.
 *
 * Fallback: the same settings are mirrored in the Realtime Database at
 * `app_settings/ads`. If the Firestore document is missing, unreadable
 * (for example during a Firestore quota outage), or does not enable
 * Unity with a game ID, the RTDB copy is used instead — RTDB has no
 * daily read quota, so ads stay live even when Firestore is down.
 *
 * Nothing here is specific to one network's account: the Unity game ID,
 * placement IDs, reward and limits all come from the panel document.
 */

export interface UnityAdsConfig {
  /** Master switch from the admin panel. */
  unityEnabled: boolean;
  /** Unity Ads game ID for this app (Android project in Unity Dashboard). */
  unityGameId: string;
  /** Rewarded placement / ad unit ID. Default: "Rewarded_Android". */
  unityRewardedPlacementId: string;
  /** Interstitial placement ID — stored for future use, not wired yet. */
  unityInterstitialPlacementId: string;
  /** Unity test mode (test ads while the owner sets things up). */
  unityTestMode: boolean;
  /** Rs. credited to the user for one completed rewarded view. */
  unityRewardAmount: number;
  /** Max rewarded views per user per day. 0 = unlimited. */
  unityDailyLimit: number;
}

export const DEFAULT_REWARDED_PLACEMENT_ID = 'Rewarded_Android';
export const DEFAULT_INTERSTITIAL_PLACEMENT_ID = 'Interstitial_Android';

export const UNITY_CONFIG_DEFAULTS: UnityAdsConfig = {
  unityEnabled: false,
  unityGameId: '',
  unityRewardedPlacementId: DEFAULT_REWARDED_PLACEMENT_ID,
  unityInterstitialPlacementId: DEFAULT_INTERSTITIAL_PLACEMENT_ID,
  unityTestMode: false,
  unityRewardAmount: 0,
  unityDailyLimit: 0,
};

function toConfig(data: Record<string, any> | undefined): UnityAdsConfig {
  const d = data || {};
  const str = (v: any, fallback: string) =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;
  const num = (v: any, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return {
    unityEnabled: d.unityEnabled === true,
    unityGameId: str(d.unityGameId, ''),
    unityRewardedPlacementId: str(
      d.unityRewardedPlacementId,
      DEFAULT_REWARDED_PLACEMENT_ID,
    ),
    unityInterstitialPlacementId: str(
      d.unityInterstitialPlacementId,
      DEFAULT_INTERSTITIAL_PLACEMENT_ID,
    ),
    unityTestMode: d.unityTestMode === true,
    unityRewardAmount: Math.max(0, num(d.unityRewardAmount, 0)),
    unityDailyLimit: Math.max(0, Math.floor(num(d.unityDailyLimit, 0))),
  };
}

let cachedConfig: UnityAdsConfig | null = null;
let inflight: Promise<UnityAdsConfig> | null = null;

async function readFirestoreConfig(): Promise<UnityAdsConfig | null> {
  try {
    const snap = await getDoc(doc(db, 'app_settings', 'ads'));
    if (!snap.exists()) return null;
    return toConfig(snap.data() as Record<string, any>);
  } catch (error) {
    console.warn('Ads settings (Firestore) could not be loaded:', error);
    return null;
  }
}

async function readRtdbConfig(): Promise<UnityAdsConfig | null> {
  try {
    const snap = await get(ref(rtdb, 'app_settings/ads'));
    if (!snap.exists()) return null;
    return toConfig(snap.val() as Record<string, any>);
  } catch (error) {
    console.warn('Ads settings (RTDB) could not be loaded:', error);
    return null;
  }
}

/**
 * Returns the session-cached ads config. The Firestore document
 * `app_settings/ads` is the primary source; the RTDB mirror at
 * `app_settings/ads` is used whenever the Firestore copy is missing,
 * unreadable, or does not enable Unity. Never throws — total failure
 * falls back to defaults (everything disabled).
 */
export async function getUnityAdsConfig(): Promise<UnityAdsConfig> {
  if (cachedConfig) return cachedConfig;
  if (!inflight) {
    inflight = (async () => {
      const fromFirestore = await readFirestoreConfig();
      if (fromFirestore && isUnityConfigured(fromFirestore)) {
        cachedConfig = fromFirestore;
        return cachedConfig;
      }
      const fromRtdb = await readRtdbConfig();
      if (fromRtdb && isUnityConfigured(fromRtdb)) {
        cachedConfig = fromRtdb;
        return cachedConfig;
      }
      cachedConfig =
        fromFirestore || fromRtdb || { ...UNITY_CONFIG_DEFAULTS };
      return cachedConfig;
    })();
  }
  return inflight;
}

/** True when Unity rewarded ads should be offered at all. */
export function isUnityConfigured(config: UnityAdsConfig): boolean {
  return config.unityEnabled && config.unityGameId.trim().length > 0;
}
