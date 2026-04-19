import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Ticket, Trophy, Users, Clock, CheckCircle2, AlertCircle, Sparkles, Star, Crown, Flame } from 'lucide-react';
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
      className="pb-24 max-w-md mx-auto px-4 pt-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
            Mega Lottery <Sparkles className="w-5 h-5 text-amber-500" />
          </h2>
          <p className="text-xs text-slate-500 font-medium">Join the draw and win massive prizes!</p>
        </div>
      </div>

      {/* Premium Note Banner */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-[2px] shadow-lg shadow-orange-500/20"
      >
        <div className="bg-slate-900 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-inner">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-0.5">Special Announcement</p>
              <p className="text-sm text-white font-medium">Next Mega Draw is filling up fast! Buy your tickets before they sell out.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-5 mb-8 flex items-center justify-between text-white shadow-xl shadow-purple-900/20 border border-purple-500/20 relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-[10px] text-purple-200 uppercase tracking-widest font-bold mb-1">Available Balance</p>
          <p className="text-3xl font-display font-black tracking-tight">Rs {balance.toLocaleString()}</p>
        </div>
        <div className="relative z-10 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
          <Ticket className="w-6 h-6 text-amber-400" />
        </div>
      </motion.div>

      {/* Error Message */}
      {errorMsg && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 mb-6 border border-red-500/20">
          <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
        </motion.div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500/10 text-emerald-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 mb-6 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 shrink-0" /> Successfully joined the lottery! Good luck!
        </motion.div>
      )}

      {/* Active Lotteries */}
      <div className="space-y-5 mb-10">
        <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" /> Active Draws
        </h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold">Loading active draws...</p>
          </div>
        ) : lotteries.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-900 mb-1">No active draws</p>
            <p className="text-sm text-slate-500">Check back later for new mega lotteries!</p>
          </div>
        ) : (
          lotteries.map((lottery, index) => {
            const isJoined = joinedLotteries.includes(lottery.id);
            const userPrize = lottery.prizePool; // 100% to user
            const fillPercentage = (lottery.currentMembers / lottery.maxMembers) * 100;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={lottery.id} 
                className={`relative overflow-hidden rounded-[20px] p-[1px] shadow-lg ${isJoined ? 'shadow-slate-100' : 'shadow-indigo-500/10'}`}
              >
                {/* Dynamic Border Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${lottery.color || 'from-indigo-600 to-blue-500'} animate-pulse-slow`}></div>
                
                {/* Inner Card Wrapper */}
                <div className="relative bg-[#0F172A] rounded-[19px] overflow-hidden">
                  
                  {/* Top Ticket Part (Compact) */}
                  <div className="p-3 sm:p-5 relative">
                    <div className="flex justify-between items-start mb-2 sm:mb-4">
                      <div className="flex flex-col gap-0.5 sm:gap-1">
                        <div className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[7px] sm:text-[9px] font-black uppercase tracking-wider w-fit">
                          <Crown className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-current" /> Premium Draw
                        </div>
                        <h4 className="text-base sm:text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
                           Rs {userPrize.toLocaleString()}
                           <span className="text-[7px] sm:text-[8px] text-slate-500 font-bold uppercase tracking-widest">Prize</span>
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[7px] sm:text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5 sm:mb-1">Fee</p>
                        <div className="bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-white/5 backdrop-blur-sm">
                          <p className="text-[10px] sm:text-base font-black text-amber-400">Rs {lottery.fee}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                       <div className="bg-white/5 rounded-lg p-1.5 sm:p-2.5 border border-white/[0.03]">
                          <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Spots</p>
                          <p className="text-[10px] sm:text-xs font-black text-slate-300">{lottery.maxMembers}</p>
                       </div>
                       <div className="bg-white/5 rounded-lg p-1.5 sm:p-2.5 border border-white/[0.03]">
                          <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
                          <div className="flex items-center gap-1">
                             <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <p className="text-[8px] sm:text-[10px] font-black text-emerald-500 uppercase">OPEN</p>
                          </div>
                       </div>
                    </div>
                  </div>
                  
                  {/* Ticket Notches */}
                  <div className="relative h-px flex items-center justify-between px-0">
                    <div className="w-3 h-6 bg-slate-50 rounded-full -ml-1.5 z-10 border-r border-slate-200"></div>
                    <div className="flex-1 border-t-2 border-dashed border-slate-700/40 mx-1"></div>
                    <div className="w-3 h-6 bg-slate-50 rounded-full -mr-1.5 z-10 border-l border-slate-200"></div>
                  </div>
                  
                  {/* Bottom Ticket Part (Compact) */}
                  <div className="p-3 sm:p-5 pt-6 sm:pt-8 bg-gradient-to-t from-slate-900 to-slate-800/20 relative">
                    <div className="flex justify-between items-end mb-2 sm:mb-3">
                      <div>
                        <p className="text-[7px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Joined</p>
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-black text-white">
                           <Users className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-indigo-400" />
                           {lottery.currentMembers} <span className="text-[8px] sm:text-[10px] text-slate-600 font-bold">/ {lottery.maxMembers}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[7px] sm:text-[9px] font-bold text-indigo-400/80 uppercase tracking-wider mb-0.5">Win Rate</p>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-400">{(1/lottery.maxMembers * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    {/* Compact Progress Bar */}
                    <div className="w-full h-1 sm:h-2 bg-black/40 rounded-full overflow-hidden mb-4 sm:mb-6">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPercentage}%` }}
                        transition={{ duration: 1.5 }}
                        className={`h-full bg-gradient-to-r ${lottery.color || 'from-indigo-600 to-blue-500'} rounded-full`}
                      />
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleJoin(lottery)}
                      disabled={isJoined || lottery.currentMembers >= lottery.maxMembers}
                      className={`w-full py-2 sm:py-3.5 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                        isJoined 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-none' 
                          : lottery.currentMembers >= lottery.maxMembers
                          ? 'bg-slate-800 text-slate-600 border border-slate-700'
                          : `bg-white text-slate-900 shadow-lg`
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" /> SECURED
                        </>
                      ) : lottery.currentMembers >= lottery.maxMembers ? (
                        <>
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" /> SOLD OUT
                        </>
                      ) : (
                        <>
                          <Ticket className="w-3 h-3 sm:w-4 sm:h-4" /> 
                          <span>BUY TICKET</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Joined History Section */}
      <div className="mb-8">
        <h3 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" /> Joined History
        </h3>
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100 overflow-hidden">
          <div className="max-h-64 overflow-y-auto scrollbar-hide p-2">
            {recentEntries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium italic">No entries yet. Be the first!</p>
            ) : (
              recentEntries.map((entry, i) => {
                // Mask name for privacy (e.g., Faizullah -> Faiz***)
                const maskName = (name: string) => {
                  if (name.length <= 4) return name;
                  return name.substring(0, 4) + '***';
                };
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={entry.id || i} 
                    className="flex items-center justify-between p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100 mb-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {entry.userName?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-700">{maskName(entry.userName || 'User')}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Joined Mega Draw</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-600 tracking-tighter">SUCCESS</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Past Winners Announcement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Hall of Fame
        </h3>
        <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm">
          {pastWinners.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8 font-medium">No winners announced yet.</p>
          ) : (
            pastWinners.map((winner, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-2 border-white shadow-sm">
                      <Trophy className="w-6 h-6 text-amber-500" />
                    </div>
                    {i === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">{winner.userName}</p>
                    <p className="text-xs font-medium text-slate-500">{winner.lotteryName} • {winner.timestamp?.toDate ? winner.timestamp.toDate().toLocaleDateString() : 'Recently'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Won</p>
                  <p className="text-lg font-black text-emerald-600">+Rs {winner.prize}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}
