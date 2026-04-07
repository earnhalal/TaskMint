import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Medal, Crown } from 'lucide-react';

interface LeaderboardViewProps {
  earners: any[];
  onBack: () => void;
}

export default function LeaderboardView({ earners, onBack }: LeaderboardViewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 px-4 pt-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Top Earners</h2>
      </div>

      <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg shadow-yellow-500/30 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-1">Leaderboard</h2>
            <p className="text-sm text-yellow-100">Top performers this week</p>
          </div>
          <Trophy className="w-12 h-12 text-yellow-200 opacity-80" />
        </div>
      </div>

      <div className="space-y-3">
        {earners.map((user, i) => (
          <div key={user.id ? `earner-${user.id}` : `earner-idx-${i}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden">
            {user.rank === 1 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>}
            {user.rank === 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>}
            {user.rank === 3 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-600"></div>}
            
            <div className="flex items-center gap-4">
              <div className="w-8 text-center font-black text-slate-400">
                {user.rank === 1 ? <Crown className="w-6 h-6 text-yellow-500 mx-auto" /> : 
                 user.rank === 2 ? <Medal className="w-6 h-6 text-slate-400 mx-auto" /> :
                 user.rank === 3 ? <Medal className="w-6 h-6 text-amber-600 mx-auto" /> : 
                 `#${user.rank}`}
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                {user.username ? user.username.substring(0, 2).toUpperCase() : '??'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{user.username || 'Unknown'}</h3>
                <p className="text-[10px] text-slate-500">Active Earner</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-emerald-600">{user.balance?.toLocaleString() || 0} PKR</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
