import React from 'react';
import { motion } from 'motion/react';
import { X, PlayCircle, Star, Shield, Crown, Check } from 'lucide-react';

export default function PremiumModal({ onClose }: { onClose: () => void }) {
  const plans = [
    {
      id: 'free',
      name: 'FREE',
      price: 'FREE',
      duration: 'Lifetime',
      icon: <PlayCircle className="w-6 h-6" />,
      color: 'bg-slate-500',
      features: ['10 Ads Daily', 'Standard Speed', 'Basic Support'],
      buttonText: 'Current Plan',
      buttonColor: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      isCurrent: true
    },
    {
      id: 'starter',
      name: 'STARTER',
      price: '500 Rs',
      duration: 'for 30 days',
      icon: <Star className="w-6 h-6" />,
      color: 'bg-blue-500',
      features: ['30 Ads Daily', 'Valid for 30 Days', 'Standard Support'],
      buttonText: 'Buy Plan',
      buttonColor: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
    {
      id: 'pro',
      name: 'PRO',
      price: '1000 Rs',
      duration: 'for 30 days',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-fuchsia-500',
      features: ['60 Ads Daily', 'Valid for 30 Days', 'Priority Access'],
      buttonText: 'Buy Plan',
      buttonColor: 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white',
      isPopular: true
    },
    {
      id: 'vip',
      name: 'VIP',
      price: '2000 Rs',
      duration: 'for 365 days',
      icon: <Crown className="w-6 h-6" />,
      color: 'bg-yellow-500',
      features: ['Unlimited Ads', 'Valid for 1 Year', 'VIP Badge & Support'],
      buttonText: 'Buy Plan',
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full pb-24"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white w-full h-full sm:rounded-[2rem] relative overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#151E32] text-center py-8 px-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">Upgrade Your Earning Power</h2>
          <p className="text-slate-400 text-sm">Choose a plan to increase your daily ad watch limit.</p>
          
          {/* Hexagon pattern overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>

        {/* Plans Grid */}
        <div className="p-6 overflow-y-auto hide-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                {plan.isCurrent && (
                  <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-br-lg z-10 uppercase tracking-wider">
                    Active
                  </div>
                )}
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg z-10 uppercase tracking-wider">
                    Popular
                  </div>
                )}
                
                <div className={`${plan.color} p-6 text-center text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                      {plan.icon}
                    </div>
                    <h3 className="text-sm font-bold tracking-widest uppercase mb-1">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold">{plan.price.split(' ')[0]}</span>
                      {plan.price.includes('Rs') && <span className="text-sm font-bold">Rs</span>}
                    </div>
                    <p className="text-xs text-white/80 mt-1">{plan.duration}</p>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${plan.buttonColor}`}>
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
