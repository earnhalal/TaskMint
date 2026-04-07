import React from 'react';
import { 
  Gamepad2, 
  Mail, 
  CheckCircle, 
  Wallet, 
  ShieldCheck, 
  Info,
  ArrowRightLeft
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

const UpdatesView: React.FC<UpdatesViewProps> = ({ updates, onMarkAsRead, onMarkAllAsRead }) => {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto text-gray-800 animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">System Mailbox</h2>
                <button onClick={onMarkAllAsRead} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Mark all as read</button>
            </div>
            {updates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Mail className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Your mailbox is empty.</p>
              </div>
            ) : (
                <div className="space-y-4">
                    {updates.map(update => (
                        <div 
                          key={update.id} 
                          onClick={() => onMarkAsRead(update.id)} 
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${update.status === 'unread' ? 'bg-emerald-50/50 border-emerald-100 shadow-sm' : 'bg-slate-50 border-transparent opacity-80 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                                    {getIcon(update.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <h3 className={`font-bold ${update.status === 'unread' ? 'text-slate-900' : 'text-slate-600'}`}>{update.title}</h3>
                                      {update.status === 'unread' && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>}
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                      {new Date(update.timestamp).toLocaleString()} • {update.type}
                                    </p>
                                </div>
                            </div>
                            <p className={`text-sm ml-11 leading-relaxed ${update.status === 'unread' ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                              {update.message}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UpdatesView;
