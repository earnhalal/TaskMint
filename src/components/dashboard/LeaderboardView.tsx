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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24 min-h-screen bg-slate-50"
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 px-4 py-4 mb-2">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
            <ArrowLeft className="w-6 h-6 text-slate-600 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 leading-none">Global Rankings</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Live Updates</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-2">
        {/* Winners Podium */}
        <div className="relative mb-12 mt-6 flex justify-center items-end gap-2 h-64">
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-200 to-transparent rounded-t-[40px] opacity-30"></div>
          
          {/* 2nd Place */}
          {topThree[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="flex flex-col items-center gap-2 flex-1 z-10"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                  <span className="text-xl font-black text-slate-500">{topThree[1].username?.substring(0, 1).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-400 rounded-lg flex items-center justify-center text-white border-2 border-white shadow-lg">
                  <Medal className="w-4 h-4" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-900 truncate w-20">{topThree[1].username}</p>
                <p className="text-xs font-black text-slate-500">#{topThree[1].balance?.toLocaleString()}</p>
              </div>
              <div className="w-full h-24 bg-gradient-to-b from-slate-300 to-slate-400 rounded-t-2xl shadow-inner flex items-center justify-center">
                <span className="text-3xl font-black text-white/50">2</span>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="flex flex-col items-center gap-2 flex-1 z-20 -mb-4 scale-110"
            >
              <div className="relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
                  <Crown className="w-8 h-8 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                </div>
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                   <span className="text-2xl font-black text-white relative z-10">{topThree[0].username?.substring(0, 1).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white border-2 border-white shadow-lg">
                  <Star className="w-4 h-4 fill-current" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-slate-900 truncate w-24 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{topThree[0].username}</p>
                <p className="text-sm font-black text-amber-600">PKR {topThree[0].balance?.toLocaleString()}</p>
              </div>
              <div className="w-full h-36 bg-gradient-to-b from-amber-400 to-amber-600 rounded-t-3xl shadow-xl flex items-center justify-center border-x border-t border-white/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full animate-shimmer"></div>
                <span className="text-5xl font-black text-white/40 drop-shadow-md">1</span>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="flex flex-col items-center gap-2 flex-1 z-10"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                  <span className="text-xl font-black text-amber-700">{topThree[2].username?.substring(0, 1).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-700 rounded-lg flex items-center justify-center text-white border-2 border-white shadow-lg">
                  <Medal className="w-4 h-4" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-900 truncate w-20">{topThree[2].username}</p>
                <p className="text-xs font-black text-amber-700">#{topThree[2].balance?.toLocaleString()}</p>
              </div>
              <div className="w-full h-20 bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-2xl shadow-inner flex items-center justify-center">
                <span className="text-3xl font-black text-white/40">3</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
               <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
               </div>
               <div>
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Top Reward</p>
                  <p className="text-sm font-black text-emerald-700">Rs 50k+</p>
               </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center gap-3">
               <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                  <Users className="w-4 h-4" />
               </div>
               <div>
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-wider">Active Peers</p>
                  <p className="text-sm font-black text-blue-700">2.4k+</p>
               </div>
            </div>
        </div>

        {/* List of Earners */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {remainingEarners.map((user, i) => (
            <motion.div 
              key={user.id ? `earner-${user.id}` : `earner-idx-${i}`}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                   {user.rank || i + 4}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black text-xs border border-white shadow-sm">
                    {user.username ? user.username.substring(0, 2).toUpperCase() : '??'}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm group-hover:text-slate-700 transition-colors uppercase tracking-tight">{user.username || 'Anonymous Earner'}</h3>
                    <div className="flex items-center gap-1">
                       <span className="text-[9px] font-black text-slate-400 tracking-wider">VERIFIED</span>
                       <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all">
                <span className="text-xs font-black text-emerald-600 group-hover:text-white">{user.balance?.toLocaleString() || 0} PKR</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
          width: 50%;
          height: 200%;
        }
      `}</style>
    </motion.div>
  );
}
