import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Loader';
import { ArrowLeft, Star, Info, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskWallProps {
  onBack: () => void;
  accountStatus: string;
  onPayClick: () => void;
}

export default function TaskWall({ onBack, accountStatus, onPayClick }: TaskWallProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full w-full relative pb-24 px-4 pt-2"
    >
      {/* Top Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-slate-900">Survey Wall</h2>
      </div>

      {isLoading && <Loader />}
      
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white mb-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
          Task Wall <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
        </h2>
        <p className="text-xs text-indigo-100 font-medium leading-relaxed max-w-[280px]">
          Complete surveys and earn real cash. 
          <span className="block mt-2 font-black text-white text-sm">Conversion: $1 = Rs. 150</span>
        </p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden relative min-h-[800px]">
        {/* Paywall Overlay */}
        {!isApproved && (
          <div className="absolute inset-0 z-30 backdrop-blur-md bg-white/40 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center mb-6 animate-bounce">
              <Lock className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight">Unlock Premium Tasks!</h3>
            <p className="text-sm text-slate-600 font-bold mb-8 max-w-[280px]">
              In High-paying tasks ko shuru karne ke liye Rs. 100 Joining Fee jama karwayein.
            </p>
            <button 
              onClick={onPayClick}
              className="bg-gradient-to-r from-amber-500 to-amber-700 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/30 active:scale-95 transition-all"
            >
              Pay Now
            </button>
          </div>
        )}
        
        <iframe
          src={cpxUrl}
          className="w-full h-[800px] border-none"
          title="CPX Research Surveys"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      <div className="mt-6 p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-indigo-400" />
          <p className="text-[10px] font-black text-white uppercase tracking-widest">Instructions</p>
        </div>
        <ul className="space-y-3">
          <li className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              Answer all questions honestly to avoid disqualification.
            </p>
          </li>
          <li className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              Earnings will be added to your wallet within 5-10 minutes of completion.
            </p>
          </li>
        </ul>
      </div>
    </motion.div>
  );
}
