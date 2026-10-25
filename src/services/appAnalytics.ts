import { Capacitor } from '@capacitor/core';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ref,
  update,
  get,
  increment as rtdbIncrement,
} from 'firebase/database';
import { doc, getDoc, updateDoc, increment as fsIncrement } from 'firebase/firestore';
import { auth, db, rtdb } from '../firebase';
import { APP_VERSION } from './appUpdate';

/**
 * App usage analytics for the admin panel's App Analytics page.
 *
 * Native app only — the website records nothing. Everything is
 * best-effort and wrapped so an analytics failure can never disturb
 * the app itself.
 *
 * What is recorded (per signed-in user):
 * - RTDB `users/{uid}/appUsage` — the live record:
 *   { firstAppOpenAt, lastAppOpenAt, appVersion, opens, sessions,
 *     totalTimeSec, lastSessionAt }
 * - RTDB `users/{uid}/liveAt` — a heartbeat timestamp refreshed every
 *   60 seconds while the app is in the foreground; the panel treats a
 *   heartbeat younger than ~2 minutes as "online now". RTDB-only on
 *   purpose: heartbeats must never burn Firestore write quota.
 * - Firestore user doc `appUsage` map — a mirror of the aggregates,
 *   updated on app open and on session end (a few writes per user per
 *   day), which is what the panel page reads.
 *
 * A "session" runs from the app coming to the foreground until it is
 * hidden/backgrounded; sessions shorter than 5 seconds are ignored.
 * An honest limit: an app cannot detect its own uninstall, so the
 * panel labels users inactive for 30+ days as "likely uninstalled"
 * instead of claiming an uninstall count.
 */

const HEARTBEAT_MS = 60_000;
const MIN_SESSION_SEC = 5;

let startedForUid: string | null = null;
let sessionStartMs: number | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let listenersAttached = false;

function rtdbUsageRef(uid: string) {
  return ref(rtdb, `users/${uid}/appUsage`);
}

async function writeLiveAt(uid: string): Promise<void> {
  try {
    await update(ref(rtdb, `users/${uid}`), { liveAt: Date.now() });
  } catch {
    /* best-effort */
  }
}

async function recordAppOpen(uid: string): Promise<void> {
  const now = Date.now();
  try {
    const snap = await get(rtdbUsageRef(uid));
    const existing = (snap.val() || {}) as { firstAppOpenAt?: number };
    const patch: Record<string, unknown> = {
      lastAppOpenAt: now,
      appVersion: APP_VERSION,
      opens: rtdbIncrement(1),
    };
    if (!existing.firstAppOpenAt) patch.firstAppOpenAt = now;
    await update(rtdbUsageRef(uid), patch);
  } catch {
    /* best-effort */
  }
  try {
    const userDoc = doc(db, 'users', uid);
    const snap = await getDoc(userDoc);
    const usage = (snap.data()?.appUsage || {}) as { firstAppOpenAt?: number };
    const patch: Record<string, unknown> = {
      'appUsage.lastAppOpenAt': now,
      'appUsage.appVersion': APP_VERSION,
      'appUsage.opens': fsIncrement(1),
    };
    if (!usage.firstAppOpenAt) patch['appUsage.firstAppOpenAt'] = now;
    await updateDoc(userDoc, patch);
  } catch {
    /* best-effort */
  }
}

async function recordSessionEnd(uid: string): Promise<void> {
  if (sessionStartMs === null) return;
  const durationSec = Math.round((Date.now() - sessionStartMs) / 1000);
  sessionStartMs = null;
  if (durationSec < MIN_SESSION_SEC) return;
  const now = Date.now();
  try {
    await update(rtdbUsageRef(uid), {
      sessions: rtdbIncrement(1),
      totalTimeSec: rtdbIncrement(durationSec),
      lastSessionAt: now,
    });
  } catch {
    /* best-effort */
  }
  try {
    await updateDoc(doc(db, 'users', uid), {
      'appUsage.sessions': fsIncrement(1),
      'appUsage.totalTimeSec': fsIncrement(durationSec),
      'appUsage.lastSessionAt': now,
    });
  } catch {
    /* best-effort */
  }
}

function beginSession(uid: string): void {
  if (sessionStartMs === null) sessionStartMs = Date.now();
  void writeLiveAt(uid);
}

function attachListeners(uid: string): void {
  if (listenersAttached) return;
  listenersAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (!startedForUid) return;
    if (document.visibilityState === 'hidden') {
      void recordSessionEnd(startedForUid);
    } else {
      beginSession(startedForUid);
    }
  });
  window.addEventListener('pagehide', () => {
    if (startedForUid) void recordSessionEnd(startedForUid);
  });
}

function start(uid: string): void {
  if (startedForUid === uid) return;
  stop();
  startedForUid = uid;
  void recordAppOpen(uid);
  beginSession(uid);
  attachListeners(uid);
  heartbeatTimer = setInterval(() => {
    if (startedForUid && document.visibilityState === 'visible') {
      void writeLiveAt(startedForUid);
    }
  }, HEARTBEAT_MS);
}

function stop(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (startedForUid) void recordSessionEnd(startedForUid);
  startedForUid = null;
  sessionStartMs = null;
}

let bootstrapped = false;

/** Call once at app startup (main.tsx). No-op on the website. */
export function startAppAnalytics(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  if (!Capacitor.isNativePlatform()) return;
  onAuthStateChanged(auth, (user) => {
    if (user) start(user.uid);
    else stop();
  });
}
