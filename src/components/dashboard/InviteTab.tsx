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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-32 px-4 pt-4 max-w-4xl mx-auto"
    >
      {/* --- Simple Premium Header --- */}
      <div className="relative mb-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 to-slate-900 p-8 sm:p-12 text-white shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-500/10 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 text-center md:text-left">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-6"
            >
                <Zap className="w-3 h-3" /> Account Active
            </motion.div>
            <h1 className="text-4xl sm:text-6xl font-black mb-4 leading-[0.9] tracking-tighter italic">
                INVITE & <br/>
                <span className="text-amber-500">EARN.</span>
            </h1>
            <p className="text-white/60 text-sm font-medium max-w-sm mb-8 leading-relaxed mx-auto md:mx-0">
                Invite your friends to TaskMint and earn big bonuses when they join your team.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">Direct Invite</span>
                <span className="text-xl font-black italic">Rs {currentBonus}</span>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">Team Bonus</span>
                <span className="text-xl font-black italic text-indigo-400">Rs {appSettings?.indirectReferralBonus || 20}</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col items-center">
            <div className="relative p-1 bg-gradient-to-tr from-amber-500 to-indigo-500 rounded-[2rem] shadow-2xl">
              <div className="bg-white p-4 rounded-[1.8rem] w-36 h-36 flex flex-col items-center justify-center text-slate-900 group">
                <UserPlus className="w-12 h-12 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{referralCode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Unified Link Card --- */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 mb-8 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Your Referral Link</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-2 pr-2 shadow-inner">
              <div className="flex-1 px-4 text-xs font-bold text-slate-500 truncate italic">
                {referralLink}
              </div>
              <button 
                onClick={handleCopy}
                className={`h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
              <button onClick={handleShareWhatsApp} className="w-11 h-11 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all"><MessageCircle className="w-5 h-5" /></button>
              <button onClick={handleShare} className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all"><Share2 className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* --- Stats Engine --- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Friends', value: referralStats.totalInvited, color: 'text-indigo-600', icon: <Users /> },
          { label: 'Active', value: referralStats.activeMembers, color: 'text-emerald-600', icon: <Zap /> },
          { label: 'Total Earnings', value: `Rs ${referralStats.totalCommission}`, color: 'text-amber-600', icon: <Wallet /> },
          { label: 'Your Level', value: partnerTier.toUpperCase(), color: 'text-indigo-900', icon: <Trophy /> }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-lg flex flex-col justify-center items-center text-center">
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</div>
            <div className={`text-xl font-black italic tracking-tight ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* --- History Feed --- */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            <h3 className="text-lg font-black text-slate-900 italic tracking-tighter uppercase">Referral <span className="text-indigo-600">History</span></h3>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {referrals.length} Friends Joined
          </span>
        </div>

        <div className="grid gap-3">
          {referrals.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200/50 rounded-[2.5rem] p-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-black text-slate-400 italic uppercase">No friends joined yet.</p>
            </div>
          ) : (
            referrals.map((r, idx) => (
              <motion.div 
                key={r.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-md flex items-center justify-between gap-4 group hover:border-indigo-100 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-all duration-500 group-hover:scale-105 ${r.status === 'paid' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                    {r.name ? r.name.substring(0, 1).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 italic tracking-tighter uppercase truncate mb-1">
                      {r.name || 'Anonymous User'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {formatDate(r.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    r.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {r.status === 'paid' ? 'Active' : 'Pending'}
                  </div>
                  {r.status === 'paid' && (
                    <span className="text-base sm:text-lg font-black text-emerald-600 italic tracking-tighter">+Rs {currentBonus}</span>
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
