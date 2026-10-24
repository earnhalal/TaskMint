import { useState } from 'react';
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
 price: `Rs ${appSettings?.activationFee || 150}`,
 duration: 'Lifetime Access',
 icon: <Star className="w-6 h-6" />,
 color: 'from-slate-600 to-[#15181D]',
 tagline: 'Standard Earning Mode',
 adEarnings: 'Rs 5 - 10 / Daily (Min)',
 features: [
 'Rs 100 per Invite',
 '1.00 Reward per Ad Watch',
 'Standard Daily Tasks',
 'Basic Support'
 ],
 buttonText: currentRole !== 'partner' ? 'Active Plan' : 'Basic Plan',
 buttonColor: 'bg-white/10 text-zinc-500 cursor-not-allowed',
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
 buttonColor: partnerTier === 'bronze' ? 'bg-emerald-500 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-none',
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
 color: 'from-teal-600 to-blue-700',
 tagline: 'Business Pro Partner',
 adEarnings: 'Rs 125 - 250 / Daily',
 features: [
 `Rs ${appSettings?.referralBonusPartner || 125} per Invite`,
 '25.00 Reward per VIP Ad',
 '2 Free monthly tickets',
 'Team Management Tools',
 'Priority Admin Support'
 ],
 buttonText: partnerTier === 'silver' ? 'Current Plan' : 'Buy Silver Pro',
 buttonColor: partnerTier === 'silver' ? 'bg-emerald-500 text-white cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-none',
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
 color: 'from-emerald-500 to-orange-600',
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
 buttonColor: partnerTier === 'gold' ? 'bg-emerald-500 text-white cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-orange-600 hover:scale-[1.02] text-white shadow-xl shadow-none',
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
 className="w-full pb-28"
 >
 {/* Header */}
 <div className="flex items-start justify-between px-1 mb-5">
 <div>
 <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
 <Crown className="w-6 h-6 text-amber-400" /> Partner Plans
 </h2>
 <p className="text-xs font-semibold text-zinc-400 mt-1">Upgrade your account to unlock higher rewards and partner tools.</p>
 </div>
 <button
 onClick={onClose}
 className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 active:scale-95 transition shrink-0"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Balance strip */}
 <div className="flex items-center justify-between bg-[#15181D] border border-white/5 rounded-2xl px-4 py-3.5 mb-5">
 <span className="flex items-center gap-2 text-xs font-bold text-zinc-400">
 <Wallet className="w-4 h-4 text-emerald-400" /> Your balance
 </span>
 <span className="text-base font-black text-white">Rs. {balance.toLocaleString()}</span>
 </div>

 {currentRole === 'partner' && (
 <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 mb-5">
 <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
 <p className="text-[11px] font-bold text-emerald-300">You are currently on the {partnerTier.toUpperCase()} partner plan.</p>
 </div>
 )}

 {/* Plans */}
 <div className="space-y-4">
 {plans.map((plan) => (
 <div
 key={plan.id}
 className={`bg-[#15181D] rounded-3xl border overflow-hidden ${plan.isPopular ? 'border-amber-500/40' : 'border-white/5'}`}
 >
 <div className={`bg-gradient-to-r ${plan.color} px-5 py-4 flex items-center gap-3.5`}>
 <span className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
 {plan.icon}
 </span>
 <div className="flex-1 min-w-0">
 <p className="text-base font-black text-white leading-tight">{plan.name}</p>
 <p className="text-[11px] font-semibold text-white/60">{plan.tagline} · {plan.duration}</p>
 </div>
 <div className="text-right shrink-0">
 <p className="text-lg font-black text-white leading-tight">{plan.price}</p>
 {plan.isPopular && <span className="text-[8px] font-black bg-amber-400 text-black px-1.5 py-0.5 rounded">MOST POPULAR</span>}
 </div>
 </div>

 <div className="p-5">
 <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-3.5 py-3 mb-4">
 <span className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
 <Zap className="w-4 h-4 text-amber-400" /> Estimated daily ad income
 </span>
 <span className="text-xs font-black text-emerald-400">{plan.adEarnings}</span>
 </div>

 <ul className="space-y-2.5 mb-5">
 {plan.features.map((feature, idx) => (
 <li key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-200">
 <span className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0">
 <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />
 </span>
 {feature}
 </li>
 ))}
 </ul>

 <button
 onClick={plan.action}
 disabled={plan.isCurrent || isProcessing || (plan.id === 'basic')}
 className={`w-full h-12 rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-[0.98] flex items-center justify-center gap-2 ${plan.buttonColor}`}
 >
 {isProcessing && !plan.isCurrent && plan.id !== 'basic' ? 'Processing...' : plan.buttonText}
 </button>
 {plan.isCurrent && (
 <p className="text-center text-[10px] font-bold text-emerald-400 mt-2.5 uppercase tracking-wider">This is your current plan</p>
 )}
 </div>
 </div>
 ))}
 </div>

 <p className="flex items-start gap-2 text-[11px] font-semibold text-zinc-500 leading-relaxed mt-5 px-1">
 <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
 Plan price is deducted from your main balance. Estimated daily income depends on the ads and tasks you complete.
 </p>
 </motion.div>

 );
}
