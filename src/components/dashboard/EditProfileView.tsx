import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, CheckCircle2, ImagePlus, X, Lock, Crown, Handshake } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as rtdbRef, update as rtdbUpdate } from 'firebase/database';
import { db, rtdb } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { DynamicAvatar, maleAvatarIds, femaleAvatarIds } from '../ui/DynamicAvatar';
import { AVATAR_3D_MALE, AVATAR_3D_FEMALE } from '../../assets/avatars3d';
import { AVATAR_PRO_IDS, AVATAR_PARTNER_IDS } from '../../assets/avatarsTiers';
import { compressSquareImage } from '../../utils/proofImage';

interface EditProfileViewProps {
  name: string;
  email: string;
  phone: string;
  gender: string;
  profileAvatarId: string;
  profilePhoto?: string;
  country?: string;
  city?: string;
  // Plan fields from the user doc (same state Dashboard keeps from its
  // user-doc listener) — used only to gate avatar selection in the picker.
  role?: string;
  partnerStatus?: string;
  partnerTier?: string;
  onBack: () => void;
  // Existing Dashboard navigation: 'premium' tab (PremiumModal / PRO plans)
  // and 'partner_upgrade' view (Partner Program join flow).
  onViewProPlans?: () => void;
  onViewPartnerProgram?: () => void;
}

