import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Ticket, Trophy, Users, Clock, CheckCircle2, AlertCircle, Sparkles, Star, Crown, Flame, ArrowRight, Zap, Shield, Lock } from 'lucide-react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, updateDoc, increment, orderBy, limit, getDocs, getDoc } from 'firebase/firestore';
import { db, auth, rtdb } from '../../firebase';
import { ref, update, increment as rtdbIncrement } from 'firebase/database';
import { DynamicAvatar } from '../ui/DynamicAvatar';

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
  userId: string;
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
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [freeTickets, setFreeTickets] = useState(0);

  useEffect(() => {
    const resolveGenericNames = async () => {
      const allItems = [...pastWinners, ...recentEntries];
      const genericItems = allItems.filter(item => 
        item && item.userId && (
          !item.userName || 
          item.userName === 'Member' || 
          item.userName.toLowerCase() === 'user' ||
          item.userName.toLowerCase() === 'member'
        )
      );
      
      if (genericItems.length === 0) return;

      const newResolved = { ...resolvedNames };
      let changed = false;

      for (const item of genericItems) {
        if (item.userId && !newResolved[item.userId]) {
          try {
            // Use a local variable to check firestore doc to avoid redundant requests in short time
            const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', item.userId)));
            if (!userDoc.empty) {
              const data = userDoc.docs[0].data();
              const username = data.username || data.name;
              if (username && username.toLowerCase() !== 'user') {
                newResolved[item.userId] = username;
                changed = true;
              }
            }
          } catch (e) {
            console.error("Error resolving name:", e);
          }
        }
      }

      if (changed) {
        setResolvedNames(newResolved);
      }
    };

    resolveGenericNames();
  }, [pastWinners, recentEntries]);

  // Helper to get the best name
  const getDisplayName = (item: any) => {
    return resolvedNames[item.userId] || item.userName || item.username || 'Member';
  };
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

      const unsubscribeUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
        if (doc.exists()) {
          setFreeTickets(doc.data().freeLotteryTickets || 0);
        }
      });

      return () => {
        unsubscribeLotteries();
        unsubscribeEntries();
        unsubscribeUser();
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
      const winners = snapshot.docs.map(doc => {
        const data = doc.data();
        let name = data.userName || data.username || 'Member';
        if (name.toLowerCase() === 'user') name = 'Member';
        return {
          userId: data.userId || '',
          ...data,
          userName: name
        } as Winner;
      });
      setPastWinners(winners);
    });

    // 4. Listen for recent participants (Joined History)
    const recentQuery = query(
      collection(db, 'lottery_entries'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
      const entries = snapshot.docs.map(doc => {
        const data = doc.data();
        let name = data.userName || data.username || 'Member';
        if (name.toLowerCase() === 'user') name = 'Member';
        return {
          id: doc.id,
          ...data,
          userName: name
        };
      });
      setRecentEntries(entries);
    });

    return () => {
      unsubscribeWinners();
      unsubscribeRecent();
    };
  }, []);

  const handleJoin = async (lottery: Lottery) => {
    if (!auth.currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const freeTickets = userData.freeLotteryTickets || 0;
      const latestName = userData.username || null;

      if (freeTickets <= 0 && balance < lottery.fee) {
        setErrorMsg(`Insufficient balance. You need Rs ${lottery.fee} to join.`);
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }
      
      const storedName = localStorage.getItem('taskmint_name');
      const authName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0];
      
      const entryName = (latestName && latestName !== 'user' && latestName !== 'User') 
        ? latestName 
        : (userName && userName !== 'user' && userName !== 'User') 
        ? userName 
        : (storedName && storedName !== 'user' && storedName !== 'User')
        ? storedName
        : (authName && authName !== 'user' && authName !== 'User')
        ? authName
        : 'Member';
        
      const userAvatar = localStorage.getItem('taskmint_avatar') || '';
      
      await addDoc(collection(db, 'lottery_entries'), {
        lotteryId: lottery.id,
        userId: auth.currentUser.uid,
        userName: entryName,
        userAvatar: userAvatar,
        timestamp: serverTimestamp()
      });

      if (freeTickets > 0) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          freeLotteryTickets: increment(-1)
        });
      } else {
        await onUpdateBalance(-lottery.fee);
      }
      
      const newMemberCount = lottery.currentMembers + 1;

      if (newMemberCount >= lottery.maxMembers) {
        await updateDoc(doc(db, 'lotteries', lottery.id), {
          currentMembers: newMemberCount,
          status: 'completed'
        });

        const entriesSnapshot = await getDocs(query(collection(db, 'lottery_entries'), where('lotteryId', '==', lottery.id)));
        const entries = entriesSnapshot.docs.map(d => d.data());
        
        if (entries.length > 0) {
          const winnerIndex = Math.floor(Math.random() * entries.length);
          const winner = entries[winnerIndex];

          await updateDoc(doc(db, 'users', winner.userId), {
            balance: increment(lottery.prizePool)
          });
          
          const winnerRtdbRef = ref(rtdb, `users/${winner.userId}`);
          await update(winnerRtdbRef, {
            balance: rtdbIncrement(lottery.prizePool)
          });

          await addDoc(collection(db, 'earning_history'), {
            userId: winner.userId,
            amount: lottery.prizePool,
            source: 'lottery',
            description: `Won Mega Draw Lottery (Rs ${lottery.prizePool})`,
            timestamp: serverTimestamp()
          });

          await addDoc(collection(db, 'lottery_winners'), {
            lotteryId: lottery.id,
            lotteryName: `Mega Draw (Rs ${lottery.prizePool})`,
            userId: winner.userId,
            userName: winner.userName || winner.username || 'Member', 
            userAvatar: winner.userAvatar || '',
            prize: lottery.prizePool,
            timestamp: serverTimestamp()
          });

          const uniqueUserIds = [...new Set(entries.map(e => e.userId))];
          for (const uid of uniqueUserIds) {
            await addDoc(collection(db, 'notifications'), {
              userId: uid,
              title: uid === winner.userId ? '🎉 You won the Lottery!' : 'Lottery Results',
              message: uid === winner.userId 
                ? `Congratulations! You won Rs ${lottery.prizePool} in the Mega Draw!` 
                : `The Mega Draw has ended. ${winner.userName || winner.username || 'Someone'} won the prize. Better luck next time!`,
              type: 'lottery',
              status: 'unread',
              timestamp: serverTimestamp()
            });
          }
        }
      } else {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 hover:bg-slate-50 shadow-sm transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter italic flex items-center gap-2 truncate">
              Mega <span className="text-indigo-600">Lottery</span> <Sparkles className="w-6 h-6 text-amber-500 animate-pulse flex-shrink-0" />
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Prize Network</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl">
           <Users className="w-4 h-4 text-indigo-600" />
           <span className="text-xs font-black text-indigo-900 uppercase">Live Network</span>
        </div>
      </div>

      {/* Hero Banner */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-10 relative overflow-hidden rounded-[2.5rem] bg-[#0A0B0F] p-6 sm:p-8 shadow-2xl border border-white/5"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -mr-40 -mt-40 animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-4 text-amber-500 text-[9px] font-black uppercase tracking-widest">
                   <Flame className="w-3 h-3 fill-current" /> High Stakes Active
                </div>
                <h3 className="text-3xl font-black text-white mb-3 tracking-tight italic">Fortune <span className="text-indigo-400">Accelerator</span></h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm mb-6">
                    Join our decentralized prize pool. Every ticket entry increases your probability of payout.
                </p>
                <div className="flex items-center justify-center md:justify-start gap-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Payouts</p>
                        <p className="text-xl font-black text-white italic tracking-tighter">Rs 5M+</p>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-xl font-black text-white italic tracking-tighter">Instant Draw</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[3rem] border border-white/10 shadow-inner shrink-0 text-center w-full md:w-auto">
               <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Available Balance</p>
               <p className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter mb-4">Rs {balance.toLocaleString()}</p>
               
               {freeTickets > 0 && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="mb-4 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl flex items-center justify-center gap-2"
                 >
                   <Crown className="w-3 h-3 text-amber-500" />
                   <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Free Tickets Available: {freeTickets}</span>
                 </motion.div>
               )}

               <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30 text-indigo-400">
                  <Ticket className="w-7 h-7" />
               </div>
            </div>
        </div>
      </motion.div>

      {/* Notifications */}
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

      {/* Grid */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" /> Active Operations
            </h3>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-xl"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Network...</p>
          </div>
        ) : lotteries.length === 0 ? (
          <div className="bg-[#111218] rounded-[3rem] border border-white/5 p-16 text-center shadow-inner">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
              <Ticket className="w-10 h-10" />
            </div>
            <p className="text-xl font-black text-white mb-2 italic uppercase">Zero Active Nodes</p>
            <p className="text-xs text-slate-500 font-medium">Internal systems are recalibrating. Standby for next cycle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lotteries.map((lottery, index) => {
                const isJoined = joinedLotteries.includes(lottery.id);
                const fillPercentage = (lottery.currentMembers / lottery.maxMembers) * 100;

                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    key={lottery.id} 
                    className="relative group block h-full"
                  >
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="relative bg-[#111218] rounded-[2.5rem] overflow-hidden border border-white/5 transition-all duration-500 hover:translate-y-[-8px] hover:border-indigo-500/30 flex flex-col h-full">
                        <div className="absolute top-0 inset-x-0 h-1 flex">
                            <div className="flex-1 bg-amber-500/30" />
                            <div className="flex-1 bg-indigo-500/30" />
                            <div className="flex-1 bg-purple-500/30" />
                        </div>

                        <div className="p-6 pb-0 flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                   <Crown className="w-4 h-4 text-amber-500" />
                                </div>
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic">Mega Pool</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Ticket Fee</p>
                                <div className="flex items-center justify-end gap-1">
                                    <span className="text-sm font-black text-white italic">Rs {lottery.fee}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-8 text-center flex-1 flex flex-col justify-center">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2 leading-none">Global Prize Fund</p>
                            <h4 className="text-5xl font-black text-white tracking-tighter italic drop-shadow-2xl flex items-center justify-center gap-1">
                                <span className="text-xl text-slate-500 not-italic mr-1">Rs</span>
                                {lottery.prizePool.toLocaleString()}
                            </h4>
                        </div>

                        <div className="px-6 grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Network</p>
                                    <p className="text-[10px] font-black text-white italic">{lottery.maxMembers} Spots</p>
                                </div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Legal</p>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase italic">Secure</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 space-y-2 mb-8">
                            <div className="flex justify-between items-end">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Initialization</p>
                                <span className="text-[9px] font-black text-indigo-400 italic font-mono">{Math.round(fillPercentage)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${fillPercentage}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600"
                                />
                            </div>
                            <div className="flex justify-between">
                                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{lottery.currentMembers} Joined</p>
                                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{lottery.maxMembers - lottery.currentMembers} Remaining</p>
                            </div>
                        </div>

                        <div className="px-6 pb-6 mt-auto">
                            <motion.button
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleJoin(lottery)}
                                disabled={isJoined || lottery.currentMembers >= lottery.maxMembers}
                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-2 transition-all duration-300 ${
                                    isJoined 
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                    : lottery.currentMembers >= lottery.maxMembers
                                    ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                                    : 'bg-white text-[#0A0B0F] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-slate-100'
                                }`}
                            >
                                {isJoined ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" /> Ticket Bought
                                    </>
                                ) : lottery.currentMembers >= lottery.maxMembers ? (
                                    <>
                                        <Clock className="w-4 h-4" /> Room Full
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 fill-current" /> {freeTickets > 0 ? "Free Entry" : "Join Now"}
                                    </>
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
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Recent Activity
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
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shadow-sm overflow-hidden border border-slate-200">
                                        <DynamicAvatar 
                                          avatarId={entry.userAvatar} 
                                          fallbackText={getDisplayName(entry)} 
                                          className="w-full h-full" 
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 italic tracking-tight">{getDisplayName(entry)}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Acquired Entry</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-600 italic tracking-widest uppercase">Verified</p>
                                    <p className="text-[8px] font-bold text-slate-400 mt-0.5">{entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Hall of Fame
            </h3>
            <div className="bg-[#0A0B0F] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[400px] text-white">
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
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center border border-white/10 shadow-2xl shadow-amber-500/20 overflow-hidden p-0.5">
                                            <DynamicAvatar 
                                              avatarId={winner.userAvatar} 
                                              fallbackText={getDisplayName(winner)} 
                                              className="w-full h-full" 
                                            />
                                        </div>
                                        <Star className="absolute -top-2 -right-2 w-5 h-5 text-amber-400 fill-current" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-white italic tracking-tighter">{getDisplayName(winner)}</p>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 italic truncate max-w-[120px]">{winner.lotteryName}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 italic">Prize Won</p>
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
