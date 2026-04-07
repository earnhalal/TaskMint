import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  User, 
  Bell, 
  PlaySquare, 
  ClipboardList,
  Briefcase,
  X,
  Sparkles,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { doc, onSnapshot, collection, getDocs, query, orderBy, limit, updateDoc, increment, setDoc, getDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  sendDepositRequestMail, 
  sendWithdrawalRequestMail, 
  sendActivationMail, 
  playNotificationSound,
  sendDepositApprovedMail,
  sendWithdrawalApprovedMail
} from '../services/notificationService';
import SpinWheel from '../components/SpinWheel';
import HomeTab from '../components/dashboard/HomeTab';
import ProfileTab from '../components/dashboard/ProfileTab';
import InviteTab from '../components/dashboard/InviteTab';
import WithdrawTab from '../components/dashboard/WithdrawTab';
import DepositTab from '../components/dashboard/DepositTab';
import PremiumModal from '../components/dashboard/PremiumModal';
import LeaderboardView from '../components/dashboard/LeaderboardView';
import PinLockView from '../components/PinLockView';
import UpdatesView from '../components/dashboard/UpdatesView';

import EditProfileView from '../components/dashboard/EditProfileView';

import WatchTab from '../components/dashboard/WatchTab';
import TasksTab from '../components/dashboard/TasksTab';
import ManageWalletView from '../components/dashboard/ManageWalletView';
import LotteryView from '../components/dashboard/LotteryView';
import StreakRewardView from '../components/dashboard/StreakRewardView';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showNotification, setShowNotification] = useState(true);
  const [pinMode, setPinMode] = useState<'enter' | 'set'>('set');
  const [pendingWithdrawal, setPendingWithdrawal] = useState<{amount: number, method: string} | null>(null);
  const [userPin, setUserPin] = useState('');
  const [seenUpdates, setSeenUpdates] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [withdrawalAccounts, setWithdrawalAccounts] = useState<any[]>([]);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState('Inactive');
  const [referralStats, setReferralStats] = useState({
    totalInvited: 0,
    activeMembers: 0,
    totalCommission: 0
  });
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('Sana just earned <span class="font-bold">Rs 2000</span> from a Referral Bonus!');
  const [isNotificationAnimating, setIsNotificationAnimating] = useState(true);

  const names = ['Ahmed', 'Fatima', 'Ali', 'Ayesha', 'Zainab', 'Bilal', 'Hassan', 'Sana', 'Usman', 'Maryam', 'Abdullah', 'Khadija'];
  const amounts = [100, 250, 500, 750, 1000, 1250, 2000];
  const eventTemplates = [
    { action: 'earned', source: 'from Spin & Win!' },
    { action: 'earned', source: 'by completing a Task!' },
    { action: 'earned', source: 'from a Referral Bonus!' }
  ];

  const [balance, setBalance] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [topEarners, setTopEarners] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Listener for user profile
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBalance(data.balance || 0);
        setWithdrawalHistory(data.withdrawalHistory || []);
        setDepositHistory(data.depositHistory || []);
        setUserPin(data.pin || '');
        setSeenUpdates(data.seenUpdates || []);
        setUserName(data.username || '');
        setUserEmail(data.email || '');
        setUserPhone(data.phone || '');
        setWithdrawalAccounts(data.withdrawalAccounts || []);
        setTwoFactorAuth(data.twoFactorAuth || false);
        setJoiningDate(data.joiningDate || '');
        setStatus(data.status || 'Inactive');
        setReferralStats(data.referralStats || {
          totalInvited: 0,
          activeMembers: 0,
          totalCommission: 0
        });
        setReferredBy(data.referredBy || null);
      }
    });

    // Listener for notifications
    const qNotify = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubscribeNotify = onSnapshot(qNotify, (snapshot) => {
      const notifyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Play sound if a new notification is added (not just initial load)
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !snapshot.metadata.fromCache) {
          playNotificationSound();
        }
      });
      
      setNotifications(notifyData);
    });

    const fetchTasks = async () => {
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
    };
    fetchTasks();

    const q = query(collection(db, 'users'), orderBy('balance', 'desc'), limit(10));
    const unsubscribeEarners = onSnapshot(q, (snapshot) => {
      const earnersData = snapshot.docs.map((doc, index) => ({ 
        id: doc.id, 
        rank: index + 1,
        ...doc.data() 
      }));
      setTopEarners(earnersData);
    });

    return () => {
      unsubscribe();
      unsubscribeEarners();
    };
  }, [user]);

  useEffect(() => {
    // localStorage.setItem('taskmint_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    // localStorage.setItem('taskmint_withdrawals', JSON.stringify(withdrawalHistory));
  }, [withdrawalHistory]);

  useEffect(() => {
    // localStorage.setItem('taskmint_seen_updates', JSON.stringify(seenUpdates));
  }, [seenUpdates]);

  useEffect(() => {
    const notificationInterval = setInterval(() => {
      setIsNotificationAnimating(false);
      setTimeout(() => {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
        const randomEvent = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
        setNotificationMessage(`${randomName} just ${randomEvent.action} <span class="font-bold">Rs ${randomAmount}</span> ${randomEvent.source}`);
        setIsNotificationAnimating(true); 
      }, 500);
    }, 5000);
    return () => clearInterval(notificationInterval);
  }, []);

  useEffect(() => {
    const lastSpin = localStorage.getItem('taskmint_last_spin');
    if (lastSpin) {
      const lastSpinDate = new Date(parseInt(lastSpin));
      const now = new Date();
      const diffHours = Math.abs(now.getTime() - lastSpinDate.getTime()) / 36e5;
      if (diffHours >= 24) {
        setFreeSpins(1);
      }
    } else {
      setFreeSpins(1);
    }
  }, []);

  const handleUseFreeSpin = () => {
    setFreeSpins(0);
    localStorage.setItem('taskmint_last_spin', Date.now().toString());
  };

  const handleUpdateBalance = async (amount: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        balance: increment(amount)
      });
    } catch (error) {
      console.error("Error updating balance:", error);
      // Fallback to local state if Firestore fails
      setBalance(prev => prev + amount);
    }
  };

  const handleWithdraw = async (amount: number, method: string) => {
    if (!user) return;
    handleUpdateBalance(-amount);
    const newTx = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      amount,
      method,
      status: 'Pending'
    };
    setWithdrawalHistory(prev => [newTx, ...prev]);
    
    // Send internal notification
    await sendWithdrawalRequestMail(user.uid, amount, method);
  };

  const handleDeposit = async (amount: number, method: string, transactionId: string, type: 'activation' | 'regular' = 'regular') => {
    if (!user) return;
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const depositId = `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTx = {
      id: depositId,
      userId: user.uid,
      userName: userName,
      amount,
      method,
      transactionId,
      date: new Date().toISOString(),
      status: 'Pending',
      type,
      description: type === 'activation' ? 'Account Activation Fee' : `${method} Deposit`
    };

    // Save to global deposits collection for admin
    await setDoc(doc(db, 'deposits', depositId), newTx);
    
    // Send internal notification
    await sendDepositRequestMail(user.uid, amount, method);

    // Update user's local deposit history (optional, as we have a listener)
    const updatedHistory = [newTx, ...depositHistory];
    setDepositHistory(updatedHistory);

    if (type === 'activation') {
      alert("Activation request submitted! Your account will be activated once the payment is verified.");
      setActiveTab('home');
    }
  };

  const handleActivateAccount = async () => {
    // This would normally be triggered by an admin approving the deposit
    // For now, we'll provide a way to simulate activation or just show the deposit tab
    setActiveTab('deposit');
  };

  const handleWithdrawRequest = (amount: number, method: string) => {
    if (user && !user.emailVerified) {
      alert("Please verify your email address before making a withdrawal. Check your inbox for the verification link.");
      return;
    }
    if (userPin) {
      setPendingWithdrawal({ amount, method });
      setPinMode('enter');
      setActiveTab('pin');
    } else {
      handleWithdraw(amount, method);
    }
  };

  const handlePinSet = (pin: string) => {
    setUserPin(pin);
    localStorage.setItem('taskmint_pin', pin);
    setActiveTab('withdraw');
  };

  const handlePinCorrect = () => {
    setActiveTab('withdraw');
    if (pendingWithdrawal) {
      handleWithdraw(pendingWithdrawal.amount, pendingWithdrawal.method);
      setPendingWithdrawal(null);
    }
  };

  const unreadUpdatesCount = notifications.filter(n => n.status === 'unread').length;

  const handleActivateUser = async (targetUserId: string) => {
    try {
      const userRef = doc(db, 'users', targetUserId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      if (userData.status === 'Active') return;

      // 1. Activate the user
      await updateDoc(userRef, { status: 'Active' });
      
      // Send internal notification
      await sendActivationMail(targetUserId);

      // 2. Handle Direct Referral (Level 1)
      if (userData.referredBy) {
        const l1Ref = doc(db, 'users', userData.referredBy);
        const l1Doc = await getDoc(l1Ref);
        
        if (l1Doc.exists()) {
          const l1Data = l1Doc.data();
          await updateDoc(l1Ref, {
            balance: increment(40),
            'referralStats.activeMembers': increment(1),
            'referralStats.totalCommission': increment(40)
          });

          // 3. Handle Indirect Referral (Level 2)
          if (l1Data.referredBy) {
            const l2Ref = doc(db, 'users', l1Data.referredBy);
            const l2Doc = await getDoc(l2Ref);
            if (l2Doc.exists()) {
              await updateDoc(l2Ref, {
                balance: increment(10),
                'referralStats.totalCommission': increment(10)
              });
            }
          }
        }
      }
      
      if (targetUserId === user?.uid) {
        setStatus('Active');
      }
      alert("User activated and commissions distributed!");
    } catch (error) {
      console.error("Error activating user:", error);
    }
  };

  useEffect(() => {
    (window as any).simulateActivation = () => {
      if (user) handleActivateUser(user.uid);
    };
    (window as any).simulateDepositApproval = async (amount: number) => {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { balance: increment(amount) });
        await sendDepositApprovedMail(user.uid, amount);
      }
    };
    (window as any).simulateWithdrawalApproval = async (amount: number) => {
      if (user) {
        await sendWithdrawalApprovedMail(user.uid, amount);
      }
    };
    return () => {
      delete (window as any).simulateActivation;
      delete (window as any).simulateDepositApproval;
      delete (window as any).simulateWithdrawalApproval;
    };
  }, [user]);

  const renderTabContent = () => {
    // Restriction logic
    const isInactive = status === 'Inactive';
    const earningTabs = ['spin', 'tasks', 'watch', 'lottery', 'streak'];
    
    if (isInactive && earningTabs.includes(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Inactive</h2>
          <p className="text-slate-500 mb-8 max-w-xs">
            You need to activate your account by paying the Rs 100 joining fee to access earning features.
          </p>
          <button 
            onClick={() => setActiveTab('invite')}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
          >
            Go to Activation Page
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return <ProfileTab 
                 name={userName}
                 email={userEmail}
                 status={status}
                 accountNumber={withdrawalAccounts[0]?.number || ''}
                 accountTitle={withdrawalAccounts[0]?.title || ''}
                 joiningDate={joiningDate}
                 onEditProfile={() => setActiveTab('edit_profile')} 
                 onLeaderboardClick={() => setActiveTab('leaderboard')} 
                 onManageWalletClick={() => setActiveTab('manage_wallet')}
               />;
      case 'edit_profile':
        return <EditProfileView 
                 name={userName}
                 email={userEmail}
                 phone={userPhone}
                 accountNumber={withdrawalAccounts[0]?.number || ''}
                 accountTitle={withdrawalAccounts[0]?.title || ''}
                 onBack={() => setActiveTab('profile')} 
               />;
      case 'manage_wallet':
        return <ManageWalletView 
                 balance={balance}
                 accounts={withdrawalAccounts}
                 onBack={() => setActiveTab('profile')} 
               />;
      case 'invite':
        return <InviteTab 
          status={status}
          referralStats={referralStats}
          referralCode={user?.uid || ''}
          onActivateClick={() => setActiveTab('deposit')}
        />;
      case 'lottery':
        return <LotteryView 
          onBack={() => setActiveTab('home')} 
          balance={balance} 
          onUpdateBalance={handleUpdateBalance} 
        />;
      case 'streak':
        return <StreakRewardView 
          onBack={() => setActiveTab('home')} 
          onUpdateBalance={handleUpdateBalance} 
        />;
      case 'withdraw':
        return <WithdrawTab 
          balance={balance} 
          history={withdrawalHistory} 
          onWithdraw={handleWithdrawRequest} 
          hasPin={!!userPin} 
          onSetupPin={() => { setPinMode('set'); setActiveTab('pin'); }}
          onEditAccount={() => setActiveTab('manage_wallet')}
          accounts={withdrawalAccounts}
        />;
      case 'deposit':
        return <DepositTab
          onDeposit={handleDeposit}
          transactions={depositHistory}
          initialType={status === 'Inactive' ? 'activation' : 'regular'}
        />;
      case 'updates':
        return <UpdatesView 
          updates={notifications}
          onMarkAsRead={async (id) => {
            await updateDoc(doc(db, 'notifications', id), { status: 'read' });
          }}
          onMarkAllAsRead={async () => {
            const unread = notifications.filter(n => n.status === 'unread');
            for (const n of unread) {
              await updateDoc(doc(db, 'notifications', n.id), { status: 'read' });
            }
          }}
        />;
      case 'spin':
        return <SpinWheel 
          onClose={() => setActiveTab('home')} 
          balance={balance}
          onUpdateBalance={handleUpdateBalance}
          freeSpins={freeSpins}
          onUseFreeSpin={handleUseFreeSpin}
        />;
      case 'premium':
        return <PremiumModal onClose={() => setActiveTab('home')} />;
      case 'pin':
        return <PinLockView
          mode={pinMode}
          onClose={() => { setActiveTab('withdraw'); setPendingWithdrawal(null); }}
          onPinSet={handlePinSet}
          onPinCorrect={handlePinCorrect}
          pinToVerify={userPin}
          onSkip={() => setActiveTab('withdraw')}
        />;
      case 'watch':
        return <WatchTab />;
      case 'tasks':
        return <TasksTab tasks={tasks} />;
      case 'leaderboard':
        return <LeaderboardView earners={topEarners} onBack={() => setActiveTab('home')} />;
      // Add other tabs as needed
      default:
        return <HomeTab 
          name={userName}
          balance={balance}
          status={status}
          topEarners={topEarners}
          onSpinClick={() => setActiveTab('spin')} 
          onInviteClick={() => setActiveTab('invite')}
          onDepositClick={() => setActiveTab('deposit')}
          onWithdrawClick={() => setActiveTab('withdraw')}
          onWatchAdsClick={() => setActiveTab('watch')}
          onTasksClick={() => setActiveTab('tasks')}
          onProfileClick={() => setActiveTab('profile')}
          onLotteryClick={() => setActiveTab('lottery')}
          onStreakClick={() => setActiveTab('streak')}
          onLeaderboardClick={() => setActiveTab('leaderboard')}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center p-0 sm:p-6 font-sans">
      {/* Mobile App Container */}
      <div className="w-full max-w-[400px] bg-slate-50 h-[100dvh] sm:h-[850px] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden border-0 sm:border-[8px] border-slate-800">
        
        {/* Notch simulation (Desktop only) */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-3xl z-50"></div>

        {/* Top Notification Bar */}
        <AnimatePresence>
          {showNotification && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#151E32] text-white text-xs py-2 px-4 flex items-center justify-between z-20 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
              <div className="flex items-center gap-2 relative z-10 w-full">
                <Bell className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                <span 
                  className={`transition-opacity duration-500 truncate ${isNotificationAnimating ? 'opacity-100' : 'opacity-0'}`}
                  dangerouslySetInnerHTML={{ __html: notificationMessage }}
                />
              </div>
              <button onClick={() => setShowNotification(false)} className="text-slate-400 hover:text-white relative z-10 shrink-0 ml-2">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="px-5 py-4 bg-white/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-gray-100">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tighter">
              Task<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">Mint</span>
            </h1>
          </div>
          <button 
            onClick={() => setActiveTab('updates')}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors group"
          >
            <Mail className="w-6 h-6 text-slate-600 transition-colors group-hover:text-amber-600" />
            {unreadUpdatesCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                {unreadUpdatesCount > 9 ? '9+' : unreadUpdatesCount}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-6 hide-scrollbar bg-slate-50/50">
          {renderTabContent()}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-3 pb-6 sm:pb-4 z-20">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[
              { id: 'home', icon: <Home className="w-6 h-6" />, label: 'HOME' },
              { id: 'watch', icon: <PlaySquare className="w-6 h-6" />, label: 'WATCH' },
              { id: 'tasks', icon: <ClipboardList className="w-6 h-6" />, label: 'TASK WALL' },
              { id: 'premium', icon: <Briefcase className="w-6 h-6" />, label: 'PREMIUM' },
              { id: 'profile', icon: <User className="w-6 h-6" />, label: 'PROFILE' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 w-16 ${activeTab === tab.id ? 'text-yellow-600' : 'text-slate-400 hover:text-slate-600'} transition-colors`}
              >
                <div className={`transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>
                  {tab.icon}
                </div>
                <span className="text-[9px] font-bold tracking-wider">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute -top-3 w-8 h-1 bg-yellow-500 rounded-b-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

