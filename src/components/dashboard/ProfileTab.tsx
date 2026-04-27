import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { ChevronRight, Star, BarChart3, Image as ImageIcon, Wallet, Mail, Fingerprint, Briefcase, Users, FileText, MessageSquare, Info, Shield, FileCheck, LogOut, Crown, CheckCircle2, AlertCircle, Clock, History, Keyboard, Video, Database, Headphones, PenTool, Sparkles, Bot } from 'lucide-react';

import { DynamicAvatar } from '../ui/DynamicAvatar';

export default function ProfileTab({ 
  name, 
  email, 
  gender,
  profileAvatarId,
  status, 
  role, 
  partnerTier = 'basic',
  balance, 
  lockedBalance, 
  totalIndirectCommission = 0,
  joiningDate, 
  referralCode, 
  onEditProfile, 
  onLeaderboardClick, 
  onManageWalletClick, 
  onPartnerUpgradeClick, 
  onEarningHistoryClick,
  onActivateClick,
  onMailboxClick,
  onProductDrawClick,
  onSupportAIClick,
  appSettings,
  accountNumber,
  accountTitle
}: { 
  name: string, 
  email: string, 
  gender?: string,
  profileAvatarId?: string,
  status: string, 
  role: string, 
  partnerTier?: string,
  balance: number, 
  lockedBalance: number, 
  totalIndirectCommission?: number,
  joiningDate: string, 
  referralCode: string, 
  onEditProfile?: () => void, 
  onLeaderboardClick?: () => void, 
  onManageWalletClick?: () => void, 
  onPartnerUpgradeClick?: () => void, 
  onEarningHistoryClick?: () => void,
  onActivateClick?: () => void,
  onMailboxClick?: () => void,
  onProductDrawClick?: () => void,
  onSupportAIClick?: () => void,
  appSettings?: any,
  accountNumber?: string,
  accountTitle?: string
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showJobsModal, setShowJobsModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('taskmint_is_logged_in');
      localStorage.removeItem('taskmint_name');
      localStorage.removeItem('taskmint_email');
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.delete();
        localStorage.clear();
        navigate('/login');
      }
    } catch (error: any) {
      console.error("Delete account error:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Please log out and log back in to delete your account.");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    }
  };

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3 px-1">{title}</h3>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {children}
      </div>
    </div>
  );

  const Item = ({ icon, label, hasToggle = false, isDestructive = false, onClick }: any) => (
    <div onClick={onClick} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600'}`}>
          {icon}
        </div>
        <span className={`text-sm font-bold ${isDestructive ? 'text-red-500' : 'text-slate-700'}`}>{label}</span>
      </div>
      {hasToggle ? (
        <div className="w-10 h-6 bg-slate-200 rounded-full relative">
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
        </div>
      ) : (
        <ChevronRight className={`w-4 h-4 ${isDestructive ? 'text-red-300' : 'text-slate-300'}`} />
      )}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24"
    >
      
      {/* Profile Completion Alert */}
      {(!name || !gender || status.toLowerCase() !== 'active') && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-tighter">Complete Profile (Alert)</h4>
              <p className="text-[11px] font-bold text-amber-700/70 mb-3">Please fill all details including Gender & Withdrawal Account to use all features.</p>
              <button 
                onClick={onEditProfile}
                className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-amber-600/20 active:scale-95 transition-all"
              >
                Fix Now
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Activation Status Indicator - Moved from Invite Tab */}
      {status.toLowerCase() !== 'active' && (
        <div className="mb-6 p-4 rounded-2xl flex items-center justify-between border-2 bg-red-50 border-red-100 text-red-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Account Status</p>
              <p className="text-sm font-bold">Inactive</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={onActivateClick}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              Pay Rs {appSettings?.activationFee || 100} to Start
            </button>
          </div>
        </div>
      )}

      {/* Profile Header: Digital Identity Card */}
      <div className="px-5 mb-5 mt-2">
        <div className={`relative rounded-[1.5rem] p-3 overflow-hidden shadow-2xl transition-all duration-700 group hover:scale-[1.02] ${
            role === 'partner' 
            ? partnerTier === 'gold'
                ? 'bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-amber-500/20 shadow-amber-500/5'
                : 'bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-blue-500/20 shadow-blue-500/5'
            : 'bg-gradient-to-br from-[#1E3A8A] via-[#312E81] to-[#1E1B4B] border border-white/5 shadow-indigo-500/10'
        }`}>
            {/* Holographic Overlays */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -ml-16 -mb-16 animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Card Content */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/5 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10 flex items-center gap-1.5">
                            <Fingerprint className="w-3 h-3 text-amber-500" />
                            <span className="text-[9px] font-black text-white tracking-widest">{referralCode}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg border ${
                             status.toLowerCase() === 'active' ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'
                         }`}>
                             <div className={`w-1 h-1 rounded-full animate-pulse ${
                                 status.toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                             }`} />
                             <span className="text-[8px] font-black uppercase tracking-widest">{status}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-3 w-full pl-2 pr-2 mb-1">
                    <div className="relative group-hover:rotate-3 transition-transform duration-500 shrink-0">
                        <div className={`w-12 h-12 rounded-xl p-0.5 shadow-xl transition-all duration-500 ${
                            role === 'partner'
                                ? partnerTier === 'gold'
                                    ? 'bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600'
                                    : 'bg-gradient-to-tr from-blue-500 via-indigo-600 to-blue-700'
                                : 'bg-gradient-to-tr from-indigo-500 via-purple-600 to-indigo-700'
                        }`}>
                            <div className="w-full h-full rounded-[10px] overflow-hidden bg-[#0F172A] flex items-center justify-center border border-black/20">
                                <DynamicAvatar avatarId={profileAvatarId} fallbackText={name} className="w-full h-full" />
                            </div>
                        </div>
                        <button 
                            onClick={onEditProfile}
                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded flex items-center justify-center shadow-lg text-slate-900 border border-black/5 active:scale-90 transition-all hover:bg-amber-100 hover:text-amber-600"
                        >
                            <PenTool className="w-2.5 h-2.5" />
                        </button>
                    </div>

                    <div className="flex flex-col text-left flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-black text-white italic tracking-tighter uppercase mb-0.5 drop-shadow-lg truncate">
                            {name.toLowerCase()}
                        </h2>
                        
                        <div className="flex flex-row items-center gap-2">
                            <p className="text-[9px] font-bold text-white/60 flex items-center gap-1">
                                {role === 'partner' ? <Crown className="w-2.5 h-2.5 text-amber-500" /> : <Users className="w-2.5 h-2.5 text-indigo-400" />}
                                <span className="uppercase tracking-widest text-[#cbd5e1]">{role}</span>
                            </p>
                            <div className="h-2.5 w-px bg-white/20"></div>
                            <p className="text-[9px] font-bold text-white/60 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span className="tracking-wide">Since {joiningDate ? (joiningDate.includes('T') ? new Date(joiningDate).toLocaleDateString([], { month: 'short', year: 'numeric' }) : joiningDate) : '2024'}</span>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>

      <Section title="Wallet Intelligence">
        <div className="col-span-2 p-4 relative overflow-hidden group cursor-pointer" onClick={onManageWalletClick}>
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-center relative z-10 w-full mb-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 border border-slate-200/50 bg-slate-50 px-2 py-0.5 rounded-full">
                    <Wallet className="w-2.5 h-2.5" /> Liquid Balance
                  </p>
                  <BarChart3 className="w-5 h-5 text-emerald-600/50" />
            </div>
            <div className="relative z-10">
                  <p className="text-3xl font-black text-emerald-600 tracking-tighter flex items-baseline gap-1.5 italic -ml-0.5">
                    {balance?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} 
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest not-italic">PKR</span>
                  </p>
            </div>
        </div>
        <Item icon={<History className="w-4 h-4" />} label="Digital Yield Ledger" onClick={onEarningHistoryClick} />
        {lockedBalance > 0 && (
          <div className="p-6 bg-amber-50/20 border-t border-amber-100/30 flex justify-between items-center group">
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Locked Distribution
                </p>
                <p className="text-2xl font-black text-amber-600 italic tracking-tighter">Rs {lockedBalance?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                <div className="flex items-center gap-2 mt-2 bg-amber-500/10 px-3 py-1 rounded-lg w-fit border border-amber-500/10">
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest">Protocol Stake Active</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:rotate-12 transition-transform">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
          </div>
        )}
      </Section>

      <Section title="Rank & Progression">
        <Item icon={<BarChart3 className="w-4 h-4" />} label="Top Earners Leaderboard" onClick={onLeaderboardClick} />
        {role !== 'partner' && (
          <Item 
            icon={<Crown className="w-4 h-4 text-amber-500" />} 
            label="Upgrade to Partner" 
            onClick={onPartnerUpgradeClick} 
          />
        )}
      </Section>


      <Section title="Account">
        <Item icon={<ImageIcon className="w-4 h-4" />} label="Change Avatar" onClick={onEditProfile} />
        <Item icon={<Wallet className="w-4 h-4" />} label="Manage Wallet & PIN" onClick={onManageWalletClick} />
        <Item icon={<Mail className="w-4 h-4" />} label="System Mailbox" onClick={onMailboxClick} />
      </Section>

      <Section title="Features">
        <Item 
          icon={<Briefcase className="w-4 h-4" />} 
          label="Premium Jobs" 
          onClick={() => setShowJobsModal(true)}
        />
        <Item 
          icon={<Sparkles className="w-4 h-4" />} 
          label="Product Draws" 
          onClick={onProductDrawClick}
        />
      </Section>

      <Section title="Support">
        <Item icon={<Headphones className="w-4 h-4 text-blue-600" />} label="Live Support Chat" onClick={onSupportAIClick} />
        <Item icon={<LogOut className="w-4 h-4" />} label="Log Out" isDestructive onClick={handleLogout} />
        <Item icon={<AlertCircle className="w-4 h-4" />} label="Delete Account" isDestructive onClick={() => setShowDeleteModal(true)} />
      </Section>

      {/* Premium Jobs Modal */}
      {showJobsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Premium Jobs</h3>
              </div>
              <button onClick={() => setShowJobsModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <LogOut className="w-5 h-5 text-slate-400 rotate-180" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Video Editor', icon: <Video className="w-4 h-4" />, color: 'blue' },
                { label: 'Personal Assistant', icon: <Headphones className="w-4 h-4" />, color: 'indigo' },
                { label: 'Content Writing', icon: <PenTool className="w-4 h-4" />, color: 'purple' },
                { label: 'Data Entry', icon: <Database className="w-4 h-4" />, color: 'emerald' },
                { label: 'Typing Expert', icon: <Keyboard className="w-4 h-4" />, color: 'amber' },
              ].map((job, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group opacity-60">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm text-slate-600`}>
                      {job.icon}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{job.label}</span>
                  </div>
                  <div className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider">
                    COMING SOON
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowJobsModal(false)}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl active:scale-95 transition-all shadow-lg shadow-slate-900/20"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl"
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Delete Account?</h3>
            <p className="text-sm text-center text-slate-500 mb-6">
              This action is permanent and cannot be undone. All your earnings, referrals, and data will be lost forever.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
