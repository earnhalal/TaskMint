import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Flame, Crown, PartyPopper, X, Bell } from 'lucide-react';

const defaultAnnouncements = [
  { text: "New CPX surveys are live — high rewards", icon: <Flame className="w-3 h-3 text-red-500" /> },
  { text: "Invite friends and earn up to Rs. 125 per activation", icon: <Rocket className="w-3 h-3 text-teal-500" /> },
  { text: "Payouts are processed on the 1st–3rd and 16th–18th of every month", icon: <Bell className="w-3 h-3 text-emerald-500" /> },
  { text: "Daily check-in bonus: Rs. 10 in the TaskMint app", icon: <PartyPopper className="w-3 h-3 text-emerald-500" /> },
  { text: "Go PRO: higher ad rewards and instant partner payouts", icon: <Crown className="w-3 h-3 text-emerald-500" /> },
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
      className="w-full bg-[#022c22] border-b border-white/5 py-2 overflow-hidden relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-teal-500/5 pointer-events-none"></div>
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
              <Bell className="w-3 h-3 text-emerald-500 animate-bounce" />
              <span 
                className="text-[10px] font-black text-slate-300 uppercase tracking-widest  truncate"
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
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest  truncate">
                {defaultAnnouncements[index].text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onClose && (
        <button 
          onClick={onClose}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}
