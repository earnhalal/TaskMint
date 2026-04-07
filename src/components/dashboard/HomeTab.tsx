import React, { useMemo } from 'react';
import { 
    UserPlus as InviteIcon, 
    CheckSquare as DocumentCheckIcon, 
    Sparkles as SparklesIcon, 
    Clock as EarnIcon, 
    ArrowRight, 
    Wallet as WalletIcon, 
    Gift as GiftIcon, 
    PlusCircle as PlusCircleIcon, 
    PlayCircle as PlayCircleIcon, 
    RefreshCw as ExchangeIcon,
    Ticket as TicketIcon,
    Calendar as CalendarIcon,
    Trophy,
    AlertTriangle,
    Clock,
    CheckCircle2
} from 'lucide-react';

interface HomeTabProps {
  name: string;
  balance: number;
  accountStatus: string;
  role: string;
  topEarners: any[];
  onSpinClick: () => void;
  onInviteClick: () => void;
  onDepositClick: () => void;
  onWithdrawClick: () => void;
  onWatchAdsClick: () => void;
  onTasksClick: () => void;
  onProfileClick: () => void;
  onLotteryClick: () => void;
  onStreakClick: () => void;
  onLeaderboardClick: () => void;
  onPartnerUpgradeClick: () => void;
  appSettings: {
    activationFee: number;
  };
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; bgClass: string; iconColor: string; delay: number }> = ({ icon, label, value, bgClass, iconColor, delay }) => (
    <div 
        className={`p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start justify-between min-h-[100px] ${bgClass} transition-all duration-300 hover:shadow-amber-500/20 hover:-translate-y-1 animate-fade-in-up`}
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`p-2.5 rounded-xl bg-white shadow-sm ${iconColor} mb-2`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
    </div>
);

