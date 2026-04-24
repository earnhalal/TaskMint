import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye as EyeIcon, EyeOff as EyeSlashIcon, CheckCircle2 as CheckCircleIcon, ArrowRight, Sparkles as SparklesIcon, ShieldCheck, Wallet, Zap, TrendingUp } from 'lucide-react';

interface AuthViewProps {
    onSignup: (data: {username: string, email: string, phone: string, password: string, referralCode?: string}) => void;
    onLogin: (email: string, password: string) => void;
    onForgotPassword: (email: string) => void;
    initialView: 'login' | 'signup';
    initialReferralCode?: string;
}

const GoogleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.2 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const AuthView: React.FC<AuthViewProps> = ({ onSignup, onLogin, onForgotPassword, initialView, initialReferralCode = '' }) => {
    const navigate = useNavigate();
    const [isSignup, setIsSignup] = useState(initialView === 'signup');
    const [isResetMode, setIsResetMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState(initialReferralCode);
    const [showPassword, setShowPassword] = useState(false);
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isResetMode) document.title = 'Reset Password - TaskMint';
        else if (isSignup) document.title = 'Create Account | Get Rs. 100 Bonus - TaskMint';
        else document.title = 'Login | TaskMint - Earn Money Online Pakistan';
    }, [isSignup, isResetMode]);

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

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-amber-200 selection:text-amber-900">
            {/* Left Image Section - Hidden on Mobile */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900 opacity-90 z-10" />
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2674&auto=format&fit=crop")' }}
                />
                
                {/* Overlay Content */}
                <div className="relative z-20 flex flex-col justify-between p-16 h-full text-white w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight">TaskMint</span>
                    </div>

                    <div className="space-y-8 max-w-lg">
                        <h1 className="text-5xl font-black leading-tight">
                            Your Daily Path to <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Financial Freedom</span>
                        </h1>
                        <p className="text-lg text-slate-300 font-medium">
                            Join thousands of users across Pakistan completing simple tasks, watching ads, and earning real rewards straight to JazzCash and Easypaisa.
                        </p>

                        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                            <div className="space-y-2">
                                <Wallet className="w-6 h-6 text-amber-400" />
                                <h3 className="font-bold text-lg">Instant Payouts</h3>
                                <p className="text-sm text-slate-400 font-medium">Withdraw your earnings instantly with zero hidden fees.</p>
                            </div>
                            <div className="space-y-2">
                                <TrendingUp className="w-6 h-6 text-emerald-400" />
                                <h3 className="font-bold text-lg">Daily Growth</h3>
                                <p className="text-sm text-slate-400 font-medium">New tasks added every single day to maximize your income.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Form Section */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 py-12 lg:py-0 relative">
                {/* Mobile Header (Hidden on Desktop) */}
                <div className="lg:hidden text-center mb-8 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xl shadow-amber-500/20 mb-4">
                        <SparklesIcon className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">TaskMint</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Earn Smart. Every Day.</p>
                </div>

                <div className="w-full max-w-[420px] mx-auto animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                    {/* Toggle */}
                    {!isResetMode && (
                        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl mb-8 relative">
                            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${isSignup ? 'translate-x-[100%] left-1.5' : 'translate-x-0 left-1.5'}`}></div>
                            <button 
                                onClick={() => { navigate('/login'); setError(''); }}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors relative z-10 ${!isSignup ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >Log In</button>
                            <button 
                                onClick={() => { navigate('/signup'); setError(''); }}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors relative z-10 ${isSignup ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >Create Account</button>
                        </div>
                    )}

                    <div className="mb-8">
                        {isSignup && referralCode && (
                            <div className="mb-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200/60 text-amber-800 px-4 py-2.5 rounded-full text-xs font-bold w-full justify-center">
                                <SparklesIcon className="w-4 h-4 text-amber-500" />
                                Invited by <span className="text-amber-900 font-black px-1.5 py-0.5 bg-amber-100/50 rounded-md">{referralCode}</span>
                            </div>
                        )}
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            {isResetMode ? 'Reset Password' : isSignup ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium mt-2">
                            {isResetMode ? 'Enter your email to receive a secure reset link.' : isSignup ? 'Enter your details to create your secure wallet.' : 'Enter your credentials to access your dashboard.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignup && !isResetMode && (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Username (Unique)</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={e => setName(e.target.value.replace(/\s+/g, '').toLowerCase())}
                                        required
                                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm shadow-sm"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        required
                                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm shadow-sm"
                            />
                        </div>
                        
                        {!isResetMode && (
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm shadow-sm"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-white px-1"
                                    >
                                        {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isSignup && !isResetMode ? (
                            <div className="animate-fade-in space-y-4 pt-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Referral Code (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={referralCode}
                                        onChange={e => setReferralCode(e.target.value.replace(/\s+/g, '').toLowerCase())}
                                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm shadow-sm"
                                    />
                                </div>
                                <label className="flex items-start gap-3 cursor-pointer group mt-4">
                                    <div className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-md border flex items-center justify-center transition-colors ${agree ? 'bg-amber-500 border-amber-500' : 'bg-white border-slate-300 group-hover:border-amber-400'}`}>
                                        {agree && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="hidden" />
                                    <span className="text-xs text-slate-500 font-medium leading-relaxed">
                                        I agree to the <a href="#" className="font-bold text-slate-900 hover:text-amber-600">Terms of Service</a> & <a href="#" className="font-bold text-slate-900 hover:text-amber-600">Privacy Policy</a>
                                    </span>
                                </label>
                            </div>
                        ) : !isResetMode ? (
                            <div className="flex justify-end pt-1 animate-fade-in">
                                <button 
                                    type="button" 
                                    onClick={() => setIsResetMode(true)}
                                    className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        ) : null}

                        {error && (
                            <div className="bg-red-50 text-red-600 text-xs font-bold px-4 py-3.5 rounded-xl text-center flex items-center justify-center gap-2 border border-red-100">
                                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-[15px] shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6 group"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                    {isResetMode ? 'Send Reset Link' : isSignup ? 'Create Account' : 'Log In Securely'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        
                        {isResetMode && (
                            <button 
                                type="button"
                                onClick={() => { setIsResetMode(false); setError(''); }}
                                className="w-full py-3 mt-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                Back to Login
                            </button>
                        )}
                    </form>

                    {!isResetMode && (
                        <>
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                                    <span className="bg-slate-50 px-4">Or connect with</span>
                                </div>
                            </div>

                            <button className="w-full py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-[14px] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.99]">
                                <GoogleIcon className="w-5 h-5" />
                                Continue with Google
                            </button>
                        </>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-in { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default AuthView;

