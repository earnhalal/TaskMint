import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Gift, Volume2, VolumeX, Lock } from 'lucide-react';
import { auth, rtdb } from '../firebase';
import confetti from 'canvas-confetti';
import { getDatabase, ref, onValue, set, get, update, push, serverTimestamp as rtdbTimestamp } from 'firebase/database';

const tiers = [
  { id: 5, label: '5 PKR', theme: 'Simple', color: '#FBBF24', bgColor: '#0B132B' },
  { id: 50, label: '50 PKR', theme: 'Silver', color: '#E2E8F0', bgColor: '#1E293B' },
  { id: 100, label: '100 PKR', theme: 'Golden', color: '#F59E0B', bgColor: '#1A1A1A' }
];

const tierPrizes: Record<number, any[]> = {
  5: [
    { id: 0, label: 'Rs. 1', subLabel: 'Cash', probability: 35, value: 1 },
    { id: 1, label: 'Try Again', subLabel: '', probability: 35, value: 0 },
    { id: 2, label: 'Rs. 5', subLabel: 'Cash', probability: 15, value: 5 },
    { id: 3, label: 'Rs. 10', subLabel: 'Cash', probability: 8, value: 10 },
    { id: 4, label: 'Rs. 20', subLabel: 'Cash', probability: 4, value: 20 },
    { id: 5, label: 'Rs. 40', subLabel: 'Cash', probability: 2, value: 40 },
    { id: 6, label: 'Rs. 50', subLabel: 'Cash', probability: 1, value: 50 },
    { id: 7, label: 'Try Again', subLabel: '', probability: 0, value: 0 },
  ],
  50: [
    { id: 0, label: 'Rs. 50', subLabel: 'Cash', probability: 40, value: 50 },
    { id: 1, label: 'Rs. 80', subLabel: 'Cash', probability: 30, value: 80 },
    { id: 2, label: 'Rs. 100', subLabel: 'Cash', probability: 20, value: 100 },
    { id: 3, label: 'Rs. 150', subLabel: 'Cash', probability: 8, value: 150 },
    { id: 4, label: 'Rs. 200', subLabel: 'Cash', probability: 0.8, value: 200 },
    { id: 5, label: 'Rs. 300', subLabel: 'Cash', probability: 0.7, value: 300 },
    { id: 6, label: 'Rs. 400', subLabel: 'Cash', probability: 0.5, value: 400 },
    { id: 7, label: 'Try Again', subLabel: '', probability: 0, value: 0 },
  ],
  100: [
    { id: 0, label: 'Rs. 500', subLabel: 'Cash', probability: 0.0002, value: 500 },
    { id: 1, label: 'Rs. 800', subLabel: 'Cash', probability: 0.0002, value: 800 },
    { id: 2, label: 'Rs. 1000', subLabel: 'Cash', probability: 0.0002, value: 1000 },
    { id: 3, label: 'Rs. 2000', subLabel: 'Cash', probability: 0.0002, value: 2000 },
    { id: 4, label: 'Rs. 3000', subLabel: 'Cash', probability: 0.0001, value: 3000 },
    { id: 5, label: 'Rs. 5000', subLabel: 'Cash', probability: 0.0001, value: 5000 },
    { id: 6, label: 'Free Spin', subLabel: '', probability: 40, value: -1 }, // -1 for free spin
    { id: 7, label: 'Try Again', subLabel: '', probability: 59.999, value: 0 },
  ]
};

