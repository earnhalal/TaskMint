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
  
  // Determine initial view based on state passed during navigation, default to login
  const initialView = location.state?.isLogin === false ? 'signup' : 'login';

  const handleSignup = async (data: {username: string, email: string, phone: string, password: string, referralCode?: string}) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
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
        const parentRef = doc(db, 'users', data.referralCode);
        const parentDoc = await getDoc(parentRef);
        if (parentDoc.exists()) {
          // Update invite count in RTDB
          const parentReferralRef = ref(rtdb, `invites/${data.referralCode}`);
          await update(parentReferralRef, {
            totalInvited: rtdbIncrement(1)
          });
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
