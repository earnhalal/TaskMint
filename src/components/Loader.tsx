import React from 'react';
import { motion } from 'motion/react';

export default function Loader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-100/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* 3D Branding Text */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-6xl font-black tracking-tighter text-slate-900 mb-8"
          style={{
            textShadow: `
              0 1px 0 #ccc,
              0 2px 0 #c9c9c9,
              0 3px 0 #bbb,
              0 4px 0 #b9b9b9,
              0 5px 0 #aaa,
              0 6px 1px rgba(0,0,0,.1),
              0 0 5px rgba(0,0,0,.1),
              0 1px 3px rgba(0,0,0,.3),
              0 3px 5px rgba(0,0,0,.2),
              0 5px 10px rgba(0,0,0,.25),
              0 10px 10px rgba(0,0,0,.2),
              0 20px 20px rgba(0,0,0,.15)
            `
          }}
        >
          Task<span className="text-amber-500">Mint</span>
        </motion.h1>

        {/* 3D Spinning Gold Coin */}
        <div className="perspective-[1000px]">
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 shadow-2xl relative flex items-center justify-center border-4 border-amber-200/50"
            style={{
              transformStyle: "preserve-3d",
              boxShadow: "0 0 30px rgba(245, 158, 11, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.5)"
            }}
          >
            {/* Coin Face Detail */}
            <div className="w-16 h-16 rounded-full border-2 border-amber-200/30 flex items-center justify-center">
              <span className="text-3xl font-black text-amber-100 drop-shadow-md">M</span>
            </div>
            
            {/* Coin Edge (Simulated with pseudo-elements or layers if needed, but simple rotateY works well) */}
            <div 
              className="absolute inset-0 rounded-full" 
              style={{ 
                transform: "translateZ(-2px)", 
                background: "linear-gradient(to br, #d97706, #f59e0b, #d97706)" 
              }} 
            />
          </motion.div>
        </div>

        {/* Loading Indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-12 h-1 w-48 bg-slate-100 rounded-full overflow-hidden"
        >
          <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-600 w-1/2 rounded-full" />
        </motion.div>
        
        <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Initializing Secure Environment
        </p>
      </div>
    </motion.div>
  );
}
