import React, { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { UserPlus as InviteIcon, CheckSquare as CheckSquareIcon, Sparkles as SparklesIcon, ArrowRight, Wallet as WalletIcon, Gift as GiftIcon, PlusCircle as PlusCircleIcon, PlayCircle as PlayCircleIcon, Ticket as TicketIcon, Calendar as CalendarIcon, Trophy, MessageCircle, Download, Lock, Crown, Rocket, Headphones, Zap, Gift, Clock } from 'lucide-react';
import QuickPromotions from './QuickPromotions';
import { db, auth, rtdb } from '../../firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, update } from 'firebase/database';
import { useCurrency } from '../../context/CurrencyContext';

interface HomeTabProps {
  balance: number;
  totalEarnings?: number;
  totalIndirectCommission?: number;
  accountStatus: string;
  role: string;
  onInviteClick: () => void;
  onDepositClick: () => void;
  onWithdrawClick: () => void;
  onWatchAdsClick: () => void;
  onSupportAIClick: () => void;
  onTasksClick: () => void;
  onLotteryClick: () => void;
  onStreakClick: () => void;
  onLeaderboardClick: () => void;
  onPartnerUpgradeClick: () => void;
  onActivateClick: () => void;
  onHistoryClick: () => void;
  onTaskWallClick: () => void;
  onEasyTaskClick: () => void;
  onSocialTaskPlusClick: () => void;
  onOfferWallClick: () => void;
  onPartnerToolsClick: () => void;
  onUpdateBalance: (amount: number, source?: string, description?: string, transactionId?: string) => Promise<boolean>;
  appSettings: {
    activationFee: number;
    minWithdrawal?: number;
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
  balance, 
  totalEarnings = 0,
  totalIndirectCommission = 0,
  accountStatus,
  role,
  onInviteClick, 
  onDepositClick, 
  onWithdrawClick, 
  onWatchAdsClick, 
  onSupportAIClick,
  onTasksClick, 
  onLotteryClick, 
  onStreakClick,
  onLeaderboardClick,
  onPartnerUpgradeClick,
  onActivateClick,
  onHistoryClick,
  onTaskWallClick,
  onEasyTaskClick,
  onSocialTaskPlusClick,
  onOfferWallClick,
  onPartnerToolsClick,
  onUpdateBalance,
  appSettings,
  appBonusClaimed,
  lastDailyCheckin,
  unreadChatCount = 0
}: HomeTabProps) {
  const { currency, toggleCurrency, convertAmount } = useCurrency();
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
    
    return Capacitor.isNativePlatform() || isWebView || isAC24 || isStandalone || isParam;
  }, []);

  const handleClaimAppBonus = async () => {
    if (!auth.currentUser || isClaiming) return;
    if (accountStatus.toLowerCase() !== 'active') {
        alert("App Install Bonus sirf active accounts (joining fee paid) ko milta hai. Pehle account activate karein!");
        return;
    }
    
    setIsClaiming(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // 1. Update the flag in both databases first
      await setDoc(userRef, {
        appBonusClaimed: true
      }, { merge: true });
      
      const rtdbUserRef = ref(rtdb, `users/${auth.currentUser.uid}`);
      await update(rtdbUserRef, {
        appBonusClaimed: true
      });
      
      
      // 2. Use the centralized balance update logic which handles both DBs and commissions
      await onUpdateBalance(100, 'app_bonus', 'APK Install Welcome Bonus');

      alert("Mubarak ho! Rs. 100 App Welcome Bonus aapke main balance mein add kar diya gaya hai.");
    } catch (error) {
      console.error("Error claiming app bonus:", error);
      alert("Bonus claim karne mein masla hua. Dobara koshish karein. Error: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsClaiming(false);
    }
  };

  // Daily Bonus: weighted random Rs. 1–10 (mostly under Rs. 5), once per 24h.
  const rollDailyBonus = () => {
    const table: Array<[number, number]> = [[1, 26], [2, 24], [3, 20], [4, 12], [5, 8], [6, 4], [7, 3], [8, 1.5], [9, 1], [10, 0.5]];
    const total = table.reduce((sum, [, w]) => sum + w, 0);
    let r = Math.random() * total;
    for (const [value, w] of table) { r -= w; if (r <= 0) return value; }
    return 1;
  };

  const handleDailyCheckin = async () => {
    if (!isApp) {
      alert("This reward is available in the TaskMint app only. Download the app to claim your Daily Bonus!");
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
        alert(`You have already claimed today's Daily Bonus. The next one will be available in about ${remainingHours} hour(s).`);
        return;
      }
    }

    setIsClaiming(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // 1. Update the timestamp in Firestore
      await setDoc(userRef, {
        lastDailyCheckin: serverTimestamp()
      }, { merge: true });
      
      // 2. Credit the (weighted random) bonus via the centralized logic
      const bonusAmount = rollDailyBonus();
      const credited = await onUpdateBalance(bonusAmount, 'daily_reward', 'Daily Bonus');
      if (credited) {
        alert(`Congratulations! Your Daily Bonus of Rs. ${bonusAmount} has been added to your wallet. The next bonus will be available in 24 hours.`);
      } else {
        alert("The bonus could not be added to your wallet. Please try again.");
      }
    } catch (error) {
      console.error("Error daily checkin:", error);
      alert("Something went wrong while claiming the bonus. Please try again.");
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

  return (
    <div className="space-y-5 animate-fade-in pb-28 font-sans">
      {/* Alerts */}
      {isApp && !appBonusClaimed && (
        <button
          onClick={handleClaimAppBonus}
          disabled={isClaiming}
          className="w-full flex items-center gap-3 bg-green-500 text-[#052E12] rounded-2xl px-4 py-3.5 shadow-lg shadow-none text-left active:scale-[0.99] transition"
        >
          <Gift className="w-6 h-6 shrink-0" />
          <span className="flex-1">
            <span className="block text-sm font-extrabold leading-tight">Claim your Rs. 100 app bonus</span>
            <span className="block text-[11px] font-semibold opacity-70">Welcome reward for app users — tap to claim</span>
          </span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      )}

      {!isApp && (
        <button
          onClick={() => navigate('/app-download')}
          className="w-full flex items-center gap-3 bg-[#15181D] border border-white/5 rounded-2xl px-4 py-3.5 text-left active:scale-[0.99] transition"
        >
          <span className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-emerald-400" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold text-white leading-tight">Get the TaskMint app</span>
            <span className="block text-[11px] text-zinc-400 font-semibold">Install and receive a Rs. 100 bonus</span>
          </span>
          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-full shrink-0">GET APP</span>
        </button>
      )}

      {accountStatus.toLowerCase() === 'inactive' && (
        <button
          onClick={onActivateClick}
          className="w-full flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3.5 text-left active:scale-[0.99] transition"
        >
          <span className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-white" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold text-rose-200 leading-tight">Your account is inactive</span>
            <span className="block text-[11px] text-rose-300/80 font-semibold">Pay the one-time Rs. {appSettings.activationFee} joining fee to start earning</span>
          </span>
          <ArrowRight className="w-4 h-4 text-rose-400 shrink-0" />
        </button>
      )}

      {/* Balance card */}
      <div className="bg-[#15181D] border border-white/5 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.18em]">Available Balance</p>
          <button
            onClick={toggleCurrency}
            className="text-[10px] font-black text-zinc-300 bg-white/5 border border-white/10 rounded-full px-2.5 py-1"
          >
            {currency}
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2.5">
          <span className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
            <WalletIcon className="w-5 h-5 text-amber-400" />
          </span>
          <p className="text-4xl font-black text-white tracking-tight">
            {currency === 'PKR' ? 'Rs. ' : '$ '}
            <AnimatedCounter value={Math.max(0, convertAmount(balance))} />
          </p>
        </div>

        <div className="mt-4">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, (balance / (appSettings.minWithdrawal ?? 500)) * 100))}%` }}
            ></div>
          </div>
          <p className="text-[11px] font-semibold text-zinc-400 mt-2">
            {balance >= (appSettings.minWithdrawal ?? 500)
              ? `Your balance is ready to cash out (minimum Rs. ${appSettings.minWithdrawal ?? 500}).`
              : `You are Rs. ${((appSettings.minWithdrawal ?? 500) - balance).toFixed(0)} away from cashing out (minimum Rs. ${appSettings.minWithdrawal ?? 500}).`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={onWithdrawClick}
            className="h-11 rounded-xl bg-green-500 hover:bg-green-400 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <WalletIcon className="w-4 h-4" /> Cash Out
          </button>
          <button
            onClick={onDepositClick}
            className="h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <PlusCircleIcon className="w-4 h-4" /> Deposit
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#15181D] rounded-2xl border border-white/5 px-3 py-3.5 text-center">
          <p className="text-sm font-black text-white">{currency === 'PKR' ? 'Rs. ' : '$ '}{convertAmount(totalEarnings).toFixed(0)}</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Total Earned</p>
        </div>
        <div className="bg-[#15181D] rounded-2xl border border-white/5 px-3 py-3.5 text-center">
          <p className="text-sm font-black text-white">{currency === 'PKR' ? 'Rs. ' : '$ '}{convertAmount(totalIndirectCommission).toFixed(0)}</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Team Earnings</p>
        </div>
        <div className="bg-[#15181D] rounded-2xl border border-white/5 px-3 py-3.5 text-center">
          <p className={`text-sm font-black flex items-center justify-center gap-1.5 ${accountStatus?.toLowerCase() === 'active' ? 'text-green-400' : 'text-rose-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${accountStatus?.toLowerCase() === 'active' ? 'bg-green-400' : 'bg-rose-400'}`}></span>
            {accountStatus}
          </p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Account</p>
        </div>
      </div>

      {/* Daily rewards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#15181D] border border-white/5 rounded-2xl p-4">
          <span className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <GiftIcon className="w-5 h-5" />
          </span>
          <p className="text-sm font-extrabold text-white mt-3 leading-tight">Daily Bonus</p>
          <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">Win Rs. 1–10 every 24 hours</p>
          <button
            onClick={handleDailyCheckin}
            className={`mt-3 text-[10px] font-black px-3 py-2 rounded-full transition active:scale-95 ${isDailyClaimable ? 'bg-green-500 text-black' : 'bg-white/10 text-zinc-500'}`}
          >
            {isDailyClaimable ? 'CLAIM NOW' : 'CLAIMED'}
          </button>
        </div>
        <button
          onClick={onStreakClick}
          className="bg-[#15181D] border border-white/5 rounded-2xl p-4 text-left active:scale-[0.98] transition"
        >
          <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </span>
          <p className="text-sm font-extrabold text-white mt-3 leading-tight">Streak Rewards</p>
          <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">Watch an ad, claim daily</p>
          <span className="inline-block mt-3 text-[10px] font-black px-3 py-2 rounded-full bg-white/10 text-white">
            OPEN VAULT
          </span>
        </button>
      </div>

      {/* Ways to earn */}
      <div>
        <div className="flex items-end justify-between px-1 mb-3">
          <h2 className="text-base font-black text-white">Ways to Earn</h2>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Start earning now</span>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: <PlayCircleIcon className="w-5 h-5" strokeWidth={2} />, bg: 'bg-rose-500/10 text-rose-400', title: 'Watch Ads', desc: 'Watch short video ads and earn for every view.', tag: 'POPULAR', tagClass: 'text-rose-300 bg-rose-500/10', onClick: onWatchAdsClick },
            { icon: <Rocket className="w-5 h-5" strokeWidth={2} />, bg: 'bg-teal-500/10 text-teal-400', title: 'Surveys', desc: 'Complete CPX Research surveys — the highest-paying offers.', tag: 'HIGH PAYING', tagClass: 'text-amber-300 bg-amber-500/10', onClick: onTaskWallClick },
            { icon: <Zap className="w-5 h-5" strokeWidth={2} />, bg: 'bg-cyan-500/10 text-cyan-400', title: 'Offer Walls', desc: 'More apps and offers from Wannads.', tag: '', tagClass: '', onClick: onOfferWallClick },
            { icon: <Rocket className="w-5 h-5" strokeWidth={2} />, bg: 'bg-cyan-500/10 text-cyan-400', title: 'Earn Zone', desc: 'Install apps & complete offers — top payouts.', tag: 'HIGH PAYING', tagClass: 'text-amber-300 bg-amber-500/10', onClick: onTasksClick },
            { icon: <SparklesIcon className="w-5 h-5" strokeWidth={2} />, bg: 'bg-sky-500/10 text-sky-400', title: 'Easy Tasks', desc: 'Quick micro-tasks with instant rewards.', tag: '', tagClass: '', onClick: onEasyTaskClick },
            { icon: <MessageCircle className="w-5 h-5" strokeWidth={2} />, bg: 'bg-emerald-500/10 text-emerald-400', title: 'Social Tasks', desc: 'Earn bonuses for social media actions.', tag: '', tagClass: '', onClick: onSocialTaskPlusClick },
          ].map((row) => (
            <button
              key={row.title}
              onClick={row.onClick}
              className="w-full flex items-center gap-3 bg-[#15181D] rounded-2xl border border-white/5 px-4 py-3.5 text-left active:scale-[0.99] transition"
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${row.bg}`}>{row.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white leading-tight">{row.title}</span>
                  {row.tag && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${row.tagClass}`}>{row.tag}</span>}
                </span>
                <span className="block text-[11px] text-zinc-400 font-semibold truncate mt-0.5">{row.desc}</span>
              </span>
              <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Referral banner */}
      <button
        onClick={onInviteClick}
        className="w-full flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl px-4 py-4 text-left active:scale-[0.99] transition shadow-lg shadow-none"
      >
        <span className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
          <InviteIcon className="w-5 h-5 text-white" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-black text-white leading-tight">Invite &amp; Earn — up to Rs. 125 per friend</span>
          <span className="block text-[11px] text-white/80 font-semibold">Get paid for every friend who activates an account</span>
        </span>
        <ArrowRight className="w-4 h-4 text-white shrink-0" />
      </button>

      {/* Promotions */}
      <QuickPromotions balance={balance} onUpdateBalance={onUpdateBalance} />

      {/* More */}
      <div>
        <h2 className="text-base font-black text-white px-1 mb-3">More</h2>
        <div className="bg-[#15181D] rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden">
          <button onClick={onLotteryClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition">
            <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 shrink-0"><TicketIcon className="w-4 h-4" /></span>
            <span className="flex-1 text-sm font-bold text-zinc-100">Lottery</span>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </button>
          <button onClick={onLeaderboardClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition">
            <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 shrink-0"><Trophy className="w-4 h-4" /></span>
            <span className="flex-1 text-sm font-bold text-zinc-100">Leaderboard</span>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </button>
          <button onClick={onHistoryClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition">
            <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 shrink-0"><Clock className="w-4 h-4" /></span>
            <span className="flex-1 text-sm font-bold text-zinc-100">Earning History</span>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </button>
          {role === 'partner' ? (
            <button onClick={onPartnerToolsClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition">
              <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 shrink-0"><Crown className="w-4 h-4" /></span>
              <span className="flex-1 text-sm font-bold text-zinc-100">Partner Tools</span>
              <ArrowRight className="w-4 h-4 text-zinc-600" />
            </button>
          ) : (
            <button onClick={onPartnerUpgradeClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition">
              <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 shrink-0"><Crown className="w-4 h-4" /></span>
              <span className="flex-1 text-sm font-bold text-zinc-100">Become a PRO Partner</span>
              <ArrowRight className="w-4 h-4 text-zinc-600" />
            </button>
          )}
          <button onClick={onSupportAIClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition">
            <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 shrink-0"><Headphones className="w-4 h-4" /></span>
            <span className="flex-1 text-sm font-bold text-zinc-100">Live Support</span>
            {unreadChatCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">{unreadChatCount}</span>
            )}
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </button>
          <button onClick={() => window.open('https://whatsapp.com/channel/0029VbCpKTp2P59cvqS4CL2L', '_blank')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition">
            <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 shrink-0"><MessageCircle className="w-4 h-4" /></span>
            <span className="flex-1 text-sm font-bold text-zinc-100">WhatsApp Channel</span>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
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
