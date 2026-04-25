import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { DynamicAvatar, maleAvatarIds, femaleAvatarIds } from '../ui/DynamicAvatar';

interface EditProfileViewProps {
  name: string;
  email: string;
  phone: string;
  gender: string;
  profileAvatarId: string;
  country?: string;
  city?: string;
  onBack: () => void;
}

export default function EditProfileView({ name: propName, email: propEmail, phone: propPhone, gender: propGender, profileAvatarId: propProfileAvatarId, country: propCountry, city: propCity, onBack }: EditProfileViewProps) {
  const { user } = useAuth();
  const [name, setName] = useState(propName);
  const [email, setEmail] = useState(propEmail);
  const [phone, setPhone] = useState(propPhone);
  const [gender, setGender] = useState(propGender || 'male');
  const [country, setCountry] = useState(propCountry || '');
  const [city, setCity] = useState(propCity || '');
  const [isSaved, setIsSaved] = useState(false);
  const [avatarId, setAvatarId] = useState<string>(propProfileAvatarId || 'm1');

  useEffect(() => {
    if (propProfileAvatarId) {
      setAvatarId(propProfileAvatarId);
    }
    if (propGender) {
      setGender(propGender.toLowerCase());
    }
  }, [propProfileAvatarId, propGender]);

  const handleSave = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: name,
        email: email,
        phone: phone,
        gender: gender,
        country: country,
        city: city,
        profile_avatar_id: avatarId
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

  const getAvailableAvatars = () => {
    return gender === 'female' ? femaleAvatarIds : maleAvatarIds;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 px-4 pt-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-white text-3xl font-black shadow-xl relative overflow-hidden group mb-6">
            <DynamicAvatar avatarId={avatarId} fallbackText={name} className="w-full h-full" />
          </div>
          
          <div className="w-full mb-6">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Select Identity</label>
             <div className="flex bg-slate-100 rounded-xl p-1 w-full max-w-[200px] mx-auto mb-6">
               <button 
                 onClick={() => {
                   setGender('male');
                   if (!maleAvatarIds.includes(avatarId)) setAvatarId(maleAvatarIds[0]);
                 }}
                 className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${gender === 'male' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
               >
                 Male
               </button>
               <button 
                 onClick={() => {
                   setGender('female');
                   if (!femaleAvatarIds.includes(avatarId)) setAvatarId(femaleAvatarIds[0]);
                 }}
                 className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${gender === 'female' ? 'bg-white shadow text-pink-600' : 'text-slate-500'}`}
               >
                 Female
               </button>
             </div>
             
             <div className="grid grid-cols-5 gap-3 mt-4">
               {getAvailableAvatars().map((avId) => (
                 <button
                   key={avId}
                   onClick={() => setAvatarId(avId)}
                   className={`aspect-square w-full rounded-full overflow-hidden border-[3px] transition-all p-0 ${avatarId === avId ? 'border-amber-400 scale-110 shadow-xl' : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100 shadow-sm'}`}
                 >
                   <DynamicAvatar avatarId={avId} fallbackText={name} className="w-full h-full" />
                 </button>
               ))}
             </div>
          </div>
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
              readOnly
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 cursor-not-allowed"
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
            <input 
              list="countries"
              type="text" 
              placeholder="Search or enter country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <datalist id="countries">
              <option value="Pakistan" />
              <option value="India" />
              <option value="United States" />
              <option value="United Kingdom" />
              <option value="United Arab Emirates" />
              <option value="Saudi Arabia" />
              <option value="Canada" />
              <option value="Australia" />
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
            <input 
              type="text" 
              placeholder="Enter your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button 
          onClick={handleSave}
          disabled={isSaved}
          className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all ${isSaved ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-5 h-5" /> Saved Successfully
            </>
          ) : (
            <>
              <Save className="w-5 h-5" /> Save Changes
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
