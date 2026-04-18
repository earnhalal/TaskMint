import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { ChevronRight, Star, BarChart3, Image as ImageIcon, Wallet, Mail, Fingerprint, Briefcase, Users, FileText, MessageSquare, Info, Shield, FileCheck, LogOut, Crown, CheckCircle2, AlertCircle, Clock, History } from 'lucide-react';

export default function ProfileTab({ 
  name, 
  email, 
  status, 
  role, 
  partnerTier = 'basic',
  balance, 
  lockedBalance, 
  accountNumber, 
  accountTitle, 
  joiningDate, 
  referralCode, 
  onEditProfile, 
  onLeaderboardClick, 
  onManageWalletClick, 
  onPartnerUpgradeClick, 
  onAdminPanelClick,
  onEarningHistoryClick,
  onActivateClick,
  appSettings
}: { 
  name: string, 
  email: string, 
  status: string, 
  role: string, 
  partnerTier?: string,
  balance: number, 
  lockedBalance: number, 
  accountNumber: string, 
  accountTitle: string, 
  joiningDate: string, 
  referralCode: string, 
  onEditProfile?: () => void, 
  onLeaderboardClick?: () => void, 
  onManageWalletClick?: () => void, 
  onPartnerUpgradeClick?: () => void, 
  onAdminPanelClick?: () => void,
  onEarningHistoryClick?: () => void,
  onActivateClick?: () => void,
  appSettings?: any
}) {
  const { user } = useAuth();
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    setAvatar(localStorage.getItem('taskmint_avatar'));
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('taskmint_avatar', base64String);
        setAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

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
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
      
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

      {/* Profile Header */}
      <div className={`relative rounded-[32px] p-8 mb-8 overflow-hidden shadow-2xl transition-all duration-500 group ${
        role === 'partner' 
          ? partnerTier === 'gold'
            ? 'bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] border border-amber-500/30'
            : 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-blue-500/30'
          : 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900'
      }`}>
        {/* Animated Background Glow */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse ${
          role === 'partner' 
            ? partnerTier === 'gold' ? 'bg-amber-400' : 'bg-blue-400'
            : 'bg-blue-400'
        }`}></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-105 duration-500 p-1 ${
              role === 'partner'
                ? partnerTier === 'gold'
                  ? 'bg-gradient-to-tr from-amber-400 to-yellow-600 shadow-amber-500/40'
                  : 'bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-blue-500/40'
                : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30'
            }`}>
              <div className={`w-full h-full rounded-2xl flex items-center justify-center text-white text-3xl font-black overflow-hidden ${
                role === 'partner' ? 'bg-transparent' : 'bg-slate-900'
              }`}>
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  role === 'partner' 
                    ? partnerTier === 'gold' ? <Crown className="w-12 h-12" /> : <Shield className="w-12 h-12" />
                    : name.substring(0, 2).toUpperCase()
                )}
              </div>
            </div>
            {status.toLowerCase() === 'active' && (
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center border-2 shadow-lg ${
                role === 'partner'
                  ? partnerTier === 'gold' ? 'bg-amber-500 border-[#1a1a1a]' : 'bg-blue-500 border-[#0f172a]'
                  : 'bg-emerald-500 border-slate-900'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-3xl font-black text-white tracking-tight">{name}</h2>
                {role === 'partner' && (
                  partnerTier === 'gold' ? (
                    <div className="bg-amber-500 p-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                      <Star className="w-3 h-3 text-white fill-current" />
                    </div>
                  ) : (
                    <div className="bg-blue-500 p-1 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                      <CheckCircle2 className="w-3 h-3 text-white fill-current" />
                    </div>
                  )
                )}
              </div>
              <p className="text-sm font-medium text-blue-200 mb-4 opacity-80">{email}</p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                  ID: <span className={role === 'partner' ? partnerTier === 'gold' ? 'text-amber-400' : 'text-blue-400' : 'text-amber-400'}>{referralCode}</span>
                </div>
                {role === 'partner' ? (
                  partnerTier === 'gold' ? (
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-600 border border-amber-300/50 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-[0_0_20px_rgba(245,158,11,0.6)] uppercase tracking-wider">
                      <Crown className="w-3.5 h-3.5 text-white" />
                      Gold VIP
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 border border-blue-400/50 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-[0_0_20px_rgba(59,130,246,0.6)] uppercase tracking-wider">
                      <Shield className="w-3.5 h-3.5 text-white" />
                      Silver Partner
                    </div>
                  )
                ) : status.toLowerCase() === 'active' ? (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </div>
                ) : status.toLowerCase() === 'pending' ? (
                    <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      <Users className="w-3.5 h-3.5" />
                      Member
                    </div>
                  )}
                  {joiningDate && (
                      <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        Joined: {joiningDate}
                      </div>
                  )}
              </div>
            </div>
          </div>
          <button onClick={onEditProfile} className="hidden sm:block text-xs font-black text-white bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl hover:bg-white/20 transition-colors shadow-lg">
            Edit
          </button>
        </div>
      </div>

      <Section title="Wallet Overview">
        <div className="p-4 border-b border-slate-50 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Available Balance</p>
              <p className="text-lg font-black text-emerald-600">{balance?.toLocaleString() || 0} PKR</p>
            </div>
            <Wallet className="w-5 h-5 text-emerald-500" />
        </div>
        <Item icon={<History className="w-4 h-4 text-slate-600" />} label="Earning History" onClick={onEarningHistoryClick} />
        {lockedBalance > 0 && (
          <div className="p-4 flex justify-between items-center bg-amber-50/30">
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Locked Balance</p>
                <p className="text-lg font-black text-amber-600">{lockedBalance?.toLocaleString() || 0} PKR</p>
                <p className="text-[9px] text-amber-500 font-medium">Invite friends to unlock!</p>
              </div>
              <Clock className="w-5 h-5 text-amber-500" />
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
        {role === 'admin' && (
          <Item 
            icon={<Shield className="w-4 h-4 text-slate-900" />} 
            label="Admin Control Panel" 
            onClick={onAdminPanelClick} 
          />
        )}
      </Section>

      <Section title="Withdrawal Account">
        <div className="p-4 border-b border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Title</p>
            <p className="text-sm font-bold text-slate-900">{accountTitle || 'Not Set'}</p>
        </div>
        <div className="p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Number</p>
            <p className="text-sm font-bold text-slate-900 font-mono">{accountNumber || 'Not Set'}</p>
        </div>
      </Section>

      <Section title="Account">
        <Item icon={<ImageIcon className="w-4 h-4" />} label="Change Avatar" onClick={() => fileInputRef.current?.click()} />
        <Item icon={<Wallet className="w-4 h-4" />} label="Manage Wallet & PIN" onClick={onManageWalletClick} />
        <Item icon={<Mail className="w-4 h-4" />} label="System Mailbox" />
      </Section>

      <Section title="Features">
        <Item icon={<Briefcase className="w-4 h-4" />} label="Premium Jobs" />
      </Section>

      <Section title="Support">
        <Item icon={<LogOut className="w-4 h-4" />} label="Log Out" isDestructive onClick={handleLogout} />
        <Item icon={<AlertCircle className="w-4 h-4" />} label="Delete Account" isDestructive onClick={() => setShowDeleteModal(true)} />
      </Section>

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
