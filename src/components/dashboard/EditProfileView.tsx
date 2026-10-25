import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Save, CheckCircle2, ImagePlus, X, Lock, Crown, Handshake,
  User, Phone, Globe, MapPin, Mail, AlertCircle, Sparkles,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as rtdbRef, update as rtdbUpdate } from 'firebase/database';
import { db, rtdb } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { DynamicAvatar } from '../ui/DynamicAvatar';
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
  // Plan fields from the user doc — used only to gate avatar selection.
  role?: string;
  partnerStatus?: string;
  partnerTier?: string;
  onBack: () => void;
  onViewProPlans?: () => void;
  onViewPartnerProgram?: () => void;
}

/**
 * Edit Profile — redesigned 2026-10-25.
 *
 * - The old flat "sticker" avatar sets are gone from the picker; the
 *   free set is the glossy 3D avatars, with the PRO and Partner 3D
 *   sets below (locked without the plan, as before). A previously
 *   saved legacy avatar still displays everywhere — it just is not
 *   offered here any more.
 * - Save writes Firestore first, then mirrors photo + avatar +
 *   username to RTDB. Failures are now SHOWN to the user instead of
 *   being swallowed silently.
 */
export default function EditProfileView({ name: propName, email: propEmail, phone: propPhone, gender: propGender, profileAvatarId: propProfileAvatarId, profilePhoto: propProfilePhoto, country: propCountry, city: propCity, role = 'user', partnerStatus = 'none', partnerTier = 'basic', onBack, onViewProPlans, onViewPartnerProgram }: EditProfileViewProps) {
  const { user } = useAuth();
  const [name, setName] = useState(propName);
  const [email] = useState(propEmail);
  const [phone, setPhone] = useState(propPhone);
  const [gender, setGender] = useState(propGender || 'male');
  const [country, setCountry] = useState(propCountry || '');
  const [city, setCity] = useState(propCity || '');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [avatarId, setAvatarId] = useState<string>(propProfileAvatarId || 'a1');
  const [photo, setPhoto] = useState<string>(propProfilePhoto || '');
  const [lockedPrompt, setLockedPrompt] = useState<'pro' | 'partner' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPartner = role === 'partner' || partnerStatus === 'active';
  const hasProPlan = isPartner || (partnerStatus === 'active' && ['bronze', 'silver', 'gold'].includes(partnerTier));

  useEffect(() => {
    if (propProfileAvatarId) setAvatarId(propProfileAvatarId);
    if (propProfilePhoto !== undefined) setPhoto(propProfilePhoto);
    if (propGender) setGender(propGender.toLowerCase());
  }, [propProfileAvatarId, propProfilePhoto, propGender]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressSquareImage(file, 256, 0.8);
      setPhoto(dataUrl);
    } catch (error) {
      console.error('Error processing photo:', error);
    }
  };

  const handlePresetSelect = (avId: string) => {
    setAvatarId(avId);
    setPhoto('');
  };

  const handleTierSelect = (avId: string, required: 'pro' | 'partner') => {
    const unlocked = required === 'partner' ? isPartner : hasProPlan;
    if (!unlocked) {
      setLockedPrompt(required);
      return;
    }
    handlePresetSelect(avId);
  };

  const handleSave = async () => {
    if (!user || saveState === 'saving') return;
    setSaveState('saving');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username: name,
        phone: phone,
        gender: gender,
        country: country,
        city: city,
        profile_avatar_id: avatarId,
        profile_photo: photo,
      });
      // Best-effort RTDB mirror (photo + avatar + name) — never block
      // the save on it.
      try {
        await rtdbUpdate(rtdbRef(rtdb, `users/${user.uid}`), {
          profile_photo: photo,
          profile_avatar_id: avatarId,
          username: name,
        });
      } catch (mirrorError) {
        console.error('Error mirroring profile to RTDB:', mirrorError);
      }
      setSaveState('saved');
      setTimeout(() => onBack(), 1200);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveState('error');
    }
  };

  const freeAvatars = gender === 'female' ? AVATAR_3D_FEMALE : AVATAR_3D_MALE;

  const renderAvatarGrid = (ids: string[], required?: 'pro' | 'partner') => {
    const unlocked = !required || (required === 'partner' ? isPartner : hasProPlan);
    return (
      <div className="grid grid-cols-4 gap-3 mt-3">
        {ids.map((avId) => {
          const selected = !photo && avatarId === avId;
          return (
            <div key={avId} className="relative">
              <button
                onClick={() => (required ? handleTierSelect(avId, required) : handlePresetSelect(avId))}
                className={`aspect-square w-full rounded-[1.4rem] overflow-hidden border-[3px] transition-all p-0 ${
                  selected
                    ? 'border-emerald-400 scale-[1.06] shadow-[0_10px_30px_rgba(16,185,129,0.35)]'
                    : 'border-white/[0.07] hover:scale-[1.04] shadow-sm'
                }`}
              >
                <span className={`block w-full h-full ${unlocked ? '' : 'opacity-40 grayscale-[35%]'}`}>
                  <DynamicAvatar avatarId={avId} fallbackText={name} className="w-full h-full" />
                </span>
              </button>
              {selected && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" />
                </span>
              )}
              {required && (
                <span className={`absolute -top-1.5 -left-1.5 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full shadow ${required === 'pro' ? 'bg-amber-400 text-amber-950' : 'bg-teal-400 text-teal-950'}`}>
                  {required === 'pro' ? 'PRO' : 'Partner'}
                </span>
              )}
              {required && !unlocked && (
                <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-900 border border-white/25 flex items-center justify-center shadow">
                  <Lock className="w-3 h-3 text-white" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const fieldCls = 'w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400/60 transition-all';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-32 px-4 pt-4 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-[#15181D] rounded-full shadow-sm border border-white/[0.07] hover:bg-white/5 active:scale-95 transition">
          <ArrowLeft className="w-5 h-5 text-zinc-200" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight leading-none">Edit Profile</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Photo • Avatar • Details</p>
        </div>
      </div>

      {/* Identity hero */}
      <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.14] via-[#0d1512] to-[#0B0D10] p-6 mb-5">
        <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <div className="rounded-full bg-gradient-to-br from-emerald-300 via-emerald-500 to-teal-600 p-[3px] shadow-[0_0_35px_rgba(16,185,129,0.35)] mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0B0D10] border-4 border-[#0B0D10]">
              <DynamicAvatar avatarId={avatarId} photo={photo} fallbackText={name} className="w-full h-full" />
            </div>
          </div>
          <p className="text-base font-black text-white tracking-tight">{name || 'Your Name'}</p>
          <p className="text-[11px] font-bold text-zinc-400 mt-0.5">{email}</p>
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-500 text-emerald-950 text-xs font-black shadow-[0_8px_24px_rgba(16,185,129,0.4)] hover:bg-emerald-400 transition-all active:scale-95"
            >
              <ImagePlus className="w-4 h-4" /> Upload Photo
            </button>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto('')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/15 text-zinc-200 text-xs font-black hover:bg-white/10 transition-all active:scale-95"
              >
                <X className="w-4 h-4" /> Remove
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>
          <p className="text-[10px] font-bold text-zinc-500 mt-3">Your photo wins over avatars everywhere in the app.</p>
        </div>
      </div>

      {/* Avatar picker */}
      <div className="bg-[#15181D] rounded-[2rem] p-5 shadow-sm border border-white/[0.06] mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-[11px] font-black text-zinc-200 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Choose Your Look
          </h3>
          <div className="flex bg-white/[0.06] rounded-full p-1">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGender(g);
                  const set = g === 'female' ? AVATAR_3D_FEMALE : AVATAR_3D_MALE;
                  if (!set.includes(avatarId)) setAvatarId(set[0]);
                }}
                className={`px-4 py-1.5 text-[11px] font-black rounded-full capitalize transition-all ${gender === g ? 'bg-emerald-500 text-emerald-950 shadow' : 'text-zinc-400'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-5">Free 3D Avatars</p>
        {renderAvatarGrid(freeAvatars)}

        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-6 flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-400" /> PRO Avatars
        </p>
        {renderAvatarGrid(AVATAR_PRO_IDS, 'pro')}

        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-6 flex items-center gap-1.5">
          <Handshake className="w-3.5 h-3.5 text-teal-400" /> Partner Avatars
        </p>
        {renderAvatarGrid(AVATAR_PARTNER_IDS, 'partner')}
      </div>

      {/* Details */}
      <div className="bg-[#15181D] rounded-[2rem] p-5 shadow-sm border border-white/[0.06] mb-5 space-y-4">
        <h3 className="text-[11px] font-black text-zinc-200 uppercase tracking-widest">Your Details</h3>
        <div className="relative">
          <User className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={fieldCls} />
        </div>
        <div className="relative">
          <Mail className="w-4 h-4 text-zinc-600 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="email" value={email} readOnly className={`${fieldCls} opacity-60 cursor-not-allowed`} />
        </div>
        <div className="relative">
          <Phone className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className={fieldCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Globe className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input list="countries" type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} className={fieldCls} />
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
          <div className="relative">
            <MapPin className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className={fieldCls} />
          </div>
        </div>
      </div>

      {saveState === 'error' && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-px" />
          <p className="text-[12px] font-bold text-rose-200">Your changes could not be saved. Check your connection and tap Save Changes again.</p>
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saveState === 'saving' || saveState === 'saved'}
        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm tracking-wide transition-all active:scale-[0.99] ${
          saveState === 'saved'
            ? 'bg-emerald-500 text-emerald-950'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_12px_35px_rgba(16,185,129,0.35)] hover:from-emerald-400 hover:to-teal-400'
        } disabled:opacity-70`}
      >
        {saveState === 'saved' ? (
          <><CheckCircle2 className="w-5 h-5" /> Saved Successfully</>
        ) : saveState === 'saving' ? (
          <><Save className="w-5 h-5 animate-pulse" /> Saving...</>
        ) : (
          <><Save className="w-5 h-5" /> Save Changes</>
        )}
      </button>

      {lockedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6" onClick={() => setLockedPrompt(null)}>
          <div className="w-full max-w-sm bg-[#15181D] border border-white/10 rounded-[2rem] p-6 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
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
