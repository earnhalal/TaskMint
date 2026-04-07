import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Check, X, ArrowLeft, Wallet, Send, AlertCircle, Clock } from 'lucide-react';
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
    { feature: "Referral Bonus", basic: `Rs ${appSettings.referralBonusBasic}`, partner: `Rs ${appSettings.referralBonusPartner}` },
    { feature: "Team Commission", basic: "0%", partner: "10%" },
    { feature: "Withdrawal Priority", basic: "Normal", partner: "High" },
    { feature: "Team Analytics", basic: false, partner: true },
    { feature: "Member Approval", basic: false, partner: true },
  ];

  if (partnerStatus === 'pending') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full text-center p-8"
      >
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Clock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Pending Approval</h2>
        <p className="text-slate-500 mb-8 max-w-xs">
          Your partner upgrade request is being verified by our team. This usually takes 12-24 hours.
        </p>
        <button 
          onClick={onBack}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
        >
          Back to Dashboard
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 px-4 pt-4"
    >
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 font-bold text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-gradient-to-br from-[#060D2D] to-[#151E32] rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-2">Partner Program</h2>
          <p className="text-slate-400 text-sm">Unlock premium benefits and earn massive team commissions.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-8">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feature</th>
              <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Basic</th>
              <th className="p-4 text-[10px] font-bold text-amber-600 uppercase tracking-wider text-center">Partner</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0">
                <td className="p-4 text-xs font-bold text-slate-600">{row.feature}</td>
                <td className="p-4 text-xs font-bold text-slate-400 text-center">
                  {typeof row.basic === 'boolean' ? (row.basic ? <Check className="w-4 h-4 mx-auto text-emerald-500" /> : <X className="w-4 h-4 mx-auto text-red-400" />) : row.basic}
                </td>
                <td className="p-4 text-xs font-black text-slate-900 text-center">
                  {typeof row.partner === 'boolean' ? (row.partner ? <Check className="w-4 h-4 mx-auto text-emerald-500" /> : <X className="w-4 h-4 mx-auto text-red-400" />) : row.partner}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Upgrade Payment</h3>
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Fee: Rs {appSettings.partnerFee}</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-amber-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">EasyPaisa / JazzCash</p>
            <p className="text-lg font-black text-slate-900">{appSettings.paymentNumber}</p>
            <p className="text-[10px] text-slate-500 font-medium">Account Name: {appSettings.paymentName}</p>
          </div>
          
          <div className="flex items-start gap-2 bg-amber-100/50 p-3 rounded-xl border border-amber-200/50">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 leading-relaxed">
              Please send exactly Rs {appSettings.partnerFee} to the number above and enter your Transaction ID below.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">Transaction ID</label>
            <div className="relative">
              <input 
                type="text" 
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="Enter 11-digit ID"
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
              <Send className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-amber-500 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'SUBMITTING...' : 'UPGRADE TO PARTNER'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