export default function EditProfileView({ name: propName, email: propEmail, phone: propPhone, gender: propGender, profileAvatarId: propProfileAvatarId, profilePhoto: propProfilePhoto, country: propCountry, city: propCity, role = 'user', partnerStatus = 'none', partnerTier = 'basic', onBack, onViewProPlans, onViewPartnerProgram }: EditProfileViewProps) {
  const { user } = useAuth();
  const [name, setName] = useState(propName);
  const [email, setEmail] = useState(propEmail);
  const [phone, setPhone] = useState(propPhone);
  const [gender, setGender] = useState(propGender || 'male');
  const [country, setCountry] = useState(propCountry || '');
  const [city, setCity] = useState(propCity || '');
  const [isSaved, setIsSaved] = useState(false);
  const [avatarId, setAvatarId] = useState<string>(propProfileAvatarId || 'm1');
  const [photo, setPhoto] = useState<string>(propProfilePhoto || '');
  const [lockedPrompt, setLockedPrompt] = useState<'pro' | 'partner' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plan tiers for avatar locking. The app's paid plans are the partner
  // tiers (basic/bronze/silver/gold) sold as PRO plans: buying one — or an
  // approved partner application — sets role 'partner', partnerStatus
  // 'active' and the tier name on the user doc.
  const isPartner = role === 'partner' || partnerStatus === 'active';
  const hasProPlan = isPartner || (partnerStatus === 'active' && ['bronze', 'silver', 'gold'].includes(partnerTier));

  useEffect(() => {
    if (propProfileAvatarId) {
      setAvatarId(propProfileAvatarId);
    }
    if (propProfilePhoto !== undefined) {
      setPhoto(propProfilePhoto);
    }
    if (propGender) {
      setGender(propGender.toLowerCase());
    }
  }, [propProfileAvatarId, propProfilePhoto, propGender]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressSquareImage(file, 256, 0.8);
      setPhoto(dataUrl);
    } catch (error) {
      console.error("Error processing photo:", error);
    }
  };

  const handlePresetSelect = (avId: string) => {
    setAvatarId(avId);
    setPhoto('');
  };

  // Locked tier avatars never select — they open the upgrade prompt instead.
  const handleTierSelect = (avId: string, required: 'pro' | 'partner') => {
    const unlocked = required === 'partner' ? isPartner : hasProPlan;
    if (!unlocked) {
      setLockedPrompt(required);
      return;
    }
    handlePresetSelect(avId);
  };

  const renderTierTiles = (ids: string[], required: 'pro' | 'partner') => {
    const unlocked = required === 'partner' ? isPartner : hasProPlan;
    return (
      <div className="grid grid-cols-5 gap-3 mt-3">
        {ids.map((avId) => (
          <div key={avId} className="relative">
            <button
              onClick={() => handleTierSelect(avId, required)}
              className={`aspect-square w-full rounded-full overflow-hidden border-[3px] transition-all p-0 ${!photo && avatarId === avId ? 'border-emerald-400 scale-110 shadow-xl' : 'border-transparent hover:scale-105 shadow-sm'} ${unlocked ? 'opacity-70 hover:opacity-100' : ''}`}
            >
              <span className={`block w-full h-full ${unlocked ? '' : 'opacity-40 grayscale-[35%]'}`}>
                <DynamicAvatar avatarId={avId} fallbackText={name} className="w-full h-full" />
              </span>
            </button>
            <span className={`absolute -top-1 -left-1 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full shadow ${required === 'pro' ? 'bg-amber-400 text-amber-950' : 'bg-teal-400 text-teal-950'}`}>
              {required === 'pro' ? 'PRO' : 'Partner'}
            </span>
            {!unlocked && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center shadow">
                <Lock className="w-3 h-3 text-white" />
              </span>
            )}
          </div>
        ))}
      </div>
    );
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
        country: country,
        city: city,
        profile_avatar_id: avatarId,
        profile_photo: photo
      });

      // Best-effort mirror of the photo to RTDB — never block the save on it.
      try {
        await rtdbUpdate(rtdbRef(rtdb, `users/${user.uid}`), { profile_photo: photo });
      } catch (mirrorError) {
        console.error("Error mirroring profile photo:", mirrorError);
      }
      
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

  const get3dAvatars = () => {
    return gender === 'female' ? AVATAR_3D_FEMALE : AVATAR_3D_MALE;
  };

  // 3D avatars first, then the classic flat set.
  const presetTiles = [
    ...get3dAvatars().map((id) => ({ id, flat: false })),
    ...getAvailableAvatars().map((id) => ({ id, flat: true }))
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 px-4 pt-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 bg-[#15181D] rounded-full shadow-sm border border-white/5 hover:bg-white/5">
          <ArrowLeft className="w-5 h-5 text-zinc-300" />
        </button>
        <h2 className="text-xl font-bold text-white">Edit Profile</h2>
      </div>

      <div className="bg-[#15181D] rounded-3xl p-6 shadow-sm border border-white/5 mb-6">
        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-white text-3xl font-black shadow-xl relative overflow-hidden group mb-4">
            <DynamicAvatar avatarId={avatarId} photo={photo} fallbackText={name} className="w-full h-full" />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 transition-all active:scale-95"
            >
              <ImagePlus className="w-4 h-4" /> Upload Photo
            </button>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto('')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition-all active:scale-95"
              >
                <X className="w-4 h-4" /> Remove Photo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
          
          <div className="w-full mb-6">
             <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">Select Identity</label>
             <div className="flex bg-white/10 rounded-xl p-1 w-full max-w-[200px] mx-auto mb-6">
               <button 
                 onClick={() => {
                   setGender('male');
                   if (![...AVATAR_3D_MALE, ...maleAvatarIds].includes(avatarId)) setAvatarId(AVATAR_3D_MALE[0]);
                 }}
                 className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${gender === 'male' ? 'bg-[#15181D] shadow text-teal-400' : 'text-zinc-400'}`}
               >
                 Male
               </button>
               <button 
                 onClick={() => {
                   setGender('female');
                   if (![...AVATAR_3D_FEMALE, ...femaleAvatarIds].includes(avatarId)) setAvatarId(AVATAR_3D_FEMALE[0]);
                 }}
                 className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${gender === 'female' ? 'bg-[#15181D] shadow text-pink-600' : 'text-zinc-400'}`}
               >
                 Female
               </button>
             </div>
             
             <div className="w-full text-left">
               <p className="text-[11px] font-black text-zinc-300 uppercase tracking-widest mt-4">Free Avatars</p>
               <div className="grid grid-cols-5 gap-3 mt-3">
                 {presetTiles.map(({ id: avId, flat }) => (
                   <button
                     key={avId}
                     onClick={() => handlePresetSelect(avId)}
                     className={`aspect-square w-full rounded-full overflow-hidden border-[3px] transition-all p-0 ${!photo && avatarId === avId ? 'border-emerald-400 scale-110 shadow-xl' : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100 shadow-sm'}`}
                   >
                     <DynamicAvatar avatarId={avId} variant={flat ? 'flat' : 'auto'} fallbackText={name} className="w-full h-full" />
                   </button>
                 ))}
               </div>

               <p className="text-[11px] font-black text-zinc-300 uppercase tracking-widest mt-6 flex items-center gap-1.5">
                 <Crown className="w-3.5 h-3.5 text-amber-400" /> PRO Avatars
               </p>
               {renderTierTiles(AVATAR_PRO_IDS, 'pro')}

               <p className="text-[11px] font-black text-zinc-300 uppercase tracking-widest mt-6 flex items-center gap-1.5">
                 <Handshake className="w-3.5 h-3.5 text-teal-400" /> Partner Avatars
               </p>
               {renderTierTiles(AVATAR_PARTNER_IDS, 'partner')}
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={email}
              readOnly
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Country</label>
            <input 
              list="countries"
              type="text" 
              placeholder="Search or enter country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">City</label>
            <input 
              type="text" 
              placeholder="Enter your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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

      {lockedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6" onClick={() => setLockedPrompt(null)}>
          <div className="w-full max-w-sm bg-[#15181D] border border-white/10 rounded-3xl p-6 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${lockedPrompt === 'pro' ? 'bg-amber-400/15 text-amber-400' : 'bg-teal-400/15 text-teal-400'}`}>
              {lockedPrompt === 'pro' ? <Crown className="w-7 h-7" /> : <Handshake className="w-7 h-7" />}
            </div>
            {lockedPrompt === 'pro' ? (
              <>
                <h3 className="text-lg font-bold text-white mb-2">This avatar is exclusive to PRO members.</h3>
                <p className="text-sm text-zinc-400 mb-6">Upgrade to a PRO plan to unlock PRO avatars.</p>
                <button
                  onClick={() => { setLockedPrompt(null); (onViewProPlans ?? onBack)(); }}
                  className="w-full py-3.5 rounded-xl bg-amber-400 text-amber-950 font-bold text-sm hover:bg-amber-300 transition-all active:scale-[0.98]"
                >
                  View PRO Plans
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-2">This avatar is exclusive to Partners.</h3>
                <p className="text-sm text-zinc-400 mb-6">Join the Partner Program to unlock Partner avatars.</p>
                <button
                  onClick={() => { setLockedPrompt(null); (onViewPartnerProgram ?? onBack)(); }}
                  className="w-full py-3.5 rounded-xl bg-teal-400 text-teal-950 font-bold text-sm hover:bg-teal-300 transition-all active:scale-[0.98]"
                >
                  View Partner Program
                </button>
              </>
            )}
            <button
              onClick={() => setLockedPrompt(null)}
              className="w-full py-3 mt-2 rounded-xl text-zinc-400 font-bold text-sm hover:text-white transition-all"
            >
              Not Now
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
