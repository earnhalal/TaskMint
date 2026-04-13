import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    CheckCircle2,
    MessageCircle,
    Zap,
    Download,
    Lock,
    Gift
} from 'lucide-react';
import QuickPromotions from './QuickPromotions';
import { db, auth, rtdb } from '../../firebase';
import { doc, updateDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, update } from 'firebase/database';

interface HomeTabProps {
  name: string;
  balance: number;
  lockedBalance: number;
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
  onActivateClick: () => void;
  onTaskWallClick: () => void;
  onSocialTaskPlusClick: () => void;
  onUpdateBalance: (amount: number, source?: string, description?: string) => void;
  appSettings: {
    activationFee: number;
  };
  appBonusClaimed: boolean;
  lastDailyCheckin: any;
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
    isWhatsApp?: boolean;
    isShaking?: boolean;
    isLocked?: boolean;
}> = ({ icon, label, onClick, colorClass, delay, isHighlight, isWhatsApp, isShaking, isLocked }) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center gap-2 group animate-fade-in-up w-full ${isWhatsApp ? 'animate-bounce-small' : ''} ${isShaking ? 'animate-shaking' : ''} relative`}
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:scale-105 group-active:scale-95 ${colorClass} ${isHighlight ? 'ring-2 ring-red-100' : 'ring-2 ring-white ring-opacity-50'} ${isWhatsApp ? 'shadow-green-500/50' : ''}`}>
            {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
        </div>
        {isLocked && (
          <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-white rounded-full p-1 shadow-md border border-slate-100 z-10">
            <Lock className="w-2.5 h-2.5 text-amber-600" />
          </div>
        )}
        <span className={`text-[10px] sm:text-xs font-bold transition-colors ${isHighlight ? 'text-red-700' : isWhatsApp ? 'text-green-600' : 'text-slate-600 group-hover:text-slate-900'}`}>{label}</span>
    </button>
);

