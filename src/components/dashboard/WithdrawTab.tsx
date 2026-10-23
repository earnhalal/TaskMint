import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, ArrowRight, ArrowDownCircle, Sparkles, CheckCircle2, AlertCircle, Lock, Calendar, TrendingUp, X, CreditCard, Landmark, ArrowUpRight, History, ShieldCheck, Zap } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

interface Account {
 id: string;
 title: string;
 number: string;
 method: string;
}

interface WithdrawTabProps {
 balance: number;
 history: any[];
 onWithdraw: (amount: number, method: string, accountName: string, accountNumber: string) => void;
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
 const { formatAmount } = useCurrency();
 const [amount, setAmount] = useState('');
 const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
 const [error, setError] = useState('');
 const [showSuccess, setShowSuccess] = useState(false);
 const [isCardExpanded, setIsCardExpanded] = useState(true); // Default to open for mobile app feel

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
 }, [manualWithdrawUnlock, isPartner]);

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
 onWithdraw(val, selectedAccount.method, selectedAccount.title, selectedAccount.number);
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
 className="pb-28 space-y-5"
 >
 {/* Header */}
 <div className="flex items-start justify-between px-1">
 <div>
 <h2 className="text-2xl font-black text-white tracking-tight">Withdraw</h2>
 <p className="text-xs font-semibold text-zinc-400 mt-1">Cash out to JazzCash, EasyPaisa or your bank.</p>
 </div>
 <button
 onClick={onEditAccount}
 className="flex items-center gap-1.5 text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-full active:scale-95 transition shrink-0"
 >
 <CreditCard className="w-3.5 h-3.5" /> Accounts
 </button>
 </div>

 {/* Balance + window status */}
 <div className="bg-[#15181D] border border-white/5 rounded-3xl p-5">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.18em]">Available Balance</p>
 <span className={`flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border ${windowInfo.isOpen ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
 <span className={`w-1.5 h-1.5 rounded-full ${windowInfo.isOpen ? 'bg-green-400' : 'bg-amber-300'}`}></span>
 {windowInfo.isOpen ? 'WINDOW OPEN' : 'WINDOW CLOSED'}
 </span>
 </div>
 <p className="text-4xl font-black text-white tracking-tight mt-2">Rs. {balance.toLocaleString()}</p>
 <div className="mt-4">
 <div className="h-2 rounded-full bg-white/10 overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${progress}%` }}
 className="h-full rounded-full bg-green-500"
 />
 </div>
 <div className="flex items-center justify-between mt-2">
 <p className="text-[11px] font-semibold text-zinc-400">
 {progress >= 100 ? 'Minimum withdrawal reached.' : `Rs. ${minWithdrawal - balance} more to reach the Rs. ${minWithdrawal} minimum.`}
 </p>
 <p className="text-[11px] font-black text-zinc-500">{Math.floor(progress)}%</p>
 </div>
 </div>
 <div className="flex items-center gap-2 mt-4 bg-white/5 border border-white/5 rounded-xl px-3.5 py-3">
 <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
 <p className="text-[11px] font-bold text-zinc-300">
 {windowInfo.isOpen ? `Payouts are being processed — ${windowInfo.nextWindowText}.` : `Next payout window: ${windowInfo.nextWindowText}. Withdrawals open on the 1st–3rd and 16th–18th of each month.`}
 </p>
 </div>
 {isPartner && (
 <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 mt-3">
 <Zap className="w-3.5 h-3.5" /> Instant partner payouts are active on your account.
 </p>
 )}
 </div>

 {/* Destination account */}
 <div>
 <div className="flex items-center justify-between px-1 mb-3">
 <h3 className="text-sm font-black text-white">Payout Account</h3>
 <span className="text-[11px] font-bold text-zinc-500">{accounts.length} saved</span>
 </div>
 <div className="space-y-2.5">
 {accounts.length > 0 ? accounts.map((acc) => (
 <button
 key={acc.id}
 onClick={() => setSelectedAccountId(acc.id)}
 className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.99] ${selectedAccountId === acc.id ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-[#15181D] border-white/5'}`}
 >
 <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${acc.method === 'easypaisa' ? 'bg-emerald-500/15 text-emerald-400' : acc.method === 'jazzcash' ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-zinc-300'}`}>
 {acc.method === 'bank' ? <Landmark className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
 </span>
 <span className="flex-1 min-w-0">
 <span className="block text-sm font-extrabold text-white leading-tight truncate">{acc.title}</span>
 <span className="block text-[11px] text-zinc-400 font-semibold capitalize">{acc.method} · {acc.number}</span>
 </span>
 {selectedAccountId === acc.id && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
 </button>
 )) : (
 <button
 onClick={onEditAccount}
 className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-5 text-left active:scale-[0.99] transition"
 >
 <span className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
 <CreditCard className="w-5 h-5 text-emerald-400" />
 </span>
 <span>
 <span className="block text-sm font-extrabold text-white leading-tight">No payout account added</span>
 <span className="block text-[11px] text-zinc-400 font-semibold">Tap to add your JazzCash, EasyPaisa or bank account</span>
 </span>
 </button>
 )}
 </div>
 </div>

 {/* Amount */}
 <div className="bg-[#15181D] border border-white/5 rounded-3xl p-5">
 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.18em]">Amount (PKR)</label>
 <div className="flex items-center gap-2 mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 focus-within:border-emerald-500/50 transition">
 <span className="text-sm font-black text-zinc-400">Rs.</span>
 <input
 type="number"
 value={amount}
 onChange={(e) => { setAmount(e.target.value); setError(''); }}
 placeholder="0"
 className="w-full bg-transparent py-4 font-black text-white text-xl focus:outline-none placeholder:text-zinc-600"
 />
 </div>

 <div className="grid grid-cols-2 gap-2.5 mt-3">
 <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-center">
 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Fee (5%)</p>
 <p className="text-sm font-black text-red-400 mt-0.5">Rs. {(parseFloat(amount) * 0.05 || 0).toFixed(0)}</p>
 </div>
 <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-center">
 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">You Receive</p>
 <p className="text-sm font-black text-emerald-400 mt-0.5">Rs. {(parseFloat(amount) * 0.95 || 0).toFixed(0)}</p>
 </div>
 </div>

 {error && (
 <div className="flex items-center gap-2 mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-3">
 <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
 <span className="text-[11px] font-bold text-red-300">{error}</span>
 </div>
 )}

 <button
 onClick={handleWithdraw}
 disabled={!selectedAccount || parseFloat(amount) < minWithdrawal || !windowInfo.isOpen}
 className="w-full h-12 mt-4 bg-green-500 hover:bg-green-400 disabled:bg-white/10 disabled:text-zinc-500 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition"
 >
 {windowInfo.isOpen ? <>Request Withdrawal <ArrowUpRight className="w-4 h-4" /></> : <><Lock className="w-4 h-4" /> Window Closed</>}
 </button>
 <p className="text-[11px] font-semibold text-zinc-500 text-center mt-3">Approved withdrawals are paid within 24 hours.</p>
 </div>

 {/* History */}
 <div>
 <div className="flex items-center gap-2 px-1 mb-3">
 <History className="w-4 h-4 text-zinc-500" />
 <h3 className="text-sm font-black text-white">Withdrawal History</h3>
 </div>
 <div className="space-y-2.5">
 {displayHistory.length > 0 ? displayHistory.slice(0, 8).map((item, i) => (
 <button
 key={item.id ? `withdraw-${item.id}` : `withdraw-idx-${i}`}
 onClick={() => setSelectedWithdrawal(item.raw)}
 className="w-full flex items-center justify-between gap-3 bg-[#15181D] border border-white/5 rounded-2xl px-4 py-3.5 text-left active:scale-[0.99] transition"
 >
 <div className="flex items-center gap-3 min-w-0">
 <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
 <History className="w-4 h-4" />
 </span>
 <div className="min-w-0">
 <p className="text-xs font-bold text-white truncate">{item.title}</p>
 <p className="text-[10px] text-zinc-500 font-semibold">{item.subtitle} · Tap for receipt</p>
 </div>
 </div>
 <div className="text-right shrink-0">
 <p className="text-sm font-black text-white">{item.amount}</p>
 <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md border mt-0.5 ${
 item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
 (item.status === 'APPROVED' || item.status === 'COMPLETED') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
 item.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-zinc-400 border-white/10'
 }`}>
 {item.status}
 </span>
 </div>
 </button>
 )) : (
 <div className="text-center py-10 bg-[#15181D] rounded-3xl border border-dashed border-white/10">
 <History className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
 <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">No withdrawals yet</p>
 </div>
 )}
 </div>
 </div>

 {/* Receipt modal */}
 <AnimatePresence>
 {selectedWithdrawal && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[200] flex items-center justify-center px-5 bg-black/80 backdrop-blur-sm"
 >
 <motion.div
 initial={{ scale: 0.92, y: 24 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.92, y: 24 }}
 className="bg-[#15181D] rounded-3xl p-6 w-full max-w-sm relative border border-white/10 max-h-[88vh] overflow-y-auto"
 >
 <button
 onClick={() => setSelectedWithdrawal(null)}
 className="absolute top-4 right-4 p-2 bg-white/5 border border-white/10 rounded-full text-zinc-400"
 >
 <X className="w-4 h-4" />
 </button>

 <div className="text-center mb-6">
 <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
 selectedWithdrawal.status === 'Approved' || selectedWithdrawal.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400' :
 selectedWithdrawal.status === 'Rejected' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-300'
 }`}>
 {selectedWithdrawal.status === 'Approved' || selectedWithdrawal.status === 'Completed' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
 </div>
 <h3 className="text-xl font-black text-white">Payment Receipt</h3>
 <span className={`mt-2 inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
 selectedWithdrawal.status === 'Approved' || selectedWithdrawal.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
 selectedWithdrawal.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-300'
 }`}>
 {selectedWithdrawal.status || 'Pending'}
 </span>
 </div>

 <div className="bg-[#0B0D10] rounded-2xl border border-white/5 p-4 space-y-4">
 <div className="flex justify-between items-start border-b border-white/5 pb-3">
 <div>
 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Transaction ID</p>
 <p className="text-[11px] font-mono font-semibold text-white">{selectedWithdrawal.id?.substring(0, 12).toUpperCase() || 'TXN-PENDING'}</p>
 </div>
 <div className="text-right">
 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Date</p>
 <p className="text-[11px] font-semibold text-white">{selectedWithdrawal.date ? new Date(selectedWithdrawal.date).toLocaleDateString() : (selectedWithdrawal.timestamp ? new Date(selectedWithdrawal.timestamp?.toDate ? selectedWithdrawal.timestamp.toDate() : selectedWithdrawal.timestamp).toLocaleDateString() : 'N/A')}</p>
 </div>
 </div>
 <div className="text-center py-1">
 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Amount</p>
 <p className="text-3xl font-black text-emerald-400 tracking-tight">{formatAmount(selectedWithdrawal.amount)}</p>
 </div>
 <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/5 pt-3">
 <div>
 <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Name</p>
 <p className="text-[11px] font-semibold text-white truncate">{selectedWithdrawal.accountName || selectedWithdrawal.username || 'N/A'}</p>
 </div>
 <div>
 <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Method</p>
 <p className="text-[11px] font-semibold text-white uppercase">{selectedWithdrawal.method}</p>
 </div>
 <div>
 <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Account Number</p>
 <p className="text-[11px] font-mono font-semibold text-emerald-400">{selectedWithdrawal.accountNumber || 'N/A'}</p>
 </div>
 <div>
 <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Status</p>
 <p className="text-[11px] font-bold text-white uppercase">{selectedWithdrawal.status}</p>
 </div>
 </div>
 </div>

 <button
 onClick={() => setSelectedWithdrawal(null)}
 className="w-full mt-5 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider active:scale-[0.98] transition"
 >
 Close
 </button>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Success modal */}
 <AnimatePresence>
 {showSuccess && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[200] flex items-center justify-center px-5 bg-black/80 backdrop-blur-sm"
 >
 <motion.div
 initial={{ scale: 0.9, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.9, y: 20 }}
 className="bg-[#15181D] rounded-3xl p-7 w-full max-w-sm text-center border border-white/10"
 >
 <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
 <CheckCircle2 className="w-8 h-8 text-emerald-400" />
 </div>
 <h3 className="text-xl font-black text-white mb-2">Request Submitted</h3>
 <p className="text-xs font-semibold text-zinc-400 mb-6 leading-relaxed">
 Your withdrawal request has been received. Payment is sent within <span className="text-emerald-400 font-bold">24 hours</span> after approval.
 </p>
 <button
 onClick={() => setShowSuccess(false)}
 className="w-full h-12 bg-green-500 hover:bg-green-400 text-black rounded-xl font-black text-xs uppercase tracking-wider active:scale-[0.98] transition"
 >
 Done
 </button>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>

 );
}
