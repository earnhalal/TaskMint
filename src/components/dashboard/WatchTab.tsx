import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PlayCircle, Clock, Sparkles, Coins, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Lock, Construction, Crown, Zap, Eye } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { db, auth } from '../../firebase';
import { getAdsConfig, isUnityConfigured, isStartIoConfigured, isLevelPlayConfigured, resolveAdReward, effectivePlanTier, type AdsConfig } from '../../services/adsSettings';
import { rsToCoins, coinsCount, coinsLabel, coinsToRs, MIN_CONVERT_COINS } from '../../utils/coins';
import { showUnityRewarded } from '../../services/unityAds';
import { showLevelPlayRewarded } from '../../services/levelplayAds';
import { showStartIoRewarded } from '../../services/startIoAds';

/** earning_history source used for Unity rewarded ads (credits + daily cap). */
const UNITY_AD_SOURCE = 'unity_ad';

/** earning_history source used for Start.io rewarded ads (credits + daily cap). */
const STARTIO_AD_SOURCE = 'startio_ad';

interface WatchTabProps {
  onBack: () => void;
  balance: number;
  coinBalance: number;
  onCreditCoins: (coins: number, source?: string, description?: string) => Promise<boolean>;
  onConvertCoins: (coins: number) => Promise<boolean>;
  accountStatus: string;
  role: string;
  partnerTier: string;
}

interface VideoAd {
  id: string;
  title: string;
  reward: number;
  limit?: number;
  status?: string;
  videoUrl?: string; // used for AppCreator
  scriptUrl?: string; // used for Web script
  duration?: number;
  views?: number;
  tier?: 'basic' | 'bronze' | 'silver' | 'gold';
}

