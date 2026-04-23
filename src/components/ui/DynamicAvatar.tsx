import React from 'react';

export type AvatarId = 
  | 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8' | 'm9' | 'm10'
  | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8' | 'f9' | 'f10';

interface DynamicAvatarProps {
  avatarId?: string | null; // e.g. "m1"
  className?: string;
  fallbackText?: string;
}

export const maleAvatarIds = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10'];
export const femaleAvatarIds = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10'];

const AvatarSvgs: Record<string, React.FC<{className?: string}>> = {
  m1: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#4F46E5"/>
      <circle cx="50" cy="45" r="20" fill="#FDE68A"/>
      <path d="M30 100C30 70 70 70 70 100" fill="#FDE68A"/>
      <path d="M45 40a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm10 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#000"/>
      <path d="M45 50q5 5 10 0" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M30 40Q50 20 70 40" fill="#1E1B4B"/>
    </svg>
  ),
  m2: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#10B981"/>
      <circle cx="50" cy="50" r="18" fill="#FFEDD5"/>
      <path d="M25 100C25 75 75 75 75 100" fill="#FFEDD5"/>
      <rect x="42" y="45" width="4" height="4" rx="2" fill="#000"/>
      <rect x="54" y="45" width="4" height="4" rx="2" fill="#000"/>
      <path d="M46 55h8" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 45C32 25 68 25 68 45" fill="#451A03"/>
    </svg>
  ),
  m3: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#F59E0B"/>
      <ellipse cx="50" cy="45" rx="16" ry="20" fill="#FECDD3"/>
      <path d="M34 100C34 70 66 70 66 100" fill="#FECDD3"/>
      <path d="M44 42h12M44 42v4m12-4v4" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="44" cy="44" r="1.5" fill="#000"/>
      <circle cx="56" cy="44" r="1.5" fill="#000"/>
      <path d="M47 52h6" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  m4: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#3B82F6"/>
      <circle cx="50" cy="40" r="15" fill="#FFE4E6"/>
      <path d="M20 100C20 65 80 65 80 100" fill="#FFE4E6"/>
      <circle cx="46" cy="38" r="1.5" fill="#000"/>
      <circle cx="54" cy="38" r="1.5" fill="#000"/>
      <path d="M47 44q3 3 6 0" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M35 35l15-15 15 15" stroke="#1E3A8A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  m5: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#8B5CF6"/>
      <circle cx="50" cy="45" r="19" fill="#FEF3C7"/>
      <path d="M30 100C30 75 70 75 70 100" fill="#FEF3C7"/>
      <circle cx="45" cy="42" r="2" fill="#000"/>
      <circle cx="55" cy="42" r="2" fill="#000"/>
      <path d="M46 50h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M31 45c0-20 38-20 38 0-10-10-28-10-38 0z" fill="#92400E"/>
    </svg>
  ),
  m6: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#EC4899"/>
      <circle cx="50" cy="50" r="18" fill="#FFFBEB"/>
      <path d="M25 100C25 70 75 70 75 100" fill="#FFFBEB"/>
      <path d="M45 47q5 5 10 0" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M42 42l4 2M58 42l-4 2" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 50v-10h36v10" stroke="#064E3B" strokeWidth="4"/>
    </svg>
  ),
  m7: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#14B8A6"/>
      <rect x="35" y="30" width="30" height="30" rx="10" fill="#FFEDD5"/>
      <path d="M30 100C30 75 70 75 70 100" fill="#FFEDD5"/>
      <circle cx="44" cy="42" r="2" fill="#000"/>
      <circle cx="56" cy="42" r="2" fill="#000"/>
      <path d="M47 50h6" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M35 30l15-10 15 10" fill="#0F172A"/>
    </svg>
  ),
  m8: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#F43F5E"/>
      <ellipse cx="50" cy="48" rx="17" ry="22" fill="#FFE4E6"/>
      <path d="M28 100C28 75 72 75 72 100" fill="#FFE4E6"/>
      <circle cx="45" cy="43" r="2" fill="#000"/>
      <circle cx="55" cy="43" r="2" fill="#000"/>
      <path d="M45 54h10" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M33 48c0-30 34-30 34 0" fill="none" stroke="#78350F" strokeWidth="4"/>
    </svg>
  ),
  m9: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#64748B"/>
      <circle cx="50" cy="40" r="18" fill="#FDE68A"/>
      <path d="M22 100C22 70 78 70 78 100" fill="#FDE68A"/>
      <path d="M44 38h12" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <rect x="42" y="32" width="16" height="4" fill="#000"/>
      <path d="M46 45q4 4 8 0" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  m10: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#0EA5E9"/>
      <circle cx="50" cy="45" r="16" fill="#FEF3C7"/>
      <path d="M30 100C30 70 70 70 70 100" fill="#FEF3C7"/>
      <circle cx="46" cy="42" r="1.5" fill="#000"/>
      <circle cx="54" cy="42" r="1.5" fill="#000"/>
      <path d="M46 49h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M34 45Q50 10 66 45" fill="#172554"/>
    </svg>
  ),
  f1: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#F472B6"/>
      <circle cx="50" cy="45" r="18" fill="#FFEDD5"/>
      <path d="M25 100C25 70 75 70 75 100" fill="#FFEDD5"/>
      <path d="M32 45c0-20 36-20 36 0v15c0 5-5 5-5 5H37s-5 0-5-5V45z" fill="#4A044E"/>
      <circle cx="50" cy="45" r="18" fill="#FFEDD5"/>
      <circle cx="45" cy="43" r="2" fill="#000"/>
      <circle cx="55" cy="43" r="2" fill="#000"/>
      <path d="M46 51q4 4 8 0" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 45q18-20 36 0" fill="#4A044E"/>
    </svg>
  ),
  f2: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#A78BFA"/>
      <ellipse cx="50" cy="45" rx="16" ry="20" fill="#FDE68A"/>
      <path d="M28 100C28 70 72 70 72 100" fill="#FDE68A"/>
      <path d="M34 25a16 16 0 0 1 32 0" fill="#581C87"/>
      <path d="M34 25q16 15 32 0" fill="#581C87"/>
      <circle cx="45" cy="42" r="1.5" fill="#000"/>
      <circle cx="55" cy="42" r="1.5" fill="#000"/>
      <path d="M46 51h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  f3: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#34D399"/>
      <path d="M30 65c0-20 40-20 40 0v20c0 10-40 10-40 0V65z" fill="#1E293B"/>
      <circle cx="50" cy="45" r="18" fill="#FFE4E6"/>
      <path d="M26 100C26 75 74 75 74 100" fill="#FFE4E6"/>
      <circle cx="44" cy="44" r="2" fill="#000"/>
      <circle cx="56" cy="44" r="2" fill="#000"/>
      <path d="M46 52q4 4 8 0" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 40q18-10 36 0" stroke="#1E293B" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  ),
  f4: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#FBBF24"/>
      <circle cx="50" cy="45" r="17" fill="#FFFBEB"/>
      <path d="M30 100C30 70 70 70 70 100" fill="#FFFBEB"/>
      <circle cx="45" cy="43" r="1.5" fill="#000"/>
      <circle cx="55" cy="43" r="1.5" fill="#000"/>
      <path d="M46 51h8" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M40 25a10 10 0 1 1 20 0" fill="#B45309"/>
      <path d="M33 45c0-15 34-15 34 0" fill="#B45309"/>
    </svg>
  ),
  f5: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#60A5FA"/>
      <circle cx="50" cy="45" r="19" fill="#FFEDD5"/>
      <path d="M24 100C24 75 76 75 76 100" fill="#FFEDD5"/>
      <path d="M31 45c0-25 38-25 38 0-10-8-28-8-38 0z" fill="#020617"/>
      <path d="M31 45v15c0 5-5 5-5 5s-2-10 2-20h4zM69 45v15c0 5 5 5 5 5s2-10-2-20h-4z" fill="#020617"/>
      <circle cx="45" cy="45" r="2" fill="#000"/>
      <circle cx="55" cy="45" r="2" fill="#000"/>
      <path d="M47 52h6" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  f6: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#FB7185"/>
      <circle cx="50" cy="42" r="16" fill="#FDE68A"/>
      <path d="M28 100C28 72 72 72 72 100" fill="#FDE68A"/>
      <path d="M44 40h12" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M47 48q3 4 6 0" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="34" cy="42" r="8" fill="#4C1D95"/>
      <circle cx="66" cy="42" r="8" fill="#4C1D95"/>
    </svg>
  ),
  f7: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#A3E635"/>
      <rect x="34" y="30" width="32" height="32" rx="12" fill="#FEF3C7"/>
      <path d="M30 100C30 75 70 75 70 100" fill="#FEF3C7"/>
      <circle cx="44" cy="43" r="2" fill="#000"/>
      <circle cx="56" cy="43" r="2" fill="#000"/>
      <path d="M47 50h6" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M34 40c0-10 32-10 32 0" stroke="#9A3412" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  ),
  f8: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#2DD4BF"/>
      <circle cx="50" cy="50" r="18" fill="#FFE4E6"/>
      <path d="M25 100C25 70 75 70 75 100" fill="#FFE4E6"/>
      <path d="M36 40l6 2M64 40l-6 2" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M45 46q5 4 10 0" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="50" cy="32" r="10" fill="#172554"/>
      <path d="M32 50c0-20 36-20 36 0" fill="#172554"/>
      <circle cx="50" cy="50" r="18" fill="#FFE4E6"/>
      <path d="M36 44h4M60 44h4" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M46 52h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M32 40q18-10 36 0" stroke="#172554" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  ),
  f9: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#818CF8"/>
      <ellipse cx="50" cy="46" rx="17" ry="20" fill="#FFFBEB"/>
      <path d="M26 100C26 72 74 72 74 100" fill="#FFFBEB"/>
      <circle cx="44" cy="44" r="2" fill="#000"/>
      <circle cx="56" cy="44" r="2" fill="#000"/>
      <path d="M46 53q4 4 8 0" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      <path d="M33 46v15M67 46v15" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round"/>
      <path d="M33 46c0-20 34-20 34 0" fill="#7C2D12"/>
    </svg>
  ),
  f10: (props) => (
    <svg viewBox="0 0 100 100" className={props.className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#C084FC"/>
      <circle cx="50" cy="45" r="18" fill="#FEF3C7"/>
      <path d="M28 100C28 75 72 75 72 100" fill="#FEF3C7"/>
      <circle cx="45" cy="43" r="1.5" fill="#000"/>
      <circle cx="55" cy="43" r="1.5" fill="#000"/>
      <path d="M46 50h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M32 45q10 10 36 0" stroke="#0F172A" strokeWidth="5" strokeLinecap="round"/>
      <path d="M32 45c0-25 36-25 36 0" fill="#0F172A"/>
      <circle cx="28" cy="45" r="6" fill="#0F172A"/>
      <circle cx="72" cy="45" r="6" fill="#0F172A"/>
    </svg>
  )
};

export const DynamicAvatar: React.FC<DynamicAvatarProps> = ({ avatarId, className = "", fallbackText }) => {
  const AvatarIcon = avatarId ? AvatarSvgs[avatarId] : null;

  if (AvatarIcon) {
    return <AvatarIcon className={`w-full h-full ${className}`} />;
  }

  // Fallback
  return (
    <div className={`w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-black rounded-full ${className}`}>
      {fallbackText ? fallbackText.charAt(0).toUpperCase() : '?'}
    </div>
  );
};
