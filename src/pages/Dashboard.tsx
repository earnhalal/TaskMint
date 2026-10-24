import { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircle, Bell, Tv2, Rocket, Zap, ShieldCheck, LayoutGrid, X, Sparkles, AlertTriangle, Wallet, Download } from 'lucide-react';
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
  runTransaction as runFirestoreTransaction,
  serverTimestamp as firestoreServerTimestamp 
} from 'firebase/firestore';
import { db, rtdb } from '../firebase';
import PaymentVerificationChat from '../components/dashboard/PaymentVerificationChat';
import { ref, onValue, update, set, increment as rtdbIncrement, get, runTransaction as runRtdbTransaction } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { sendDepositRequestMail, sendWithdrawalRequestMail, sendActivationMail, playNotificationSound } from '../services/notificationService';
import HomeTab from '../components/dashboard/HomeTab';
import AnnouncementBar from '../components/dashboard/AnnouncementBar';
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
import ActivationTab from '../components/dashboard/ActivationTab';
import WannadsSurveyView from '../components/dashboard/WannadsSurveyView';

import CPALeadOfferWall from '../components/dashboard/CPALeadOfferWall';
import EditProfileView from '../components/dashboard/EditProfileView';

import TaskWall from '../components/dashboard/TaskWall';
import WatchTab from '../components/dashboard/WatchTab';
import SupportAIChat from '../components/dashboard/SupportAIChat';
import TasksTab from '../components/dashboard/TasksTab';
import ManageWalletView from '../components/dashboard/ManageWalletView';
import LotteryView from '../components/dashboard/LotteryView';
import StreakRewardView from '../components/dashboard/StreakRewardView';
import PartnerToolsView from '../components/dashboard/PartnerToolsView';
import { DynamicAvatar } from '../components/ui/DynamicAvatar';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showNotification, setShowNotification] = useState(true);
  const [pinMode, setPinMode] = useState<'enter' | 'set'>('set');
  const [pendingWithdrawal, setPendingWithdrawal] = useState<{amount: number, method: string, accountName: string, accountNumber: string} | null>(null);
  const [userPin, setUserPin] = useState('');
  const [seenUpdates, setSeenUpdates] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userGender, setUserGender] = useState('');
  const [userCountry, setUserCountry] = useState('Pakistan');
  const [profileAvatarId, setProfileAvatarId] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [withdrawalAccounts, setWithdrawalAccounts] = useState<any[]>([]);
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState('Inactive');
  const [accountStatus, setAccountStatus] = useState('inactive');
  const [manualWithdrawUnlock, setManualWithdrawUnlock] = useState(false);
  const [role, setRole] = useState('user');
  const [partnerStatus, setPartnerStatus] = useState('none');
  const [partnerTier, setPartnerTier] = useState('basic');
  const [totalIndirectCommission, setTotalIndirectCommission] = useState(0);
  const [referralStats, setReferralStats] = useState({
    totalInvited: 0,
    activeMembers: 0,
    totalCommission: 0
  });
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [showReferralUpdateNotify, setShowReferralUpdateNotify] = useState(false);
  const [notificationMessage] = useState('');
  const [partnerReferrals, setPartnerReferrals] = useState<any[]>([]);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatExpiry, setChatExpiry] = useState<number | null>(null);
  const [persistedAgent, setPersistedAgent] = useState<any>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Check for chat expiry (30 minutes)
  useEffect(() => {
    if (chatExpiry && Date.now() > chatExpiry) {
      setChatMessages([]);
      setChatExpiry(null);
      setPersistedAgent(null);
    }
  }, [activeTab, chatExpiry]);

  const handleUpdateChatMessages = (messages: any[]) => {
    setChatMessages(messages);
    setChatExpiry(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // If new message from model and we are not in support tab, increment unread count
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model' && activeTab !== 'support_ai') {
        setUnreadChatCount(prev => prev + 1);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'support_ai') {
      setUnreadChatCount(0);
    }
  }, [activeTab]);

  const [balance, setBalance] = useState(0);
  const [pendingIndirect, setPendingIndirect] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [appBonusClaimed, setAppBonusClaimed] = useState(false);
  const [lastDailyCheckin, setLastDailyCheckin] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const withdrawalHistory = useMemo(() => {
    return [...withdrawals].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [withdrawals]);
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [topEarners, setTopEarners] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState({
    activationFee: 150,
    partnerFee: 1000,
    paymentNumber: '03338739929',
    paymentName: 'M-WASEEM',
    whatsappNumber: '923338739929',
    minWithdrawal: 500,
    withdrawalFeeRate: 5,
    referralBonusBasic: 100,
    referralBonusPartner: 125,
    indirectReferralBonus: 10,
    offerExpiryTime: null as any,
    manualWithdrawUnlock: false
  });


  const activeAppSettings = appSettings;


  useEffect(() => {
    document.title = 'Dashboard - TaskMint';
    if (!user) return;

    // Listener for user profile
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // NOTE: balance / totalEarnings / lockedBalance are led by the RTDB
        // listener below (single source of truth). The Firestore copy is only
        // a mirror for reports — reading it here caused the balance to
        // flip-flop between two different values.
        setUserPin(data.pin || '');
        setSeenUpdates(data.seenUpdates || []);
        setUserName(data.username || '');
        setUserEmail(data.email || '');
        setUserPhone(data.phone || '');
        setUserGender(data.gender || '');
        setUserCountry(data.country || 'Pakistan');
        setProfileAvatarId(data.profile_avatar_id || '');
        setProfilePhoto(data.profile_photo || '');
        setWithdrawalAccounts(data.withdrawalAccounts || []);
        setJoiningDate(data.joiningDate || '');
        setRole(data.role || 'user');
        setPartnerStatus(data.partnerStatus || 'none');
        setPartnerTier(data.partnerTier || (data.role === 'partner' ? 'silver' : 'basic'));
        if (data.totalIndirectCommission !== undefined) setTotalIndirectCommission(data.totalIndirectCommission);
        if (data.pendingIndirect !== undefined) setPendingIndirect(data.pendingIndirect);
        setReferredBy(data.referredBy || null);
        setReferralCode(data.referralCode || '');
        setAppBonusClaimed(data.appBonusClaimed || false);
        setManualWithdrawUnlock(data.manualWithdrawUnlock || false);
        setLastDailyCheckin(data.lastDailyCheckin || null);
        setIsProfileLoaded(true);
        
        // Expiry check
        if (data.role === 'partner' && data.partnerStatus === 'active' && data.partnerExpiryDate) {
            const expiry = new Date(data.partnerExpiryDate);
            if (new Date() > expiry) {
                await updateDoc(doc(db, 'users', user.uid), {
                    role: 'user',
                    partnerStatus: 'none',
                    partnerTier: 'basic'
                });
            }
        }

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
                const batch = writeBatch(db);
                oldDocs.forEach(doc => {
                  batch.delete(doc.ref);
                });
                await batch.commit();
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
            const newCode = `${String(data.username).toLowerCase()}_${phoneSuffix}`;
            await setDoc(doc(db, 'users', user.uid), { referralCode: newCode }, { merge: true });
            setReferralCode(newCode);
            setShowReferralUpdateNotify(true);
          };
          generateCode();
        }
      } else {
        // If Firestore doc doesn't exist, try to recover from RTDB
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

    // Listener for withdrawals from Firestore
    const qWithdrawals = query(
      collection(db, 'withdrawals'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribeWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // Sort client-side
      list.sort((a, b) => (b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp || 0) - (a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp || 0));
      setWithdrawals(list);
    }, (error) => console.error("Withdrawals Error:", error));

    // Listeners for notifications (personal + admin broadcasts with userId 'all')
    const notifStore: { own: any[]; all: any[] } = { own: [], all: [] };
    const syncNotifications = () => {
      const merged = [...notifStore.own, ...notifStore.all.filter(b => !notifStore.own.some(o => o.id === b.id))];
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(merged);
    };
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
      
      notifStore.own = notifyData;
      syncNotifications();
    }, (error) => console.error("Notifications Error:", error));

    const qNotifyAll = query(
      collection(db, 'notifications'),
      where('userId', '==', 'all')
    );
    const unsubscribeNotifyAll = onSnapshot(qNotifyAll, (snapshot) => {
      notifStore.all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      syncNotifications();
    }, (error) => console.error("Broadcast Notifications Error:", error));



    // Listener for Referral Stats (from RTDB as per new architecture)
    const userRtdbRef = ref(rtdb, `users/${user.uid}`);
    const unsubscribeStats = onValue(userRtdbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setReferralStats({
          totalInvited: data.totalInvited || 0,
          activeMembers: data.activeMembers || 0,
          totalCommission: data.totalCommission || 0
        });
        
        // Priority Sync for Real-time Balance & Commission
        if (data.totalIndirectCommission !== undefined) setTotalIndirectCommission(data.totalIndirectCommission);
        if (data.lockedBalance !== undefined) setLockedBalance(data.lockedBalance);
      }
    }, (error) => console.error("Referral Stats RTDB Error:", error));


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
    const unsubscribeSettings = onSnapshot(doc(db, 'app_settings', 'global'), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Merge over the built-in defaults so a settings document that is
        // missing a field can never blank it out in the app.
        setAppSettings(prev => ({ ...prev, ...(data as any) }));
        
      }
    });

    return () => {
      unsubscribe();
      unsubscribeNotify();
      unsubscribeNotifyAll();
      unsubscribeEarners();
      unsubscribeDeposits();
      unsubscribeWithdrawals();
      unsubscribeSettings();
      unsubscribeStats();
      unsubscribeStatus();
    };
  }, [user, role]);

  // Dedicated Listener for Referrals (Reactive to referralCode)
  useEffect(() => {
    if (!user || !referralCode) return;

    // RTDB paths cannot contain ., #, $, [, ], or /
    const safeRefCode = referralCode.replace(/[.#$\[\]\/]/g, '') || 'invalid_code';
    const invitesRef = ref(rtdb, `invites/${safeRefCode}/history`);
    const unsubscribeReferrals = onValue(invitesRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const referralItems = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          status: data[key].status ? String(data[key].status).toLowerCase() : 'pending'
        }));

        // Fetch missing names from Firestore if needed
        const enrichedReferrals = await Promise.all(referralItems.map(async (r) => {
          try {
            const uDoc = await getDoc(doc(db, 'users', r.id));
            if (uDoc.exists()) {
              const uData = uDoc.data();
              return { 
                ...r, 
                name: r.name && r.name !== 'Anonymous' ? r.name : (uData.username || uData.name || 'User'),
                referralCode: uData.referralCode || uData.username || ''
              };
            }
          } catch (e) {
            console.error("Error fetching username for referral:", e);
          }
          return r;
        }));

        enrichedReferrals.sort((a, b) => {
          const timeA = a.timestamp || a.paidAt || 0;
          const timeB = b.timestamp || b.paidAt || 0;
          return timeB - timeA;
        });

        setPartnerReferrals(enrichedReferrals);

        // Update Stats locally to ensure UI consistency
        const totalCount = enrichedReferrals.length;
        const activeCount = enrichedReferrals.filter(r => r.status === 'paid').length;
        const commissions = enrichedReferrals.reduce((sum, r) => {
          if (r.status === 'paid') return sum + (r.commission || 125);
          return sum;
        }, 0);

        setReferralStats(prev => {
          // If local commissions are higher than DB, we use local for display
          const effectiveCommissions = Math.max(prev.totalCommission, commissions);
          
          // Calculate if there's a "missing" amount (commissions not yet in DB)
          const missingInDb = Math.max(0, commissions - prev.totalCommission);

          return {
            totalInvited: Math.max(prev.totalInvited, totalCount),
            activeMembers: Math.max(prev.activeMembers, activeCount),
            totalCommission: effectiveCommissions
          };
        });

      } else {
        setPartnerReferrals([]);
      }
    }, (error) => console.error("RTDB Referrals Error:", error));

    return () => unsubscribeReferrals();
  }, [user, referralCode]);

  useEffect(() => {
    // localStorage.setItem('taskmint_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    // localStorage.setItem('taskmint_withdrawals', JSON.stringify(withdrawalHistory));
  }, [withdrawalHistory]);

  useEffect(() => {
    // localStorage.setItem('taskmint_seen_updates', JSON.stringify(seenUpdates));
  }, [seenUpdates]);




  const [isBalanceUpdating, setIsBalanceUpdating] = useState(false);


  const handleUpdateBalance = async (amount: number, source: string = 'system', description: string = '', transactionId?: string) => {
    if (!user || isBalanceUpdating) return false;
    
    setIsBalanceUpdating(true);
    try {
      const userRtdbRef = ref(rtdb, `users/${user.uid}`);
      
      const balAmt = amount;

      let success = false;
      await runRtdbTransaction(userRtdbRef, (data) => {
        if (data === null) return;
        
        let newBalance = (data.balance || 0) + balAmt;
        if (newBalance < 0) return; // Abort transaction if insufficient funds
        
        let newTotalEarnings = (data.totalEarnings || 0);

        if (balAmt > 0) {
            newTotalEarnings += balAmt;
        }

        success = true;
        return {
            ...data,
            balance: newBalance,
            totalEarnings: newTotalEarnings,
            lastUpdatedAt: Date.now()
        };
      });

      if (!success) {
        throw new Error("Insufficient balance or transaction failed.");
      }

      // Mirror into Firestore so reports / leaderboard / admin views match the RTDB ledger
      try {
        await setDoc(doc(db, 'users', user.uid), {
          balance: increment(amount),
          ...(amount > 0 ? { totalEarnings: increment(amount) } : {})
        }, { merge: true });
      } catch (mirrorError) {
        console.error("Firestore balance mirror failed:", mirrorError);
      }

      
      // History in Firestore
      await addDoc(collection(db, 'earning_history'), {
        userId: user.uid,
        amount: amount,
        type: amount < 0 ? 'expense' : 'earning',
        source: source,
        description: description || (amount < 0 ? `Spent on ${source.replace('_', ' ')}` : `Earned from ${source.replace('_', ' ')}`),
        timestamp: firestoreServerTimestamp(),
        transactionId: transactionId || null
      });

      // Team Commission Logic (Async)
      if (amount > 0 && referredBy) {
        handleCommissionUpdate(amount, source);
      }
      
      return true;
    } catch (error) {
      console.error("Error updating balance:", error);
      return false;
    } finally {
      setIsBalanceUpdating(false);
    }
  };

  const handleCommissionUpdate = async (amount: number, source: string) => {
    try {
      const sanitizedRef = referredBy.trim().toLowerCase();
      let referrerUid = null;

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
        const commission = amount * 0.1;
        
        await runFirestoreTransaction(db, async (transaction) => {
          const refDoc = await transaction.get(referrerRef);
          if (refDoc.exists() && refDoc.data().role === 'partner') {
            transaction.update(referrerRef, {
              balance: increment(commission),
              totalTeamEarnings: increment(commission)
            });

            // Record Commission in Referrer's History
            const historyRef = doc(collection(db, 'earning_history'));
            transaction.set(historyRef, {
              userId: referrerUid,
              amount: commission,
              source: 'commission',
              description: `Team commission from ${userName || 'Downline Member'}`,
              timestamp: firestoreServerTimestamp()
            });

            // Update Referrer RTDB
            const referrerRtdbRef = ref(rtdb, `users/${referrerUid}`);
            await update(referrerRtdbRef, {
              balance: rtdbIncrement(commission),
              totalTeamEarnings: rtdbIncrement(commission)
            });
          }
        });
      }
    } catch (e) {
      console.error("Commission Update Error:", e);
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
        } catch (error) {
          console.error("Unlock Error:", error);
        }
      }
    };

    checkUnlock();
  }, [lockedBalance, referralStats.activeMembers, user]);

  const handleWithdraw = async (amount: number, method: string, accountName: string, accountNumber: string) => {
    if (!user) return;

    // Withdrawal Window Logic
    const now = new Date();
    const day = now.getDate();
    const isWindow1 = day >= 1 && day <= 3;
    const isWindow2 = day >= 16 && day <= 18;
    
    // Bypass window lock for partners and manually unlocked users (global or per-user)
    const isUnlocked = isWindow1 || isWindow2 || manualWithdrawUnlock || appSettings.manualWithdrawUnlock || role === 'partner';
    
    if (!isUnlocked) {
      alert("Withdrawal window is currently closed. Please check the withdrawal tab for next window dates.");
      return;
    }
    
    // 1. Balance Check
    if (balance < amount) {
      alert("Insufficient balance!");
      return;
    }

    try {
      // 2. Deduct balance in Firestore
      await handleUpdateBalance(-amount, 'withdrawal', `Requested Withdrawal to ${method}`);
      const balanceAfter = balance - amount;

      // 3. Save to Firestore (for Admin Panel)
      const withdrawalDocRef = await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        userName: userName,
        referralId: referralCode,
        amount,
        balanceBefore: balance,
        balanceAfter: balanceAfter,
        method,
        accountName,
        accountNumber,
        status: 'Pending',
        date: new Date().toISOString(),
        timestamp: firestoreServerTimestamp()
      });
      const withdrawalId = withdrawalDocRef.id;

      // 4. Save to RTDB (for User History)
      const withdrawalRef = ref(rtdb, `withdrawals/${user.uid}/${withdrawalId}`);
      
      const account = withdrawalAccounts[0] || {};
      
      const newTx = {
        amount,
        method,
        accountNumber: account.number || 'Not Set',
        accountName: account.title || 'Not Set',
        username: userName,
        referralId: referralCode,
        balanceBefore: balance,
        balanceAfter: balanceAfter,
        status: 'pending',
        timestamp: Date.now(),
        userId: user.uid,
        userName: userName,
        firestoreId: withdrawalId
      };
      
      await set(withdrawalRef, newTx);

      
      // 5. Send internal notification
      await sendWithdrawalRequestMail(user.uid, amount, method);
      
      alert("Withdrawal request submitted! It will be processed soon.");
    } catch (error) {
      console.error("Withdrawal Error:", error);
      alert("Failed to submit withdrawal request. Please check your connection.");
    }
  };

  const [verifyDepositId, setVerifyDepositId] = useState<string | null>(null);

  const handleDeposit = async (amount: number, method: string, transactionId: string, type: 'activation' | 'regular' = 'regular', proof?: { proofMethod: 'upload' | 'whatsapp'; screenshotHash?: string }) => {
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
      description: type === 'activation' ? 'Account Activation Fee' : `${method} Deposit`,
      ...(proof?.proofMethod === 'upload'
        ? { proofMethod: 'upload', screenshotHash: proof.screenshotHash || '', hasProof: true }
        : { proofMethod: 'whatsapp' })
    };

    if (type === 'activation') {
      // Screenshot-upload requests also get a Firestore record — the
      // proof image and the verification chat hang off it, and the
      // admin panel can review the screenshot there.
      if (proof?.proofMethod === 'upload') {
        await setDoc(doc(db, 'deposits', depositId), newTx);
      }
      // Save to RTDB pending_requests (Zero Firestore)
      const pendingRef = ref(rtdb, `pending_requests/${user.uid}`);
      await set(pendingRef, {
        ...newTx,
        timestamp: Date.now()
      });
      
      // Update status in RTDB to pending
      const userStatusRef = ref(rtdb, `users/${user.uid}`);
      await update(userStatusRef, { status: 'pending' });
      
      if (proof?.proofMethod !== 'upload') {
        alert("Activation request submitted! Your account will be activated once the payment is verified.");
        setActiveTab('home');
      }
    } else {
      // Regular deposit still goes to Firestore
      await setDoc(doc(db, 'deposits', depositId), newTx);
    }

    // RTDB failover record for screenshot deposits: the 24/7 agent reads
    // this queue and mirrors its verification-chat replies into RTDB, so
    // the user still gets agent updates if the Firestore quota is ever
    // exhausted. Written after the activation overwrite above so it is
    // never wiped by it. Best-effort only — it must never break a deposit.
    if (proof?.proofMethod === 'upload') {
      try {
        await set(ref(rtdb, `pending_requests/${user.uid}/proof/${depositId}`), {
          amount,
          type,
          userName,
          date: newTx.date,
          screenshotHash: proof.screenshotHash || '',
          at: Date.now()
        });
      } catch (e) { /* failover record only */ }
    }

    // Send internal notification
    await sendDepositRequestMail(user.uid, amount, method);
    return depositId;
  };

  const handleWithdrawRequest = (amount: number, method: string, accountName: string, accountNumber: string) => {
    if (userPin) {
      setPendingWithdrawal({ amount, method, accountName, accountNumber });
      setPinMode('enter');
      setActiveTab('pin');
    } else {
      handleWithdraw(amount, method, accountName, accountNumber);
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
      handleWithdraw(pendingWithdrawal.amount, pendingWithdrawal.method, pendingWithdrawal.accountName, pendingWithdrawal.accountNumber);
      setPendingWithdrawal(null);
    }
  };

  const unreadUpdatesCount = notifications.filter(n => n.status === 'unread' && n.userId !== 'all').length;

  const handleActivateUser = async (targetUserId: string, depositId?: string) => {
    try {
      const userRef = doc(db, 'users', targetUserId);
      const userRtdbRef = ref(rtdb, `users/${targetUserId}`);
      
      const success = await runFirestoreTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document not found.");
        
        const userData = userDoc.data();
        if (userData.status === 'Active') throw new Error("User is already active.");

        // 1. Activate the user
        transaction.update(userRef, { 
          status: 'Active',
          accountStatus: 'active',
          feeStatus: 'paid'
        });
        
        // Update RTDB status
        await update(userRtdbRef, { status: 'Active', accountStatus: 'active', feeStatus: 'paid' });

        // Update deposit if exists
        if (depositId) {
          transaction.update(doc(db, 'deposits', depositId), { status: 'Approved' });
        }

        // 2. Handle Commissions
        if (userData.referredBy) {
          const l1 = await resolveRefInternal(userData.referredBy);
          
          if (l1) {
            let l1BonusAmount = activeAppSettings.referralBonusBasic || 100;
            if (l1.data.role === 'partner') {
               // Flat rate (owner decision 2026-10-24): every partner tier earns referralBonusPartner.
               l1BonusAmount = activeAppSettings.referralBonusPartner || 125;
            }

            // L1 Updates
            const l1Ref = doc(db, 'users', l1.uid);
            transaction.update(l1Ref, {
              activeMembers: increment(1),
              totalCommission: increment(l1BonusAmount),
              balance: increment(l1BonusAmount),
              totalEarnings: increment(l1BonusAmount)
            });

            // Record L1 History
            const l1HistoryRef = doc(collection(db, 'earning_history'));
            transaction.set(l1HistoryRef, {
              userId: l1.uid,
              amount: l1BonusAmount,
              source: 'invite_commission',
              description: `Rs. ${l1BonusAmount} Direct Income from ${userData.username || 'Member'}`,
              timestamp: firestoreServerTimestamp()
            });

            // L1 RTDB
            await update(ref(rtdb, `users/${l1.uid}`), {
              balance: rtdbIncrement(l1BonusAmount),
              totalEarnings: rtdbIncrement(l1BonusAmount),
              activeMembers: rtdbIncrement(1),
              totalCommission: rtdbIncrement(l1BonusAmount)
            });

            // Level 2
            if (l1.data.referredBy) {
              const l2 = await resolveRefInternal(l1.data.referredBy);
              if (l2) {
                const l2Bonus = 15;
                const l2Ref = doc(db, 'users', l2.uid);
                transaction.update(l2Ref, {
                  balance: increment(l2Bonus),
                  totalEarnings: increment(l2Bonus),
                  totalIndirectCommission: increment(l2Bonus)
                });

                transaction.set(doc(collection(db, 'earning_history')), {
                  userId: l2.uid,
                  amount: l2Bonus,
                  source: 'indirect_commission',
                  description: `Indirect Bonus (L2) from ${userData.username || 'Member'}`,
                  timestamp: firestoreServerTimestamp()
                });

                await update(ref(rtdb, `users/${l2.uid}`), {
                  balance: rtdbIncrement(l2Bonus),
                  totalEarnings: rtdbIncrement(l2Bonus),
                  totalIndirectCommission: rtdbIncrement(l2Bonus)
                });

                // Level 3
                if (l2.data.referredBy) {
                  const l3 = await resolveRefInternal(l2.data.referredBy);
                  if (l3) {
                    const l3Bonus = 10;
                    const l3Ref = doc(db, 'users', l3.uid);
                    transaction.update(l3Ref, {
                      balance: increment(l3Bonus),
                      totalEarnings: increment(l3Bonus),
                      totalIndirectCommission: increment(l3Bonus)
                    });

                    transaction.set(doc(collection(db, 'earning_history')), {
                      userId: l3.uid,
                      amount: l3Bonus,
                      source: 'indirect_commission',
                      description: `Indirect Bonus (L3) from ${userData.username || 'Member'}`,
                      timestamp: firestoreServerTimestamp()
                    });

                    await update(ref(rtdb, `users/${l3.uid}`), {
                      balance: rtdbIncrement(l3Bonus),
                      totalEarnings: rtdbIncrement(l3Bonus),
                      totalIndirectCommission: rtdbIncrement(l3Bonus)
                    });
                  }
                }
              }
            }
          }
        }
        return true;
      });

      if (success) {
        if (targetUserId === user?.uid) setStatus('Active');
        await sendActivationMail(targetUserId);
        alert("Member activated and commissions distributed successfully!");
      }
    } catch (error) {
      console.error("Error activating member:", error);
      alert(error instanceof Error ? error.message : "Error during activation.");
    }
  };

  // Helper for resolveRef inside handleActivateUser
  const resolveRefInternal = async (refCode: string) => {
    if (!refCode) return null;
    const getCleanCode = (raw: string) => {
      let code = raw;
      if (code.toLowerCase().includes('ref/')) code = code.split(/ref\//i)[1];
      else if (code.includes('=')) code = code.split('=')[1];
      return (code || '').trim().toLowerCase();
    };
    const sanitized = getCleanCode(refCode);
    if (!sanitized) return null;
    let uid = null;
    let docData = null;
    const q = query(collection(db, 'users'), where('referralCode', '==', sanitized));
    const snap = await getDocs(q);
    if (!snap.empty) {
      uid = snap.docs[0].id;
      docData = snap.docs[0].data();
    } else {
      const uDoc = await getDoc(doc(db, 'usernames', sanitized));
      if (uDoc.exists()) {
        uid = uDoc.data().uid;
        const rDoc = await getDoc(doc(db, 'users', uid));
        if (rDoc.exists()) docData = rDoc.data();
      }
    }
    return uid && docData ? { uid, data: docData, code: sanitized } : null;
  };

  const claimPendingIndirect = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;
      
      const data = userDoc.data();
      const pendingAmount = data.pendingIndirect || 0;
      
      if (pendingAmount > 0) {
        await updateDoc(userRef, {
          balance: increment(pendingAmount),
          totalEarnings: increment(pendingAmount),
          totalIndirectCommission: increment(pendingAmount),
          pendingIndirect: 0
        });
        
        await update(ref(rtdb, `users/${user.uid}`), {
          balance: rtdbIncrement(pendingAmount),
          totalEarnings: rtdbIncrement(pendingAmount),
          totalIndirectCommission: rtdbIncrement(pendingAmount),
          pendingIndirect: 0
        });
        
        reloadData();
        alert(`Successfully claimed Rs. ${pendingAmount}`);
      } else {
        alert("No pending indirect commission to claim.");
      }
    } catch (error) {
      console.error("Claim error:", error);
      alert("Error claiming commission.");
    }
  };

  const reloadData = async () => {
    if (!user) return;
    try {
      // Force get from server to bypass cache
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.totalIndirectCommission !== undefined) setTotalIndirectCommission(data.totalIndirectCommission);
        if (data.pendingIndirect !== undefined) setPendingIndirect(data.pendingIndirect);
      }
    } catch (error) {
      console.error("Manual sync error:", error);
    }
  };

  const [installDismissed, setInstallDismissed] = useState(() => {
    try { return localStorage.getItem('tm_install_banner_dismissed') === '1'; } catch { return false; }
  });
  const isAppEnv = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = (navigator.userAgent || '').toLowerCase();
    return Capacitor.isNativePlatform() ||
      ua.includes('wv') || ua.includes('appcreator24') || !!(window as any).AppCreator24 ||
      window.matchMedia('(display-mode: standalone)').matches;
  }, []);

  const renderTabContent = () => {
    // Restriction logic
    const currentAccountStatus = accountStatus.toLowerCase();
    const isInactive = currentAccountStatus !== 'active';
    const earningTabs = ['tasks', 'watch', 'lottery', 'streak'];
    
    if (isInactive && earningTabs.includes(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentAccountStatus === 'pending' ? 'Activation Pending' : 'Account Inactive'}
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xs">
            {currentAccountStatus === 'pending' 
              ? 'Your activation request is being verified by the admin. Please wait 1-6 hours.' 
              : `You need to activate your account by paying the Rs ${appSettings.activationFee} joining fee to access earning features.`}
          </p>
          <button 
            onClick={() => setActiveTab('invite')}
            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
          >
            Go to Activation Page
          </button>
        </div>
      );
    }

    if (verifyDepositId) {
      return <PaymentVerificationChat depositId={verifyDepositId} whatsappNumber={appSettings.whatsappNumber} onBack={() => setVerifyDepositId(null)} />;
    }
    switch (activeTab) {
      case 'profile':
        return <ProfileTab 
                        email={userEmail}
                 gender={userGender}
                 profileAvatarId={profileAvatarId}
                 profilePhoto={profilePhoto}
                 status={status}
                 role={role}
                 partnerTier={partnerTier}
                 balance={balance}
                 name={userName}
                 lockedBalance={lockedBalance}
                        totalIndirectCommission={totalIndirectCommission}
                 accountNumber={withdrawalAccounts[0]?.number || ''}
                 accountTitle={withdrawalAccounts[0]?.title || ''}
                 joiningDate={joiningDate}
                 referralCode={referralCode}
                 onEditProfile={() => setActiveTab('edit_profile')} 
                 onLeaderboardClick={() => setActiveTab('leaderboard')} 
                 onManageWalletClick={() => setActiveTab('manage_wallet')}
                 onPartnerUpgradeClick={() => setActiveTab('premium')}
                 onEarningHistoryClick={() => setActiveTab('earning_history')}
                 onActivateClick={() => setActiveTab('activation')}
                 onSupportAIClick={() => setActiveTab('support_ai')}
                 onMailboxClick={() => setActiveTab('updates')}
                 appSettings={activeAppSettings}
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
                        email={userEmail}
                 name={userName}
                 phone={userPhone}
                 gender={userGender}
                 profileAvatarId={profileAvatarId}
                 profilePhoto={profilePhoto}
                 role={role}
                 partnerStatus={partnerStatus}
                 partnerTier={partnerTier}
                 onBack={() => setActiveTab('profile')} 
                 onViewProPlans={() => setActiveTab('premium')}
                 onViewPartnerProgram={() => setActiveTab('partner_upgrade')}
               />;
      case 'manage_wallet':
        return <ManageWalletView 
                 balance={balance}
                 accounts={withdrawalAccounts}
                 onBack={() => setActiveTab('profile')} 
               />;
      case 'earning_history':
        return <EarningHistoryView onBack={() => setActiveTab('profile')} totalEarnings={totalEarnings} totalIndirectCommission={totalIndirectCommission} />;
      case 'social_task_plus':
        return <SocialTaskPlusView onBack={() => setActiveTab('home')} userName={userName} />;
      case 'invite':
        return <InviteTab 
          status={status}
          referralStats={{
            totalInvited: referralStats.totalInvited,
            activeMembers: referralStats.activeMembers,
            totalCommission: referralStats.totalCommission,
            totalIndirectCommission: totalIndirectCommission
          }}
          referralCode={referralCode || userName || ''}
          onActivateClick={() => setActiveTab('activation')}
          referrals={partnerReferrals}
          appSettings={activeAppSettings}
          role={role}
          partnerTier={partnerTier}
          pendingIndirect={pendingIndirect}
          onClaimIndirect={claimPendingIndirect}
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
          userName={userName}
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
          manualWithdrawUnlock={manualWithdrawUnlock || appSettings.manualWithdrawUnlock}
          appSettings={appSettings}
          isPartner={role === 'partner'}
        />;
      case 'deposit':
        if (accountStatus.toLowerCase() !== 'active') {
          return <ActivationTab onBack={() => setActiveTab('home')} appSettings={activeAppSettings} userName={userName} onOpenVerification={(id) => setVerifyDepositId(id)} />;
        }
        return <DepositTab
          onDeposit={handleDeposit}
          transactions={depositHistory}
          initialType={status === 'Inactive' ? 'activation' : 'regular'}
          appSettings={activeAppSettings}
          userCountry={userCountry}
          userName={userName}
          onOpenVerification={(id) => setVerifyDepositId(id)}
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
      case 'cpalead':
        return <CPALeadOfferWall />;
      case 'wannads':
        return <WannadsSurveyView 
                 userId={user?.uid || ''} 
                 onBack={() => setActiveTab('home')} 
               />;
      case 'premium':
        return <PremiumModal 
                 onClose={() => setActiveTab('home')} 
                 balance={balance}
                 currentRole={role}
                 partnerTier={partnerTier}
                 referrerId={referredBy}
                 onUpdateBalance={handleUpdateBalance}
                 appSettings={activeAppSettings}
               />;
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
        return <WatchTab 
          onBack={() => setActiveTab('home')}
          balance={balance}
          onUpdateBalance={handleUpdateBalance}
          accountStatus={accountStatus}
          role={role}
          partnerTier={partnerTier}
        />;
      case 'support_ai':
        return <SupportAIChat 
          onBack={() => setActiveTab('home')}
          userName={userName}
          accountStatus={accountStatus}
          balance={balance}
          persistedMessages={chatMessages}
          onUpdateMessages={handleUpdateChatMessages}
          persistedAgent={persistedAgent}
          onAgentAssigned={(a) => setPersistedAgent(a)}
        />;
      case 'tasks':
        if (accountStatus.toLowerCase() !== 'active') {
          return <ActivationTab onBack={() => setActiveTab('home')} appSettings={activeAppSettings} userName={userName} />;
        }
        return <TasksTab 
          onBack={() => setActiveTab('home')} 
          accountStatus={accountStatus}
          onPayClick={() => setActiveTab('deposit')}
        />;
      case 'task_wall':
        if (accountStatus.toLowerCase() !== 'active') {
          return <ActivationTab onBack={() => setActiveTab('home')} appSettings={activeAppSettings} userName={userName} />;
        }
        return <TaskWall 
          onBack={() => setActiveTab('home')} 
          accountStatus={accountStatus}
          onPayClick={() => setActiveTab('deposit')}
        />;
      case 'leaderboard':
        return <LeaderboardView earners={topEarners} onBack={() => setActiveTab('home')} />;
      case 'partner_tools':
        return <PartnerToolsView 
                 onBack={() => setActiveTab('home')} 
                 role={role} 
                 partnerTier={partnerTier} 
                 onGoToWithdraw={() => setActiveTab('withdraw')}
                 onGoToLottery={() => setActiveTab('lottery')}
                 referrals={partnerReferrals}
                 referralStats={referralStats}
                 onApproveMember={handleActivateUser}
               />;
      // Add other tabs as needed
      default:
        return <HomeTab 
          balance={balance}
          totalEarnings={totalEarnings}
          totalIndirectCommission={totalIndirectCommission}
          accountStatus={accountStatus}
          role={role}
          onInviteClick={() => setActiveTab('invite')}
          onDepositClick={() => setActiveTab('deposit')}
          onWithdrawClick={() => setActiveTab('withdraw')}
          onWatchAdsClick={() => setActiveTab('watch')}
          onSupportAIClick={() => setActiveTab('support_ai')}
          onTasksClick={() => setActiveTab('tasks')}
          onLotteryClick={() => setActiveTab('lottery')}
          onStreakClick={() => setActiveTab('streak')}
          onLeaderboardClick={() => setActiveTab('leaderboard')}
          onPartnerUpgradeClick={() => setActiveTab('premium')}
          onActivateClick={() => setActiveTab('activation')}
          onHistoryClick={() => setActiveTab('earning_history')}
          onTaskWallClick={() => setActiveTab('task_wall')}
          onSocialTaskPlusClick={() => setActiveTab('social_task_plus')}
          onEasyTaskClick={() => setActiveTab('wannads')}
          onOfferWallClick={() => setActiveTab('cpalead')}
          onPartnerToolsClick={() => setActiveTab('partner_tools')}
          onUpdateBalance={handleUpdateBalance}
          appSettings={activeAppSettings}
          appBonusClaimed={appBonusClaimed}
          lastDailyCheckin={lastDailyCheckin}
          unreadChatCount={unreadChatCount}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050607] flex justify-center items-center p-0 sm:p-6 font-sans overflow-x-hidden w-full max-w-full">
      {!isProfileLoaded && (
        <div className="absolute inset-0 z-[200] bg-[#15181D] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/10 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
          <p className="text-xs font-extrabold text-white uppercase tracking-widest animate-pulse">Loading Member Profile...</p>
        </div>
      )}
      {/* Referral Update Notification */}
      <AnimatePresence>
        {showReferralUpdateNotify && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#15181D] rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-amber-600"></div>
              
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-emerald-500" />
              </div>

              <h3 className="text-2xl font-black text-white mb-4 leading-tight">Link Update!</h3>
              <p className="text-sm text-zinc-400 font-medium mb-8 leading-relaxed">
                Aapka naya referral link update ho gaya hai, mazeed security ke liye ab isay istemal karein.
              </p>

              <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/5">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">New Referral Code</p>
                <p className="text-lg font-black text-white font-mono tracking-wider">{referralCode}</p>
              </div>

              <button 
                onClick={() => setShowReferralUpdateNotify(false)}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
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
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#15181D] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/5"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-center text-white mb-3 font-urdu">خوش آمدید! آپ کا اکاؤنٹ ابھی فعال (Active) نہیں ہے۔</h3>
              <p className="text-base text-center text-zinc-300 mb-6 font-urdu leading-relaxed">
                ارننگ شروع کرنے کے لیے آپ کو ایک بار جوائننگ فیس جمع کروانی ہوگی۔ نیچے دیے گئے بٹن پر کلک کریں اور فیس جمع کروا کر واٹس ایپ پر اسکرین شاٹ بھیجیں۔ اکاؤنٹ جلد ہی ایکٹیو کر دیا جائے گا۔
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowInactiveModal(false)}
                  className="flex-1 bg-white/10 text-zinc-200 font-bold py-3.5 rounded-xl hover:bg-white/15 transition-colors font-urdu"
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
      <div className={`w-full ${activeTab === 'watch' ? 'max-w-full' : 'sm:max-w-[440px]'} ${role === 'partner' ? 'bg-[#0A0C0A]' : 'bg-[#0B0D10]'} h-[100dvh] sm:h-[850px] sm:rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] relative flex flex-col overflow-hidden border-0 sm:border-[12px] border-zinc-800`}>
        
        {/* Top Notification Bar & Announcements */}
        <AnimatePresence>
          {showNotification && activeTab !== 'support_ai' && (
            <AnnouncementBar 
              dynamicMessage={notificationMessage} 
              onClose={() => setShowNotification(false)} 
            />
          )}
        </AnimatePresence>

        {/* App bar — logo, live balance pill, notifications, profile */}
        {activeTab !== 'support_ai' && (
          <div className={`px-4 py-3 ${role === 'partner' ? 'bg-[#022c22] border-white/10' : 'bg-[#15181D] border-white/5'} flex items-center justify-between sticky top-0 z-40 border-b transition-all duration-300`}>
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('home')}>
              <img src="/favicon.svg" alt="TaskMint logo" className="w-9 h-9 rounded-xl shadow-md shadow-emerald-600/25" />
              <span className={`font-extrabold text-lg tracking-tight ${role === 'partner' ? 'text-white' : 'text-white'}`}>
                Task<span className="text-emerald-400">Mint</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border active:scale-95 transition ${role === 'partner' ? 'bg-white/5 border-white/10 text-white' : 'bg-emerald-500/10 border-emerald-500/20 text-white'}`}
              >
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black">Rs {balance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </button>
              <button
                onClick={() => setActiveTab('updates')}
                className={`relative w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition ${role === 'partner' ? 'bg-white/5 text-white' : 'bg-white/5 text-zinc-300'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadUpdatesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
                    {unreadUpdatesCount > 9 ? '9+' : unreadUpdatesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="relative w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-white/5 active:scale-95 transition"
              >
                {profileAvatarId || profilePhoto ? (
                   <DynamicAvatar avatarId={profileAvatarId} photo={profilePhoto} fallbackText={userName} />
                ) : (
                   <UserCircle className="w-6 h-6 text-zinc-300" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* App install banner — website only (not inside the APK) */}
        {activeTab === 'home' && !isAppEnv && !installDismissed && (
          <div className="mx-4 mt-3 flex items-center gap-3 bg-[#15181D] border border-emerald-500/25 rounded-2xl px-3.5 py-3 relative z-30">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Download className="w-4.5 h-4.5 w-[18px] h-[18px] text-emerald-400" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-white leading-tight">Install the TaskMint App</p>
              <p className="text-[10px] font-semibold text-zinc-400 leading-tight mt-0.5">Get a Rs. 100 bonus + Rs. 10 daily reward, only in the app.</p>
            </div>
            <button
              onClick={() => { window.location.href = '/app-download'; }}
              className="bg-green-500 hover:bg-green-400 text-black text-[10px] font-black px-3 py-2 rounded-lg active:scale-95 transition shrink-0"
            >
              INSTALL
            </button>
            <button
              onClick={() => { setInstallDismissed(true); try { localStorage.setItem('tm_install_banner_dismissed', '1'); } catch {} }}
              className="text-zinc-500 hover:text-zinc-300 shrink-0 p-1"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className={`flex-1 overflow-y-auto ${['watch', 'support_ai'].includes(activeTab) ? 'px-0 pt-0' : 'px-4 pt-4'} hide-scrollbar ${role === 'partner' ? 'bg-[#0A0C0A]' : 'bg-[#0B0D10]'}`}>
          <div className={`${['watch', 'support_ai'].includes(activeTab) ? 'max-w-full h-full' : 'max-w-2xl mx-auto pb-28'}`}>
            {renderTabContent()}
          </div>
        </div>

        {/* Bottom tab bar */}
        {activeTab !== 'support_ai' && (
          <div className={`fixed bottom-0 left-0 right-0 z-50 ${role === 'partner' ? 'bg-[#022c22] border-white/10' : 'bg-[#15181D] border-white/5'} border-t px-2 pt-2 pb-4 flex items-start justify-around`}>
            {[
              { id: 'home', icon: <LayoutGrid className="w-5 h-5" strokeWidth={2} />, label: 'Home' },
              { id: 'watch', icon: <Tv2 className="w-5 h-5" strokeWidth={2} />, label: 'Watch' },
              { id: 'task_wall', icon: <Rocket className="w-5 h-5" strokeWidth={2} />, label: 'Surveys' },
              { id: 'tasks', icon: <Zap className="w-5 h-5" strokeWidth={2} />, label: 'Tasks' },
              { id: 'premium', icon: <ShieldCheck className="w-5 h-5" strokeWidth={2} />, label: 'PRO' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex flex-col items-center gap-1 active:scale-95 transition"
                >
                  <span className={`px-4 py-1.5 rounded-full transition ${active ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : (role === 'partner' ? 'text-zinc-500' : 'text-zinc-500')}`}>
                    {tab.icon}
                  </span>
                  <span className={`text-[10px] font-bold leading-none ${active ? 'text-emerald-400' : (role === 'partner' ? 'text-zinc-400' : 'text-zinc-500')}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Global Shimmer Keyframe */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        `}} />
      </div>
    </div>
  );
}

