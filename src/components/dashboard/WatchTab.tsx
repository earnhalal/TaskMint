import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { PlayCircle, Clock, Sparkles, Wallet, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { doc, updateDoc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface WatchTabProps {
  onBack: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
}

const VIDEO_ADS = [
  { id: 'ad_1', title: 'Video Ad #1', reward: 0.20, limit: 5 },
  { id: 'ad_2', title: 'Video Ad #2', reward: 0.20, limit: 5 },
  { id: 'ad_3', title: 'Video Ad #3', reward: 0.20, limit: 5 },
  { id: 'ad_4', title: 'Video Ad #4', reward: 0.20, limit: 5 },
  { id: 'ad_5', title: 'Video Ad #5', reward: 0.20, limit: 5 },
];

export default function WatchTab({ onBack, balance, onUpdateBalance }: WatchTabProps) {
  const [adStats, setAdStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isWatching, setIsWatching] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchStats = async () => {
      if (!auth.currentUser) return;
      try {
        const statsRef = doc(db, 'user_ad_stats', `${auth.currentUser.uid}_${today}`);
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          setAdStats(statsSnap.data().counts || {});
        }
      } catch (error) {
        console.error("Error fetching ad stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [today]);

  const handleWatchAd = async (ad: typeof VIDEO_ADS[0]) => {
    const currentCount = adStats[ad.id] || 0;
    if (currentCount >= ad.limit) {
      alert("Daily limit reached for this video!");
      return;
    }

    setIsWatching(ad.id);
    setMessage(null);

    // Trigger AppCreator24 Rewarded Video Intent
    // Note: This works inside the APK
    try {
      window.location.href = 'appcreator24://rewarded/video';
    } catch (e) {
      console.log("Not in APK or intent failed");
    }

    // Simulate ad watching delay (e.g. 15 seconds)
    // In a real scenario, AppCreator24 would call a callback
    // For this implementation, we'll reward after a delay to simulate the process
    setTimeout(async () => {
      if (!auth.currentUser) return;

      try {
        const statsRef = doc(db, 'user_ad_stats', `${auth.currentUser.uid}_${today}`);
        const newCounts = { ...adStats, [ad.id]: currentCount + 1 };
        
        await setDoc(statsRef, {
          userId: auth.currentUser.uid,
          date: today,
          counts: newCounts,
          lastUpdated: serverTimestamp()
        }, { merge: true });

        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          balance: increment(ad.reward)
        });

        setAdStats(newCounts);
        onUpdateBalance(ad.reward);
        setMessage({ type: 'success', text: `Mubarak ho! Rs. ${ad.reward} aapke wallet mein add ho gaye hain.` });
      } catch (error) {
        console.error("Error rewarding ad:", error);
        setMessage({ type: 'error', text: "Reward add karne mein masla hua." });
      } finally {
        setIsWatching(null);
      }
    }, 5000); // 5 seconds simulation for demo, usually ads are 15-30s
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
        <h2 className="text-2xl font-black mb-2 tracking-tighter">Watch & Earn</h2>
        <p className="text-xs text-red-100 font-bold opacity-90">Watch short video ads to get instant rewards.</p>
        <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-amber-300" /> High Paying Ads
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
          const count = adStats[ad.id] || 0;
          const isFull = count >= ad.limit;
          const isThisWatching = isWatching === ad.id;

          return (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all ${isFull ? 'opacity-60' : 'hover:border-red-200'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isFull ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-500'}`}>
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{ad.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Earn Rs {ad.reward.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {count}/{ad.limit} Today
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleWatchAd(ad)}
                disabled={!!isWatching || isFull}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md ${
                  isFull 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : isThisWatching 
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                }`}
              >
                {isThisWatching ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                  </div>
                ) : isFull ? 'Limit Reached' : 'Watch Now'}
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
    </motion.div>
  );
}
