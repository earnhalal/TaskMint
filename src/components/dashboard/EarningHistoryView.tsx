import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  History, 
  TrendingUp, 
  PlayCircle, 
  CheckCircle2, 
  Sparkles, 
  Gift, 
  Users, 
  Calendar,
  Wallet,
  Loader2,
  Search,
  Star
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface EarningHistoryViewProps {
  onBack: () => void;
  totalEarnings?: number;
  totalIndirectCommission?: number;
}

export default function EarningHistoryView({ onBack, totalEarnings = 0, totalIndirectCommission = 0 }: EarningHistoryViewProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!auth.currentUser) return;

    // Simplified query to avoid composite index.
    // We filter by userId and then sort/limit in JavaScript.
    const q = query(
      collection(db, 'earning_history'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Sort by timestamp descending
      const sortedData = data.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return timeB - timeA;
      });

      // Limit to 100
      setHistory(sortedData.slice(0, 100));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching earning history:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ad_watch': return <PlayCircle className="w-5 h-5 text-red-500" />;
      case 'task': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'spin': return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'lottery': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'referral':
      case 'invite_commission': 
      case 'indirect_invite_commission': 
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'app_bonus': return <Wallet className="w-5 h-5 text-rose-500" />;
      case 'daily_reward': return <Calendar className="w-5 h-5 text-indigo-500" />;
      case 'commission': return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case 'partner_upgrade': return <Star className="w-5 h-5 text-indigo-500" />;
      case 'withdrawal': return <Wallet className="w-5 h-5 text-purple-500" />;
      default: return <History className="w-5 h-5 text-slate-500" />;
    }
  };

  const getSourceLabel = (source: string) => {
    return source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(item => item.source === filter);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
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
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Earning History</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Track all your rewards</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white mb-6 relative overflow-hidden shadow-2xl shadow-slate-900/20 flex flex-col gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-6">
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Lifetime Rewards Earned</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter">Rs. {totalEarnings.toFixed(2)}</span>
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Lifetime
                </span>
              </div>
            </div>
            {totalIndirectCommission > 0 && (
            <div className="pt-4 sm:pt-0 sm:pl-6 sm:border-l border-white/10">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Indirect Team Income</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400 tracking-tighter">Rs. {totalIndirectCommission.toFixed(2)}</span>
              </div>
            </div>
            )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
        {['all', 'ad_watch', 'task', 'spin', 'lottery', 'invite_commission', 'indirect_invite_commission', 'app_bonus', 'daily_reward'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
              filter === f 
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                : 'bg-white text-slate-500 border border-slate-100'
            }`}
          >
            {f === 'all' ? 'All Activity' : getSourceLabel(f)}
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading History...</p>
          </div>
        ) : filteredHistory.length > 0 ? (
          filteredHistory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                  {getSourceIcon(item.source)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.description}</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Just now'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-black text-sm ${(item.type === 'expense' || item.amount < 0) ? 'text-red-500' : 'text-emerald-600'}`}>
                  {(item.type === 'expense' || item.amount < 0) ? '-' : '+'}Rs. {Math.abs(item.amount).toFixed(2)}
                </span>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">
                  {getSourceLabel(item.source)}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-slate-50 rounded-[2rem] p-12 text-center border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <History className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-black text-lg mb-1">No History Yet</h3>
            <p className="text-slate-400 text-xs font-medium">Start earning to see your activity here!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
