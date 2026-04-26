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
  { id: '1', name: 'Premium Wireless Earbuds', price: '3,500', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80', entryFee: 100, totalParticipants: 45 },
  { id: '2', name: 'Romoss SW10PF Power Bank', price: '6,999', image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=80', entryFee: 100, totalParticipants: 120 },
  { id: '3', name: 'Hi-Fi Studio Headphones', price: '12,500', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', entryFee: 100, totalParticipants: 88 },
];

interface ProductDrawViewProps {
  onBack: () => void;
  balance: number;
  userName: string;
  onUpdateBalance: (amount: number, source?: string, description?: string) => Promise<boolean>;
}

export default function ProductDrawView({ onBack, balance, userName, onUpdateBalance }: ProductDrawViewProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
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
    if (seconds < 60) return `Just now`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  useEffect(() => {
    localStorage.setItem('drawParticipants', JSON.stringify(participants));
    localStorage.setItem('drawProducts', JSON.stringify(products));
  }, [participants, products]);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleParticipate = async (product: Product) => {
    if (participatedProducts.has(product.id)) {
        alert("Aap is draw mein pehle hi shamil hain!");
        return;
    }
    
    if (balance < product.entryFee) {
      alert("Insufficient Balance! Please recharge your account to participate.");
      return;
    }

    setIsProcessing(true);
    const success = await onUpdateBalance(-product.entryFee, 'draw_entry', `Entry fee for ${product.name}`);
    
    if (success) {
      const newParticipated = new Set(participatedProducts).add(product.id);
      setParticipatedProducts(newParticipated);
      localStorage.setItem('participatedProducts', JSON.stringify(Array.from(newParticipated)));

      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, totalParticipants: p.totalParticipants + 1 } : p));
      
      const newEntry = { user: userName || 'User', item: product.name, time: new Date(), isReal: true };
      setParticipants(prev => [newEntry, ...prev]);
      
      alert(`Success! You have entered the draw for ${product.name}. Good luck!`);
    } else {
      alert("Something went wrong or balance was updated. Please try again.");
    }
    setIsProcessing(false);
  };

  // Simulate fake participants
  useEffect(() => {
    const interval = setInterval(() => {
        const dummyUsers = ['Ahmed King', 'Bilal Jutt', 'Fatima Rao', 'Zain Ali', 'Hina Malik', 'Uzair Khan', 'Sana Mir', 'Hamza 786', 'Irfan Pathan'];
        const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)];
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        
        const newFake = { user: randomUser, item: randomProduct.name, time: new Date(), isReal: false };
        setParticipants(prev => [newFake, ...prev]);
        setProducts(prev => prev.map(p => p.id === randomProduct.id ? { ...p, totalParticipants: p.totalParticipants + 1 } : p));
    }, 45000 + Math.random() * 60000);

    return () => clearInterval(interval);
  }, [products]);

  return (
    <div className="space-y-6 pb-24 font-sans max-w-lg mx-auto bg-slate-50/50 min-h-screen -m-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 bg-white sticky top-0 z-[100] py-4 -mx-4 shadow-md border-b border-slate-100 transition-all duration-300">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Lucky Draw</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <p className="text-[9px] text-violet-600 font-black uppercase tracking-[0.1em] opacity-90">Live Activity</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowInstructions(true)} 
          className="group flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-2xl active:scale-95 transition-all shadow-lg shadow-slate-200 border border-slate-800"
        >
          <span className="text-[9px] font-black uppercase tracking-widest">View Rules</span>
          <Info className="w-4 h-4 text-violet-400 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="bg-white rounded-t-[40px] sm:rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-t border-slate-100"
            >
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden" />
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-violet-100 rounded-2xl text-violet-600">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-2xl text-slate-900 tracking-tight">Draw Rules</h3>
                </div>
                <button onClick={() => setShowInstructions(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { title: "Lucky Selection", text: "Draw har 15 din baad automatically hota hai. Winner random selection se decide hota hai.", icon: <Trophy className="w-5 h-5" /> },
                  { title: "Entry Process", text: "Har participation ki aik makhsoos entry fee hoti hai jo balance se deduct ki jati hai.", icon: <ArrowLeft className="w-5 h-5 rotate-180" /> },
                  { title: "Fair Play", text: "Sirf wohi real users select honge jin ki profile verified hogi.", icon: <Users className="w-5 h-5" /> },
                  { title: "Winner Pride", text: "Jeetne wala user Hall of Fame mein show hoga aur usay gadget deliver kiya jaye ga.", icon: <Gift className="w-5 h-5" /> }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-violet-100 group">
                    <div className="mt-1 text-slate-400 group-hover:text-violet-500 transition-colors">{item.icon}</div>
                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase text-slate-900 tracking-wider font-sans">{item.title}</p>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full mt-10 bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs"
              >
                Start Winning Now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-1 space-y-8">
        {/* Banner Section */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-violet-200">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-xl" />
            
            <div className="relative z-10 space-y-4">
                <div className="inline-flex px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">Limited Time Draws</div>
                <h1 className="text-3xl font-black leading-[1.1] tracking-tighter">Win The Gadget Of Your Dreams!</h1>
                <p className="text-white/70 text-sm font-medium">Participate for just Rs. 100 and get a chance to win premium products every 15 days.</p>
            </div>
        </div>

        {/* Products List */}
        <div className="grid grid-cols-1 gap-4">
          {products.map((product: any) => {
            const originalPrice = parseInt(product.price.replace(/,/g, ''));
            const discount = Math.round(((originalPrice - product.entryFee) / originalPrice) * 100);
            
            return (
            <motion.div 
              key={product.id} 
              layout
              className="bg-white rounded-[32px] p-4 border border-slate-100 shadow-xl shadow-slate-200/30 relative overflow-hidden group active:scale-[0.98] transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50/50 rounded-full -mr-16 -mt-16 scale-0 group-hover:scale-100 transition-transform duration-500 ease-out" />
              
              <div className="flex gap-5 items-center relative z-10">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg shadow-slate-200 border-2 border-white">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-violet-600 text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute -top-1 -left-1 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg shadow-md border border-white uppercase tracking-tighter">
                    {discount}% Off
                  </div>
                </div>
                
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate flex-1">{product.name}</h3>
                    <span className="shrink-0 text-[8px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">Active</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-bold line-through">MRP {product.price}</span>
                    <span className="text-[10px] text-red-600 font-extrabold uppercase">Limited Slot</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span className="text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-100">Fee: Rs. {product.entryFee}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-300" /> {product.totalParticipants} Joined
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min((product.totalParticipants/1000)*100, 100)}%` }} 
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <button 
                        onClick={() => handleParticipate(product)}
                        disabled={participatedProducts.has(product.id) || isProcessing}
                        className={`w-full text-[9px] font-black text-white px-3 py-2.5 rounded-2xl uppercase tracking-[0.2em] shadow-lg transition-all ${
                          participatedProducts.has(product.id) 
                            ? 'bg-slate-100 text-slate-400 shadow-none border border-slate-100 cursor-not-allowed' 
                            : isProcessing
                              ? 'bg-slate-400 cursor-wait'
                              : 'bg-slate-900 text-white shadow-slate-300 hover:shadow-violet-200 active:scale-[0.97] hover:bg-black'
                        }`}
                    >
                      {isProcessing ? 'Processing...' : participatedProducts.has(product.id) ? (
                        <span className="flex items-center justify-center gap-2">
                          Joined <Trophy className="w-3 h-3 text-amber-500" />
                        </span>
                      ) : 'Join Lucky Draw'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );})}
        </div>

        {/* Live History Section */}
        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-slate-200/30 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl">Recent Activity</h3>
              <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live Feed
              </p>
            </div>
            {participants.length > 10 && (
                <button 
                    onClick={() => setShowFullHistory(!showFullHistory)}
                    className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:underline"
                >
                    {showFullHistory ? 'Show Recent' : 'View All'}
                </button>
            )}
          </div>
          
          <div className="space-y-5">
            <div className="grid grid-cols-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border-b border-slate-50 pb-4 px-2">
              <span>Winner Hopeful</span><span>Gadget Selection</span><span className="text-right">Timestamp</span>
            </div>
            <div className="space-y-4">
                {(showFullHistory ? participants : participants.slice(0, 10)).map((h, i) => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    key={i} 
                    className="grid grid-cols-3 items-center text-sm px-2 py-1"
                >
                    <span className="text-slate-900 font-extrabold pr-2 truncate">{h.user}</span>
                    <span className="text-violet-600 font-black text-[10px] uppercase tracking-tighter truncate pr-2">{h.item}</span>
                    <span className="text-slate-400 text-[10px] font-black tabular-nums text-right uppercase tracking-tighter">{getTimeAgo(h.time)}</span>
                </motion.div>
                ))}
            </div>
          </div>
        </div>

      {/* Winner Announcement Section */}
      <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 rounded-[40px] p-10 text-white shadow-2xl shadow-amber-200 relative overflow-hidden group border-4 border-white/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="p-6 bg-white/20 backdrop-blur-xl rounded-[32px] ring-2 ring-white/30 shadow-2xl">
            <Trophy className="w-12 h-12 text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)] animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-3xl uppercase tracking-tighter italic drop-shadow-md">Hall of Fame</h3>
            <p className="text-[10px] text-amber-50 font-black uppercase tracking-[0.4em] opacity-90">Season 04 Grand Finale</p>
          </div>
          
          <div className="w-full p-8 bg-black/10 rounded-[32px] border border-white/20 backdrop-blur-md space-y-4 shadow-inner">
            <p className="text-sm font-bold text-amber-50 leading-relaxed italic">"Luck favors those who take the first step!"</p>
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-80">Next Results Announcement</p>
              <p className="text-2xl font-black mt-1 tracking-tighter tabular-nums drop-shadow-sm">15 MAY</p>
            </div>
          </div>
          
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-100/60">* Only real participants are eligible for physical delivery.</p>
        </div>
      </div>
      </div>
    </div>
  );
}
