import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Youtube, 
    Facebook, 
    Music2, 
    Instagram,
    Globe,
    MoreHorizontal,
    Link as LinkIcon, 
    Hash, 
    CheckCircle2, 
    AlertCircle,
    ArrowRight,
    Zap,
    ChevronRight,
    X,
    ShoppingCart
} from 'lucide-react';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface QuickPromotionsProps {
    balance: number;
    onUpdateBalance: (amount: number, source?: string, description?: string) => void;
}

const platforms = [
    { 
        id: 'youtube', 
        name: 'YouTube', 
        icon: <Youtube className="w-5 h-5" />, 
        color: '#FF0000',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-100',
        glowColor: 'shadow-red-500/20',
        services: [
            { id: 'yt_sub', name: 'Subscribers', price: 0.80 },
            { id: 'yt_watch', name: 'Watch Time', price: 1.20 },
            { id: 'yt_likes', name: 'Likes', price: 0.40 },
            { id: 'yt_comments', name: 'Comments', price: 0.60 },
        ]
    },
    { 
        id: 'tiktok', 
        name: 'TikTok', 
        icon: <Music2 className="w-5 h-5" />, 
        color: '#000000',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        glowColor: 'shadow-slate-500/20',
        services: [
            { id: 'tt_followers', name: 'Followers', price: 0.50 },
            { id: 'tt_likes', name: 'Likes', price: 0.30 },
            { id: 'tt_views', name: 'Views', price: 0.10 },
            { id: 'tt_usa', name: 'USA Base Followers', price: 1.50 },
        ]
    },
    { 
        id: 'facebook', 
        name: 'Facebook', 
        icon: <Facebook className="w-5 h-5" />, 
        color: '#1877F2',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
        glowColor: 'shadow-blue-500/20',
        services: [
            { id: 'fb_profile', name: 'Profile Followers', price: 0.60 },
            { id: 'fb_page', name: 'Page Likes/Followers', price: 0.70 },
            { id: 'fb_group', name: 'Group Members', price: 0.80 },
        ]
    },
    { 
        id: 'instagram', 
        name: 'Instagram', 
        icon: <Instagram className="w-5 h-5" />, 
        color: '#E4405F',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-100',
        glowColor: 'shadow-pink-500/20',
        services: [
            { id: 'ig_followers', name: 'Followers', price: 0.70 },
            { id: 'ig_likes', name: 'Reels Likes', price: 0.40 },
            { id: 'ig_views', name: 'Story Views', price: 0.20 },
        ]
    },
    { 
        id: 'website', 
        name: 'Website', 
        icon: <Globe className="w-5 h-5" />, 
        color: '#10B981',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
        glowColor: 'shadow-emerald-500/20',
        services: [
            { id: 'web_traffic', name: 'Organic Traffic', price: 0.30 },
            { id: 'web_backlinks', name: 'Backlinks', price: 5.00 },
        ]
    },
    { 
        id: 'other', 
        name: 'Other', 
        icon: <MoreHorizontal className="w-5 h-5" />, 
        color: '#6366F1',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-100',
        glowColor: 'shadow-indigo-500/20',
        services: [
            { id: 'other_custom', name: 'Custom Service', price: 1.00 },
        ]
    }
];

