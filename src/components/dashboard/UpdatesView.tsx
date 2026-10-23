import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Mail, 
  Wallet, 
  ShieldCheck, 
  Info,
  ArrowRightLeft,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Zap
} from 'lucide-react';

export interface AppUpdate {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'welcome' | 'activation' | 'deposit' | 'withdrawal' | 'verification' | 'system';
    status: 'unread' | 'read';
    timestamp: string;
}

interface UpdatesViewProps {
    updates: AppUpdate[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onBack: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'welcome': return <Gamepad2 className="w-5 h-5 text-emerald-500" />;
    case 'activation': return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
    case 'deposit': return <Wallet className="w-5 h-5 text-blue-500" />;
    case 'withdrawal': return <ArrowRightLeft className="w-5 h-5 text-emerald-500" />;
    case 'verification': return <Mail className="w-5 h-5 text-red-500" />;
    default: return <Info className="w-5 h-5 text-zinc-400" />;
  }
};

const UpdatesView: React.FC<UpdatesViewProps> = ({ updates, onMarkAsRead, onMarkAllAsRead, onBack }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-[#022c22] flex flex-col font-sans overflow-hidden"
        >
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            </div>

            {/* Premium Dynamic Header */}
            <div className="relative bg-[#022c22]/80 backdrop-blur-xl border-b border-white/5 px-6 py-8 flex items-center justify-between z-20">
                <div className="flex items-center gap-5">
                    <button 
                        onClick={onBack}
                        className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95 border border-white/5 shadow-xl"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter  uppercase flex items-center gap-2">
                             System <span className="text-teal-400">Mailbox</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Secure Communication Channel</p>
                        </div>
                    </div>
                </div>
                
                {updates.some(n => n.status === 'unread') ? (
                    <button 
                        onClick={onMarkAllAsRead}
                        className="group relative px-4 py-2.5 rounded-xl overflow-hidden active:scale-95 transition-all"
                    >
                        <div className="absolute inset-0 bg-teal-600 opacity-10 group-hover:opacity-20 transition-opacity" />
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform" />
                        <span className="relative text-[10px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Read All
                        </span>
                    </button>
                ) : (
                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Inbox Clear</span>
                    </div>
                )}
            </div>

            {/* Content Stream */}
            <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
                {updates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                        <div className="relative mb-8 group">
                            <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-[60px] animate-pulse" />
                            <div className="relative w-28 h-28 bg-[#022c22] rounded-3xl border border-white/5 flex items-center justify-center text-zinc-200 shadow-2xl transition-all group-hover:scale-105 duration-500">
                                <Mail className="w-12 h-12 opacity-20" />
                                <div className="absolute -top-2 -right-2 w-10 h-10 bg-teal-600/10 rounded-2xl flex items-center justify-center border border-teal-500/20">
                                    <Zap className="w-5 h-5 text-teal-400" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-white  tracking-tighter uppercase mb-2">Inbox Empty</h3>
                        <p className="text-[10px] font-bold text-zinc-400 max-w-[240px] uppercase tracking-widest leading-loose">No new messages from the system. You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {updates.map((update, i) => (
                                <motion.div 
                                    key={update.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => onMarkAsRead(update.id)}
                                    className={`group relative p-6 rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden ${
                                        update.status === 'unread' 
                                            ? 'bg-gradient-to-r from-white/5 to-transparent border-white/10 shadow-2xl shadow-none' 
                                            : 'bg-transparent border-white/5 opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
                                    }`}
                                >
                                    {/* Unread Glow Accent */}
                                    {update.status === 'unread' && (
                                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                    )}

                                    <div className="flex gap-5 relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 ${
                                            update.status === 'unread' 
                                                ? 'bg-teal-600 shadow-xl shadow-none text-white' 
                                                : 'bg-white/5 text-zinc-400 border border-white/5'
                                        }`}>
                                            {getIcon(update.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3 truncate">
                                                    <h4 className="text-base font-black text-white  tracking-tight uppercase truncate">
                                                        {update.title}
                                                    </h4>
                                                    {update.status === 'unread' && (
                                                        <div className="flex items-center gap-1 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                                                            <div className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" />
                                                            <span className="text-[7px] font-black text-teal-400 uppercase tracking-widest leading-none">New Log</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/5 shrink-0">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            
                                            <p className={`text-xs leading-relaxed mb-5 ${
                                                update.status === 'unread' ? 'text-slate-300 font-medium' : 'text-zinc-400'
                                            }`}>
                                                {update.message}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                                        <div className={`w-1 h-1 rounded-full ${
                                                            update.type === 'activation' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]' :
                                                            update.type === 'withdrawal' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(192,132,252,0.5)]' :
                                                            update.type === 'deposit' ? 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)]' :
                                                            'bg-slate-400'
                                                        }`} />
                                                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{update.type}</span>
                                                    </div>
                                                    <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                                                        {new Date(update.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                
                                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all border border-white/5">
                                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Information Hub Footer */}
            {updates.length > 0 && (
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#022c22] via-[#022c22]/95 to-transparent z-20">
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 border border-white/5 shadow-2xl relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shrink-0">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1 ">Pro Tip</p>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-loose">
                                System logs are auto-cleared after 30 days to keep your inbox clean.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default UpdatesView;
