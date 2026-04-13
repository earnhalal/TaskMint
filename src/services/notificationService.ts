import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type NotificationType = 'welcome' | 'activation' | 'deposit' | 'withdrawal' | 'verification' | 'system';

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const playNotificationSound = () => {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.play().catch(err => console.log('Audio play blocked by browser', err));
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export const sendInternalNotification = async (data: NotificationData) => {
  try {
    const notification = {
      ...data,
      status: 'unread',
      timestamp: new Date().toISOString(),
    };
    
    await addDoc(collection(db, 'notifications'), notification);
    console.log(`Notification sent to ${data.userId}: ${data.title}`);
  } catch (error) {
    console.error('Error sending internal notification:', error);
  }
};

export const sendWelcomeMail = (userId: string, userName: string) => {
  return sendInternalNotification({
    userId,
    title: 'Welcome to TaskMint! 🚀',
    message: `Hi ${userName}, welcome to TaskMint! We are excited to have you here. Start earning by completing tasks and referring friends.`,
    type: 'welcome'
  });
};

export const sendActivationMail = (userId: string) => {
  return sendInternalNotification({
    userId,
    title: 'Account Activated! ✅',
    message: 'Congratulations! Your account has been successfully activated. You can now access all earning features.',
    type: 'activation'
  });
};

export const sendDepositRequestMail = (userId: string, amount: number, method: string) => {
  return sendInternalNotification({
    userId,
    title: 'Deposit Request Received',
    message: `Your deposit request of Rs ${amount} via ${method} has been received and is currently pending approval.`,
    type: 'deposit'
  });
};

export const sendDepositApprovedMail = (userId: string, amount: number) => {
  return sendInternalNotification({
    userId,
    title: 'Deposit Approved! 💰',
    message: `Your deposit of Rs ${amount} has been approved and added to your balance.`,
    type: 'deposit'
  });
};

export const sendWithdrawalRequestMail = (userId: string, amount: number, method: string) => {
  return sendInternalNotification({
    userId,
    title: 'Withdrawal Request Received',
    message: `Your withdrawal request of Rs ${amount} to ${method} has been received. It will be processed soon.`,
    type: 'withdrawal'
  });
};

export const sendWithdrawalApprovedMail = (userId: string, amount: number) => {
  return sendInternalNotification({
    userId,
    title: 'Withdrawal Approved! ✅',
    message: `Your withdrawal of Rs ${amount} has been approved and sent to your account.`,
    type: 'withdrawal'
  });
};

export const sendSystemUpdateMail = (userId: string, title: string, message: string) => {
  return sendInternalNotification({
    userId,
    title,
    message,
    type: 'system'
  });
};
