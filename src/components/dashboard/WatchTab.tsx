import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PlayCircle, Clock, Sparkles, Wallet, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Lock, X, Construction, Info } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface WatchTabProps {
  onBack: () => void;
  balance: number;
  onUpdateBalance: (amount: number, source?: string, description?: string) => void;
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
}

export default function WatchTab({ onBack, balance, onUpdateBalance }: WatchTabProps) {
  const [adStats, setAdStats] = useState<Record<string, any>>({});
  const [videoAds, setVideoAds] = useState<VideoAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatching, setIsWatching] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();

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
          if (data.status !== 'inactive') { // Only show active/null status ads
            fetchedAds.push({
              id: doc.id,
              title: data.title || `Video Ad`,
              reward: data.reward || 0.20,
              limit: data.limit || 1,
              status: data.status,
              videoUrl: data.videoUrl,
              scriptUrl: data.scriptUrl,
              duration: data.duration,
              views: data.views || Math.floor(Math.random() * 10000) + 5000 // Fake base views
            });
          }
        });
        
        // Sort ads arbitrarily or keep order from DB
        setVideoAds(fetchedAds);

        // Seeding mechanism: if no ads, create 15 dummy ads Using the provided script
        if (fetchedAds.length === 0) {
          console.log("No ads found in DB. Seeding 15 default ads...");
          const newAds: VideoAd[] = [];
          for (let i = 1; i <= 15; i++) {
            const adId = `ad_${i}`;
            const adData = {
              title: `HilltopAds Premium #${i}`,
              reward: 0.50, // Updated reward logic as an example
              limit: 1,
              status: 'active',
              scriptUrl: "//superbjudgment.com/bxXEV.skdpG/l_0dYcWkcu/LeTmN9yuCZeU/lbkuPlTfYb3pMkTPUm3GMRzoUVt_NQjAcyxyNSTkcyz-NQgh",
              duration: 60,
              views: Math.floor(Math.random() * 8000) + 2000
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
      await onUpdateBalance(activeAd.reward, 'ad_watch', `Watched ${activeAd.title}`);

      setAdStats(prev => ({ ...prev, [activeAd.id]: new Date() }));
      setMessage({ type: 'success', text: `Mubarak ho! Rs. ${activeAd.reward} aapke wallet mein add ho gaye hain.` });
    } catch (error) {
      console.error("Error rewarding ad:", error);
      setMessage({ type: 'error', text: "Reward add karne mein masla hua." });
    } finally {
      setActiveAd(null);
      setIsWatching(null);
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 px-4 pt-4"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Watch Ads</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Premium Video Content</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-black tracking-tighter text-white">Ad Center</h2>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-white/30">60s Timer</span>
          </div>
          <p className="text-xs text-indigo-100 font-bold opacity-90">Watch video ads for 60 seconds to maximize your earning potential.</p>
        </div>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-xs font-bold">{message.text}</p>
        </motion.div>
      )}

      {/* Video Style Ads List */}
      <div className="grid grid-cols-1 gap-6">
        {videoAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-600">No ads available right now.</p>
            <p className="text-xs text-slate-500 mt-1">Please check back later.</p>
          </div>
        ) : (
          videoAds.map((ad, index) => {
            const isThisWatching = isWatching === ad.id;
            
            // Lock Calculation
            const lastWatched = adStats[ad.id];
            let isLocked = false;
            let remainingText = "";
            
            if (lastWatched) {
              const lockTime = 60 * 60 * 1000; // 1 hour
              const lastTime = lastWatched.toMillis ? lastWatched.toMillis() : new Date(lastWatched).getTime();
              const diff = Date.now() - lastTime;
              if (diff < lockTime) {
                isLocked = true;
                const remainingMs = lockTime - diff;
                const minutes = Math.floor(remainingMs / (1000 * 60));
                const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
                remainingText = `${minutes}m ${seconds}s`;
              }
            }

            return (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => !isLocked && handleWatchAd(ad)}
                className={`group relative rounded-[2rem] overflow-hidden border shadow-sm transition-all cursor-pointer ${
                  isLocked 
                    ? 'bg-slate-50 border-slate-200 grayscale-[0.5]' 
                    : 'bg-white border-slate-100 hover:shadow-xl hover:border-indigo-200 active:scale-[0.98]'
                }`}
              >
                {/* Thumbnail Area */}
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${ad.id}/640/360`}
                    alt={ad.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-500 ${!isLocked && 'group-hover:scale-105'}`}
                  />
                  <div className={`absolute inset-0 transition-colors flex items-center justify-center ${
                    isLocked ? 'bg-slate-900/60' : 'bg-slate-900/40 group-hover:bg-slate-900/50'
                  }`}>
                    {isLocked ? (
                      <div className="flex flex-col items-center gap-2">
                        <Lock className="w-10 h-10 text-white/80" />
                        <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                          Unlocked in {remainingText}
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-8 h-8 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Reward Badge Overlay */}
                  <div className={`absolute top-4 right-4 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg ${
                    isLocked ? 'bg-slate-500' : 'bg-emerald-500'
                  }`}>
                    Rs {ad.reward.toFixed(2)}
                  </div>

                  {/* Duration Badge Overlay */}
                  <div className="absolute bottom-4 right-4 bg-slate-950/80 text-white px-2 py-1 rounded-md font-mono text-[9px] font-bold">
                    60s
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-5 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className={`font-black line-clamp-1 ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>{ad.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Info className="w-3 h-3" /> {ad.views?.toLocaleString()} Views
                      </p>
                      {isLocked && (
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Locked</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {isLocked ? (
                      <Clock className="w-5 h-5 text-slate-300" />
                    ) : isThisWatching ? (
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
                    )}
                  </div>
                </div>

                {/* Hidden Executing Iframe - RESTORED AS REQUESTED */}
                <div className="hidden">
                  <iframe
                    title={`ad-list-item-${ad.id}`}
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                      <head><meta charset="utf-8"></head>
                      <body>
                        <script>
                          (function(wzuuy){
                            var d = document,
                                s = d.createElement('script'),
                                l = d.scripts[d.scripts.length - 1];
                            s.settings = wzuuy || {};
                            s.src = "${ad.scriptUrl?.startsWith('//') ? 'https:' + ad.scriptUrl : ad.scriptUrl}";
                            s.async = true;
                            s.referrerPolicy = 'no-referrer-when-downgrade';
                            l.parentNode.insertBefore(s, l);
                          })({});
                        </script>
                      </body>
                      </html>
                    `}
                    sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
                  />
                </div>
              </motion.div>
            );
        }))}
      </div>

      <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Ads are dynamically loaded from HilltopAds.<br/>
          Bonus is awarded after the timer completion.
        </p>
      </div>

      {/* Player Modal */}
      <AnimatePresence>
        {activeAd && (
          <div className="fixed inset-0 z-[110] flex flex-col bg-slate-900">
            {/* Progress Bar Top */}
            <div className="h-1.5 w-full bg-slate-800 relative z-[120]">
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: adLoaded ? `${((totalTime - timeLeft) / totalTime) * 100}%` : '0%' }}
                transition={{ duration: 0.5 }}
                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              />
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full w-full max-w-md mx-auto bg-slate-900 relative"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-sm">{activeAd.title}</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      {!adLoaded ? 'INITIALIZING...' : timeLeft > 0 ? 'AD PLAYING' : 'READY TO CLAIM'}
                    </p>
                  </div>
                </div>
                {/* Timer Display Badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                  timeLeft > 0 
                  ? 'bg-slate-950/50 border-slate-800 shadow-inner' 
                  : 'bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                }`}>
                  {timeLeft > 0 ? (
                    <>
                      <Clock className={`w-3.5 h-3.5 ${adLoaded ? 'text-amber-500' : 'text-slate-600'}`} />
                      <span className={`${adLoaded ? 'text-amber-500' : 'text-slate-600'} font-mono font-black text-sm`}>{timeLeft}s</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span className="text-white font-black text-[10px] uppercase tracking-wider">DONE</span>
                    </>
                  )}
                </div>
              </div>

              {/* Main Ad Area */}
              <div className="flex-1 bg-black flex flex-col justify-center items-center relative overflow-hidden">
                {!adLoaded && (
                  <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <p className="text-white font-black uppercase tracking-widest text-[10px] animate-pulse">Waiting for Ad...</p>
                    <p className="text-slate-500 text-[9px] mt-2 font-bold">Timer will start automatically</p>
                  </div>
                )}
                
                {/* Script Container */}
                <div id="ad-script-container" className="w-full h-full flex items-center justify-center relative z-0 bg-black">
                  
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
                      className="w-full h-full border-none"
                      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-forms allow-top-navigation-by-user-activation"
                      onLoad={() => {
                        console.log("Ad Player Iframe Loaded");
                        // We give it a moment to actually show stuff or let script start
                        setTimeout(() => setAdLoaded(true), 3000);
                      }}
                    />
                  ) : (
                    <p className="text-slate-500 text-xs text-center">Ad Space<br/>(No script assigned)</p>
                  )}
                </div>
              </div>

              {/* Bottom Instructions and Action */}
              <div className="p-8 bg-slate-900 border-t border-slate-800/50 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                {timeLeft > 0 ? (
                  <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 text-center shadow-inner">
                    <p className="text-slate-400 text-sm font-black mb-1">
                      {adLoaded ? 'STAY ON THIS SCREEN' : 'PREPARING AD...'}
                    </p>
                    <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                      {adLoaded ? `You will be rewarded after ${timeLeft}s` : 'Timer starts once the ad content appears'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-center mb-4">
                      <p className="text-emerald-500 text-sm font-black uppercase tracking-widest animate-pulse">Bonus Ready for Collection!</p>
                    </div>
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={finishAdWatch}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[2rem] font-black text-base uppercase tracking-[0.1em] shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <Sparkles className="w-6 h-6 text-amber-300 group-hover:rotate-12 transition-transform" />
                      CLAIM REWARD (Rs. {activeAd.reward})
                    </motion.button>
                  </div>
                )}
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
