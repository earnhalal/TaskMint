import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Ticket, Trophy, Users, Clock, CheckCircle2, AlertCircle, Sparkles, Star, Crown, Zap } from 'lucide-react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, updateDoc, increment, orderBy, limit, getDocs, getDoc } from 'firebase/firestore';
import { db, auth, rtdb } from '../../firebase';
import { ref, set, increment as rtdbIncrement } from 'firebase/database';
import { DynamicAvatar } from '../ui/DynamicAvatar';

interface LotteryViewProps {
  onBack: () => void;
  balance: number;
  userName: string;
  onUpdateBalance: (amount: number, source?: string, description?: string) => Promise<boolean>;
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
  userAvatar?: string;
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
        await onUpdateBalance(-lottery.fee, 'lottery', 'Purchased Lottery Ticket');
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
          
          // RTDB rules deny parent-level writes on users/{uid}; credit the balance child directly.
          const winnerBalanceRef = ref(rtdb, `users/${winner.userId}/balance`);
          await set(winnerBalanceRef, rtdbIncrement(lottery.prizePool));

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
      className="pb-32 max-w-4xl mx-auto px-4 pt-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Mega <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-fuchsia-500 bg-clip-text text-transparent">Lottery</span> <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
          </h2>
          <p className="text-xs text-zinc-300 font-medium">Buy a ticket, fill the pool, and the draw runs automatically.</p>
        </div>
      </div>

      {/* Balance strip */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        <div className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600/30 to-fuchsia-600/20 border border-violet-400/30 px-4 py-2.5">
          <Ticket className="w-4 h-4 text-violet-300" />
          <span className="text-xs font-bold text-zinc-300">Your balance</span>
          <span className="text-sm font-black text-white">Rs {balance.toLocaleString()}</span>
        </div>
        {freeTickets > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-400/15 border border-amber-300/30 px-4 py-2.5">
            <Crown className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-black text-amber-100">You have {freeTickets} free ticket{freeTickets > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 text-red-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 mb-5 border border-red-500/30">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
            </motion.div>
          )}