export default function HomeTab({ 
  name, 
  balance, 
  lockedBalance,
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
  onActivateClick,
  onTaskWallClick,
  onSocialTaskPlusClick,
  onUpdateBalance,
  appSettings,
  appBonusClaimed,
  lastDailyCheckin
}: HomeTabProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const [avatar, setAvatar] = React.useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const navigate = useNavigate();

  const isApp = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
    
    // Comprehensive check for AppCreator24 and other WebViews
    const isWebView = ua.includes('wv') || ua.includes('webview') || (ua.includes('android') && ua.includes('version/')) || ua.includes('appcreator24') || !!(window as any).AppCreator24;
    const isAC24 = ua.includes('appcreator24') || !!(window as any).AppCreator24;
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    const isParam = window.location.search.includes('isApp=true') || window.location.search.includes('app=true');
    
    // Log for debugging (only in development or if needed)
    console.log("[APP_DETECTION]", { ua, isWebView, isAC24, isStandalone, isParam });
    
    return isWebView || isAC24 || isStandalone || isParam;
  }, []);

  const handleClaimAppBonus = async () => {
    if (!auth.currentUser || isClaiming) return;
    setIsClaiming(true);
    try {
      console.log("[BONUS_CLAIM] Starting APK Bonus Claim...");
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // 1. Update the flag in both databases first
      await setDoc(userRef, {
        appBonusClaimed: true
      }, { merge: true });
      
      const rtdbUserRef = ref(rtdb, `users/${auth.currentUser.uid}`);
      await update(rtdbUserRef, {
        appBonusClaimed: true
      });
      
      console.log("[BONUS_CLAIM] Flag updated in both Firestore and RTDB");
      
      // 2. Use the centralized balance update logic which handles both DBs and commissions
      await onUpdateBalance(100, 'app_bonus', 'APK Install Welcome Bonus');
      console.log("[BONUS_CLAIM] Balance updated successfully");

      alert("Mubarak ho! Rs. 100 App Welcome Bonus aapke wallet mein add kar diya gaya hai.");
    } catch (error) {
      console.error("Error claiming app bonus:", error);
      alert("Bonus claim karne mein masla hua. Dobara koshish karein. Error: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsClaiming(false);
    }
  };

  const handleDailyCheckin = async () => {
    if (!isApp) {
      console.log("[DAILY_CHECKIN] Not in App, redirecting...");
      alert("Ye reward sirf TaskMint App par milta hai. Bonus lene ke liye App download karein!");
      navigate('/download');
      return;
    }

    if (!auth.currentUser || isClaiming) return;

    // Check if 24 hours passed
    if (lastDailyCheckin) {
      const lastTime = lastDailyCheckin.toDate ? lastDailyCheckin.toDate().getTime() : new Date(lastDailyCheckin).getTime();
      const now = new Date().getTime();
      const hoursPassed = (now - lastTime) / (1000 * 60 * 60);
      
      if (hoursPassed < 24) {
        const remainingHours = Math.ceil(24 - hoursPassed);
        alert(`Aap pehle hi aaj ka reward claim kar chuke hain. Agla reward ${remainingHours} ghantay baad milega.`);
        return;
      }
    }

    setIsClaiming(true);
    try {
      console.log("[DAILY_CHECKIN] Starting Daily Checkin...");
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // 1. Update the timestamp in Firestore
      await setDoc(userRef, {
        lastDailyCheckin: serverTimestamp()
      }, { merge: true });
      console.log("[DAILY_CHECKIN] Timestamp updated in Firestore");
      
      // 2. Use the centralized balance update logic
      await onUpdateBalance(10, 'daily_reward', 'Daily Attendance Reward');
      console.log("[DAILY_CHECKIN] Balance updated successfully");

      alert("Mubarak ho! Rs. 10 Daily Reward aapke wallet mein add kar diya gaya hai. Agla reward 24 ghante baad milega.");
    } catch (error) {
      console.error("Error daily checkin:", error);
      alert("Reward claim karne mein masla hua. Error: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsClaiming(false);
    }
  };

  const isDailyClaimable = useMemo(() => {
    if (!lastDailyCheckin) return true;
    const lastTime = lastDailyCheckin.toDate ? lastDailyCheckin.toDate().getTime() : new Date(lastDailyCheckin).getTime();
    const now = new Date().getTime();
    const hoursPassed = (now - lastTime) / (1000 * 60 * 60);
    return hoursPassed >= 24;
  }, [lastDailyCheckin]);

  React.useEffect(() => {
    setAvatar(localStorage.getItem('taskmint_avatar'));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-24 font-sans">
      
      {/* APK Welcome Bonus - Only in App and if not claimed */}
      {isApp && !appBonusClaimed && (
        <div className="animate-fade-in-up">
          <button 
            onClick={handleClaimAppBonus}
            disabled={isClaiming}
            className="block w-full bg-gradient-to-r from-amber-400 to-orange-600 p-6 rounded-3xl shadow-2xl shadow-amber-500/40 border-4 border-white/40 relative overflow-hidden group animate-bounce-small"
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            <div className="flex flex-col items-center justify-center gap-2 relative z-10">
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-white" />
                <span className="text-xl font-black text-white uppercase tracking-tighter">Claim Rs. 100 APK Bonus</span>
              </div>
              <p className="text-[10px] text-amber-50 font-bold uppercase tracking-widest opacity-80">One-time App Exclusive Reward</p>
            </div>
          </button>
        </div>
      )}

      {/* Download App Button - Hero Section */}
      {!isApp && (
        <div 
          onClick={() => navigate('/download')}
          className="block w-full bg-gradient-to-r from-emerald-500 to-emerald-800 p-4 rounded-2xl shadow-lg shadow-emerald-500/30 border border-emerald-400/30 relative overflow-hidden group animate-pulse-emerald cursor-pointer"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white">Download TaskMint App & Earn Daily</p>
                <p className="text-[10px] text-emerald-100 font-bold">Get Rs. 100 Welcome Bonus in App!</p>
              </div>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-lg">
               <span className="text-[10px] font-black text-white uppercase">APK</span>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Alert for Inactive Users */}
      {accountStatus.toLowerCase() === 'inactive' && (
        <div 
          onClick={onActivateClick}
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
                {accountStatus === 'Active' && (
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
            <div className="flex flex-col gap-4">
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

                {lockedBalance > 0 && (
                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-0.5 opacity-60">
                        <Clock className="w-2.5 h-2.5 text-amber-200" />
                        <span className="text-[8px] font-bold tracking-widest uppercase text-amber-50">Locked Balance</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-amber-200">
                            {lockedBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[8px] font-bold text-amber-400/60 font-mono">PKR</span>
                    </div>
                  </div>
                )}
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
                  icon={<MessageCircle />} 
                  label="WhatsApp" 
                  onClick={() => window.open('https://whatsapp.com/channel/0029VbCpKTp2P59cvqS4CL2L', '_blank')} 
                  colorClass="bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/40" 
                  delay={25}
                  isWhatsApp={true}
              />
              <QuickActionBtn 
                  icon={<PlayCircleIcon />} 
                  label="Watch Ads" 
                  onClick={onWatchAdsClick} 
                  colorClass="bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40" 
                  delay={50}
                  isHighlight={true}
                  isLocked={accountStatus.toLowerCase() !== 'active'}
              />
              <QuickActionBtn 
                  icon={<EarnIcon />} 
                  label="Tasks" 
                  onClick={onTasksClick} 
                  colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/40" 
                  delay={100}
                  isLocked={accountStatus.toLowerCase() !== 'active'}
              />
              <QuickActionBtn 
                  icon={<Zap />} 
                  label="Surveys" 
                  onClick={onTaskWallClick} 
                  colorClass="bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-500/40" 
                  delay={110}
                  isLocked={accountStatus.toLowerCase() !== 'active'}
              />
              {/* Daily Gift Logic */}
              <QuickActionBtn 
                  icon={<CalendarIcon />} 
                  label="Daily Gift" 
                  onClick={handleDailyCheckin} 
                  colorClass="bg-gradient-to-br from-yellow-400 to-amber-600 shadow-yellow-500/40" 
                  delay={125}
                  isHighlight={true}
                  isShaking={isDailyClaimable}
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
              <QuickActionBtn 
                  icon={<SparklesIcon />} 
                  label="Social Task+" 
                  onClick={onSocialTaskPlusClick} 
                  colorClass="bg-gradient-to-br from-orange-400 to-rose-600 shadow-orange-500/40" 
                  delay={350}
                  isHighlight={true}
              />
          </div>
      </div>

      {/* Quick Promotions Section */}
      <QuickPromotions balance={balance} onUpdateBalance={onUpdateBalance} />

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
        
        .animate-pulse-emerald { animation: pulse-emerald 2s infinite; }
        @keyframes pulse-emerald {
          0% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); }
          50% { transform: scale(1.02); box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.4); }
          100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); }
        }

        .animate-shaking { animation: shaking 0.5s infinite ease-in-out; }
        @keyframes shaking {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }

        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
