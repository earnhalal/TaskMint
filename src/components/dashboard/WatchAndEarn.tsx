import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  ShieldCheck, 
  Clock, 
  Wallet, 
  ArrowLeft, 
  Zap, 
  Loader2, 
  Star, 
  Gift, 
  CheckCircle2,
  Lock,
  Flame,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface WatchAndEarnProps {
  onBack: () => void;
  balance: number;
  onUpdateBalance: (amount: number, source?: string, description?: string) => Promise<boolean>;
  accountStatus: string;
}

interface AdSlot {
  id: number;
  title: string;
  reward: number;
}

declare global {
  interface Window {
    onVideoRewardAdFinished?: () => void;
    showVideoRewardAd?: () => void;
  }
}

const AD_SLOTS: AdSlot[] = [
  { id: 1, title: "Premium Ad #1", reward: 2.50 },
  { id: 2, title: "Premium Ad #2", reward: 2.50 },
  { id: 3, title: "Standard Video #1", reward: 1.50 },
  { id: 4, title: "Standard Video #2", reward: 1.50 },
  { id: 5, title: "Daily Bonus Ad #1", reward: 1.00 },
  { id: 6, title: "Daily Bonus Ad #2", reward: 1.00 },
  { id: 7, title: "Quick Earn Ad", reward: 0.80 },
  { id: 8, title: "Micro Reward Video", reward: 0.50 },
];