// --- Direct video helpers -------------------------------------------------
// Direct ads carry a plain video link (videoUrl) instead of a network
// script. YouTube links play in an embed iframe; direct file links
// (MP4/WebM) play in a native <video> element.
function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function getYouTubeEmbedUrl(url?: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1` : null;
}

function getVideoThumbnail(ad: VideoAd): string | null {
  const ytId = getYouTubeId(ad.videoUrl);
  return ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
}

export default function WatchTab({ onBack, balance, coinBalance, onCreditCoins, onConvertCoins, accountStatus, role, partnerTier }: WatchTabProps) {
  // Ad reward rates follow the member's plan tier (owner's ladder:
  // basic < bronze < silver < gold), resolved from the ads config.
  const myTier = effectivePlanTier(role, partnerTier);
  const [adStats, setAdStats] = useState<Record<string, any>>({});
  const [videoAds, setVideoAds] = useState<VideoAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatching, setIsWatching] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [userName, setUserName] = useState<string>('User');
  const [tierLockModal, setTierLockModal] = useState<'silver' | 'gold' | null>(null);
  const navigate = useNavigate();

  // --- Unity rewarded ads (native app only, admin-panel configured) -----
  const [unityConfig, setUnityConfig] = useState<AdsConfig | null>(null);
  const [unityTodayCount, setUnityTodayCount] = useState(0);
  const [isUnityBusy, setIsUnityBusy] = useState(false);

  /**
   * Counts today's Unity rewarded credits for the daily limit. Follows
   * the codebase's history pattern (see EarningHistoryView): query
   * earning_history by userId only — no composite index — then filter
   * client-side by source and start-of-day timestamp.
   */
  const countUnityToday = async (uid: string): Promise<number> => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const snap = await getDocs(
      query(collection(db, 'earning_history'), where('userId', '==', uid))
    );
    let count = 0;
    snap.forEach((d) => {
      const data = d.data();
      if (data.source !== UNITY_AD_SOURCE) return;
      const ts = data.timestamp;
      const ms = ts?.toMillis ? ts.toMillis() : ts ? new Date(ts).getTime() : 0;
      if (ms >= startOfDay.getTime()) count++;
    });
    return count;
  };

  useEffect(() => {
    // The config is fetched on web too so the ad LIST can be displayed
    // there; playing (and the SDKs) stay native-only.
    if (!auth.currentUser) return;
    let cancelled = false;
    (async () => {
      const config = await getAdsConfig();
      if (cancelled) return;
      setUnityConfig(config);
      if (Capacitor.isNativePlatform() && isUnityConfigured(config) && auth.currentUser) {
        try {
          const count = await countUnityToday(auth.currentUser.uid);
          if (!cancelled) setUnityTodayCount(count);
        } catch (error) {
          console.error('Error counting Unity ads:', error);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const unityLimitReached =
    !!unityConfig && unityConfig.unityDailyLimit > 0 && unityTodayCount >= unityConfig.unityDailyLimit;

  const handleConvertCoins = async () => {
    const coins = Math.floor(Number(convertInput));
    if (!coins || coins < MIN_CONVERT_COINS) {
      setMessage({ type: 'error', text: `You need at least ${MIN_CONVERT_COINS} Gold Coins to convert (100 Coins = Rs. 1).` });
      return;
    }
    if (coins > Math.floor(coinBalance)) {
      setMessage({ type: 'error', text: 'You do not have that many coins.' });
      return;
    }
    setIsConverting(true);
    try {
      const ok = await onConvertCoins(coins);
      if (ok) {
        setConvertInput('');
        setMessage({ type: 'success', text: `${coins.toLocaleString()} Gold Coins converted — Rs. ${coinsToRs(coins).toFixed(2)} has been added to your main balance.` });
      } else {
        setMessage({ type: 'error', text: 'The conversion could not be completed. Please try again shortly.' });
      }
    } finally {
      setIsConverting(false);
    }
  };

  const handleWatchUnityAd = async (slotIndex?: number) => {
    if (isUnityBusy || !unityConfig || !auth.currentUser) return;
    if (unityLimitReached) {
      setMessage({ type: 'error', text: 'You have reached today\'s Unity ad limit. Please try again tomorrow.' });
      return;
    }
    const unityReward = resolveAdReward(unityConfig, 'unity', myTier);
    if (unityReward <= 0) {
      setMessage({ type: 'error', text: 'The Unity ad reward is not configured yet. Please try again later.' });
      return;
    }

    setIsUnityBusy(true);
    setMessage(null);
    try {
      // When LevelPlay mediation is enabled in the panel config, the
      // Unity playlist slots are served through LevelPlay instead of
      // the direct Unity path (same slots, same ladder, same
      // 'unity_ad' history source — mediation is a delivery detail).
      const useLevelPlay = isLevelPlayConfigured(unityConfig);
      const result = useLevelPlay
        ? await showLevelPlayRewarded(unityConfig, auth.currentUser.uid)
        : await showUnityRewarded(unityConfig);
      if (result.status === 'COMPLETED') {
        // Credit only on a fully completed view — same balance path as the
        // video ads (RTDB transaction + Firestore mirror + earning_history
        // record with source "unity_ad").
        const isUserActive = accountStatus.toLowerCase() === 'active';
        if (isUserActive) {
          const credited = await onCreditCoins(
            rsToCoins(unityReward),
            UNITY_AD_SOURCE,
            'Watched Unity rewarded ad'
          );
          if (credited) {
            setUnityTodayCount((prev) => prev + 1);
            if (slotIndex !== undefined) advanceSequence(slotIndex);
            setShowSuccessPopup({
              amount: rsToCoins(unityReward),
              adTitle: useLevelPlay ? 'LevelPlay Rewarded Ad' : 'Unity Rewarded Ad',
              timestamp: new Date().toLocaleString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            });
          } else {
            setMessage({ type: 'error', text: 'The ad was completed but the reward could not be added. Please try again.' });
          }
        } else {
          setMessage({ type: 'error', text: 'Your account is not active, so the reward was not added to your balance.' });
        }
      } else if (result.status === 'SKIPPED') {
        setMessage({ type: 'error', text: 'Ad closed early — watch the full ad to earn the reward.' });
      } else {
        setMessage({ type: 'error', text: result.reason });
      }
    } finally {
      setIsUnityBusy(false);
    }
  };

  // --- Start.io rewarded ads (native app only, same panel config) ------
  const [startioConfig, setStartioConfig] = useState<AdsConfig | null>(null);
  const [startioTodayCount, setStartioTodayCount] = useState(0);
  const [isStartioBusy, setIsStartioBusy] = useState(false);
  const [startioPausedUntil, setStartioPausedUntil] = useState(0);

  const countStartioToday = async (uid: string): Promise<number> => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const snap = await getDocs(
      query(collection(db, 'earning_history'), where('userId', '==', uid))
    );
    let count = 0;
    snap.forEach((d) => {
      const data = d.data();
      if (data.source !== STARTIO_AD_SOURCE) return;
      const ts = data.timestamp;
      const ms = ts?.toMillis ? ts.toMillis() : ts ? new Date(ts).getTime() : 0;
      if (ms >= startOfDay.getTime()) count++;
    });
    return count;
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    let cancelled = false;
    (async () => {
      const config = await getAdsConfig();
      if (cancelled) return;
      setStartioConfig(config);
      if (Capacitor.isNativePlatform() && isStartIoConfigured(config) && auth.currentUser) {
        try {
          const count = await countStartioToday(auth.currentUser.uid);
          if (!cancelled) setStartioTodayCount(count);
        } catch (error) {
          console.error('Error counting Start.io ads:', error);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const startioLimitReached =
    !!startioConfig && startioConfig.startioDailyLimit > 0 && startioTodayCount >= startioConfig.startioDailyLimit;

  const handleWatchStartIoAd = async (slotIndex?: number) => {
    if (isStartioBusy || !startioConfig || !auth.currentUser) return;
    if (startioLimitReached) {
      setMessage({ type: 'error', text: 'You have reached today\'s Start.io ad limit. Please try again tomorrow.' });
      return;
    }
    const startioReward = resolveAdReward(startioConfig, 'startio', myTier);
    if (startioReward <= 0) {
      setMessage({ type: 'error', text: 'The Start.io ad reward is not configured yet. Please try again later.' });
      return;
    }

    setIsStartioBusy(true);
    setMessage(null);
    try {
      const result = await showStartIoRewarded(startioConfig);
      if (result.status === 'COMPLETED') {
        // Credit only on a fully completed view — same balance path as the
        // other networks (source "startio_ad").
        const isUserActive = accountStatus.toLowerCase() === 'active';
        if (isUserActive) {
          const credited = await onCreditCoins(
            rsToCoins(startioReward),
            STARTIO_AD_SOURCE,
            'Watched Start.io rewarded ad'
          );
          if (credited) {
            setStartioTodayCount((prev) => prev + 1);
            if (slotIndex !== undefined) advanceSequence(slotIndex);
            setShowSuccessPopup({
              amount: rsToCoins(startioReward),
              adTitle: 'Start.io Rewarded Ad',
              timestamp: new Date().toLocaleString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            });
          } else {
            setMessage({ type: 'error', text: 'The ad was completed but the reward could not be added. Please try again.' });
          }
        } else {
          setMessage({ type: 'error', text: 'Your account is not active, so the reward was not added to your balance.' });
        }
      } else if (result.status === 'SKIPPED') {
        setMessage({ type: 'error', text: 'Ad closed early — watch the full ad to earn the reward.' });
      } else if (result.noFill) {
        // No fill is a demand-side state, not an app error (owner
        // report 2026-10-25: the raw technical warning was the actual
        // complaint). Pause the Start.io slots quietly — the playlist
        // explains it inline — instead of flashing a warning banner.
        setStartioPausedUntil(Date.now() + STARTIO_PAUSE_MS);
      } else {
        setMessage({ type: 'error', text: result.reason });
      }
    } finally {
      setIsStartioBusy(false);
    }
  };

  // --- Reward-ad sequence (owner's spec) --------------------------------
  // The Watch page offers a daily playlist: every Unity slot (per the
  // panel daily limit), then every Start.io slot. Only ONE slot is open
  // at a time. Watching it fully (reward credited) locks it with a
  // 1-minute timer; when the timer ends, the next slot unlocks. Progress
  // is kept per user per day in localStorage; the per-network daily caps
  // are still enforced server-side from earning_history, so the pacing
  // can never pay more than the panel limits.
  const SEQ_COOLDOWN_MS = 60_000;
  const STARTIO_PAUSE_MS = 15 * 60_000; // no-fill pause for Start.io slots
  interface SeqState { date: string; nextIndex: number; lockUntil: number }
  const [seq, setSeq] = useState<SeqState | null>(null);
  const [showAppPrompt, setShowAppPrompt] = useState(false);
  const [seqNow, setSeqNow] = useState(Date.now());

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };
  const seqStorageKey = () =>
    auth.currentUser ? `taskmint_ad_sequence_${auth.currentUser.uid}` : null;

  useEffect(() => {
    const key = seqStorageKey();
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as SeqState;
        if (parsed && parsed.date === todayKey()) {
          setSeq(parsed);
          return;
        }
      }
    } catch { /* corrupted storage — start fresh */ }
    setSeq({ date: todayKey(), nextIndex: 0, lockUntil: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Server truth floor: if today's credited counts say the user is
  // further along than the stored progress (e.g. fresh install), catch up.
  useEffect(() => {
    if (!seq) return;
    const floor = unityTodayCount + startioTodayCount;
    if (floor > seq.nextIndex) {
      setSeq((prev) => (prev ? { ...prev, nextIndex: Math.max(prev.nextIndex, floor) } : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unityTodayCount, startioTodayCount]);

  useEffect(() => {
    const key = seqStorageKey();
    if (!key || !seq) return;
    try { localStorage.setItem(key, JSON.stringify(seq)); } catch { /* private mode */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  // Start.io no-fill pause: load once, then persist changes.
  useEffect(() => {
    if (!auth.currentUser) return;
    try {
      const v = Number(localStorage.getItem(`taskmint_startio_pause_${auth.currentUser.uid}`) || 0);
      if (v > Date.now()) setStartioPausedUntil(v);
    } catch { /* private mode */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!auth.currentUser || startioPausedUntil <= 0) return;
    try { localStorage.setItem(`taskmint_startio_pause_${auth.currentUser.uid}`, String(startioPausedUntil)); } catch { /* private mode */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startioPausedUntil]);

  // 1-second ticker so the cooldown countdown is smooth.
  useEffect(() => {
    const t = setInterval(() => setSeqNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const advanceSequence = (watchedIndex: number) => {
    setSeq((prev) => {
      const base = prev && prev.date === todayKey() ? prev : { date: todayKey(), nextIndex: 0, lockUntil: 0 };
      if (watchedIndex !== base.nextIndex) return base;
      return { date: base.date, nextIndex: base.nextIndex + 1, lockUntil: Date.now() + SEQ_COOLDOWN_MS };
    });
  };

  type AdSlot = { network: 'unity' | 'startio'; number: number; reward: number };
  const adSlots = useMemo<AdSlot[]>(() => {
    const slots: AdSlot[] = [];
    if (unityConfig && isUnityConfigured(unityConfig)) {
      const n = unityConfig.unityDailyLimit > 0 ? unityConfig.unityDailyLimit : 25;
      for (let i = 1; i <= n; i++) slots.push({ network: 'unity', number: i, reward: resolveAdReward(unityConfig, 'unity', myTier) });
    }
    if (startioConfig && isStartIoConfigured(startioConfig)) {
      const n = startioConfig.startioDailyLimit > 0 ? startioConfig.startioDailyLimit : 25;
      for (let i = 1; i <= n; i++) slots.push({ network: 'startio', number: i, reward: resolveAdReward(startioConfig, 'startio', myTier) });
    }
    return slots;
  }, [unityConfig, startioConfig, myTier]);

  const seqLockActive = !!seq && seq.lockUntil > seqNow;
  const seqCooldownLeft = seqLockActive ? Math.ceil((seq!.lockUntil - seqNow) / 1000) : 0;
  const seqNextIndex = seq ? seq.nextIndex : 0;
  const seqCompletedThrough = seqLockActive ? seqNextIndex - 1 : seqNextIndex;
  const startioPaused = startioPausedUntil > seqNow;
  const startioPauseLeft = startioPaused ? Math.ceil((startioPausedUntil - seqNow) / 1000) : 0;

  const handleWatchSlot = (slot: AdSlot, index: number) => {
    if (slot.network === 'unity') void handleWatchUnityAd(index);
    else void handleWatchStartIoAd(index);
  };

  // YouTube-like view formatter
  const formatViews = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  };

  // Update "now" every minute to refresh lock timers
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  // App Detection Logic
  const isApp = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
    
    // Comprehensive check for AppCreator24 and other WebViews
    const isWebView = ua.includes('wv') || ua.includes('webview') || (ua.includes('android') && ua.includes('version/')) || ua.includes('appcreator24') || !!(window as any).AppCreator24;
    const isAC24 = ua.includes('appcreator24') || !!(window as any).AppCreator24;
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    const isParam = window.location.search.includes('isApp=true') || window.location.search.includes('app=true');
    
    
    return isWebView || isAC24 || isStandalone || isParam;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      try {
        // Fetch ads from Firestore
        const adsRef = collection(db, 'video_ads');
        const adsSnap = await getDocs(adsRef);
        const fetchedAds: VideoAd[] = [];
        adsSnap.forEach((doc) => {
          const data = doc.data();
          // Script ads (e.g. the old HilltopAds player) were removed by the
          // owner's order: the Watch tab shows direct videos and the Unity
          // rewarded card only. A script-only entry (scriptUrl but no
          // videoUrl) never renders.
          if (data.scriptUrl && !data.videoUrl) return;
          if (data.status !== 'inactive') {
            let title = data.title || `Video Ad`;
            let tier = data.tier || 'basic';
            // Honour the reward set in the admin panel (reward / rewardAmount);
            // fall back to the standard tier price only when neither is set.
            let reward = data.reward || data.rewardAmount || (tier === 'gold' ? 15.00 : tier === 'silver' ? 10.00 : tier === 'bronze' ? 3.00 : 1.00);
            let finalViews = data.views || 0;

            // Titles from the old script-ad era may still carry the old
            // network name; display them under the TaskMint brand.
            if (tier === 'basic') {
              title = title.replace(/premium/gi, '').replace(/hilltopads/gi, 'TaskMint').trim();
              if (!title) title = `Daily Ad #${doc.id.split('_').pop()}`;
            }

            fetchedAds.push({
              id: doc.id,
              title: title,
              reward: reward,
              limit: data.limit || 1,
              status: data.status,
              videoUrl: data.videoUrl,
              scriptUrl: data.scriptUrl,
              duration: data.duration,
              views: finalViews,
              tier: tier
            });
          }
        });

        setVideoAds(fetchedAds);

        // Fetch user ad stats
        const statsRef = doc(db, 'user_ad_locks', auth.currentUser.uid);
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          setAdStats(statsSnap.data() || {});
        }

        // Fetch user profile for name
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const udata = userSnap.data();
          setUserName(udata.name || udata.username || udata.fullName || 'User');
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Player State
  const [activeAd, setActiveAd] = useState<VideoAd | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalTime, setTotalTime] = useState(60);
  const [adLoaded, setAdLoaded] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [convertInput, setConvertInput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState<{ 
    amount: number;
    adTitle: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (activeAd && adLoaded && timeLeft > 0) { 
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [activeAd, adLoaded, timeLeft]);

  const finishAdWatch = async () => {
    if (!auth.currentUser || !activeAd) return;
    setIsClaiming(true);
    try {
      // Update Ad Views in DB
      const adRef = doc(db, 'video_ads', activeAd.id);
      const adSnap = await getDoc(adRef);
      if (adSnap.exists()) {
        const currentViews = adSnap.data().views || 0;
        await setDoc(adRef, { views: currentViews + 1 }, { merge: true });
      }

      const statsRef = doc(db, 'user_ad_locks', auth.currentUser.uid);
      await setDoc(statsRef, {
        [activeAd.id]: serverTimestamp()
      }, { merge: true });

      // Update Balance
      const isUserActive = accountStatus.toLowerCase() === 'active';
      const rewardAmount = isUserActive ? activeAd.reward : 0;
      
      if (isUserActive) {
        await onCreditCoins(rsToCoins(rewardAmount), 'ad_watch', `Watched ${activeAd.title}`);
      }

      setAdStats(prev => ({ ...prev, [activeAd.id]: new Date() }));
      
      // Clear watching states
      const adTitle = activeAd.title;
      setActiveAd(null);
      setIsWatching(null);
      
      // Show Success Popup with details
      setShowSuccessPopup({
        amount: rsToCoins(rewardAmount),
        adTitle: adTitle,
        timestamp: new Date().toLocaleString('en-US', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit'
        })
      });
      
      if (!isUserActive) {
        setMessage({ type: 'error', text: "Account inactive hone ki wajah se balance add nahi hua." });
      }
    } catch (error) {
      console.error("Error rewarding ad:", error);
      setMessage({ type: 'error', text: "Reward add karne mein masla hua." });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleWatchAd = async (ad: VideoAd) => {
    // Check if locked
    const lastWatched = adStats[ad.id];
    if (lastWatched) {
      let lockTime = 60 * 60 * 1000; // 1 hour in MS
      if (ad.tier === 'silver' || ad.tier === 'gold') {
        lockTime = 12 * 60 * 60 * 1000; // 12 hours in MS (twice a day)
      }
      const lastTime = lastWatched.toMillis ? lastWatched.toMillis() : new Date(lastWatched).getTime();
      const diff = Date.now() - lastTime;
      if (diff < lockTime) {
        setMessage({ type: 'error', text: "Yeh ad abhi locked hai. Agle watch ke liye intezar karein." });
        return;
      }
    }

    setIsWatching(ad.id);
    setMessage(null);
    setActiveAd(ad);
    setTimeLeft(60); // Strictly 60 seconds
    setTotalTime(60);
    setAdLoaded(false);

    // Initial load check: only an ad with neither a network script nor a
    // direct video skips the loading state. Direct videos mark themselves
    // loaded when the player is ready (embed load / video can-play).
    if (!ad.scriptUrl && !ad.videoUrl) {
      setAdLoaded(true);
    }
  };

  // Automated fallback to start timer even if script load events are messy
  useEffect(() => {
    if (activeAd && !adLoaded) {
      const fallback = setTimeout(() => {
        setAdLoaded(true);
      }, 8000); // 8 second max wait for script load
      return () => clearTimeout(fallback);
    }
  }, [activeAd, adLoaded]);

  useEffect(() => {
    // Scripts are now handled via iframes in the list and modal as per request.
  }, [activeAd]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Loading Ads...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-24 bg-[#0A0F1D] text-white overflow-x-hidden relative w-full"
    >
      {/* Neural Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-full h-full bg-gradient-to-br from-teal-500/10 via-transparent to-transparent blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-full h-[80%] bg-gradient-to-tl from-emerald-500/10 via-transparent to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Info bar */}
      <div className="relative z-[110] bg-teal-600/10 backdrop-blur-md border-b border-white/5 h-8 flex items-center overflow-hidden w-full">
        <div className="flex items-center gap-4 px-6 animate-marquee whitespace-nowrap">
           <Zap className="w-2.5 h-2.5 text-teal-400" />
           <p className="text-[10px] font-black uppercase tracking-widest text-teal-200/60">
             Watch ads — earn Gold Coins on every completed view • 100 Gold Coins = Rs. 1
           </p>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-[100] backdrop-blur-2xl bg-[#0A0F1D]/80 border-b border-white/5 px-5 h-20 flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <h2 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Watch &amp; Earn</h2>
            <h3 className="text-lg font-black text-white  tracking-tight truncate max-w-[160px]">{userName}</h3>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
             <Coins className="w-4 h-4 text-emerald-400" />
             <span className="flex flex-col leading-none">
               <span className="text-sm font-black text-amber-400 tracking-tighter">{Math.floor(coinBalance).toLocaleString()} Gold Coins</span>
               <span className="text-[8px] font-bold text-amber-500/70 mt-0.5">= Rs. {coinsToRs(coinBalance).toFixed(2)} in coins</span>
             </span>
           </div>
        </div>
      </div>

      <div className="relative z-10 w-full p-5 space-y-8">
        {/* Stats band — real numbers only: today's Unity progress, the
            per-ad reward, and how many partner videos are available. */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Ads Watched Today</p>
            <p className="text-lg font-black text-white tracking-tight">
              {unityTodayCount + startioTodayCount}/{adSlots.length || (unityTodayCount + startioTodayCount)}
            </p>
          </div>
          <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Reward / Ad</p>
            <p className="text-lg font-black text-amber-400 tracking-tight">
              {unityConfig ? `${rsToCoins(resolveAdReward(unityConfig, 'unity', myTier))} Gold Coins` : '—'}
              <span className="block text-[9px] font-bold text-zinc-500 tracking-normal mt-0.5">
                per completed ad
              </span>
            </p>
          </div>
          <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Videos</p>
            <p className="text-lg font-black text-white tracking-tight">{videoAds.length}</p>
          </div>
        </div>

        {/* Convert Gold Coins to main balance (owner's coin economy) */}
        <div className="rounded-[2rem] bg-gradient-to-br from-amber-500/15 to-yellow-500/5 border border-amber-400/20 p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-300/80">Your Gold Coins</p>
              <p className="text-2xl font-black text-amber-300 tracking-tight">{Math.floor(coinBalance).toLocaleString()} <span className="text-xs">Gold Coins</span></p>
              <p className="text-[10px] font-bold text-zinc-400 mt-0.5">= Rs. {coinsToRs(coinBalance).toFixed(2)} • Main balance: Rs. {balance.toFixed(2)} • 100 Gold Coins = Rs. 1</p>
            </div>
            <Coins className="w-9 h-9 text-amber-400" />
          </div>
          <div className="flex gap-2 mt-4">
            <input
              type="number"
              min={MIN_CONVERT_COINS}
              value={convertInput}
              onChange={(e) => setConvertInput(e.target.value)}
              placeholder={`Coins to convert (min ${MIN_CONVERT_COINS})`}
              className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/50"
            />
            <button
              onClick={() => setConvertInput(String(Math.floor(coinBalance)))}
              className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 active:scale-95 transition-all"
            >
              Max
            </button>
            <button
              onClick={handleConvertCoins}
              disabled={isConverting || Math.floor(coinBalance) < MIN_CONVERT_COINS}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              {isConverting ? 'Converting...' : 'Convert'}
            </button>
          </div>
          {Math.floor(coinBalance) < MIN_CONVERT_COINS && (
            <p className="text-[10px] font-bold text-zinc-500 mt-2">You need at least {MIN_CONVERT_COINS} Gold Coins to convert — keep watching ads to collect more.</p>
          )}
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-2xl border flex items-center gap-3 ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <p className="text-[10px] font-black uppercase tracking-widest">{message.text}</p>
          </motion.div>
        )}

        {accountStatus.toLowerCase() !== 'active' && (
          <div className="p-8 rounded-3xl bg-rose-500/5 border border-dashed border-rose-500/30 text-center relative overflow-hidden">
            <h3 className="text-rose-400 text-[9px] font-black uppercase tracking-widest mb-3">Payouts Locked</h3>
            <p className="text-[11px] text-rose-300/60 font-bold leading-relaxed mb-6">
              Earnings are only credited to activated accounts. Activate your account to start receiving rewards. 
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-none"
            >
              Verify Account
            </button>
          </div>
        )}

        {/* Reward Ads playlist — the daily sequence (owner's spec).
            Unity slots first, then Start.io slots; one slot open at a
            time; a watched slot locks with a 1-minute timer, then the
            next slot unlocks. Native app only (SDK ads). */}
        {adSlots.length > 0 && (Capacitor.isNativePlatform() ? !!seq : true) && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Reward Ads</h3>
              <p className="text-[11px] text-zinc-500 font-bold mt-1">
                {Capacitor.isNativePlatform()
                  ? 'Watch the open ad to unlock the next one. Each fully watched ad pays instantly.'
                  : 'Ads play inside the TaskMint Android app. Download the app to watch and earn.'}
              </p>
            </div>

            {Capacitor.isNativePlatform() && seqNextIndex >= adSlots.length && !seqLockActive ? (
              <div className="rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-black">All ads completed for today</p>
                <p className="text-[11px] text-zinc-400 font-bold mt-1">Come back tomorrow for a fresh set of {adSlots.length} ads.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {adSlots.map((slot, i) => {
                  if (!Capacitor.isNativePlatform()) {
                    // Web: display-only card — playing happens in the app.
                    return (
                      <div key={`${slot.network}-${slot.number}`} className="relative rounded-[1.75rem] overflow-hidden bg-zinc-900/80 border border-white/10 shadow-xl">
                        <div className="relative aspect-video w-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black overflow-hidden">
                          <span className="absolute -bottom-5 -left-1 text-[6rem] leading-none font-black text-white/5 select-none">{slot.number}</span>
                          <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between">
                            <span className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-300">
                              {slot.network === 'unity' ? (isLevelPlayConfigured(unityConfig ?? ({} as AdsConfig)) ? 'LevelPlay' : 'Unity Ads') : 'Start.io'}
                            </span>
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-600 text-[8px] font-black uppercase tracking-widest text-white">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                            </span>
                          </div>
                          <button onClick={() => setShowAppPrompt(true)} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 group" aria-label="Watch in the app">
                            <span className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-transform group-hover:scale-105 group-active:scale-95">
                              <PlayCircle className="w-7 h-7" />
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Watch in App</span>
                          </button>
                          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/85 to-transparent flex items-end justify-between pointer-events-none">
                            <span className="flex items-center gap-1.5 text-zinc-300 text-[9px] font-black uppercase tracking-widest">
                              <Clock className="w-3 h-3" /> ~30 sec
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-current" />
                              <span className="text-[10px] font-black">+ {rsToCoins(slot.reward)} Gold Coins</span>
                            </span>
                          </div>
                        </div>
                        <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-black text-white tracking-tight">
                              {slot.network === 'unity' ? (isLevelPlayConfigured(unityConfig ?? ({} as AdsConfig)) ? 'LevelPlay' : 'Unity') : 'Start.io'} Ad #{slot.number}
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-bold">Plays in the Android app</p>
                          </div>
                          <button onClick={() => setShowAppPrompt(true)} className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                            Get the App
                          </button>
                        </div>
                      </div>
                    );
                  }
                  const isCompleted = i < seqCompletedThrough;
                  const isCooling = seqLockActive && i === seqCompletedThrough && seqNextIndex > 0 && i === seqNextIndex - 1 && seqCompletedThrough >= 0 && i < seqNextIndex;
                  const isCurrent = !seqLockActive && i === seqNextIndex;
                  const isStartioPausedSlot = slot.network === 'startio' && startioPaused && !isCompleted;
                  const pmm = Math.floor(startioPauseLeft / 60);
                  const pss = String(startioPauseLeft % 60).padStart(2, '0');
                  const isWaitingUnlock = seqLockActive && i === seqNextIndex;
                  const isLocked = i > seqNextIndex || isWaitingUnlock;
                  const cfg = slot.network === 'unity' ? unityConfig : startioConfig;
                  const testMode = slot.network === 'unity' ? unityConfig?.unityTestMode : startioConfig?.startioTestMode;
                  const busy = slot.network === 'unity' ? isUnityBusy : isStartioBusy;
                  const mm = Math.floor(seqCooldownLeft / 60);
                  const ss = String(seqCooldownLeft % 60).padStart(2, '0');
                  return (
                    <div
                      key={`${slot.network}-${slot.number}`}
                      className={`relative rounded-[1.75rem] overflow-hidden bg-zinc-900/80 border shadow-xl ${
                        isCurrent ? 'border-emerald-500/60 ring-1 ring-emerald-500/40' : 'border-white/10'
                      } ${isCompleted || isCooling ? 'opacity-75' : ''}`}
                    >
                      {/* Player stage */}
                      <div className="relative aspect-video w-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black overflow-hidden">
                        <span className="absolute -bottom-5 -left-1 text-[6rem] leading-none font-black text-white/5 select-none">
                          {slot.number}
                        </span>
                        <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between">
                          <span className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-300">
                            {slot.network === 'unity' ? (isLevelPlayConfigured(unityConfig ?? ({} as AdsConfig)) ? 'LevelPlay' : 'Unity Ads') : 'Start.io'}
                          </span>
                          {testMode ? (
                            <span className="px-2 py-1 rounded-lg bg-amber-500/90 text-[8px] font-black uppercase tracking-widest text-black">Test Ad</span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-600 text-[8px] font-black uppercase tracking-widest text-white">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                            </span>
                          )}
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          {isCompleted ? (
                            <>
                              <span className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Completed</span>
                            </>
                          ) : isCooling || isWaitingUnlock ? (
                            <>
                              <span className="w-12 h-12 rounded-full bg-white/5 border border-white/15 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-zinc-300" />
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                                {isCooling ? 'Next ad unlocks in' : 'Unlocks in'} {mm}:{ss}
                              </span>
                            </>
                          ) : isStartioPausedSlot ? (
                            <>
                              <span className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-300" />
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-amber-200">No Ads Available</span>
                              <span className="text-[8px] font-bold text-zinc-400">Start.io is restocking — retry in {pmm}:{pss}</span>
                            </>
                          ) : isCurrent ? (
                            <button
                              onClick={() => handleWatchSlot(slot, i)}
                              disabled={busy}
                              className="flex flex-col items-center gap-2 group disabled:cursor-not-allowed"
                              aria-label={`Watch ${slot.network === 'unity' ? (isLevelPlayConfigured(unityConfig ?? ({} as AdsConfig)) ? 'LevelPlay' : 'Unity') : 'Start.io'} ad ${slot.number}`}
                            >
                              <span className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-transform group-hover:scale-105 group-active:scale-95">
                                {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-7 h-7" />}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-white/80">
                                {busy ? 'Loading Ad...' : 'Tap to Play'}
                              </span>
                            </button>
                          ) : (
                            <>
                              <span className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-zinc-500" />
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Locked</span>
                            </>
                          )}
                        </div>

                        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/85 to-transparent flex items-end justify-between pointer-events-none">
                          <span className="flex items-center gap-1.5 text-zinc-300 text-[9px] font-black uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> ~30 sec
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-black">+ {rsToCoins(slot.reward)} Gold Coins</span>
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-black text-white tracking-tight">
                            {slot.network === 'unity' ? (isLevelPlayConfigured(unityConfig ?? ({} as AdsConfig)) ? 'LevelPlay' : 'Unity') : 'Start.io'} Ad #{slot.number}
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-bold">
                            {isCompleted ? 'Reward earned' : isCooling ? 'Watched — cooling down' : isCurrent ? 'Ready to watch' : isWaitingUnlock ? 'Next in line' : 'Watch the previous ad first'}
                          </p>
                        </div>
                        {isCurrent && (
                          <button
                            onClick={() => handleWatchSlot(slot, i)}
                            disabled={busy}
                            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                          >
                            {busy ? 'Loading...' : `Watch • ${rsToCoins(slot.reward)} Gold Coins`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Web download prompt — ads play only in the app */}
        <AnimatePresence>
          {showAppPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
              onClick={() => setShowAppPrompt(false)}
            >
              <motion.div
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 8 }}
                className="w-full max-w-sm rounded-[2rem] bg-zinc-900 border border-white/10 p-7 text-center shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <PlayCircle className="w-8 h-8 text-emerald-400" />
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">Ads play in the TaskMint app</h3>
                <p className="text-[12px] text-zinc-400 font-bold leading-relaxed mt-2">
                  Rewarded ads can only be watched inside the Android app. Download TaskMint, sign in with this account, and every ad you watch credits your balance instantly.
                </p>
                <button
                  onClick={() => { setShowAppPrompt(false); navigate('/download'); }}
                  className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98]"
                >
                  Download the App
                </button>
                <button
                  onClick={() => setShowAppPrompt(false)}
                  className="mt-2.5 w-full bg-white/5 hover:bg-white/10 text-zinc-300 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all"
                >
                  Not Now
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Partner Videos */}
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Partner Videos</h3>
          <p className="text-[11px] text-zinc-500 font-bold mt-1">Watch a full video to earn its reward. Rewards are credited instantly.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoAds.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              {isLoading ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-zinc-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Loading videos...</p>
                </>
              ) : (
                <p className="text-[11px] font-bold text-zinc-500">No partner videos are available right now. Please check back later.</p>
              )}
            </div>
          ) : (
              videoAds
                .sort((a, b) => {
                  const tiers = { basic: 0, bronze: 1, silver: 2, gold: 3 };
                  return tiers[a.tier || 'basic'] - tiers[b.tier || 'basic'];
                })
                .map((ad, index) => {
              const isBronze = partnerTier === 'bronze' || partnerTier === 'silver' || partnerTier === 'gold' || role === 'partner';
              const isSilver = partnerTier === 'silver' || partnerTier === 'gold';
              const isGold = partnerTier === 'gold';
              let isTierLocked = false;
              if (ad.tier === 'bronze' && !isBronze) isTierLocked = true;
              else if (ad.tier === 'silver' && !isSilver) isTierLocked = true;
              else if (ad.tier === 'gold' && !isGold) isTierLocked = true;

              const lastWatched = adStats[ad.id];
              let isTimeLocked = false;
              let remainingText = "";
              if (lastWatched) {
                let lockTime = 60 * 60 * 1000;
                if (ad.tier === 'silver' || ad.tier === 'gold') {
                    lockTime = 12 * 60 * 60 * 1000; // 12 hours
                }
                const lastTime = lastWatched.toMillis ? lastWatched.toMillis() : new Date(lastWatched).getTime();
                const diff = Date.now() - lastTime;
                if (diff < lockTime) {
                  isTimeLocked = true;
                  const remainingMs = lockTime - diff;
                  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
                  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                  remainingText = `${hours}h ${minutes}m`;
                }
              }
              const isLocked = isTimeLocked || isTierLocked;

              return (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (isTierLocked) { setTierLockModal(ad.tier as 'silver' | 'gold'); return; }
                    if (isTimeLocked) return;
                    handleWatchAd(ad);
                  }}
                  className={`group relative bg-zinc-900/80 border border-white/10 rounded-[2rem] overflow-hidden transition-all duration-300 hover:border-emerald-500/40 hover:shadow-2xl cursor-pointer ${
                    isLocked ? 'opacity-70' : ''
                  }`}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
                    {getVideoThumbnail(ad) ? (
                      <img
                        src={getVideoThumbnail(ad) as string}
                        alt={ad.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="w-14 h-14 text-white/15" />
                      </div>
                    )}

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    {/* Payout Badge - VISIBLE AND PROMINENT */}
                    <div className="absolute bottom-4 right-4">
                      <div className={`px-4 py-1.5 rounded-xl border backdrop-blur-xl shadow-lg flex items-center gap-2 ${
                         ad.tier === 'gold' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
                         ad.tier === 'silver' ? 'bg-teal-600/90 border-teal-400 text-white' :
                         'bg-emerald-500/90 border-emerald-400 text-white'
                      }`}>
                         <Zap className="w-3 h-3 fill-current" />
                         <span className="text-sm font-black ">{rsToCoins(ad.reward)} Gold Coins</span>
                      </div>
                    </div>

                    {/* Center Action */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isTierLocked ? (
                        <div className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center">
                           <Lock className="w-5 h-5 text-white/50" />
                        </div>
                      ) : isTimeLocked ? (
                        <div className="flex flex-col items-center gap-1">
                           <Clock className="w-10 h-10 text-white/40 mb-1" />
                           <span className="px-3 py-1 rounded-full bg-black/60 text-[8px] font-black uppercase tracking-widest text-white/60">{remainingText}</span>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-white/10 group-hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center transition-all group-hover:scale-110">
                           <PlayCircle className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Category Label */}
                    <div className="absolute top-4 left-4">
                       <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                          ad.tier === 'gold' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                          ad.tier === 'silver' ? 'bg-teal-500/20 border-teal-500/40 text-teal-400' :
                          'bg-white/10 border-white/10 text-white/60'
                       }`}>
                         {ad.tier || 'Basic'} Plan
                       </div>
                    </div>
                  </div>

                  <div className="px-5 py-5">
                     <h4 className="text-base font-black text-white tracking-tight mb-2.5 truncate group-hover:text-emerald-400 transition-colors">
                       {ad.title}
                     </h4>
                     <div className="flex items-center gap-4 text-zinc-400">
                       <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                          <Eye className="w-3.5 h-3.5" />
                          {formatViews(ad.views || 0)} views
                       </span>
                       <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          {ad.duration ? `${ad.duration} sec` : '60 sec'}
                       </span>
                       {isTimeLocked && (
                         <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400">
                            <Lock className="w-3.5 h-3.5" />
                            {remainingText}
                         </span>
                       )}
                     </div>
                  </div>
                </motion.div>
              );
          }))}
        </div>

        <div className="py-20 text-center opacity-30 border-t border-white/5">
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em] leading-loose">
            TaskMint Neural Node System<br/>
            Secure Earning Environment v3.1
          </p>
        </div>
      </div>


      {/* Player Modal */}
      <AnimatePresence>
        {activeAd && (
          <div className={`fixed inset-0 z-[110] flex flex-col ${
            activeAd.tier === 'gold' ? 'bg-[#150F02]' : 
            activeAd.tier === 'silver' ? 'bg-[#0A101F]' :
            'bg-emerald-600'
          }`}>
            {/* Enchanted background glow */}
            <div className={`absolute inset-0 opacity-40 blur-[150px] pointer-events-none ${
              activeAd.tier === 'gold' ? 'bg-emerald-500/20' : 
              activeAd.tier === 'silver' ? 'bg-blue-500/20' :
              'bg-teal-500/10'
            }`} />

            {/* Progress Bar Top */}
            <div className="h-1.5 w-full bg-white/5 relative z-[120]">
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: adLoaded ? `${((totalTime - timeLeft) / totalTime) * 100}%` : '0%' }}
                transition={{ duration: 0.5 }}
                className={`h-full shadow-[0_0_20px_rgba(255,255,255,0.3)] ${
                  activeAd.tier === 'gold' ? 'bg-gradient-to-r from-emerald-500 to-amber-300' : 
                  activeAd.tier === 'silver' ? 'bg-gradient-to-r from-blue-500 to-teal-300' :
                  'bg-teal-500'
                }`}
              />
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col h-full w-full max-w-md mx-auto relative overflow-hidden"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/20 backdrop-blur-xl relative z-20">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center p-[1px] ${
                    activeAd.tier === 'gold' ? 'bg-gradient-to-tr from-emerald-500 to-amber-300' : 
                    activeAd.tier === 'silver' ? 'bg-gradient-to-tr from-blue-500 to-teal-300' :
                    'bg-white/10'
                  }`}>
                    <div className="w-full h-full bg-emerald-600 rounded-[calc(1rem-1px)] flex items-center justify-center">
                      <PlayCircle className={`w-6 h-6 ${
                        activeAd.tier === 'gold' ? 'text-emerald-400' : 
                        activeAd.tier === 'silver' ? 'text-blue-400' :
                        'text-teal-400'
                      }`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-black text-base tracking-tight leading-none mb-1">{activeAd.title}</h3>
                    <div className="flex items-center gap-2">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                         activeAd.tier === 'gold' ? 'text-emerald-400 border-emerald-500/30' : 
                         activeAd.tier === 'silver' ? 'text-blue-400 border-blue-500/30' :
                         'text-teal-400 border-teal-500/30'
                       }`}>
                         {activeAd.tier || 'Standard'} Mode
                       </span>
                    </div>
                  </div>
                </div>
                
                <div className={`flex flex-col items-center gap-0.5 ${timeLeft > 0 ? 'text-white' : 'text-emerald-400'}`}>
                   <span className="text-[20px] font-mono font-black tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                     {timeLeft > 0 ? timeLeft : 'CLAIM'}
                   </span>
                   <span className="text-[7px] font-bold uppercase tracking-widest opacity-60">
                     {timeLeft > 0 ? 'Watching' : 'Ready'}
                   </span>
                </div>
              </div>

              {/* Main Ad Area */}
              <div className="flex-1 bg-black flex flex-col justify-center items-center relative overflow-hidden">
                {!adLoaded && (
                  <div className="absolute inset-0 z-10 bg-[#0B1120] flex flex-col items-center justify-center">
                    <motion.div 
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                      className="w-16 h-16 rounded-full border-t-2 border-r-2 border-teal-500 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                    />
                    <p className="text-white font-black uppercase tracking-widest text-[10px] animate-pulse">Initializing Portal</p>
                    <p className="text-zinc-400 text-[9px] mt-4 font-bold max-w-[200px] text-center uppercase tracking-widest">establishing secure transmission link...</p>
                  </div>
                )}
                
                {/* Script Container */}
                <div id="ad-script-container" className="w-full h-full flex items-center justify-center relative z-0 bg-black">
                  {/* Neon border decoration */}
                  <div className={`absolute inset-4 border rounded-[2rem] pointer-events-none opacity-20 ${
                    activeAd.tier === 'gold' ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 
                    activeAd.tier === 'silver' ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.2)]' :
                    'border-teal-500'
                  }`} />
                  
                  {activeAd.videoUrl ? (
                    getYouTubeEmbedUrl(activeAd.videoUrl) ? (
                      <iframe
                        title="Video Ad"
                        src={getYouTubeEmbedUrl(activeAd.videoUrl) as string}
                        className="w-full h-full border-none relative z-10"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        onLoad={() => { setTimeout(() => setAdLoaded(true), 1000); }}
                      />
                    ) : (
                      <video
                        src={activeAd.videoUrl}
                        className="w-full h-full relative z-10 bg-black"
                        controls
                        autoPlay
                        playsInline
                        onCanPlay={() => setAdLoaded(true)}
                        onLoadedData={() => setAdLoaded(true)}
                      />
                    )
                  ) : (
                    <p className="text-zinc-400 text-xs text-center uppercase tracking-widest">No Signal</p>
                  )}
                </div>
              </div>

              {/* Bottom Instructions and Action */}
              <div className="p-8 bg-black/40 backdrop-blur-2xl border-t border-white/5 relative z-20">
                {timeLeft > 0 ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                       <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Node Syncing</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{Math.round(((totalTime - timeLeft) / totalTime) * 100)}% Complete</span>
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 text-center relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-2000"></div>
                      <p className="text-white text-xs font-black tracking-widest uppercase mb-2">Maintain Connection</p>
                      <p className="text-zinc-400 font-bold text-[9px] uppercase tracking-widest mb-4">do not interrupt the neural stream</p>
                      
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center justify-center gap-2 ">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Node closure results in reward loss
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <motion.div 
                      animate={{ 
                        boxShadow: activeAd.tier === 'gold' ? ['0 0 20px rgba(16,185,129,0.2)', '0 0 50px rgba(16,185,129,0.6)', '0 0 20px rgba(16,185,129,0.2)'] : []
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`p-4 rounded-[1.5rem] border text-center transition-all ${
                        activeAd.tier === 'gold' ? 'bg-emerald-500/10 border-emerald-500/30' : 
                        activeAd.tier === 'silver' ? 'bg-blue-500/10 border-blue-500/30' :
                        'bg-emerald-500/10 border-emerald-500/30'
                      }`}
                    >
                      <p className={`text-sm font-black uppercase tracking-widest ${
                        activeAd.tier === 'gold' ? 'text-emerald-400' : 
                        activeAd.tier === 'silver' ? 'text-blue-400' :
                        'text-emerald-400'
                      }`}>Transmission Finalized</p>
                    </motion.div>
                    
                    <motion.button
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={finishAdWatch}
                      disabled={isClaiming}
                      className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 relative overflow-hidden group transition-all duration-500 ${
                        activeAd.tier === 'gold' ? 'bg-gradient-to-tr from-emerald-600 to-amber-400 text-black' : 
                        activeAd.tier === 'silver' ? 'bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-none' :
                        'bg-teal-600 text-white shadow-none font-black'
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      {isClaiming ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className={`w-5 h-5 ${activeAd.tier === 'gold' ? 'text-black' : 'text-emerald-300'}`} />
                      )}
                      {isClaiming ? 'Extracting...' : `Harvest Reward (${rsToCoins(activeAd.reward)} Gold Coins)`}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Reward Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md shadow-2xl"
              onClick={() => setShowSuccessPopup(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 100 }}
              className="relative bg-[#15181D] w-full max-w-sm rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden text-center border-4 border-emerald-500/20"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-teal-600"></div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-xl shadow-none rotate-12">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Congratulations! 🎉</h3>
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-6 tracking-widest ">Dear {userName}</p>
                
                <div className="bg-white/5 w-full p-6 rounded-[2rem] mb-6 border border-white/5 flex flex-col items-center">
                  <div className="w-full text-left space-y-4">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-zinc-500">
                      <span>Neural Task</span>
                      <span className="text-white line-clamp-1 max-w-[120px]">{showSuccessPopup.adTitle}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-zinc-500">
                      <span>Harvested</span>
                      <span className="text-amber-400 font-black flex flex-col items-end leading-none">
                        <span>{showSuccessPopup.amount.toLocaleString()} Gold Coins</span>
                        <span className="text-[8px] text-zinc-500 mt-1">100 Gold Coins = Rs. 1</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-zinc-500">
                      <span>Cycle Date</span>
                      <span className="text-white">{showSuccessPopup.timestamp}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
                  Verified Reward by TaskMint
                </p>

                <button 
                  onClick={() => setShowSuccessPopup(null)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-none transition-all active:scale-95"
                >
                  Continue Journey
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tier Lock Modal */}
      <AnimatePresence>
        {tierLockModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0B1120]/95 backdrop-blur-xl"
              onClick={() => setTierLockModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#15181D] to-black rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden text-center"
            >
              {/* Decorative Glow */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 opacity-20 blur-[60px] ${
                tierLockModal === 'gold' ? 'bg-emerald-500' : 'bg-blue-500'
              }`} />

              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl ${
                  tierLockModal === 'gold' ? 'bg-emerald-500 shadow-none' : 'bg-blue-600 shadow-none'
                }`}>
                  <Crown className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase   text-center">
                  {tierLockModal === 'gold' ? 'Gold VIP' : 'Silver Partner'} Required
                </h3>
                
                <p className="text-zinc-500 text-xs font-bold leading-relaxed mb-8 px-4 opacity-80">
                  Yeh premium ad nodes sirf {tierLockModal === 'gold' ? 'Gold VIP' : 'Silver Partner'} members ke liye available hain. Mazeed earning ke liye apna plan upgrade karein.
                </p>

                <div className="w-full space-y-3">
                  <button 
                    onClick={() => {
                      setTierLockModal(null);
                      navigate('/dashboard');
                    }}
                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                      tierLockModal === 'gold' 
                        ? 'bg-gradient-to-r from-emerald-600 to-amber-400 text-black' 
                        : 'bg-gradient-to-r from-blue-600 to-teal-400 text-white shadow-none'
                    }`}
                  >
                    Upgrade Plan Now
                  </button>
                  <button 
                    onClick={() => setTierLockModal(null)}
                    className="w-full py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coming Soon Modal */}
      <AnimatePresence>
        {showComingSoon && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComingSoon(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#15181D] w-full max-w-sm rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 shadow-sm">
                  <Construction className="w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Coming Soon!</h3>
                <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-4">Under Maintenance</p>
                
                <div className="bg-white/5 p-6 rounded-3xl mb-8 w-full border border-white/5">
                  <p className="text-zinc-200 font-bold text-lg leading-relaxed mb-2">
                    Is feature par kaam ho raha hai.
                  </p>
                  <p className="text-zinc-400 font-medium text-sm">
                    Thora intezar karein, jald hi high-paying ads active kar diye jayenge. Shukriya!
                  </p>
                </div>
                
                <button 
                  onClick={() => setShowComingSoon(false)}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                >
                  Theek Hai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
