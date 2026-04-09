import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Loader';

export default function TaskWall() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // CPX Research App ID
  const appId = "32325";
  const userId = user?.uid || "";
  
  // CPX Research URL - Updated to offers.cpx-research.com with ext_user_id
  const cpxUrl = `https://offers.cpx-research.com/index.php?app_id=${appId}&ext_user_id=${userId}`;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full w-full relative pb-20">
      {isLoading && <Loader />}
      <div className="p-4">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white mb-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
            Task Wall <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Surveys</span>
          </h2>
          <p className="text-xs text-indigo-100 font-medium leading-relaxed max-w-[280px]">
            Complete surveys and earn real cash. 
            <span className="block mt-2 font-black text-white text-sm">Conversion: $1 = Rs. 150</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative">
          <iframe
            src={cpxUrl}
            className="w-full h-[800px] border-none"
            title="Task Wall"
            onLoad={() => setIsLoading(false)}
          />
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Instructions</p>
          <ul className="text-[11px] text-slate-600 space-y-2 font-medium">
            <li className="flex gap-2">
              <span className="text-indigo-600 font-black">•</span>
              Answer all questions honestly to avoid disqualification.
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-black">•</span>
              Earnings will be added to your wallet within 5-10 minutes of completion.
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-black">•</span>
              If a survey fails, don't worry! New ones appear every hour.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