const QuickActionBtn: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    onClick: () => void; 
    colorClass: string; 
    delay: number;
    isHighlight?: boolean;
}> = ({ icon, label, onClick, colorClass, delay, isHighlight }) => (
    <button 
        onClick={onClick} 
        className="flex flex-col items-center gap-2 group animate-fade-in-up w-full"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:scale-105 group-active:scale-95 ${colorClass} ${isHighlight ? 'ring-2 ring-red-100' : 'ring-2 ring-white ring-opacity-50'}`}>
            {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
        </div>
        <span className={`text-[10px] sm:text-xs font-bold transition-colors ${isHighlight ? 'text-red-700' : 'text-slate-600 group-hover:text-slate-900'}`}>{label}</span>
    </button>
);

export default function HomeTab({ 
  name, 
  balance, 
  accountStatus,
  role,
  topEarners,
  onSpinClick, 
  onInviteClick, 
  onDepositClick, 
  onWithdrawClick, 
  onWatchAdsClick, 
  onTasksClick, 
  onProfileClick, 
  onLotteryClick, 
  onStreakClick,
  onLeaderboardClick,
  onPartnerUpgradeClick,
  appSettings
}: HomeTabProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const [avatar, setAvatar] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAvatar(localStorage.getItem('taskmint_avatar'));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-24 font-sans">
      
      {/* Account Status Alert for Inactive Users */}
      {accountStatus.toLowerCase() === 'inactive' && (
        <div 
          onClick={onInviteClick}
          className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-red-100 transition-colors group animate-bounce-small"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-red-700">Account Inactive</p>
              <p className="text-[10px] text-red-600/80 font-bold">Pay Rs {appSettings.activationFee} to start earning!</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      {/* Account Status Alert for Pending Users */}
      {accountStatus.toLowerCase() === 'pending' && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between group animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-700">Activation Pending</p>
              <p className="text-[10px] text-amber-600/80 font-bold">Admin is verifying your payment.</p>
            </div>
          </div>
        </div>
      )}

      {/* Partner Program Banner */}
      {role !== 'partner' && accountStatus.toLowerCase() === 'active' && (
        <div 
          onClick={onPartnerUpgradeClick}
          className="bg-gradient-to-r from-[#060D2D] to-[#151E32] border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:brightness-110 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-400">Partner Program</p>
              <p className="text-[10px] text-slate-400 font-bold">Earn 10% Team Commission!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Upgrade</span>
            <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
          <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{getGreeting()},</p>
              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter">{name}</h1>
                {status === 'Active' && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-600/10" />
                )}
              </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Leaderboard Button */}
              <button 
                  onClick={onLeaderboardClick}
                  className="flex-1 md:flex-none bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 border border-amber-400"
              >
                  <Trophy className="w-4 h-4 text-white"/> 
                  Leaderboard
              </button>

              {/* Profile Pic */}
              <div className="relative cursor-pointer group flex-shrink-0" onClick={onProfileClick}>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-br from-amber-300 to-yellow-600 shadow-md hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                      <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center text-slate-800 font-bold">
                        {avatar ? (
                          <img 
                              src={avatar} 
                              alt="Profile" 
                              className="w-full h-full object-cover rounded-full bg-gray-50" 
                          />
                        ) : (
                          name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Compact Premium Balance Card */}
      <div className="relative w-full rounded-[24px] p-5 text-white shadow-xl overflow-hidden group transform transition-transform hover:scale-[1.01]">
        {/* Main Dark Metallic Background */}
        <div className="absolute inset-0 bg-[#0f0f0f]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#222] via-[#111] to-[#000]"></div>
        
        {/* Gold Accents */}
        <div className="absolute top-[-50%] right-[-10%] w-[200px] h-[200px] bg-amber-500/20 rounded-full blur-[60px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[150px] h-[150px] bg-yellow-600/10 rounded-full blur-[50px]"></div>
        
        {/* Texture & Border */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
        <div className="absolute inset-0 rounded-[24px] border border-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]"></div>

        {/* Content - Horizontal Layout */}
        <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-1.5 mb-1 opacity-80">
                    <WalletIcon className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-amber-100">Balance</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 drop-shadow-sm">
                        {balance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold text-amber-600/80 font-mono">PKR</span>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <button 
                    onClick={onDepositClick}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                    <PlusCircleIcon className="w-3 h-3 text-amber-300" /> Deposit
                </button>
                <button 
                    onClick={onWithdrawClick}
                    className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[10px] font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 hover:brightness-110"
                >
                    Withdraw <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 px-1">
              <SparklesIcon className="w-4 h-4 text-amber-500" /> 
              Quick Actions
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <QuickActionBtn 
                  icon={<PlayCircleIcon />} 
                  label="Watch Ads" 
                  onClick={onWatchAdsClick} 
                  colorClass="bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40" 
                  delay={50}
                  isHighlight={true}
              />
              <QuickActionBtn 
                  icon={<EarnIcon />} 
                  label="Tasks" 
                  onClick={onTasksClick} 
                  colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/40" 
                  delay={100}
              />
              <QuickActionBtn 
                  icon={<CalendarIcon />} 
                  label="Streak" 
                  onClick={onStreakClick} 
                  colorClass="bg-gradient-to-br from-yellow-400 to-amber-600 shadow-yellow-500/40" 
                  delay={125}
              />
              <QuickActionBtn 
                  icon={<TicketIcon />} 
                  label="Lottery" 
                  onClick={onLotteryClick} 
                  colorClass="bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/40" 
                  delay={150}
              />
              <QuickActionBtn 
                  icon={<GiftIcon />} 
                  label="Spin" 
                  onClick={onSpinClick} 
                  colorClass="bg-gradient-to-br from-pink-500 to-rose-500 shadow-pink-500/40" 
                  delay={200}
              />
              <QuickActionBtn 
                  icon={<InviteIcon />} 
                  label="Invite" 
                  onClick={onInviteClick} 
                  colorClass="bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/40" 
                  delay={300}
              />
          </div>
      </div>

      {/* Top Earners Section */}
      <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> 
                  Top Earners
              </h2>
              <button 
                onClick={onLeaderboardClick}
                className="text-[10px] font-bold text-amber-600 hover:text-amber-700"
              >
                View All
              </button>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {topEarners.slice(0, 3).map((user, i) => (
                  <div 
                    key={user.id || `top-${i}`} 
                    className={`flex items-center justify-between p-4 ${i !== 2 ? 'border-b border-slate-50' : ''}`}
                  >
                      <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                              i === 0 ? 'bg-yellow-100 text-yellow-600' : 
                              i === 1 ? 'bg-slate-100 text-slate-600' : 
                              'bg-amber-50 text-amber-700'
                          }`}>
                              {i + 1}
                          </div>
                          <div>
                              <p className="text-xs font-bold text-slate-900">{user.username || 'User'}</p>
                              <p className="text-[10px] text-slate-500">Active Earner</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-xs font-black text-emerald-600">{user.balance?.toLocaleString() || 0} PKR</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <style>{`
        .animate-pulse-slow { animation: pulse-slow 6s infinite ease-in-out; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.1); } }
        .animate-bounce-small { animation: bounce-small 2s infinite; }
        @keyframes bounce-small { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
