import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Network, Share2, MessageCircle, Clock, Sparkles, UsersRound } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

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
  const [activeTab, setActiveTab] = useState<'L1' | 'L2' | 'L3'>('L1');
  const [tree, setTree] = useState<{L1: any[], L2: any[], L3: any[]}>({ L1: referrals || [], L2: [], L3: [] });
  const [loadingTree, setLoadingTree] = useState(false);

  const referralLink = `https://taskmint.click/ref/${encodeURIComponent(referralCode)}`;
  
  let currentBonus = appSettings?.referralBonusBasic || 100;
  if (role === 'partner') {
    if (partnerTier === 'gold') currentBonus = 200;
    else if (partnerTier === 'silver' || partnerTier === 'bronze') currentBonus = 150;
    else currentBonus = 150;
  }

  useEffect(() => {
    let isMounted = true;
    const loadDeepTree = async () => {
       if (!referralCode) return;
       setLoadingTree(true);
       try {
         let validL1Codes: string[] = referrals.map((r: any) => r.referralCode || r.username).filter(Boolean);
         
         if (validL1Codes.length === 0) {
            const q1 = query(collection(db, 'users'), where('referredBy', '==', referralCode));
            const snap1 = await getDocs(q1);
            snap1.docs.forEach(d => {
               const data = d.data();
               if (data.referralCode || data.username) validL1Codes.push(data.referralCode || data.username);
            });
         }

         const l2List: any[] = [];
         for (let i = 0; i < validL1Codes.length; i += 10) {
            const chunk = validL1Codes.slice(i, i + 10);
            if (chunk.length === 0) continue;
            const q2 = query(collection(db, 'users'), where('referredBy', 'in', chunk));
            const snap2 = await getDocs(q2);
            snap2.docs.forEach(d => {
                const data = d.data();
                l2List.push({ 
                    id: d.id, 
                    name: data.username || data.name || 'User',
                    status: data.status ? String(data.status).toLowerCase() : 'pending',
                    timestamp: data.joiningDate || data.createdAt,
                    ...data 
                });
            });
         }

         const l3List: any[] = [];
         const validL2Codes = l2List.map(r => r.referralCode || r.username).filter(Boolean);
         for (let i = 0; i < validL2Codes.length; i += 10) {
            const chunk = validL2Codes.slice(i, i + 10);
            if (chunk.length === 0) continue;
            const q3 = query(collection(db, 'users'), where('referredBy', 'in', chunk));
            const snap3 = await getDocs(q3);
            snap3.docs.forEach(d => {
                const data = d.data();
                l3List.push({ 
                    id: d.id, 
                    name: data.username || data.name || 'User',
                    status: data.status ? String(data.status).toLowerCase() : 'pending',
                    timestamp: data.joiningDate || data.createdAt,
                    ...data 
                });
            });
         }

         if(isMounted) {
            setTree({ L1: referrals, L2: l2List, L3: l3List });
         }
       } catch (e) {
         console.error("Tree Fetch Error:", e);
       }
       if (isMounted) setLoadingTree(false);
    };

    loadDeepTree();
    return () => { isMounted = false; };
  }, [referralCode, referrals]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = referralLink;
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
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
          text: 'Assalam o Alaikum! Join TaskMint and start earning money online daily at home.',
          url: referralLink,
        });
      } catch (err) {}
    } else {
      handleCopy();
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    try {
      let date;
      if (ts.toDate) date = ts.toDate();
      else if (ts.seconds) date = new Date(ts.seconds * 1000);
      else date = new Date(ts);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const activeData = tree[activeTab];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 px-4 sm:px-6 pt-2 max-w-2xl mx-auto w-full"
    >
      <div className="relative mb-8 overflow-hidden rounded-[2rem] p-8 sm:p-10 bg-[#0A0A0B] shadow-[0_20px_50px_rgba(255,255,255,0.03)] border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-32 -mt-32 mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] mix-blend-screen pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-6 shadow-xl"
          >
              <Network className="w-3 h-3 text-emerald-500" /> Multi-Level Commissions
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-none tracking-tighter italic text-white uppercase">
            Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Empire</span>
          </h1>
          
          <p className="text-white/60 text-sm font-medium max-w-[280px] mb-2 leading-relaxed">
            Earn from direct invites and passive team commissions up to 3 Levels deep.
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-[2rem] p-6 shadow-xl border relative overflow-hidden bg-[#0A0A0B] border-white/5">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Invite Link</label>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white">{referralCode}</span>
          </div>
          
          <div className="flex items-center p-2 pl-4 rounded-2xl border mb-4 bg-[#151515] border-white/5">
            <span className="flex-1 text-xs sm:text-sm font-semibold truncate mr-3 text-slate-300">
              {referralLink}
            </span>
            <button 
              onClick={handleCopy}
              className={`h-12 shrink-0 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${copied ? 'bg-emerald-500 text-[#0A0A0B] shadow-lg shadow-emerald-500/20' : 'bg-white text-[#0A0A0B] hover:bg-slate-200 shadow-lg shadow-white/10'}`}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleShareWhatsApp} 
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 font-black text-[10px] uppercase tracking-widest hover:bg-[#25D366]/20 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
            </button>
            <button 
              onClick={handleShare} 
              className="flex items-center justify-center gap-2 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all bg-white/5 text-white border border-white/10"
            >
              <Share2 className="w-4 h-4" /> Share More
            </button>
          </div>
        </div>
      </div>

      {pendingIndirect > 0 && (
          <div className="bg-[#111112] rounded-2xl p-6 shadow-xl border border-emerald-500/30 mb-8 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Legacy Indirect Commission</p>
                  <p className="text-xs text-slate-400">Click below to claim earnings</p>
              </div>
              <p className="text-3xl font-black text-white">Rs {pendingIndirect?.toLocaleString() || 0}</p>
            </div>
            <button 
                onClick={onClaimIndirect}
                className="w-full bg-emerald-500 text-[#0A0A0B] py-4 rounded-xl font-black text-lg active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
            >
                Claim Now
            </button>
          </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-lg font-black italic tracking-tighter uppercase text-white">
            Team <span className="text-emerald-400">Network</span>
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          {(['L1', 'L2', 'L3'] as const).map((lvl) => {
            const isActive = activeTab === lvl;
            const count = tree[lvl].length;
            const amount = lvl === 'L1' ? currentBonus : lvl === 'L2' ? 15 : 10;
            
            const paidMembers = tree[lvl].filter(r => r.status?.toLowerCase() === 'paid' || r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'approved');
            let totalEarning = 0;
            if (lvl === 'L1') {
               totalEarning = paidMembers.reduce((sum, r) => sum + (r.commission || currentBonus), 0);
            } else if (lvl === 'L2') {
               totalEarning = paidMembers.length * 15;
            } else if (lvl === 'L3') {
               totalEarning = paidMembers.length * 10;
            }

            const colorMap = {
              L1: { text: 'text-emerald-400', border: 'border-emerald-500/50', shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]', bgGlow: 'bg-emerald-500/5', icon: 'text-emerald-400', activeBg: 'bg-[#111112]' },
              L2: { text: 'text-cyan-400', border: 'border-cyan-500/50', shadow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]', bgGlow: 'bg-cyan-500/5', icon: 'text-cyan-400', activeBg: 'bg-[#111112]' },
              L3: { text: 'text-indigo-400', border: 'border-indigo-500/50', shadow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]', bgGlow: 'bg-indigo-500/5', icon: 'text-indigo-400', activeBg: 'bg-[#111112]' }
            };

            const styles = colorMap[lvl];

            return (
              <button
                key={lvl}
                onClick={() => setActiveTab(lvl)}
                className={`relative flex flex-col items-center py-3 px-2 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] border transition-all duration-300 overflow-hidden group active:scale-95 ${
                  isActive 
                    ? `${styles.border} ${styles.shadow} ${styles.activeBg}` 
                    : 'border-white/5 bg-[#0A0A0B] hover:bg-[#111112] hover:border-white/10'
                }`}
              >
                {isActive && (
                  <div className={`absolute inset-0 ${styles.bgGlow} pointer-events-none`} />
                )}
                
                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-white' : 'text-slate-500'}`}>
                  Level {lvl.replace('L', '')}
                </span>
                
                <span className={`text-xl sm:text-2xl font-black italic tracking-tighter mb-2 ${styles.text}`}>
                  Rs {amount}
                </span>
                
                <div className={`w-full text-center py-1.5 mb-2 rounded-lg bg-black/40 border border-white/5`}>
                  <p className="text-[7.5px] sm:text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Total Earned</p>
                  <p className={`text-[11px] sm:text-xs font-black ${styles.text}`}>Rs {totalEarning.toLocaleString()}</p>
                </div>

                <div className={`flex items-center justify-center w-full gap-1 sm:gap-1.5 py-1 rounded-full text-[8.5px] sm:text-[9px] font-bold transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-400 group-hover:bg-white/10'
                }`}>
                  <UsersRound className={`w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 ${isActive ? styles.icon : 'text-slate-500'}`} /> {count} Mem
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {loadingTree ? (
            <div className="rounded-[2rem] p-12 text-center border border-dashed bg-[#0A0A0B] border-white/10">
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20 text-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scanning Network...</p>
            </div>
          ) : activeData.length === 0 ? (
            <div className="rounded-[2rem] p-12 text-center border border-dashed bg-[#0A0A0B] border-white/10">
              <UsersRound className="w-10 h-10 mx-auto mb-3 opacity-20 text-white" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No members in this level</p>
            </div>
          ) : (
            activeData.map((r: any, idx: number) => {
              const isPaid = r.status?.toLowerCase() === 'paid' || r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'approved';
              return (
              <motion.div 
                key={r.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                className="p-4 rounded-[1.5rem] border flex items-center justify-between group transition-all bg-[#0A0A0B] border-white/5 hover:bg-white/5 hover:border-white/10"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-lg shrink-0 transition-transform group-hover:scale-105 ${isPaid ? 'bg-emerald-500 text-[#0A0A0B]' : 'bg-[#151515] text-slate-600 border border-white/5'}`}>
                    {r.name ? r.name.substring(0, 1).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black italic tracking-tighter uppercase truncate mb-0.5 text-slate-200">
                      {r.name || 'Anonymous User'}
                    </h4>
                    <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 text-slate-500">
                      <Clock className="w-2.5 h-2.5" /> {formatDate(r.timestamp) || 'Recent'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isPaid ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Approved
                      </span>
                      <span className="text-xs font-black italic tracking-tighter text-white">
                        +Rs {activeTab === 'L1' ? (r.commission || currentBonus) : activeTab === 'L2' ? 15 : 10}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-white/5 text-slate-400 border border-white/10">
                      Pending
                    </span>
                  )}
                </div>
              </motion.div>
            )})
          )}
        </div>
      </div>
    </motion.div>
  );
}
