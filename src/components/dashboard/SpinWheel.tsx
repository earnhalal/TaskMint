import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Gift, Volume2, VolumeX, Lock, ArrowLeft, ArrowRight, Sparkles, Trophy, Users, Wallet, Clock, Ticket } from 'lucide-react';
import { auth, rtdb } from '../../firebase';
import confetti from 'canvas-confetti';
import { getDatabase, ref, onValue, set, get, update, push, serverTimestamp as rtdbTimestamp } from 'firebase/database';

const tiers = [
  { id: 5, label: '5 PKR', theme: 'Simple', color: '#FBBF24', bgColor: '#0B132B' },
  { id: 50, label: '50 PKR', theme: 'Silver', color: '#E2E8F0', bgColor: '#1E293B' },
  { id: 100, label: '100 PKR', theme: 'Golden', color: '#F59E0B', bgColor: '#1A1A1A' }
];

const tierPrizes: Record<number, any[]> = {
  5: [
    { id: 0, label: 'Rs. 1', subLabel: 'Cash', probability: 0.0001, value: 1 },
    { id: 1, label: 'Try Again', subLabel: '', probability: 49.999, value: 0 },
    { id: 2, label: 'Rs. 5', subLabel: 'Cash', probability: 0.0001, value: 5 },
    { id: 3, label: 'Rs. 10', subLabel: 'Cash', probability: 0.0001, value: 10 },
    { id: 4, label: 'Rs. 20', subLabel: 'Cash', probability: 0.0001, value: 20 },
    { id: 5, label: 'Rs. 40', subLabel: 'Cash', probability: 0.0001, value: 40 },
    { id: 6, label: 'Rs. 50', subLabel: 'Cash', probability: 0.0001, value: 50 },
    { id: 7, label: 'Try Again', subLabel: '', probability: 50.0004, value: 0 },
  ],
  50: [
    { id: 0, label: 'Rs. 50', subLabel: 'Cash', probability: 0.0001, value: 50 },
    { id: 1, label: 'Rs. 80', subLabel: 'Cash', probability: 0.0001, value: 80 },
    { id: 2, label: 'Rs. 100', subLabel: 'Cash', probability: 0.0001, value: 100 },
    { id: 3, label: 'Rs. 150', subLabel: 'Cash', probability: 0.0001, value: 150 },
    { id: 4, label: 'Rs. 200', subLabel: 'Cash', probability: 0.0001, value: 200 },
    { id: 5, label: 'Rs. 300', subLabel: 'Cash', probability: 0.0001, value: 300 },
    { id: 6, label: 'Rs. 400', subLabel: 'Cash', probability: 0.0001, value: 400 },
    { id: 7, label: 'Try Again', subLabel: '', probability: 99.9993, value: 0 },
  ],
  100: [
    { id: 0, label: 'Rs. 500', subLabel: 'Cash', probability: 0.0001, value: 500 },
    { id: 1, label: 'Rs. 800', subLabel: 'Cash', probability: 0.0001, value: 800 },
    { id: 2, label: 'Rs. 1000', subLabel: 'Cash', probability: 0.0001, value: 1000 },
    { id: 3, label: 'Rs. 2000', subLabel: 'Cash', probability: 0.0001, value: 2000 },
    { id: 4, label: 'Rs. 3000', subLabel: 'Cash', probability: 0.0001, value: 3000 },
    { id: 5, label: 'Rs. 5000', subLabel: 'Cash', probability: 0.0001, value: 5000 },
    { id: 6, label: 'Free Spin', subLabel: '', probability: 0.0001, value: -1 }, // -1 for free spin
    { id: 7, label: 'Try Again', subLabel: '', probability: 99.9993, value: 0 },
  ]
};

