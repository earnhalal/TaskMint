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
}

export default function WatchTab({ onBack, balance, onUpdateBalance }: WatchTabProps) {
  const [adStats, setAdStats] = useState<Record<string, any>>({});
  const [videoAds, setVideoAds] = useState<VideoAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatching, setIsWatching] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const navigate = useNavigate();

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
              duration: data.duration
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
              duration: 60
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
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (activeAd && (adLoaded || timeLeft <= 60)) { // Force start if adLoad flag is bypassed or active
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            finishAdWatch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [activeAd, adLoaded]);

  const finishAdWatch = async () => {
    if (!auth.currentUser || !activeAd) return;
    try {
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
    setIsWatching(ad.id);
    setMessage(null);
    setActiveAd(ad);
    setTimeLeft(ad.duration || 60);
    setAdLoaded(false);

    // If ad doesn't have a script (e.g. AppCreator intent only), just mark it loaded so timer starts
    if (!ad.scriptUrl) {
      setAdLoaded(true);
    }
  };

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
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Earn instant PKR rewards</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg shadow-red-500/30 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-black tracking-tighter">Watch & Earn</h2>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-white/30">Coming Soon</span>
          </div>
          <p className="text-xs text-red-100 font-bold opacity-90">Watch short video ads to get instant rewards.</p>
          <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-300" /> High Paying Ads
          </div>
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

      <div className="grid gap-3">
        {videoAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-600">No ads available right now.</p>
            <p className="text-xs text-slate-500 mt-1">Please check back later.</p>
          </div>
        ) : (
          videoAds.map((ad, index) => {
            const isThisWatching = isWatching === ad.id;

            return (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:border-red-200`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 text-red-500`}>
                    <PlayCircle className="w-6 h-6" />
                  </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{ad.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Earn Rs {ad.reward.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Hidden Iframe to execute the script in the list context as requested */}
                      <div className="hidden">
                        <iframe
                          title={`ad-list-item-${ad.id}`}
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
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
                    </div>
                </div>
                <button
                  onClick={() => handleWatchAd(ad)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center min-w-[100px] ${
                    isThisWatching 
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                  }`}
                >
                  {isThisWatching ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                    </div>
                  ) : 'Watch Now'}
                </button>
              </motion.div>
            );
        }))}
      </div>

      <div className="mt-8 p-6 bg-slate-100 rounded-[2rem] border border-dashed border-slate-300 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Ads are provided by Start.io via AppCreator24.<br/>
          Please wait for the ad to finish to receive your reward.
        </p>
      </div>

      {/* Player Modal */}
      <AnimatePresence>
        {activeAd && (
          <div className="fixed inset-0 z-[110] flex flex-col bg-slate-900">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col h-full w-full max-w-md mx-auto bg-white/5 relative"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{activeAd.title}</h3>
                    <p className="text-slate-400 text-[10px] uppercase font-black uppercase tracking-wider">Please Wait</p>
                  </div>
                </div>
                {/* Timer Display */}
                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500 font-mono font-bold">{timeLeft}s</span>
                </div>
              </div>

              {/* Main Ad Area */}
              <div className="flex-1 bg-black flex flex-col justify-center items-center relative overflow-hidden">
                {!adLoaded && (
                  <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
                    <p className="text-white font-bold animate-pulse">Loading Ad...</p>
                    <p className="text-slate-400 text-xs mt-2">Timer will start when the ad loads</p>
                  </div>
                )}
                
                {/* Script Container */}
                <div id="ad-script-container" className="w-full h-full min-h-[300px] flex items-center justify-center relative z-0 bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-inner">
                  
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
                            body { margin: 0; padding: 0; background: #000; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden; font-family: sans-serif; cursor: pointer; }
                          </style>
                        </head>
                        <body>
                          <div style="text-align: center; padding: 20px;">
                            <div style="font-size: 48px; margin-bottom: 20px;">✨</div>
                            <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 8px;">TAP TO VIEW AD</h1>
                            <p style="font-size: 14px; opacity: 0.7;">HillTop Ads require interaction.<br>Click anywhere to start!</p>
                          </div>
                          <script>
                            (function(wzuuy){
                              var d = document,
                                  s = d.createElement('script'),
                                  l = d.scripts[d.scripts.length - 1];
                              s.settings = wzuuy || {};
                              s.src = "${activeAd.scriptUrl.startsWith('//') ? 'https:' + activeAd.scriptUrl : activeAd.scriptUrl}";
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
                        setTimeout(() => setAdLoaded(true), 2000);
                      }}
                    />
                  ) : (
                    <p className="text-slate-500 text-xs text-center">Ad Space<br/>(No script assigned)</p>
                  )}
                </div>
              </div>

              {/* Bottom Instructions */}
              <div className="p-6 bg-slate-900">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
                  <p className="text-slate-300 text-xs font-medium leading-relaxed">
                    Please do not close this window.<br/>
                    Wait for the timer to finish completely to receive your <span className="text-emerald-400 font-bold">Rs. {activeAd.reward}</span> reward.
                  </p>
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
