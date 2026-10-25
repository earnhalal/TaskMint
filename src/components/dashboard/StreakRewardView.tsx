import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import {
  ArrowLeft, Check, Lock, Gift, Flame, PlayCircle, Clock, Sparkles,
  Loader2, CalendarDays, Zap,
} from 'lucide-react';
import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore';
import { ref as rtdbRef, get as rtdbGet, update as rtdbUpdate } from 'firebase/database';
import { auth, db, rtdb } from '../../firebase';
import { getAdsConfig, isUnityConfigured, isStartIoConfigured } from '../../services/adsSettings';
import { showUnityRewarded } from '../../services/unityAds';
import { showStartIoRewarded } from '../../services/startIoAds';

/**
 * Streak Rewards (renamed from "Streak Vault", redesigned 2026-10-25).
 *
 * Owner's rules:
 * - One streak claim per 24 hours (a rolling window, not midnight).
 * - To claim, the user first watches a rewarded ad to the end (Unity,
 *   falling back to Start.io). Only a COMPLETED ad unlocks the claim.
 * - The reward is credited instantly in Gold Coins: a weighted
 *   random 100–500 on normal days (mostly 100–200), and a weighted
 *   random 1,000–2,000 on the last 5 days of the month.
 * - State lives on the Firestore user doc (streakCount, streakMonthKey,
 *   lastStreakClaimAt), so it follows the account across devices.
 */

interface StreakRewardViewProps {
  onBack: () => void;
  onCreditCoins: (coins: number, source?: string, description?: string) => Promise<boolean>;
  accountStatus: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function weightedPick(table: Array<[number, number]>): number {
  const total = table.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [value, w] of table) {
    r -= w;
    if (r <= 0) return value;
  }
  return table[0][0];
}

/** Normal days: 100–500 Gold Coins, mostly 100–200. */
const rollStreakReward = () =>
  weightedPick([[100, 45], [200, 30], [300, 12], [400, 8], [500, 5]]);

/** Last 5 days of the month: 1,000–2,000 Gold Coins, mostly 1,000–1,300. */
const rollMonthEndReward = () =>
  weightedPick([
    [1000, 18], [1100, 16], [1200, 14], [1300, 12], [1400, 10], [1500, 8],
    [1600, 6], [1700, 5], [1800, 4], [1900, 3], [2000, 2],
  ]);