export default function QuickPromotions({ balance, onUpdateBalance }: QuickPromotionsProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [link, setLink] = useState('');
    const [quantity, setQuantity] = useState<number>(100);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const totalPrice = useMemo(() => {
        if (!selectedService) return 0;
        return quantity * selectedService.price;
    }, [quantity, selectedService]);

    const handleConfirmOrder = async () => {
        if (!auth.currentUser || !selectedService) return;
        if (!link) {
            setErrorMsg('Please provide a valid link');
            setStatus('error');
            return;
        }
        if (quantity < 10) {
            setErrorMsg('Minimum quantity is 10');
            setStatus('error');
            return;
        }
        if (balance < totalPrice) {
            setErrorMsg('Insufficient Balance! Please deposit first.');
            setStatus('error');
            return;
        }

        setIsSubmitting(true);
        setStatus('idle');

        try {
            // 1. Deduct Balance using centralized logic
            await onUpdateBalance(-totalPrice, 'promotion_order', `Ordered ${quantity} ${selectedService.name}`);

            // 2. Create Order
            await addDoc(collection(db, 'promotion_orders'), {
                userId: auth.currentUser.uid,
                username: localStorage.getItem('taskmint_name') || 'User',
                platform: selectedPlatform.name,
                service: selectedService.name,
                link: link,
                quantity: quantity,
                price: totalPrice,
                status: 'pending',
                timestamp: serverTimestamp()
            });

            setStatus('success');
            setLink('');
            setQuantity(100);
            setTimeout(() => {
                setSelectedService(null);
                setSelectedPlatform(null);
                setStatus('idle');
            }, 2000);
        } catch (error) {
            console.error("Order Error:", error);
            setErrorMsg('Something went wrong. Please try again.');
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> 
                    Quick Promotions
                </h2>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Premium</span>
            </div>

            {/* Platform Grid */}
            <div className="grid grid-cols-3 gap-3">
                {platforms.map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform)}
                        className={`p-3 rounded-2xl border ${platform.borderColor} ${platform.bgColor} flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.05] active:scale-95 shadow-sm ${platform.glowColor} group`}
                    >
                        <div 
                            className="p-2.5 bg-white rounded-xl shadow-sm transition-transform group-hover:scale-110"
                            style={{ color: platform.color }}
                        >
                            {platform.icon}
                        </div>
                        <span className="text-[10px] font-black text-slate-700">{platform.name}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {selectedPlatform && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl border-t sm:border border-slate-100 relative max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <button 
                                onClick={() => {
                                    setSelectedPlatform(null);
                                    setSelectedService(null);
                                    setStatus('idle');
                                }}
                                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>

                            {!selectedService ? (
                                <div className="pt-2">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div 
                                            className={`p-4 rounded-2xl ${selectedPlatform.bgColor} ${selectedPlatform.borderColor} border shadow-sm`}
                                            style={{ color: selectedPlatform.color }}
                                        >
                                            {selectedPlatform.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">{selectedPlatform.name} Services</h3>
                                            <p className="text-xs font-bold text-slate-500">Select a service to continue</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {selectedPlatform.services.map((service: any) => (
                                            <button
                                                key={service.id}
                                                onClick={() => setSelectedService(service)}
                                                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-amber-200 hover:shadow-md transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                                    <span className="text-sm font-bold text-slate-700">{service.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-slate-400">{service.price.toFixed(2)} PKR / unit</span>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <button 
                                        onClick={() => setSelectedService(null)}
                                        className="mb-4 text-[10px] font-black text-amber-600 flex items-center gap-1 hover:underline"
                                    >
                                        <ArrowRight className="w-3 h-3 rotate-180" /> Back to Services
                                    </button>

                                    <div className="flex items-center gap-4 mb-8">
                                        <div 
                                            className={`p-4 rounded-2xl ${selectedPlatform.bgColor} ${selectedPlatform.borderColor} border shadow-sm`}
                                            style={{ color: selectedPlatform.color }}
                                        >
                                            {selectedPlatform.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">{selectedService.name}</h3>
                                            <p className="text-xs font-bold text-slate-500">{selectedPlatform.name} Promotion</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Link (Profile/Video/Post)</label>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="https://..."
                                                    value={link}
                                                    onChange={(e) => setLink(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quantity</label>
                                            <div className="relative">
                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    type="number" 
                                                    placeholder="e.g. 500"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                                />
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                {[100, 500, 1000, 5000].map(q => (
                                                    <button 
                                                        key={q}
                                                        onClick={() => setQuantity(q)}
                                                        className={`text-[10px] font-black px-3 py-1 rounded-full transition-all ${quantity === q ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-2xl p-5 border border-white/10 flex items-center justify-between shadow-xl">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bill</p>
                                                <p className="text-2xl font-black text-amber-400">{totalPrice.toFixed(2)} <span className="text-xs text-white/60">PKR</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-white/40 italic">Rate: {selectedService.price.toFixed(2)} PKR / unit</p>
                                            </div>
                                        </div>

                                        {status === 'error' && (
                                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                                <p className="text-xs font-bold text-red-700">{errorMsg}</p>
                                            </div>
                                        )}

                                        {status === 'success' && (
                                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-bounce-small">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                <p className="text-xs font-bold text-emerald-700">Order placed successfully!</p>
                                            </div>
                                        )}

                                        <button 
                                            onClick={handleConfirmOrder}
                                            disabled={isSubmitting || status === 'success'}
                                            className="w-full bg-amber-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-5 h-5" /> Confirm Order
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
