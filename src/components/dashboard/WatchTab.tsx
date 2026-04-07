import React from 'react';
import { motion } from 'motion/react';
import { PlayCircle, Clock, ArrowRight } from 'lucide-react';

export default function WatchTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 px-4 pt-4"
    >
      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg shadow-red-500/30 mb-6">
        <h2 className="text-2xl font-black mb-2">Watch & Earn</h2>
        <p className="text-sm text-red-100 mb-4">Watch short video ads to earn instant rewards.</p>
        <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-lg text-xs font-bold">
          <Clock className="w-4 h-4" /> 10 Ads Available Today
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                <PlayCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Video Ad {i}</h3>
                <p className="text-[10px] text-slate-500">Duration: 30s</p>
              </div>
            </div>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-800 transition-colors">
              Watch <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
