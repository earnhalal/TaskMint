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
      className="max-w-5xl mx-auto pb-24 font-sans"
    >
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 px-6 py-10 text-center relative overflow-hidden rounded-b-[2.5rem] shadow-xl mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-inner border border-white/20">
            <Wallet className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            {type === 'activation' ? 'Account Activation' : 'Deposit Funds'}
          </h2>
          <p className="text-emerald-100 text-sm max-w-xs mx-auto font-medium leading-relaxed">
            {type === 'activation' 
              ? `Pay Rs ${appSettings.activationFee} joining fee to start earning from tasks & referrals.` 
              : 'Top up your wallet to create tasks or upgrade plans.'}
          </p>
        </div>
      </div>

      <div className="px-4">
        {type === 'activation' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 mb-8 flex items-center gap-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
              <PlusCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-amber-900 uppercase tracking-tight">Why Activate?</h3>
              <p className="text-xs text-amber-800/70 font-bold leading-relaxed mt-0.5">
                Activation unlocks <span className="text-amber-600">Spin Wheel, Task Wall, and Surveys</span>. Earn Rs {appSettings.referralBonusBasic || 125} per friend!
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Instructions & Form */}
          <div className="space-y-6">
              {/* Instructions Card */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative group">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-black text-xs">1</div>
                        <h3 className="font-black text-slate-900 text-lg tracking-tight">Select & Send</h3>
                      </div>
                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-widest">Step One</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 mb-6">
                      {(Object.keys(accountDetails) as DepositMethod[]).map(methodKey => (
                           <button
                              key={methodKey}
                              onClick={() => setMethod(methodKey)}
                              className={`relative flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all duration-300 border-emerald-500 bg-emerald-50/50 shadow-sm group-hover:shadow-md`}
                           >
                               <div className="absolute top-3 right-3 text-emerald-600 bg-white rounded-full p-1 shadow-sm">
                                   <CheckCircle2 className="w-4 h-4" />
                               </div>
                               <div className="h-10 flex items-center justify-center transform group-hover:scale-110 transition-transform">{accountDetails[methodKey].icon}</div>
                               <span className={`font-black text-xs text-emerald-900 uppercase tracking-widest`}>{methodKey}</span>
                           </button>
                      ))}
                  </div>

                  <div className="bg-slate-900 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/10">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Title</span>
                          <span className="font-bold text-white tracking-tight">{accountDetails[method].title}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</span>
                          <div className="flex flex-col items-end">
                            <span className="font-black text-emerald-400 text-2xl tracking-tighter">{accountDetails[method].number}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(accountDetails[method].number);
                                alert('Number copied!');
                              }}
                              className="text-[9px] font-black text-white/40 uppercase hover:text-emerald-400 transition-colors mt-1"
                            >
                              Click to Copy
                            </button>
                          </div>
                      </div>
                  </div>
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Send the exact amount to the details above</p>
              </div>

              {/* Submission Form */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-black text-xs">2</div>
                        <h3 className="font-black text-slate-900 text-lg tracking-tight">Verify Payment</h3>
                      </div>
                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-widest">Step Two</span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount Sent</label>
                          <div className="relative group">
                              <input 
                                type="number" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                className="block w-full pl-6 pr-16 py-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-lg" 
                                placeholder="1000" 
                                required 
                              />
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 tracking-widest">PKR</span>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transaction ID (TID)</label>
                          <input 
                            type="text" 
                            value={transactionId} 
                            onChange={e => setTransactionId(e.target.value)} 
                            className="block w-full px-6 py-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-lg placeholder-slate-300" 
                            placeholder="e.g. 1234567890" 
                            required 
                          />
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-70 disabled:transform-none flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                      >
                          {isSubmitting ? (
                              <span className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></span>
                          ) : (
                              <>Verify Deposit <ArrowRight className="w-5 h-5" /></>
                          )}
                      </button>
                      {message && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`text-center text-xs font-black p-4 rounded-2xl border ${message.includes('submitted') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                        >
                          {message}
                        </motion.div>
                      )}
                  </form>
              </div>
          </div>

          {/* Right Column: History Ledger */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full min-h-[500px] overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <ClipboardList className="w-6 h-6"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Deposit History</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recent attempts</p>
                    </div>
                  </div>
              </div>
             
              <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                  {depositHistory.length > 0 ? (
                      <div className="space-y-4">
                          {depositHistory.map((tx, i) => (
                              <div key={tx.id ? `deposit-${tx.id}` : `deposit-idx-${i}`} className="group bg-white p-5 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 flex justify-between items-center">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                                          <PlusCircle className="w-6 h-6" />
                                      </div>
                                      <div>
                                          <p className="font-black text-slate-900 text-sm tracking-tight">{tx.description}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                {new Date(tx.date).toLocaleDateString()}
                                            </p>
                                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                       <p className="font-black text-lg text-slate-900 tracking-tighter mb-1">+ {tx.amount.toLocaleString()} <span className="text-[9px] text-slate-400 font-bold">PKR</span></p>
                                       <StatusBadge status={tx.status} />
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Wallet className="w-10 h-10 opacity-20" />
                          </div>
                          <p className="text-xs font-black uppercase tracking-widest">No history found</p>
                      </div>
                  )}
              </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
