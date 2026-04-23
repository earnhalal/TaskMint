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

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
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
      // Handle ISO string or number
      else {
        date = new Date(ts);
      }

      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      console.error("Date error:", e);
      return 'N/A';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 font-sans px-1"
    >
      {/* Premium Header Section */}
      <div className="relative mb-10 group mt-2">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-[2.5rem] blur-xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        
        <div className="relative bg-[#0F172A] rounded-[2.5rem] p-6 sm:p-10 text-center shadow-2xl overflow-hidden border border-white/5">
          {/* Animated Background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-8 border border-amber-500/30 backdrop-blur-md shadow-lg shadow-amber-500/10"
            >
              <Trophy className="w-4 h-4 fill-amber-500/20" />
              Elite Referral Network
            </motion.div>
            
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-none tracking-tighter italic">
              EARN <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500 drop-shadow-sm">Rs {currentBonus}</span><br/>
              <span className="text-white/40 text-[14px] sm:text-xl font-bold tracking-normal not-italic mt-2 block">Direct Bonus Per Active Node</span>
            </h1>
            
            <div className="grid grid-cols-2 gap-3 max-w-[400px] mx-auto mb-8">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Invite 5</p>
                <p className="text-xl font-black text-white tracking-tighter">Rs 625</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Invite 10</p>
                <p className="text-xl font-black text-white tracking-tighter">Rs 1250</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
              <div className="w-8 sm:w-12 h-px bg-slate-800"></div>
              <span>Unlimited Earning Potential</span>
              <div className="w-8 sm:w-12 h-px bg-slate-800"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10">
        {[
          { icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Nodes', value: referralStats.totalInvited, color: 'indigo', gradient: 'from-indigo-600 to-blue-600' },
          { icon: <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Active', value: referralStats.activeMembers, color: 'emerald', gradient: 'from-emerald-600 to-teal-600' },
          { icon: <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Earnings', value: `Rs ${referralStats.totalCommission}`, color: 'amber', gradient: 'from-amber-600 to-orange-600' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-5 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center group transition-all"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 sm:mb-4 text-white shadow-lg group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tighter italic">{stat.value}</span>
            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mt-2">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Referral Engine Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tighter italic">Referral Engine</h3>
            <div className="h-px flex-1 bg-slate-100 mx-4"></div>
        </div>

        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-indigo-100 border border-slate-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Your Protocol Link</p>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tighter italic">Secure Sharing Node</h3>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 fill-indigo-600/10" />
            </div>
          </div>
          
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-50 border border-slate-200 rounded-2xl px-2 py-2 overflow-hidden gap-2">
                <div className="flex-1 text-[11px] sm:text-sm text-slate-600 font-mono truncate select-all bg-white/50 px-4 py-4 rounded-xl">
                {referralLink}
                </div>
                <button 
                onClick={handleCopy}
                className="bg-[#0F172A] text-white h-12 px-6 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shrink-0 shadow-xl shadow-slate-900/20"
                >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'bg-[#25D366]', onClick: handleShareWhatsApp, label: 'WhatsApp' },
              { icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'bg-[#1877F2]', label: 'Facebook' },
              { icon: <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'bg-[#00B2FF]', label: 'Telegram' },
              { icon: <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'bg-slate-900', onClick: handleShare, label: 'Share' }
            ].map((btn, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={btn.onClick}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${btn.color} flex items-center justify-center text-white shadow-xl shadow-black/5 relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  {btn.icon}
                </motion.button>
                <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">{btn.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Level Earning Visualization */}
      <div className="mt-10 space-y-6">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tighter italic">Commission Streams</h3>
            <div className="h-px flex-1 bg-slate-100 mx-4"></div>
        </div>

        <div className="bg-[#0A0A0B] rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          
          <div className="space-y-4 sm:space-y-6 relative z-10">
            <div className="flex items-center justify-between p-4 sm:p-6 bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default">
              <div className="flex items-center gap-3 sm:gap-5">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                  <UserPlus className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-sm sm:text-lg font-black tracking-tight italic">Level 01 Bonus</p>
                  <p className="text-[8px] sm:text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">Direct Commission</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-3xl font-black text-amber-500 italic tracking-tighter">Rs {currentBonus}</p>
                <p className="text-[8px] sm:text-[9px] text-emerald-400 font-black uppercase mt-1 tracking-widest">Instant Payout</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 sm:p-6 bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default">
              <div className="flex items-center gap-3 sm:gap-5">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                  <Gift className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-sm sm:text-lg font-black tracking-tight italic">Level 02 Bonus</p>
                  <p className="text-[8px] sm:text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">Indirect Commission</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-3xl font-black text-emerald-500 italic tracking-tighter">Rs {appSettings?.indirectReferralBonus || 20}</p>
                <p className="text-[8px] sm:text-[9px] text-emerald-500/50 font-black uppercase mt-1 tracking-widest">Auto Credit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Feed */}
      <div className="mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 px-4 gap-4">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter italic">Referral Feed</h3>
          <div className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100 shadow-sm self-start">
            {referrals.length} Active Nodes
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {referrals.length > 0 ? (
            referrals.map((r, idx) => (
              <motion.div 
                key={r.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center justify-between hover:border-indigo-200 hover:shadow-indigo-100/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3 sm:gap-5 overflow-hidden">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.5rem] flex items-center justify-center font-black text-xl sm:text-2xl shadow-inner relative overflow-hidden shrink-0 ${
                    r.status === 'paid' ? 'bg-indigo-600 text-white' : 
                    r.status === 'rejected' ? 'bg-rose-500 text-white' : 
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-40"></div>
                    <span className="relative z-10">{r.name ? r.name.substring(0, 1).toUpperCase() : '?'}</span>
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-black text-slate-900 text-sm sm:text-lg tracking-tight group-hover:text-indigo-600 transition-colors uppercase italic truncate">{r.name || 'Anonymous'}</h4>
                    <div className="flex items-center gap-3 mt-1 sm:mt-1.5">
                      <div className="flex items-center gap-1.5 text-[8px] sm:text-[10px] font-black text-slate-400 bg-slate-50 px-2 sm:px-3 py-1 rounded-full uppercase tracking-widest border border-slate-100">
                        <Clock className="w-3 h-3" />
                        {formatDate(r.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 sm:gap-3 shrink-0 ml-2">
                  <span className={`inline-flex items-center gap-1.5 sm:gap-2 font-black text-[8px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-sm border ${
                    r.status === 'paid' 
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                      : r.status === 'rejected'
                        ? 'text-rose-700 bg-rose-50 border-rose-100'
                        : 'text-amber-700 bg-amber-50 border-amber-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      r.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                      r.status === 'rejected' ? 'bg-rose-500' : 
                      'bg-amber-500 animate-bounce'
                    }`}></div>
                    {r.status === 'paid' ? 'Synced' : r.status === 'rejected' ? 'Offline' : 'Verifying'}
                  </span>
                  {r.status === 'paid' && (
                    <div className="flex items-center gap-1 sm:gap-1.5 bg-indigo-600 text-white px-2 sm:px-3 py-1 rounded-full shadow-lg shadow-indigo-200 border border-white/20">
                      <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current text-white/80" />
                      <p className="text-[8px] sm:text-[10px] font-black italic">+Rs {currentBonus}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-10 sm:p-16 text-center border border-slate-100 shadow-2xl shadow-slate-100/50">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-50/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-50">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-slate-200" />
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 italic tracking-tighter">NETWORK DEPLOYED</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-3 max-w-[240px] mx-auto leading-loose px-4">Waiting for initial node authorization. Share your link to boot up your stream.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