export default function SpinWheel({ 
  onClose, 
  balance, 
  spinBalance = 0,
  onUpdateBalance, 
  freeSpins, 
  onUseFreeSpin,
  onGoToDeposit,
  activeInvites = 0,
  onWinLockedPrize
}: { 
  onClose: () => void;
  balance: number;
  spinBalance?: number;
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

    const cost = isPaid ? activeTier : 0;

    if (isPaid) {
      if ((balance + spinBalance) < cost) {
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
    const today = new Date().toDateString();
    const spinRef = ref(rtdb, `users/${auth.currentUser.uid}/spins`);
    const snapshot = await get(spinRef);
    const spinData = snapshot.val();

    if (spinData && spinData.lastSpinTime === today && spinData.count >= 20) {
        setErrorMsg("Daily spin quota reached! Try again tomorrow.");
        return;
    }
    
    if (isPaid) {
      onUpdateBalance(-cost, 'spin', `Paid ${cost} PKR for Helix Spin`);
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
      className="pb-32 max-w-4xl mx-auto px-4 pt-6 perspective-[2000px]"
    >
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 hover:bg-slate-50 shadow-sm transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic flex items-center gap-2">
              Helix <span className="text-amber-500">Spinner</span> <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            </h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">3D Quantum Yield Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors border border-slate-200 shadow-sm"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left: The 3D Quantum Wheel */}
        <div className="lg:col-span-7 flex flex-col items-center">
            {/* Live Winners Ticker */}
            <div className="w-full bg-[#0A0B0F] rounded-full py-2.5 px-8 mb-12 border border-white/5 overflow-hidden relative shadow-2xl">
                 <div className="absolute inset-0 bg-amber-500/5 blur-xl"></div>
                 <motion.div 
                    animate={{ x: [400, -1200] }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    className="whitespace-nowrap flex items-center gap-12 relative z-10"
                 >
                    {winners.length > 0 ? (
                        winners.map((winner, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span className="text-white italic">{winner.userName}</span> captured <span className="text-emerald-400">Rs {winner.prize}</span>
                                </span>
                            </div>
                        ))
                    ) : (
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-40">Helix Engine Standby. Awaiting first yield sequence...</span>
                    )}
                 </motion.div>
            </div>

            {/* 3D Wheel Container */}
            <div className="relative pt-12 pb-20 group" style={{ perspective: '1200px' }}>
                {/* Outer Portal Glow */}
                <div className={`absolute inset-[-60px] rounded-full blur-[100px] opacity-20 transition-all duration-1000 ${activeTier === 100 ? 'bg-amber-500' : activeTier === 50 ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                
                {/* Pointer (3D Pin) */}
                <div className="absolute top-[20px] left-1/2 -translate-x-1/2 z-[60] transform group-hover:scale-110 transition-transform duration-500">
                    <div className="relative">
                        <div className="absolute inset-[-15px] bg-white blur-3xl opacity-40 animate-pulse"></div>
                        <div className="w-14 h-16 bg-white rounded-t-full rounded-b-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center border-4 border-slate-50 relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-slate-100 to-transparent"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] z-10"></div>
                        </div>
                    </div>
                </div>

                {/* 3D Base Station */}
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[380px] h-[40px] bg-slate-200/50 rounded-full blur-3xl opacity-50 z-0"></div>

                {/* The Physical 3D Wheel Deck */}
                <div className="relative transform-gpu" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(35deg)' }}>
                    {/* Shadow Plate */}
                    <div className="absolute inset-[30px] rounded-full bg-black/40 blur-2xl transform translate-z-[-50px]"></div>

                    {/* Side Thickness (Depth) */}
                    <div className="absolute inset-0 rounded-full bg-slate-900 translate-z-[-20px] shadow-2xl border-b-8 border-slate-800"></div>

                    {/* Main Disk Surface */}
                    <div className="relative p-7 bg-white rounded-full shadow-[inset_0_0_80px_rgba(0,0,0,0.05)] border-[16px] border-slate-100/80 backdrop-blur-sm transform-gpu group-hover:border-white transition-all duration-700">
                        <motion.div 
                            animate={{ rotate: rotation }}
                            transition={{ duration: 5, ease: [0.15, 0.85, 0.1, 1] }}
                            className="relative rounded-full overflow-hidden shadow-2xl flex items-center justify-center bg-[#090A0F] transform-gpu"
                            style={{ 
                                width: 320, 
                                height: 320,
                                transformStyle: 'preserve-3d',
                                boxShadow: '0 0 40px rgba(0,0,0,0.5), inset 0 0 100px rgba(99,102,241,0.1)'
                            }}
                        >
                            {/* Technical Grid Overlay */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                            {/* 3D Segment Dividers */}
                            {currentSegments.map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute inset-0 bg-white/5 opacity-40 origin-center"
                                    style={{ transform: `rotate(${i * (360/currentSegments.length)}deg)`, width: '1px', left: '50%' }}
                                />
                            ))}

                            {/* Prize Nodes */}
                            {currentSegments.map((seg, i) => (
                                <div
                                    key={i}
                                    className="absolute text-center select-none transform-gpu"
                                    style={{
                                        transform: `rotate(${(i * 360) / currentSegments.length + 180 / currentSegments.length}deg) translateY(-120px)`,
                                        transformOrigin: 'center center',
                                    }}
                                >
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-[8px] font-black shadow-inner ${
                                            seg.value === 0 ? 'bg-white/5 text-slate-700' : 'bg-white/10 text-white'
                                        }`}>
                                            {seg.value === -1 ? 'FS' : seg.value === 0 ? 'ERR' : 'OK'}
                                        </div>
                                        <p className="text-[8px] font-black italic tracking-[0.2em] text-white opacity-20 mb-1 font-mono uppercase">Ticket</p>
                                        <p className={`text-xl font-black italic tracking-tighter text-white drop-shadow-lg ${seg.value === 0 ? 'opacity-20' : 'text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400'}`}>
                                            {seg.value === -1 ? 'FREE' : seg.value === 0 ? 'LOSS' : `${seg.value}`}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Center Reactor Core */}
                            <div className="absolute inset-0 m-auto w-24 h-24 bg-white rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center z-10 border-8 border-slate-100 transform translate-z-[40px]">
                                 <div className="w-16 h-16 bg-[#0A0B0F] rounded-2xl flex items-center justify-center text-amber-500 shadow-inner group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent animate-pulse"></div>
                                    <Sparkles className="w-8 h-8 animate-pulse z-10" />
                                    {/* Spinner Internal Light */}
                                    {isSpinning && (
                                        <motion.div 
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                            className="absolute inset-0 bg-amber-500/20 blur-xl"
                                        />
                                    )}
                                 </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Spin Controls */}
            <div className="mt-16 w-full max-w-md space-y-6">
                <div className="flex bg-slate-50 p-2.5 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    {tiers.map((t) => {
                        const isSelected = activeTier === t.id;
                        const isLocked = false; // Tiers unlocked as requested

                        return (
                            <button 
                                key={t.id}
                                disabled={isSpinning || isLocked}
                                onClick={() => setActiveTier(t.id)}
                                className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden flex flex-col items-center gap-1 ${
                                    isSelected 
                                    ? 'bg-[#0A0B0F] text-white shadow-2xl' 
                                    : 'text-slate-400 hover:text-slate-900'
                                } ${isLocked ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                            >
                                {t.label}
                                <span className={`text-[7px] font-bold ${isSelected ? 'text-amber-500/60' : 'text-slate-400/40'}`}>NODE {t.id}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-4">
                    <motion.button
                        whileHover={{ y: -5, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => spinWheel(true)}
                        disabled={isSpinning || (balance + spinBalance) < activeTier}
                        className={`w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] flex flex-col items-center justify-center gap-2 group transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden ${
                            isSpinning 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                            : ((balance + spinBalance) < activeTier) 
                            ? 'bg-red-50 text-red-300 border border-red-100'
                            : `bg-[#0A0B0F] text-white`
                        }`}
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors"></div>
                        
                        <span className="text-sm italic tracking-widest flex items-center gap-3">
                            {isSpinning ? 'PROCESSING...' : `Initiate Sequence`} <ArrowRight className="w-4 h-4 text-amber-500" />
                        </span>
                        
                        {!isSpinning && (
                            <span className="text-[9px] font-black text-amber-500/60 opacity-60">COST: RS {activeTier} PROTOCOL FEED</span>
                        )}
                    </motion.button>

                    <button
                        onClick={() => spinWheel(false)}
                        disabled={isSpinning || freeSpins <= 0}
                        className={`w-full py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border-2 border-slate-100 bg-white shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 disabled:opacity-30 ${freeSpins > 0 ? 'text-indigo-600 border-indigo-100' : 'text-slate-400'}`}
                    >
                        <Ticket className="w-4 h-4" /> Use Free Entry ({freeSpins})
                    </button>
                </div>
            </div>
        </div>

        {/* Right: Technical Specifications */}
        <div className="lg:col-span-5 space-y-8">
            {/* Probability Specs */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-6 right-8 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> LIVE STATS
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter italic mb-8 uppercase">Unit <span className="text-indigo-600">Diagnostics</span></h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 group-hover:text-indigo-600 transition-colors">
                                <Trophy className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Potential Yield</p>
                                <p className="text-xs font-black text-slate-900 italic uppercase">Jackpot Capacity</p>
                             </div>
                        </div>
                        <p className="text-2xl font-black text-indigo-600 italic tracking-tighter">Rs {Math.max(...currentSegments.map(s => s.value))}</p>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-amber-200 transition-all">
                        <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 group-hover:text-amber-600 transition-colors">
                                <Users className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Global Load</p>
                                <p className="text-xs font-black text-slate-900 italic uppercase">Network Entries</p>
                             </div>
                        </div>
                        <p className="text-2xl font-black text-amber-600 italic tracking-tighter">{winners.length * 127}+</p>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-[#0A0B0F] rounded-[2rem] text-white border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Protocol Rule</p>
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase italic">Every sequence is verified via decentralized randomization. Higher tiers significantly increase probability of complex yield nodes.</p>
                </div>
            </div>

            {/* Achievement / History Grid */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col h-full min-h-[400px]">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">Local <span className="text-emerald-600">History</span></h3>
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Clock className="w-4 h-4" />
                    </div>
                 </div>

                 <div className="flex-1 space-y-3 overflow-y-auto pr-2 no-scrollbar">
                    {winners.filter(w => w.userId === auth.currentUser?.uid).length === 0 ? (
                        <div className="text-center py-20 opacity-30 flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Ticket className="w-10 h-10 italic" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No yield sequences logged</p>
                        </div>
                    ) : (
                        winners.filter(w => w.userId === auth.currentUser?.uid).map((entry, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={idx} 
                                className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[1.75rem] border border-slate-100 group hover:border-emerald-200 hover:bg-white hover:shadow-lg transition-all duration-500"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[10px] font-black text-emerald-500 shadow-sm border border-slate-50 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        {entry.prize.substring(0, 1)}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic">Success Response</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-emerald-600 italic tracking-tighter leading-none">{entry.prize}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Verified</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                 </div>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {/* Prize Modal */}
        {prize && !showLockedModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-[#0A0B0F]/90 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white p-10 rounded-[3rem] w-full max-w-sm text-center shadow-2xl relative overflow-hidden border border-slate-100"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
              <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
                {prize.value === 0 ? <X className="w-12 h-12 text-red-300" /> : <Gift className="w-12 h-12 text-emerald-500 animate-bounce" />}
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight italic uppercase">
                {prize.value === 0 ? 'Cycle Failure' : 'Yield Secured'}
              </h3>
              <p className="text-slate-500 font-bold mb-10 text-xs uppercase tracking-widest leading-relaxed">
                {prize.value === 0 
                  ? 'Theres no yield in this sequence. Re-initialize for better results.' 
                  : prize.value === -1 
                    ? 'Sequence Bonus: You won an extra Free Entry!'
                    : `Identity Verified. Rs ${prize.value} has been injected into your hub.`}
              </p>
              <button 
                onClick={() => setPrize(null)}
                className="w-full bg-[#0A0B0F] text-white font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all text-[10px] uppercase tracking-[0.3em] italic"
              >
                Accept and Continue
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Locked Reward Modal */}
        {showLockedModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-10"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-400 to-amber-600 p-1 rounded-[3rem] shadow-[0_40px_80px_rgba(245,158,11,0.3)] w-full max-w-sm"
            >
                <div className="bg-[#0A0B0F] rounded-[2.8rem] p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
                    <div className="w-24 h-24 bg-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/40 relative border-4 border-white/5">
                        <Crown className="w-12 h-12 text-white" />
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-2 border-2 border-white shadow-xl">
                            <Lock className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3 tracking-tighter italic">CRYPTO <span className="text-amber-500">LOCK</span></h3>
                    <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest">
                        A massive yield of <span className="text-white italic">Rs {showLockedModal.amount}</span> is pending. Verify your network to unlock.
                    </p>
                    <div className="bg-white/5 p-6 rounded-2xl mb-10 border border-white/5">
                        <p className="text-white font-black text-sm uppercase italic tracking-widest">
                            Required: {showLockedModal.invites} Direct Referrals
                        </p>
                        <p className="text-[10px] text-amber-500 font-bold mt-2 uppercase tracking-tight">Active Invites: {activeInvites}</p>
                    </div>
                    <button 
                        onClick={() => { setShowLockedModal(null); setPrize(null); }}
                        className="w-full bg-white text-slate-900 font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all text-[10px] uppercase tracking-[0.3em] italic"
                    >
                        Secure Hub
                    </button>
                </div>
            </motion.div>
          </motion.div>
        )}

        {/* Deposit Popup */}
        {showDepositPopup && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-10 rounded-[3rem] w-full max-w-sm text-center relative overflow-hidden border border-slate-100"
            >
              <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100">
                <Wallet className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter italic uppercase underline decoration-red-500">Hub Empty</h3>
              <p className="text-slate-500 font-bold mb-10 text-[10px] uppercase tracking-widest leading-relaxed">
                Liquidity insufficient for current tier. Deposit Rs {activeTier} to continue the yield sequence.
              </p>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => { setShowDepositPopup(false); if (onGoToDeposit) onGoToDeposit(); }}
                  className="w-full bg-[#0A0B0F] text-white font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all text-[10px] uppercase tracking-[0.3em] italic"
                >
                  Reload Assets
                </button>
                <button 
                  onClick={() => setShowDepositPopup(false)}
                  className="w-full bg-slate-100 text-slate-400 font-black py-4 rounded-[1.5rem] text-[10px] uppercase tracking-[0.3em] italic"
                >
                  Return to Hub
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
