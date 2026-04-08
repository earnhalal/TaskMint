import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '../firebase';
import AuthView from '../components/AuthView';

import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, rtdb } from '../firebase';
import { ref, update, increment as rtdbIncrement } from 'firebase/database';
import { sendWelcomeMail } from '../services/notificationService';

const auth = getAuth(app);

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if there's a referral code in the URL
  const queryParams = new URLSearchParams(location.search);
  const hasRef = queryParams.has('ref');
  
  // Determine initial view based on state passed during navigation, or if referred
  const initialView = (location.state?.isLogin === false || hasRef) ? 'signup' : 'login';

  const handleSignup = async (data: {username: string, email: string, phone: string, password: string, referralCode?: string}) => {
    try {
      // Check if username is unique
      const usernameDoc = await getDoc(doc(db, 'usernames', data.username.toLowerCase()));
      if (usernameDoc.exists()) {
        throw new Error("Username is already taken. Please choose another one.");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // Save username to usernames collection
      await setDoc(doc(db, 'usernames', data.username.toLowerCase()), {
        uid: user.uid,
        username: data.username
      });

      // Save user data to Firestore
      const userData = {
        uid: user.uid,
        username: data.username,
        email: data.email,
        phone: data.phone,
        balance: 0,
        status: 'Inactive',
        role: data.email === 'r83842009@gmail.com' ? 'admin' : 'user',
        partnerStatus: 'none',
        totalTeamEarnings: 0,
        freeSpins: 0,
        joiningDate: new Date().toISOString(),
        referredBy: data.referralCode || null,
        referralStats: {
          totalInvited: 0,
          activeMembers: 0,
          totalCommission: 0
        }
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Send Welcome Mail to internal mailbox
      await sendWelcomeMail(user.uid, data.username);

      // If referred, update parent's totalInvited count
      if (data.referralCode) {
        // We need to find the parent's UID from their username
        const parentUsernameDoc = await getDoc(doc(db, 'usernames', data.referralCode.toLowerCase()));
        if (parentUsernameDoc.exists()) {
          const parentUid = parentUsernameDoc.data().uid;
          const parentRef = doc(db, 'users', parentUid);
          const parentDoc = await getDoc(parentRef);
          if (parentDoc.exists()) {
            // Update invite count in RTDB
            const parentReferralRef = ref(rtdb, `invites/${parentUid}`);
            await update(parentReferralRef, {
              totalInvited: rtdbIncrement(1)
            });
          }
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
      onSignup={handleSignup}
      onLogin={handleLogin}
      onForgotPassword={handleForgotPassword}
    />
  );
}
