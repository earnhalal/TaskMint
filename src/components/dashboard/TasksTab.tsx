import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Star, ArrowRight } from 'lucide-react';

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
          <Star className="w-4 h-4" /> High Paying Tasks
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task, i) => (
          <div key={task.id ? `task-${task.id}` : `task-idx-${i}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{task.title}</h3>
                <p className="text-[10px] text-slate-500">{task.desc}</p>
                <span className="inline-block mt-1 text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                  {task.type}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-sm font-black text-emerald-600">{task.reward}</span>
              <button className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-slate-800 transition-colors">
                Start <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