export default function WatchAndEarn({ onBack, balance, onUpdateBalance, accountStatus }: WatchAndEarnProps) {
  const [cooldowns, setCooldowns] = useState<Record<number, number>>({});
  const [activeAdId, setActiveAdId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load cooldowns from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('watch_earn_cooldowns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const filtered: Record<number, number> = {};
        Object.entries(parsed).forEach(([id, expiry]) => {
          if (Number(expiry) > now) {
            filtered[Number(id)] = Number(expiry);
          }
        });
        setCooldowns(filtered);
      } catch (e) {
        console.error("Error loading cooldowns", e);
      }
    }
  }, []);

  // Save cooldowns to localStorage when they change
  useEffect(() => {
    localStorage.setItem('watch_earn_cooldowns', JSON.stringify(cooldowns));
  }, [cooldowns]);

  // Global Callback for AppCreator24
  useEffect(() => {
    window.onVideoRewardAdFinished = async () => {
      console.log("[WATCH_EARN] Global callback triggered!");
      if (activeAdId !== null) {
        const ad = AD_SLOTS.find(a => a.id === activeAdId);
        if (ad) {
          await handleReward(ad);
        }
        setActiveAdId(null);
      }
    };

    return () => {
        // We don't necessarily want to remove it globally if the bridge expects it
        // but for safety in React:
        // window.onVideoRewardAdFinished = undefined;
    };
  }, [activeAdId]);

  const handleReward = async (ad: AdSlot) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      console.log(`[WATCH_EARN] Rewarding user for Ad #${ad.id}: Rs. ${ad.reward}`);
      
      const success = await onUpdateBalance(ad.reward, 'video_reward_ac24', `Watched ${ad.title}`);
      
      if (success) {
        // Set cooldown (e.g., 30 minutes)
        const expiry = Date.now() + 30 * 60 * 1000;
        setCooldowns(prev => ({ ...prev, [ad.id]: expiry }));
        
        setSuccessMsg(`Mubarak ho! Rs. ${ad.reward.toFixed(2)} aapke balance mein add kar diye gaye hain.`);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        alert("Reward add karne mein masla hua. Dobara koshish karein.");
      }
    } catch (error) {
      console.error("Error processing reward:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWatchNow = (ad: AdSlot) => {
    if (cooldowns[ad.id]) return;
    if (accountStatus.toLowerCase() !== 'active') {
      alert("Watch & Earn sirf Active members ke liye hai. Pehle account activate karein!");
      return;
    }

    setActiveAdId(ad.id);
    
    // Call AppCreator24 Service
    if (typeof window.showVideoRewardAd !== 'undefined') {
      window.showVideoRewardAd();
    } else {
      console.warn("AppCreator24 showVideoRewardAd bridge not found. Simulating completion for testing.");
      // Simulation for testing in browser (REMOVE OR COMMENT IN PRODUCTION)
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('run.app')) {
          setTimeout(() => {
            if (window.onVideoRewardAdFinished) window.onVideoRewardAdFinished();
          }, 2000);
      } else {
          alert("Ye feature sirf TaskMint App (APK) ke liye hai.");
      }
    }
  };

  const getRemainingTime = (id: number) => {
    const expiry = cooldowns[id];
    if (!expiry) return null;
    const remaining = Math.max(0, expiry - Date.now());
    if (remaining <= 0) return null;
    
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 px-6 h-20 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <div>
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-0.5">Premium Section</h2>
          <h3 className="text-xl font-black text-white italic tracking-tight">WATCH & EARN</h3>
        </div>
        
        <div className="ml-auto bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-black text-emerald-400 tracking-tighter">Rs. {balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-8">
        {/* Banner */}
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 p-8 overflow-hidden shadow-2xl shadow-indigo-500/20 border border-white/10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-amber-500 rounded-lg shadow-lg">
                 <Zap className="w-4 h-4 text-white fill-white" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-white/80 italic">Verified Rewards</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter leading-none mb-3 italic">
              UNLIMITED <span className="text-amber-400">VIDEO ADS</span>
            </h2>
            <p className="text-xs font-bold text-indigo-100 max-w-[200px] leading-relaxed opacity-80">
              Har video watch karne par reward direct aapke balance mein add hota hai.
            </p>
          </div>
          
          <div className="absolute bottom-[-10px] right-[-10px] opacity-10">
            <PlayCircle className="w-40 h-40" />
          </div>
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-black text-emerald-400 uppercase leading-tight">{successMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ads Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AD_SLOTS.map((ad) => {
            const isLocked = !!cooldowns[ad.id];
            const remaining = getRemainingTime(ad.id);

            return (
              <motion.div
                key={ad.id}
                whileHover={!isLocked ? { scale: 1.02 } : {}}
                whileTap={!isLocked ? { scale: 0.98 } : {}}
                className={`relative group rounded-[2rem] p-6 border transition-all duration-300 flex flex-col justify-between min-h-[160px] overflow-hidden ${
                  isLocked 
                  ? 'bg-white/5 border-white/5 grayscale opacity-60' 
                  : 'bg-white/5 border-white/10 hover:border-indigo-500/50 hover:bg-white/10 shadow-xl'
                }`}
              >
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 p-2 opacity-5">
                   <PlayCircle className="w-20 h-20" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      isLocked ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    }`}>
                      {isLocked ? <Lock className="w-6 h-6" /> : <PlayCircle className="w-7 h-7" />}
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ad Slot #{ad.id}</p>
                       <div className="flex items-center gap-1.5 justify-end">
                         <span className="text-lg font-black text-emerald-400 italic">Rs. {ad.reward.toFixed(2)}</span>
                       </div>
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-white italic tracking-tight uppercase mb-6 truncate">
                    {ad.title}
                  </h4>
                </div>

                <button
                  disabled={isLocked || isProcessing}
                  onClick={() => handleWatchNow(ad)}
                  className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all relative z-10 flex items-center justify-center gap-2 ${
                    isLocked 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-white text-slate-900 shadow-xl shadow-white/5 active:scale-95 hover:bg-indigo-50 cursor-pointer'
                  }`}
                >
                  {isProcessing && activeAdId === ad.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isLocked ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      Locked: {remaining}
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      Watch Now
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 border-dashed">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-300 uppercase italic tracking-tighter mb-2 underline decoration-indigo-500/20 underline-offset-4">Watch & Earn Rules</h4>
                <ul className="space-y-2">
                   <li className="text-[10px] font-bold text-slate-400 leading-relaxed flex gap-2">
                     <span className="text-indigo-500">•</span>
                     Pure video watch karne par hi reward milega.
                   </li>
                   <li className="text-[10px] font-bold text-slate-400 leading-relaxed flex gap-2">
                     <span className="text-indigo-500">•</span>
                     Aik baar video play hone ke baad cancel mat karein.
                   </li>
                   <li className="text-[10px] font-bold text-slate-400 leading-relaxed flex gap-2">
                     <span className="text-indigo-500">•</span>
                     Agar reward nahi milta to interet connection check karein.
                   </li>
                </ul>
              </div>
            </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
