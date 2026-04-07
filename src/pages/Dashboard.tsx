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
  AlertTriangle,
  Crown
} from 'lucide-react';
import { doc, onSnapshot, collection, getDocs, query, orderBy, limit, updateDoc, increment, setDoc, getDoc, where } from 'firebase/firestore';
import { db, auth, rtdb } from '../firebase';
import { ref, onValue, update, set, increment as rtdbIncrement } from 'firebase/database';
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
import PartnerUpgradeView from '../components/dashboard/PartnerUpgradeView';
import AdminPanelView from '../components/dashboard/AdminPanelView';
import ActivationTab from '../components/dashboard/ActivationTab';

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
  const [accountStatus, setAccountStatus] = useState('inactive');
  const [role, setRole] = useState('user');
  const [partnerStatus, setPartnerStatus] = useState('none');
  const [totalTeamEarnings, setTotalTeamEarnings] = useState(0);
  const [referralStats, setReferralStats] = useState({
    totalInvited: 0,
    activeMembers: 0,
    totalCommission: 0
  });
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('Sana just earned <span class="font-bold">Rs 2000</span> from a Referral Bonus!');
  const [isNotificationAnimating, setIsNotificationAnimating] = useState(true);
  const [partnerReferrals, setPartnerReferrals] = useState<any[]>([]);

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
  const [appSettings, setAppSettings] = useState({
    activationFee: 100,
    partnerFee: 2500,
    paymentNumber: '0312-3456789',
    paymentName: 'TaskMint Admin',
    referralBonusBasic: 30,
    referralBonusPartner: 70,
    indirectReferralBonus: 10
  });

  useEffect(() => {
    if (!user) return;

    // Listener for user profile
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBalance(data.balance || 0);
        setWithdrawalHistory(data.withdrawalHistory || []);
        setUserPin(data.pin || '');
        setSeenUpdates(data.seenUpdates || []);
        setUserName(data.username || '');
        setUserEmail(data.email || '');
        setUserPhone(data.phone || '');
        setWithdrawalAccounts(data.withdrawalAccounts || []);
        setTwoFactorAuth(data.twoFactorAuth || false);
        setJoiningDate(data.joiningDate || '');
        setRole(data.role || 'user');
        setPartnerStatus(data.partnerStatus || 'none');
        setTotalTeamEarnings(data.totalTeamEarnings || 0);
        setReferredBy(data.referredBy || null);
      }
    });

    // Listener for referral stats from RTDB
    const referralRef = ref(rtdb, `invites/${user.uid}`);
    const unsubscribeReferral = onValue(referralRef, (snapshot) => {
      const data = snapshot.val();
      setReferralStats(data || {
        totalInvited: 0,
        activeMembers: 0,
        totalCommission: 0
      });
    });

    // Listener for user status from RTDB
    const statusRef = ref(rtdb, `users/${user.uid}/status`);
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      if (status) {
        setStatus(status);
        setAccountStatus(status);
      } else {
        // Default to inactive if no status in RTDB
        setStatus('inactive');
        setAccountStatus('inactive');
      }
    });

    // Listener for deposits
    const qDeposits = query(
      collection(db, 'deposits'),
      where('userId', '==', user.uid)
    );
    const unsubscribeDeposits = onSnapshot(qDeposits, (snapshot) => {
      const depositsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      depositsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDepositHistory(depositsData);
    }, (error) => console.error("Deposits Error:", error));

    // Listener for withdrawals
    const qWithdrawals = query(
      collection(db, 'withdrawals'),
      where('userId', '==', user.uid)
    );
    const unsubscribeWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
      const withdrawalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      withdrawalsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWithdrawalHistory(withdrawalsData);
    }, (error) => console.error("Withdrawals Error:", error));

    // Listener for notifications
    const qNotify = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid)
    );
    const unsubscribeNotify = onSnapshot(qNotify, (snapshot) => {
      const notifyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      notifyData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Play sound if a new notification is added (not just initial load)
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !snapshot.metadata.fromCache) {
          playNotificationSound();
        }
      });
      
      setNotifications(notifyData);
    }, (error) => console.error("Notifications Error:", error));

    // Listener for Partner Referrals (if user is a partner)
    let unsubscribePartner: any = null;
    if (role === 'partner') {
      const qPartner = query(
        collection(db, 'users'),
        where('referredBy', '==', user.uid)
      );
      unsubscribePartner = onSnapshot(qPartner, (snapshot) => {
        const referrals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPartnerReferrals(referrals);
      });
    }

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

    // Listener for app settings
    const unsubscribeSettings = onSnapshot(doc(db, 'app_settings', 'global'), (doc) => {
      if (doc.exists()) {
        setAppSettings(doc.data() as any);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeNotify();
      unsubscribeEarners();
      unsubscribeDeposits();
      unsubscribeWithdrawals();
      unsubscribeSettings();
      unsubscribeReferral();
      unsubscribeStatus();
      if (unsubscribePartner) unsubscribePartner();
    };
  }, [user, role]);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'app_settings', 'global'), (doc) => {
      if (doc.exists()) {
        setAppSettings(doc.data() as any);
      }
    });
    return () => unsubscribeSettings();
  }, []);

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

      // Team Commission Logic: If user has a referrer who is a Partner, give them 10%
      if (amount > 0 && referredBy) {
        const referrerRef = doc(db, 'users', referredBy);
        const referrerDoc = await getDoc(referrerRef);
        if (referrerDoc.exists()) {
          const referrerData = referrerDoc.data();
          if (referrerData.role === 'partner') {
            const commission = amount * 0.1;
            await updateDoc(referrerRef, {
              balance: increment(commission),
              totalTeamEarnings: increment(commission)
            });
          }
        }
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      // Fallback to local state if Firestore fails
      setBalance(prev => prev + amount);
    }
  };

  const handleWithdraw = async (amount: number, method: string) => {
    if (!user) return;
    handleUpdateBalance(-amount);
    const withdrawalId = `wd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTx = {
      id: withdrawalId,
      userId: user.uid,
      userName: userName,
      date: new Date().toISOString(),
      amount,
      method,
      status: 'Pending'
    };
    
    // Save to global withdrawals collection
    await setDoc(doc(db, 'withdrawals', withdrawalId), newTx);
    
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

    if (type === 'activation') {
      // Save to RTDB pending_requests (Zero Firestore)
      const pendingRef = ref(rtdb, `pending_requests/${user.uid}`);
      await set(pendingRef, {
        ...newTx,
        timestamp: Date.now()
      });
      
      // Update status in RTDB to pending
      const userStatusRef = ref(rtdb, `users/${user.uid}`);
      await update(userStatusRef, { status: 'pending' });
      
      alert("Activation request submitted! Your account will be activated once the payment is verified.");
      setActiveTab('home');
    } else {
      // Regular deposit still goes to Firestore
      await setDoc(doc(db, 'deposits', depositId), newTx);
    }
    
    // Send internal notification
    await sendDepositRequestMail(user.uid, amount, method);
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

  const handleApprovePartner = async (targetUserId: string, requestId: string) => {
    try {
      await updateDoc(doc(db, 'users', targetUserId), { 
        role: 'partner',
        partnerStatus: 'active'
      });
      await updateDoc(doc(db, 'partnerRequests', requestId), { status: 'approved' });
      alert("Partner request approved!");
    } catch (error) {
      console.error("Error approving partner:", error);
    }
  };

  const handleApproveDeposit = async (targetUserId: string, depositId: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'users', targetUserId), { 
        balance: increment(amount)
      });
      await updateDoc(doc(db, 'deposits', depositId), { status: 'Approved' });
      await sendDepositApprovedMail(targetUserId, amount);
      alert("Deposit approved!");
    } catch (error) {
      console.error("Error approving deposit:", error);
    }
  };

  const handleApproveWithdrawal = async (targetUserId: string, withdrawalId: string) => {
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      const withdrawalDoc = await getDoc(withdrawalRef);
      if (!withdrawalDoc.exists()) return;
      const withdrawalData = withdrawalDoc.data();

      await updateDoc(withdrawalRef, { status: 'Approved' });
      await sendWithdrawalApprovedMail(targetUserId, withdrawalData.amount);
      alert("Withdrawal approved!");
    } catch (error) {
      console.error("Error approving withdrawal:", error);
    }
  };

  const unreadUpdatesCount = notifications.filter(n => n.status === 'unread').length;

  const handleActivateUser = async (targetUserId: string, depositId?: string) => {
    try {
      console.log(`[ADMIN_ACTION] Activating user: ${targetUserId}`);
      const userRef = doc(db, 'users', targetUserId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        console.error(`[ADMIN_ACTION_FAILURE] User ${targetUserId} not found.`);
        alert("User document not found.");
        return;
      }
      
      const userData = userDoc.data();
      if (userData.status === 'Active') {
        console.log(`[ADMIN_ACTION] User ${targetUserId} is already active.`);
        alert("User is already active.");
        return;
      }

      // 1. Activate the user
      await updateDoc(userRef, { accountStatus: 'active' });
      // Update RTDB status
      const userStatusRef = ref(rtdb, `users/${targetUserId}`);
      await update(userStatusRef, { status: 'Active', accountStatus: 'active' });
      console.log(`[ADMIN_ACTION_SUCCESS] User ${targetUserId} status updated to Active.`);
      
      // Update deposit status if provided
      if (depositId) {
        await updateDoc(doc(db, 'deposits', depositId), { status: 'Approved' });
        console.log(`[ADMIN_ACTION_SUCCESS] Deposit ${depositId} status updated to Approved.`);
      }
      
      // Send internal notification
      await sendActivationMail(targetUserId);

      alert("User activated successfully! They now have full access with a verified badge.");

      // 2. Handle Direct Referral (Level 1)
      if (userData.referredBy) {
        const l1Ref = doc(db, 'users', userData.referredBy);
        const l1Doc = await getDoc(l1Ref);
        
        if (l1Doc.exists()) {
          const l1Data = l1Doc.data();
          const bonus = l1Data.role === 'partner' ? appSettings.referralBonusPartner : appSettings.referralBonusBasic;
          
          // Update referral stats in RTDB
          const l1ReferralRef = ref(rtdb, `invites/${userData.referredBy}`);
          await update(l1ReferralRef, {
            activeMembers: rtdbIncrement(1),
            totalCommission: rtdbIncrement(bonus)
          });

          await updateDoc(l1Ref, {
            balance: increment(bonus)
          });

          // 3. Handle Indirect Referral (Level 2)
          if (l1Data.referredBy) {
            const l2Ref = doc(db, 'users', l1Data.referredBy);
            const l2Doc = await getDoc(l2Ref);
            if (l2Doc.exists()) {
              const l2Bonus = appSettings.indirectReferralBonus;
              // Update indirect referral stats in RTDB
              const l2ReferralRef = ref(rtdb, `invites/${l1Data.referredBy}`);
              await update(l2ReferralRef, {
                totalCommission: rtdbIncrement(l2Bonus)
              });

              await updateDoc(l2Ref, {
                balance: increment(l2Bonus)
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
    (window as any).simulatePartnerApproval = async () => {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { 
          role: 'partner',
          partnerStatus: 'active'
        });
        alert("Account upgraded to Partner!");
      }
    };
    return () => {
      delete (window as any).simulateActivation;
      delete (window as any).simulateDepositApproval;
      delete (window as any).simulateWithdrawalApproval;
      delete (window as any).simulatePartnerApproval;
    };
  }, [user]);

  const renderTabContent = () => {
    // Restriction logic
    const currentAccountStatus = accountStatus.toLowerCase();
    const isInactive = currentAccountStatus !== 'active';
    const earningTabs = ['spin', 'tasks', 'watch', 'lottery', 'streak'];
    
    if (isInactive && earningTabs.includes(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {currentAccountStatus === 'pending' ? 'Activation Pending' : 'Account Inactive'}
          </h2>
          <p className="text-slate-500 mb-8 max-w-xs">
            {currentAccountStatus === 'pending' 
              ? 'Your activation request is being verified by the admin. Please wait 1-6 hours.' 
              : `You need to activate your account by paying the Rs ${appSettings.activationFee} joining fee to access earning features.`}
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
                 role={role}
                 accountNumber={withdrawalAccounts[0]?.number || ''}
                 accountTitle={withdrawalAccounts[0]?.title || ''}
                 joiningDate={joiningDate}
                 onEditProfile={() => setActiveTab('edit_profile')} 
                 onLeaderboardClick={() => setActiveTab('leaderboard')} 
                 onManageWalletClick={() => setActiveTab('manage_wallet')}
                 onPartnerUpgradeClick={() => setActiveTab('partner_upgrade')}
                 onAdminPanelClick={() => setActiveTab('admin')}
               />;
      case 'admin':
        return <AdminPanelView 
                 onBack={() => setActiveTab('profile')}
                 onApproveActivation={handleActivateUser}
                 onApprovePartner={handleApprovePartner}
                 onApproveDeposit={handleApproveDeposit}
                 onApproveWithdrawal={handleApproveWithdrawal}
               />;
      case 'partner_upgrade':
        return <PartnerUpgradeView 
                 userId={user?.uid || ''}
                 userName={userName}
                 partnerStatus={partnerStatus}
                 onBack={() => setActiveTab('profile')}
                 appSettings={appSettings}
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
          onActivateClick={() => setActiveTab('activation')}
        />;
      case 'activation':
        return <ActivationTab 
          onBack={() => setActiveTab('home')}
          appSettings={appSettings}
          userName={userName}
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
          appSettings={appSettings}
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
          accountStatus={accountStatus}
          role={role}
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
          onPartnerUpgradeClick={() => setActiveTab('partner_upgrade')}
          onActivateClick={() => setActiveTab('activation')}
          appSettings={appSettings}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center p-0 sm:p-6 font-sans">
      {/* Mobile App Container */}
      <div className={`w-full max-w-[400px] ${role === 'partner' ? 'bg-amber-50' : 'bg-slate-50'} h-[100dvh] sm:h-[850px] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden border-0 sm:border-[8px] border-slate-800`}>
        
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
        <div className={`px-5 py-4 ${role === 'partner' ? 'bg-gradient-to-r from-amber-500 to-yellow-600' : 'bg-white/95 backdrop-blur-md'} flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-gray-100`}>
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <div className={`w-9 h-9 rounded-xl ${role === 'partner' ? 'bg-white/20' : 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600'} flex items-center justify-center text-white shadow-lg shadow-amber-500/30 transition-transform group-hover:scale-105`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className={`font-black text-xl sm:text-2xl ${role === 'partner' ? 'text-white' : 'text-slate-900'} tracking-tighter`}>
              Task<span className={role === 'partner' ? 'text-white/80' : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600'}>Mint</span>
            </h1>
          </div>
          <button 
            onClick={() => setActiveTab('updates')}
            className={`relative p-2 rounded-full ${role === 'partner' ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors group`}
          >
            <Mail className={`w-6 h-6 ${role === 'partner' ? 'text-white' : 'text-slate-600'} transition-colors group-hover:text-amber-600`} />
            {unreadUpdatesCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                {unreadUpdatesCount > 9 ? '9+' : unreadUpdatesCount}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className={`flex-1 overflow-y-auto px-5 pt-6 hide-scrollbar ${role === 'partner' ? 'bg-amber-50/50' : 'bg-slate-50/50'}`}>
          {role === 'partner' && activeTab === 'home' && (
            <div className="mb-6 space-y-4">
              <div className="bg-gradient-to-br from-[#060D2D] to-[#151E32] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="font-black text-lg text-amber-400">Partner Analytics</h3>
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Team Earnings</p>
                    <p className="text-xl font-black text-white">Rs {totalTeamEarnings.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Team</p>
                    <p className="text-xl font-black text-white">{partnerReferrals.filter(r => r.status === 'Active').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Member Verification</h3>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Helper Tool</span>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {partnerReferrals.length > 0 ? partnerReferrals.map((member, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {member.username?.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{member.username}</p>
                          <p className={`text-[9px] font-bold uppercase ${member.status === 'Active' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {member.status}
                          </p>
                        </div>
                      </div>
                      {member.status === 'Inactive' && (
                        <button className="text-[9px] font-bold text-amber-600 hover:underline">Verify</button>
                      )}
                    </div>
                  )) : (
                    <p className="text-[10px] text-slate-400 text-center py-4">No team members yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
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

