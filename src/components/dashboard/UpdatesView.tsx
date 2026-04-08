import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Mail, 
  CheckCircle, 
  Wallet, 
  ShieldCheck, 
  Info,
  ArrowRightLeft,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight
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
    case 'welcome': return <Gamepad2 className="w-5 h-5 text-amber-500" />;
    case 'activation': return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
    case 'deposit': return <Wallet className="w-5 h-5 text-blue-500" />;
    case 'withdrawal': return <ArrowRightLeft className="w-5 h-5 text-purple-500" />;
    case 'verification': return <Mail className="w-5 h-5 text-red-500" />;
    default: return <Info className="w-5 h-5 text-slate-500" />;
  }
};

const UpdatesView: React.FC<UpdatesViewProps> = ({ updates, onMarkAsRead, onMarkAllAsRead, onBack }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans"
        >
            {/* Premium Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all active:scale-90"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">System Mailbox</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Notifications</p>
                    </div>
                </div>
                
                {updates.some(n => n.status === 'unread') && (
                    <button 
                        onClick={onMarkAllAsRead}
                        className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark All Read
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {updates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
                            <div className="relative w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 border border-slate-50">
                                <Mail className="w-10 h-10" />
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">Your Mailbox is Empty</h3>
                        <p className="text-sm text-slate-400 max-w-[200px] font-medium">We'll notify you here about your account activity and rewards.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {updates.map((update, i) => (
                                <motion.div 
                                    key={update.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => onMarkAsRead(update.id)}
                                    className={`group relative p-5 rounded-[2rem] border transition-all duration-300 cursor-pointer ${
                                        update.status === 'unread' 
                                            ? 'bg-white border-amber-100 shadow-lg shadow-amber-500/5' 
                                            : 'bg-slate-50/50 border-transparent opacity-70 hover:opacity-100 hover:bg-white hover:border-slate-100'
                                    }`}
                                >
                                    {update.status === 'unread' && (
                                        <div className="absolute top-5 right-5 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"></div>
                                    )}

                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                            update.status === 'unread' ? 'bg-amber-50' : 'bg-white'
                                        }`}>
                                            {getIcon(update.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className={`text-sm font-black truncate pr-4 ${
                                                    update.status === 'unread' ? 'text-slate-900' : 'text-slate-600'
                                                }`}>
                                                    {update.title}
                                                </h4>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 shrink-0">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            
                                            <p className={`text-xs leading-relaxed mb-3 ${
                                                update.status === 'unread' ? 'text-slate-700 font-medium' : 'text-slate-500'
                                            }`}>
                                                {update.message}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                        update.type === 'activation' ? 'bg-emerald-100 text-emerald-700' :
                                                        update.type === 'withdrawal' ? 'bg-purple-100 text-purple-700' :
                                                        update.type === 'deposit' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {update.type}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-300">
                                                        {new Date(update.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Footer Tip */}
            {updates.length > 0 && (
                <div className="p-6 bg-white border-t border-slate-100">
                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 leading-tight">
                            Tip: Keep your mailbox clean by marking notifications as read. Important updates will always be highlighted.
                        </p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default UpdatesView;
