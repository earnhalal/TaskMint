import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Layout, Star, Info, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TasksTabProps {
  onBack: () => void;
  accountStatus: string;
  onPayClick: () => void;
}

export default function TasksTab({ onBack, accountStatus, onPayClick }: TasksTabProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const isApproved = accountStatus.toLowerCase() === 'active';

  const userId = user?.uid || "";
  const wannadsUrl = `https://earn.wannads.com/wall?apiKey=69d9648474a17761405810&userId=${userId}`;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="pb-24 px-4 pt-2"
    >
      {/* Top Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-slate-900">Offer Wall</h2>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
          Tasks <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
        </h2>
        <p className="text-sm text-indigo-100 font-medium">Complete high-paying offers and apps to boost your earnings.</p>
      </div>

      {/* Wall Container */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden relative min-h-[800px]">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-black text-slate-900 animate-pulse">Loading OfferWall...</p>
            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Please wait a moment</p>
          </div>
        )}

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
        
        <div className="w-full h-[800px] overflow-y-auto no-scrollbar">
          <iframe
            src={wannadsUrl}
            className="w-full h-full border-none"
            title="Wannads OfferWall"
            onLoad={() => setIsLoading(false)}
            style={{ width: '100%', height: '800px', border: '0' }}
          />
        </div>
      </div>

      {/* Pro Tips */}
      <div className="mt-6 p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-indigo-400" />
          <p className="text-[10px] font-black text-white uppercase tracking-widest">Pro Tips for Earning</p>
        </div>
        <ul className="space-y-3">
          <li className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              Offers mukammal karne ke baad instructions zaroor parhein taake reward mil sake.
            </p>
          </li>
          <li className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              Wannads rewards aksar 24 ghanton ke andar aapke wallet mein add ho jate hain.
            </p>
          </li>
        </ul>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}
