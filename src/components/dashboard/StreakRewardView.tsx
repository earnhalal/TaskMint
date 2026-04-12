import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Lock, ArrowLeft, Calendar, Gift } from 'lucide-react';

interface StreakRewardViewProps {
  onBack: () => void;
  onUpdateBalance: (amount: number, source?: string, description?: string) => void;
}

export default function StreakRewardView({ onBack, onUpdateBalance }: StreakRewardViewProps) {
  const [streakCount, setStreakCount] = useState(0);
  const [vaultBalance, setVaultBalance] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState<number | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // Load data from localStorage
    const savedStreak = parseInt(localStorage.getItem('taskmint_streak_count') || '0');
    const savedVault = parseFloat(localStorage.getItem('taskmint_vault_balance') || '0');
    const savedLastCheckIn = localStorage.getItem('taskmint_last_checkin');

    setStreakCount(savedStreak);
    setVaultBalance(savedVault);

    if (savedLastCheckIn) {
      const lastTime = parseInt(savedLastCheckIn);
      setLastCheckIn(lastTime);
      checkClaimStatus(lastTime);
    } else {
      setCanClaim(true);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!canClaim && lastCheckIn) {
      timer = setInterval(() => {
        checkClaimStatus(lastCheckIn);
      }, 60000); // Check every minute
    }
    return () => clearInterval(timer);
  }, [canClaim, lastCheckIn]);

  const checkClaimStatus = (lastTime: number) => {
    const now = new Date();
    const lastDate = new Date(lastTime);
    
    // Check if it's a new calendar day
    const isNewDay = now.getDate() !== lastDate.getDate() || 
                     now.getMonth() !== lastDate.getMonth() || 
                     now.getFullYear() !== lastDate.getFullYear();

    if (isNewDay) {
      setCanClaim(true);
      setTimeLeft('');
    } else {
      setCanClaim(false);
      // Calculate time until midnight
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diffMs = tomorrow.getTime() - now.getTime();
      const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
      const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
      setTimeLeft(`${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}`);
    }
  };

  const handleClaim = () => {
    if (!canClaim) return;

    const now = Date.now();
    const newStreak = streakCount + 1;
    
    if (newStreak === 30) {
      // 30th day claim
      const finalVault = vaultBalance + 5;
      onUpdateBalance(finalVault, 'task', 'Completed 30-Day Streak Challenge');
      
      // Reset
      setStreakCount(0);
      setVaultBalance(0);
      setLastCheckIn(now);
      setCanClaim(false);
      
      localStorage.setItem('taskmint_streak_count', '0');
      localStorage.setItem('taskmint_vault_balance', '0');
      localStorage.setItem('taskmint_last_checkin', now.toString());
    } else {
      // Normal daily claim
      const newVault = vaultBalance + 5;
      
      setStreakCount(newStreak);
      setVaultBalance(newVault);
      setLastCheckIn(now);
      setCanClaim(false);
      
      localStorage.setItem('taskmint_streak_count', newStreak.toString());
      localStorage.setItem('taskmint_vault_balance', newVault.toString());
      localStorage.setItem('taskmint_last_checkin', now.toString());
    }
    
    checkClaimStatus(now);
  };

  const progressPercentage = (streakCount / 30) * 100;

  return (
    <div className="min-h-screen bg-[#060D2D] text-white p-4 font-sans absolute inset-0 z-50 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 bg-[#0C1C4B] rounded-full hover:bg-[#152865] transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Daily Streak Reward</h1>
      </div>

      {/* Top Section (Stats Card) */}
      <div className="bg-[#0C1C4B] rounded-2xl p-5 mb-6 border border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-300 mb-1">Monthly Vault Balance</p>
            <p className="text-3xl font-bold text-yellow-400">Rs {vaultBalance.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300 mb-1">Current Streak</p>
            <p className="text-xl font-bold text-white flex items-center gap-1 justify-end">
              <Calendar className="w-4 h-4 text-yellow-400" />
              {streakCount}/30 Days
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-[#060D2D] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Middle Section (30-Day Grid) */}
      <div className="bg-[#0C1C4B] rounded-2xl p-5 mb-6 border border-white/5">
        <h2 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider text-center">30-Day Challenge</h2>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {Array.from({ length: 30 }).map((_, index) => {
            const dayNumber = index + 1;
            const isCompleted = dayNumber <= streakCount;
            const isToday = dayNumber === streakCount + 1;
            const isLocked = dayNumber > streakCount + 1;

            return (
              <div 
                key={index}
                className={`
                  relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all
                  ${isCompleted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                  ${isToday ? 'bg-yellow-400/10 text-yellow-400 border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]' : ''}
                  ${isLocked ? 'bg-[#060D2D] text-gray-500 border border-white/5' : ''}
                `}
              >
                <span className="mb-1 opacity-80">{dayNumber}</span>
                {isCompleted && <Check className="w-4 h-4" />}
                {isToday && <Gift className="w-4 h-4 animate-bounce" />}
                {isLocked && <Lock className="w-3 h-3 opacity-50" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section (Action Button) */}
      <div className="pb-8">
        <button
          onClick={handleClaim}
          disabled={!canClaim}
          className={`
            w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
            ${canClaim 
              ? 'bg-white text-[#060D2D] hover:bg-gray-100 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {canClaim ? (
            streakCount === 29 ? 'Claim Full Rs 150 to Wallet' : "Collect Today's Rs 5"
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Next claim in {timeLeft}
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Check in every day to build your vault. Missing a day will NOT reset your streak, but you must complete 30 days to withdraw.
        </p>
      </div>
    </div>
  );
}
