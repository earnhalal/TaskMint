import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Menu as MenuIcon, 
    X as CloseIcon, 
    Wallet as WalletIcon, 
    CheckCircle2 as CheckCircleIcon, 
    Landmark as BankIcon, 
    Sparkles as SparklesIcon, 
    Users as UserGroupIcon, 
    Trophy as TrophyIcon, 
    ArrowRight, 
    ShieldCheck,
    Briefcase as BriefcaseIcon, 
    Diamond as DiamondIcon,
    PlayCircle as PlayCircleIcon,
    Ticket as TicketIcon,
    Gift as GiftIcon,
    Activity as ActivityIcon,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, rtdb } from '../firebase';
import { ref } from 'firebase/database';
import { InfoModal, renderModalContent } from '../components/LandingInfoViews';

export default function Landing() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isNotificationAnimating, setIsNotificationAnimating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'TaskMint - Earn Money Online in Pakistan | Premium Earning Platform';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', "TaskMint is Pakistan's leading premium earning platform. Complete simple tasks, watch videos, participate in surveys, and earn real money. Withdraw via JazzCash, EasyPaisa, and Bank Transfer.");
    }
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Real-time winners listener
    const winnersRef = ref(rtdb, 'spin_winners');
    let realWinnerFound = false;

    const unsubscribe = onSnapshot(query(collection(db, 'spin_winners'), orderBy('timestamp', 'desc'), limit(1)), (snapshot) => {
      if (!snapshot.empty) {
        realWinnerFound = true;
        const latest = snapshot.docs[0].data();
        setIsNotificationAnimating(false);
        setTimeout(() => {
          setNotificationMessage(`${latest.userName} just won <span class="font-bold">${latest.prize}</span> from Spin & Win!`);
          setIsNotificationAnimating(true);
        }, 500);
      }
    });

    // Fallback interval for fake activity
    const names = ['Ahmed', 'Fatima', 'Ali', 'Ayesha', 'Zainab', 'Bilal', 'Hassan', 'Sana', 'Usman', 'Maryam', 'Abdullah', 'Khadija'];
    const amounts = [1000, 2500, 5000, 7500, 10000, 12500, 20000];
    const spinPrizes = ['Rs. 500', 'Rs. 1000', 'Rs. 5000', 'Free Spin', 'Rs. 100'];
    const methods = ['EasyPaisa', 'JazzCash', 'Bank Transfer'];

    const fallbackInterval = setInterval(() => {
      const showFake = !realWinnerFound || Math.random() > 0.7;
      if (showFake) {
        setIsNotificationAnimating(false);
        setTimeout(() => {
          const randomName = names[Math.floor(Math.random() * names.length)];
          const isWithdraw = Math.random() > 0.5;
          
          if (isWithdraw) {
            const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
            const randomMethod = methods[Math.floor(Math.random() * methods.length)];
            setNotificationMessage(`${randomName} just withdrew <span class="font-bold">Rs ${randomAmount}</span> via ${randomMethod}!`);
          } else {
            const randomPrize = spinPrizes[Math.floor(Math.random() * spinPrizes.length)];
            setNotificationMessage(`${randomName} just won <span class="font-bold">${randomPrize}</span> from Spin & Win!`);
          }
          setIsNotificationAnimating(true);
        }, 500);
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, []);

  const onGetStarted = (view: 'login' | 'signup') => {
    navigate(`/${view}`);
  };

  const getModalTitle = (key: string) => {
      const titles: Record<string, string> = {
          'how-it-works': 'How It Works',
          'about': 'About TaskMint',
          'support': 'Support Center',
          'privacy': 'Privacy Policy',
          'terms': 'Terms of Service',
          'withdrawal': 'Withdrawal Policy',
          'deposit': 'Deposit Instructions',
          'refund': 'Refund Policy',
          'disclaimer': 'Disclaimer',
          'blog': 'TaskMint Blog'
      };
      return titles[key] || 'Information';
  };

  return (
    <>
      <style>{`
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 30px rgba(245,158,11,0.1); }
            50% { box-shadow: 0 0 60px rgba(245,158,11,0.3); }
        }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {activeModal && (
          <InfoModal 
            title={getModalTitle(activeModal)} 
            onClose={() => setActiveModal(null)}
          >
              {renderModalContent(activeModal)}
          </InfoModal>
      )}

      <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
        
        {/* --- Header --- */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 via-purple-600 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 transition-all group-hover:scale-110 group-hover:rotate-6">
                <SparklesIcon className="w-6 h-6 animate-pulse" />
              </div>
              <span className="font-black text-2xl tracking-tighter italic">
                <span className="text-white">Task</span>
                <span className="text-amber-500">Mint</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-white/50">
              <button onClick={() => setActiveModal('how-it-works')} className="hover:text-amber-500 transition-colors">Protocol</button>
              <button onClick={() => navigate('/blog')} className="hover:text-amber-500 transition-colors">Knowledge</button>
              <button onClick={() => navigate('/terms')} className="hover:text-amber-500 transition-colors">Governance</button>
              <button onClick={() => navigate('/contact')} className="hover:text-amber-500 transition-colors">Terminal</button>
            </nav>

            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => onGetStarted('login')} className="text-white/60 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">Access</button>
              <button onClick={() => onGetStarted('signup')} className="bg-white text-black px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-white/10 hover:bg-amber-500 hover:text-white transition-all active:scale-95">
                Join Network
              </button>
            </div>

            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-white p-2">
                {mobileMenu ? <CloseIcon className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
            </button>
          </div>
        </header>

        {/* --- Mobile Menu --- */}
        <div className={`fixed inset-0 bg-[#0A0A0B] z-40 pt-28 px-8 transition-all duration-500 flex flex-col ${mobileMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
            <div className="flex flex-col space-y-8 text-2xl font-black italic tracking-tighter uppercase">
                <button onClick={() => { setActiveModal('how-it-works'); setMobileMenu(false); }} className="text-left border-b border-white/5 pb-4">How it Works</button>
                <button onClick={() => { navigate('/blog'); setMobileMenu(false); }} className="text-left border-b border-white/5 pb-4">Guides</button>
                <button onClick={() => { navigate('/privacy'); setMobileMenu(false); }} className="text-left border-b border-white/5 pb-4">Privacy</button>
                <button onClick={() => { navigate('/contact'); setMobileMenu(false); }} className="text-left border-b border-white/5 pb-4">Support</button>
                <div className="grid grid-cols-2 gap-4 pt-10">
                    <button onClick={() => { onGetStarted('login'); setMobileMenu(false); }} className="bg-white/5 border border-white/10 py-5 rounded-2xl text-base text-white">Log In</button>
                    <button onClick={() => { onGetStarted('signup'); setMobileMenu(false); }} className="bg-amber-500 py-5 rounded-2xl text-base text-black shadow-xl shadow-amber-500/20">Sign Up</button>
                </div>
            </div>
        </div>

        <main>
            {/* --- Hero Section --- */}
            <section className="relative pt-44 pb-24 md:pt-60 md:pb-40 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col items-center text-center">
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-white/5 border border-white/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12 shadow-2xl"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            Quantum Earning Protocol v4.0
                        </motion.div>
                        
                        <h1 className="text-5xl md:text-8xl font-black mb-8 leading-none tracking-tighter italic uppercase">
                            MONETIZE YOUR <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">FREE TIME.</span>
                        </h1>
                        
                        <p className="text-white/40 text-lg md:text-xl mb-14 max-w-2xl font-medium leading-relaxed tracking-tight">
                            TaskMint is the ultimate marketplace for premium digital labor. Join our decentralized network of 50k+ earners and access high-yield tasks from global research partners.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onGetStarted('signup')} 
                              className="bg-white text-black px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-4 group shadow-2xl shadow-white/5 hover:bg-amber-500 hover:text-white transition-all"
                            >
                                Get Started Now 
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                            </motion.button>
                            
                            <motion.button 
                              whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                              onClick={() => setActiveModal('how-it-works')} 
                              className="px-10 py-5 rounded-2xl border border-white/10 font-black text-xs uppercase tracking-widest text-white/50 hover:text-white transition-all"
                            >
                                How It Works
                            </motion.button>
                        </div>

                        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
                            {[
                                { label: 'Active Users', val: '50K+', color: 'text-amber-500' },
                                { label: 'Total Payouts', val: 'Rs. 2.5M+', color: 'text-indigo-500' },
                                { label: 'Min. Payout', val: 'Rs. 100', color: 'text-emerald-500' },
                                { label: 'Uptime', val: '99.9%', color: 'text-blue-500' }
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <span className={`text-3xl font-black italic tracking-tighter ${stat.color}`}>{stat.val}</span>
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-2">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Partners Section --- */}
            <section className="py-16 bg-[#0A0A0B] border-y border-white/5 relative z-10">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 hover:opacity-80 transition-all duration-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white font-black text-[10px] border border-white/10 shadow-xl">CPX</div>
                    <span className="text-xl font-black tracking-tighter uppercase italic">CPX Research</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-[10px] shadow-xl shadow-indigo-500/20">CPA</div>
                    <span className="text-xl font-black tracking-tighter uppercase italic text-indigo-400">CPA LEAD</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white font-black text-[10px] border border-white/10">WND</div>
                    <span className="text-xl font-black tracking-tighter uppercase italic">Wannads</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white font-black">
                      <PlayCircleIcon className="w-7 h-7 text-amber-500" />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase italic">Unity Ads</span>
                  </div>
                </div>
              </div>
            </section>

            {/* --- Features Grid --- */}
            <section className="py-32 px-6 relative">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
                  <div className="max-w-2xl">
                    <h2 className="text-amber-500 font-black tracking-[0.3em] uppercase text-[10px] mb-4">Marketplace Capabilities</h2>
                    <h3 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase">Engineered for <br /> High Performance.</h3>
                  </div>
                  <p className="text-white/40 max-w-md font-medium text-lg leading-relaxed">
                    Access our multi-channel earning infrastructure powered by global advertising nodes.
                  </p>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  {/* CPA LEAD Feature */}
                  <div className="bg-[#0A0A0B] border border-white/5 p-10 rounded-[32px] md:col-span-2 group hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-indigo-500/10 transition-all"></div>
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-8 shadow-inner border border-indigo-500/20">
                      <Zap className="w-8 h-8" />
                    </div>
                    <h4 className="text-2xl font-black mb-4 italic uppercase tracking-tight">CPA LEAD NETWORK</h4>
                    <p className="text-white/40 leading-relaxed font-medium">
                      Monetize your traffic with the world's most advanced CPA network. High-payout offers and global task availability through our primary node integration.
                    </p>
                  </div>

                  <div className="bg-[#0A0A0B] border border-white/5 p-10 rounded-[32px] group hover:border-amber-500/30 transition-all duration-500">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-8 border border-amber-500/20">
                      <BriefcaseIcon className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-black mb-4 italic uppercase">Research</h4>
                    <p className="text-white/40 text-sm leading-relaxed font-medium">
                      Verified market research from <b>CPX</b>. Share data and earn premium rewards.
                    </p>
                  </div>

                  <div className="bg-[#0A0A0B] border border-white/5 p-10 rounded-[32px] group hover:border-blue-500/30 transition-all duration-500">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 border border-blue-500/20">
                      <PlayCircleIcon className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-black mb-4 italic uppercase">Video CPVs</h4>
                    <p className="text-white/40 text-sm leading-relaxed font-medium">
                      Micro-tasks powered by <b>Unity</b>. Simple video engagement for instant credit.
                    </p>
                  </div>

                  {/* Mega Invite Promo in Grid */}
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-10 rounded-[32px] md:col-span-4 flex flex-col md:flex-row items-center gap-12 group relative overflow-hidden border border-white/10 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.2)]">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                      <div className="flex-1 relative z-10 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest mb-6">Affiliate Protocol</div>
                        <h4 className="text-4xl md:text-5xl font-black mb-6 italic uppercase tracking-tighter leading-none">
                            REFER FRIENDS. <br/>
                            EARN <span className="text-amber-500">RS. 125</span> PER NODE.
                        </h4>
                        <p className="text-white/60 text-lg font-medium mb-10 max-w-xl">
                            Build your own affiliate network. Earn high-yield commissions for every active user you bring to the marketplace.
                        </p>
                        <button onClick={() => onGetStarted('signup')} className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 hover:text-white transition-all shadow-2xl">
                            Unlock Your Referral Link
                        </button>
                      </div>
                      <div className="w-full md:w-1/3 flex justify-center scale-110 group-hover:scale-125 transition-transform duration-700">
                          <GiftIcon className="w-48 h-48 text-white/5 drop-shadow-[0_0_80px_rgba(255,255,255,0.1)]" />
                      </div>
                  </div>

                  <div className="bg-[#0A0A0B] border border-white/5 p-10 rounded-[32px] group hover:border-amber-500/30 transition-all duration-500">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                          <DiamondIcon className="w-10 h-10 text-amber-600 animate-float-slow" />
                      </div>
                      <h4 className="text-xl font-black italic uppercase mb-1 relative z-10">Pro Nodes</h4>
                      <p className="text-white/40 text-xs font-medium relative z-10">Priority task access and enhanced referral multipliers.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* --- Live Activity Feed --- */}
            <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 text-center md:text-left">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold mb-4 italic uppercase">
                                Live Transaction Log
                            </div>
                            <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">Real-Time Distribution.</h3>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <AnimatePresence mode="wait">
                            {notificationMessage && (
                                <motion.div 
                                    key={notificationMessage}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white/5 border border-white/10 p-8 rounded-3xl flex items-center justify-between shadow-2xl backdrop-blur-xl"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                            {notificationMessage.includes('won') ? <GiftIcon className="w-7 h-7" /> : <WalletIcon className="w-7 h-7" />}
                                        </div>
                                        <div>
                                            <p className="text-lg text-white leading-tight font-black uppercase italic" dangerouslySetInnerHTML={{ __html: notificationMessage }}></p>
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-2 italic">Secured by Protocol</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-[2.5rem] p-12 flex flex-col justify-center relative overflow-hidden group border border-white/10">
                            <h4 className="text-3xl font-black mb-6 italic uppercase leading-none">JOIN THE <br/> ECOSYSTEM.</h4>
                            <p className="text-white/60 mb-10 font-medium font-sans">Start earning from verified global partners within minutes of deployment.</p>
                            <button onClick={() => onGetStarted('signup')} className="bg-white text-black px-10 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-2xl w-fit">
                                Create Free Identity
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA Section --- */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto text-center bg-gradient-to-br from-[#0A0A0B] to-[#050505] p-16 md:p-32 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase mb-10 text-white leading-none">
                            READY TO <span className="text-amber-500">IGNITE?</span>
                        </h2>
                        <p className="text-xl text-white/40 mb-14 max-w-2xl mx-auto font-medium tracking-tight">
                            Deploy your account today and experience the next generation of digital value distribution. Verified in Pakistan.
                        </p>
                        <button onClick={() => onGetStarted('signup')} className="bg-white text-black px-12 py-5 rounded-2xl text-base font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-2xl">
                            Deploy Account Free
                        </button>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="py-24 px-6 border-t border-white/5 bg-[#050505]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                                    <SparklesIcon className="w-6 h-6 text-amber-500" />
                                </div>
                                <span className="font-black text-2xl tracking-tighter italic text-white uppercase">Task<span className="text-amber-500">Mint</span></span>
                            </div>
                            <p className="text-white/30 font-medium max-w-sm leading-relaxed text-sm">
                                Pakistan's #1 premium platform for <strong>digital labor</strong> and <strong>high-yield tasks</strong>. Join 50,000+ nodes earning daily.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-8 text-white/40">Knowledge Base</h4>
                            <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-white/60">
                                <li><button onClick={() => navigate('/blog')} className="hover:text-amber-500 transition-colors">Earning Blog</button></li>
                                <li><button onClick={() => navigate('/app-download')} className="hover:text-amber-500 transition-colors">Download Node</button></li>
                                <li><button onClick={() => navigate('/contact')} className="hover:text-amber-500 transition-colors">Security Terminal</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-8 text-white/40">Governance</h4>
                            <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-white/60">
                                <li><button onClick={() => navigate('/privacy')} className="hover:text-amber-500 transition-colors">Privacy Protocol</button></li>
                                <li><button onClick={() => navigate('/terms')} className="hover:text-amber-500 transition-colors">Service Level Agreement</button></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-10 border-t border-white/5 flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">© 2026 TASKMINT PROTOCOL</p>
                    </div>
                </div>
            </footer>
        </main>
      </div>
    </>
  );
}
