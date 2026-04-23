import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Ticket, Trophy, Users, Clock, CheckCircle2, AlertCircle, Sparkles, Star, Crown, Flame, ArrowRight } from 'lucide-react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, updateDoc, increment, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth, rtdb } from '../../firebase';
import { ref, update, increment as rtdbIncrement } from 'firebase/database';

interface LotteryViewProps {
  onBack: () => void;
  balance: number;
  userName: string;
  onUpdateBalance: (amount: number, source?: string, description?: string) => void;
}

interface Lottery {
  id: string;
  fee: number;
  maxMembers: number;
  currentMembers: number;
  prizePool: number;
  drawDate: any;
  status: 'active' | 'completed';
  color: string;
}

interface Winner {
  userName: string;
  prize: number;
  lotteryName: string;
  timestamp: any;
}

export default function LotteryView({ onBack, balance, userName, onUpdateBalance }: LotteryViewProps) {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [joinedLotteries, setJoinedLotteries] = useState<string[]>([]);
  const [pastWinners, setPastWinners] = useState<Winner[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen for active lotteries
    const lotteriesQuery = query(collection(db, 'lotteries'), where('status', '==', 'active'));
    const unsubscribeLotteries = onSnapshot(lotteriesQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lottery));
      setLotteries(docs);
      setLoading(false);
    });

    // 2. Listen for user's joined lotteries
    if (auth.currentUser) {
      const entriesQuery = query(
        collection(db, 'lottery_entries'), 
        where('userId', '==', auth.currentUser.uid)
      );
      const unsubscribeEntries = onSnapshot(entriesQuery, (snapshot) => {
        const ids = snapshot.docs.map(doc => doc.data().lotteryId);
        setJoinedLotteries(ids);
      });

      return () => {
        unsubscribeLotteries();
        unsubscribeEntries();
      };
    }

    return () => unsubscribeLotteries();
  }, []);

  useEffect(() => {
    // 3. Listen for past winners
    const winnersQuery = query(
      collection(db, 'lottery_winners'), 
      orderBy('timestamp', 'desc'), 
      limit(10)
    );
    const unsubscribeWinners = onSnapshot(winnersQuery, (snapshot) => {
      const winners = snapshot.docs.map(doc => doc.data() as Winner);
      setPastWinners(winners);
    });

    // 4. Listen for recent participants (Joined History)
    const recentQuery = query(
      collection(db, 'lottery_entries'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentEntries(entries);
    });

    return () => {
      unsubscribeWinners();
      unsubscribeRecent();
    };
  }, []);

  const handleJoin = async (lottery: Lottery) => {
    if (!auth.currentUser) return;
    
    if (balance < lottery.fee) {
      setErrorMsg(`Insufficient balance. You need Rs ${lottery.fee} to join.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    try {
      // Robust name detection for entries
      const storedName = localStorage.getItem('taskmint_name');
      const entryName = userName || storedName || auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Member';
      
      // 1. Create entry
      await addDoc(collection(db, 'lottery_entries'), {
        lotteryId: lottery.id,
        userId: auth.currentUser.uid,
        userName: entryName,
        timestamp: serverTimestamp()
      });

      // 2. Update user balance using centralized logic
      await onUpdateBalance(-lottery.fee);
      
      const newMemberCount = lottery.currentMembers + 1;

      // 4. Check if lottery is full
      if (newMemberCount >= lottery.maxMembers) {
        // Mark as completed
        await updateDoc(doc(db, 'lotteries', lottery.id), {
          currentMembers: newMemberCount,
          status: 'completed'
        });

        // Perform Draw
        const entriesSnapshot = await getDocs(query(collection(db, 'lottery_entries'), where('lotteryId', '==', lottery.id)));
        const entries = entriesSnapshot.docs.map(d => d.data());
        
        if (entries.length > 0) {
          const winnerIndex = Math.floor(Math.random() * entries.length);
          const winner = entries[winnerIndex];

          // Award prize to winner in both DBs
          await updateDoc(doc(db, 'users', winner.userId), {
            balance: increment(lottery.prizePool)
          });
          
          const winnerRtdbRef = ref(rtdb, `users/${winner.userId}`);
          await update(winnerRtdbRef, {
            balance: rtdbIncrement(lottery.prizePool)
          });

          // Record in Earning History
          await addDoc(collection(db, 'earning_history'), {
            userId: winner.userId,
            amount: lottery.prizePool,
            source: 'lottery',
            description: `Won Mega Draw Lottery (Rs ${lottery.prizePool})`,
            timestamp: serverTimestamp()
          });

          // Record winner
          await addDoc(collection(db, 'lottery_winners'), {
            lotteryId: lottery.id,
            lotteryName: `Mega Draw (Rs ${lottery.prizePool})`,
            userId: winner.userId,
            userName: winner.userName || 'Member', 
            prize: lottery.prizePool,
            timestamp: serverTimestamp()
          });

          // Send notifications to all participants
          const uniqueUserIds = [...new Set(entries.map(e => e.userId))];
          for (const uid of uniqueUserIds) {
            await addDoc(collection(db, 'notifications'), {
              userId: uid,
              title: uid === winner.userId ? '🎉 You won the Lottery!' : 'Lottery Results',
              message: uid === winner.userId 
                ? `Congratulations! You won Rs ${lottery.prizePool} in the Mega Draw!` 
                : `The Mega Draw has ended. ${winner.userName || 'Someone'} won the prize. Better luck next time!`,
              type: 'lottery',
              status: 'unread',
              timestamp: serverTimestamp()
            });
          }
        }
      } else {
        // Just update member count
        await updateDoc(doc(db, 'lotteries', lottery.id), {
          currentMembers: increment(1)
        });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error joining lottery:", error);
      setErrorMsg("Failed to join lottery. Please try again.");
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 max-w-4xl mx-auto px-4 pt-6"
    >
      {/* Header - Glassmorphism */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 hover:bg-slate-50 shadow-sm transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic flex items-center gap-2">
              Mega <span className="text-indigo-600">Protocol</span> <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Prize Network</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl">
           <Users className="w-4 h-4 text-indigo-600" />
           <span className="text-xs font-black text-indigo-900 uppercase">Live Network</span>
        </div>
      </div>

      {/* Hero Banner - High Premium */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-10 relative overflow-hidden rounded-[2.5rem] bg-[#0A0B0F] p-8 shadow-2xl border border-white/5"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -mr-40 -mt-40 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/5 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-4 text-amber-500 text-[9px] font-black uppercase tracking-widest">
                   <Flame className="w-3 h-3 fill-current" /> High Stakes Active
                </div>
                <h3 className="text-3xl font-black text-white mb-3 tracking-tight italic">Fortune <span className="text-indigo-400">Accelerator</span></h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm mb-6">
                    Our decentralized draw system ensures transparency. Every ticket is a potential entry into the global elite fund.
                </p>
                <div className="flex items-center justify-center md:justify-start gap-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Payouts</p>
                        <p className="text-xl font-black text-white italic tracking-tighter">Rs 5M+</p>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Trials</p>
                        <p className="text-xl font-black text-white italic tracking-tighter">Instant Draw</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-inner shrink-0 text-center w-full md:w-auto">
               <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Your Liquidity</p>
               <p className="text-4xl font-black text-white italic tracking-tighter mb-4">Rs {balance.toLocaleString()}</p>
               <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30 text-indigo-400">
                  <Ticket className="w-7 h-7" />
               </div>
            </div>
        </div>
      </motion.div>

      {/* Error / Success Notifications */}
      <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 mb-8 border border-red-100 shadow-lg shadow-red-500/5">
              <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
            </motion.div>
          )}

          {showSuccess && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 mb-8 border border-emerald-100 shadow-lg shadow-emerald-500/5">
              <CheckCircle2 className="w-5 h-5 shrink-0" /> Entry Encrypted & Secured
            </motion.div>
          )}
      </AnimatePresence>

      {/* Active Lotteries Grid */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" /> Active Operations
            </h3>
            <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                    animate={{ x: [-128, 128] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-full bg-indigo-500"
                />
            </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-xl"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Network...</p>
          </div>
        ) : lotteries.length === 0 ? (
          <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-16 text-center shadow-inner">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <Ticket className="w-10 h-10" />
            </div>
            <p className="text-xl font-black text-slate-900 mb-2 italic">Zero Active Nodes</p>
            <p className="text-xs text-slate-400 font-medium">Internal systems are recalibrating. Standby for next cycle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {lotteries.map((lottery, index) => {
                const isJoined = joinedLotteries.includes(lottery.id);
                const fillPercentage = (lottery.currentMembers / lottery.maxMembers) * 100;

                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    key={lottery.id} 
                    className="relative group h-full"
                  >
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    
                    <div className="relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl transition-all hover:translate-y-[-8px] hover:shadow-2xl h-full flex flex-col">
                        {/* Ticket Top */}
                        <div className="p-8 pb-4 relative flex-1">
                            <div className="flex justify-between items-start mb-6">
                                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase border border-indigo-100 italic">Mega Node</span>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Access Fee</p>
                                    <p className="text-xl font-black text-slate-900 tracking-tighter italic">Rs {lottery.fee}</p>
                                </div>
                            </div>
                            
                            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Potential Yield</p>
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-8 italic">Rs {lottery.prizePool.toLocaleString()}</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                                    <p className="text-xs font-black text-slate-900 font-mono tracking-tight">{lottery.maxMembers} Nodes</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Integrity</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <p className="text-[9px] font-black text-emerald-600 uppercase">Secure</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative h-px flex items-center justify-between px-0 overflow-visible">
                            <div className="w-4 h-8 bg-slate-50 rounded-full -ml-2 z-10 border-r border-slate-100"></div>
                            <div className="flex-1 border-t-4 border-dotted border-slate-100 mx-4"></div>
                            <div className="w-4 h-8 bg-slate-50 rounded-full -mr-2 z-10 border-l border-slate-100"></div>
                        </div>

                        {/* Ticket Bottom */}
                        <div className="p-8 pt-4 bg-slate-50/50">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Node Progression</p>
                                    <p className="text-xs font-black text-slate-900 tracking-tight">{lottery.currentMembers} <span className="text-slate-400 font-bold">/ {lottery.maxMembers} Captured</span></p>
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 italic">{(1/lottery.maxMembers * 100).toFixed(1)}% Prob.</span>
                            </div>

                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-8 shadow-inner">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${fillPercentage}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full relative"
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </motion.div>
                            </div>

                            <motion.button
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleJoin(lottery)}
                                disabled={isJoined || lottery.currentMembers >= lottery.maxMembers}
                                className={`w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 ${
                                    isJoined 
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-none' 
                                    : lottery.currentMembers >= lottery.maxMembers
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : `bg-[#0A0B0F] text-white shadow-2xl shadow-slate-900/10`
                                }`}
                            >
                                {isJoined ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Entry Secure</>
                                ) : lottery.currentMembers >= lottery.maxMembers ? (
                                    <><Lock className="w-4 h-4" /> Capacity Full</>
                                ) : (
                                    <><ArrowRight className="w-4 h-4 text-indigo-500" /> Acquire Entry Ticket</>
                                )}
                            </motion.button>
                        </div>
                    </div>
                  </motion.div>
                );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Recent Ledger History */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Recent Entries
            </h3>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
                <div className="p-2 space-y-1">
                    {recentEntries.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-60">System idle. No recent activity.</p>
                        </div>
                    ) : (
                        recentEntries.map((entry, i) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={entry.id || i} 
                                className="flex items-center justify-between p-5 hover:bg-slate-50 transition-all rounded-[1.5rem] group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                                        {entry.userName?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 italic tracking-tight">{entry.userName}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Acquired Entry Token</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-600 italic tracking-widest">VERIFIED</p>
                                    <p className="text-[8px] font-bold text-slate-400 mt-0.5">{entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'SYNCING...'}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
          </div>

          {/* Hall of Fame - Premium Winners */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Hall of Protocol
            </h3>
            <div className="bg-[#0A0B0F] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[400px] text-white relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
                 <div className="p-2 space-y-1 relative z-10">
                    {pastWinners.length === 0 ? (
                        <div className="text-center py-20 opacity-40">
                             <p className="text-[10px] font-bold uppercase tracking-widest italic leading-relaxed">System history is blank.<br/>The first elite winner is yet to be born.</p>
                        </div>
                    ) : (
                        pastWinners.map((winner, i) => (
                            <div key={i} className="flex items-center justify-between p-6 hover:bg-white/5 transition-all rounded-[1.5rem] border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center border border-white/10 shadow-2xl shadow-amber-500/20">
                                            <Trophy className="w-7 h-7 text-white" />
                                        </div>
                                        <Star className="absolute -top-2 -right-2 w-5 h-5 text-amber-400 fill-current" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-white italic tracking-tighter">{winner.userName}</p>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{winner.lotteryName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 italic">Yield Unlocked</p>
                                    <p className="text-2xl font-black text-white italic tracking-tighter">Rs {winner.prize.toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                 </div>
            </div>
          </div>
      </div>
    </motion.div>
  );
}
