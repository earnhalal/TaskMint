import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Gift, Volume2, VolumeX } from 'lucide-react';
import { auth, rtdb } from '../firebase';
import { getDatabase, ref, onValue, set, get, update, push, serverTimestamp as rtdbTimestamp } from 'firebase/database';

const segments = [
  { id: 0, label: 'Rs. 1', subLabel: 'Cash', color: '#FBBF24', textColor: '#0F172A', probability: 35 },
  { id: 1, label: 'Rs. 5', subLabel: 'Cash', color: '#0F172A', textColor: '#FBBF24', probability: 30 },
  { id: 2, label: 'Try', subLabel: 'Again', color: '#FBBF24', textColor: '#0F172A', probability: 30 },
  { id: 3, label: 'Rs. 10', subLabel: 'Cash', color: '#0F172A', textColor: '#FBBF24', probability: 2 },
  { id: 4, label: 'Rs. 50', subLabel: 'Cash', color: '#FBBF24', textColor: '#0F172A', probability: 1 },
  { id: 5, label: 'Rs. 500', subLabel: 'Cash', color: '#0F172A', textColor: '#FBBF24', probability: 1 },
  { id: 6, label: 'Rs. 1000', subLabel: 'Cash', color: '#FBBF24', textColor: '#0F172A', probability: 0.5 },
  { id: 7, label: 'Rs. 5000', subLabel: 'Cash', color: '#0F172A', textColor: '#FBBF24', probability: 0.5 },
];

const fakeNames = ['Ali R.', 'Sara K.', 'Usman M.', 'Ayesha B.', 'Zain T.', 'Fatima S.', 'Bilal A.', 'Hira N.', 'Kamran J.', 'Nida W.', 'Waseem M.', 'Tariq P.'];
const getRandomFakePrize = () => {
  const r = Math.random();
  if (r < 0.2) return 'Rs. 5000';
  if (r < 0.5) return 'Rs. 1000';
  return 'Rs. 500';
};

