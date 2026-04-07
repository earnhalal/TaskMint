import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, Save, CheckCircle2 } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

interface EditProfileViewProps {
  name: string;
  email: string;
  phone: string;
  accountNumber: string;
  accountTitle: string;
  onBack: () => void;
}

export default function EditProfileView({ name: propName, email: propEmail, phone: propPhone, accountNumber: propAccountNumber, accountTitle: propAccountTitle, onBack }: EditProfileViewProps) {
  const { user } = useAuth();
  const [name, setName] = useState(propName);
  const [email, setEmail] = useState(propEmail);
  const [phone, setPhone] = useState(propPhone);
  const [accountNumber, setAccountNumber] = useState(propAccountNumber);
  const [accountTitle, setAccountTitle] = useState(propAccountTitle);
  const [isSaved, setIsSaved] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatar(localStorage.getItem('taskmint_avatar'));
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('taskmint_avatar', base64String);
        setAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: name,
        email: email,
        phone: phone,
        withdrawalAccountNumber: accountNumber,
        withdrawalAccountTitle: accountTitle
      });
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onBack();
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 px-4 pt-4"
    >
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-3xl font-bold shadow-md relative overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              name.substring(0, 2).toUpperCase()
            )}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            Change Photo
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Withdrawal Account Title</label>
            <input 
              type="text" 
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Withdrawal Account Number</label>
            <input 
              type="text" 
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={isSaved}
        className={`w-full text-white py-4 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
          isSaved ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
        }`}
      >
        {isSaved ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Saved Successfully!
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Changes
          </>
        )}
      </button>
    </motion.div>
  );
}
