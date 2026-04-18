import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PlayCircle, Clock, Sparkles, Wallet, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Lock, X, Construction, Info, Crown, Zap } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface WatchTabProps {
  onBack: () => void;
  balance: number;
  onUpdateBalance: (amount: number, source?: string, description?: string) => void;
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
  tier?: 'basic' | 'silver' | 'gold';
}

export default function WatchTab({ onBack, balance, onUpdateBalance, accountStatus, role, partnerTier }: WatchTabProps) {
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
              
              // Ensure basic views are always 100k+
              if (finalViews < 100000) {
                finalViews = Math.floor(Math.random() * 400000) + 100000;
                setDoc(doc.ref, { views: finalViews, title, reward, tier: 'basic' }, { merge: true });
              }
            } else {
              // Ensure premium views are always 2k - 3.5k
              if (finalViews < 2000 || finalViews > 3500) {
                finalViews = Math.floor(Math.random() * 1500) + 2000;
                setDoc(doc.ref, { views: finalViews }, { merge: true });
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

        // Ensure Silver and Gold ads exist with correct view counts (2k-3k)
        const hasSilver = fetchedAds.some(a => a.tier === 'silver');
        const hasGold = fetchedAds.some(a => a.tier === 'gold');

        if (!hasSilver || !hasGold) {
          const extraAds: VideoAd[] = [];
          
          if (!hasSilver) {
            for (let i = 1; i <= 5; i++) {
              const adId = `ad_silver_new_${i}`;
              const adData = {
                title: `Silver Executive Task #${i}`,
                reward: 15.00,
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
                reward: 35.00,
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
              reward: 15.00, 
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
              reward: 35.00,
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
      const lockTime = 60 * 60 * 1000; // 1 hour in MS
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
      className="min-h-screen pb-24 bg-[#050810] text-slate-300 overflow-x-hidden"
    >
      {/* Dynamic Animated Background Spikes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Header - Full Width Glassy */}
      <div className="sticky top-0 z-[100] backdrop-blur-2xl bg-black/40 border-b border-white/5 px-6 py-5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 text-indigo-400" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white tracking-widest uppercase italic leading-none">
              Ad<span className="text-indigo-500">Node</span>
            </h2>
            <p className="text-[8px] text-indigo-400/60 font-black uppercase tracking-[0.4em] mt-1">Ready for Sync</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Node</span>
           </div>
        </div>
      </div>

      <div className="relative z-10 px-4 pt-6">
        {/* Main Banner - Edge to Edge look */}
        <div className="bg-gradient-to-br from-indigo-600/20 via-slate-900/40 to-black/20 rounded-[2.5rem] p-8 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-10 overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] group-hover:bg-indigo-500/30 transition-all duration-1000" />
          
          <div className="relative z-10">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-3">Transmission Center</h3>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none">
              Stream & <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Harvest</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium max-w-[220px] leading-relaxed mb-6">
              Watch encrypted neural streams for 60s and earn instant credits.
            </p>
            
            <div className="flex items-center gap-2">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050810] bg-slate-800 overflow-hidden">
                     <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover opacity-60" />
                   </div>
                 ))}
               </div>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">500k+ Harmonic peers online</span>
            </div>
          </div>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-5 rounded-3xl border flex items-center gap-4 bg-black/40 backdrop-blur-xl ${
              message.type === 'success' ? 'border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
            }`}
          >
            <div className={`p-2 rounded-xl bg-current/10`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest">{message.text}</p>
          </motion.div>
        )}

        {accountStatus.toLowerCase() !== 'active' && (
          <div className="mb-10 p-8 rounded-[3rem] bg-gradient-to-tr from-amber-500/5 to-transparent border border-amber-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <AlertCircle className="w-8 h-8 text-amber-500/20 group-hover:text-amber-500/40 transition-colors" />
            </div>
            <h3 className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-center">Protocol Violation</h3>
            <p className="text-[11px] text-slate-400 font-bold text-center mb-6 leading-relaxed">
              Earnings cannot be synthesized in balance because your account node is currently <span className="text-amber-500">INACTIVE</span>. Activate your protocol to enable harvests.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-amber-500/10 active:scale-95"
            >
              Initialize Node
            </button>
          </div>
        )}

        {/* Video Style Ads List - Now True Full Width Card Look */}
        <div className="flex flex-col gap-8">
          {videoAds.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center bg-white/5 rounded-[3rem] border border-white/5 border-dashed">
              <Zap className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">No Signal Detected</p>
            </div>
          ) : (
              videoAds
                .sort((a, b) => {
                  const tiers = { basic: 0, silver: 1, gold: 2 };
                  return tiers[a.tier || 'basic'] - tiers[b.tier || 'basic'];
                })
                .map((ad, index) => {
              // Same tier/time lock logic... remains same as before...
              const isSilver = partnerTier === 'silver' || partnerTier === 'gold' || role === 'partner';
              const isGold = partnerTier === 'gold';
              let isTierLocked = false;
              let tierLockText = "";
              if (ad.tier === 'silver' && !isSilver) { isTierLocked = true; tierLockText = "Silver Link Needed"; } 
              else if (ad.tier === 'gold' && !isGold) { isTierLocked = true; tierLockText = "Elite VIP Link Needed"; }

              const lastWatched = adStats[ad.id];
              let isTimeLocked = false;
              let remainingText = "";
              if (lastWatched) {
                const lockTime = 60 * 60 * 1000;
                const lastTime = lastWatched.toMillis ? lastWatched.toMillis() : new Date(lastWatched).getTime();
                const diff = Date.now() - lastTime;
                if (diff < lockTime) {
                  isTimeLocked = true;
                  const remainingMs = lockTime - diff;
                  const minutes = Math.floor(remainingMs / (1000 * 60));
                  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
                  remainingText = `${minutes}m ${seconds}s`;
                }
              }
              const isLocked = isTimeLocked || isTierLocked;

              return (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (isTierLocked) { setTierLockModal(ad.tier as 'silver' | 'gold'); return; }
                    if (isTimeLocked) { setMessage({ type: 'error', text: "Node cooldown in progress." }); return; }
                    handleWatchAd(ad);
                  }}
                  className={`group relative w-full rounded-[2.5rem] overflow-hidden border transition-all duration-500 cursor-pointer ${
                    isLocked 
                      ? 'bg-black/20 border-white/5 opacity-60 grayscale' 
                      : 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]'
                  }`}
                >
                  {/* FULL WIDTH IMAGE WRAPPER */}
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/${ad.id}/1280/720`}
                      alt={ad.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${isLocked ? 'blur-sm' : ''}`}
                    />
                    
                    {/* Overlay Grid Pattern */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>
                    
                    {/* Play/Lock Status Icons */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all ${isLocked ? 'bg-black/60' : 'bg-black/20 group-hover:bg-black/40'}`}>
                      {isTierLocked ? (
                        <div className="flex flex-col items-center gap-4">
                           <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                             <Crown className={`w-8 h-8 ${ad.tier === 'gold' ? 'text-amber-400' : 'text-blue-400'}`} />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">{tierLockText}</span>
                        </div>
                      ) : isTimeLocked ? (
                        <div className="flex flex-col items-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}>
                            <Clock className="w-12 h-12 text-indigo-500/30" />
                          </motion.div>
                          <span className="text-[11px] font-mono font-black text-indigo-400 uppercase tracking-widest">{remainingText}</span>
                        </div>
                      ) : (
                        <motion.div 
                          whileHover={{ scale: 1.2 }}
                          className="w-20 h-20 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.6)] relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                          <PlayCircle className="w-10 h-10 fill-white drop-shadow-lg" />
                        </motion.div>
                      )}
                    </div>

                    {/* Meta Overlays */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                       {/* Tier Badge */}
                       <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-3xl shadow-2xl ${
                          ad.tier === 'gold' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
                          ad.tier === 'silver' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' :
                          'bg-white/5 border-white/10 text-white/50'
                       }`}>
                         {ad.tier || 'Base'} Node
                       </div>
                       
                       {/* Reward Badge */}
                       <div className="flex flex-col items-end gap-1">
                          <div className={`px-5 py-2 rounded-2xl border backdrop-blur-3xl shadow-2xl flex items-center gap-2 ${
                            isLocked ? 'bg-slate-900/40 border-slate-800' : 'bg-black/40 border-indigo-500/30'
                          }`}>
                            <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-white font-black text-sm italic tracking-tighter">Rs. {ad.reward.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* INFO SECTION - FULL WIDTH TEXT */}
                  <div className="px-8 py-8">
                    <div className="flex justify-between items-end gap-4">
                      <div className="flex-1 min-w-0">
                         <h4 className={`text-2xl font-black tracking-tight mb-2 truncate ${isLocked ? 'text-slate-600' : 'text-white italic capitalize'}`}>
                           {ad.title}
                         </h4>
                         <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60 flex items-center gap-2">
                               <Zap className="w-3 h-3 fill-indigo-400" /> {formatViews(ad.views || 0)} Harmonic Syncs
                            </span>
                            <div className="w-1 h-1 bg-white/5 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">60 Cycle Stream</span>
                         </div>
                      </div>
                      
                      {!isLocked && (
                        <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 transition-all group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                          <ArrowLeft className="w-6 h-6 text-indigo-400 group-hover:text-white rotate-180 transition-colors" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
          }))}
        </div>

        <div className="mt-20 mb-10 pb-10 border-t border-white/5 pt-10 text-center">
          <Sparkles className="w-6 h-6 text-indigo-500/20 mx-auto mb-4" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] leading-relaxed">
            All nodes are verified by taskmint neural network.<br/>
            Credits added instantly after successfully harvest.
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
                            body { margin: 0; padding: 0; background: #000; color: #fff; height: 100vh; overflow: hidden; font-family: -apple-system, sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center;}
                          </style>
                        </head>
                        <body>
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
