import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Flame, Crown, PartyPopper, X, Bell, Megaphone } from 'lucide-react';

/**
 * Announcement bar — brightened 2026-10-25. The old bar was a dull
 * dark strip with tiny grey text that nobody could read. It is now a
 * vivid emerald→teal gradient with a soft glow, bold white text, the
 * icon in a bright chip, a slow shine sweep, and progress dots for
 * the rotating messages. Copy is kept honest and current (the Daily
 * Bonus pays a weighted 100–1,000 Gold Coins).
 */

const defaultAnnouncements = [
  { text: 'New surveys are live in the Earn Zone — high rewards', icon: Flame },
  { text: 'Invite friends and earn up to Rs. 125 per activation', icon: Rocket },
  { text: 'Payouts are processed on the 1st–3rd and 16th–18th of every month', icon: Bell },
  { text: 'Daily Bonus: up to 1,000 Gold Coins every day in the app', icon: PartyPopper },
  { text: 'Go PRO: higher ad rewards, up to 60 Gold Coins per ad', icon: Crown },
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
    }, 4200);
    return () => clearInterval(timer);
  }, [dynamicMessage]);

  const CurrentIcon = dynamicMessage ? Megaphone : defaultAnnouncements[index].icon;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 shadow-[0_6px_28px_rgba(16,185,129,0.45)]"
    >
      {/* shine sweep */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        animate={{ x: ['-120%', '420%'] }}
        transition={{ duration: 3.6, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
      />
      <div className="relative max-w-md mx-auto px-9 py-2.5 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {dynamicMessage ? (
            <motion.div
              key={dynamicMessage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-md bg-white/25 flex items-center justify-center shrink-0">
                <CurrentIcon className="w-3 h-3 text-white" />
              </span>
              <span
                className="text-[11px] font-black text-white uppercase tracking-wider truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                dangerouslySetInnerHTML={{ __html: dynamicMessage }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="flex items-center gap-2"
            >
              <span className="w-5 h-5 rounded-md bg-white/25 flex items-center justify-center shrink-0">
                <CurrentIcon className="w-3 h-3 text-white" />
              </span>
              <span className="text-[11px] font-black text-white uppercase tracking-wider truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                {defaultAnnouncements[index].text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {!dynamicMessage && (
          <div className="flex gap-1 mt-1.5">
            {defaultAnnouncements.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-4 bg-white' : 'w-1 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}