export default function SpinWheel({ 
  onClose, 
  balance, 
  onUpdateBalance, 
  freeSpins, 
  onUseFreeSpin,
  onGoToDeposit,
  activeInvites = 0,
  onWinLockedPrize
}: { 
  onClose: () => void;
  balance: number;
  onUpdateBalance: (amount: number, source?: string, description?: string) => void;
  freeSpins: number;
  onUseFreeSpin: () => void;
  onGoToDeposit?: () => void;
  activeInvites?: number;
  onWinLockedPrize?: (amount: number, requiredInvites: number) => void;
}) {
  const [activeTier, setActiveTier] = useState(5);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDepositPopup, setShowDepositPopup] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [winners, setWinners] = useState<any[]>([]);
  const [showLockedModal, setShowLockedModal] = useState<{amount: number, invites: number} | null>(null);

  const currentSegments = tierPrizes[activeTier];

  const getWithdrawalLock = (amount: number) => {
    if (amount >= 1000) return 15;
    if (amount >= 500) return 10;
    if (amount >= 300) return 5;
    if (amount >= 200) return 3;
    return 0;
  };

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

  const spinWheel = async (isPaid: boolean) => {
    if (isSpinning || !auth.currentUser) return;
    setErrorMsg('');

    // Lock 50 and 100 PKR tiers as requested
    if (activeTier === 50 || activeTier === 100) {
      setErrorMsg("Currently unavailable. Please try again later!");
      return;
    }

    const cost = isPaid ? activeTier : 0;

    if (isPaid) {
      if (balance < cost) {
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

    if (spinData && spinData.lastSpinTime === today && spinData.count >= 20) {
        setErrorMsg("Daily spin quota reached! Try again tomorrow.");
        return;
    }
    
    if (isPaid) {
      onUpdateBalance(-cost);
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
    
    for (let i = 0; i < currentSegments.length; i++) {
      cumulative += currentSegments[i].probability;
      if (rand <= cumulative) {
        winningIndex = i;
        break;
      }
    }

    // If we didn't find a winner due to floating point precision, pick the last one (usually Try Again)
    if (rand > cumulative) winningIndex = currentSegments.length - 1;

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
      const won = currentSegments[winningIndex];
      setPrize(won);
      
      if (won.value === 0) {
        playSound('lose');
      } else {
        // Only play win sound and confetti for big wins (> 100 PKR)
        if (won.value >= 100) {
          playSound('win');
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: activeTier === 100 ? ['#F59E0B', '#FBBF24', '#FFFFFF'] : ['#E2E8F0', '#94A3B8', '#FFFFFF']
          });
        }
      }

      if (won.value !== 0 && auth.currentUser) {
        try {
          // 1. Record win for live feed in RTDB
          const winnersRef = ref(rtdb, 'spin_winners');
          await push(winnersRef, {
            userId: auth.currentUser.uid,
            userName: localStorage.getItem('taskmint_name') || 'User',
            prize: won.label,
            timestamp: rtdbTimestamp()
          });

          if (won.value === -1) {
            // Free Spin won
            const userSpinRef = ref(rtdb, `users/${auth.currentUser.uid}/spins`);
            await update(userSpinRef, { freeSpins: (spinData?.freeSpins || 0) + 1 });
            return;
          }

          const requiredInvites = getWithdrawalLock(won.value);
          if (requiredInvites > 0 && activeInvites < requiredInvites) {
            // Locked win
            setShowLockedModal({ amount: won.value, invites: requiredInvites });
            if (onWinLockedPrize) onWinLockedPrize(won.value, requiredInvites);
          } else {
            // Normal win
            onUpdateBalance(won.value, 'spin', `Won ${won.label} from ${activeTier} PKR Spin`);
          }
        } catch (error) {
          console.error("Error updating spin win:", error);
        }
      }
    }, 5000);
  };

  const getTierStyles = () => {
    switch(activeTier) {
      case 50: return {
        border: 'border-slate-300',
        glow: 'shadow-[0_0_50px_rgba(226,232,240,0.4)] ring-8 ring-slate-200/10',
        wheelBg: 'conic-gradient(from -22.5deg, #E2E8F0 0deg 45deg, #1E293B 45deg 90deg, #E2E8F0 90deg 135deg, #1E293B 135deg 180deg, #E2E8F0 180deg 225deg, #1E293B 225deg 270deg, #E2E8F0 270deg 315deg, #1E293B 315deg 360deg)',
        pointer: '#E2E8F0',
        sparkle: false,
        themeClass: 'silver-glow'
      };
      case 100: return {
        border: 'border-amber-500',
        glow: 'shadow-[0_0_60px_rgba(245,158,11,0.5)] ring-8 ring-amber-500/20',
        wheelBg: 'conic-gradient(from -22.5deg, #F59E0B 0deg 45deg, #1A1A1A 45deg 90deg, #F59E0B 90deg 135deg, #1A1A1A 135deg 180deg, #F59E0B 180deg 225deg, #1A1A1A 225deg 270deg, #F59E0B 270deg 315deg, #1A1A1A 315deg 360deg)',
        pointer: '#F59E0B',
        sparkle: true,
        themeClass: 'golden-sparkle'
      };
      default: return {
        border: 'border-yellow-500',
        glow: 'shadow-[0_0_40px_rgba(250,204,21,0.3)]',
        wheelBg: 'conic-gradient(from -22.5deg, #FBBF24 0deg 45deg, #0F172A 45deg 90deg, #FBBF24 90deg 135deg, #0F172A 135deg 180deg, #FBBF24 180deg 225deg, #0F172A 225deg 270deg, #FBBF24 270deg 315deg, #0F172A 315deg 360deg)',
        pointer: '#FBBF24',
        sparkle: false
      };
    }
  };

  const styles = getTierStyles();

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
        className="w-full min-h-full sm:rounded-[2rem] border-0 sm:border border-slate-700/50 relative overflow-hidden flex flex-col items-center p-6 lg:p-10 gap-8 shadow-2xl pt-24 sm:pt-24 transition-colors duration-500"
        style={{ backgroundColor: tiers.find(t => t.id === activeTier)?.bgColor }}
      >
        {/* Tier Tabs */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 flex bg-black/40 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => !isSpinning && setActiveTier(tier.id)}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTier === tier.id 
                  ? 'bg-white text-black shadow-lg scale-105' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tier.label}
              {(tier.id === 50 || tier.id === 100) && <Lock className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {/* Sliding Notification Marquee */}
        <div className="absolute top-0 left-0 w-full bg-black/20 border-b border-white/5 overflow-hidden py-2 z-50 flex items-center">
          <div className="w-full overflow-hidden relative h-6">
            <div className="animate-marquee absolute whitespace-nowrap text-white/80 font-bold text-sm flex gap-12 px-4">
              {winners.length > 0 ? winners.map((w) => (
                <span key={w.id}>🎉 {w.userName} just won {w.prize}!</span>
              )) : (
                <span>🎉 Spin the wheel to win big prizes!</span>
              )}
              {winners.length > 0 && winners.map((w) => (
                <span key={w.id + '_dup'}>🎉 {w.userName} just won {w.prize}!</span>
              ))}
            </div>
          </div>
        </div>

        {/* Controls (Sound & Close) */}
        <div className="absolute top-24 sm:top-10 right-4 z-50 flex items-center gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Wheel Section */}
        <div className="flex-1 flex flex-col items-center relative z-10 w-full max-w-sm mx-auto mt-8">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80">
            {/* Sparkles for Golden Tier */}
            {styles.sparkle && (
              <div className="absolute inset-0 z-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-amber-200 rounded-full blur-[1px]"
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                      x: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                      y: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                    }}
                    transition={{
                      duration: 1.5 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            )}
            {/* Silver Glow for Silver Tier */}
            {activeTier === 50 && (
              <div className="absolute inset-0 z-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-slate-200/30 rounded-full blur-[2px]"
                    animate={{
                      scale: [1, 2, 1],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                  />
                ))}
              </div>
            )}
            {/* Pointer */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-10 h-10 drop-shadow-xl">
              <svg viewBox="0 0 24 24" fill={styles.pointer} className="w-full h-full transition-colors duration-500">
                <path d="M12 2L22 20H2L12 2Z" transform="rotate(180 12 12)" />
              </svg>
            </div>

            {/* Wheel */}
            <motion.div 
              className={`w-full h-full rounded-full border-[8px] ${styles.border} ${styles.glow} relative overflow-hidden transition-all duration-500`}
              animate={{ rotate: rotation }}
              transition={{ duration: 5, ease: [0.2, 0.8, 0.1, 1] }}
              style={{ background: styles.wheelBg }}
            >
              {currentSegments.map((seg, i) => (
                <div
                  key={seg.id}
                  className="absolute top-0 left-0 w-full h-full flex flex-col items-center pt-6 sm:pt-8"
                  style={{ transform: `rotate(${i * 45}deg)` }}
                >
                  <span className="font-black text-[10px] sm:text-[11px] text-center leading-tight text-white drop-shadow-md">
                    {seg.label}<br/>{seg.subLabel}
                  </span>
                </div>
              ))}
              
              {/* Center Dot */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full border-4 ${styles.border} shadow-inner z-10 flex items-center justify-center transition-colors duration-500`}>
                <div className="w-5 h-5 bg-black/10 rounded-full"></div>
              </div>
            </motion.div>
          </div>

          {/* Spin Buttons */}
          <div className="mt-12 w-full max-w-sm flex flex-col gap-4">
            <button 
              onClick={() => spinWheel(true)}
              disabled={isSpinning || activeTier === 50 || activeTier === 100}
              className={`w-full py-4 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex flex-col items-center justify-center leading-none ${
                activeTier === 100 ? 'bg-amber-500 text-black' : 
                activeTier === 50 ? 'bg-slate-200 text-black' : 
                'bg-yellow-500 text-black'
              }`}
            >
              <span>{(activeTier === 50 || activeTier === 100) ? 'LOCKED' : 'SPIN NOW'}</span>
              <span className="text-[10px] opacity-60 mt-1">
                {(activeTier === 50 || activeTier === 100) ? 'Currently Unavailable' : `Cost: Rs. ${activeTier}`}
              </span>
            </button>
            
            <button 
              onClick={() => spinWheel(false)}
              disabled={isSpinning || freeSpins <= 0 || activeTier === 50 || activeTier === 100}
              className="w-full bg-white/10 text-white font-bold py-3 rounded-2xl hover:bg-white/20 transition-all disabled:opacity-30 text-sm"
            >
              Use Free Spin ({freeSpins})
            </button>
          </div>
          
          {errorMsg && (
            <p className="text-red-400 text-sm mt-4 text-center font-bold bg-red-400/10 py-2 px-4 rounded-lg border border-red-400/20">
              {errorMsg}
            </p>
          )}
        </div>
      </motion.div>

      {/* Prize Modal */}
      <AnimatePresence>
        {prize && !showLockedModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {prize.value === 0 ? <X className="w-10 h-10 text-white/40" /> : <Gift className="w-10 h-10 text-yellow-400" />}
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                {prize.value === 0 ? 'Try Again!' : 'Congratulations!'}
              </h3>
              <p className="text-white/60 mb-6 font-medium">
                {prize.value === 0 
                  ? 'Better luck next time.' 
                  : prize.value === -1 
                    ? 'You won a Free Spin!'
                    : `You won ${prize.label}!`}
              </p>
              <button 
                onClick={() => setPrize(null)}
                className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                Awesome
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Locked Reward Modal */}
        {showLockedModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-500 to-yellow-600 p-8 rounded-[3rem] w-full max-w-sm text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] border border-white/20"
            >
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                <Crown className="w-12 h-12 text-white" />
                <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-2 border-2 border-white">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-white mb-3">Mubarak ho! 🎉</h3>
              <p className="text-white text-lg font-bold mb-2 leading-tight">
                Aapne <span className="text-black bg-white px-2 rounded">Rs. {showLockedModal.amount}</span> jeet liye hain!
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-white/80" />
                <span className="text-white/90 text-xs font-black uppercase tracking-widest">Reward Locked</span>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 mb-8">
                <p className="text-white/90 text-sm font-medium">
                  Unlock this reward by inviting <span className="font-black text-white underline">{showLockedModal.invites} friends</span>! 🔥
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowLockedModal(null);
                  setPrize(null);
                }}
                className="w-full bg-white text-amber-600 font-black py-4 rounded-2xl hover:bg-slate-50 transition-all shadow-xl"
              >
                Theek Hai!
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
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💸</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                Insufficient Balance!
              </h3>
              <p className="text-white/60 mb-6 text-sm">
                Add Rs. {activeTier} to spin again and win up to <span className="text-yellow-400 font-bold">Rs. 5000</span>!
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDepositPopup(false)}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors"
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
