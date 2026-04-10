import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Loader';
import { ArrowLeft, Star, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskWallProps {
  onBack: () => void;
}

export default function TaskWall({ onBack }: TaskWallProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

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
