import { Capacitor } from '@capacitor/core';

/**
 * In-app update check for the native (Capacitor) app.
 *
 * - The website never checks: this module only runs on native platforms.
 * - The latest version is read from the GitHub Releases API for
 *   earnhalal/TaskMint (`/releases/latest`); the download URL is the APK
 *   asset attached to that release (falling back to the
 *   `releases/latest/download/...` magic URL).
 * - Checks are cached in localStorage and run at most once every 6 hours.
 * - Never throws: any failure (offline, rate limit, unexpected payload)
 *   silently returns `null` so the app UI is never disturbed.
 */

export const APP_VERSION = '1.14';

const LATEST_RELEASE_API =
  'https://api.github.com/repos/earnhalal/TaskMint/releases/latest';
const LATEST_APK_URL =
  'https://github.com/earnhalal/TaskMint/releases/latest/download/TaskMint.apk';

const LAST_CHECK_KEY = 'tm_update_last_check';
const CACHED_RESULT_KEY = 'tm_update_cached_result';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface UpdateInfo {
  latestVersion: string;
  downloadUrl: string;
}

/** Compare dotted numeric versions: returns true when `a` is newer than `b`. */
function isNewerVersion(a: string, b: string): boolean {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    if (!Capacitor.isNativePlatform()) return null;

    // Respect the 6-hour cache: return the cached result (which may be
    // "no update") instead of calling the API again.
    try {
      const lastCheck = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);
      if (lastCheck && Date.now() - lastCheck < CHECK_INTERVAL_MS) {
        const cached = localStorage.getItem(CACHED_RESULT_KEY);
        return cached ? (JSON.parse(cached) as UpdateInfo) : null;
      }
    } catch {
      // localStorage unavailable — fall through and check live.
    }

    const response = await fetch(LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) return null;
    const data: any = await response.json();

    const latestVersion = String(data?.tag_name || '').replace(/^v/i, '').trim();
    let result: UpdateInfo | null = null;

    if (latestVersion && isNewerVersion(latestVersion, APP_VERSION)) {
      let downloadUrl = LATEST_APK_URL;
      const assets = Array.isArray(data?.assets) ? data.assets : [];
      const apkAsset = assets.find(
        (a: any) => typeof a?.name === 'string' && a.name.toLowerCase().endsWith('.apk'),
      );
      if (apkAsset?.browser_download_url) downloadUrl = apkAsset.browser_download_url;
      result = { latestVersion, downloadUrl };
    }

    try {
      localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
      if (result) localStorage.setItem(CACHED_RESULT_KEY, JSON.stringify(result));
      else localStorage.removeItem(CACHED_RESULT_KEY);
    } catch {
      // Caching is best-effort only.
    }

    return result;
  } catch {
    return null;
  }
}
