import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function Loader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0B0F] overflow-hidden"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Animated Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Floating Particles */}
        <AnimatePresence>
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{ 
                        opacity: [0, 1, 0], 
                        scale: [0, 1, 0],
                        x: (Math.random() - 0.5) * 200,
                        y: (Math.random() - 0.5) * 200
                    }}
                    transition={{ 
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 0.4
                    }}
                    className="absolute w-1 h-1 bg-amber-400 rounded-full blur-[1px]"
                />
            ))}
        </AnimatePresence>

        {/* 3D Spinning Core System */}
        <div className="perspective-[1200px] mb-12">
          <motion.div
            animate={{ 
                rotateY: [0, 360],
                rotateX: [0, 15, 0, -15, 0],
                y: [0, -10, 0]
            }}
            transition={{
              rotateY: { duration: 3, repeat: Infinity, ease: "linear" },
              rotateX: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative w-32 h-32"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Main Coin Face */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border-4 border-amber-200/40 flex items-center justify-center overflow-hidden"
              style={{ 
                transform: "translateZ(8px)",
                boxShadow: "0 0 50px rgba(245, 158, 11, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.4)"
              }}
            >
                <div className="w-20 h-20 rounded-full border-2 border-amber-200/20 flex items-center justify-center">
                    <span className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] italic">M</span>
                </div>
            </div>

            {/* Back Face */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-700 to-amber-900 border-4 border-amber-800/40 flex items-center justify-center"
              style={{ transform: "translateZ(-8px) rotateY(180deg)" }}
            >
                 <Sparkles className="w-12 h-12 text-amber-200 opacity-40" />
            </div>

            {/* Edge Layers for 3D thickness */}
            {[...Array(8)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute inset-0 rounded-full bg-amber-700/80"
                    style={{ transform: `translateZ(${i - 4}px)` }}
                />
            ))}
          </motion.div>
        </div>

        {/* 3D Branding Text */}
        <div className="text-center">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="relative"
            >
                <h1 
                    className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl italic"
                    style={{
                        textShadow: '0 4px 10px rgba(0,0,0,0.5)'
                    }}
                >
                    Task<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600">MINT</span>
                </h1>
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent w-full mt-2" />
            </motion.div>

            {/* Progress Interface */}
            <div className="mt-12 space-y-4">
                <div className="w-56 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent w-1/2"
                    />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3, ease: "easeOut" }}
                        className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    />
                </div>
                
                <div className="flex flex-col items-center gap-1">
                    <motion.p 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em]"
                    >
                        Synchronizing Protocol
                    </motion.p>
                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">
                        Handshaking with Secure Nodes...
                    </p>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper component for particles since we need AnimatePresence
function AnimatePresence({ children }: { children: React.ReactNode }) {
    return <motion.div className="absolute inset-0">{children}</motion.div>;
}
