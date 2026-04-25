import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Gift, Info, X, Users, Trophy } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  entryFee: number;
  totalParticipants: number;
}

const PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Earbuds', price: '3,500', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80', entryFee: 100, totalParticipants: 45 },
  { id: '2', name: 'Romoss SW10PF Power Bank', price: '6,999', image: 'https://images.unsplash.com/photo-1609592813106-c79d6882269a?w=300&q=80', entryFee: 100, totalParticipants: 120 },
  { id: '3', name: 'Headphones', price: '3,500', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80', entryFee: 100, totalParticipants: 88 },
];

interface ProductDrawViewProps {
  onBack: () => void;
  balance: number;
  userName: string;
  onUpdateBalance: (amount: number, source?: string, description?: string) => void;
}

export default function ProductDrawView({ onBack, balance, userName, onUpdateBalance }: ProductDrawViewProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('drawProducts');
    return saved ? JSON.parse(saved) : PRODUCTS;
  });
  const [participants, setParticipants] = useState<any[]>(() => {
    const saved = localStorage.getItem('drawParticipants');
    return saved ? JSON.parse(saved).map((p: any) => ({ ...p, time: new Date(p.time) })) : [];
  });
  const [participatedProducts, setParticipatedProducts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('participatedProducts');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const getTimeAgo = (time: Date) => {
    const seconds = Math.floor((new Date().getTime() - time.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  useEffect(() => {
    localStorage.setItem('drawParticipants', JSON.stringify(participants));
    localStorage.setItem('drawProducts', JSON.stringify(products));
  }, [participants, products]);

  const handleParticipate = (product: Product) => {
    if (participatedProducts.has(product.id)) {
        alert("Aap pehle hi participate kar chuke hain.");
        return;
    }
    
    if (balance < product.entryFee) {
      alert("Aapke paas balance kam hai. Pehle deposit karein.");
      return;
    }

    onUpdateBalance(-product.entryFee, 'draw_entry', `Entry fee for ${product.name}`);
    
    const newParticipated = new Set(participatedProducts).add(product.id);
    setParticipatedProducts(newParticipated);
    localStorage.setItem('participatedProducts', JSON.stringify(Array.from(newParticipated)));

    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, totalParticipants: p.totalParticipants + 1 } : p));
    
    const newEntry = { user: userName || 'User', item: product.name, time: new Date(), isReal: true };
    const newParticipants = [newEntry, ...participants].slice(0, 10);
    setParticipants(newParticipants);
    
    alert(`Successfully participated in ${product.name} draw!`);
  };

  // Simulate fake participants
  React.useEffect(() => {
    const interval = setInterval(() => {
        const dummyUsers = ['Ahmed', 'Bilal', 'Fatima', 'Zain', 'Hina', 'Uzair'];
        const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)];
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        
        const newFake = { user: randomUser, item: randomProduct.name, time: new Date(), isReal: false };
        setParticipants(prev => [newFake, ...prev.slice(0, 9)]);
        setProducts(prev => prev.map(p => p.id === randomProduct.id ? { ...p, totalParticipants: p.totalParticipants + 1 } : p));
    }, 45000 + Math.random() * 45000); // 45-90 secs

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-24 font-sans max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-1 bg-white/50 backdrop-blur-md sticky top-0 z-10 py-2 -mx-2 px-3 rounded-b-2xl shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Product Draws</h2>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-0.5">Win Premium Gadgets</p>
          </div>
        </div>
        <button 
          onClick={() => setShowInstructions(true)} 
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 active:scale-95 transition-transform"
        >
          <span className="text-[10px] font-black uppercase tracking-tight">Instructions</span>
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="bg-white rounded-t-[32px] sm:rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                    <Info className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-xl text-slate-900">How to Win</h3>
                </div>
                <button onClick={() => setShowInstructions(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { text: "Draw har 15 din baad automatically hota hai.", icon: <Gift className="w-4 h-4" /> },
                  { text: "Participate karne ke liye entry fee balance se deduct hogi.", icon: <Trophy className="w-4 h-4" /> },
                  { text: "Aap multiple products mein participate kar sakte hain.", icon: <Users className="w-4 h-4" /> },
                  { text: "Winners ka announcement result section mein hoga.", icon: <Trophy className="w-4 h-4" /> },
                  { text: "Sarf Real users hi draw mein select kiye jayenge.", icon: <Users className="w-4 h-4" /> }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="mt-0.5 text-indigo-500">{item.icon}</div>
                    <p className="text-sm text-slate-600 font-medium leading-tight">{item.text}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full mt-8 bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform uppercase tracking-widest text-xs"
              >
                Got It, Thanks!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products List */}
      <div className="grid grid-cols-1 gap-5">
        {products.map((product) => (
          <motion.div 
            key={product.id} 
            layout
            className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="flex gap-5 items-center relative z-10">
              <div className="relative">
                <img src={product.image} alt={product.name} className="w-24 h-24 rounded-3xl object-cover shadow-lg" />
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-xl shadow-lg">
                  <Gift className="w-4 h-4" />
                </div>
              </div>
              
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-black text-slate-900 uppercase leading-tight line-clamp-1">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold line-through">MRP {product.price}</span>
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-lg font-black uppercase">98% OFF</span>
                </div>
                
                <div className="flex flex-col gap-2 mt-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                    <span className="text-indigo-600">Entry: Rs. {product.entryFee}</span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-400" /> {product.totalParticipants} Joined
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min((product.totalParticipants/1000)*100, 100)}%` }} 
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
                onClick={() => handleParticipate(product)}
                disabled={participatedProducts.has(product.id)}
                className={`w-full mt-6 text-[11px] font-black text-white px-4 py-4 rounded-[20px] uppercase tracking-[0.2em] shadow-xl transition-all ${
                  participatedProducts.has(product.id) 
                    ? 'bg-slate-100 text-slate-400 shadow-none' 
                    : 'bg-slate-900 text-white shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.98]'
                }`}
            >
              {participatedProducts.has(product.id) ? (
                <span className="flex items-center justify-center gap-2">
                  Already In <Users className="w-4 h-4" />
                </span>
              ) : 'Join Luxury Draw'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* History Sections */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Live Activity</h3>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-green-500 uppercase">Live</span>
          </span>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">
            <span>Participant</span><span>Gift Item</span><span className="text-right">Activity</span>
          </div>
          {participants.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-xs italic">Waiting for activity...</div>
          ) : (
            participants.map((h, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                key={i} 
                className="grid grid-cols-3 items-center text-sm"
              >
                  <span className="text-slate-900 font-bold truncate pr-2">{h.user}</span>
                  <span className="text-indigo-600 font-black text-[11px] uppercase tracking-tight truncate pr-2">{h.item}</span>
                  <span className="text-slate-400 text-[10px] font-bold text-right tabular-nums">{getTimeAgo(h.time)}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Winner Section */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-[32px] p-8 text-white shadow-xl shadow-amber-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-3xl">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="font-black text-xl uppercase tracking-tighter">Hall of Fame</h3>
            <p className="text-[11px] text-amber-100 font-bold uppercase tracking-widest mt-1">Recent Lucky Winners</p>
          </div>
          
          <div className="w-full py-8 bg-black/10 rounded-3xl border border-white/10 backdrop-blur-sm">
            <p className="text-sm font-medium text-amber-50">Luck favor the bold!</p>
            <p className="text-[10px] text-amber-200 uppercase mt-2">Next results in 12 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
