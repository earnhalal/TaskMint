import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Star, Sparkles } from 'lucide-react';

export default function TasksTab({ tasks }: { tasks: any[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 px-4 pt-4"
    >
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/30 mb-6">
        <h2 className="text-2xl font-black mb-2">Task Wall</h2>
        <p className="text-sm text-emerald-100 mb-4">Complete simple tasks to boost your earnings.</p>
        <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-lg text-xs font-bold">
          <Star className="w-4 h-4" /> Coming Soon
        </div>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center flex flex-col items-center justify-center min-h-[300px]"
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative"
        >
          <ClipboardList className="w-10 h-10 text-emerald-500" />
          <motion.div
            animate={{ opacity: [0, 1, 0], rotate: [0, 90, 180] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-amber-400" />
          </motion.div>
        </motion.div>
        <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Coming Soon!</h3>
        <p className="text-sm text-slate-500 max-w-[250px] mx-auto">
          We are preparing high-paying tasks and surveys for you. They will be available here very soon!
        </p>
      </motion.div>
    </motion.div>
  );
}
