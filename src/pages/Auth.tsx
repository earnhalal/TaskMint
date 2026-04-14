import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '../firebase';
import AuthView from '../components/AuthView';

import { doc, setDoc, getDoc, updateDoc, increment, query, collection, where, getDocs } from 'firebase/firestore';
import { db, rtdb } from '../firebase';
import { ref, update, increment as rtdbIncrement, set, serverTimestamp } from 'firebase/database';
import { sendWelcomeMail } from '../services/notificationService';

const auth = getAuth(app);

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if there's a referral code in the URL
  const queryParams = new URLSearchParams(location.search);
  const hasRef = queryParams.has('ref');
  
  // Determine initial view based on mode prop
  const initialView = mode;

  const handleSignup = async (data: {username: string, email: string, phone: string, password: string, referralCode?: string}) => {
    try {
      // Check if username is unique
      const usernameDoc = await getDoc(doc(db, 'usernames', data.username.toLowerCase()));
      if (usernameDoc.exists()) {
        throw new Error("Username is already taken. Please choose another one.");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // Generate unique referral code for the new user
      const phoneSuffix = data.phone.slice(-3) || Math.floor(100 + Math.random() * 900).toString();
      const uniqueReferralCode = `${data.username.toLowerCase()}_${phoneSuffix}`;

      // Save user data to RTDB
      const userRef = ref(rtdb, `users/${user.uid}`);
      const userData = {
        uid: user.uid,
        username: data.username,
        email: data.email,
        phone: data.phone,
        balance: 0,
        status: 'Inactive',
        role: data.email === 'r83842009@gmail.com' ? 'admin' : 'user',
        joiningDate: new Date().toISOString(),
        referredBy: data.referralCode || null,
        feeStatus: 'unpaid',
        referralCode: uniqueReferralCode
      };
      
      await set(userRef, userData);

      // Save user data to Firestore 'users' collection
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        lockedBalance: 0,
        appBonusClaimed: false,
        lastDailyCheckin: null,
        pin: '',
        withdrawalAccounts: [],
        seenUpdates: []
      });

      // Save username to usernames collection (Firestore)
      await setDoc(doc(db, 'usernames', data.username.toLowerCase()), {
        uid: user.uid,
        username: data.username
      });

      // Send Welcome Mail to internal mailbox
      await sendWelcomeMail(user.uid, data.username);

      // If referred, save referral relationship in RTDB
      if (data.referralCode) {
        const sanitizedRef = data.referralCode.trim().toLowerCase();
        
        // Find parent UID
        let parentUid = null;
        const q = query(collection(db, 'users'), where('referralCode', '==', sanitizedRef));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          parentUid = querySnapshot.docs[0].id;
        } else {
          const parentUsernameDoc = await getDoc(doc(db, 'usernames', sanitizedRef));
          if (parentUsernameDoc.exists()) {
            parentUid = parentUsernameDoc.data().uid;
          }
        }

        if (parentUid) {
          // Save referral to RTDB: invites/{parentUid}/history/{new_uid}
          const referralRef = ref(rtdb, `invites/${parentUid}/history/${user.uid}`);
          await set(referralRef, {
            name: data.username,
            status: 'unpaid',
            timestamp: serverTimestamp()
          });

          // Initialize/Update referrer stats in RTDB: users/{parentUid}
          const referrerRef = ref(rtdb, `users/${parentUid}`);
          await update(referrerRef, {
            totalInvited: rtdbIncrement(1)
          });
          // Ensure activeMembers is initialized if not present
          // Note: rtdbIncrement(0) doesn't work for initialization if field is missing.
          // We need to check or just set it if it doesn't exist.
          // Since we are using update, we can't easily check-and-set.
          // Let's use a transaction or just set it if it doesn't exist.
          // Actually, for simplicity, let's just ensure it exists.
          // Since we can't easily check in update, let's just set it to 0 if not present.
          // Actually, Firebase RTDB `update` will just add the field if it doesn't exist.
          // Wait, `rtdbIncrement` works fine even if field doesn't exist (it treats it as 0).
          // So just incrementing is enough.
        }
      }

      localStorage.setItem('taskmint_is_logged_in', 'true');
      localStorage.setItem('taskmint_name', data.username);
      localStorage.setItem('taskmint_email', data.email);
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Signup error:", error);
      alert(error.message);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('taskmint_is_logged_in', 'true');
      localStorage.setItem('taskmint_email', email);
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      alert(error.message);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Password reset link sent to ${email}`);
    } catch (error: any) {
      console.error("Reset password error:", error);
      alert(error.message);
    }
  };

  return (
    <AuthView 
      initialView={initialView}
      initialReferralCode={queryParams.get('ref') || ''}
      onSignup={handleSignup}
      onLogin={handleLogin}
      onForgotPassword={handleForgotPassword}
    />
  );
}