          {showSuccess && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-500/10 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 mb-5 border border-emerald-400/30">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Ticket booked — good luck in the draw!
            </motion.div>
          )}
      </AnimatePresence>

      {/* Draws */}
      <div className="mb-10">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-emerald-400" /> Open Draws
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="w-10 h-10 border-4 border-white/10 border-t-fuchsia-400 rounded-full animate-spin mb-4"></div>
            <p className="text-[11px] font-black text-zinc-300 uppercase tracking-wider">Loading draws…</p>
          </div>
        ) : lotteries.length === 0 ? (
          <div className="bg-gradient-to-b from-[#2b1152] to-[#170a30] rounded-3xl border border-violet-400/25 p-10 text-center">
            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Ticket className="w-7 h-7" />
            </div>
            <p className="text-base font-black text-white mb-1.5">No draws are open right now</p>
            <p className="text-[13px] text-zinc-300 font-medium">New draws will appear here as soon as they open.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lotteries.map((lottery, index) => {
                const isJoined = joinedLotteries.includes(lottery.id);
                const fillPercentage = Math.min(100, (lottery.currentMembers / lottery.maxMembers) * 100);
                const spotsLeft = Math.max(0, lottery.maxMembers - lottery.currentMembers);

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    key={lottery.id}
                    className="relative bg-gradient-to-b from-[#2b1152] to-[#170a30] rounded-3xl overflow-hidden border border-violet-400/25 shadow-[0_16px_45px_-14px_rgba(139,92,246,0.5)] flex flex-col"
                  >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-300 via-fuchsia-500 to-violet-600" />

                    <div className="p-5 pb-0 flex justify-between items-start">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-fuchsia-200 uppercase tracking-wider bg-fuchsia-500/15 border border-fuchsia-400/30 px-2.5 py-1 rounded-full">
                           <Crown className="w-3.5 h-3.5" /> Mega Draw
                        </span>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Ticket fee</p>
                            <p className="text-sm font-black text-white">Rs {lottery.fee}</p>
                        </div>
                    </div>

                    <div className="px-5 py-5 text-center">
                        <p className="text-[11px] font-black text-teal-300 uppercase tracking-wider mb-1.5">Prize Pool</p>
                        <h4 className="text-4xl font-black text-white tracking-tight">
                            <span className="text-base text-zinc-300 font-bold mr-1">Rs</span>
                            {lottery.prizePool.toLocaleString()}
                        </h4>
                    </div>

                    <div className="px-5 space-y-2 mb-5">
                        <div className="flex justify-between items-end">
                            <p className="text-[11px] font-bold text-zinc-200">{lottery.currentMembers} joined · {spotsLeft} spots left</p>
                            <span className="text-[11px] font-black text-teal-300">{Math.round(fillPercentage)}% full</span>
                        </div>
                        <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden border border-white/10">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${fillPercentage}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-fuchsia-500 to-amber-400 rounded-full"
                            />
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium">The draw runs automatically when all {lottery.maxMembers} spots fill.</p>
                    </div>

                    <div className="px-5 pb-5 mt-auto">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleJoin(lottery)}
                            disabled={isJoined || lottery.currentMembers >= lottery.maxMembers}
                            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
                                isJoined
                                ? 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/30'
                                : lottery.currentMembers >= lottery.maxMembers
                                ? 'bg-white/5 text-zinc-400 cursor-not-allowed border border-white/10'
                                : 'bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950 hover:from-amber-200 hover:to-yellow-400 shadow-lg shadow-amber-500/30'
                            }`}
                        >
                            {isJoined ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" /> Ticket Booked
                                </>
                            ) : lottery.currentMembers >= lottery.maxMembers ? (
                                <>
                                    <Clock className="w-4 h-4" /> Draw Full
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" /> {freeTickets > 0 ? "Join Free" : "Join Now"}
                                </>
                            )}
                        </motion.button>
                    </div>
                  </motion.div>
                );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-teal-300" /> Recent Entries
            </h3>
            <div className="bg-gradient-to-b from-[#2b1152] to-[#170a30] rounded-3xl border border-violet-400/25 overflow-hidden">
                <div className="p-2">
                    {recentEntries.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-xs text-zinc-300 font-bold">No entries yet — be the first to join a draw.</p>
                        </div>
                    ) : (
                        recentEntries.map((entry, i) => (
                            <div
                                key={entry.id || i}
                                className="flex items-center justify-between p-3 hover:bg-white/5 transition-all rounded-2xl"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                        <DynamicAvatar
                                          avatarId={entry.userAvatar}
                                          fallbackText={getDisplayName(entry)}
                                          className="w-full h-full"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-white tracking-tight truncate">{getDisplayName(entry)}</p>
                                        <p className="text-[11px] text-zinc-400 font-medium">Bought a ticket</p>
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold text-zinc-400 shrink-0">{entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-400" /> Recent Winners
            </h3>
            <div className="bg-gradient-to-b from-[#2b1152] to-[#170a30] rounded-3xl border border-violet-400/25 overflow-hidden">
                 <div className="p-2">
                    {pastWinners.length === 0 ? (
                        <div className="text-center py-12 px-4">
                             <p className="text-xs text-zinc-300 font-bold leading-relaxed">No winners yet.<br/>The first winner could be you.</p>
                        </div>
                    ) : (
                        pastWinners.map((winner, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 transition-all rounded-2xl">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center overflow-hidden p-0.5">
                                            <DynamicAvatar
                                              avatarId={winner.userAvatar}
                                              fallbackText={getDisplayName(winner)}
                                              className="w-full h-full rounded-[10px]"
                                            />
                                        </div>
                                        <Star className="absolute -top-1.5 -right-1.5 w-4 h-4 text-amber-400 fill-amber-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white tracking-tight truncate">{getDisplayName(winner)}</p>
                                        <p className="text-[11px] text-zinc-400 font-medium truncate">{winner.lotteryName}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Won</p>
                                    <p className="text-base font-black text-white tracking-tight">Rs {winner.prize.toLocaleString()}</p>
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
