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
    RefreshCw,
    Ticket as TicketIcon,
    Calendar as CalendarIcon,
    Trophy,
    CheckCircle2,
    MessageCircle,
    Download,
    Lock,
    Crown,
    Rocket,
    Headphones,
    Zap,
    Gift,
    Clock,
} from 'lucide-react';
import QuickPromotions from './QuickPromotions';
import { db, auth, rtdb } from '../../firebase';
import { doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, update } from 'firebase/database';
import { useCurrency } from '../../context/CurrencyContext';

interface HomeTabProps {
  name: string;
  balance: number;
  lastUpdated?: number;
  totalEarnings?: number;
  totalIndirectCommission?: number;
  lockedBalance: number;
  accountStatus: string;
  role: string;
  topEarners: any[];
  onInviteClick: () => void;
  onDepositClick: () => void;
  onWithdrawClick: () => void;
  onWatchAdsClick: () => void;
  onSupportAIClick: () => void;
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
  onUpdateBalance: (amount: number, source?: string, description?: string, transactionId?: string) => Promise<boolean>;
  onReloadData?: () => void;
  appSettings: {
    activationFee: number;
  };
  appBonusClaimed: boolean;
  lastDailyCheckin: any;
  unreadChatCount?: number;
}

const AnimatedCounter = ({ value }: { value: number }) => {
  const { currency } = useCurrency();
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
      prevValueRef.current = endValue;
    };
  }, [value]);

  return <>{displayValue.toLocaleString(currency === 'PKR' ? 'en-PK' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

export default function HomeTab({ 
  name, 
  balance, 
  totalEarnings = 0,
  totalIndirectCommission = 0,
  lockedBalance,
  accountStatus,
  role,
  topEarners,
  onInviteClick, 
  onDepositClick, 
  onWithdrawClick, 
  onWatchAdsClick, 
  onSupportAIClick,
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
  onUpdateBalance,
  onReloadData,
  lastUpdated = Date.now(),
  appSettings,
  appBonusClaimed,
  lastDailyCheckin,
  unreadChatCount = 0
}: HomeTabProps) {
  const { currency, toggleCurrency, convertAmount } = useCurrency();
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
    <div className="space-y-5 animate-fade-in pb-28 font-sans">
      {/* Compact alerts */}
      {isApp && !appBonusClaimed && (
        <button
          onClick={handleClaimAppBonus}
          disabled={isClaiming}
          className="w-full flex items-center gap-3 bg-emerald-600 text-white rounded-2xl px-4 py-3.5 shadow-lg shadow-emerald-600/20 text-left active:scale-[0.99] transition"
        >
          <Gift className="w-6 h-6 shrink-0" />
          <span className="flex-1">
            <span className="block text-sm font-extrabold leading-tight">Claim Rs. 100 App Bonus</span>
            <span className="block text-[11px] text-emerald-100 font-semibold">App installer welcome reward — tap to claim</span>
          </span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      )}

      {!isApp && (
        <button
          onClick={() => navigate('/app-download')}
          className="w-full flex items-center gap-3 bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 shadow-sm text-left active:scale-[0.99] transition"
        >
          <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-emerald-600" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold text-slate-900 leading-tight">TaskMint App download karein</span>
            <span className="block text-[11px] text-slate-500 font-semibold">Installation par Rs. 100 bonus</span>
          </span>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full shrink-0">GET APP</span>
        </button>
      )}

      {accountStatus.toLowerCase() === 'inactive' && (
        <button
          onClick={onActivateClick}
          className="w-full flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3.5 text-left active:scale-[0.99] transition"
        >
          <span className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-white" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold text-rose-900 leading-tight">Account inactive hai</span>
            <span className="block text-[11px] text-rose-600 font-semibold">Earning shuru karne ke liye Rs. {appSettings.activationFee} joining fee jama karein</span>
          </span>
          <ArrowRight className="w-4 h-4 text-rose-500 shrink-0" />
        </button>
      )}

      {/* Compact balance card */}
      <div className="bg-white rounded-3xl border border-emerald-100/80 shadow-[0_10px_35px_-15px_rgba(4,120,87,0.25)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black overflow-hidden shrink-0">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                name.substring(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 truncate">{name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                {accountStatus === 'Active' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                <span>{accountStatus === 'Active' ? 'Active Member' : 'Member'}</span>
                {role === 'partner' && (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <Crown className="w-3 h-3" /> PRO
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={toggleCurrency}
            className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5 shrink-0"
          >
            {currency}
          </button>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Total Balance</p>
          <p className="text-[34px] leading-9 font-black text-slate-900 tracking-tight mt-1">
            {currency === 'PKR' ? 'Rs. ' : '$ '}
            <AnimatedCounter value={Math.max(0, convertAmount(balance))} />
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] font-bold text-slate-500">
            <span>Total Earned: {currency === 'PKR' ? 'Rs. ' : '$ '}{convertAmount(totalEarnings).toFixed(2)}</span>
            {lockedBalance > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <Lock className="w-3 h-3" /> Locked: {convertAmount(lockedBalance).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={onDepositClick}
            className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <PlusCircleIcon className="w-4 h-4" /> Add Funds
          </button>
          <button
            onClick={onWithdrawClick}
            className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <WalletIcon className="w-4 h-4" /> Cash Out
          </button>
        </div>
      </div>

      {/* Earn — main actions */}
      <div>
        <h2 className="text-base font-black text-slate-900 px-1 mb-3">Kamana shuru karein</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { icon: <PlayCircleIcon className="w-6 h-6" />, label: 'Watch Ads', onClick: onWatchAdsClick, bg: 'bg-rose-50 text-rose-600' },
            { icon: <CheckSquareIcon className="w-6 h-6" />, label: 'Tasks', onClick: onTasksClick, bg: 'bg-amber-50 text-amber-600' },
            { icon: <Rocket className="w-6 h-6" />, label: 'Surveys', onClick: onTaskWallClick, bg: 'bg-teal-50 text-teal-600' },
            { icon: <Zap className="w-6 h-6" />, label: 'Offer Wall', onClick: onOfferWallClick, bg: 'bg-cyan-50 text-cyan-600' },
            { icon: <SparklesIcon className="w-6 h-6" />, label: 'Easy Task', onClick: onEasyTaskClick, bg: 'bg-sky-50 text-sky-600' },
            { icon: <MessageCircle className="w-6 h-6" />, label: 'Social+', onClick: onSocialTaskPlusClick, bg: 'bg-emerald-50 text-emerald-600' },
            { icon: <GiftIcon className="w-6 h-6" />, label: 'Daily Gift', onClick: handleDailyCheckin, bg: 'bg-orange-50 text-orange-600' },
            { icon: <InviteIcon className="w-6 h-6" />, label: 'Invite', onClick: onInviteClick, bg: 'bg-emerald-50 text-emerald-700' },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm active:scale-95 transition"
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${a.bg}`}>{a.icon}</span>
              <span className="text-[10px] font-extrabold text-slate-700 leading-none">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compact referral banner */}
      <button
        onClick={onInviteClick}
        className="w-full flex items-center gap-3 bg-[#022c22] rounded-2xl px-4 py-4 text-left active:scale-[0.99] transition"
      >
        <span className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
          <InviteIcon className="w-5 h-5 text-emerald-400" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-extrabold text-white leading-tight">Doston ko invite karein</span>
          <span className="block text-[11px] text-emerald-200/70 font-semibold">Har dost ke account activation par commission payein</span>
        </span>
        <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
      </button>

      {/* Promotions */}
      <QuickPromotions balance={balance} onUpdateBalance={onUpdateBalance} />

      {/* More — simple list */}
      <div>
        <h2 className="text-base font-black text-slate-900 px-1 mb-3">Mazeed</h2>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
          <button onClick={onLotteryClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition">
            <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0"><TicketIcon className="w-4.5 h-4.5" /></span>
            <span className="flex-1 text-sm font-bold text-slate-800">Lottery</span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </button>
          <button onClick={onStreakClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition">
            <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0"><CalendarIcon className="w-4.5 h-4.5" /></span>
            <span className="flex-1 text-sm font-bold text-slate-800">Streak Vault</span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </button>
          <button onClick={onLeaderboardClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition">
            <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0"><Trophy className="w-4.5 h-4.5" /></span>
            <span className="flex-1 text-sm font-bold text-slate-800">Leaderboard</span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </button>
          <button onClick={onHistoryClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition">
            <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0"><Clock className="w-4.5 h-4.5" /></span>
            <span className="flex-1 text-sm font-bold text-slate-800">Earning History</span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </button>
          {role === 'partner' ? (
            <button onClick={onPartnerToolsClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition">
              <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0"><Crown className="w-4.5 h-4.5" /></span>
              <span className="flex-1 text-sm font-bold text-slate-800">Partner Tools</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
          ) : (
            <button onClick={onPartnerUpgradeClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition">
              <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0"><Crown className="w-4.5 h-4.5" /></span>
              <span className="flex-1 text-sm font-bold text-slate-800">PRO Partner banein</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
          )}
          <button onClick={onSupportAIClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition">
            <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0"><Headphones className="w-4.5 h-4.5" /></span>
            <span className="flex-1 text-sm font-bold text-slate-800">Live Support</span>
            {unreadChatCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">{unreadChatCount}</span>
            )}
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </button>
          <button onClick={() => window.open('https://whatsapp.com/channel/0029VbCpKTp2P59cvqS4CL2L', '_blank')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition">
            <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0"><MessageCircle className="w-4.5 h-4.5" /></span>
            <span className="flex-1 text-sm font-bold text-slate-800">WhatsApp Channel</span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

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
