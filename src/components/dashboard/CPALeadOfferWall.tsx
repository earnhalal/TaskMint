import React from 'react';
import { useAuth } from '../../context/AuthContext';

const CPALeadOfferWall = () => {
  const { user } = useAuth();
  const userUID = user?.uid;

  // Formatting URL back to original base which was working
  const offerWallUrl = userUID
    ? `https://viral782.com/list/ry8QIz7?subid=${userUID}`
    : 'https://viral782.com/list/ry8QIz7';

  return (
    <div className="space-y-4 animate-fade-in pb-24 font-sans">
      <div className="px-4">
        <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-2">Offer Wall</h2>
        <p className="text-xs font-bold text-slate-500 mb-6">Complete tasks to earn rewards.</p>
      </div>
      <div className="w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        <iframe 
          sandbox="allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox" 
          src={offerWallUrl} 
          style={{ width: '100%', height: '690px', border: 'none' }} 
          title="Offer Wall"
        />
      </div>
    </div>
  );
};

export default CPALeadOfferWall;
