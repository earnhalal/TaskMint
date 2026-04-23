import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Crown, 
  Star,
  Settings,
  Database,
  PieChart,
  Target,
  Rocket,
  ArrowRight,
  Wallet,
  Ticket,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Search
} from 'lucide-react';
import { DynamicAvatar } from '../ui/DynamicAvatar';
import { doc, getDoc, updateDoc, serverTimestamp, increment, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface PartnerToolsViewProps {
  onBack: () => void;
  role: string;
  partnerTier: string;
  onGoToWithdraw: () => void;
  onGoToLottery: () => void;
  referrals: any[];
  referralStats: any;
  onApproveMember: (userId: string, depositId?: string) => Promise<void>;
}

export default function PartnerToolsView({ 
  onBack, 
  role, 
  partnerTier, 
  onGoToWithdraw, 
  onGoToLottery,
  referrals,
  referralStats,
  onApproveMember
}: PartnerToolsViewProps) {
  const isPartner = role === 'partner';
  const isSilver = partnerTier === 'silver' || partnerTier === 'gold';
  const isGold = partnerTier === 'gold';

  const [activeTab, setActiveTab] = useState<'list' | 'analytics' | 'approvals'>('list');
  const [claimStatus, setClaimStatus] = useState<'idle' | 'claiming' | 'success' | 'already_claimed'>('idle');
  const [userData, setUserData] = useState<any>(null);
  const [pendingActivations, setPendingActivations] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    };
    fetchUser();
  }, []);

  // Fetch pending activations for referrals
  useEffect(() => {
    if (!isPartner || !isSilver || activeTab !== 'approvals') return;

    setLoadingApprovals(true);
    const q = query(
      collection(db, 'deposits'), 
      where('status', '==', 'pending'),
      where('type', '==', 'activation')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter only those who are referred by this partner
      const myTeamPending = allPending.filter((dep: any) => 
        referrals?.some(ref => ref.userId === dep.userId)
      );
      setPendingActivations(myTeamPending);
      setLoadingApprovals(false);
    });

    return () => unsubscribe();
  }, [isPartner, isSilver, activeTab, referrals]);

  const handleClaimTickets = async () => {
    if (!auth.currentUser || claimStatus === 'claiming') return;
    
    setClaimStatus('claiming');
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
      
      if (userData?.lastTicketClaimMonth === currentMonth) {
        setClaimStatus('already_claimed');
        setTimeout(() => setClaimStatus('idle'), 3000);
        return;
      }

      const ticketsToGrant = isGold ? 5 : 2;
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        freeLotteryTickets: (userData?.freeLotteryTickets || 0) + ticketsToGrant,
        lastTicketClaimMonth: currentMonth,
        updatedAt: serverTimestamp()
      });

      setUserData({
        ...userData,
        freeLotteryTickets: (userData?.freeLotteryTickets || 0) + ticketsToGrant,
        lastTicketClaimMonth: currentMonth
      });
      
      setClaimStatus('success');
      setTimeout(() => setClaimStatus('idle'), 5000);
    } catch (e) {
      console.error("Error claiming tickets:", e);
      setClaimStatus('idle');
    }
  };

  const handleApprove = async (userId: string, depositId: string) => {
    if (!window.confirm("Approve this member activation?")) return;
    try {
      await onApproveMember(userId, depositId);
      // Logic handled via firestore snapshot listener
    } catch (error) {
      console.error("Error approving member:", error);
      alert("Failed to approve member.");
    }
  };

  const tools = [
    {
      id: 'instant-withdraw',
      name: 'Instant Withdrawal',
      description: 'Your withdrawals are processed with priority (1-10 mins).',
      icon: <Wallet className="w-6 h-6" />,
      minTier: 'silver',
      unlocked: isPartner && isSilver,
      color: 'from-blue-600 to-indigo-700',
      action: onGoToWithdraw,
      actionText: 'Go to Wallet'
    },
    {
      id: 'free-tickets',
      name: 'Monthly Free Tickets',
      description: `Claim your monthly ${isGold ? '5' : '2'} free lottery tickets.`,
      icon: <Ticket className="w-6 h-6" />,
      minTier: 'silver',
      unlocked: isPartner && isSilver,
      color: 'from-purple-600 to-pink-700',
      action: handleClaimTickets,
      actionText: claimStatus === 'claiming' ? 'Claiming...' : 
                  claimStatus === 'success' ? 'Claimed!' : 
                  claimStatus === 'already_claimed' ? 'Already Claimed' : 'Claim Now'
    },
    {
      id: 'analytics',
      name: 'Team Analytics',
      description: 'Detailed insights of your referral team earnings and activity.',
      icon: <BarChart3 className="w-6 h-6" />,
      minTier: 'silver',
      unlocked: isPartner && isSilver,
      color: 'from-blue-500 to-indigo-600',
      action: () => setActiveTab('analytics'),
      actionText: 'View Stats'
    },
    {
      id: 'approval',
      name: 'Quick Member Approval',
      description: 'Approve your team memberships directly for faster growth.',
      icon: <Users className="w-6 h-6" />,
      minTier: 'silver',
      unlocked: isPartner && isSilver,
      color: 'from-emerald-500 to-teal-600',
      action: () => setActiveTab('approvals'),
      actionText: 'Manage Team'
    },
    {
      id: 'extraction',
      name: 'Auto Task Extraction',
      description: 'Automatically extracts best paying tasks for your dashboard.',
      icon: <Zap className="w-6 h-6" />,
      minTier: 'gold',
      unlocked: isPartner && isGold,
      color: 'from-amber-400 to-orange-600',
      action: () => alert("Auto Task Extraction enabled."),
      actionText: 'Config Engine'
    }
  ];

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Team</p>
          <p className="text-2xl font-black text-slate-900 italic">{referralStats?.totalReferrals || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Team</p>
          <p className="text-2xl font-black text-emerald-600 italic">{referralStats?.activeMembers || 0}</p>
        </div>
      </div>
      
      <div className="bg-[#0A0B0F] p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Estimated Commissions</p>
            <p className="text-2xl font-black text-white italic tracking-tight">Rs {(referralStats?.totalEarnings || 0).toLocaleString()}</p>
          </div>
          <TrendingUp className="w-10 h-10 text-indigo-500/20" />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest px-1 italic">Recent Team Activity</h4>
        <div className="space-y-2">
          {referrals?.slice(0, 10).map((ref, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                   <DynamicAvatar avatarId={ref.avatarId} fallbackText={ref.name} className="w-full h-full" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 italic">{ref.name || 'Member'}</p>
                  <p className="text-[9px] font-bold text-slate-400">Level {ref.level || 1} Referral</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-600 italic">Rs {ref.earnings || 0}</p>
                <p className={`text-[8px] font-black uppercase tracking-widest ${ref.status === 'active' ? 'text-indigo-500' : 'text-slate-300'}`}>
                  {ref.status || 'Inactive'}
                </p>
              </div>
            </div>
          ))}
          {(!referrals || referrals.length === 0) && (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400">No team members yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Pending Activations</h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Team Priority Queue</p>
        </div>
        <div className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
           <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{pendingActivations.length} Pending</span>
        </div>
      </div>

      <div className="space-y-3">
        {pendingActivations.map((dep, idx) => (
          <motion.div 
            key={dep.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:border-emerald-100 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 border border-amber-100">
                   <Clock className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs font-black text-slate-800 italic uppercase">{dep.userName || 'Member'}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Account Activation Request</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-900 italic">Rs {dep.amount}</p>
                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{dep.method}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100/50">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Transcription / Proof</p>
               <p className="text-[11px] font-bold text-slate-600 break-all">{dep.transactionId || 'No Transaction ID provided'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button 
                onClick={() => handleApprove(dep.userId, dep.id)}
                className="bg-emerald-500 text-white rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <CheckCircle2 className="w-4 h-4" /> Approve
               </button>
               <button className="bg-slate-100 text-slate-400 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
                 <XCircle className="w-4 h-4" /> Reject
               </button>
            </div>
          </motion.div>
        ))}

        {pendingActivations.length === 0 && !loadingApprovals && (
           <div className="py-20 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                <Users className="w-8 h-8 text-slate-200" />
             </div>
             <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">All clear! No pending activations.</p>
           </div>
        )}

        {loadingApprovals && (
           <div className="py-12 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              Scanning Network...
           </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto pb-24"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={activeTab === 'list' ? onBack : () => setActiveTab('list')}
            className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">
              {activeTab === 'list' ? 'Partner Tools' : activeTab === 'analytics' ? 'Team Analytics' : 'Quick Approvals'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Management Dashboard</p>
          </div>
        </div>
        <div className="bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
           <div className="flex items-center gap-2">
             <Crown className="w-3.5 h-3.5 text-amber-500" />
             <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{partnerTier?.toUpperCase() || 'BASIC'}</span>
           </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 gap-4"
          >
            {tools.map((tool) => (
              <motion.div
                key={tool.id}
                whileHover={tool.unlocked ? { scale: 1.02 } : {}}
                whileTap={tool.unlocked ? { scale: 0.98 } : {}}
                className={`relative p-5 rounded-[2rem] border overflow-hidden transition-all ${
                  tool.unlocked 
                    ? 'bg-white border-slate-100 shadow-xl shadow-slate-200/50' 
                    : 'bg-slate-100/50 border-slate-200 opacity-80'
                }`}
              >
                {!tool.unlocked && (
                  <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                    <div className="bg-white/90 p-3 rounded-2xl shadow-xl flex items-center gap-2 mb-2 scale-90 sm:scale-100">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Locked for {tool.minTier.toUpperCase()}</span>
                    </div>
                    <button className="text-[9px] font-black text-amber-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Upgrade to Unlock</button>
                  </div>
                )}

                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0`}>
                    <div className="absolute inset-0 bg-white/20 transform -translate-x-1/2 -translate-y-1/2 rotate-45 h-32 w-8 blur-md"></div>
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black text-slate-800 text-sm italic tracking-tight">{tool.name}</h3>
                      {tool.unlocked && (
                        <div className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-md">Unlocked</div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{tool.description}</p>
                    
                    {tool.unlocked && (
                      <button 
                        onClick={tool.action}
                        className="mt-4 flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest group"
                      >
                        {tool.actionText} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'analytics' && (
           <motion.div 
             key="analytics"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
           >
             {renderAnalytics()}
           </motion.div>
        )}

        {activeTab === 'approvals' && (
           <motion.div 
             key="approvals"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
           >
             {renderApprovals()}
           </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'list' && (
        <div className="mt-8 p-6 bg-[#0A0B0F] rounded-[2.5rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-5 h-5 text-amber-500" />
              <h4 className="text-white font-black italic tracking-tighter uppercase">Power Up Your Team</h4>
            </div>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed mb-6">
              Higher tiers unlock exclusive management tools that help you scale your referral income by 300%. Start upgrading now to access advanced automation.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0B0F] bg-slate-800 flex items-center justify-center overflow-hidden">
                    <DynamicAvatar avatarId="" fallbackText={`Partner ${i}`} className="w-full h-full" />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-[#0A0B0F] bg-amber-500 flex items-center justify-center text-[10px] font-black text-white">
                  +12k
                </div>
              </div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Partners Active</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
