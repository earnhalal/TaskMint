import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Medal, Crown, Star, TrendingUp, Users } from 'lucide-react';

interface LeaderboardViewProps {
  earners: any[];
  onBack: () => void;
}

export default function LeaderboardView({ earners, onBack }: LeaderboardViewProps) {
  const topThree = earners.slice(0, 3);
  const remainingEarners = earners.slice(3);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24 min-h-screen bg-[#0A0B0F] text-white overflow-hidden"
    >
      {/* Ambient background elements */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Futuristic Header */}
      <div className="relative bg-[#0A0B0F]/80 backdrop-blur-xl sticky top-0 z-40 border-b border-white/5 px-6 py-6 mb-8 group overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
        
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-5">
            <button 
              onClick={onBack} 
              className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/5 hover:bg-white/10 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                Global <span className="text-amber-500">Node</span> Rankings
              </h2>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Live Telemetry Active</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Total Yield: 2.4M PKR</span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 relative z-10">
        {/* Dynamic Podium Architecture */}
        <div className="relative mb-20 mt-12 flex justify-center items-end gap-3 h-72">
          {/* Base Glow */}
          <div className="absolute -bottom-8 inset-x-0 h-24 bg-gradient-to-t from-amber-500/10 to-transparent blur-3xl opacity-30" />
          
          {/* 2nd Place: Silver Sync */}
          {topThree[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: 'spring', damping: 15 }}
              className="flex flex-col items-center gap-3 flex-1 perspective-[1000px]"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-slate-400 blur-xl opacity-0 group-hover:opacity-40 transition-opacity" />
                <div className="relative w-20 h-20 rounded-[2rem] bg-[#1a1b23] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-500">
                  <span className="text-2xl font-black text-slate-400 italic">{topThree[1].username?.substring(0, 1).toUpperCase()}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-400 rounded-xl flex items-center justify-center text-white border-2 border-[#0A0B0F] shadow-lg">
                  <Medal className="w-4 h-4" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest truncate w-24">{topThree[1].username}</p>
                <p className="text-sm font-black text-slate-300 italic">Rs {topThree[1].balance?.toLocaleString()}</p>
              </div>
              <div className="w-full h-28 bg-gradient-to-b from-[#1a1b23] to-[#0A0B0F] rounded-t-3xl border-x border-t border-white/5 shadow-inner flex flex-col items-center pt-4">
                 <div className="w-8 h-8 rounded-full bg-slate-400/20 flex items-center justify-center text-slate-400 mb-2">
                    <span className="text-lg font-black italic">2</span>
                 </div>
                 <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-slate-400/30" />)}
                 </div>
              </div>
            </motion.div>
          )}

          {/* 1st Place: Gold Alpha */}
          {topThree[0] && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 12 }}
              className="flex flex-col items-center gap-4 flex-1 z-20 scale-110 -mb-6"
            >
              <div className="relative group">
                <motion.div 
                  animate={{ y: [0, -10, 0], rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 z-30"
                >
                  <Crown className="w-10 h-10 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
                </motion.div>
                
                <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 group-hover:opacity-50 transition-opacity" />
                <div className="relative w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-[0_0_40px_rgba(245,158,11,0.2)] transition-transform group-hover:scale-105 duration-500">
                   <div className="w-full h-full rounded-[2.3rem] bg-[#1a1b23] flex items-center justify-center relative overflow-hidden">
                       <span className="text-3xl font-black text-amber-500 italic relative z-10">{topThree[0].username?.substring(0, 1).toUpperCase()}</span>
                       <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent" />
                       <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                   </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white border-2 border-[#0A0B0F] shadow-xl">
                  <Star className="w-5 h-5 fill-current" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1 italic">{topThree[0].username}</p>
                <p className="text-xl font-black text-white italic tracking-tighter">Rs {topThree[0].balance?.toLocaleString()}</p>
              </div>
              <div className="w-full h-44 bg-gradient-to-b from-amber-500/10 to-amber-500/0 rounded-t-[3rem] border-x border-t border-amber-500/20 shadow-2xl flex flex-col items-center pt-6 relative overflow-hidden group/podium">
                 <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                 <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white mb-4 shadow-xl shadow-amber-500/20">
                    <span className="text-2xl font-black italic">1</span>
                 </div>
                 <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />)}
                 </div>
              </div>
            </motion.div>
          )}

          {/* 3rd Place: Bronze Nexus */}
          {topThree[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: 'spring', damping: 15 }}
              className="flex flex-col items-center gap-3 flex-1 perspective-[1000px]"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-amber-700 blur-xl opacity-0 group-hover:opacity-40 transition-opacity" />
                <div className="relative w-18 h-18 rounded-[1.8rem] bg-[#1a1b23] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-500">
                  <span className="text-xl font-black text-amber-700 italic">{topThree[2].username?.substring(0, 1).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-800 rounded-xl flex items-center justify-center text-white border-2 border-[#0A0B0F] shadow-lg">
                  <Medal className="w-4 h-4" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest truncate w-24">{topThree[2].username}</p>
                <p className="text-sm font-black text-amber-800 italic">Rs {topThree[2].balance?.toLocaleString()}</p>
              </div>
              <div className="w-full h-24 bg-gradient-to-b from-[#1a1b23] to-[#0A0B0F] rounded-t-3xl border-x border-t border-white/5 shadow-inner flex flex-col items-center pt-4">
                 <div className="w-8 h-8 rounded-full bg-amber-900/20 flex items-center justify-center text-amber-800 mb-2">
                    <span className="text-lg font-black italic">3</span>
                 </div>
                 <div className="flex gap-1">
                    {[...Array(2)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-amber-900/30" />)}
                 </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Global Telemetry List */}
        <div className="space-y-6">
            <div className="flex items-center gap-4 px-2">
               <h3 className="text-sm font-black italic uppercase tracking-widest text-slate-500">Node Transmission</h3>
               <div className="h-px flex-1 bg-white/5" />
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {remainingEarners.map((user, i) => (
                <motion.div 
                  key={user.id ? `earner-${user.id}` : `earner-idx-${i}`}
                  variants={itemVariants}
                  whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.03)' }}
                  className="relative group bg-[#111218] px-6 py-5 rounded-[2rem] border border-white/5 flex items-center justify-between cursor-pointer transition-all duration-300"
                >
                  <div className="absolute left-0 inset-y-6 w-1 bg-amber-500/0 group-hover:bg-amber-500 transition-all rounded-r-full" />
                  
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-slate-500 text-sm italic border border-white/5 group-hover:border-amber-500/30 group-hover:text-amber-500 transition-all">
                       {user.rank || i + 4}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center text-white/50 font-black text-sm border border-white/5 group-hover:text-white transition-colors">
                        {user.username ? user.username.substring(0, 2).toUpperCase() : '??'}
                      </div>
                      <div>
                        <h3 className="font-black text-white text-base tracking-tight uppercase italic">{user.username || 'Unknown Node'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                           <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Quantum Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-amber-500 italic tracking-tighter">Rs {user.balance?.toLocaleString() || 0}</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Accumulated Yield</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
