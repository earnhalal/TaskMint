import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Loader';
import { ArrowLeft, Star, Info, Lock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskWallProps {
  onBack: () => void;
  accountStatus: string;
  onPayClick: () => void;
}

export default function TaskWall({ onBack, accountStatus, onPayClick }: TaskWallProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const isApproved = accountStatus.toLowerCase() === 'active';

  // CPX Research App ID
  const appId = "32325";
  const userId = user?.uid || "";
  
  // CPX Research URL
  const cpxUrl = `https://offers.cpx-research.com/index.php?app_id=${appId}&ext_user_id=${userId}`;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] bg-white flex flex-col"
    >
      {/* Immersive Header */}
      <div className="bg-[#4C1D95] px-4 h-16 flex items-center justify-between shrink-0 shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white leading-none">Survey Wall</h2>
              <div className="bg-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded text-white uppercase tracking-tighter">Live</div>
            </div>
            <p className="text-[10px] text-violet-300 font-bold uppercase tracking-widest mt-1">CPX Research</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showInfo ? 'bg-white text-violet-900 shadow-lg' : 'bg-white/10 text-violet-100 hover:bg-white/20'}`}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info Overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 z-50 p-4"
          >
            <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Star className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Survey Info</h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0"></div>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">
                    Answer all questions honestly to avoid disqualification.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0"></div>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">
                    Earnings will be added to your wallet within 5-10 minutes. Conversion: $1 = Rs. 150.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="w-full mt-6 py-3 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors"
              >
                Close Info
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wall Container */}
      <div className="flex-1 relative bg-slate-50">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-violet-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-black text-slate-900 animate-pulse">Loading Surveys...</p>
          </div>
        )}

        {/* Paywall Overlay */}
        {!isApproved && (
          <div className="absolute inset-0 z-30 backdrop-blur-md bg-white/60 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8 -rotate-3 border border-slate-100">
              <Lock className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 leading-tight">Unlock Premium Surveys!</h3>
            <p className="text-base text-slate-600 font-bold mb-10 max-w-xs mx-auto">
              In High-paying tasks ko shuru karne ke liye Rs. 100 Joining Fee jama karwayein.
            </p>
            <button 
              onClick={onPayClick}
              className="w-full max-w-xs bg-gradient-to-r from-violet-600 to-indigo-700 text-white py-5 rounded-2xl font-black text-sm shadow-2xl shadow-violet-600/40 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Pay Now to Unlock
            </button>
          </div>
        )}
        
        <iframe
          src={cpxUrl}
          className="w-full h-full border-none"
          title="CPX Research Surveys"
          onLoad={() => setIsLoading(false)}
          style={{ width: '100%', height: '100%', border: '0' }}
        />
      </div>
    </motion.div>
  );
}
