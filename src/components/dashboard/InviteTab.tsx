import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Share2, MessageCircle, Clock, Sparkles, UsersRound, Copy, Check, UserPlus, UserCheck, Wallet } from 'lucide-react';
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
    // Flat rate (owner decision 2026-10-24): every partner tier earns referralBonusPartner.
    currentBonus = appSettings?.referralBonusPartner || 125;
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

  const shareText = `Assalam o Alaikum! Join TaskMint with my link and start earning online from home: ${referralLink}`;

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TaskMint',
          text: 'Assalam o Alaikum! Join TaskMint with my link and start earning online from home.',
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

  const stats = [
    { icon: UserPlus, label: 'Invited', value: String(referralStats?.totalInvited ?? 0) },
    { icon: UserCheck, label: 'Active', value: String(referralStats?.activeMembers ?? 0) },
    { icon: Wallet, label: 'Earned', value: `Rs ${(referralStats?.totalCommission ?? 0).toLocaleString()}` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 px-4 sm:px-6 pt-2 max-w-2xl mx-auto w-full"
    >
      {/* Compact header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white tracking-tight">
          Invite &amp; <span className="text-emerald-400">Earn</span>
        </h1>
        <p className="text-[13px] text-zinc-300 leading-relaxed mt-1">
          Earn <span className="text-emerald-400 font-bold">Rs {currentBonus}</span> for every friend who joins and activates, plus team commission from Levels 2 and 3.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-[#06382b] border border-white/10 px-3 py-3 text-center">
            <s.icon className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-base font-black text-white leading-none">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Invite link card */}
      <div className="mb-6 rounded-3xl p-4 sm:p-5 bg-[#06382b] border border-white/10">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-zinc-200">Your Invite Link</label>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white">{referralCode}</span>
        </div>

        <div className="flex items-center gap-2 p-1.5 pl-3.5 rounded-2xl border mb-3 bg-black/30 border-white/10">
          <span className="flex-1 text-[13px] font-semibold truncate text-zinc-100">
            {referralLink}
          </span>
          <button
            onClick={handleCopy}
            className={`h-10 shrink-0 px-4 rounded-xl font-black uppercase text-[11px] tracking-wider transition-all flex items-center gap-1.5 active:scale-95 ${
              copied
                ? 'bg-emerald-400 text-emerald-950'
                : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
            }`}
          >
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#25D366] text-[#06330f] font-black text-[11px] uppercase tracking-wider hover:brightness-110 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 h-11 rounded-xl font-black text-[11px] uppercase tracking-wider bg-white/10 text-white border border-white/15 hover:bg-white/15 transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {pendingIndirect > 0 && (
          <div className="bg-[#064e3b] rounded-3xl p-5 border border-emerald-400/30 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                  <p className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">Team Commission Ready</p>
                  <p className="text-xs text-zinc-300 mt-0.5">Tap below to add it to your balance</p>
              </div>
              <p className="text-2xl font-black text-white">Rs {pendingIndirect?.toLocaleString() || 0}</p>
            </div>
            <button
                onClick={onClaimIndirect}
                className="w-full bg-emerald-500 text-emerald-950 py-3.5 rounded-xl font-black text-sm active:scale-95 transition-all"
            >
                Claim Now
            </button>
          </div>
      )}

      {/* Team network */}
      <div>
        <h3 className="text-base font-black tracking-tight text-white mb-3">
          Team <span className="text-emerald-400">Network</span>
        </h3>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
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

            return (
              <button
                key={lvl}
                onClick={() => setActiveTab(lvl)}
                className={`flex flex-col items-center py-3.5 px-2 rounded-2xl border transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'border-emerald-400/60 bg-[#064e3b]'
                    : 'border-white/10 bg-[#06382b] hover:border-white/20'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-emerald-300' : 'text-zinc-300'}`}>
                  Level {lvl.replace('L', '')}
                </span>
                <span className="text-xl font-black text-white mt-1">
                  Rs {amount}<span className="text-[10px] font-bold text-zinc-300"> /member</span>
                </span>
                <span className="text-[11px] font-semibold text-zinc-200 mt-1.5">
                  Earned <span className="text-emerald-400 font-black">Rs {totalEarning.toLocaleString()}</span>
                </span>
                <span className={`flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/15 text-white' : 'bg-white/5 text-zinc-300'
                }`}>
                  <UsersRound className="w-3 h-3" /> {count} members
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5">
          {loadingTree ? (
            <div className="rounded-3xl p-10 text-center border border-dashed bg-[#06382b] border-white/15">
              <Sparkles className="w-8 h-8 mx-auto mb-2.5 text-emerald-400 animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-wider text-zinc-200">Loading your team…</p>
            </div>
          ) : activeData.length === 0 ? (
            <div className="rounded-3xl p-10 text-center border border-dashed bg-[#06382b] border-white/15">
              <UsersRound className="w-8 h-8 mx-auto mb-2.5 text-zinc-400" />
              <p className="text-[11px] font-black uppercase tracking-wider text-zinc-200">No members in this level yet</p>
              <p className="text-xs text-zinc-400 mt-1.5">Share your invite link to grow your team.</p>
            </div>
          ) : (
            activeData.map((r: any, idx: number) => {
              const isPaid = r.status?.toLowerCase() === 'paid' || r.status?.toLowerCase() === 'active' || r.status?.toLowerCase() === 'approved';
              return (
              <motion.div
                key={r.id || idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                className="p-3.5 rounded-2xl border flex items-center justify-between bg-[#06382b] border-white/10"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${isPaid ? 'bg-emerald-500 text-emerald-950' : 'bg-white/10 text-zinc-200 border border-white/10'}`}>
                    {r.name ? r.name.substring(0, 1).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold tracking-tight truncate text-zinc-50">
                      {r.name || 'Anonymous User'}
                    </h4>
                    <span className="text-[11px] font-medium flex items-center gap-1 text-zinc-400">
                      <Clock className="w-3 h-3" /> Joined {formatDate(r.timestamp) || 'recently'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isPaid ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                        Active
                      </span>
                      <span className="text-[13px] font-black text-white">
                        +Rs {activeTab === 'L1' ? (r.commission || currentBonus) : activeTab === 'L2' ? 15 : 10}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-zinc-300 border border-white/15">
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
