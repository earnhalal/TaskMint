import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Flame, Crown, PartyPopper, X, Bell } from 'lucide-react';

const defaultAnnouncements = [
  { text: "Omar just withdrew Rs 500", icon: <Flame className="w-3 h-3 text-orange-500" /> },
  { text: "Ayesha earned Rs 1,200 from Spin", icon: <PartyPopper className="w-3 h-3 text-emerald-500" /> },
  { text: "Zainab activated Silver Package", icon: <Crown className="w-3 h-3 text-amber-500" /> },
  { text: "Hamza just joined the Gold Tier", icon: <Rocket className="w-3 h-3 text-indigo-500" /> },
  { text: "New CPX Surveys available - High Rewards!", icon: <Flame className="w-3 h-3 text-red-500" /> },
];

interface AnnouncementBarProps {
  dynamicMessage?: string;
  onClose?: () => void;
}

export default function AnnouncementBar({ dynamicMessage, onClose }: AnnouncementBarProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (dynamicMessage) return; // Don't rotate if we have a dynamic fixed message
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % defaultAnnouncements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [dynamicMessage]);

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="w-full bg-[#0A0B0F] border-b border-white/5 py-2 overflow-hidden relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none"></div>
      <div className="max-w-md mx-auto px-10 flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {dynamicMessage ? (
            <motion.div
              key={dynamicMessage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <Bell className="w-3 h-3 text-amber-500 animate-bounce" />
              <span 
                className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic truncate"
                dangerouslySetInnerHTML={{ __html: dynamicMessage }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              {defaultAnnouncements[index].icon}
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic truncate">
                {defaultAnnouncements[index].text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onClose && (
        <button 
          onClick={onClose}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}
