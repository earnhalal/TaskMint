import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, ArrowRight, ArrowDownCircle, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface Account {
  id: string;
  title: string;
  number: string;
  method: string;
}

interface WithdrawTabProps {
  balance: number;
  history: any[];
  onWithdraw: (amount: number, method: string) => void;
  hasPin: boolean;
  onSetupPin: () => void;
  onEditAccount: () => void;
  accounts: Account[];
}

const CardChip = () => (
    <div className="w-11 h-8 rounded-md relative overflow-hidden shadow-sm bg-gradient-to-br from-[#fcd34d] via-[#d97706] to-[#b45309]">
        <div className="absolute inset-0 border-[0.5px] border-[#78350f] opacity-60">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#78350f]"></div>
            <div className="absolute top-0 left-1/3 w-[1px] h-full bg-[#78350f]"></div>
            <div className="absolute top-0 right-1/3 w-[1px] h-full bg-[#78350f]"></div>
            <div className="absolute top-1/2 left-1/2 w-3 h-4 border border-[#78350f] rounded-sm -translate-x-1/2 -translate-y-1/2 bg-[#fbbf24]/30"></div>
        </div>
    </div>
);

export default function WithdrawTab({ balance, history, onWithdraw, hasPin, onSetupPin, onEditAccount, accounts }: WithdrawTabProps) {
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [error, setError] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const handleWithdraw = () => {
    if (!selectedAccount) {
      setError('Please select or add a withdrawal account');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val < 1000) {
      setError('Minimum withdrawal is Rs. 1000');
      return;
    }
    if (val > balance) {
      setError('Insufficient balance');
      return;
    }
    onWithdraw(val, selectedAccount.method);
    setAmount('');
    setError('');
    setShowSuccess(true);
  };

  const displayHistory = history.map(h => ({
      id: h.id,
      title: `${h.method} Withdrawal`,
      subtitle: h.status.toLowerCase() === 'approved' && h.approvedAt 
        ? `Approved: ${new Date(h.approvedAt).toLocaleString()}` 
        : h.timestamp 
          ? new Date(h.timestamp).toLocaleDateString() 
          : h.date 
            ? new Date(h.date).toLocaleDateString() 
            : 'Recently',
      amount: `-${h.amount}`,
      status: h.status.toUpperCase(),
      type: 'withdraw'
    }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 space-y-8 px-4 pt-4"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-2xl text-slate-900">Withdraw Funds</h2>
            <p className="text-xs text-slate-500 font-medium">Select an account to proceed</p>
          </div>
          <button 
            onClick={onEditAccount}
            className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
          </button>
      </div>

      {/* PREMIUM CARDS SLIDER */}
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
        {accounts.length > 0 ? (
          accounts.map((acc) => (
            <motion.div 
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              whileTap={{ scale: 0.98 }}
              className={`relative min-w-[280px] sm:min-w-[320px] aspect-[1.586/1] rounded-[24px] p-6 shadow-xl overflow-hidden cursor-pointer transition-all snap-center border-2 ${
                selectedAccountId === acc.id ? 'border-amber-500 scale-105 z-10' : 'border-transparent opacity-60 grayscale-[0.5]'
              } ${
                acc.method === 'easypaisa' ? 'bg-gradient-to-br from-emerald-600 to-emerald-900' : 
                acc.method === 'jazzcash' ? 'bg-gradient-to-br from-red-600 to-red-900' : 
                'bg-gradient-to-br from-slate-800 to-slate-950'
              }`}
            >
              {/* Card Textures & Glow */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between text-white">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-black text-lg tracking-tighter italic opacity-90">TaskMint</span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-60">Premium Withdrawal</span>
                  </div>
                  {selectedAccountId === acc.id && (
                    <div className="bg-amber-500 text-slate-900 p-1 rounded-full shadow-lg">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <CardChip />
                  <div className="flex flex-col">
                    <p className="text-lg font-mono font-bold tracking-[0.15em] drop-shadow-md">
                      •••• •••• •••• {acc.number.slice(-4)}
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-1">{acc.method}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest mb-1">Account Holder</p>
                    <p className="text-xs font-black uppercase tracking-wider">{acc.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-[10px] font-black text-amber-400">ACTIVE</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div 
            onClick={onEditAccount}
            className="w-full aspect-[1.586/1] rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold">Add Withdrawal Account</p>
          </div>
        )}
      </div>

      {/* Amount Input Section */}
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
            
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-1">Withdrawal Amount</label>
            
            <div className="relative flex items-center mb-8">
                <span className="absolute left-0 text-slate-900 font-black text-4xl">Rs</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(''); }}
                    placeholder="0"
                    className="w-full bg-transparent border-b-2 border-slate-100 rounded-none py-4 pl-16 pr-4 text-slate-900 font-black text-5xl focus:border-amber-500 focus:outline-none transition-all placeholder:text-slate-100"
                />
            </div>

            <div className="flex items-center gap-2 mb-8">
              <div className={`w-2 h-2 rounded-full ${parseFloat(amount) >= 1000 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Minimum Withdrawal: Rs 1,000</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="flex items-center gap-2 text-red-500 mb-6 bg-red-50 p-3 rounded-xl border border-red-100"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold">{error}</span>
              </motion.div>
            )}
            
            <button 
                onClick={handleWithdraw}
                disabled={!selectedAccount || parseFloat(amount) < 1000}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
            >
                Confirm Withdrawal <ArrowRight className="w-5 h-5" />
            </button>
        </div>

        {/* History Section */}
        <div className="pt-4">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="font-black text-xl text-slate-900">Recent Activity</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Withdrawals</span>
            </div>
            
            <div className="space-y-4">
            {displayHistory.length > 0 ? displayHistory.map((item, i) => (
                <div key={item.id ? `withdraw-${item.id}` : `withdraw-idx-${i}`} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center shrink-0 border border-slate-100">
                        <ArrowDownCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.subtitle}</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="font-black text-base text-slate-900">
                        {item.amount}
                      </div>
                      <div className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg mt-1 inline-block ${
                        item.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                        (item.status === 'APPROVED' || item.status === 'COMPLETED') ? 'bg-emerald-50 text-emerald-600' : 
                        item.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </div>
                  </div>
                </div>
            )) : (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-medium">No recent withdrawal activity.</p>
              </div>
            )}
            </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 relative z-10" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2">Withdrawal Placed!</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                Apka withdrawal lag gya ha. It will be processed within 1-24 hours.
              </p>

              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
              >
                Great, Thanks!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
