import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { ChevronRight, Star, BarChart3, Image as ImageIcon, Wallet, Mail, Fingerprint, Briefcase, Users, FileText, MessageSquare, Info, Shield, FileCheck, LogOut, Crown, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileTab({ name, email, status, accountNumber, accountTitle, joiningDate, onEditProfile, onLeaderboardClick, onManageWalletClick }: { name: string, email: string, status: string, accountNumber: string, accountTitle: string, joiningDate: string, onEditProfile?: () => void, onLeaderboardClick?: () => void, onManageWalletClick?: () => void }) {
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('taskmint_is_logged_in');
      localStorage.removeItem('taskmint_name');
      localStorage.removeItem('taskmint_email');
      navigate('/auth');
    } catch (error) {
      console.error("Logout error:", error);
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
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xl font-bold shadow-md overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white">
              1
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{name}</h2>
            <p className="text-xs text-slate-500 mb-2">{email}</p>
            <div className="flex flex-wrap gap-2">
                {status === 'Active' ? (
                  <div className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-sm">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    Verified Account
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 bg-[#0F172A] text-white px-2.5 py-1 rounded-md text-[10px] font-bold">
                    <Crown className="w-3 h-3 text-yellow-400" />
                    Member
                  </div>
                )}
                {joiningDate && (
                    <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold">
                      Joined: {joiningDate}
                    </div>
                )}
            </div>
          </div>
        </div>
        <button onClick={onEditProfile} className="text-xs font-bold text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors">
          Edit Info
        </button>
      </div>

      <Section title="Rank & Progression">
        <Item icon={<BarChart3 className="w-4 h-4" />} label="Top Earners Leaderboard" onClick={onLeaderboardClick} />
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
      </Section>
    </motion.div>
  );
}
