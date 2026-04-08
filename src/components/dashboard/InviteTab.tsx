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
}

export default function InviteTab({ status, referralStats, referralCode, onActivateClick }: InviteTabProps) {
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
      {/* Activation Status Indicator */}
      <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between border-2 ${status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status === 'Active' ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {status === 'Active' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Account Status</p>
            <p className="text-sm font-bold">{status === 'Active' ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
        {status !== 'Active' && (
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={onActivateClick}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              Pay Rs 100 to Start
            </button>
          </div>
        )}
      </div>

      {/* Top Card: Earn Rs 40 per Friend! */}
      <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-[2rem] p-8 text-center shadow-xl mb-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_50%)]"></div>
        <motion.div 
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"
        ></motion.div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-4 border border-white/30 backdrop-blur-sm">
            <Star className="w-3 h-3 fill-white" />
            Limited Time Offer
          </div>
          <h1 className="text-3xl font-black text-white mb-2 leading-tight drop-shadow-md">
            Earn Rs 40<br/>
            <span className="text-white/90 text-2xl">per Friend!</span>
          </h1>
          <p className="text-xs text-white/80 font-medium leading-relaxed max-w-[280px] mx-auto">
            Invite friends to join TaskMint. When they activate their account, you get <span className="font-bold text-white underline">Rs 40</span> instantly!
          </p>
        </div>
      </div>

      {/* My Team Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: <Users className="w-4 h-4 text-blue-500" />, label: 'Total Invited', value: referralStats.totalInvited },
          { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, label: 'Active Members', value: referralStats.activeMembers },
          { icon: <Wallet className="w-4 h-4 text-amber-500" />, label: 'Team Comm.', value: `Rs ${referralStats.totalCommission}` },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-2">
              {stat.icon}
            </div>
            <span className="text-sm font-bold text-slate-900">{stat.value}</span>
            <span className="text-[8px] font-bold text-slate-500 tracking-wider uppercase mt-1 leading-tight">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Referral Link Section */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-yellow-100 relative overflow-hidden mb-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-50 text-yellow-600 text-[9px] font-bold tracking-widest uppercase px-4 py-1 rounded-b-lg">
          Your Referral Link
        </div>
        
        <div className="mt-6 flex gap-2 mb-4">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-[10px] text-slate-600 font-mono truncate">
            {referralLink}
          </div>
          <button 
            onClick={handleCopy}
            className="bg-[#0F172A] text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shrink-0"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button 
            onClick={handleShareWhatsApp}
            className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg shadow-[#25D366]/20"
          >
            <Phone className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg shadow-[#1877F2]/20">
            <Users className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 rounded-full bg-[#00B2FF] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg shadow-[#00B2FF]/20">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button 
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:scale-110 transition-transform shadow-lg shadow-slate-200/50"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Commission Info */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white mb-6">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Commission Structure
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
            <div>
              <p className="text-xs font-bold">Direct Referral (Level 1)</p>
              <p className="text-[10px] text-white/60">When your friend joins & activates</p>
            </div>
            <p className="text-lg font-black text-yellow-400">Rs 40</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
            <div>
              <p className="text-xs font-bold">Indirect Referral (Level 2)</p>
              <p className="text-[10px] text-white/60">When their friend activates</p>
            </div>
            <p className="text-lg font-black text-emerald-400">Rs 10</p>
          </div>
        </div>
      </div>

      {/* Referral Tracking */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-900">Referral Tracking</h3>
        <button className="text-xs font-bold text-yellow-600 flex items-center gap-1">
          View List <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
