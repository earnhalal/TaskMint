import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PlayCircle, Clock, Sparkles, Wallet, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Lock, X, Construction, Info } from 'lucide-react';
import { doc, updateDoc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface WatchTabProps {
  onBack: () => void;
  balance: number;
  onUpdateBalance: (amount: number, source?: string, description?: string) => void;
}

const VIDEO_ADS = Array.from({ length: 10 }, (_, i) => ({
  id: `ad_${i + 1}`,
  title: `Video Ad #${i + 1}`,
  reward: 0.20,
  limit: 1 // 1 watch per 24 hours
}));

export default function WatchTab({ onBack, balance, onUpdateBalance }: WatchTabProps) {
  const [adStats, setAdStats] = useState<Record<string, any>>({});
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
    const fetchStats = async () => {
      if (!auth.currentUser) return;
      try {
        const statsRef = doc(db, 'user_ad_locks', auth.currentUser.uid);
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          setAdStats(statsSnap.data() || {});
        }
      } catch (error) {
        console.error("Error fetching ad stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleWatchAd = async (ad: typeof VIDEO_ADS[0]) => {
    // Intercept with Coming Soon as requested
    setShowComingSoon(true);
    return;

    /* Original logic commented out for future use
    // Check if locked
    const lastWatched = adStats[ad.id];
    if (lastWatched) {
      const lastTime = lastWatched.toDate ? lastWatched.toDate().getTime() : new Date(lastWatched).getTime();
      const now = new Date().getTime();
      const hoursPassed = (now - lastTime) / (1000 * 60 * 60);
      
      if (hoursPassed < 24) {
        const remainingHours = Math.ceil(24 - hoursPassed);
        alert(`Ye video locked hai. Aap isay ${remainingHours} ghantay baad dobara dekh saktay hain.`);
        return;
      }
    }

    if (!isApp) {
      alert("Video Ads sirf TaskMint App mein chalte hain. Bonus lene ke liye App download karein!");
      navigate('/app-download');
      return;
    }

    setIsWatching(ad.id);
    setMessage(null);

    // Trigger AppCreator24 Rewarded Video Intent
    try {
      // Use location.href as requested
      (window as any).location.href = 'appcreator24://rewarded/video';
    } catch (e) {
      console.error("Intent failed:", e);
    }

    // Simulate ad watching delay
    setTimeout(async () => {
      if (!auth.currentUser) return;

      try {
        const statsRef = doc(db, 'user_ad_locks', auth.currentUser.uid);
        
        await setDoc(statsRef, {
          [ad.id]: serverTimestamp()
        }, { merge: true });

        // 2. Use the centralized balance update logic
        await onUpdateBalance(ad.reward, 'ad_watch', `Watched ${ad.title}`);

        // Update local state
        setAdStats(prev => ({ ...prev, [ad.id]: new Date() }));
        setMessage({ type: 'success', text: `Mubarak ho! Rs. ${ad.reward} aapke wallet mein add ho gaye hain.` });
      } catch (error) {
        console.error("Error rewarding ad:", error);
        setMessage({ type: 'error', text: "Reward add karne mein masla hua." });
      } finally {
        setIsWatching(null);
      }
    }, 5000); 
    */
  };

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
        {VIDEO_ADS.map((ad, index) => {
          const lastWatched = adStats[ad.id];
          let isLocked = false;
          let remainingHours = 0;

          if (lastWatched) {
            const lastTime = lastWatched.toDate ? lastWatched.toDate().getTime() : new Date(lastWatched).getTime();
            const now = new Date().getTime();
            const hoursPassed = (now - lastTime) / (1000 * 60 * 60);
            if (hoursPassed < 24) {
              isLocked = true;
              remainingHours = Math.ceil(24 - hoursPassed);
            }
          }

          const isThisWatching = isWatching === ad.id;

          return (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all ${isLocked ? 'opacity-60 bg-slate-50' : 'hover:border-red-200'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLocked ? 'bg-slate-200 text-slate-400' : 'bg-red-50 text-red-500'}`}>
                  {isLocked ? <Lock className="w-5 h-5" /> : <PlayCircle className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{ad.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Earn Rs {ad.reward.toFixed(2)}
                    </span>
                    {isLocked && (
                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {remainingHours}h left
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleWatchAd(ad)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center min-w-[100px] ${
                  isLocked 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : isThisWatching 
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                }`}
              >
                {isThisWatching ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                  </div>
                ) : isLocked ? 'Locked' : 'Watch Now'}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-slate-100 rounded-[2rem] border border-dashed border-slate-300 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Ads are provided by Start.io via AppCreator24.<br/>
          Please wait for the ad to finish to receive your reward.
        </p>
      </div>

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