export default function SpinWheel({ 
  onClose, 
  balance, 
  onUpdateBalance, 
  freeSpins, 
  onUseFreeSpin,
  onGoToDeposit
}: { 
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number) => void;
  freeSpins: number;
  onUseFreeSpin: () => void;
  onGoToDeposit?: () => void;
}) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDepositPopup, setShowDepositPopup] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [winners, setWinners] = useState<any[]>([]);

  const getProbabilities = (isPaid: boolean) => {
    if (isPaid) {
      return [
        { id: 0, probability: 20 }, // Rs. 1
        { id: 1, probability: 40 }, // Rs. 5
        { id: 2, probability: 20 }, // Try Again
        { id: 3, probability: 10 }, // Rs. 10
        { id: 4, probability: 5 },  // Rs. 50
        { id: 5, probability: 3 },  // Rs. 500
        { id: 6, probability: 1.5 },// Rs. 1000
        { id: 7, probability: 0.5 },// Rs. 5000
      ];
    }
    return segments.map(s => ({ id: s.id, probability: s.probability }));
  };

  // Live Winners Feed from RTDB
  useEffect(() => {
    const winnersRef = ref(rtdb, 'spin_winners');
    const unsubscribe = onValue(winnersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({ 
          id, 
          ...val 
        }));
        // Sort by timestamp desc and take top 10
        const sorted = list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 10);
        setWinners(sorted);
      } else {
        setWinners([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const playSound = (type: 'tick' | 'win' | 'lose') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'tick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.05);
      } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.5);
      } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.5);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // RTDB Spin Data Listener
  useEffect(() => {
    if (!auth.currentUser) return;
    const spinRef = ref(rtdb, `users/${auth.currentUser.uid}/spins`);
    const unsubscribe = onValue(spinRef, (snapshot) => {
      const data = snapshot.val();
      // Update local state if needed, e.g., freeSpins or lastSpinTime
      // This will help UI update in real-time
    });
    return () => unsubscribe();
  }, []);

  const spinWheel = async (isPaid: boolean) => {
    if (isSpinning || !auth.currentUser) return;
    setErrorMsg('');

    if (isPaid) {
      if (balance < 5) {
        setShowDepositPopup(true);
        return;
      }
    } else {
      if (freeSpins <= 0) {
        setErrorMsg("No free spins left today! Use a Paid Spin.");
        return;
      }
    }

    // RTDB Quota Check
    const spinRef = ref(rtdb, `users/${auth.currentUser.uid}/spins`);
    const snapshot = await get(spinRef);
    const spinData = snapshot.val();
    const today = new Date().toDateString();

    if (spinData && spinData.lastSpinTime === today && spinData.count >= 10) {
        setErrorMsg("Daily spin quota reached! Try again tomorrow.");
        return;
    }
    
    if (isPaid) {
      onUpdateBalance(-5);
    } else {
      onUseFreeSpin();
    }

    // Update RTDB Quota
    const newCount = (spinData && spinData.lastSpinTime === today) ? spinData.count + 1 : 1;
    await update(spinRef, {
        lastSpinTime: today,
        count: newCount
    });

    setIsSpinning(true);
    setPrize(null);

    const rand = Math.random() * 100;
    let cumulative = 0;
    let winningIndex = 0;
    
    const currentProbs = getProbabilities(isPaid);

    for (let i = 0; i < currentProbs.length; i++) {
      cumulative += currentProbs[i].probability;
      if (rand <= cumulative) {
        winningIndex = i;
        break;
      }
    }

    const randomOffset = (Math.random() - 0.5) * 30; 
    const targetRotation = rotation + 1800 - (winningIndex * 45) - (rotation % 360) + randomOffset;

    setRotation(targetRotation);

    // Ticking sound effect
    let ticks = 0;
    const tickInterval = setInterval(() => {
      if (ticks > 40) {
        clearInterval(tickInterval);
      } else {
        playSound('tick');
        ticks++;
      }
    }, 100);

    setTimeout(async () => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      const won = segments[winningIndex];
      setPrize(won);
      
      if (won.label === 'Try') {
        playSound('lose');
      } else {
        playSound('win');
      }

      if (won.subLabel === 'Cash' && auth.currentUser) {
        const amount = parseInt(won.label.replace('Rs. ', ''));
        if (!isNaN(amount)) {
          try {
            // 1. Record win for live feed in RTDB (Zero Firestore Reads)
            const winnersRef = ref(rtdb, 'spin_winners');
            await push(winnersRef, {
              userId: auth.currentUser.uid,
              userName: localStorage.getItem('taskmint_name') || 'User',
              prize: won.label,
              timestamp: rtdbTimestamp()
            });

            // 2. Update balance via parent (which handles Firestore write)
            onUpdateBalance(amount);
          } catch (error) {
            console.error("Error updating spin win:", error);
          }
        }
      }
    }, 5000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full pb-24"
    >
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee {
            display: inline-block;
            white-space: nowrap;
            animation: marquee 20s linear infinite;
          }
        `}
      </style>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#0B132B] w-full min-h-full sm:rounded-[2rem] border-0 sm:border border-slate-700/50 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between p-6 lg:p-10 gap-8 shadow-2xl pt-16 sm:pt-16"
      >
        {/* Sliding Notification Marquee */}
        <div className="absolute top-0 left-0 w-full bg-yellow-500/10 border-b border-yellow-500/20 overflow-hidden py-2 z-50 flex items-center">
          <div className="w-full overflow-hidden relative h-6">
            <div className="animate-marquee absolute whitespace-nowrap text-yellow-400 font-bold text-sm flex gap-12 px-4">
              {winners.length > 0 ? winners.map((w) => (
                <span key={w.id}>🎉 {w.userName} just won {w.prize}!</span>
              )) : (
                <span>🎉 Spin the wheel to win big prizes!</span>
              )}
              {/* Duplicate for seamless loop */}
              {winners.length > 0 && winners.map((w) => (
                <span key={w.id + '_dup'}>🎉 {w.userName} just won {w.prize}!</span>
              ))}
            </div>
          </div>
        </div>

        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(250,204,21,0.05)_0%,transparent_60%)]"></div>
        </div>

        {/* Controls (Sound & Close) */}
        <div className="absolute top-12 sm:top-10 right-4 z-50 flex items-center gap-2">
          {onGoToDeposit && (
            <button 
              onClick={onGoToDeposit}
              className="px-3 h-10 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-xl flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors font-bold text-xs gap-1"
            >
              <span className="text-lg leading-none">+</span> Top-up
            </button>
          )}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className="w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden w-full text-center mt-8 mb-4 relative z-10">
          <h2 className="text-3xl font-display font-bold text-white">
            TaskMint <span className="text-yellow-400">Spin & Win!</span>
          </h2>
        </div>

        {/* Left: Recent Winners */}
        <div className="w-full lg:w-64 bg-[#151E32]/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/50 shadow-lg relative z-10 order-3 lg:order-1">
          <h3 className="text-white font-bold mb-4 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Live Winners
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {winners.map((winner) => (
                <motion.div 
                  key={winner.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-[#1A243A] p-3 rounded-xl border border-slate-700/30 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">{winner.userName} won</p>
                    <p className="text-sm font-bold text-yellow-400">{winner.prize}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: Wheel */}
        <div className="flex-1 flex flex-col items-center relative z-10 order-1 lg:order-2 w-full max-w-sm mx-auto">
          <h2 className="hidden lg:block text-4xl font-display font-bold text-white mb-12 text-center">
            TaskMint <span className="text-yellow-400">Spin & Win!</span>
          </h2>
          
          {/* Wheel Container */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80">
            {/* Pointer */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-10 h-10 drop-shadow-xl">
              <svg viewBox="0 0 24 24" fill="#FBBF24" className="w-full h-full">
                <path d="M12 2L22 20H2L12 2Z" transform="rotate(180 12 12)" />
              </svg>
            </div>

            {/* Wheel */}
            <motion.div 
              className="w-full h-full rounded-full border-[8px] border-yellow-500 shadow-[0_0_40px_rgba(250,204,21,0.3)] relative overflow-hidden"
              animate={{ rotate: rotation }}
              transition={{ duration: 5, ease: [0.2, 0.8, 0.1, 1] }}
              style={{
                background: `conic-gradient(from -22.5deg,
                  #FBBF24 0deg 45deg,
                  #0F172A 45deg 90deg,
                  #FBBF24 90deg 135deg,
                  #0F172A 135deg 180deg,
                  #FBBF24 180deg 225deg,
                  #0F172A 225deg 270deg,
                  #FBBF24 270deg 315deg,
                  #0F172A 315deg 360deg
                )`
              }}
            >
              {segments.map((seg, i) => (
                <div
                  key={seg.id}
                  className="absolute top-0 left-0 w-full h-full flex flex-col items-center pt-6 sm:pt-8"
                  style={{ transform: `rotate(${i * 45}deg)` }}
                >
                  {seg.id === 6 && <Crown className="w-5 h-5 mb-1 text-[#0F172A]" />}
                  <span style={{ color: seg.textColor }} className="font-bold text-[11px] sm:text-xs text-center leading-tight">
                    {seg.label}<br/>{seg.subLabel}
                  </span>
                </div>
              ))}
              
              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border-4 border-yellow-200 shadow-inner z-10 flex items-center justify-center">
                <div className="w-5 h-5 bg-yellow-100/50 rounded-full"></div>
              </div>
            </motion.div>
          </div>

          {/* Spin Buttons */}
          <div className="mt-12 w-full max-w-sm flex gap-4">
            <button 
              onClick={() => spinWheel(false)}
              disabled={isSpinning || freeSpins <= 0}
              className="flex-1 bg-emerald-500 text-white font-display font-bold text-lg py-3 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex flex-col items-center justify-center leading-none"
            >
              <span>FREE SPIN</span>
              <span className="text-[10px] text-emerald-100 mt-1">{freeSpins > 0 ? '1 Left Today' : '0 Left'}</span>
            </button>
            <button 
              onClick={() => spinWheel(true)}
              disabled={isSpinning}
              className="flex-1 bg-yellow-500 text-slate-900 font-display font-bold text-lg py-3 rounded-2xl shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex flex-col items-center justify-center leading-none"
            >
              <span>PAID SPIN</span>
              <span className="text-[10px] text-slate-800 mt-1">Cost: Rs. 5</span>
            </button>
          </div>
          
          {errorMsg ? (
            <p className="text-red-400 text-sm mt-4 text-center font-bold bg-red-400/10 py-2 px-4 rounded-lg border border-red-400/20">
              {errorMsg}
            </p>
          ) : (
            <p className="text-slate-400 text-sm mt-4 text-center">
              Paid spin has higher chances of winning big!
            </p>
          )}
        </div>

        {/* Right: Rules */}
        <div className="w-full lg:w-64 bg-[#151E32]/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/50 shadow-lg relative z-10 order-2 lg:order-3">
          <h3 className="text-white font-bold mb-4 text-sm">Rules & Info</h3>
          <ul className="space-y-4 text-xs text-slate-400 leading-relaxed">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0"></div>
              One free spin every 24 hours.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0"></div>
              Prizes are credited immediately.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0"></div>
              Check Rewards page for details.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0"></div>
              Good luck!
            </li>
          </ul>
        </div>

      </motion.div>

      {/* Prize Modal */}
      <AnimatePresence>
        {prize && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-slate-700 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {prize.label === 'Try' ? (
                  <X className="w-10 h-10 text-yellow-500" />
                ) : prize.id === 6 ? (
                  <Crown className="w-10 h-10 text-yellow-500" />
                ) : (
                  <Gift className="w-10 h-10 text-yellow-500" />
                )}
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                {prize.label === 'Try' ? 'Better Luck Next Time!' : 'Congratulations!'}
              </h3>
              <p className="text-slate-300 mb-6">
                {prize.label === 'Try' 
                  ? 'You didn\'t win anything this time.' 
                  : `You won ${prize.label} ${prize.subLabel}! It has been added to your account.`}
              </p>
              <button 
                onClick={() => setPrize(null)}
                className="w-full bg-yellow-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors"
              >
                Awesome
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Deposit Popup */}
        {showDepositPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-800 border border-slate-700 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💸</span>
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                Insufficient Balance!
              </h3>
              <p className="text-slate-300 mb-6 text-sm">
                Add Rs. 5 to spin again and win up to <span className="text-yellow-400 font-bold">Rs. 5000</span>!
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDepositPopup(false)}
                  className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowDepositPopup(false);
                    if (onGoToDeposit) onGoToDeposit();
                  }}
                  className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors"
                >
                  Deposit Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
