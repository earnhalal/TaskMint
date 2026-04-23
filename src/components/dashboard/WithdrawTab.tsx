import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, ArrowRight, ArrowDownCircle, Sparkles, CheckCircle2, AlertCircle, Lock, Calendar, TrendingUp, X, CreditCard, Landmark, ArrowUpRight, History, ShieldCheck, Zap } from 'lucide-react';

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
  manualWithdrawUnlock?: boolean;
  isPartner?: boolean;
}

const CardChip = () => (
    <div className="w-10 h-7 rounded-md relative overflow-hidden shadow-inner bg-gradient-to-br from-[#fcd34d] via-[#d97706] to-[#b45309]">
        <div className="absolute inset-0 border-[0.5px] border-[#78350f]/30">
            <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-[#78350f]/20"></div>
            <div className="absolute top-0 left-1/3 w-[0.5px] h-full bg-[#78350f]/20"></div>
            <div className="absolute top-1/2 left-1/2 w-2.5 h-3 border border-[#78350f]/20 rounded-[1px] -translate-x-1/2 -translate-y-1/2 bg-[#fbbf24]/20"></div>
        </div>
    </div>
);

export default function WithdrawTab({ balance, history, onWithdraw, hasPin, onSetupPin, onEditAccount, accounts, manualWithdrawUnlock = false, isPartner = false }: WithdrawTabProps) {
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAmountVisible, setIsAmountVisible] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  const minWithdrawal = 500;

  const windowInfo = useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    const isWindow1 = day >= 1 && day <= 3;
    const isWindow2 = day >= 16 && day <= 18;
    const isOpen = isWindow1 || isWindow2 || manualWithdrawUnlock || isPartner;

    let nextWindowText = "";
    if (manualWithdrawUnlock) {
      nextWindowText = "Admin Access Granted";
    } else if (isPartner) {
      nextWindowText = "Instant Partner Access Active";
    } else if (day <= 3) {
      nextWindowText = "Window: 1st - 3rd " + now.toLocaleString('default', { month: 'short' });
    } else if (day <= 18) {
      nextWindowText = "Window: 16th - 18th " + now.toLocaleString('default', { month: 'short' });
    } else {
      const nextMonth = new Date(year, month + 1, 1);
      nextWindowText = "Window: 1st - 3rd " + nextMonth.toLocaleString('default', { month: 'short' });
    }

    return { isOpen, nextWindowText };
  }, [manualWithdrawUnlock]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const handleWithdraw = () => {
    if (!windowInfo.isOpen) {
      setError('Withdrawal window is currenty locked.');
      return;
    }
    if (!selectedAccount) {
      setError('Please select a destination account');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val < minWithdrawal) {
      setError(`Minimum withdrawal is Rs. ${minWithdrawal}`);
      return;
    }
    if (val > balance) {
      setError('Insufficient Reserve Balance');
      return;
    }
    onWithdraw(val, selectedAccount.method);
    setAmount('');
    setError('');
    setShowSuccess(true);
  };

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);

  const displayHistory = history.map(h => {
      const dateVal = h.approvedAt 
        ? (h.approvedAt.toDate ? h.approvedAt.toDate() : new Date(h.approvedAt))
        : (h.timestamp 
          ? (h.timestamp.toDate ? h.timestamp.toDate() : new Date(h.timestamp))
          : (h.date ? new Date(h.date) : new Date()));

      return {
        id: h.id,
        title: `${h.method} Payout`,
        subtitle: h.status.toLowerCase() === 'approved' && h.approvedAt 
          ? `Cleared: ${dateVal.toLocaleDateString()}` 
          : `Requested: ${dateVal.toLocaleDateString()}`,
        amount: `Rs. ${h.amount}`,
        status: h.status.toUpperCase(),
        type: 'withdraw',
        raw: h
      };
    });

  const progress = Math.min((balance / minWithdrawal) * 100, 100);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-32 space-y-8 px-4 pt-6 max-w-lg mx-auto"
    >
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-72 h-72 bg-emerald-500/5 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[30%] left-[-10%] w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Modern Top Header */}
      <div className="relative z-10 flex items-center justify-between px-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
              <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-[0.4em]">Withdrawal Protocol</p>
            </div>
            <h2 className="font-black text-3xl text-slate-900 tracking-tighter leading-none italic uppercase">Cash Flow</h2>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEditAccount}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-xl hover:border-emerald-500/30 transition-all group"
          >
            <Sparkles className="w-5 h-5 text-amber-500 group-hover:animate-pulse" />
          </motion.button>
      </div>

      {/* Bento-Style Status Card */}
      <div className="relative z-10 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-[36px] blur-xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        
        <div className="relative bg-[#0A0A0B] rounded-[32px] p-7 overflow-hidden border border-white/5 shadow-2xl">
           <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-[80px]"></div>
           
           <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                    <div className={`w-1.5 h-1.5 rounded-full ${windowInfo.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/70">
                      {windowInfo.isOpen ? 'Network Online' : 'Network Standby'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                    <Zap className="w-3 h-3 fill-emerald-400" />
                    24h Payouts
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">{windowInfo.isOpen ? 'Transfer Available' : 'Upcoming Window'}</p>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">
                  {windowInfo.nextWindowText}
                </h3>
                {isPartner && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 w-fit px-2 py-0.5 rounded-lg border border-amber-500/20">
                    <Zap className="w-2.5 h-2.5 text-amber-500 animate-pulse fill-amber-500" />
                    <span className="text-[8px] font-black uppercase text-amber-500 tracking-wider">Instant Payout Active</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Net Reserves</p>
                  <p className="text-xl font-black text-white italic">Rs {balance.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Minimum Cap</p>
                  <p className="text-xl font-black text-white italic">Rs {minWithdrawal}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5 backdrop-blur-sm">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full rounded-full ${progress >= 100 ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                  />
                </div>
                <div className="flex justify-between items-center px-1">
                   <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest italic leading-none">
                     {progress >= 100 ? 'Threshold Reached' : `Rs ${minWithdrawal - balance} to unlock`}
                   </p>
                   <p className="text-[8px] font-black text-white/70 uppercase tracking-[0.2em]">{Math.floor(progress)}% AUTH</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Destination Selection */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Select Destination</p>
          <span className="text-[9px] font-bold text-slate-300 italic">{accounts.length} Accounts Connected</span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
          {accounts.length > 0 ? (
            accounts.map((acc) => (
              <motion.div 
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                whileTap={{ scale: 0.98 }}
                className={`relative min-w-[300px] aspect-[1.6/1] rounded-[28px] p-7 shadow-2xl overflow-hidden cursor-pointer transition-all snap-center border-2 ${
                  selectedAccountId === acc.id 
                  ? 'border-emerald-500 ring-4 ring-emerald-500/10 scale-105 z-10' 
                  : 'border-white/5 opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
                } ${
                  acc.method === 'easypaisa' ? 'bg-gradient-to-br from-[#121212] via-[#0D2D1B] to-[#121212]' : 
                  acc.method === 'jazzcash' ? 'bg-gradient-to-br from-[#121212] via-[#3D0C0C] to-[#121212]' : 
                  'bg-gradient-to-br from-[#121212] via-[#1E1E2E] to-[#121212]'
                }`}
              >
                {/* Visual Textures */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-[60px] -mr-20 -mt-20"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-black text-xl italic tracking-tighter text-white/90">TRANSACT</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1 h-1 rounded-full ${acc.method === 'easypaisa' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">{acc.method}</span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                       {acc.method === 'easypaisa' ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <ShieldCheck className="w-5 h-5 text-red-500" />}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Account Number</p>
                    <p className="text-xl font-mono font-black text-white tracking-[0.1em]">
                      {acc.number}
                    </p>
                  </div>

                  <div className="flex justify-between items-end border-t border-white/5 pt-4">
                        <div className="flex flex-col">
                          <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-0.5">Account Label</p>
                          <p className="text-[11px] font-black text-white uppercase tracking-wider italic truncate max-w-[150px]">{acc.title}</p>
                        </div>
                    <div className="text-right">
                       <CardChip />
                    </div>
                  </div>
                </div>

                {selectedAccountId === acc.id && (
                  <motion.div 
                    layoutId="acc-check"
                    className="absolute top-4 right-4 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </motion.div>
            ))
          ) : (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={onEditAccount}
              className="w-full aspect-[1.6/1] rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4 text-slate-400 group cursor-pointer transition-all"
            >
              <div className="w-16 h-16 rounded-[22px] bg-white shadow-xl border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7 text-emerald-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-black text-slate-900 uppercase tracking-tighter italic">Register Node</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Add Payout Method</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Futuristic Amount Engine - Compact Version */}
      <div className="relative z-10 px-1">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl relative overflow-hidden group/input">
            {!isCardExpanded ? (
               <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setIsCardExpanded(true)}
                className="w-full p-8 flex items-center justify-between group hover:bg-slate-50 transition-all font-black"
               >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600">
                      <Zap className="w-6 h-6 fill-emerald-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Status</p>
                      <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Enter Amount</h4>
                    </div>
                 </div>
                 <ArrowRight className="w-6 h-6 text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
               </motion.button>
            ) : (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               className="p-6 relative"
             >
                <button 
                  onClick={() => setIsCardExpanded(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-300 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute top-0 right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
                
                <div className="flex items-center justify-between mb-4">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Amount</label>
                   <div className="flex items-center gap-2">
                     <button 
                      onClick={() => setIsAmountVisible(!isAmountVisible)}
                      className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                     >
                       {isAmountVisible ? <Lock className="w-3 h-3 text-slate-300" /> : <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                     </button>
                     {parseFloat(amount) > 0 && (
                       <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md tracking-tighter">Verified</span>
                     )}
                   </div>
                </div>
                
                <div className="relative flex items-center mb-6 border-b border-slate-100 pb-2">
                    <span className="text-slate-900 font-black text-xl italic mr-3">RS</span>
                    <input
                        type={isAmountVisible ? "number" : "password"}
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value); setError(''); }}
                        placeholder="0.00"
                        className="w-full bg-transparent rounded-none text-slate-900 font-black text-4xl focus:outline-none placeholder:text-slate-100 tracking-tighter"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className="bg-slate-50/50 py-2.5 rounded-2xl border border-slate-100/50 flex flex-col items-center">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Fee</p>
                      <p className="text-xs font-black text-slate-900 italic">Rs 0</p>
                   </div>
                   <div className="bg-slate-50/50 py-2.5 rounded-2xl border border-slate-100/50 flex flex-col items-center">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Method</p>
                      <p className="text-xs font-black text-emerald-600 italic">Instant</p>
                   </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex items-center gap-2 text-red-600 mb-4 bg-red-50 p-3 rounded-xl border border-red-100"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{error}</span>
                  </motion.div>
                )}
                
                <motion.button 
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleWithdraw}
                    disabled={!selectedAccount || parseFloat(amount) < minWithdrawal || !windowInfo.isOpen}
                    className="relative w-full h-12 bg-[#0A0A0B] disabled:bg-slate-100 disabled:cursor-not-allowed group/btn overflow-hidden rounded-[18px] transition-all shadow-lg"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <span className="text-xs font-black text-white group-disabled:text-slate-400 uppercase tracking-[0.15em] italic">
                        {windowInfo.isOpen ? 'Execute Payout' : 'Window Locked'}
                      </span>
                      {windowInfo.isOpen ? <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover/btn:text-white" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                </motion.button>

                {!windowInfo.isOpen && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50/50 rounded-xl border border-amber-100/30">
                    <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                    <p className="text-[9px] font-bold text-amber-700 uppercase tracking-tight italic">
                      Next Update: {windowInfo.nextWindowText.split(':')[1]} tareek.
                    </p>
                  </div>
                )}
             </motion.div>
            )}
        </div>

        {/* Action History Feed */}
        <div className="pt-10">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                <h3 className="font-black text-2xl text-slate-900 tracking-tighter italic uppercase">History</h3>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-3 py-1 rounded-full">Feed</span>
            </div>
            
            <div className="space-y-3">
            {displayHistory.length > 0 ? displayHistory.slice(0, 8).map((item, i) => (
                <motion.div 
                  key={item.id ? `withdraw-${item.id}` : `withdraw-idx-${i}`} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedWithdrawal(item.raw)}
                  className="group bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md hover:border-emerald-500/10 transition-all cursor-pointer relative overflow-hidden h-16"
                >
                  <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-[11px] uppercase italic tracking-tight leading-none mb-1">{item.title}</h4>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">{item.subtitle}</p>
                      </div>
                  </div>
                  <div className="text-right relative z-10">
                      <div className="font-black text-sm text-slate-900 italic tracking-tighter leading-none mb-1">
                        {item.amount}
                      </div>
                      <div className={`text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${
                        item.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        (item.status === 'APPROVED' || item.status === 'COMPLETED') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        item.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {item.status}
                      </div>
                  </div>
                </motion.div>
            )) : (
              <div className="text-center py-16 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <History className="w-6 h-6 text-slate-200" />
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No History</p>
              </div>
            )}
            </div>
        </div>
      </div>

      {/* Futuristic Receipt Modal */}
      <AnimatePresence>
        {selectedWithdrawal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-[#0A0A0B]/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white rounded-[44px] p-10 w-full max-w-sm shadow-2xl relative border border-white/10"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-[#0A0A0B]"></div>
              
              <button 
                onClick={() => setSelectedWithdrawal(null)} 
                className="absolute top-8 right-8 p-2 bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <History className="w-8 h-8 text-slate-900" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 italic uppercase">Transaction Log</h3>
              </div>
              
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Status</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    selectedWithdrawal.status === 'Pending' ? 'text-amber-500' : 
                    (selectedWithdrawal.status === 'Approved' || selectedWithdrawal.status === 'Completed') ? 'text-emerald-500' : 
                    'text-red-500'
                  }`}>{selectedWithdrawal.status}</span>
                </div>

                {selectedWithdrawal.status === 'Rejected' && selectedWithdrawal.rejectionReason && (
                  <div className="bg-red-50 p-5 rounded-3xl border border-red-100">
                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block mb-2 leading-none">Security Flag Reason:</span>
                    <p className="text-xs font-bold text-red-900 italic leading-tight">{selectedWithdrawal.rejectionReason}</p>
                  </div>
                )}

                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Amount</span>
                  <span className="text-[11px] font-black text-slate-900 italic">Rs {selectedWithdrawal.amount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Target Account</span>
                  <span className="text-[11px] font-black text-slate-900 uppercase italic leading-none">{selectedWithdrawal.method}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Date</span>
                  <span className="text-[11px] font-black text-slate-900 italic leading-none">{new Date(selectedWithdrawal.date).toLocaleDateString()}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedWithdrawal(null)}
                className="w-full mt-10 p-5 bg-[#0A0A0B] text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] italic shadow-xl shadow-slate-900/10"
              >
                Close Receipt
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-[#0A0A0B]/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, rotate: 5 }}
              className="bg-white rounded-[50px] p-10 w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"></div>
              
              <div className="w-24 h-24 bg-emerald-50 rounded-[30px] flex items-center justify-center mx-auto mb-8 relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-[30px] animate-ping opacity-30"></div>
                <Zap className="w-12 h-12 text-emerald-500 fill-emerald-500 relative z-10" />
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-3 italic tracking-tighter leading-none uppercase">Execution Successful</h3>
              <p className="text-xs text-slate-400 font-bold mb-10 leading-relaxed uppercase tracking-tight">
                Payout request initiated. Your money will be sent within <span className="text-emerald-500">24 hours</span>.
              </p>

              <button 
                onClick={() => setShowSuccess(false)}
                className="group relative w-full h-16 bg-[#0A0A0B] overflow-hidden rounded-[24px] shadow-2xl transition-all active:scale-95"
              >
                <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <span className="relative z-10 font-black text-white text-xs uppercase tracking-[0.2em] italic">Acknowledge</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

