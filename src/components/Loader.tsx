import { motion } from 'motion/react';
import { Coins } from 'lucide-react';

const dots = [0, 1, 2];

export default function Loader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden"
      role="status"
      aria-label="Loading TaskMint"
    >
      {/* Soft animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          aria-hidden
          animate={{ y: [0, -20, 0], x: [0, 14, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-28 -left-28 w-96 h-96 bg-emerald-100/80 rounded-full blur-3xl"
        />
        <motion.div
          aria-hidden
          animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-24 w-[26rem] h-[26rem] bg-teal-100/80 rounded-full blur-3xl"
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(circle, #a7f3d0 1px, transparent 1px)', backgroundSize: '34px 34px' }}
        />
      </div>

      <div className="relative flex flex-col items-center px-6">
        {/* Bouncing coin with ripple rings */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {[0, 1].map((ring) => (
            <motion.span
              key={ring}
              aria-hidden
              initial={{ scale: 0.55, opacity: 0.5 }}
              animate={{ scale: 1.45, opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: ring * 0.9 }}
              className="absolute inset-0 rounded-full border-2 border-emerald-300"
            />
          ))}
          <motion.div
            animate={{ y: [0, -12, 0], rotate: [0, -4, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/40 flex items-center justify-center"
          >
            <span className="absolute inset-[5px] rounded-full border-2 border-white/30" />
            <Coins className="w-9 h-9 text-white drop-shadow" />
          </motion.div>
          {/* Coin shadow */}
          <motion.span
            aria-hidden
            animate={{ scaleX: [1, 0.72, 1], opacity: [0.22, 0.12, 0.22] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-1 w-14 h-2.5 bg-slate-900 rounded-full blur-[3px]"
          />
        </div>

        {/* Brand name — letters rise in one by one */}
        <h1 className="mt-9 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 flex" aria-label="TaskMint">
          {'Task'.split('').map((ch, i) => (
            <motion.span key={`t-${i}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i, duration: 0.35 }} aria-hidden>{ch}</motion.span>
          ))}
          {'Mint'.split('').map((ch, i) => (
            <motion.span key={`m-${i}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * (i + 4), duration: 0.35 }} className="text-emerald-600" aria-hidden>{ch}</motion.span>
          ))}
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-2.5 text-sm font-semibold text-slate-500"
        >
          Earn money online in Pakistan
        </motion.p>

        {/* Progress bar */}
        <div className="mt-9 w-52 h-2 rounded-full bg-emerald-100 overflow-hidden">
          <motion.div
            initial={{ x: '-110%' }}
            animate={{ x: '320%' }}
            transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
          />
        </div>

        {/* Loading dots */}
        <div className="mt-5 flex items-center gap-2" aria-hidden>
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400 mr-1">Loading</span>
          {dots.map((d) => (
            <motion.span
              key={d}
              animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: d * 0.15 }}
              className="w-2 h-2 rounded-full bg-emerald-500"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
