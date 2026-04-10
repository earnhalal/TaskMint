import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PlayCircle, Clock, Sparkles, Wallet } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

export default function WatchTab() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ads'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAds(adsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 px-4 pt-4"
    >
      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg shadow-red-500/30 mb-6">
        <h2 className="text-2xl font-black mb-2 tracking-tighter">Watch & Earn</h2>
        <p className="text-xs text-red-100 font-bold opacity-90">Watch ads, get instant PKR.</p>
      </div>

      {ads.length > 0 ? (
        <div className="grid gap-4">
          {ads.map((ad) => (
            <motion.div
              key={ad.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{ad.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Clock className="w-3 h-3" /> {ad.duration}s
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      <Wallet className="w-3 h-3" /> Rs {ad.reward}
                    </span>
                  </div>
                </div>
              </div>
              <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all">
                Watch Now
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center flex flex-col items-center justify-center min-h-[300px]"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 relative"
          >
            <PlayCircle className="w-10 h-10 text-red-500" />
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-amber-400" />
            </motion.div>
          </motion.div>
          <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Coming Soon!</h3>
          <p className="text-sm text-slate-500 max-w-[250px] mx-auto">
            We are currently partnering with top brands to bring you the best video ads. Stay tuned!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
