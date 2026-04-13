import React, { useState, useEffect, useMemo } from 'react';
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
  Crown,
  Search,
  Layout
} from 'lucide-react';
import { 
  doc, 
  onSnapshot, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  increment, 
  setDoc, 
  getDoc, 
  where, 
  writeBatch,
  addDoc,
  serverTimestamp as firestoreServerTimestamp 
} from 'firebase/firestore';
import { db, auth, rtdb } from '../firebase';
import { ref, onValue, update, set, increment as rtdbIncrement, push, serverTimestamp, runTransaction, get } from 'firebase/database';
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
import EarningHistoryView from '../components/dashboard/EarningHistoryView';
import SocialTaskPlusView from '../components/dashboard/SocialTaskPlusView';
import PremiumModal from '../components/dashboard/PremiumModal';
import LeaderboardView from '../components/dashboard/LeaderboardView';
import PinLockView from '../components/PinLockView';
import UpdatesView from '../components/dashboard/UpdatesView';
import PartnerUpgradeView from '../components/dashboard/PartnerUpgradeView';
import AdminPanelView from '../components/dashboard/AdminPanelView';
import ActivationTab from '../components/dashboard/ActivationTab';

import EditProfileView from '../components/dashboard/EditProfileView';

import TaskWall from '../components/dashboard/TaskWall';
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
  const [referralCode, setReferralCode] = useState<string>('');
  const [showReferralUpdateNotify, setShowReferralUpdateNotify] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('Sana just earned <span class="font-bold">Rs 2000</span> from a Referral Bonus!');
  const [isNotificationAnimating, setIsNotificationAnimating] = useState(true);
  const [partnerReferrals, setPartnerReferrals] = useState<any[]>([]);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  const names = ['Ahmed', 'Fatima', 'Ali', 'Ayesha', 'Zainab', 'Bilal', 'Hassan', 'Sana', 'Usman', 'Maryam', 'Abdullah', 'Khadija'];
  const amounts = [100, 250, 500, 750, 1000, 1250, 2000];
  const eventTemplates = [
    { action: 'earned', source: 'from Spin & Win!' },
    { action: 'earned', source: 'by completing a Task!' },
    { action: 'earned', source: 'from a Referral Bonus!' }
  ];

  const [balance, setBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [appBonusClaimed, setAppBonusClaimed] = useState(false);
  const [lastDailyCheckin, setLastDailyCheckin] = useState<any>(null);
  const [freeSpins, setFreeSpins] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const withdrawalHistory = useMemo(() => {
    return [...withdrawals].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [withdrawals]);
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [topEarners, setTopEarners] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState({
    activationFee: 100,
    partnerFee: 1000,
    paymentNumber: '03338739929',
    paymentName: 'M-WASEEM',
    referralBonusBasic: 50,
    referralBonusPartner: 70,
    indirectReferralBonus: 10
  });

  useEffect(() => {
    document.title = 'Dashboard - TaskMint';
    if (!user) return;

    // Listener for user profile
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBalance(data.balance || 0);
        setTotalEarnings(data.totalEarnings || 0);
        setLockedBalance(data.lockedBalance || 0);
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
        setReferralCode(data.referralCode || '');
        setAppBonusClaimed(data.appBonusClaimed || false);
        setLastDailyCheckin(data.lastDailyCheckin || null);
        setIsProfileLoaded(true);

        // Cleanup Earning History (Older than 30 days)
        const cleanupHistory = async () => {
          try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            // Simplified query to avoid composite index
            const q = query(
              collection(db, 'earning_history'),
              where('userId', '==', user.uid)
            );
            
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              const oldDocs = snapshot.docs.filter(doc => {
                const data = doc.data();
                const ts = data.timestamp?.toDate ? data.timestamp.toDate() : null;
                return ts && ts < thirtyDaysAgo;
              });

              if (oldDocs.length > 0) {
                console.log(`[CLEANUP] Found ${oldDocs.length} old earning history records. Deleting...`);
                const batch = writeBatch(db);
                oldDocs.forEach(doc => {
                  batch.delete(doc.ref);
                });
                await batch.commit();
                console.log("[CLEANUP] Old earning history deleted successfully.");
              }
            }
          } catch (error) {
            console.error("Error cleaning up earning history:", error);
          }
        };
        cleanupHistory();

        // Migration logic for old users
        if (!data.referralCode && data.username) {
          const generateCode = async () => {
            const phoneSuffix = (data.phone || '').slice(-3) || Math.floor(100 + Math.random() * 900).toString();
            const newCode = `${data.username.toLowerCase()}_${phoneSuffix}`;
            await setDoc(doc(db, 'users', user.uid), { referralCode: newCode }, { merge: true });
            setReferralCode(newCode);
            setShowReferralUpdateNotify(true);
          };
          generateCode();
        }
      } else {
        // If Firestore doc doesn't exist, try to recover from RTDB
        console.log("[MIGRATION] Firestore document missing for user:", user.uid);
        const rtdbRef = ref(rtdb, `users/${user.uid}`);
        const rtdbSnap = await get(rtdbRef);
        if (rtdbSnap.exists()) {
          const rtdbData = rtdbSnap.val();
          await setDoc(doc(db, 'users', user.uid), {
            ...rtdbData,
            lockedBalance: rtdbData.lockedBalance || 0,
            appBonusClaimed: rtdbData.appBonusClaimed || false,
            lastDailyCheckin: rtdbData.lastDailyCheckin || null,
            pin: '',
            withdrawalAccounts: [],
            seenUpdates: []
          });
          console.log("[MIGRATION] Firestore document created from RTDB data");
          setIsProfileLoaded(true);
        } else {
          setIsProfileLoaded(true);
        }
      }
    });

    // Listener for user status from RTDB
    const statusRef = ref(rtdb, `users/${user.uid}/status`);
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      if (status) {
        setStatus(status);
        setAccountStatus(status);
        if (status.toLowerCase() !== 'active' && !sessionStorage.getItem('inactiveModalShown')) {
          setShowInactiveModal(true);
          sessionStorage.setItem('inactiveModalShown', 'true');
        }
      } else {
        // Default to inactive if no status in RTDB
        setStatus('inactive');
        setAccountStatus('inactive');
        if (!sessionStorage.getItem('inactiveModalShown')) {
          setShowInactiveModal(true);
          sessionStorage.setItem('inactiveModalShown', 'true');
        }
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

    // Listener for withdrawals from RTDB (Single node)
    const withdrawalsRef = ref(rtdb, `withdrawals/${user.uid}`);
    
    const unsubscribeWithdrawals = onValue(withdrawalsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
      setWithdrawals(list);
    });

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

    // Listener for Referrals (from RTDB)
    const referralsRef = ref(rtdb, `invites/${user.uid}/history`);
    const unsubscribeReferrals = onValue(referralsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const referrals = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        }));
        setPartnerReferrals(referrals);
      } else {
        setPartnerReferrals([]);
      }
    }, (error) => console.error("Referrals Error:", error));

    // Listener for Referral Stats (from RTDB)
    const statsRef = ref(rtdb, `users/${user.uid}`);
    const unsubscribeStats = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setReferralStats({
          totalInvited: data.totalInvited || 0,
          activeMembers: data.activeMembers || 0,
          totalCommission: data.totalCommission || 0
        });
      }
    }, (error) => console.error("Referral Stats Error:", error));

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
      unsubscribeReferrals();
      unsubscribeStats();
      unsubscribeStatus();
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
    // Real-time winners listener
    const winnersRef = ref(rtdb, 'spin_winners');
    let realWinnerFound = false;

    const unsubscribe = onValue(winnersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data) as any[];
        const sorted = list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (sorted.length > 0) {
          realWinnerFound = true;
          const latest = sorted[0];
          setIsNotificationAnimating(false);
          setTimeout(() => {
            setNotificationMessage(`${latest.userName} just won <span class="font-bold">${latest.prize}</span> from Spin & Win!`);
            setIsNotificationAnimating(true);
          }, 500);
        }
      }
    });

    // Fallback interval if no real winners exist yet or to keep it dynamic
    const fallbackInterval = setInterval(() => {
      if (!realWinnerFound || Math.random() > 0.7) { // 30% chance to show a fake one even if real ones exist, to keep it busy
        setIsNotificationAnimating(false);
        setTimeout(() => {
          const randomName = names[Math.floor(Math.random() * names.length)];
          const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
          const randomEvent = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
          setNotificationMessage(`${randomName} just ${randomEvent.action} <span class="font-bold">Rs ${randomAmount}</span> ${randomEvent.source}`);
          setIsNotificationAnimating(true);
        }, 500);
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(fallbackInterval);
    };
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

  const handleUpdateBalance = async (amount: number, source: string = 'system', description: string = '') => {
    if (!user) return;
    try {
      // 1. Update Firestore
      await setDoc(doc(db, 'users', user.uid), {
        balance: increment(amount),
        totalEarnings: amount > 0 ? increment(amount) : increment(0)
      }, { merge: true });

      // 2. Update RTDB for real-time sync
      const userStatusRef = ref(rtdb, `users/${user.uid}`);
      await update(userStatusRef, { 
        balance: rtdbIncrement(amount),
        totalEarnings: amount > 0 ? rtdbIncrement(amount) : rtdbIncrement(0)
      });

      // 3. Record Earning History if amount > 0
      if (amount > 0) {
        await addDoc(collection(db, 'earning_history'), {
          userId: user.uid,
          amount: amount,
          source: source,
          description: description || `Earned from ${source.replace('_', ' ')}`,
          timestamp: firestoreServerTimestamp()
        });
      }
      
      console.log(`[BALANCE_SYNC] Updated balance by ${amount} from ${source} in Firestore and RTDB`);

      // Team Commission Logic: If user has a referrer who is a Partner, give them 10%
      if (amount > 0 && referredBy) {
        let referrerUid = null;
        const sanitizedRef = referredBy.trim().toLowerCase();

        // 1. Try to find by referralCode
        const q = query(collection(db, 'users'), where('referralCode', '==', sanitizedRef));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          referrerUid = querySnapshot.docs[0].id;
        } else {
          // 2. Try to find by username
          const parentUsernameDoc = await getDoc(doc(db, 'usernames', sanitizedRef));
          if (parentUsernameDoc.exists()) {
            referrerUid = parentUsernameDoc.data().uid;
          } else {
            // 3. Maybe it's already a UID
            referrerUid = referredBy;
          }
        }

        if (referrerUid) {
          const referrerRef = doc(db, 'users', referrerUid);
          const referrerDoc = await getDoc(referrerRef);
          if (referrerDoc.exists()) {
            const referrerData = referrerDoc.data();
            if (referrerData.role === 'partner') {
              const commission = amount * 0.1;
              // Update Referrer Firestore
              await updateDoc(referrerRef, {
                balance: increment(commission),
                totalTeamEarnings: increment(commission)
              });
              // Update Referrer RTDB
              const referrerRtdbRef = ref(rtdb, `users/${referrerUid}`);
              await update(referrerRtdbRef, {
                balance: rtdbIncrement(commission),
                totalTeamEarnings: rtdbIncrement(commission)
              });

              // Record Commission in Referrer's History
              await addDoc(collection(db, 'earning_history'), {
                userId: referrerUid,
                amount: commission,
                source: 'commission',
                description: `Team commission from ${userName || 'Downline Member'}`,
                timestamp: firestoreServerTimestamp()
              });

              console.log(`[COMMISSION_SYNC] Paid ${commission} commission to partner ${referrerUid}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      // Fallback to local state if Firestore fails
      setBalance(prev => prev + amount);
    }
  };

  useEffect(() => {
    if (!user || lockedBalance <= 0) return;

    const checkUnlock = async () => {
      let shouldUnlock = false;
      const invites = referralStats.activeMembers;

      // Logic based on user requirements:
      // 200 par 3, 300 par 5, 500 par 10, aur 1000+ par 15 active referrals
      if (lockedBalance >= 1000 && invites >= 15) shouldUnlock = true;
      else if (lockedBalance >= 500 && invites >= 10) shouldUnlock = true;
      else if (lockedBalance >= 300 && invites >= 5) shouldUnlock = true;
      else if (lockedBalance >= 200 && invites >= 3) shouldUnlock = true;
      else if (lockedBalance < 200 && invites >= 3) shouldUnlock = true; // Safety for smaller locked amounts

      if (shouldUnlock) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            balance: increment(lockedBalance),
            lockedBalance: 0
          });
          console.log("Locked balance unlocked automatically!");
        } catch (error) {
          console.error("Unlock Error:", error);
        }
      }
    };

    checkUnlock();
  }, [lockedBalance, referralStats.activeMembers, user]);

  const handleWinLockedPrize = async (amount: number, requiredInvites: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        lockedBalance: increment(amount)
      });
    } catch (error) {
      console.error("Locked Prize Error:", error);
    }
  };

  const handleWithdraw = async (amount: number, method: string) => {
    if (!user) return;

    // Withdrawal Window Logic
    const now = new Date();
    const day = now.getDate();
    const isWindow1 = day >= 1 && day <= 3;
    const isWindow2 = day >= 16 && day <= 18;
    
    if (!isWindow1 && !isWindow2) {
      alert("Withdrawal window is currently closed. Please check the withdrawal tab for next window dates.");
      return;
    }
    
    // 1. Balance Check
    if (balance < amount) {
      alert("Insufficient balance!");
      return;
    }

    try {
      console.log(`[WITHDRAWAL_START] Amount: ${amount}, Method: ${method}, User: ${user.uid}`);
      // 2. Deduct balance in Firestore
      await handleUpdateBalance(-amount);

      // 3. Save to Firestore (for Admin Panel)
      console.log("[WITHDRAWAL_FIRESTORE] Attempting to save to Firestore...");
      const withdrawalDocRef = await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        userName: userName,
        amount,
        method,
        status: 'Pending',
        date: new Date().toISOString(),
        timestamp: firestoreServerTimestamp()
      });
      const withdrawalId = withdrawalDocRef.id;
      console.log("[WITHDRAWAL_FIRESTORE_SUCCESS] Saved with ID:", withdrawalId);

      // 4. Save to RTDB (for User History)
      console.log("[WITHDRAWAL_RTDB] Attempting to save to RTDB...");
      const withdrawalRef = ref(rtdb, `withdrawals/${user.uid}/${withdrawalId}`);
      
      const account = withdrawalAccounts[0] || {};
      
      const newTx = {
        amount,
        method,
        accountNumber: account.number || 'Not Set',
        accountName: account.title || 'Not Set',
        status: 'pending',
        timestamp: Date.now(),
        userId: user.uid,
        userName: userName,
        firestoreId: withdrawalId
      };
      
      await set(withdrawalRef, newTx);
      console.log("[WITHDRAWAL_RTDB_SUCCESS] Saved to withdrawals list");
      
      // 5. Send internal notification
      await sendWithdrawalRequestMail(user.uid, amount, method);
      
      alert("Withdrawal request submitted! It will be processed soon.");
    } catch (error) {
      console.error("Withdrawal Error:", error);
      alert("Failed to submit withdrawal request. Please check your connection.");
    }
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
      console.log(`[ADMIN_ACTION] Approving deposit: ${depositId} for user: ${targetUserId}, amount: ${amount}`);
      
      const userRef = doc(db, 'users', targetUserId);
      const depositRef = doc(db, 'deposits', depositId);
      const userRtdbRef = ref(rtdb, `users/${targetUserId}`);

      // 1. Update User Balance (Firestore)
      await updateDoc(userRef, { 
        balance: increment(amount)
      });
      
      // 2. Update User Balance (RTDB)
      await update(userRtdbRef, {
        balance: rtdbIncrement(amount)
      });
      console.log(`[ADMIN_ACTION_SUCCESS] User balance incremented by ${amount} in Firestore and RTDB`);

      // 3. Update Deposit Status
      await updateDoc(depositRef, { 
        status: 'Approved',
        approvedAt: new Date().toISOString()
      });
      console.log(`[ADMIN_ACTION_SUCCESS] Deposit status updated to Approved`);

      // 4. Notify User
      await sendDepositApprovedMail(targetUserId, amount);
      
      alert("Deposit approved successfully! Balance added to user account.");
    } catch (error) {
      console.error("[ADMIN_ACTION_FAILURE] Error approving deposit:", error);
      alert("Failed to approve deposit. Check console for details.");
    }
  };

  const handleRejectWithdrawal = async (targetUserId: string, withdrawalId: string) => {
    try {
      console.log(`[ADMIN_ACTION] Rejecting withdrawal: ${withdrawalId} for user: ${targetUserId}`);
      
      // 1. Update Firestore
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      await updateDoc(withdrawalRef, { 
        status: 'Rejected',
        rejectedAt: new Date().toISOString()
      });
      console.log("[ADMIN_ACTION_SUCCESS] Firestore withdrawal status updated to Rejected");

      // 2. Update RTDB
      const withdrawalRefRtdb = ref(rtdb, `withdrawals/${targetUserId}/${withdrawalId}`);
      const snapshot = await get(withdrawalRefRtdb);
      if (snapshot.exists()) {
        await update(withdrawalRefRtdb, {
          status: 'rejected',
          rejectedAt: Date.now()
        });
        console.log("[ADMIN_ACTION_SUCCESS] RTDB withdrawal status updated to rejected");
      }

      alert("Withdrawal rejected.");
    } catch (error) {
      console.error("[ADMIN_ACTION_FAILURE] Error rejecting withdrawal:", error);
      alert("Failed to reject withdrawal.");
    }
  };

  const handleApproveWithdrawal = async (targetUserId: string, withdrawalId: string) => {
    try {
      console.log(`[ADMIN_ACTION] Approving withdrawal: ${withdrawalId} for user: ${targetUserId}`);
      
      // 1. Update Firestore
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      const withdrawalDoc = await getDoc(withdrawalRef);
      let amount = 0;
      let method = 'Withdrawal';
      
      if (withdrawalDoc.exists()) {
        const wData = withdrawalDoc.data();
        amount = wData.amount;
        method = wData.method || 'Withdrawal';
        await updateDoc(withdrawalRef, { 
          status: 'Approved',
          approvedAt: new Date().toISOString()
        });
        console.log("[ADMIN_ACTION_SUCCESS] Firestore withdrawal status updated to Approved");
      } else {
        console.warn("[ADMIN_ACTION_WARNING] Withdrawal document not found in Firestore. ID:", withdrawalId);
        // We still proceed to update RTDB if possible
      }

      // 2. Update RTDB (Primary for History)
      const withdrawalRefRtdb = ref(rtdb, `withdrawals/${targetUserId}/${withdrawalId}`);
      
      const snapshot = await get(withdrawalRefRtdb);
      if (snapshot.exists()) {
        await update(withdrawalRefRtdb, {
          status: 'approved',
          approvedAt: Date.now()
        });
        console.log("[ADMIN_ACTION_SUCCESS] RTDB withdrawal status updated to approved");
      } else {
        console.log("[ADMIN_ACTION] Withdrawal not found in RTDB by ID. Searching by amount fallback...");
        const userWithdrawalsRef = ref(rtdb, `withdrawals/${targetUserId}`);
        const userWithdrawalsSnap = await get(userWithdrawalsRef);
        if (userWithdrawalsSnap.exists()) {
          const withdrawalsData = userWithdrawalsSnap.val();
          const matchEntry = Object.entries(withdrawalsData).find(([_, val]: [string, any]) => val.amount === amount && val.status === 'pending');
          if (matchEntry) {
            const [oldId] = matchEntry as [string, any];
            await update(ref(rtdb, `withdrawals/${targetUserId}/${oldId}`), {
              status: 'approved',
              approvedAt: Date.now()
            });
            console.log("[ADMIN_ACTION_SUCCESS] RTDB withdrawal found by amount and updated to approved");
          } else {
            await set(ref(rtdb, `withdrawals/${targetUserId}/${withdrawalId}`), {
              amount,
              method,
              status: 'approved',
              timestamp: Date.now(),
              approvedAt: Date.now(),
              userId: targetUserId
            });
            console.log("[ADMIN_ACTION_SUCCESS] RTDB withdrawal created in approved as last resort");
          }
        } else {
          await set(ref(rtdb, `withdrawals/${targetUserId}/${withdrawalId}`), {
            amount,
            method,
            status: 'approved',
            timestamp: Date.now(),
            approvedAt: Date.now(),
            userId: targetUserId
          });
          console.log("[ADMIN_ACTION_SUCCESS] RTDB withdrawal created in approved (no data found)");
        }
      }

      await sendWithdrawalApprovedMail(targetUserId, amount);
      alert("Withdrawal approved successfully!");
    } catch (error) {
      console.error("[ADMIN_ACTION_FAILURE] Error approving withdrawal:", error);
      alert("Failed to approve withdrawal. Error: " + (error instanceof Error ? error.message : String(error)));
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
      await updateDoc(userRef, { 
        status: 'Active',
        accountStatus: 'active',
        feeStatus: 'paid'
      });
      
      // Update RTDB status and feeStatus
      const userStatusRef = ref(rtdb, `users/${targetUserId}`);
      await update(userStatusRef, { status: 'Active', accountStatus: 'active', feeStatus: 'paid' });
      console.log(`[ADMIN_ACTION_SUCCESS] User ${targetUserId} status updated to Active in Firestore and RTDB.`);
      
      // Update deposit status if provided
      if (depositId) {
        await updateDoc(doc(db, 'deposits', depositId), { status: 'Approved' });
        console.log(`[ADMIN_ACTION_SUCCESS] Deposit ${depositId} status updated to Approved.`);
      }
      
      // Send internal notification
      await sendActivationMail(targetUserId);

      // 2. Handle Direct Referral (Level 1)
      if (userData.referredBy) {
        console.log(`[REFERRAL_LOG] User ${targetUserId} was referred by: ${userData.referredBy}`);
        const parentUsernameDoc = await getDoc(doc(db, 'usernames', userData.referredBy.toLowerCase()));
        
        if (parentUsernameDoc.exists()) {
          const l1Uid = parentUsernameDoc.data().uid;
          console.log(`[REFERRAL_LOG] Found Level 1 Parent UID: ${l1Uid}`);
          
          // Update referral status in RTDB
          const referralStatusRef = ref(rtdb, `invites/${l1Uid}/history/${targetUserId}`);
          await update(referralStatusRef, { status: 'paid' });

          // Update referrer stats in RTDB: users/${l1Uid}
          const referrerStatsRef = ref(rtdb, `users/${l1Uid}`);
          await update(referrerStatsRef, {
            activeMembers: rtdbIncrement(1),
            totalCommission: rtdbIncrement(70),
            balance: rtdbIncrement(70)
          });

          // Update balance in Firestore
          await updateDoc(doc(db, 'users', l1Uid), {
            balance: increment(70)
          });
          console.log(`[REFERRAL_LOG] Commission of 70 added to referrer ${l1Uid} in Firestore and RTDB`);
        }
      }
      
      if (targetUserId === user?.uid) {
        setStatus('Active');
      }
      
      alert("User activated and commissions distributed successfully!");
    } catch (error) {
      console.error("Error activating user:", error);
      alert("Error during activation. Check console for details.");
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
                 balance={balance}
                 lockedBalance={lockedBalance}
                 accountNumber={withdrawalAccounts[0]?.number || ''}
                 accountTitle={withdrawalAccounts[0]?.title || ''}
                 joiningDate={joiningDate}
                 referralCode={referralCode}
                 onEditProfile={() => setActiveTab('edit_profile')} 
                 onLeaderboardClick={() => setActiveTab('leaderboard')} 
                 onManageWalletClick={() => setActiveTab('manage_wallet')}
                 onPartnerUpgradeClick={() => setActiveTab('partner_upgrade')}
                 onAdminPanelClick={() => setActiveTab('admin')}
                 onEarningHistoryClick={() => setActiveTab('earning_history')}
               />;
      case 'admin':
        return <AdminPanelView 
                 onBack={() => setActiveTab('profile')}
                 onApproveActivation={handleActivateUser}
                 onApprovePartner={handleApprovePartner}
                 onApproveDeposit={handleApproveDeposit}
                 onApproveWithdrawal={handleApproveWithdrawal}
                 onRejectWithdrawal={handleRejectWithdrawal}
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
      case 'earning_history':
        return <EarningHistoryView onBack={() => setActiveTab('profile')} totalEarnings={totalEarnings} />;
      case 'social_task_plus':
        return <SocialTaskPlusView onBack={() => setActiveTab('home')} userName={userName} />;
      case 'invite':
        return <InviteTab 
          status={status}
          referralStats={referralStats}
          referralCode={referralCode || userName || ''}
          onActivateClick={() => setActiveTab('activation')}
          referrals={partnerReferrals}
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
          onBack={() => setActiveTab('home')}
        />;
      case 'spin':
        return <SpinWheel 
          onClose={() => setActiveTab('home')} 
          balance={balance}
          onUpdateBalance={handleUpdateBalance}
          freeSpins={freeSpins}
          onUseFreeSpin={handleUseFreeSpin}
          onGoToDeposit={() => setActiveTab('deposit')}
          activeInvites={referralStats.activeMembers}
          onWinLockedPrize={handleWinLockedPrize}
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
        if (accountStatus.toLowerCase() !== 'active') {
          return <ActivationTab onBack={() => setActiveTab('home')} appSettings={appSettings} userName={userName} />;
        }
        return <WatchTab 
          onBack={() => setActiveTab('home')}
          balance={balance}
          onUpdateBalance={handleUpdateBalance}
        />;
      case 'tasks':
        if (accountStatus.toLowerCase() !== 'active') {
          return <ActivationTab onBack={() => setActiveTab('home')} appSettings={appSettings} userName={userName} />;
        }
        return <TasksTab 
          onBack={() => setActiveTab('home')} 
          accountStatus={accountStatus}
          onPayClick={() => setActiveTab('deposit')}
        />;
      case 'task_wall':
        if (accountStatus.toLowerCase() !== 'active') {
          return <ActivationTab onBack={() => setActiveTab('home')} appSettings={appSettings} userName={userName} />;
        }
        return <TaskWall 
          onBack={() => setActiveTab('home')} 
          accountStatus={accountStatus}
          onPayClick={() => setActiveTab('deposit')}
        />;
      case 'leaderboard':
        return <LeaderboardView earners={topEarners} onBack={() => setActiveTab('home')} />;
      // Add other tabs as needed
      default:
        return <HomeTab 
          name={userName}
          balance={balance}
          lockedBalance={lockedBalance}
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
          onTaskWallClick={() => setActiveTab('task_wall')}
          onSocialTaskPlusClick={() => setActiveTab('social_task_plus')}
          onUpdateBalance={handleUpdateBalance}
          appSettings={appSettings}
          appBonusClaimed={appBonusClaimed}
          lastDailyCheckin={lastDailyCheckin}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center p-0 sm:p-6 font-sans">
      {!isProfileLoaded && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest animate-pulse">Loading Profile...</p>
        </div>
      )}
      {/* Referral Update Notification */}
      <AnimatePresence>
        {showReferralUpdateNotify && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-yellow-600"></div>
              
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-amber-500" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight">Link Update!</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                Aapka naya referral link update ho gaya hai, mazeed security ke liye ab isay istemal karein.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">New Referral Code</p>
                <p className="text-lg font-black text-slate-900 font-mono tracking-wider">{referralCode}</p>
              </div>

              <button 
                onClick={() => setShowReferralUpdateNotify(false)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
              >
                Samajh Gaya!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Urdu Inactive Modal */}
      <AnimatePresence>
        {showInactiveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-center text-slate-900 mb-3 font-urdu">خوش آمدید! آپ کا اکاؤنٹ ابھی فعال (Active) نہیں ہے۔</h3>
              <p className="text-base text-center text-slate-600 mb-6 font-urdu leading-relaxed">
                ارننگ شروع کرنے کے لیے آپ کو ایک بار جوائننگ فیس جمع کروانی ہوگی۔ نیچے دیے گئے بٹن پر کلک کریں اور فیس جمع کروا کر واٹس ایپ پر اسکرین شاٹ بھیجیں۔ اکاؤنٹ جلد ہی ایکٹیو کر دیا جائے گا۔
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowInactiveModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors font-urdu"
                >
                  بند کریں
                </button>
                <button 
                  onClick={() => {
                    setShowInactiveModal(false);
                    setActiveTab('activation');
                  }}
                  className="flex-[2] bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 font-urdu"
                >
                  فیس جمع کروائیں
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              { id: 'home', icon: <Home className="w-5 h-5" />, label: 'HOME' },
              { id: 'watch', icon: <PlaySquare className="w-5 h-5" />, label: 'WATCH' },
              { id: 'task_wall', icon: <Search className="w-5 h-5" />, label: 'SURVEYS' },
              { id: 'tasks', icon: <Layout className="w-5 h-5" />, label: 'TASKS' },
              { id: 'premium', icon: <Briefcase className="w-5 h-5" />, label: 'PREMIUM' },
              { id: 'profile', icon: <User className="w-5 h-5" />, label: 'PROFILE' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 w-14 ${activeTab === tab.id ? 'text-yellow-600' : 'text-slate-400 hover:text-slate-600'} transition-colors relative`}
              >
                <div className={`transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>
                  {tab.icon}
                </div>
                <span className="text-[8px] font-black tracking-tighter text-center leading-none">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute -top-3 w-6 h-1 bg-yellow-500 rounded-b-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