export default function StreakRewardView({ onBack, onCreditCoins, accountStatus }: StreakRewardViewProps) {
  const [loading, setLoading] = useState(true);
  const [streakCount, setStreakCount] = useState(0);
  const [lastClaimAt, setLastClaimAt] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const nowDate = useMemo(() => new Date(now), [now]);
  const daysInMonth = useMemo(
    () => new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).getDate(),
    [nowDate],
  );
  const isMonthEndBoost = nowDate.getDate() > daysInMonth - 5;
  const monthKey = `${nowDate.getFullYear()}-${nowDate.getMonth() + 1}`;
  const monthName = nowDate.toLocaleString('en-US', { month: 'long' });

  const nextClaimAt = lastClaimAt ? lastClaimAt + DAY_MS : 0;
  const canClaimNow = !lastClaimAt || now >= nextClaimAt;
  const remainingMs = Math.max(0, nextClaimAt - now);
  const countdown = useMemo(() => {
    const s = Math.floor(remainingMs / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }, [remainingMs]);

  // Load streak state: the RTDB mirror is the primary source (it is
  // written by the same claim flow and was never blocked by the old
  // Firestore rules), the Firestore user doc is the fallback. Whichever
  // carries the LATER lastStreakClaimAt wins. A completed ad unlock is
  // also persisted per claim window, so leaving and returning to this
  // page never asks the user to watch the ad again.
  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        let fsState: any = null;
        let rtState: any = null;
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) fsState = snap.data();
        } catch { /* fall through to RTDB */ }
        try {
          const snap = await rtdbGet(rtdbRef(rtdb, `users/${uid}/streakState`));
          if (snap.exists()) rtState = snap.val();
        } catch { /* fall through */ }
        const pick = (rtState?.lastStreakClaimAt || 0) >= (fsState?.lastStreakClaimAt || 0) ? (rtState || fsState) : fsState;
        if (pick) {
          setStreakCount(pick.streakMonthKey === monthKey ? Number(pick.streakCount || 0) : 0);
          const last = typeof pick.lastStreakClaimAt === 'number' ? pick.lastStreakClaimAt : null;
          setLastClaimAt(last);
          try {
            const saved = localStorage.getItem(`tm_streak_unlocked_${uid}`);
            if (saved !== null && Number(saved) === (last || 0)) setUnlocked(true);
          } catch { /* storage unavailable */ }
        }
      } catch (error) {
        console.error('Error loading streak state:', error);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1-second ticker for the countdown.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleWatchAd = async () => {
    if (adBusy || unlocked || !canClaimNow) return;
    if (!Capacitor.isNativePlatform()) {
      setMessage({ type: 'error', text: 'Streak ads play in the TaskMint app. Download the app to claim streak rewards.' });
      return;
    }
    setAdBusy(true);
    setMessage(null);
    try {
      const config = await getAdsConfig();
      // Try Unity first, then Start.io — whichever completes unlocks.
      let completed = false;
      let lastReason = '';
      if (isUnityConfigured(config)) {
        const r = await showUnityRewarded(config);
        completed = r.status === 'COMPLETED';
        if (r.status === 'UNAVAILABLE') lastReason = r.reason;
        if (r.status === 'SKIPPED') {
          setMessage({ type: 'error', text: 'Ad closed early — watch the full ad to unlock your streak reward.' });
          return;
        }
      }
      if (!completed && isStartIoConfigured(config)) {
        const r = await showStartIoRewarded(config);
        completed = r.status === 'COMPLETED';
        if (r.status === 'UNAVAILABLE') lastReason = r.reason;
        if (r.status === 'SKIPPED') {
          setMessage({ type: 'error', text: 'Ad closed early — watch the full ad to unlock your streak reward.' });
          return;
        }
      }
      if (completed) {
        setUnlocked(true);
        try {
          const uid = auth.currentUser?.uid;
          if (uid) localStorage.setItem(`tm_streak_unlocked_${uid}`, String(lastClaimAt || 0));
        } catch { /* storage unavailable */ }
        setMessage({ type: 'success', text: 'Ad completed — your streak reward is unlocked. Claim it now!' });
      } else {
        setMessage({ type: 'error', text: lastReason || 'No ad is available right now. Please try again in a little while.' });
      }
    } finally {
      setAdBusy(false);
    }
  };

  const handleClaim = async () => {
    if (!unlocked || claiming || !canClaimNow) return;
    if (accountStatus.toLowerCase() !== 'active') {
      setMessage({ type: 'error', text: 'Your account is not active, so the reward cannot be added to your balance.' });
      return;
    }
    setClaiming(true);
    setMessage(null);
    const uid = auth.currentUser?.uid;
    const claimedAt = Date.now();
    const newCount = streakCount + 1;
    const amount = isMonthEndBoost ? rollMonthEndReward() : rollStreakReward();
    let stamped = false;
    try {
      // 1. Persist the claim FIRST (both stores), so the 24-hour timer
      // survives leaving the page — previously the balance was credited
      // first and a failed save silently re-opened the claim.
      if (uid) {
        await setDoc(
          doc(db, 'users', uid),
          { streakCount: newCount, streakMonthKey: monthKey, lastStreakClaimAt: claimedAt },
          { merge: true },
        );
        await rtdbUpdate(rtdbRef(rtdb, `users/${uid}/streakState`), {
          streakCount: newCount, streakMonthKey: monthKey, lastStreakClaimAt: claimedAt,
        }).catch(() => {});
        stamped = true;
      }
      // 2. Credit the reward. If the credit fails, roll the stamp back
      // so the user does not lose the claim.
      const credited = await onCreditCoins(
        amount,
        'streak_reward',
        `Daily streak reward — day ${newCount} of ${monthName}`,
      );
      if (!credited) {
        if (uid && stamped) {
          const rollback = lastClaimAt
            ? { streakCount, streakMonthKey: monthKey, lastStreakClaimAt: lastClaimAt }
            : { streakCount: 0, streakMonthKey: monthKey, lastStreakClaimAt: deleteField() };
          await setDoc(doc(db, 'users', uid), rollback, { merge: true }).catch(() => {});
          await rtdbUpdate(rtdbRef(rtdb, `users/${uid}/streakState`), {
            streakCount, streakMonthKey: monthKey, lastStreakClaimAt: lastClaimAt || null,
          }).catch(() => {});
        }
        setMessage({ type: 'error', text: 'The reward could not be added. Please try again.' });
        return;
      }
      setStreakCount(newCount);
      setLastClaimAt(claimedAt);
      setUnlocked(false);
      setRevealed(amount);
      try {
        if (uid) localStorage.removeItem(`tm_streak_unlocked_${uid}`);
      } catch { /* storage unavailable */ }
    } catch (error) {
      console.error('Error claiming streak reward:', error);
      setMessage({ type: 'error', text: 'Something went wrong while claiming. Please try again.' });
    } finally {
      setClaiming(false);
    }
  };

  const progress = Math.min(100, (streakCount / daysInMonth) * 100);

  return (
    <div className="min-h-screen bg-zinc-950 text-white absolute inset-0 z-50 overflow-y-auto">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative px-4 pt-4 pb-28 max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-200" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">Streak Rewards</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Watch an ad • Claim daily</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-orange-500/15 via-zinc-900 to-zinc-950 border border-orange-500/20 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-orange-300/80 mb-1.5">{monthName} Streak</p>
              <p className="text-4xl font-black tracking-tight">
                {streakCount} <span className="text-lg text-zinc-400 font-black">/ {daysInMonth} days</span>
              </p>
              <p className="text-[11px] text-zinc-400 font-bold mt-2 leading-relaxed">
                {canClaimNow
                  ? unlocked
                    ? 'Your reward is unlocked — claim it below.'
                    : 'Watch one ad to unlock today’s reward.'
                  : 'You are on fire — come back when the timer ends.'}
              </p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="shrink-0 w-20 h-20 rounded-3xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center"
            >
              <Flame className="w-10 h-10 text-orange-400 fill-orange-400/30" />
            </motion.div>
          </div>
          <div className="mt-5 h-2.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </div>
          {isMonthEndBoost && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-[11px] font-bold text-amber-200">
                Month-end boost is ON — streak rewards are 1,000–2,000 Gold Coins for the last 5 days of {monthName}.
              </p>
            </div>
          )}
        </div>

        {message && (
          <div className={`rounded-2xl px-4 py-3 text-[12px] font-bold border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Action */}
        <div className="rounded-[2rem] bg-white/[0.03] border border-white/10 p-5 space-y-3">
          {!canClaimNow ? (
            <>
              <div className="flex items-center justify-center gap-2 text-zinc-300">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Next claim in</span>
              </div>
              <p className="text-center text-4xl font-black tracking-widest tabular-nums">{countdown}</p>
              <p className="text-center text-[11px] text-zinc-500 font-bold">One streak reward every 24 hours.</p>
            </>
          ) : unlocked ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(249,115,22,0.35)]"
            >
              {claiming ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming...</> : <><Gift className="w-4 h-4" /> Claim Today’s Reward</>}
            </button>
          ) : (
            <button
              onClick={handleWatchAd}
              disabled={adBusy || loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {adBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading Ad...</> : <><PlayCircle className="w-4 h-4" /> Watch Ad to Unlock</>}
            </button>
          )}
          <p className="text-center text-[11px] text-zinc-500 font-bold leading-relaxed">
            {isMonthEndBoost
              ? 'Today’s reward: a surprise between 1,000 and 2,000 Gold Coins (month-end boost).'
              : 'Today’s reward: a surprise between 100 and 500 Gold Coins — most days pay 100–200.'}
          </p>
        </div>

        {/* Month grid */}
        <div className="rounded-[2rem] bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-black tracking-tight">{monthName} Progress</h2>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNumber = index + 1;
              const isClaimed = dayNumber <= streakCount;
              const isNext = canClaimNow && dayNumber === streakCount + 1;
              return (
                <motion.div
                  key={dayNumber}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.012, duration: 0.25 }}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] font-black border ${
                    isClaimed
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                      : isNext
                        ? 'bg-white/5 text-white border-orange-400 shadow-[0_0_14px_rgba(249,115,22,0.35)]'
                        : 'bg-white/[0.02] text-zinc-600 border-white/5'
                  }`}
                >
                  <span>{dayNumber}</span>
                  {isClaimed ? (
                    <Check className="w-3 h-3 mt-0.5" />
                  ) : isNext ? (
                    <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                      <Gift className="w-3 h-3 mt-0.5 text-orange-300" />
                    </motion.span>
                  ) : (
                    <Lock className="w-2.5 h-2.5 mt-0.5 opacity-50" />
                  )}
                </motion.div>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-500 font-bold mt-4 leading-relaxed flex gap-1.5">
            <Zap className="w-3.5 h-3.5 shrink-0 mt-px text-zinc-400" />
            Missing a day does not reset your streak — your claimed days stay counted all month. A new streak starts each month.
          </p>
        </div>
      </div>

      {/* Reward reveal */}
      <AnimatePresence>
        {revealed !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setRevealed(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-full max-w-xs rounded-[2rem] bg-zinc-900 border border-orange-500/30 p-7 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.7, repeat: 1 }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center"
              >
                <Gift className="w-8 h-8 text-orange-400" />
              </motion.div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Streak Reward</p>
              <p className="text-4xl font-black text-white mt-1.5">{revealed.toLocaleString()} <span className="text-lg text-amber-400">Gold Coins</span></p>
              <p className="text-[11px] text-zinc-400 font-bold mt-2">Added to your coin balance. Convert 100 Coins = Rs. 1 any time on the Watch page. See you in 24 hours!</p>
              <button
                onClick={() => setRevealed(null)}
                className="mt-5 w-full bg-orange-500 hover:bg-orange-400 text-white py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98]"
              >
                Awesome
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
