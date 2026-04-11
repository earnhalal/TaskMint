import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye as EyeIcon, EyeOff as EyeSlashIcon, CheckCircle2 as CheckCircleIcon, ArrowRight, Sparkles as SparklesIcon, ShieldCheck } from 'lucide-react';

interface AuthViewProps {
    onSignup: (data: {username: string, email: string, phone: string, password: string, referralCode?: string}) => void;
    onLogin: (email: string, password: string) => void;
    onForgotPassword: (email: string) => void; // Added prop
    initialView: 'login' | 'signup';
}

// Local Google Icon Component for this view
const GoogleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.2 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const AuthView: React.FC<AuthViewProps> = ({ onSignup, onLogin, onForgotPassword, initialView }) => {
    const navigate = useNavigate();
    const [isSignup, setIsSignup] = useState(initialView === 'signup');
    const [isResetMode, setIsResetMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
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

        // Ensure robots tag is index, follow
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
            setIsSignup(true); // Force signup view if referred
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
             setIsResetMode(false); // Go back to login after sending
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
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 font-sans selection:bg-amber-100 selection:text-amber-900">
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-lg shadow-amber-500/30 mb-4">
                        <SparklesIcon className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-heading">TaskMint</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Earn Smart. TaskMint.</p>
                </div>

                <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/50 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                    <div className="p-2">
                        {!isResetMode && (
                            <div className="flex bg-gray-100 rounded-2xl p-1 relative">
                                <div 
                                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${isSignup ? 'translate-x-[100%] left-1' : 'translate-x-0 left-1'}`}
                                ></div>
                                
                                <button 
                                    onClick={() => { navigate('/login'); setError(''); }}
                                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors relative z-10 ${!isSignup ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Log In
                                </button>
                                <button 
                                    onClick={() => { navigate('/signup'); setError(''); }}
                                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors relative z-10 ${isSignup ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Create Account
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="px-8 pb-8 pt-6">
                        <div className="mb-8 text-center">
                            {isSignup && referralCode && (
                                <div className="mb-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-xs font-bold animate-fade-in">
                                    <SparklesIcon className="w-4 h-4 text-amber-500" />
                                    You are invited by <span className="text-amber-900 font-black">{referralCode}</span>
                                </div>
                            )}
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isResetMode ? 'Reset Password' : isSignup ? 'Start your earning journey' : 'Welcome back, Hustler!'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-2">
                                {isResetMode ? 'Enter your email to receive a reset link.' : isSignup ? 'Create an account to unlock tasks & rewards.' : 'Enter your details to access your dashboard.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isSignup && !isResetMode && (
                                <div className="space-y-4 animate-fade-in">
                                    <div>
                                        <input 
                                            type="text" 
                                            placeholder="Username (Unique)"
                                            value={name}
                                            onChange={e => setName(e.target.value.replace(/\s+/g, '').toLowerCase())}
                                            required
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <input 
                                            type="tel" 
                                            placeholder="Phone Number"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            required
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <input 
                                    type="email" 
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                />
                            </div>
                            
                            {!isResetMode && (
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            )}

                            {isSignup && !isResetMode ? (
                                <div className="animate-fade-in space-y-4">
                                    <input 
                                        type="text" 
                                        placeholder="Referral Code (Optional)"
                                        value={referralCode}
                                        onChange={e => setReferralCode(e.target.value.replace(/\s+/g, '').toLowerCase())}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                    />
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${agree ? 'bg-amber-500 border-amber-500' : 'bg-white border-gray-300 group-hover:border-amber-400'}`}>
                                            {agree && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="hidden" />
                                        <span className="text-xs text-gray-500 font-medium">I agree to the <span className="text-gray-900 hover:underline">Terms</span> & <span className="text-gray-900 hover:underline">Privacy Policy</span></span>
                                    </label>
                                </div>
                            ) : !isResetMode ? (
                                <div className="flex justify-end animate-fade-in">
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
                                <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl text-center animate-pulse">
                                    {error}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-lg shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-4"
                            >
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
                            </button>
                            
                            {isResetMode && (
                                <button 
                                    type="button"
                                    onClick={() => { setIsResetMode(false); setError(''); }}
                                    className="w-full py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    Back to Login
                                </button>
                            )}
                        </form>

                        {!isResetMode && (
                            <>
                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-4 text-gray-400 font-bold tracking-wider">Or continue with</span>
                                    </div>
                                </div>

                                <button className="w-full py-3.5 rounded-2xl border-2 border-gray-100 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.99]">
                                    <GoogleIcon className="w-5 h-5" />
                                    Continue with Google
                                </button>

                                {/* About Section for SEO */}
                                <div className="mt-10 pt-8 border-t border-gray-100 text-center animate-fade-in" style={{animationDelay: '0.4s'}}>
                                    <div className="flex items-center justify-center gap-2 text-amber-600 mb-3">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Secure Platform</span>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                        TaskMint is a secure platform for Pakistani users to earn real money online. 
                                        Register today to claim your <span className="text-amber-600 font-bold">Rs. 100 APK install bonus</span> and start earning.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default AuthView;
