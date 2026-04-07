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
    Diamond as DiamondIcon
} from 'lucide-react';
import { InfoModal, renderModalContent } from '../components/LandingInfoViews';

export default function Landing() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onGetStarted = (view: 'login' | 'signup') => {
    navigate('/auth');
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
        .text-gold-gradient {
            background: linear-gradient(to right, #D4AF37, #F59E0B, #B45309);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .bg-gold-gradient {
            background: linear-gradient(to right, #F59E0B, #D97706);
        }
        .btn-gold {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            color: white;
            box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.39);
            transition: all 0.3s ease;
        }
        .btn-gold:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.23);
            filter: brightness(1.1);
        }
        .btn-outline-gold {
            background: white;
            border: 2px solid #F59E0B;
            color: #D97706;
            transition: all 0.3s ease;
        }
        .btn-outline-gold:hover {
            background: #FFFBEB;
            transform: translateY(-2px);
        }
        .glass-nav {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
            opacity: 0;
            transform: translateY(20px);
        }
        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }

        @keyframes float-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }

        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 30px rgba(245,158,11,0.2); }
            50% { box-shadow: 0 0 50px rgba(245,158,11,0.5); }
        }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }

        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-marquee {
            animation: marquee 25s linear infinite;
        }
        .marquee-container:hover .animate-marquee {
            animation-play-state: paused;
        }

        @keyframes pan-bg {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
        }
        .animate-pan-bg {
            animation: pan-bg 20s linear infinite alternate;
        }
      `}</style>

      {activeModal && (
          <InfoModal 
            title={getModalTitle(activeModal)} 
            onClose={() => setActiveModal(null)}
          >
              {renderModalContent(activeModal)}
          </InfoModal>
      )}

      <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
        
        {/* --- Header --- */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav py-3' : 'bg-white/0 py-5'}`}>
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30 transition-transform group-hover:scale-105">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <span className="font-black text-2xl tracking-tighter font-heading text-slate-900">Task<span className="text-gold-gradient">Mint</span></span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
              <button onClick={() => setActiveModal('how-it-works')} className="hover:text-amber-600 transition-colors">How it Works</button>
              <button onClick={() => setActiveModal('about')} className="hover:text-amber-600 transition-colors">About</button>
              <button onClick={() => setActiveModal('blog')} className="hover:text-amber-600 transition-colors">Blog</button>
              <button onClick={() => setActiveModal('support')} className="hover:text-amber-600 transition-colors">Support</button>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => onGetStarted('login')} className="text-slate-900 hover:text-amber-600 font-black transition-colors">Log In</button>
              <button onClick={() => onGetStarted('signup')} className="btn-gold px-6 py-2.5 rounded-full font-bold text-sm shadow-gold">
                Start Earning
              </button>
            </div>

            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-gray-900">
                {mobileMenu ? <CloseIcon className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
            </button>
          </div>
        </header>

        {/* --- Mobile Menu --- */}
        <div className={`fixed inset-0 bg-white z-40 pt-24 px-6 transition-transform duration-300 ${mobileMenu ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col space-y-6 text-lg font-bold text-gray-800">
                <button onClick={() => { setActiveModal('how-it-works'); setMobileMenu(false); }} className="text-left border-b border-gray-100 pb-4">How It Works</button>
                <button onClick={() => { setActiveModal('about'); setMobileMenu(false); }} className="text-left border-b border-gray-100 pb-4">About Us</button>
                <button onClick={() => { setActiveModal('blog'); setMobileMenu(false); }} className="text-left border-b border-gray-100 pb-4">Blog</button>
                <button onClick={() => { onGetStarted('login'); setMobileMenu(false); }} className="text-left border-b border-gray-100 pb-4 text-amber-600">Log In</button>
                <button onClick={() => { onGetStarted('signup'); setMobileMenu(false); }} className="btn-gold py-4 rounded-xl text-center mt-4 shadow-lg">Sign Up Free</button>
            </div>
        </div>

        <main>
            {/* --- Hero Section --- */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-50 rounded-full blur-3xl opacity-60 translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-bold mb-8 shadow-sm animate-fade-in-up">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        The #1 Premium Earning Platform
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-tight tracking-tighter animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                        Turn Your Time Into <br/>
                        <span className="text-gold-gradient drop-shadow-sm">Digital Gold.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                        TaskMint is the elite platform for smart hustlers. Complete premium tasks, access exclusive jobs, and withdraw instantly to your local wallet.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                        <button onClick={() => onGetStarted('signup')} className="btn-gold px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl transition-all">
                            Start Earning Now 
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={() => setActiveModal('how-it-works')} className="btn-outline-gold px-8 py-4 rounded-full font-bold text-lg">
                            How it Works
                        </button>
                    </div>

                    <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 text-slate-600 font-bold animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                         <div className="flex items-center gap-2">
                             <div className="p-1 rounded-full bg-green-100 text-green-600"><CheckCircleIcon className="w-4 h-4" /></div>
                             <span>Verified Premium Tasks</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="p-1 rounded-full bg-green-100 text-green-600"><CheckCircleIcon className="w-4 h-4" /></div>
                             <span>Instant Local Payouts</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="p-1 rounded-full bg-green-100 text-green-600"><CheckCircleIcon className="w-4 h-4" /></div>
                             <span>Bank-Grade Security</span>
                         </div>
                    </div>
                </div>
            </section>

            {/* --- Stats Section --- */}
            <section className="py-16 bg-[#F9FAFB] border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                            <p className="text-4xl font-black text-slate-900 mb-1 tracking-tight">1.5M+</p>
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Tasks Completed</p>
                        </div>
                        <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                            <p className="text-4xl font-black text-slate-900 mb-1 tracking-tight">5M+</p>
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Paid Out (Rs)</p>
                        </div>
                        <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                            <p className="text-4xl font-black text-slate-900 mb-1 tracking-tight">24h</p>
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Avg. Withdrawal</p>
                        </div>
                        <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                            <p className="text-4xl font-black text-slate-900 mb-1 tracking-tight">4.9/5</p>
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">User Rating</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Features Grid --- */}
            <section className="py-24 px-6 bg-white relative">
                 <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-amber-600 font-bold tracking-widest uppercase text-sm mb-3">The TaskMint Advantage</h2>
                        <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Designed for <br/> Maximum Profit.</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                <WalletIcon className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3">Instant Withdrawals</h4>
                            <p className="text-slate-500 leading-relaxed font-medium text-sm">
                                Access your funds quickly. We process payouts via JazzCash, EasyPaisa, and Bank Transfer within 24-48 hours.
                            </p>
                        </div>

                        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                <BriefcaseIcon className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3">Premium Jobs</h4>
                            <p className="text-slate-500 leading-relaxed font-medium text-sm">
                                Unlock high-paying opportunities like data entry and reviews. Subscribe to premium plans for unlimited earnings.
                            </p>
                        </div>

                        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                <UserGroupIcon className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-3">Referral Empire</h4>
                            <p className="text-slate-500 leading-relaxed font-medium text-sm">
                                Invite friends and build a passive income stream. Earn up to 200 Rs for every active referral you bring.
                            </p>
                        </div>
                        
                        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-black p-10 rounded-[32px] shadow-2xl flex flex-col md:flex-row items-center gap-8 group relative overflow-hidden text-white border border-slate-800 hover:border-amber-500/30 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(245,158,11,0.3)]">
                             <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-amber-500/30 transition-colors duration-500"></div>
                             <div className="flex-1 relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 backdrop-blur-sm border border-amber-500/30">
                                        <SparklesIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-amber-400 font-bold uppercase tracking-wider text-sm">Daily Bonus</span>
                                </div>
                                <h4 className="text-3xl font-bold mb-3">Spin & Win Daily</h4>
                                <p className="text-gray-300 leading-relaxed mb-8 font-medium">
                                    Log in every day to spin the wheel. Win free cash prizes, multipliers, and exclusive rewards just for being active.
                                </p>
                                <button onClick={() => onGetStarted('signup')} className="bg-white text-slate-900 px-8 py-3.5 rounded-full font-bold hover:bg-amber-50 transition-colors shadow-lg">
                                    Try Your Luck
                                </button>
                             </div>
                             <div className="w-full md:w-1/3 flex justify-center">
                                <div className="w-40 h-40 rounded-full border-[6px] border-amber-500/80 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 animate-pulse-glow animate-float">
                                    <TrophyIcon className="w-20 h-20 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                                </div>
                             </div>
                        </div>

                        <div className="bg-gradient-to-br from-white to-amber-50/30 border border-gray-100 p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col justify-center items-center text-center hover:-translate-y-2 hover:border-amber-200 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-100/0 via-amber-100/20 to-amber-100/0 translate-y-[100%] group-hover:translate-y-[-100%] transition-transform duration-1000 ease-in-out"></div>
                            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                <DiamondIcon className="w-10 h-10 text-amber-600 animate-float-slow" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-1 relative z-10">VIP Levels</h4>
                            <p className="text-slate-500 text-sm font-medium relative z-10">Climb ranks for bigger rewards.</p>
                        </div>
                    </div>
                 </div>
            </section>

            {/* --- Payment Methods --- */}
            <section className="py-20 bg-[#F9FAFB] border-t border-gray-200 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center mb-10">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Trusted Payment Partners</p>
                </div>
                <div className="relative w-full flex overflow-hidden marquee-container">
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#F9FAFB] to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#F9FAFB] to-transparent z-10 pointer-events-none"></div>
                    
                    <div className="flex w-[200%] animate-marquee">
                        {/* First set */}
                        <div className="flex-1 flex justify-around items-center opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0">
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800"><span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md">JC</span> JazzCash</div>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800"><span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs shadow-md">EP</span> EasyPaisa</div>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800"><BankIcon className="w-8 h-8 text-gray-700"/> Bank Transfer</div>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">NayaPay</div>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">SadaPay</div>
                        </div>
                        {/* Second set (duplicate for seamless loop) */}
                        <div className="flex-1 flex justify-around items-center opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0">
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800"><span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md">JC</span> JazzCash</div>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800"><span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs shadow-md">EP</span> EasyPaisa</div>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800"><BankIcon className="w-8 h-8 text-gray-700"/> Bank Transfer</div>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">NayaPay</div>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">SadaPay</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA Section --- */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto text-center bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 p-12 md:p-24 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(245,158,11,0.5)] relative overflow-hidden animate-float-slow">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay animate-pan-bg" style={{ backgroundSize: '200px' }} />
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-white drop-shadow-md">
                            Ready to start earning?
                        </h2>
                        <p className="text-xl text-amber-50 mb-10 max-w-2xl mx-auto font-medium drop-shadow-sm">
                            Join thousands of users who are already making money daily. Withdraw easily via JazzCash, EasyPaisa, SadaPay, or Bank.
                        </p>
                        <button onClick={() => onGetStarted('signup')} className="inline-block bg-white text-amber-600 px-10 py-5 rounded-full text-xl font-bold hover:bg-slate-50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.3)]">
                            Create Your Free Account
                        </button>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="py-12 px-6 border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight text-slate-900">TaskMint</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-slate-500">
                        <button onClick={() => setActiveModal('privacy')} className="hover:text-amber-600 transition-colors">Privacy Policy</button>
                        <button onClick={() => setActiveModal('terms')} className="hover:text-amber-600 transition-colors">Terms of Service</button>
                        <button onClick={() => setActiveModal('support')} className="hover:text-amber-600 transition-colors">Contact Support</button>
                    </div>
                    <p className="text-sm font-medium text-slate-400">© 2026 TaskMint. All rights reserved.</p>
                </div>
            </footer>
        </main>
      </div>
    </>
  );
}
