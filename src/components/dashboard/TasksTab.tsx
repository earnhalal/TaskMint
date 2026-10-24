import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Info, ArrowLeft, Lock, Zap, X, Smartphone, Trophy, RefreshCcw, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TasksTabProps {
  onBack: () => void;
  accountStatus: string;
  onPayClick: () => void;
}

/**
 * Earn Zone (renamed from "Daily Tasks" / Wannads Offer Wall, redesigned
 * 2026-10-25): high-paying app installs and offers from Wannads.
 * Completed offers pay out through the Wannads server postback into the
 * user's main balance.
 */
export default function TasksTab({ onBack, accountStatus, onPayClick }: TasksTabProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const isApproved = accountStatus.toLowerCase() === 'active';

  const userId = user?.uid || '';
  const wannadsUrl = `https://earn.wannads.com/wall?apiKey=69d9648474a17761405810&userId=${userId}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] bg-zinc-950 flex flex-col"
    >
      {/* Header */}
      <div className="relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/25 via-zinc-900 to-zinc-950" />
        <div className="pointer-events-none absolute -top-16 right-0 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative px-4 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white leading-none tracking-tight">Earn Zone</h2>
                  <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                    High Paying
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                  App installs &amp; premium offers
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showInfo ? 'bg-cyan-500 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'}`}
            >
              {showInfo ? <X className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </button>
          </div>

          {/* Feature chips */}
          <div className="flex gap-2 mt-4">
            {[
              { icon: <Smartphone className="w-3.5 h-3.5" />, label: 'Install & Earn' },
              { icon: <Trophy className="w-3.5 h-3.5" />, label: 'Top Payouts' },
              { icon: <RefreshCcw className="w-3.5 h-3.5" />, label: 'Fresh Offers Daily' },
            ].map((chip) => (
              <span
                key={chip.label}
                className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-300"
              >
                <span className="text-cyan-400">{chip.icon}</span>
                {chip.label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-semibold text-zinc-400 leading-relaxed flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-px" />
            Finish an offer exactly as its instructions say — the payout lands in your main balance automatically.
          </p>
        </div>
      </div>

      {/* Info Overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 z-50 p-4"
          >
            <div className="bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">How Earn Zone Works</h3>
              </div>
              <div className="space-y-3">
                {[
                  'Pick an offer and read its instructions carefully before you start — most payouts need the exact steps completed (for example: install, open, and reach a level or sign up).',
                  'Use real details and complete each offer yourself, once. Fake or repeated completions are reversed by the network.',
                  'Rewards are confirmed by the network and added to your main balance automatically — most land within 24 hours, some high-value offers take longer while the advertiser verifies.',
                ].map((tip) => (
                  <div key={tip.slice(0, 24)} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></div>
                    <p className="text-xs text-zinc-300 font-bold leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="w-full mt-6 py-3 bg-white/5 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wall Container */}
      <div className="flex-1 relative bg-white/5">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-zinc-950 flex flex-col items-center justify-center px-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mb-4"
            >
              <Smartphone className="w-7 h-7 text-cyan-400" />
            </motion.div>
            <p className="text-sm font-black text-white">Loading Earn Zone...</p>
            <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase tracking-widest">
              Fetching today&apos;s best-paying offers
            </p>
          </div>
        )}

        {/* Activation overlay */}
        {!isApproved && (
          <div className="absolute inset-0 z-30 backdrop-blur-md bg-zinc-950/70 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-zinc-900 rounded-3xl shadow-2xl flex items-center justify-center mb-8 rotate-3 border border-white/10">
              <Lock className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4 leading-tight">Unlock Earn Zone!</h3>
            <p className="text-base text-zinc-300 font-bold mb-10 max-w-xs mx-auto">
              Activate your account with the one-time Rs. 150 joining fee to unlock these high-paying offers.
            </p>
            <button
              onClick={onPayClick}
              className="w-full max-w-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-5 rounded-2xl font-black text-sm shadow-2xl active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Activate Now
            </button>
          </div>
        )}

        <iframe
          src={wannadsUrl}
          className="w-full h-full border-none"
          title="Earn Zone — Wannads offers"
          onLoad={() => setIsLoading(false)}
          style={{ width: '100%', height: '100%', border: '0' }}
        />
      </div>
    </motion.div>
  );
}
