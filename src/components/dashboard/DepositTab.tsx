import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, CheckCircle2, PlusCircle, Wallet, ArrowRight } from 'lucide-react';

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
  initialType?: 'activation' | 'regular';
  appSettings: {
    activationFee: number;
    paymentNumber: string;
    paymentName: string;
    referralBonusBasic?: number;
  };
}

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
    if (!status) return null;
    
    const styles: Record<string, string> = {
        'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
        'Approved': 'bg-green-100 text-green-700 border-green-200',
        'Completed': 'bg-green-100 text-green-700 border-green-200',
        'Rejected': 'bg-red-100 text-red-700 border-red-200',
        'Failed': 'bg-red-100 text-red-700 border-red-200',
    };
    const appliedStyle = styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    
    return (
        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wide ${appliedStyle}`}>
            {status}
        </span>
    );
}

const JazzCashIcon = ({ className }: { className?: string }) => (
  <div className={`flex items-center font-bold tracking-tighter ${className}`}>
    <span className="text-red-600">jazz</span>
    <span className="text-slate-900">Cash</span>
  </div>
);

const EasyPaisaIcon = ({ className }: { className?: string }) => (
  <div className={`bg-emerald-500 text-white px-2 py-0.5 rounded text-sm font-bold tracking-tight ${className}`}>
    easypaisa
  </div>
);

export default function DepositTab({ onDeposit, transactions, initialType = 'regular', appSettings }: DepositTabProps) {
  const [type, setType] = useState<'activation' | 'regular'>(initialType);
  const [amount, setAmount] = useState(initialType === 'activation' ? appSettings.activationFee.toString() : '');
  const [transactionId, setTransactionId] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        setMessage('Please enter a valid amount.');
        return;
    }
    if (type === 'activation' && numAmount !== appSettings.activationFee) {
        setMessage(`Activation fee must be exactly Rs ${appSettings.activationFee}.`);
        return;
    }
    if (!transactionId.trim()) {
        setMessage('Please enter the transaction ID.');
        return;
    }

    setIsSubmitting(true);
    try {
        await onDeposit(numAmount, method, transactionId, type);
        setMessage(type === 'activation' 
          ? 'Activation request submitted! Verification takes 1-6 hours.' 
          : `Deposit request for ${numAmount.toFixed(2)} Rs has been submitted successfully.`);
        if (type !== 'activation') setAmount('');
        setTransactionId('');
        setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
        console.error("[DEPOSIT_VIEW_FAILURE] The deposit operation failed:", error);
        const userMessage = error.message || "An unexpected error occurred.";
        setMessage(userMessage);
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
      className="max-w-5xl mx-auto pb-24 px-4 pt-6"
    >
      {/* High-End Protocol Header */}
      <div className="bg-[#0A0B0F] rounded-[2.5rem] p-10 text-white shadow-2xl mb-10 relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full -mr-40 -mt-40 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-600/5 rounded-full -ml-20 -mb-20 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-6 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
               <Wallet className="w-3 h-3" /> Secure Gateway
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-3 italic">
              {type === 'activation' ? 'Initiate Activation' : 'Add Cash'}
            </h2>
            <p className="text-slate-400 text-sm max-w-sm font-medium leading-relaxed">
              {type === 'activation' 
                ? `Unlock full potential of the platform by paying a one-time Rs ${appSettings.activationFee} account fee.` 
                : 'Add funds into your wallet.'}
            </p>
          </div>
          
          {type === 'activation' && (
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shrink-0">
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Fee Required</p>
               <p className="text-3xl font-black text-white italic tracking-tighter">Rs {appSettings.activationFee}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Payment Engine */}
        <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100/50 relative group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="font-black text-slate-900 text-xl tracking-tight italic">01. Source Account</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Available Payment Channels</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(Object.keys(accountDetails) as DepositMethod[]).map(methodKey => (
                         <button
                            key={methodKey}
                            onClick={() => setMethod(methodKey)}
                            className="relative flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all duration-500 border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/5"
                         >
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-inner overflow-hidden border border-emerald-100">
                                {accountDetails[methodKey].icon}
                             </div>
                             <div className="text-left">
                                <span className="font-black text-xs text-emerald-900 uppercase tracking-widest block">{methodKey}</span>
                                <span className="text-[9px] font-bold text-emerald-600/60 uppercase">Verified Gateway</span>
                             </div>
                             <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                <CheckCircle2 className="w-4 h-4" />
                             </div>
                         </button>
                    ))}
                </div>

                <div className="mt-8 bg-[#0A0B0F] rounded-[2.5rem] p-8 text-white relative overflow-hidden group/acc shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover/acc:bg-emerald-500/10 transition-colors"></div>
                    
                    <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 font-mono">ACCOUNT TITLE</p>
                                <p className="font-black text-xl text-white tracking-tight italic">{accountDetails[method].title}</p>
                            </div>
                            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
                                <EasyPaisaIcon className="h-4" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 font-mono">ACCOUNT NUMBER</p>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-black text-emerald-400 tracking-tighter italic">{accountDetails[method].number}</p>
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(accountDetails[method].number); alert('Copied!'); }}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-white p-3 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-90"
                                >
                                    <PlusCircle className="w-5 h-5 rotate-45" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight italic mb-8">02. Transfer Details</h3>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Volume (PKR)</label>
                            <input 
                              type="number" 
                              value={amount} 
                              onChange={e => setAmount(e.target.value)} 
                              className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] px-6 py-4 font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-xl italic tracking-tight" 
                              placeholder="0.00" 
                              required 
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Transaction Identity</label>
                            <input 
                              type="text" 
                              value={transactionId} 
                              onChange={e => setTransactionId(e.target.value)} 
                              className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] px-6 py-4 font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-xl italic tracking-tight uppercase placeholder:text-slate-200" 
                              placeholder="TID 123..." 
                              required 
                            />
                        </div>
                    </div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full bg-[#0A0B0F] text-white font-black py-6 rounded-[1.5rem] transition-all shadow-2xl shadow-slate-900/10 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-xs italic"
                    >
                        {isSubmitting ? (
                            <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>Confirm Payment Integrity <ArrowRight className="w-5 h-5 text-emerald-500" /></>
                        )}
                    </motion.button>

                    {message && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl border text-center text-[10px] font-black uppercase tracking-widest ${message.includes('submitted') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                      >
                        {message}
                      </motion.div>
                    )}
                </form>
            </div>
        </div>

        {/* Right: Security Ledger & History */}
        <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100/50 overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-8 border-b border-slate-50 bg-[#0A0B0F] text-white relative">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mb-16 blur-2xl"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                            <ClipboardList className="w-7 h-7"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tighter italic">Ledger History</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">Real-time status updates</p>
                        </div>
                    </div>
                </div>
               
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                    {depositHistory.length > 0 ? (
                        depositHistory.map((tx, i) => (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={tx.id || i} 
                                className="group bg-slate-50/50 p-5 rounded-[1.75rem] border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 flex justify-between items-center"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.15rem] bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-all shadow-sm">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div className="max-w-[120px] sm:max-w-none">
                                        <p className="font-black text-slate-900 text-xs tracking-tight truncate uppercase italic">{tx.description}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                            {new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} @ {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <p className="font-black text-base text-slate-900 tracking-tighter mb-1">+ {tx.amount.toLocaleString()} <span className="text-[8px] text-slate-400 font-bold">PKR</span></p>
                                     <StatusBadge status={tx.status} />
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Wallet className="w-12 h-12 opacity-10" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ledger is empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
