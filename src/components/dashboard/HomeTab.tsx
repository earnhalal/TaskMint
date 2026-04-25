import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
    UserPlus as InviteIcon, 
    CheckSquare as CheckSquareIcon, 
    Sparkles as SparklesIcon, 
    Clock as EarnIcon, 
    ArrowRight, 
    Wallet as WalletIcon, 
    Gift as GiftIcon, 
    PlusCircle as PlusCircleIcon, 
    PlayCircle as PlayCircleIcon, 
    RefreshCw as ExchangeIcon,
    RefreshCw,
    Ticket as TicketIcon,
    Calendar as CalendarIcon,
    Trophy,
    AlertTriangle,
    Clock,
    CheckCircle2,
    MessageCircle,
    Download,
    Lock,
    Gift,
    Crown,
    Rocket,
    Layout,
    Briefcase,
    Zap,
    Flame,
    ClipboardList as TaskIcon
} from 'lucide-react';
import QuickPromotions from './QuickPromotions';
import { db, auth, rtdb } from '../../firebase';
import { doc, updateDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, update } from 'firebase/database';

interface HomeTabProps {
  name: string;
  balance: number;
  spinBalance?: number;
  totalEarnings?: number;
  totalIndirectCommission?: number;
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
  onHistoryClick: () => void;
  onUpdatesClick: () => void;
  onTaskWallClick: () => void;
  onEasyTaskClick: () => void;
  onSocialTaskPlusClick: () => void;
  onOfferWallClick: () => void;
  onPartnerToolsClick: () => void;
  onProductDrawClick: () => void;
  onUpdateBalance: (amount: number, source?: string, description?: string) => void;
  onReloadData?: () => void;
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
    badge?: string;
    labelColor?: string;
    shadowColor?: string;
}> = ({ icon, label, onClick, colorClass, delay, badge, labelColor = "text-slate-700", shadowColor = "shadow-indigo-500/20" }) => (
    <motion.button 
        initial="hidden"
        animate="visible"
        variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 }
        }}
        transition={{ delay: delay / 1000 }}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick} 
        className="flex flex-col items-center gap-2 group w-full relative"
    >
        <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] flex items-center justify-center text-white shadow-2xl transition-all duration-300 ${colorClass} ${shadowColor} hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] overflow-visible group-hover:ring-4 ring-white/20`}>
            {/* Real Glow Layer */}
            <div className={`absolute -inset-1 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 rounded-[28px] ${colorClass.replace('bg-gradient-to-br', 'bg')}`}></div>
            
            {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF7E8B] text-white text-[8px] font-black px-2.5 py-0.5 rounded-md shadow-lg z-20 border border-white/20 whitespace-nowrap animate-bounce-subtle">
                    {badge}
                </div>
            )}
            
            <div className="relative z-10 drop-shadow-md transform group-hover:scale-110 transition-transform duration-300">
                {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement, { className: "w-8 h-8 sm:w-10 sm:h-10" } as any)}
            </div>
            
            {/* High-end glass reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-60 rounded-[28px]"></div>
            <div className="absolute top-1 left-1 right-1 h-[40%] bg-white/20 rounded-t-[24px] blur-[1px]"></div>
        </div>

        <span className={`text-[9px] sm:text-[10px] font-black tracking-tight uppercase leading-tight text-center ${labelColor} transform group-hover:translate-y-0.5 transition-transform`}>
            {label}
        </span>
    </motion.button>
);

const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = React.useState(value);
  const prevValueRef = React.useRef(value);

  React.useEffect(() => {
    let startTimestamp: number;
    const duration = 1000; // 1 second
    const startValue = prevValueRef.current;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };
    
    if (startValue !== endValue) {
      window.requestAnimationFrame(step);
    } else {
      setDisplayValue(value);
    }

    return () => {
      // No cleanup needed for requestAnimationFrame as it dies anyway, 
      // but we update ref to ensure next update starts from correct point
      prevValueRef.current = endValue;
    };
  }, [value]);

  return <>{displayValue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

export default function HomeTab({ 
  name, 
  balance, 
  spinBalance,
  totalEarnings = 0,
  totalIndirectCommission = 0,
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
  onHistoryClick,
  onUpdatesClick,
  onTaskWallClick,
  onEasyTaskClick,
  onSocialTaskPlusClick,
  onOfferWallClick,
  onPartnerToolsClick,
  onProductDrawClick,
  onUpdateBalance,
  onReloadData,
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
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const navigate = useNavigate();

  const handleReloadBalance = () => {
    setIsReloading(true);
    if (onReloadData) onReloadData();
    setTimeout(() => setIsReloading(false), 1500);
  };

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
    if (accountStatus.toLowerCase() !== 'active') {
        alert("App Install Bonus sirf active accounts (joining fee paid) ko milta hai. Pehle account activate karein!");
        return;
    }
    
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

      alert("Mubarak ho! Rs. 100 App Welcome Bonus aapke main balance mein add kar diya gaya hai.");
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
      navigate('/app-download');
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
    <div className="space-y-8 animate-fade-in pb-32 font-sans relative">
      {/* Decorative Floating Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-80 h-80 bg-amber-500/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header & Greeting Section */}
      <div className="relative z-10 flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
            <p className="text-[10px] font-black text-indigo-600/60 uppercase tracking-[0.3em]">{getGreeting()}</p>
          </div>
          
          <div className="flex items-center gap-3">
              <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLeaderboardClick}
                  className="flex items-center gap-2 bg-[#0A0A0B] text-white text-[9px] font-black px-4 py-2.5 rounded-xl shadow-xl transition-all border border-white/10 group"
              >
                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> 
                  <span className="tracking-widest uppercase">Hall of Fame</span>
              </motion.button>

              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 overflow-hidden cursor-pointer" onClick={onProfileClick}>
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white text-slate-900 text-sm font-black shadow-inner">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      name.substring(0, 1).toUpperCase()
                    )}
                  </div>
              </div>
          </div>
      </div>

      {/* APK Welcome & High-Priority Alerts */}
      <div className="grid grid-cols-1 gap-4 relative z-10">
        {isApp && !appBonusClaimed && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClaimAppBonus}
            disabled={isClaiming}
            className="relative bg-gradient-to-br from-amber-500 to-orange-700 p-6 rounded-[32px] shadow-2xl shadow-amber-500/40 border-b-4 border-black/20 overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Gift className="w-8 h-8 text-white animate-bounce" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Claim Rs. 100 Bonus</h3>
                <p className="text-[10px] text-amber-100 font-bold uppercase tracking-widest mt-1 opacity-70">App Installer Welcome Reward</p>
              </div>
            </div>
          </motion.button>
        )}

        {!isApp && (
          <div 
            onClick={() => navigate('/app-download')}
            className="relative bg-emerald-600 rounded-[24px] p-5 border border-white/10 shadow-xl shadow-emerald-900/20 flex items-center justify-between cursor-pointer group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Download className="w-6 h-6 text-white group-hover:animate-bounce" />
              </div>
              <div>
                <p className="text-sm font-black text-white lowercase">taskmint.apk</p>
                <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest">Get Rs. 100 on Installation</p>
              </div>
            </div>
            <div className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
              GET APP
            </div>
          </div>
        )}

        {accountStatus.toLowerCase() === 'inactive' && (
          <div 
            onClick={onActivateClick}
            className="bg-rose-50 border border-rose-100 p-5 rounded-[24px] flex items-center justify-between cursor-pointer group hover:bg-rose-100 transition-all shadow-lg shadow-rose-100/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-rose-900 uppercase tracking-tighter">Account Inactive</p>
                <p className="text-[10px] text-rose-600 font-bold">Pay Rs {appSettings.activationFee} to verify account</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Futuristic Balance Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 group"
      >
        {/* Glow Effects */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 rounded-[36px] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-[#0A0A0B] rounded-[32px] p-8 overflow-hidden shadow-2xl border border-white/5">
          {/* Internal Geometric Pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse-slow"></div>
          
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-black text-xl">{name.substring(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  {accountStatus === 'Active' && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg border-2 border-[#0A0A0B]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white tracking-tight leading-none uppercase italic">{name}</h3>
                        {role === 'partner' && (
                            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <Crown className="w-2.5 h-2.5 fill-amber-500" />
                                <span className="text-[7px] font-black uppercase tracking-widest">PRO</span>
                            </div>
                        )}
                    </div>
                    <p className="text-indigo-300/40 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Active App Member</p>
                </div>
              </div>
              <button 
                onClick={handleReloadBalance}
                className={`w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 ${isReloading ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <AnimatedCounter value={balance} />
                </span>
                <span className="text-xl font-black text-indigo-500 tracking-tighter italic">RS</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Syncing</span>
                </div>
                {lockedBalance > 0 && (
                  <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    <Lock className="w-2.5 h-2.5 text-amber-500" />
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Locked: {lockedBalance}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDepositClick}
                className="bg-indigo-600 hover:bg-indigo-500 h-14 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all group/btn"
              >
                <PlusCircleIcon className="w-5 h-5 text-white group-hover/btn:rotate-90 transition-transform" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Add Funds</span>
              </motion.button>
              
              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onWithdrawClick}
                className="bg-white hover:bg-slate-50 h-14 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all"
              >
                <ArrowRight className="w-5 h-5 text-slate-900" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Cash Out</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Grid matching screenshot */}
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col px-1">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase font-sans">
              Quick Actions
            </h2>
          </div>
          <p className="text-[10px] font-black text-slate-400/60 mt-0.5 uppercase tracking-[0.2em] ml-1">Fast Shortcuts</p>
        </div>

        <div className="grid grid-cols-3 min-[400px]:grid-cols-4 gap-x-2 gap-y-8 sm:gap-6">
          {/* Row 1 */}
          <QuickActionBtn 
            icon={<MessageCircle />} label="WhatsApp" badge="HELP" 
            onClick={() => window.open('https://whatsapp.com/channel/0029VbCpKTp2P59cvqS4CL2L', '_blank')} 
            colorClass="bg-gradient-to-br from-[#25D366] to-[#128C7E]" 
            shadowColor="shadow-emerald-500/40"
            labelColor="text-emerald-500" delay={0}
          />
          <QuickActionBtn 
            icon={<PlayCircleIcon />} label="Watch Ads" badge="HOT" 
            onClick={onWatchAdsClick} 
            colorClass="bg-gradient-to-br from-[#FF4B2B] to-[#FF416C]" 
            shadowColor="shadow-rose-500/40"
            labelColor="text-rose-600" delay={100}
          />
          <QuickActionBtn 
            icon={<Clock />} label="Tasks" 
            onClick={onTasksClick} 
            colorClass="bg-gradient-to-br from-[#F09819] to-[#EDDE5D]" 
            shadowColor="shadow-amber-500/40"
            labelColor="text-slate-700" delay={200}
          />
          <QuickActionBtn 
            icon={<Zap />} label="Offer Wall" 
            onClick={onOfferWallClick} 
            colorClass="bg-gradient-to-br from-[#4facfe] to-[#00f2fe]" 
            shadowColor="shadow-cyan-500/40"
            labelColor="text-indigo-900" delay={300}
          />

          {/* Row 2 */}
          <QuickActionBtn 
            icon={<Rocket />} label="CPX Surveys" 
            onClick={onTaskWallClick} 
            colorClass="bg-gradient-to-br from-[#fa709a] to-[#fee140]" 
            shadowColor="shadow-pink-500/40"
            labelColor="text-slate-700" delay={400}
          />
          <QuickActionBtn 
            icon={<CheckSquareIcon />} label="Easy Task" badge="NEW" 
            onClick={onEasyTaskClick} 
            colorClass="bg-gradient-to-br from-[#00c6ff] to-[#0072ff]" 
            shadowColor="shadow-blue-500/40"
            labelColor="text-blue-800" delay={500}
          />
          <QuickActionBtn 
            icon={<SparklesIcon />} label="Social+" badge="BONUS" 
            onClick={onSocialTaskPlusClick} 
            colorClass="bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb]" 
            shadowColor="shadow-purple-500/40"
            labelColor="text-orange-500" delay={600}
          />
          <QuickActionBtn 
            icon={<CalendarIcon />} label="Daily Gift" badge="GIFT" 
            onClick={handleDailyCheckin} 
            colorClass="bg-gradient-to-br from-[#f6d365] to-[#fda085]" 
            shadowColor="shadow-orange-500/40"
            labelColor="text-amber-600" delay={700}
          />

          {/* Row 3 */}
          <QuickActionBtn 
            icon={<TicketIcon />} label="Lottery" 
            onClick={onLotteryClick} 
            colorClass="bg-gradient-to-br from-[#1e3c72] to-[#2a5298]" 
            shadowColor="shadow-blue-900/40"
            labelColor="text-slate-700" delay={800}
          />
          <QuickActionBtn 
            icon={<GiftIcon />} label="Spin" badge="NEW" 
            onClick={onSpinClick} 
            colorClass="bg-gradient-to-br from-[#f093fb] to-[#f5576c]" 
            shadowColor="shadow-pink-500/40"
            labelColor="text-blue-900" delay={900}
          />
          <QuickActionBtn 
            icon={<InviteIcon />} label="Invite" 
            onClick={onInviteClick} 
            colorClass="bg-gradient-to-br from-[#5ee7df] to-[#b490ca]" 
            shadowColor="shadow-indigo-500/40"
            labelColor="text-blue-900" delay={1000}
          />
          <QuickActionBtn 
            icon={<Crown />} label="Partner Tools" 
            onClick={onPartnerToolsClick} 
            colorClass="bg-gradient-to-br from-[#8e2de2] to-[#4a00e0]" 
            shadowColor="shadow-purple-700/40"
            labelColor="text-[#8e2de2]" delay={1100}
          />
        </div>
      </div>

      {/* Product Draw */}
      <div className="relative z-10 px-1 py-4">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-4">Product Draws</h2>
        <div className="overflow-hidden bg-[#0A0A0B] rounded-3xl p-4 border border-white/10 shadow-lg">
            <motion.div 
                className="flex gap-4"
                animate={{ x: ["0%", "-100%"] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            >
                {[
                    { name: "Wireless Earbuds", price: "3,500", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80", entryFee: 100 },
                    { name: "Romoss SW10PF Power Bank", price: "6,999", image: "https://images.unsplash.com/photo-1609592813106-c79d6882269a?w=300&q=80", entryFee: 100 },
                    { name: "Headphones", price: "3,500", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80", entryFee: 100 },
                ].concat([
                    { name: "Wireless Earbuds", price: "3,500", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80", entryFee: 100 },
                    { name: "Romoss SW10PF Power Bank", price: "6,999", image: "https://images.unsplash.com/photo-1609592813106-c79d6882269a?w=300&q=80", entryFee: 100 },
                    { name: "Headphones", price: "3,500", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80", entryFee: 100 },
                ]).map((item, i) => (
                    <div key={i} className="min-w-[140px] bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                        <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl mb-2 object-cover" />
                        <p className="text-[10px] font-bold text-white uppercase text-center line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold line-through">Rs. {item.price}</p>
                        <p className="text-xs text-amber-500 font-black mb-2">Rs. {item.entryFee}</p>
                        <button 
                            onClick={onProductDrawClick}
                            className="bg-indigo-600 text-[9px] font-bold text-white px-3 py-1.5 rounded-lg w-full"
                        >
                            Participate
                        </button>
                    </div>
                ))}
            </motion.div>
        </div>
      </div>


      {/* Promotions Section */}
      <QuickPromotions balance={balance} onUpdateBalance={onUpdateBalance} />

      {/* Mega Bonus Invite Card */}
      <motion.div 
        whileHover={{ y: -5 }}
        onClick={onInviteClick}
        className="relative z-10 animate-fade-in-up" 
        style={{ animationDelay: '400ms' }}
      >
        <div className="bg-[#0A0A0B] rounded-[32px] p-8 overflow-hidden relative border border-white/5 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">TOP EARNING</div>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <div>
              <h3 className="text-3xl font-black text-white italic tracking-tighter mb-2">MEGA <span className="text-amber-500">REFERRAL</span></h3>
              <p className="text-sm font-bold text-slate-400 leading-relaxed mb-6">Mera referral code use karo aur har friend ke account activation par <span className="text-white font-black italic">Rs. 125</span> earn karo.</p>
              
              <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/10 border-dashed">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Commission Earned</p>
                  <p className="text-xl font-black text-amber-500 italic">Rs 125.00</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-bounce-subtle { animation: bounceSubtle 2s infinite; }
        @keyframes bounceSubtle { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -4px); } }

        .animate-pulse-slow { animation: pulseSlow 8s infinite ease-in-out; }
        @keyframes pulseSlow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.35; transform: scale(1.1); } }
        
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

        .animate-shaking { animation: shaking 0.5s infinite ease-in-out; }
        @keyframes shaking {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
