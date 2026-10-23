import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Check, X, ArrowLeft, Wallet, Send, AlertCircle, Clock, Ticket, Hash, ArrowRight } from 'lucide-react';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

interface PartnerUpgradeViewProps {
  userId: string;
  userName: string;
  partnerStatus: string;
  onBack: () => void;
  appSettings: {
    activationFee: number;
    partnerFee: number;
    paymentNumber: string;
    paymentName: string;
    referralBonusBasic: number;
    referralBonusPartner: number;
    indirectReferralBonus: number;
  };
}

export default function PartnerUpgradeView({ userId, userName, partnerStatus, onBack, appSettings }: PartnerUpgradeViewProps) {
  const [txId, setTxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!txId.trim()) {
      alert("Please enter Transaction ID");
      return;
    }

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'partnerRequests', userId), {
        userId,
        userName,
        txId,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      // Update user's partnerStatus to pending
      await updateDoc(doc(db, 'users', userId), {
        partnerStatus: 'pending'
      });
      alert("Upgrade request submitted! Admin will verify your payment soon.");
      onBack();
    } catch (error) {
      console.error("Error submitting partner request:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const comparisonData = [
    { feature: "Joining Fee", basic: `Rs ${appSettings.activationFee}`, partner: `Rs ${appSettings.partnerFee}` },
    { feature: "Task Earnings", basic: "Basic", partner: "Premium (+20%)" },
    { feature: "Referral Bonus", basic: `Rs ${appSettings.referralBonusBasic}`, partner: `Rs ${appSettings.referralBonusPartner}` },
    { feature: "Team Commission", basic: "0%", partner: "10%" },
    { feature: "Free Lottery Tickets", basic: "0", partner: "2 (Monthly)" },
    { feature: "Withdrawal Priority", basic: "Normal", partner: "High" },
    { feature: "Team Analytics", basic: false, partner: true },
    { feature: "Member Approval", basic: false, partner: true },
  ];

  const eliteBenefits = [
    { title: "Direct Bonus", value: `Rs ${appSettings.referralBonusPartner}`, subtitle: "Per direct referral" },
    { title: "Team Bonus", value: "10%", subtitle: "Indirect commission" },
    { title: "Task Boost", value: "20%", subtitle: "Extra on every task" },
    { title: "Batch Support", value: "Priority", subtitle: "24/7 Elite support" },
  ];

  if (partnerStatus === 'pending') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-[#15181D]"
      >
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 animate-pulse"></div>
           <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-[2rem] flex items-center justify-center relative border border-emerald-500/20 shadow-xl shadow-none">
              <Clock className="w-12 h-12" />
           </div>
        </div>
        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Security Check</h2>
        <p className="text-zinc-400 mb-10 max-w-xs text-sm font-medium leading-relaxed">
          Our team is verifying your payment. This usually takes <span className="text-emerald-400 font-bold">12-24 hours</span>.
        </p>
        <button 
          onClick={onBack}
          className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl active:scale-95 transition-all text-xs uppercase tracking-widest"
        >
          Return to Dashboard
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 px-4 pt-6 bg-white/5 min-h-screen"
    >
      <div className="max-w-xl mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </button>

        {/* Global Elite Header */}
        <div className="bg-[#022c22] rounded-3xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600/5 rounded-full -ml-16 -mb-16 blur-2xl"></div>
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-none">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">Elite Tier</span>
                    </div>
                </div>
                
                <h2 className="text-4xl font-black text-white mb-3 tracking-tighter ">Partner <span className="text-emerald-500">Upgrade</span></h2>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-[80%]">The highest tier in our economy. Massive bonuses, team commission, and instant support.</p>
            </div>
        </div>

        {/* Bento Benefits Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            {eliteBenefits.map((benefit, i) => (
                <motion.div 
                    key={i}
                    whileHover={{ y: -5 }}
                    className="bg-[#15181D] p-5 rounded-[2rem] border border-white/5 shadow-sm flex flex-col items-center text-center group"
                >
                    <h4 className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 group-hover:text-emerald-400 transition-colors">{benefit.title}</h4>
                    <p className="text-xl font-black text-white  tracking-tight">{benefit.value}</p>
                    <p className="text-[9px] text-zinc-500 font-bold mt-1 uppercase tracking-tight">{benefit.subtitle}</p>
                </motion.div>
            ))}
        </div>

        {/* Feature Comparison Table - Redesigned */}
        <div className="bg-[#15181D] rounded-3xl overflow-hidden border border-white/5 shadow-sm mb-8">
            <div className="bg-slate-50/50 p-6 border-b border-white/5">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Plan Comparison</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <tbody className="divide-y divide-white/5">
                        {comparisonData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-5">
                                <p className="text-[11px] font-black text-zinc-300 uppercase tracking-tight">{row.feature}</p>
                            </td>
                            <td className="p-5 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-slate-100/50 px-3 py-1 rounded-lg">
                                    <span className="text-xs font-bold text-zinc-500">
                                        {typeof row.basic === 'boolean' ? (row.basic ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-red-300" />) : row.basic}
                                    </span>
                                </div>
                            </td>
                            <td className="p-5 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                                    <span className="text-xs font-black text-emerald-400 ">
                                        {typeof row.partner === 'boolean' ? (row.partner ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-red-500" />) : row.partner}
                                    </span>
                                </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Payment Gate - High Premium */}
        <div className="bg-[#15181D] rounded-3xl p-8 border border-emerald-500/25 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-[1.25rem] border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Wallet className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-white tracking-tight">Manual Activation</h3>
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Account Fee: Rs {appSettings.partnerFee}</p>
                </div>
            </div>

            <div className="space-y-4 mb-10">
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 relative group">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Target Account</p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-white tracking-tighter ">{appSettings.paymentNumber}</p>
                        <button 
                            onClick={() => { navigator.clipboard.writeText(appSettings.paymentNumber); alert('Copied!'); }}
                            className="bg-[#15181D] p-2.5 rounded-xl border border-white/10 shadow-sm hover:bg-white/5 transition-all active:scale-90"
                        >
                            <Send className="w-4 h-4 text-emerald-400" />
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-bold mt-2 uppercase">Account: {appSettings.paymentName}</p>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-emerald-500/10 rounded-[1.5rem] border border-emerald-100/50">
                    <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-300 font-bold leading-relaxed uppercase tracking-tight">
                        Transfer exact amount via <span className="text-emerald-400">EasyPaisa/JazzCash</span> to the number above.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="relative">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block px-1">Transaction Identity (T-ID)</label>
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={txId}
                            onChange={(e) => setTxId(e.target.value)}
                            placeholder="ENTER 11 DIGIT CODE"
                            className="w-full bg-white/5 border-2 border-slate-50 rounded-[1.5rem] px-6 py-5 text-base font-black  focus:outline-none focus:border-emerald-500 focus:bg-[#15181D] transition-all tracking-widest placeholder:text-slate-300"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#15181D] rounded-lg flex items-center justify-center border border-white/5 shadow-sm">
                            <Hash className="w-4 h-4 text-zinc-500" />
                        </div>
                    </div>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 text-white py-6 rounded-[1.5rem] font-black text-xs shadow-2xl active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest  flex items-center justify-center gap-3"
                >
                    {isSubmitting ? (
                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    ) : (
                        <>Buy Plan <ArrowRight className="w-4 h-4 text-emerald-500" /></>
                    )}
                </motion.button>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
