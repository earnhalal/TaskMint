import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Star, Shield, Crown, Check, AlertCircle, Zap, Wallet } from 'lucide-react';
import { doc, updateDoc, increment, getDoc, collection, addDoc, serverTimestamp as firestoreServerTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ref, update, increment as rtdbIncrement } from 'firebase/database';
import { rtdb } from '../../firebase';

interface PartnerPlansProps {
  onClose: () => void;
  balance?: number;
  currentRole?: string;
  partnerTier?: string;
  referrerId?: string | null;
  onUpdateBalance?: (amount: number, source?: string, description?: string) => Promise<boolean>;
  appSettings?: any;
}

export default function PremiumModal({ onClose, balance = 0, currentRole = 'user', partnerTier = 'basic', referrerId, onUpdateBalance, appSettings }: PartnerPlansProps) {
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
        await onUpdateBalance(-price, 'partner_upgrade', `Upgraded to ${tier.toUpperCase()} Partner`);
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          role: 'partner',
          partnerStatus: 'active',
          partnerTier: tier
        });
        await update(ref(rtdb, `users/${auth.currentUser.uid}`), {
          role: 'partner',
          partnerStatus: 'active',
          partnerTier: tier
        });

        // Referral Bonus logic: 35%
        if (referrerId) {
            const referrerRef = doc(db, 'users', referrerId);
            const referrerSnap = await getDoc(referrerRef);
            if (referrerSnap.exists()) {
                const referrerData = referrerSnap.data();
                if (referrerData.role === 'partner') {
                    const commission = price * 0.35;
                    await updateDoc(referrerRef, {
                        balance: increment(commission),
                        totalTeamEarnings: increment(commission)
                    });
                    await update(ref(rtdb, `users/${referrerId}`), {
                        balance: rtdbIncrement(commission),
                        totalTeamEarnings: rtdbIncrement(commission)
                    });
                    
                    // Add earning history
                    await addDoc(collection(db, 'earning_history'), {
                        userId: referrerId,
                        amount: commission,
                        source: 'commission',
                        description: `35% Partner commission from ${planId.toUpperCase()} upgrade`,
                        timestamp: firestoreServerTimestamp()
                    });
                }
            }
        }
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
      price: `Rs ${appSettings?.activationFee || 100}`,
      duration: 'Lifetime Access',
      icon: <Star className="w-6 h-6" />,
      color: 'from-slate-600 to-slate-800',
      tagline: 'Standard Earning Mode',
      adEarnings: 'Rs 5 - 10 / Daily (Min)',
      features: [
        'Rs 100 per Invite',
        '1.00 Reward per Ad Watch',
        'Standard Daily Tasks',
        'Basic Support'
      ],
      buttonText: currentRole !== 'partner' ? 'Active Plan' : 'Basic Plan',
      buttonColor: 'bg-slate-200 text-slate-500 cursor-not-allowed',
      isCurrent: currentRole !== 'partner',
      action: () => {}
    },
    {
      id: 'bronze',
      name: 'BRONZE PARTNER',
      price: 'Rs 500',
      duration: 'Starter High-Yield',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-emerald-600 to-emerald-800',
      tagline: 'Starter Partner Mode',
      adEarnings: 'Rs 30 - 60 / Daily',
      features: [
        'Rs 130 per Invite',
        '3.00 Reward per Bronze Ad',
        '1 Free monthly ticket',
        'Instant Payout Enabled'
      ],
      buttonText: partnerTier === 'bronze' ? 'Current Plan' : 'Purchase Bronze',
      buttonColor: partnerTier === 'bronze' ? 'bg-emerald-500 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30',
      isCurrent: partnerTier === 'bronze',
      action: () => {
        if (partnerTier === 'basic') {
          handleBuyPlan('bronze', 500, 'bronze');
        }
      }
    },
    {
      id: 'silver',
      name: 'SILVER PARTNER',
      price: `Rs ${appSettings?.partnerFee || 1000}`,
      duration: 'Lifetime High-Yield',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-indigo-600 to-blue-700',
      tagline: 'Business Pro Partner',
      adEarnings: 'Rs 125 - 250 / Daily',
      features: [
        `Rs ${appSettings?.referralBonusPartner || 150} per Invite`,
        '25.00 Reward per VIP Ad',
        '2 Free monthly tickets',
        'Team Management Tools',
        'Priority Admin Support'
      ],
      buttonText: partnerTier === 'silver' ? 'Current Plan' : 'Buy Silver Pro',
      buttonColor: partnerTier === 'silver' ? 'bg-emerald-500 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30',
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
      duration: 'Elite Lifetime VIP',
      icon: <Crown className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-600',
      tagline: 'Maximum Revenue Mode',
      adEarnings: 'Rs 300 - 600 / Daily',
      features: [
        'Rs 200 per Instant Invite',
        '60.00 Reward per Elite Ad',
        '5 Free monthly tickets',
        'Full Partner Analytics',
        'VIP WhatsApp Group Access'
      ],
      buttonText: partnerTier === 'gold' ? 'Current Plan' : 'Go VIP Elite',
      buttonColor: partnerTier === 'gold' ? 'bg-emerald-500 text-white cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:scale-[1.02] text-white shadow-xl shadow-amber-500/30',
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full pb-32 overflow-y-auto hide-scrollbar bg-[#F8FAFC]"
    >
      {/* Immersive Header - Now scrolls with content */}
      <div className="bg-[#060D2D] pt-10 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[120px]"></div>
        
        <div className="relative z-10 max-w-lg mx-auto">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-2xl shadow-amber-500/40 rotate-12"
          >
            <Crown className="w-7 h-7 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter italic uppercase">
            Partner <span className="text-amber-500">Plans</span>
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-xs mx-auto mb-6 opacity-60">
            More Earnings Every Day
          </p>
          
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="text-lg font-black text-emerald-400 tracking-tighter italic">Rs {balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="px-5 -mt-16 relative z-20 pb-10">
        <div className="space-y-6 max-w-md mx-auto">
          {plans.map((plan) => (
            <motion.div 
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-[2.5rem] border ${plan.isPopular ? 'border-amber-200' : 'border-slate-100'} overflow-hidden shadow-2xl shadow-slate-200/50 flex flex-col relative group`}
            >
              {plan.isCurrent && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-4 py-1.5 rounded-full z-10 uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                  Active Member
                </div>
              )}
              
              {/* Card Header Gradient */}
              <div className={`bg-gradient-to-br ${plan.color} p-8 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/5 opacity-10 blur-xl"></div>
                <div className="relative z-10">
                   <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        {plan.icon}
                      </div>
                      <div className="text-right">
                         <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{plan.tagline}</p>
                         <h3 className="text-xl font-black text-white italic tracking-tight">{plan.name}</h3>
                      </div>
                   </div>
                   
                   <div className="flex items-end gap-2 text-white">
                      <span className="text-4xl font-black tracking-tighter italic leading-none">{plan.price}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{plan.duration}</span>
                   </div>
                </div>
              </div>

              <div className="p-8">
                {/* Daily Ad Earnings Section - ENHANCED */}
                <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group-hover:bg-indigo-50 transition-colors">
                   <div className="flex items-center gap-3">
                      <Zap className={`w-5 h-5 ${plan.isPopular ? 'text-amber-500' : 'text-indigo-500'}`} />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Estimated Daily Ads Income</p>
                        <p className={`text-sm font-black italic tracking-tight ${plan.isPopular ? 'text-amber-600' : 'text-indigo-600'}`}>{plan.adEarnings}</p>
                      </div>
                   </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-4 text-xs font-black text-slate-600 uppercase tracking-tight">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${plan.isPopular ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={plan.action}
                  disabled={plan.isCurrent || isProcessing || (plan.id === 'basic')}
                  className={`w-full py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 ${plan.buttonColor}`}
                >
                  {isProcessing && !plan.isCurrent && plan.id !== 'basic' ? 'Syncing...' : plan.buttonText}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
