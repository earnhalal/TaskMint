import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Ticket, Trophy, Users, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, updateDoc, increment, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface LotteryViewProps {
  onBack: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
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

export default function LotteryView({ onBack, balance, onUpdateBalance }: LotteryViewProps) {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [joinedLotteries, setJoinedLotteries] = useState<string[]>([]);
  const [pastWinners, setPastWinners] = useState<Winner[]>([]);
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
      limit(5)
    );
    const unsubscribeWinners = onSnapshot(winnersQuery, (snapshot) => {
      const winners = snapshot.docs.map(doc => doc.data() as Winner);
      setPastWinners(winners);
    });

    return () => unsubscribeWinners();
  }, []);

  const handleJoin = async (lotteryId: string, fee: number) => {
    if (!auth.currentUser) return;
    
    if (balance < fee) {
      setErrorMsg(`Insufficient balance. You need Rs ${fee} to join.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    try {
      // 1. Create entry
      await addDoc(collection(db, 'lottery_entries'), {
        lotteryId,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });

      // 2. Update lottery member count
      await updateDoc(doc(db, 'lotteries', lotteryId), {
        currentMembers: increment(1)
      });

      // 3. Update user balance in Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        balance: increment(-fee)
      });

      // 4. Update local state balance (via prop)
      onUpdateBalance(-fee);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error joining lottery:", error);
      setErrorMsg("Failed to join lottery. Please try again.");
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const getDaysRemaining = (drawDate: any) => {
    if (!drawDate) return "Soon";
    const date = drawDate.toDate ? drawDate.toDate() : new Date(drawDate);
    const diff = date.getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} Days` : "Draw Today";
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lucky Lottery</h2>
          <p className="text-xs text-slate-500">Join and win big prizes!</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-slate-900 rounded-2xl p-4 mb-6 flex items-center justify-between text-white shadow-lg">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Available Balance</p>
          <p className="text-xl font-black">Rs {balance.toLocaleString()}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-amber-400" />
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 border border-red-100">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </motion.div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 border border-emerald-100">
          <CheckCircle2 className="w-4 h-4" /> Successfully joined the lottery! Good luck!
        </motion.div>
      )}

      {/* Active Lotteries */}
      <div className="space-y-4 mb-8">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Active Draws
        </h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-medium">Loading active draws...</p>
          </div>
        ) : lotteries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <Ticket className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No active lotteries at the moment.</p>
            <p className="text-xs text-slate-400">Check back later for new draws!</p>
          </div>
        ) : (
          lotteries.map((lottery) => {
            const isJoined = joinedLotteries.includes(lottery.id);
            const prizePool = lottery.prizePool || (lottery.fee * lottery.maxMembers);
            const userPrize = prizePool * 0.4; // 40% to user

            return (
              <div key={lottery.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className={`bg-gradient-to-r ${lottery.color || 'from-slate-700 to-slate-900'} p-4 text-white flex justify-between items-center`}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Entry Fee</p>
                    <p className="text-xl font-black">Rs {lottery.fee}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Winning Prize</p>
                    <p className="text-xl font-black flex items-center gap-1 justify-end">
                      <Trophy className="w-4 h-4 text-yellow-300" /> Rs {userPrize}
                    </p>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between text-xs text-slate-500 font-medium mb-2">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {lottery.currentMembers} / {lottery.maxMembers} Joined</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Draws in {getDaysRemaining(lottery.drawDate)}</span>
                  </div>
                  
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full bg-gradient-to-r ${lottery.color || 'from-slate-700 to-slate-900'}`} 
                      style={{ width: `${(lottery.currentMembers / lottery.maxMembers) * 100}%` }}
                    ></div>
                  </div>

                  <button
                    onClick={() => handleJoin(lottery.id, lottery.fee)}
                    disabled={isJoined || lottery.currentMembers >= lottery.maxMembers}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      isJoined 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : lottery.currentMembers >= lottery.maxMembers
                        ? 'bg-red-50 text-red-400 cursor-not-allowed'
                        : `bg-slate-900 hover:bg-slate-800 text-white shadow-md`
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Joined Successfully
                      </>
                    ) : lottery.currentMembers >= lottery.maxMembers ? (
                      <>
                        <AlertCircle className="w-4 h-4" /> Draw Full
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" /> Join for Rs {lottery.fee}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Past Winners Announcement */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" /> Recent Winners
        </h3>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
          {pastWinners.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4 italic">No winners announced yet.</p>
          ) : (
            pastWinners.map((winner, i) => (
              <div key={i} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center border border-yellow-200">
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{winner.userName}</p>
                    <p className="text-[10px] text-slate-500">{winner.lotteryName} • {winner.timestamp?.toDate ? winner.timestamp.toDate().toLocaleDateString() : 'Recently'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">+Rs {winner.prize}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
