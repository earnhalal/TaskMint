import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, CheckCircle2, Wallet, Trophy, UserPlus, Gift, Copy, Phone, MessageCircle, Share2, Star, ChevronRight, AlertCircle, ExternalLink, Clock, Zap, Sparkles } from 'lucide-react';

interface InviteTabProps {
  status: string;
  referralStats: {
    totalInvited: number;
    activeMembers: number;
    totalCommission: number;
    totalIndirectCommission?: number;
  };
  referralCode: string;
  onActivateClick: () => void;
  referrals: any[];
  appSettings?: any;
  role?: string;
  partnerTier?: string;
  onClaimIndirect?: () => void;
  pendingIndirect?: number;
}

export default function InviteTab({ status, referralStats, referralCode, onActivateClick, referrals, appSettings, role = 'user', partnerTier = 'basic', onClaimIndirect, pendingIndirect = 0 }: InviteTabProps) {
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
    const text = `Assalam o Alaikum! Join TaskMint and start earning money online daily at home. Click my link to create a free account: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TaskMint',
          text: 'Assalam o Alaikum! Join TaskMint and start earning money online daily at home. Click my link to create a free account:',
          url: referralLink,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopy();
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'Analyzing...';
    try {
      let date;
      // Handle Firestore Timestamp
      if (ts && typeof ts.toDate === 'function') {
        date = ts.toDate();
      } 
      // Handle timestamp object {seconds, nanoseconds}
      else if (ts && typeof ts.seconds === 'number') {
        date = new Date(ts.seconds * 1000);
      }
      // Handle legacy string/number
      else if (typeof ts === 'string' || typeof ts === 'number') {
        date = new Date(ts);
      }
      // Handle serverTimestamp (might be null initially)
      else if (ts && typeof ts === 'object' && !ts.seconds) {
        return 'Synced';
      }
      else {
        date = new Date(ts);
      }

      if (isNaN(date.getTime())) return 'Secured';

      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: '2-digit'
      });
    } catch (e) {
      return 'Secured';
    }
  };

  const isDark = role === 'partner';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 px-4 sm:px-6 pt-2 max-w-2xl mx-auto w-full"
    >
      {/* Premium Hero Card */}
      <div className={`relative mb-8 overflow-hidden rounded-[2rem] p-8 sm:p-10 ${isDark ? 'bg-gradient-to-br from-[#1A1A1B] via-[#0A0A0B] to-[#1A1A1B] border-white/10' : 'bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 border-indigo-500/20'} shadow-[0_20px_50px_rgba(0,0,0,0.3)] border`}>
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] -mr-32 -mt-32 mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px] mix-blend-screen pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-[9px] font-black uppercase tracking-[0.2em] text-amber-400 mb-6 shadow-xl"
          >
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Supercharged Earnings
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-none tracking-tighter italic text-white uppercase">
            Invite & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Earn</span>
          </h1>
          
          <p className="text-white/60 text-sm font-medium max-w-[280px] mb-8 leading-relaxed">
            Build your team. Get <strong className="text-white">Rs {currentBonus}</strong> for every direct invite, plus passive rewards.
          </p>

          {/* Quick Stats in Hero */}
          <div className="flex items-center justify-center gap-3 w-full">
            <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col items-center shadow-inner">
              <span className="text-2xl font-black text-white italic tracking-tighter">Rs {currentBonus}</span>
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">Direct Bonus</span>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent"></div>
              <span className="text-2xl font-black text-amber-400 italic tracking-tighter relative z-10">Rs {appSettings?.indirectReferralBonus || 10}</span>
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1 relative z-10">Team Bonus</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link & Actions */}
      <div className={`mb-8 rounded-[2rem] p-6 shadow-xl border relative overflow-hidden ${isDark ? 'bg-[#0A0A0B] border-white/5' : 'bg-white border-slate-100'}`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Your Invite Link</label>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>{referralCode}</span>
          </div>
          
          <div className={`flex items-center p-2 pl-4 rounded-2xl border mb-4 ${isDark ? 'bg-[#151515] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`flex-1 text-xs sm:text-sm font-semibold truncate mr-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {referralLink}
            </span>
            <button 
              onClick={handleCopy}
              className={`h-12 shrink-0 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/30'}`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleShareWhatsApp} 
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#25D366] text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
            </button>
            <button 
              onClick={handleShare} 
              className={`flex items-center justify-center gap-2 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'}`}
            >
              <Share2 className="w-4 h-4" /> Share Options
            </button>
          </div>
        </div>
      </div>

      {/* Pending Indirect Commission Claim */}
      <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-amber-500/30 mb-8 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Indirect Commission</p>
              <p className="text-xs text-slate-300">Click below to claim earnings</p>
          </div>
          <p className="text-3xl font-black text-white">Rs {pendingIndirect.toLocaleString()}</p>
        </div>
        <button 
            onClick={onClaimIndirect}
            className="w-full bg-amber-500 text-slate-900 py-4 rounded-xl font-black text-lg active:scale-95 transition-all shadow-lg shadow-amber-500/20"
        >
            {pendingIndirect > 0 ? "Claim Now" : "Check for Earnings"}
        </button>
      </div>

      {/* Network Stats */}
      <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ml-2 pl-2 border-l-2 ${isDark ? 'text-slate-500 border-amber-500' : 'text-slate-400 border-indigo-500'}`}>Live Network Stats</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { label: 'Total Friends', value: referralStats.totalInvited, color: isDark ? 'text-white' : 'text-slate-900', icon: <Users size={16} /> },
          { label: 'Active Friends', value: referralStats.activeMembers, color: 'text-emerald-500', icon: <Zap size={16} /> },
          { label: 'Total Invite Income', value: `Rs ${referralStats.totalCommission}`, color: 'text-amber-500', icon: <Wallet size={16} /> },
          { label: 'Indirect Income', value: `Rs ${referralStats.totalIndirectCommission || 0}`, color: 'text-purple-500', icon: <Sparkles size={16} /> },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-[1.5rem] border flex flex-col justify-between ${isDark ? 'bg-[#0A0A0B] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
              {stat.icon}
            </div>
            <div>
              <div className={`text-lg font-black italic tracking-tighter ${stat.color}`}>{stat.value}</div>
              <div className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className={`text-lg font-black italic tracking-tighter uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Invite <span className={isDark ? 'text-amber-500' : 'text-indigo-600'}>Log</span>
          </h3>
          <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            {referrals.length} Joined
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {referrals.length === 0 ? (
            <div className={`rounded-[2rem] p-12 text-center border border-dashed ${isDark ? 'bg-[#0A0A0B] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <Users className={`w-10 h-10 mx-auto mb-3 opacity-20 ${isDark ? 'text-white' : 'text-slate-900'}`} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No activity yet</p>
            </div>
          ) : (
            referrals.map((r, idx) => (
              <motion.div 
                key={r.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-3xl border flex items-center justify-between group transition-all ${isDark ? 'bg-[#0A0A0B] border-white/5 hover:bg-white/5' : 'bg-white border-slate-100 shadow-sm hover:border-indigo-100 hover:shadow-md'}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-lg shrink-0 transition-transform group-hover:scale-105 ${r.status === 'paid' ? (isDark ? 'bg-amber-500 text-[#0A0A0B]' : 'bg-indigo-600 text-white') : (isDark ? 'bg-[#151515] text-slate-600 border border-white/5' : 'bg-slate-50 text-slate-400 border border-slate-100')}`}>
                    {r.name ? r.name.substring(0, 1).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-sm font-black italic tracking-tighter uppercase truncate mb-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {r.name || 'Anonymous User'}
                    </h4>
                    <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                      <Clock className="w-2.5 h-2.5" /> {formatDate(r.timestamp) || 'Recent'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {r.status === 'paid' ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isDark ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        Paid
                      </span>
                      {r.commission && <span className={`text-xs font-black italic tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>+Rs {r.commission}</span>}
                    </div>
                  ) : r.status === 'rejected' ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isDark ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      Invalid
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isDark ? 'bg-white/5 text-slate-400 border border-white/10' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      Pending
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
