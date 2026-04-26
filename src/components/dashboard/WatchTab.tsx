import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PlayCircle, Clock, Sparkles, Wallet, ArrowLeft, ArrowRight, Bell, CheckCircle2, AlertCircle, Loader2, Lock, X, Construction, Info, Crown, Zap } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface WatchTabProps {
  onBack: () => void;
  balance: number;
  onUpdateBalance: (amount: number, source?: string, description?: string) => Promise<boolean>;
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

export default function WatchTab({ onBack, balance, onUpdateBalance, accountStatus, role, partnerTier }: WatchTabProps) {
  const [adStats, setAdStats] = useState<Record<string, any>>({});
  const [videoAds, setVideoAds] = useState<VideoAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatching, setIsWatching] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [tickerMessage, setTickerMessage] = useState<string>("");

  // Payout Ticker Logic
  useEffect(() => {
    const names = ["Ahmed", "Sana", "Zia", "Ali", "Fatima", "Hassan", "Kiran", "Faizan", "Mehak"];
    const amounts = [750, 1200, 450, 2000, 1500, 300, 100];
    const updateTicker = () => {
      const name = names[Math.floor(Math.random() * names.length)];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      setTickerMessage(`${name} just earned Rs. ${amount} from Video Ads!`);
    };
    updateTicker();
    const interval = setInterval(updateTicker, 5000);
    return () => clearInterval(interval);
  }, []);

  const [userName, setUserName] = useState<string>('User');
  const [tierLockModal, setTierLockModal] = useState<'silver' | 'gold' | null>(null);
  const navigate = useNavigate();

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
    
    console.log("[WATCH_APP_DETECTION]", { ua, isWebView, isAC24, isStandalone, isParam });
    
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
          if (data.status !== 'inactive') {
            let title = data.title || `Video Ad`;
            let reward = data.reward || 0.20;
            let tier = data.tier || 'basic';
            let finalViews = data.views || 0;

            // FORCE VIEWS UPDATE: No matter what's in DB, we force high/low ranges
            if (tier === 'basic') {
              title = title.replace(/premium/gi, '').replace(/hilltopads/gi, 'TaskMint').trim();
              if (!title) title = `Daily Ad #${doc.id.split('_').pop()}`;
              reward = 1.00;
              
              // Realistic basic views (10k to 25k)
              if (finalViews < 10000 || finalViews > 30000) {
                finalViews = Math.floor(Math.random() * 15000) + 10000;
                setDoc(doc.ref, { views: finalViews, title, reward, tier: 'basic' }, { merge: true });
              }
            } else if (tier === 'bronze') {
                reward = 3.00;
                if (!title) title = `Bronze Node #${doc.id.split('_').pop()}`;
                if (finalViews < 5000 || finalViews > 10000) {
                    finalViews = Math.floor(Math.random() * 5000) + 5000;
                    setDoc(doc.ref, { views: finalViews, title, reward, tier: 'bronze' }, { merge: true });
                }
            } else if (tier === 'silver') {
                reward = 10.00;
                if (finalViews < 2000 || finalViews > 4500) {
                    finalViews = Math.floor(Math.random() * 2500) + 2000;
                    setDoc(doc.ref, { views: finalViews, reward }, { merge: true });
                }
            } else if (tier === 'gold') {
                reward = 15.00;
                if (finalViews < 1500 || finalViews > 3500) {
                    finalViews = Math.floor(Math.random() * 2000) + 1500;
                    setDoc(doc.ref, { views: finalViews, reward }, { merge: true });
                }
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

        // Ensure Bronze, Silver and Gold ads exist
        const hasBronze = fetchedAds.some(a => a.tier === 'bronze');
        const hasSilver = fetchedAds.some(a => a.tier === 'silver');
        const hasGold = fetchedAds.some(a => a.tier === 'gold');

        if (!hasBronze || !hasSilver || !hasGold) {
          const extraAds: VideoAd[] = [];
          
          if (!hasBronze) {
            for (let i = 1; i <= 5; i++) {
              const adId = `ad_bronze_new_${i}`;
              const adData = {
                title: `Bronze Starter Task #${i}`,
                reward: 3.00,
                limit: 1,
                status: 'active',
                scriptUrl: "//superbjudgment.com/bxXEV.skdpG/l_0dYcWkcu/LeTmN9yuCZeU/lbkuPlTfYb3pMkTPUm3GMRzoUVt_NQjAcyxyNSTkcyz-NQgh",
                duration: 60,
                views: Math.floor(Math.random() * 1000) + 5000,
                tier: 'bronze' as const
              };
              await setDoc(doc(db, 'video_ads', adId), adData);
              extraAds.push({ id: adId, ...adData });
            }
          }

          if (!hasSilver) {
            for (let i = 1; i <= 5; i++) {
              const adId = `ad_silver_new_${i}`;
              const adData = {
                title: `Silver Executive Task #${i}`,
                reward: 25.00,
                limit: 1,
                status: 'active',
                scriptUrl: "//superbjudgment.com/bxXEV.skdpG/l_0dYcWkcu/LeTmN9yuCZeU/lbkuPlTfYb3pMkTPUm3GMRzoUVt_NQjAcyxyNSTkcyz-NQgh",
                duration: 60,
                views: Math.floor(Math.random() * 1000) + 2000,
                tier: 'silver' as const
              };
              await setDoc(doc(db, 'video_ads', adId), adData);
              extraAds.push({ id: adId, ...adData });
            }
          }

          if (!hasGold) {
            for (let i = 1; i <= 5; i++) {
              const adId = `ad_gold_new_${i}`;
              const adData = {
                title: `Gold VIP Special #${i}`,
                reward: 60.00,
                limit: 1,
                status: 'active',
                scriptUrl: "//superbjudgment.com/bxXEV.skdpG/l_0dYcWkcu/LeTmN9yuCZeU/lbkuPlTfYb3pMkTPUm3GMRzoUVt_NQjAcyxyNSTkcyz-NQgh",
                duration: 60,
                views: Math.floor(Math.random() * 1000) + 2000,
                tier: 'gold' as const
              };
              await setDoc(doc(db, 'video_ads', adId), adData);
              extraAds.push({ id: adId, ...adData });
            }
          }
          fetchedAds.push(...extraAds);
        }
        
        setVideoAds(fetchedAds);

        // Seeding mechanism: ONLY if the list is completely empty (failsafe)
        if (fetchedAds.length === 0) {
          console.log("No ads found in DB. Seeding tier-based ads...");
          const newAds: VideoAd[] = [];
          
          // 1. Basic Ads (Standard Daily)
          for (let i = 1; i <= 10; i++) {
            const adId = `ad_basic_${i}`;
            const adData = {
              title: `TaskMint Daily Reward #${i}`,
              reward: 1.00, // 1 Rs per user request
              limit: 1,
              status: 'active',
              scriptUrl: "//superbjudgment.com/bxXEV.skdpG/l_0dYcWkcu/LeTmN9yuCZeU/lbkuPlTfYb3pMkTPUm3GMRzoUVt_NQjAcyxyNSTkcyz-NQgh",
              duration: 60,
              views: Math.floor(Math.random() * 8000) + 2000,
              tier: 'basic' as const
            };
            await setDoc(doc(db, 'video_ads', adId), adData);
            newAds.push({ id: adId, ...adData });
          }

          // 2. Silver Ads (5 ads)
          for (let i = 1; i <= 5; i++) {
            const adId = `ad_silver_${i}`;
            const adData = {
              title: `Silver Premium Ad #${i}`,
              reward: 10.00, 
              limit: 1,
              status: 'active',
              scriptUrl: "//superbjudgment.com/bxXEV.skdpG/l_0dYcWkcu/LeTmN9yuCZeU/lbkuPlTfYb3pMkTPUm3GMRzoUVt_NQjAcyxyNSTkcyz-NQgh",
              duration: 60,
              views: Math.floor(Math.random() * 15000) + 8000,
              tier: 'silver' as const
            };
            await setDoc(doc(db, 'video_ads', adId), adData);
            newAds.push({ id: adId, ...adData });
          }

          // 3. Gold Ads (5 ads)
          for (let i = 1; i <= 5; i++) {
            const adId = `ad_gold_${i}`;
            const adData = {
              title: `Gold VIP Exclusive #${i}`,
              reward: 15.00,
              limit: 1,
              status: 'active',
              scriptUrl: "//superbjudgment.com/bxXEV.skdpG/l_0dYcWkcu/LeTmN9yuCZeU/lbkuPlTfYb3pMkTPUm3GMRzoUVt_NQjAcyxyNSTkcyz-NQgh",
              duration: 60,
              views: Math.floor(Math.random() * 25000) + 15000,
              tier: 'gold' as const
            };
            await setDoc(doc(db, 'video_ads', adId), adData);
            newAds.push({ id: adId, ...adData });
          }
          setVideoAds(newAds);
        }

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
        await onUpdateBalance(rewardAmount, 'ad_watch', `Watched ${activeAd.title}`);
      }

      setAdStats(prev => ({ ...prev, [activeAd.id]: new Date() }));
      
      // Clear watching states
      const adTitle = activeAd.title;
      setActiveAd(null);
      setIsWatching(null);
      
      // Show Success Popup with details
      setShowSuccessPopup({ 
        amount: rewardAmount,
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

    // Initial load check
    if (!ad.scriptUrl) {
      setAdLoaded(true);
    }
  };

  // Automated fallback to start timer even if script load events are messy
  useEffect(() => {
    if (activeAd && !adLoaded) {
      const fallback = setTimeout(() => {
        setAdLoaded(true);
        console.log("Fallback ad load triggered");
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
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Ads...</p>
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
        <div className="absolute top-[-20%] left-[-10%] w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-full h-[80%] bg-gradient-to-tl from-purple-500/10 via-transparent to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Payout Ticker */}
      <div className="relative z-[110] bg-indigo-600/10 backdrop-blur-md border-b border-white/5 h-8 flex items-center overflow-hidden w-full">
        <div className="flex items-center gap-4 px-6 animate-marquee whitespace-nowrap">
           <Zap className="w-2.5 h-2.5 text-indigo-400" />
           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200/60">
             {tickerMessage || "Connecting to Neural Node..."}
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
            <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Transmission</h2>
            <h3 className="text-lg font-black text-white italic tracking-tight truncate max-w-[120px]">{userName}</h3>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
             <Wallet className="w-3.5 h-3.5 text-emerald-400" />
             <span className="text-sm font-black text-emerald-400 tracking-tighter">Rs. {balance.toLocaleString()}</span>
           </div>
        </div>
      </div>

      <div className="relative z-10 w-full p-5 space-y-8">
        {/* Banner */}
        <div className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-900 shadow-2xl border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-white/60 text-[9px] font-black uppercase tracking-[0.4em] mb-2">Neural Node</h3>
              <h2 className="text-4xl font-black text-white tracking-tighter italic">Ad <span className="text-emerald-400">Nodes</span></h2>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
              <Zap className="w-8 h-8 text-white fill-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
            </div>
          </div>
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
          <div className="p-8 rounded-[2.5rem] bg-rose-500/5 border border-dashed border-rose-500/30 text-center relative overflow-hidden">
            <h3 className="text-rose-400 text-[9px] font-black uppercase tracking-[0.4em] mb-3">Payouts Locked</h3>
            <p className="text-[11px] text-rose-300/60 font-bold leading-relaxed mb-6">
              Account activation ke bagair earnings balance mein nahi ayengi. 
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-rose-600/20"
            >
              Verify Account
            </button>
          </div>
        )}

        {/* Video Ads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoAds.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-30">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Scanning Nodes...</p>
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
                  className={`group relative bg-[#151E32]/50 border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer ${
                    isLocked ? 'grayscale opacity-70' : ''
                  }`}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/${ad.id}/800/500`}
                      alt={ad.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151E32] via-transparent to-transparent" />
                    
                    {/* Payout Badge - VISIBLE AND PROMINENT */}
                    <div className="absolute bottom-4 right-4">
                      <div className={`px-4 py-1.5 rounded-xl border backdrop-blur-xl shadow-lg flex items-center gap-2 ${
                         ad.tier === 'gold' ? 'bg-amber-500/90 border-amber-400 text-white' :
                         ad.tier === 'silver' ? 'bg-indigo-600/90 border-indigo-400 text-white' :
                         'bg-emerald-500/90 border-emerald-400 text-white'
                      }`}>
                         <Zap className="w-3 h-3 fill-current" />
                         <span className="text-sm font-black italic">Rs {ad.reward.toFixed(1)}</span>
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
                          ad.tier === 'gold' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                          ad.tier === 'silver' ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' :
                          'bg-white/10 border-white/10 text-white/60'
                       }`}>
                         {ad.tier || 'Basic'} Node
                       </div>
                    </div>
                  </div>

                  <div className="px-6 py-8">
                     <h4 className="text-xl font-black text-white italic uppercase tracking-tight mb-2 truncate group-hover:text-indigo-400 transition-colors">
                       {ad.title}
                     </h4>
                     <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {formatViews(ad.views || 0)} Harmonic Views
                       </div>
                       <div className="w-1 h-1 bg-white/10 rounded-full" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">60s Node</span>
                     </div>
                  </div>
                </motion.div>
              );
          }))}
        </div>

        <div className="py-20 text-center opacity-30 border-t border-white/5">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] leading-loose">
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
            'bg-slate-900'
          }`}>
            {/* Enchanted background glow */}
            <div className={`absolute inset-0 opacity-40 blur-[150px] pointer-events-none ${
              activeAd.tier === 'gold' ? 'bg-amber-500/20' : 
              activeAd.tier === 'silver' ? 'bg-blue-500/20' :
              'bg-indigo-500/10'
            }`} />

            {/* Progress Bar Top */}
            <div className="h-1.5 w-full bg-white/5 relative z-[120]">
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: adLoaded ? `${((totalTime - timeLeft) / totalTime) * 100}%` : '0%' }}
                transition={{ duration: 0.5 }}
                className={`h-full shadow-[0_0_20px_rgba(255,255,255,0.3)] ${
                  activeAd.tier === 'gold' ? 'bg-gradient-to-r from-amber-500 to-yellow-300' : 
                  activeAd.tier === 'silver' ? 'bg-gradient-to-r from-blue-500 to-indigo-300' :
                  'bg-indigo-500'
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
                    activeAd.tier === 'gold' ? 'bg-gradient-to-tr from-amber-500 to-yellow-300' : 
                    activeAd.tier === 'silver' ? 'bg-gradient-to-tr from-blue-500 to-indigo-300' :
                    'bg-white/10'
                  }`}>
                    <div className="w-full h-full bg-slate-900 rounded-[calc(1rem-1px)] flex items-center justify-center">
                      <PlayCircle className={`w-6 h-6 ${
                        activeAd.tier === 'gold' ? 'text-amber-400' : 
                        activeAd.tier === 'silver' ? 'text-blue-400' :
                        'text-indigo-400'
                      }`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-black text-base tracking-tight leading-none mb-1">{activeAd.title}</h3>
                    <div className="flex items-center gap-2">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                         activeAd.tier === 'gold' ? 'text-amber-400 border-amber-500/30' : 
                         activeAd.tier === 'silver' ? 'text-blue-400 border-blue-500/30' :
                         'text-indigo-400 border-indigo-500/30'
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
                      className="w-16 h-16 rounded-full border-t-2 border-r-2 border-indigo-500 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                    />
                    <p className="text-white font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Initializing Portal</p>
                    <p className="text-slate-500 text-[9px] mt-4 font-bold max-w-[200px] text-center uppercase tracking-widest">establishing secure transmission link...</p>
                  </div>
                )}
                
                {/* Script Container */}
                <div id="ad-script-container" className="w-full h-full flex items-center justify-center relative z-0 bg-black">
                  {/* Neon border decoration */}
                  <div className={`absolute inset-4 border rounded-[2rem] pointer-events-none opacity-20 ${
                    activeAd.tier === 'gold' ? 'border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.2)]' : 
                    activeAd.tier === 'silver' ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.2)]' :
                    'border-indigo-500'
                  }`} />
                  
                  {activeAd.scriptUrl ? (
                    <iframe
                      title="Ad Player"
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="utf-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1">
                          <style>
                            body { margin: 0; padding: 0; background: #000; color: #fff; height: 100vh; overflow: hidden; font-family: -apple-system, sans-serif; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;}
                            #banner-container { width: 100%; text-align: center; margin-bottom: 10px; }
                          </style>
                        </head>
                        <body>
                          <div id="banner-container">
                            <script>
                            (function(ljf){
                            var d = document,
                                s = d.createElement('script'),
                                l = d.scripts[d.scripts.length - 1];
                            s.settings = ljf || {};
                            s.src = "//superbjudgment.com/bJXYVSs.dtGbl/0cYiWucZ/_e/mc9tumZjU/lUkXP/TGYf5PNJzVUK4GNpTQcqtFNljPkp3tNJTQgY2NMuQG";
                            s.async = true;
                            s.referrerPolicy = 'no-referrer-when-downgrade';
                            l.parentNode.insertBefore(s, l);
                            })({})
                            </script>
                          </div>
                          <script>
                            (function(wzuuy){
                              var d = document,
                                  s = d.createElement('script'),
                                  l = d.scripts[d.scripts.length - 1];
                              s.settings = wzuuy || {};
                              s.src = "${activeAd.scriptUrl.startsWith('//') ? 'https:' + activeAd.scriptUrl : activeAd.scriptUrl.startsWith('http') ? activeAd.scriptUrl : 'https://' + activeAd.scriptUrl}";
                              s.async = true;
                              s.referrerPolicy = 'no-referrer-when-downgrade';
                              l.parentNode.insertBefore(s, l);
                            })({});
                          </script>
                        </body>
                        </html>
                      `}
                      className="w-full h-full border-none relative z-10"
                      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-forms allow-top-navigation-by-user-activation"
                      onLoad={() => {
                        console.log("Ad Player Iframe Loaded");
                        // We give it a moment to actually show stuff or let script start
                        setTimeout(() => setAdLoaded(true), 3000);
                      }}
                    />
                  ) : (
                    <p className="text-slate-500 text-xs text-center uppercase tracking-[0.3em]">No Signal</p>
                  )}
                </div>
              </div>

              {/* Bottom Instructions and Action */}
              <div className="p-8 bg-black/40 backdrop-blur-2xl border-t border-white/5 relative z-20">
                {timeLeft > 0 ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Node Syncing</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{Math.round(((totalTime - timeLeft) / totalTime) * 100)}% Complete</span>
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 text-center relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-2000"></div>
                      <p className="text-white text-xs font-black tracking-widest uppercase mb-2">Maintain Connection</p>
                      <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest mb-4">do not interrupt the neural stream</p>
                      
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center justify-center gap-2 italic">
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
                        boxShadow: activeAd.tier === 'gold' ? ['0 0 20px rgba(245,158,11,0.2)', '0 0 50px rgba(245,158,11,0.6)', '0 0 20px rgba(245,158,11,0.2)'] : []
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`p-4 rounded-[1.5rem] border text-center transition-all ${
                        activeAd.tier === 'gold' ? 'bg-amber-500/10 border-amber-500/30' : 
                        activeAd.tier === 'silver' ? 'bg-blue-500/10 border-blue-500/30' :
                        'bg-emerald-500/10 border-emerald-500/30'
                      }`}
                    >
                      <p className={`text-sm font-black uppercase tracking-[0.3em] ${
                        activeAd.tier === 'gold' ? 'text-amber-400' : 
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
                      className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 relative overflow-hidden group transition-all duration-500 ${
                        activeAd.tier === 'gold' ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-black' : 
                        activeAd.tier === 'silver' ? 'bg-gradient-to-tr from-blue-600 to-indigo-400 text-white shadow-blue-500/30' :
                        'bg-indigo-600 text-white shadow-indigo-600/30 font-black'
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      {isClaiming ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className={`w-5 h-5 ${activeAd.tier === 'gold' ? 'text-black' : 'text-amber-300'}`} />
                      )}
                      {isClaiming ? 'Extracting...' : `Harvest Reward (Rs. ${activeAd.reward})`}
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
              className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden text-center border-4 border-emerald-500/20"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-600"></div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/40 rotate-12">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Congratulations! 🎉</h3>
                <p className="text-emerald-600 font-bold text-sm uppercase tracking-[0.2em] mb-6 tracking-widest italic">Dear {userName}</p>
                
                <div className="bg-slate-50 w-full p-6 rounded-[2rem] mb-6 border border-slate-100 flex flex-col items-center">
                  <div className="w-full text-left space-y-4">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                      <span>Neural Task</span>
                      <span className="text-slate-900 line-clamp-1 max-w-[120px]">{showSuccessPopup.adTitle}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                      <span>Harvested</span>
                      <span className="text-emerald-600 font-black">Rs. {showSuccessPopup.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                      <span>Cycle Date</span>
                      <span className="text-slate-900">{showSuccessPopup.timestamp}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                  Verified Reward by TaskMint
                </p>

                <button 
                  onClick={() => setShowSuccessPopup(null)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
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
              className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-black rounded-[3rem] p-8 border border-white/10 shadow-2xl overflow-hidden text-center"
            >
              {/* Decorative Glow */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 opacity-20 blur-[60px] ${
                tierLockModal === 'gold' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />

              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl ${
                  tierLockModal === 'gold' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-600 shadow-blue-600/20'
                }`}>
                  <Crown className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase italic italic text-center">
                  {tierLockModal === 'gold' ? 'Gold VIP' : 'Silver Partner'} Required
                </h3>
                
                <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8 px-4 opacity-80">
                  Yeh premium ad nodes sirf {tierLockModal === 'gold' ? 'Gold VIP' : 'Silver Partner'} members ke liye available hain. Mazeed earning ke liye apna plan upgrade karein.
                </p>

                <div className="w-full space-y-3">
                  <button 
                    onClick={() => {
                      setTierLockModal(null);
                      navigate('/dashboard');
                    }}
                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${
                      tierLockModal === 'gold' 
                        ? 'bg-gradient-to-r from-amber-600 to-yellow-400 text-black' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-400 text-white shadow-blue-500/20'
                    }`}
                  >
                    Upgrade Plan Now
                  </button>
                  <button 
                    onClick={() => setTierLockModal(null)}
                    className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
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
              className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-6 shadow-sm">
                  <Construction className="w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Coming Soon!</h3>
                <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Under Maintenance</p>
                
                <div className="bg-slate-50 p-6 rounded-3xl mb-8 w-full border border-slate-100">
                  <p className="text-slate-700 font-bold text-lg leading-relaxed mb-2">
                    Is feature par kaam ho raha hai.
                  </p>
                  <p className="text-slate-500 font-medium text-sm">
                    Thora intezar karein, jald hi high-paying ads active kar diye jayenge. Shukriya!
                  </p>
                </div>
                
                <button 
                  onClick={() => setShowComingSoon(false)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
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
