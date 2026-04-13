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
      className="max-w-5xl mx-auto pb-24 px-4 pt-4"
    >
      <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {type === 'activation' ? 'Account Activation' : 'Add Funds'}
          </h2>
          <p className="text-slate-500 mt-2">
            {type === 'activation' 
              ? `Pay Rs ${appSettings.activationFee} joining fee to start earning from tasks & referrals.` 
              : 'Top up your wallet to create tasks or upgrade plans.'}
          </p>
      </div>

      {type === 'activation' && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <PlusCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900">Why Activate?</h3>
            <p className="text-sm text-amber-800/80 leading-relaxed">
              Activation unlocks all earning features including <span className="font-bold">Spin Wheel, Task Wall, and Surveys</span>. Plus, you get your unique referral link to earn Rs {appSettings.referralBonusBasic || 125} per friend!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Instructions & Form */}
        <div className="space-y-6">
            {/* Instructions Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">1. Select & Send</h3>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md uppercase">Step 1</span>
                </div>
                
                <div className="grid grid-cols-1 gap-3 mb-6">
                    {(Object.keys(accountDetails) as DepositMethod[]).map(methodKey => (
                         <button
                            key={methodKey}
                            onClick={() => setMethod(methodKey)}
                            className={`relative flex flex-col items-center justify-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 border-amber-500 bg-amber-50 shadow-sm`}
                         >
                             <div className="absolute top-2 right-2 text-amber-600">
                                 <CheckCircle2 className="w-4 h-4" />
                             </div>
                             <div className="h-8 flex items-center justify-center">{accountDetails[methodKey].icon}</div>
                             <span className={`font-bold text-xs text-amber-900`}>{methodKey}</span>
                         </button>
                    ))}
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                        <span className="text-xs font-bold text-slate-400 uppercase">Account Title</span>
                        <span className="font-mono font-bold text-slate-900">{accountDetails[method].title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase">Account Number</span>
                        <span className="font-mono font-bold text-slate-900 text-lg tracking-wide">{accountDetails[method].number}</span>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">Send the amount to the details above.</p>
            </div>

            {/* Submission Form */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 text-lg">2. Verify Transaction</h3>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md uppercase">Step 2</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Amount Sent</label>
                        <div className="relative">
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="block w-full pl-4 pr-12 py-3 border border-slate-100 bg-slate-50 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" placeholder="1000" required />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">PKR</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Transaction ID (TID)</label>
                        <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} className="block w-full px-4 py-3 border border-slate-100 bg-slate-50 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder-slate-300" placeholder="e.g. 1234567890" required />
                    </div>
                    
                    <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:transform-none flex items-center justify-center gap-2">
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>Verify Deposit <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                    {message && <p className={`text-center text-xs font-bold p-3 rounded-xl ${message.includes('submitted') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</p>}
                </form>
            </div>
        </div>

        {/* Right Column: History Ledger */}
        <div className="bg-white p-0 sm:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full min-h-[400px]">
            <div className="p-6 sm:p-2 flex items-center gap-3 mb-2 border-b border-gray-100 sm:border-none pb-4 sm:pb-0">
                 <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <ClipboardList className="w-5 h-5"/>
                 </div>
                 <div>
                     <h2 className="text-xl font-bold text-slate-900">Transaction Ledger</h2>
                     <p className="text-xs text-slate-500">Recent deposit attempts</p>
                 </div>
            </div>
           
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-0">
                {depositHistory.length > 0 ? (
                    <div className="space-y-3">
                        {depositHistory.map((tx, i) => (
                            <div key={tx.id ? `deposit-${tx.id}` : `deposit-idx-${i}`} className="group bg-slate-50 hover:bg-white p-4 rounded-2xl border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-200 flex justify-between items-center" style={{animationDelay: `${i * 50}ms`}}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                                        <PlusCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">{tx.description}</p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                            {new Date(tx.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <p className="font-black text-base text-slate-900 mb-1">+ {tx.amount.toLocaleString()} <span className="text-[9px] text-slate-400">PKR</span></p>
                                     <StatusBadge status={tx.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                        <Wallet className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No deposit history found.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </motion.div>
  );
}
