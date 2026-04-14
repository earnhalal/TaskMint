import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Star, Shield, Crown, Check, AlertCircle, Zap } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ref, update, increment as rtdbIncrement } from 'firebase/database';
import { rtdb } from '../../firebase';

interface PartnerPlansProps {
  onClose: () => void;
  balance?: number;
  currentRole?: string;
  partnerTier?: string;
  onUpdateBalance?: (amount: number, source?: string, description?: string) => Promise<void>;
  appSettings?: any;
}

export default function PremiumModal({ onClose, balance = 0, currentRole = 'user', partnerTier = 'basic', onUpdateBalance, appSettings }: PartnerPlansProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBuyPlan = async (planId: string, price: number, tier: string) => {
    if (!auth.currentUser || !onUpdateBalance) return;
    
    if (balance < price) {
      alert(`Insufficient balance! You need Rs ${price} to buy this plan. Please deposit first.`);
      return;
    }

    if (confirm(`Are you sure you want to upgrade to ${tier.toUpperCase()} Partner for Rs ${price}? This will be deducted from your main balance.`)) {
      setIsProcessing(true);
      try {
        // Deduct balance
        await onUpdateBalance(-price, 'partner_upgrade', `Upgraded to ${tier.toUpperCase()} Partner`);
        
        // Update user role and tier in Firestore
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          role: 'partner',
          partnerStatus: 'active',
          partnerTier: tier
        });

        // Update in RTDB
        await update(ref(rtdb, `users/${auth.currentUser.uid}`), {
          role: 'partner',
          partnerStatus: 'active',
          partnerTier: tier
        });

        alert(`Congratulations! You are now a ${tier.toUpperCase()} Partner.`);
        onClose();
      } catch (error) {
        console.error("Error upgrading plan:", error);
        alert("Something went wrong. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'BASIC MEMBER',
      price: `Rs ${appSettings?.activationFee || 280}`,
      duration: 'Lifetime',
      icon: <Star className="w-6 h-6" />,
      color: 'bg-slate-500',
      features: [
        `Rs ${appSettings?.referralBonusBasic || 125} per Invite`,
        'Standard Daily Tasks',
        'Basic Support',
        'Normal Withdrawals'
      ],
      buttonText: currentRole !== 'partner' ? 'Current Plan' : 'Basic Plan',
      buttonColor: 'bg-slate-500 text-white opacity-50 cursor-not-allowed',
      isCurrent: currentRole !== 'partner',
      action: () => {}
    },
    {
      id: 'silver',
      name: 'SILVER PARTNER',
      price: `Rs ${appSettings?.partnerFee || 1000}`,
      duration: 'Lifetime',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-blue-500',
      features: [
        `Rs ${appSettings?.referralBonusPartner || 150} per Invite`,
        '10% Team Commission',
        'High Priority Withdrawals',
        'Team Analytics Dashboard'
      ],
      buttonText: partnerTier === 'silver' ? 'Current Plan' : 'Upgrade to Silver',
      buttonColor: partnerTier === 'silver' ? 'bg-emerald-500 text-white cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]',
      isCurrent: partnerTier === 'silver',
      action: () => {
        if (partnerTier !== 'silver' && partnerTier !== 'gold') {
          handleBuyPlan('silver', appSettings?.partnerFee || 1000, 'silver');
        }
      }
    },
    {
      id: 'gold',
      name: 'GOLD VIP PARTNER',
      price: 'Rs 2000',
      duration: 'Lifetime',
      icon: <Crown className="w-6 h-6" />,
      color: 'bg-amber-500',
      features: [
        'Rs 200 per Invite',
        '10% Team Commission',
        '2 Free Lottery Tickets / Month',
        'VIP Badge & Instant Withdrawals',
        'Premium Support'
      ],
      buttonText: partnerTier === 'gold' ? 'Current Plan' : 'Upgrade to VIP',
      buttonColor: partnerTier === 'gold' ? 'bg-emerald-500 text-white cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]',
      isPopular: true,
      isCurrent: partnerTier === 'gold',
      action: () => {
        if (partnerTier !== 'gold') {
          handleBuyPlan('gold', 2000, 'gold');
        }
      }
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full h-full pb-24 flex flex-col bg-slate-50/50"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-[#060D2D] via-[#151E32] to-[#060D2D] text-center py-12 px-6 relative rounded-b-[2.5rem] shadow-xl z-10">
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] rotate-3">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Partner Programs</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">Upgrade your account to unlock higher referral bonuses, team commissions, and VIP perks.</p>
          
          <div className="mt-8 inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-inner">
            <span className="text-xs text-slate-300 font-bold uppercase tracking-widest">Your Balance:</span>
            <span className="text-lg font-black text-emerald-400">Rs {balance.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
      </div>

      {/* Plans Grid */}
      <div className="p-6 overflow-y-auto hide-scrollbar flex-1 -mt-6 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pb-8">
            {plans.map((plan) => (
              <div key={plan.id} className={`bg-white rounded-[2rem] border ${plan.isPopular ? 'border-amber-200 shadow-xl shadow-amber-500/10 scale-[1.02]' : 'border-slate-100 shadow-sm'} overflow-hidden flex flex-col relative transition-transform`}>
                {plan.isCurrent && (
                  <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-br-xl z-10 uppercase tracking-widest shadow-sm">
                    Current Plan
                  </div>
                )}
                {plan.isPopular && !plan.isCurrent && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl z-10 uppercase tracking-widest shadow-sm">
                    Most Popular
                  </div>
                )}
                
                <div className={`${plan.color} p-8 text-center text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                      {plan.icon}
                    </div>
                    <h3 className="text-lg font-black tracking-widest uppercase mb-1 drop-shadow-sm">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-black drop-shadow-md">{plan.price}</span>
                    </div>
                    <p className="text-white/80 text-xs font-bold mt-2 uppercase tracking-widest">{plan.duration}</p>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-bold text-slate-600">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.isPopular ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                          <Check className="w-3 h-3" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    onClick={plan.action}
                    disabled={plan.isCurrent || isProcessing || (plan.id === 'basic')}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:active:scale-100 ${plan.buttonColor}`}
                  >
                    {isProcessing && !plan.isCurrent && plan.id !== 'basic' ? 'Processing...' : plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
    </motion.div>
  );
}
