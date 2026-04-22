import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, CheckCircle2, Wallet, Trophy, UserPlus, Gift, Copy, Phone, MessageCircle, Share2, Star, ChevronRight, AlertCircle, ExternalLink, Clock, Zap } from 'lucide-react';

interface InviteTabProps {
  status: string;
  referralStats: {
    totalInvited: number;
    activeMembers: number;
    totalCommission: number;
  };
  referralCode: string;
  onActivateClick: () => void;
  referrals: any[];
  appSettings?: any;
  role?: string;
  partnerTier?: string;
}

export default function InviteTab({ status, referralStats, referralCode, onActivateClick, referrals, appSettings, role = 'user', partnerTier = 'basic' }: InviteTabProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://taskmint.click/ref/${encodeURIComponent(referralCode)}`;
  
  // Determine dynamic bonus based on role and tier
  let currentBonus = appSettings?.referralBonusBasic || 125;
  if (role === 'partner') {
    if (partnerTier === 'gold') {
      currentBonus = 200;
    } else {
      currentBonus = appSettings?.referralBonusPartner || 150;
    }
  }

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement("textarea");
        textArea.value = referralLink;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error(error);
        } finally {
          textArea.remove();
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert("Could not copy text. Please try again.");
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Join TaskMint and start earning Rs 2000+ daily! Use my link to sign up: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TaskMint',
          text: 'Join TaskMint and start earning Rs 2000+ daily! Use my link to sign up:',
          url: referralLink,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24"
    >
      {/* Top Card: Premium Design */}
      <div className="bg-[#0F172A] rounded-[2.5rem] p-8 text-center shadow-2xl mb-8 relative overflow-hidden group border border-slate-800">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_60%)]"></div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-6 border border-amber-500/20 backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5 fill-amber-500/20" />
            Mega Referral Bonus
          </div>
          
          <h1 className="text-4xl font-black text-white mb-4 leading-tight tracking-tighter">
            Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">Rs {currentBonus}</span><br/>
            <span className="text-white/60 text-xl font-bold tracking-normal">Directly per Friend!</span>
          </h1>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 max-w-[300px] mx-auto mb-2">
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Invite 2 friends and get <span className="text-amber-400 font-bold">Rs 250</span> instantly! Unlimited earning potential.
            </p>
          </div>
          
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">
            Joining Fee: <span className="text-amber-400">Rs {appSettings?.activationFee || 100}</span>
          </p>
        </div>
      </div>

      {/* My Team Stats - Enhanced */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: <Users className="w-5 h-5 text-blue-500" />, label: 'Invited', value: referralStats.totalInvited, color: 'blue' },
          { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, label: 'Active', value: referralStats.activeMembers, color: 'emerald' },
          { icon: <Wallet className="w-5 h-5 text-amber-500" />, label: 'Earnings', value: `Rs ${referralStats.totalCommission}`, color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:border-slate-200 transition-all">
            <div className={`w-10 h-10 rounded-2xl bg-${stat.color}-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <span className="text-lg font-black text-slate-900">{stat.value}</span>
            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Referral Link Section - Enhanced */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 relative overflow-hidden mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Your Referral Link</h3>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">Active</div>
        </div>
        
        <div className="flex gap-2 mb-6">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xs text-slate-600 font-mono truncate select-all">
            {referralLink}
          </div>
          <button 
            onClick={handleCopy}
            className="bg-[#0F172A] text-white px-6 py-4 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shrink-0 shadow-lg shadow-slate-900/20"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: <Phone className="w-5 h-5" />, color: 'bg-[#25D366]', onClick: handleShareWhatsApp, label: 'WhatsApp' },
            { icon: <Users className="w-5 h-5" />, color: 'bg-[#1877F2]', label: 'Facebook' },
            { icon: <MessageCircle className="w-5 h-5" />, color: 'bg-[#00B2FF]', label: 'Telegram' },
            { icon: <Share2 className="w-5 h-5" />, color: 'bg-slate-900', onClick: handleShare, label: 'More' }
          ].map((btn, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <button 
                onClick={btn.onClick}
                className={`w-12 h-12 rounded-2xl ${btn.color} flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all shadow-lg shadow-black/5`}
              >
                {btn.icon}
              </button>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{btn.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Info - Enhanced */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
        
        <h3 className="text-base font-black mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          Earning Structure
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight">Direct Referral</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Level 1 Bonus</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-amber-400">Rs {currentBonus}</p>
              <p className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter">Instant Credit</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight">Indirect Referral</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Level 2 Bonus</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-emerald-400">Rs {appSettings?.indirectReferralBonus || 20}</p>
              <p className="text-[9px] text-emerald-500/60 font-black uppercase tracking-tighter">Passive Income</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History Table - Enhanced */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Referral History</h3>
          <div className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
            {referrals.length} Total
          </div>
        </div>
        
        <div className="space-y-4">
          {referrals.length > 0 ? (
            referrals.map(r => (
              <div key={r.id} className="group bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl hover:border-indigo-100 transition-all duration-300 active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm overflow-hidden ${
                    r.status === 'paid' ? 'bg-indigo-600 text-white' : 
                    r.status === 'rejected' ? 'bg-rose-500 text-white' : 
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <span className="relative z-10">{r.name ? r.name.substring(0, 1).toUpperCase() : '?'}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">{r.name || 'Anonymous'}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" />
                        {r.timestamp ? new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest px-3 py-2 rounded-xl shadow-sm border ${
                    r.status === 'paid' 
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                      : r.status === 'rejected'
                        ? 'text-rose-700 bg-rose-50 border-rose-100'
                        : 'text-amber-700 bg-amber-50 border-amber-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      r.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                      r.status === 'rejected' ? 'bg-rose-500' : 
                      'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    }`}></div>
                    {r.status === 'paid' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                  {r.status === 'paid' && (
                    <div className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-lg shadow-sm shadow-emerald-200">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <p className="text-[10px] font-black">+Rs {currentBonus}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Users className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-base text-slate-900 font-black tracking-tight">No referrals yet</p>
              <p className="text-xs text-slate-500 font-medium mt-2 max-w-[200px] mx-auto">Share your link with friends to start earning instant rewards!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
