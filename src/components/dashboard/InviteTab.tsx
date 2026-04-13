import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, CheckCircle, Wallet, Trophy, UserPlus, Gift, Copy, Phone, MessageCircle, Share2, Star, ChevronRight, AlertCircle, ExternalLink } from 'lucide-react';

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
}

export default function InviteTab({ status, referralStats, referralCode, onActivateClick, referrals, appSettings }: InviteTabProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://taskmint.click/ref/${encodeURIComponent(referralCode)}`;

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
            Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">Rs {appSettings?.referralBonusBasic || 125}</span><br/>
            <span className="text-white/60 text-xl font-bold tracking-normal">Directly per Friend!</span>
          </h1>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 max-w-[300px] mx-auto mb-2">
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Invite 2 friends and get <span className="text-amber-400 font-bold">Rs 250</span> instantly! Unlimited earning potential.
            </p>
          </div>
          
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">
            Joining Fee: Rs {appSettings?.activationFee || 280}
          </p>
        </div>
      </div>

      {/* My Team Stats - Enhanced */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: <Users className="w-5 h-5 text-blue-500" />, label: 'Invited', value: referralStats.totalInvited, color: 'blue' },
          { icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, label: 'Active', value: referralStats.activeMembers, color: 'emerald' },
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
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
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
              <p className="text-xl font-black text-amber-400">Rs {appSettings?.referralBonusBasic || 125}</p>
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
          <h3 className="text-base font-black text-slate-900 tracking-tight">Referral History</h3>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
            {referrals.length} Total
          </div>
        </div>
        
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl">
          {referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-400 uppercase font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {referrals.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-[10px]">
                            {r.name.substring(0, 1).toUpperCase()}
                          </div>
                          <span className="font-black text-slate-900">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full ${r.status === 'paid' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                          {r.status === 'paid' ? 'Earned' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right text-slate-400 font-bold">
                        {r.timestamp ? new Date(r.timestamp).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-sm text-slate-400 font-black uppercase tracking-widest">No referrals yet</p>
              <p className="text-[10px] text-slate-300 font-bold mt-1">Start sharing your link to earn!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
