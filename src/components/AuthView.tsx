import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye as EyeIcon, EyeOff as EyeSlashIcon, CheckCircle2 as CheckCircleIcon, ArrowRight, Sparkles as SparklesIcon, ShieldCheck, Coins, PlayCircle, ClipboardList, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthViewProps {
    onSignup: (data: {username: string, email: string, phone: string, password: string, referralCode?: string}) => void;
    onLogin: (email: string, password: string) => void;
    onForgotPassword: (email: string) => void;
    initialView: 'login' | 'signup';
    initialReferralCode?: string;
}

const slideVariants = {
    enter: (dir: number) => ({ x: dir >= 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir >= 0 ? -80 : 80, opacity: 0 }),
};

const inputClass = "w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all font-medium";

const AuthView: React.FC<AuthViewProps> = ({ onSignup, onLogin, onForgotPassword, initialView, initialReferralCode = '' }) => {
    const navigate = useNavigate();
    const [isSignup, setIsSignup] = useState(initialView === 'signup');
    const [isResetMode, setIsResetMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [direction, setDirection] = useState(0);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState(initialReferralCode);
    const [showPassword, setShowPassword] = useState(false);
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState('');

    // Dynamic SEO Titles and Meta Descriptions
    useEffect(() => {
        if (isResetMode) {
            document.title = 'Reset Password - TaskMint';
        } else if (isSignup) {
            document.title = 'Create Account | Get Rs. 100 Bonus - TaskMint';
            updateMetaDescription("Join TaskMint Pakistan. Watch ads, complete surveys, and earn daily rewards with fast JazzCash and Easypaisa withdrawals.");
        } else {
            document.title = 'Login | TaskMint - Earn Money Online Pakistan';
            updateMetaDescription("Join TaskMint Pakistan. Watch ads, complete surveys, and earn daily rewards with fast JazzCash and Easypaisa withdrawals.");
        }

        let robots = document.querySelector('meta[name="robots"]');
        if (robots) {
            robots.setAttribute('content', 'index, follow');
        } else {
            const meta = document.createElement('meta');
            meta.name = "robots";
            meta.content = "index, follow";
            document.getElementsByTagName('head')[0].appendChild(meta);
        }
    }, [isSignup, isResetMode]);

    const updateMetaDescription = (description: string) => {
        let meta = document.querySelector('meta[name="description"]');
        if (meta) {
            meta.setAttribute('content', description);
        } else {
            const newMeta = document.createElement('meta');
            newMeta.name = "description";
            newMeta.content = description;
            document.getElementsByTagName('head')[0].appendChild(newMeta);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');

        if (ref) {
            setReferralCode(ref);
            setIsSignup(true);
        } else {
            setIsSignup(initialView === 'signup');
        }
    }, [initialView]);

    const switchView = (view: 'login' | 'signup') => {
        if ((view === 'signup') === isSignup && !isResetMode) return;
        setDirection(view === 'signup' ? 1 : -1);
        setError('');
        setIsResetMode(false);
        setIsSignup(view === 'signup');
        navigate(`/${view}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (isResetMode) {
             if (!email) {
                 setError("Please enter your email.");
                 setIsLoading(false);
                 return;
             }
             onForgotPassword(email);
             setIsResetMode(false);
        } else if (isSignup) {
            if (!agree) {
                setError('You must agree to the Terms & Privacy Policy.');
                setIsLoading(false);
                return;
            }
            onSignup({ username: name, email, phone, password, referralCode });
        } else {
            onLogin(email, password);
        }
        setTimeout(() => setIsLoading(false), 3000);
    };

    const formKey = isResetMode ? 'reset' : isSignup ? 'signup' : 'login';

    return (
        <div className="min-h-screen bg-white font-sans grid lg:grid-cols-[1.05fr_1fr] selection:bg-emerald-100 selection:text-emerald-900">
            {/* --- Brand panel (desktop) --- */}
            <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 text-white p-12 xl:p-16">
                <motion.div aria-hidden animate={{ y: [0, -18, 0], x: [0, 10, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
                <motion.div aria-hidden animate={{ y: [0, 16, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-teal-300/20 blur-3xl" />

                <button onClick={() => navigate('/')} className="relative flex items-center gap-2.5 w-fit" aria-label="Back to TaskMint home">
                    <span className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-lg"><Coins className="w-5.5 h-5.5" /></span>
                    <span className="text-[22px] font-extrabold tracking-tight">TaskMint</span>
                </button>

                <div className="relative max-w-md">
                    <motion.h2 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">
                        Earn money in your free time
                    </motion.h2>
                    <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="mt-4 text-emerald-50/85 text-lg leading-relaxed">
                        Watch ads, answer surveys and complete simple tasks — then withdraw from Rs. 100 to JazzCash or EasyPaisa.
                    </motion.p>

                    <div className="mt-10 space-y-3.5 max-w-sm">
                        {[
                            { icon: PlayCircle, label: 'Watched a video ad', amount: '+ Rs. 15', delay: 0 },
                            { icon: ClipboardList, label: 'CPX survey completed', amount: '+ Rs. 180', delay: 0.8 },
                            { icon: CalendarCheck, label: 'Daily check-in bonus', amount: '+ Rs. 10', delay: 1.6 },
                        ].map((row) => (
                            <motion.div key={row.label} animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: row.delay }} className="flex items-center justify-between rounded-2xl bg-white/10 backdrop-blur border border-white/15 px-4.5 py-3.5">
                                <span className="flex items-center gap-3 font-medium text-[15px]"><row.icon className="w-5 h-5 text-emerald-200" />{row.label}</span>
                                <span className="font-bold text-emerald-200">{row.amount}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="relative flex items-center gap-8 text-sm font-semibold text-emerald-50/80">
                    <span>50K+ users</span>
                    <span>Rs. 100 min. payout</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-4.5 h-4.5" /> Secure platform</span>
                </div>
            </aside>

            {/* --- Form side --- */}
            <div className="relative flex items-center justify-center p-4 sm:p-8 py-10 overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white">
                <motion.div aria-hidden animate={{ y: [0, -14, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-100/70 blur-3xl pointer-events-none" />

                <div className="relative w-full max-w-md">
                    <div className="text-center mb-7 lg:hidden">
                        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2.5" aria-label="Back to TaskMint home">
                            <span className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25"><Coins className="w-6 h-6" /></span>
                            <span className="text-2xl font-extrabold tracking-tight text-slate-900">Task<span className="text-emerald-600">Mint</span></span>
                        </button>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white rounded-[28px] shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] border border-slate-100 overflow-hidden">
                        {/* Slide / swipe toggle */}
                        {!isResetMode && (
                            <div className="p-2.5 pb-0">
                                <div className="relative grid grid-cols-2 bg-slate-100 rounded-2xl p-1.5">
                                    <motion.span layout layoutId="auth-toggle-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/25 ${isSignup ? 'right-1.5' : 'left-1.5'}`} />
                                    <button onClick={() => switchView('login')} className={`relative z-10 py-3 text-sm font-bold rounded-xl transition-colors ${!isSignup ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}>Log In</button>
                                    <button onClick={() => switchView('signup')} className={`relative z-10 py-3 text-sm font-bold rounded-xl transition-colors ${isSignup ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}>Create Account</button>
                                </div>
                            </div>
                        )}

                        <div className="px-6 sm:px-8 pb-8 pt-6 overflow-hidden">
                            <AnimatePresence mode="wait" custom={direction} initial={false}>
                                <motion.div key={formKey} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}>
                                    <div className="mb-7 text-center">
                                        {isSignup && referralCode && (
                                            <div className="mb-4 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-xs font-bold">
                                                <SparklesIcon className="w-4 h-4 text-emerald-500" />
                                                You are invited by <span className="font-black">{referralCode}</span>
                                            </div>
                                        )}
                                        <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">
                                            {isResetMode ? 'Reset Password' : isSignup ? 'Start your earning journey' : 'Welcome back!'}
                                        </h1>
                                        <p className="text-sm text-slate-500 mt-2">
                                            {isResetMode ? 'Enter your email to receive a reset link.' : isSignup ? 'Create an account to unlock tasks & rewards.' : 'Enter your details to access your dashboard.'}
                                        </p>
                                        {isSignup && !isResetMode && (
                                            <p className="mt-4 text-[13px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                                                One-time joining fee of Rs. 150 activates your earning account after sign-up.
                                            </p>
                                        )}
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {isSignup && !isResetMode && (
                                            <>
                                                <input type="text" placeholder="Username (Unique)" value={name} onChange={e => setName(e.target.value.replace(/\s+/g, '').toLowerCase())} required className={inputClass} />
                                                <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required className={inputClass} />
                                            </>
                                        )}

                                        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />

                                        {!isResetMode && (
                                            <div className="relative">
                                                <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={`${inputClass} pr-12`} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Show or hide password">
                                                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        )}

                                        {isSignup && !isResetMode && password.length > 0 && (() => {
                                            const score = [password.length >= 6, password.length >= 10, /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
                                            const labels = ['Weak password', 'Weak password', 'Good password', 'Strong password', 'Very strong password'];
                                            const colors = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-600'];
                                            return (
                                                <div className="-mt-1" aria-live="polite">
                                                    <div className="flex gap-1.5">
                                                        {[0, 1, 2, 3].map(i => (
                                                            <span key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                    <p className="mt-1.5 text-[11px] font-bold text-slate-400">{labels[score]}</p>
                                                </div>
                                            );
                                        })()}

                                        {isSignup && !isResetMode ? (
                                            <>
                                                <input type="text" placeholder="Referral Code (Optional)" value={referralCode} onChange={e => setReferralCode(e.target.value.replace(/\s+/g, '').toLowerCase())} className={inputClass} />
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${agree ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300 group-hover:border-emerald-400'}`}>
                                                        {agree && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                                    </span>
                                                    <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="hidden" />
                                                    <span className="text-xs text-slate-500 font-medium">I agree to the <span className="text-slate-900 hover:underline">Terms</span> & <span className="text-slate-900 hover:underline">Privacy Policy</span></span>
                                                </label>
                                            </>
                                        ) : !isResetMode ? (
                                            <div className="flex justify-end">
                                                <button type="button" onClick={() => { setDirection(1); setIsResetMode(true); setError(''); }} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">Forgot Password?</button>
                                            </div>
                                        ) : null}

                                        {error && (
                                            <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl text-center animate-pulse">{error}</div>
                                        )}

                                        <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-[17px] shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none">
                                            {isLoading ? (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <>
                                                    {isResetMode ? 'Send Reset Link' : isSignup ? 'Create Account' : 'Login'}
                                                    <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </motion.button>

                                        {isResetMode && (
                                            <button type="button" onClick={() => { setDirection(-1); setIsResetMode(false); setError(''); }} className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Back to Login</button>
                                        )}
                                    </form>

                                    {!isResetMode && (
                                        <>

                                            <p className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-400">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                Secure platform · Withdraw via JazzCash &amp; EasyPaisa · Min. payout Rs. 100
                                            </p>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    <p className="mt-5 text-center text-xs font-medium text-slate-400 lg:hidden">50K+ users · Rs. 100 min. payout · JazzCash &amp; EasyPaisa</p>
                </div>
            </div>
        </div>
    );
};

export default AuthView;
