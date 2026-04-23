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
  gender: string;
  avatarUrl: string;
  accountNumber: string;
  accountTitle: string;
  onBack: () => void;
}

export default function EditProfileView({ name: propName, email: propEmail, phone: propPhone, gender: propGender, avatarUrl: propAvatar, accountNumber: propAccountNumber, accountTitle: propAccountTitle, onBack }: EditProfileViewProps) {
  const { user } = useAuth();
  const [name, setName] = useState(propName);
  const [email, setEmail] = useState(propEmail);
  const [phone, setPhone] = useState(propPhone);
  const [gender, setGender] = useState(propGender || '');
  const [accountNumber, setAccountNumber] = useState(propAccountNumber);
  const [accountTitle, setAccountTitle] = useState(propAccountTitle);
  const [isSaved, setIsSaved] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(propAvatar || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const avatarPresets = [
    { id: 'male', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    { id: 'female', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
    { id: 'third', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=JD' }
  ];

  useEffect(() => {
    if (propAvatar) {
      setAvatar(propAvatar);
    } else {
      const saved = localStorage.getItem('taskmint_avatar');
      if (saved) setAvatar(saved);
    }
  }, [propAvatar]);

  const handleSelectPreset = (url: string) => {
    setAvatar(url);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
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
        gender: gender,
        avatarUrl: avatar,
        withdrawalAccountNumber: accountNumber,
        withdrawalAccountTitle: accountTitle
      });
      
      // Update local storage for immediate persistence as fallback
      if (avatar) localStorage.setItem('taskmint_avatar', avatar);
      
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
          <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl relative overflow-hidden group">
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              name.substring(0, 2).toUpperCase()
            )}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-2 border-white/20 rounded-[2.5rem]"
            >
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="mt-8 flex gap-5">
            {avatarPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.url)}
                className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-slate-50 ${avatar === preset.url ? 'border-blue-500 scale-110 shadow-xl' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
              >
                <img src={preset.url} alt={preset.id} className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"
          >
            Custom Upload
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender Selection</label>
            <div className="grid grid-cols-3 gap-3">
              {['Male', 'Female', 'Other'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${
                    gender === g 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
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
