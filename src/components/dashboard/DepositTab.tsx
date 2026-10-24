import React, { useState, useMemo } from 'react';
import PaymentQrCard from '../PaymentQrCard';
import { motion } from 'motion/react';
import { ClipboardList, CheckCircle2, Copy, Wallet, ArrowRight, ShieldCheck } from 'lucide-react';

type DepositMethod = 'EasyPaisa';

interface Transaction {
 id: string;
 type: string;
 amount: number;
 date: any;
 status: string;
 description: string;
}

interface DepositTabProps {
 onDeposit: (amount: number, method: DepositMethod, transactionId: string, type?: 'activation' | 'regular') => Promise<void>;
 transactions: Transaction[];
 userCountry?: string;
 initialType?: 'activation' | 'regular';
 appSettings: {
 activationFee: number;
 paymentNumber: string;
 paymentName: string;
 referralBonusBasic?: number;
 };
 userName: string;
}

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
 if (!status) return null;
 
 const styles: Record<string, string> = {
 'Pending': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
 'Approved': 'bg-green-500/10 text-green-400 border-green-500/20',
 'Completed': 'bg-green-500/10 text-green-400 border-green-500/20',
 'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
 'Failed': 'bg-red-500/10 text-red-400 border-red-500/20',
 };
 const appliedStyle = styles[status] || 'bg-white/10 text-zinc-100 border-white/10';
 
 return (
 <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wide ${appliedStyle}`}>
 {status}
 </span>
 );
}

const EasyPaisaIcon = ({ className }: { className?: string }) => (
 <div className={`bg-emerald-500 text-white px-2 py-0.5 rounded text-sm font-bold tracking-tight ${className}`}>
 easypaisa
 </div>
);

export default function DepositTab({ onDeposit, transactions, userCountry = 'Pakistan', initialType = 'regular', appSettings, userName }: DepositTabProps) {
 const [type, setType] = useState<'activation' | 'regular'>(initialType);
 const [amount, setAmount] = useState(initialType === 'activation' ? appSettings.activationFee.toString() : '');
 const [method, setMethod] = useState<DepositMethod>('EasyPaisa');
 const [message, setMessage] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);
 
 const depositHistory = useMemo(() => {
 return transactions
 .filter(tx => tx.type === 'PENDING_DEPOSIT' || tx.type === 'DEPOSIT' || tx.type === 'activation' || tx.type === 'regular')
 .sort((a, b) => {
 const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
 const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
 return dateB - dateA;
 });
 }, [transactions]);

 const handleWhatsAppClick = async (e: React.FormEvent) => {
 e.preventDefault();
 const numAmount = parseFloat(amount);
 if (isNaN(numAmount) || numAmount <= 0) {
 setMessage('Please enter a valid amount.');
 return;
 }
 if (type === 'activation' && numAmount !== appSettings.activationFee) {
 setMessage(`Activation fee must be exactly Rs ${appSettings.activationFee}.`);
 return;
 }
 setIsSubmitting(true);
 try {
 // Construct WhatsApp message
 const whatsappNumber = (appSettings as any)?.whatsappNumber || "923338739929";
 const message = `🌟 *TASKMINT OFFICIAL* 🌟\n\n*Hi Admin!* 👋\nMera naam *${userName || 'User'}* hai. ✨\n\nMaine *Rs. ${numAmount}* Deposit karna hai via *${method}*. ✅\nYe raha mera *Payment Screenshot* as a proof. 📸\n\n*Please meri deposit request check kar dein!* 🙏🔥\n\n_Sent via TaskMint App_`;
 const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
 
 await onDeposit(numAmount, method, 'Sent via WhatsApp', type);
 
 window.open(whatsappUrl, '_blank');
 setAmount(type === 'activation' ? appSettings.activationFee.toString() : '');
 setMessage('Redirecting to WhatsApp...');
 setTimeout(() => setMessage(''), 5000);
 } catch (error: any) {
 console.error("[DEPOSIT_VIEW_FAILURE] The deposit operation failed:", error);
 setMessage(error.message || "An unexpected error occurred.");
 } finally {
 setIsSubmitting(false);
 }
 };

 const accountDetails = {
 EasyPaisa: { title: appSettings.paymentName, number: appSettings.paymentNumber, icon: <EasyPaisaIcon className="scale-150" /> }
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="pb-28 space-y-5"
 >
 {/* Header */}
 <div className="px-1">
 <h2 className="text-2xl font-black text-white tracking-tight">
 {type === 'activation' ? 'Activate Account' : 'Deposit Funds'}
 </h2>
 <p className="text-xs font-semibold text-zinc-400 mt-1">
 {type === 'activation'
 ? `Pay the one-time Rs. ${appSettings.activationFee} joining fee to unlock all earning features.`
 : 'Add money to your TaskMint wallet via EasyPaisa.'}
 </p>
 </div>

 {type === 'activation' && (
 <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3.5">
 <span className="flex items-center gap-2 text-xs font-bold text-emerald-300">
 <ShieldCheck className="w-4 h-4" /> Joining fee required
 </span>
 <span className="text-lg font-black text-white">Rs. {appSettings.activationFee}</span>
 </div>
 )}

 {/* Step 1 — payment account */}
 <div className="bg-[#15181D] border border-white/5 rounded-3xl p-5">
 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.18em] mb-4">Step 1 — Send payment here</p>

 <div className="flex items-center gap-3 bg-white/5 border border-emerald-500/30 rounded-2xl px-4 py-3.5">
 <span className="w-10 h-10 rounded-xl bg-[#0B0D10] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
 <EasyPaisaIcon />
 </span>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-extrabold text-white leading-tight">EasyPaisa</p>
 <p className="text-[11px] text-zinc-400 font-semibold">Verified payment account</p>
 </div>
 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
 </div>

 <div className="mt-4 bg-[#0B0D10] border border-white/5 rounded-2xl p-4 space-y-4">
 <div>
 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Account Title</p>
 <p className="text-base font-extrabold text-white">{accountDetails[method].title}</p>
 </div>
 <div className="pt-3 border-t border-white/5 flex items-end justify-between gap-3">
 <div>
 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Account Number</p>
 <p className="text-2xl font-black text-emerald-400 tracking-tight">{accountDetails[method].number}</p>
 </div>
 <button
 onClick={() => { navigator.clipboard.writeText(accountDetails[method].number); alert('Account number copied!'); }}
 className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-3 py-2.5 rounded-xl active:scale-95 transition shrink-0"
 >
 <Copy className="w-3.5 h-3.5" /> COPY
 </button>
 </div>
 </div>

 {userCountry !== 'Pakistan' && (
 <p className="text-[11px] font-semibold text-zinc-500 mt-3">USDT (Binance) deposits for international users — coming soon.</p>
 )}
 </div>

 {/* EasyPaisa QR — scanned with the EasyPaisa app; for activation
     deposits the caption pins the exact joining fee */}
 <PaymentQrCard amount={type === 'activation' ? appSettings.activationFee : undefined} />

 {/* Step 2 — amount + submit */}
 <div className="bg-[#15181D] border border-white/5 rounded-3xl p-5">
 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.18em] mb-4">Step 2 — Enter amount &amp; confirm</p>
 <form onSubmit={handleWhatsAppClick} className="space-y-4">
 <div>
 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.18em]">Amount (PKR)</label>
 <div className="flex items-center gap-2 mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 focus-within:border-emerald-500/50 transition">
 <span className="text-sm font-black text-zinc-400">Rs.</span>
 <input
 type="number"
 value={amount}
 onChange={e => setAmount(e.target.value)}
 className="w-full bg-transparent py-4 font-black text-white text-xl focus:outline-none placeholder:text-zinc-600"
 placeholder="0"
 required
 />
 </div>
 {type === 'activation' && (
 <p className="text-[11px] font-semibold text-zinc-500 mt-2">Amount is fixed at the joining fee: Rs. {appSettings.activationFee}</p>
 )}
 </div>

 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full h-12 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition"
 >
 {isSubmitting ? (
 <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
 ) : (
 <>Submit &amp; Send Proof on WhatsApp <ArrowRight className="w-4 h-4" /></>
 )}
 </button>
 <p className="text-[11px] font-semibold text-zinc-500 text-center leading-relaxed">
 After submitting, WhatsApp opens — send your payment screenshot there. Your deposit is credited after admin verification.
 </p>

 {message && (
 <div className={`p-3.5 rounded-xl border text-center text-[11px] font-bold ${message.includes('Redirecting') ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
 {message}
 </div>
 )}
 </form>
 </div>

 {/* History */}
 <div className="bg-[#15181D] border border-white/5 rounded-3xl p-5">
 <div className="flex items-center gap-2.5 mb-4">
 <span className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
 <ClipboardList className="w-4.5 h-4.5 text-emerald-400" />
 </span>
 <div>
 <h3 className="text-sm font-extrabold text-white leading-tight">Deposit History</h3>
 <p className="text-[11px] text-zinc-500 font-semibold">Your recent deposit requests</p>
 </div>
 </div>
 <div className="space-y-2.5">
 {depositHistory.length > 0 ? (
 depositHistory.map((tx, i) => (
 <div key={tx.id || i} className="flex items-center justify-between gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3">
 <div className="flex items-center gap-3 min-w-0">
 <span className="w-9 h-9 rounded-xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
 <Wallet className="w-4 h-4" />
 </span>
 <div className="min-w-0">
 <p className="text-xs font-bold text-white truncate">{tx.description}</p>
 <p className="text-[10px] text-zinc-500 font-semibold">
 {new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>
 <div className="text-right shrink-0">
 <p className="text-sm font-black text-white">+ Rs. {tx.amount.toLocaleString()}</p>
 <StatusBadge status={tx.status} />
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-8">
 <Wallet className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
 <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">No deposits yet</p>
 </div>
 )}
 </div>
 </div>
 </motion.div>

 );
}
