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
      {/* Hero: Referral Protocol */}
      <div className="relative mb-12 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-[#0A0B0F] rounded-[3rem] p-8 sm:p-12 overflow-hidden border border-white/5 shadow-2xl">
          {/* Decorative Technical Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="absolute top-1/2 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] -ml-24"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="inline-flex items-center gap-2 bg-indigo-950/40 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-6 border border-indigo-500/20 backdrop-blur-md"
                >
                    <Zap className="w-3.5 h-3.5 fill-indigo-400" />
                    Accelerator Active
                </motion.div>
                
                <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-[0.95] tracking-tighter italic">
                    EXPAND THE <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">NETWORK.</span>
                </h1>
                
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest max-w-[300px] mb-8 leading-relaxed mx-auto md:mx-0">
                    Secure <span className="text-white italic">Rs {currentBonus}</span> per active node connection and build your yield stream.
                </p>

                <div className="flex items-center gap-4 justify-center md:justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[120px]">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Direct</p>
                        <p className="text-xl font-black text-white italic tracking-tighter">Rs {currentBonus}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[120px]">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Indirect</p>
                        <p className="text-xl font-black text-white italic tracking-tighter">Rs {appSettings?.indirectReferralBonus || 20}</p>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-6">
                <div className="relative group/qr">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover/qr:opacity-40 transition-opacity"></div>
                    <div className="relative w-48 h-48 bg-white p-3 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center">
                        <div className="w-full h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden">
                             <UserPlus className="w-16 h-16 text-slate-300 animate-pulse" />
                             <div className="absolute bottom-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocol ID: {referralCode}</div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest italic">Global Node Sync Active</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Engine */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { icon: <Users />, label: 'Nodes', value: referralStats.totalInvited, color: 'indigo' },
          { icon: <Zap />, label: 'Active', value: referralStats.activeMembers, color: 'emerald' },
          { icon: <Wallet />, label: 'Yield', value: `Rs ${referralStats.totalCommission}`, color: 'amber' },
          { icon: <Trophy />, label: 'Tier', value: partnerTier.toUpperCase(), color: 'rose' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col items-center text-center group cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
               {React.cloneElement(stat.icon as React.ReactElement, { className: 'w-5 h-5' })}
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{stat.value}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Share Section: Architectural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        <div className="lg:col-span-12">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tighter italic uppercase">Distribution <span className="text-indigo-600">Hub</span></h3>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>
        </div>

        <div className="lg:col-span-7 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-8">
                <div>
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Your Unique Protocol</p>
                   <h4 className="text-base font-black text-slate-900 italic tracking-tighter uppercase">Alpha Sharing Node</h4>
                </div>
                <Users className="w-8 h-8 text-slate-100" />
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-3 shadow-inner relative group">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                   <div className="flex-1 px-5 py-4 text-xs font-bold text-slate-500 italic truncate w-full sm:w-auto">
                    {referralLink}
                   </div>
                   <button 
                     onClick={handleCopy}
                     className={`h-14 sm:w-48 w-full rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-[#0A0B0F] text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20'}`}
                   >
                     {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                     {copied ? 'Captured' : 'Copy Node'}
                   </button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-10">
                {[
                  { icon: <MessageCircle />, label: 'WhatsApp', color: '#25D366', action: handleShareWhatsApp },
                  { icon: <Phone />, label: 'Connect', color: '#1877F2' },
                  { icon: <Users />, label: 'Feed', color: '#6366f1' },
                  { icon: <Share2 />, label: 'System', color: '#0F172A', action: handleShare }
                ].map((social, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <motion.button 
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={social.action}
                      style={{ backgroundColor: social.color }}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                      {React.cloneElement(social.icon as React.ReactElement, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
                    </motion.button>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{social.label}</span>
                  </div>
                ))}
            </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0A0B0F] p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
                <div>
                   <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2">Strategy <span className="text-amber-500">Guide</span></h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Higher nodes activate complex yield streams. Partners receive Rs 150 - Rs 200 per active connection. Upgrade to Partner tier to double your output capacity.
                   </p>
                </div>
                
                <div className="mt-8 space-y-4">
                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-amber-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Helix Bonus</span>
                      </div>
                      <span className="text-xs font-black text-amber-500">+Rs 200</span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <Gift className="w-4 h-4 text-purple-400 fill-purple-400/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Network Gift</span>
                      </div>
                      <span className="text-xs font-black text-purple-400">Random RS</span>
                   </div>
                </div>
            </div>
        </div>
      </div>

      {/* Feed Architecture */}
      <div>
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-3">
             <Clock className="w-5 h-5 text-slate-900" />
             <h3 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">Alpha <span className="text-emerald-600">Feed</span></h3>
          </div>
          <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-100 shadow-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
            {referrals.length} Synchronized Nodes
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {referrals.length === 0 ? (
            <div className="bg-white p-16 rounded-[4rem] text-center border border-slate-100 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 opacity-20"></div>
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-white relative z-10">
                    <Zap className="w-10 h-10 text-slate-300" />
                </div>
                <h4 className="text-xl font-black text-slate-400 italic tracking-tighter uppercase relative z-10">Network Standby</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 max-w-[240px] mx-auto leading-relaxed relative z-10">Protocol initialized. No active connections detected in your network stream.</p>
            </div>
          ) : (
            referrals.map((r, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={r.id || idx}
                className="group bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center justify-between hover:border-indigo-100 hover:shadow-indigo-100/50 transition-all duration-500"
              >
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner relative overflow-hidden transition-all duration-500 group-hover:scale-105 ${r.status === 'paid' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300 border border-slate-50'}`}>
                         {r.status === 'paid' && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>}
                         <span className="relative z-10">{r.name ? r.name.substring(0, 1).toUpperCase() : '?'}</span>
                    </div>
                    <div>
                        <h4 className="text-base font-black text-slate-950 italic tracking-tighter uppercase group-hover:text-indigo-600 transition-colors leading-none mb-2">{r.name || 'Anonymous Node'}</h4>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatDate(r.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                <Users className="w-2.5 h-2.5 text-slate-400" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{r.status === 'paid' ? 'Elite' : 'Basic'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 text-right">
                    <div className={`px-4 py-2 rounded-2xl border text-[9px] font-black tracking-widest uppercase flex items-center gap-2 ${r.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></div>
                        {r.status === 'paid' ? 'Synchronized' : 'Verifying'}
                    </div>
                    {r.status === 'paid' && (
                        <p className="text-xl font-black text-emerald-600 italic tracking-tighter leading-none">+Rs {currentBonus}</p>
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
