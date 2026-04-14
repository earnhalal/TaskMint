import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
    ArrowLeft,
    Zap,
    ChevronRight,
    X,
    ShoppingCart
} from 'lucide-react';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
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
        largeIcon: <Youtube className="w-12 h-12" />,
        color: '#FF0000',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-100',
        glowColor: 'shadow-red-500/20',
        themeBg: 'bg-gradient-to-br from-red-600 via-red-900 to-black',
        themeText: 'text-white',
        cardBg: 'bg-black/40 backdrop-blur-xl border-white/10',
        inputBg: 'bg-black/50 border-white/20 text-white placeholder:text-white/50 focus:border-red-500 focus:ring-red-500/20',
        btnBg: 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(255,0,0,0.4)]',
        services: [
            { id: 'yt_sub', name: 'Subscribers', price: 3.00 },
            { id: 'yt_watch', name: 'Watch Time', price: 1.20 },
            { id: 'yt_likes', name: 'Likes', price: 0.40 },
            { id: 'yt_comments', name: 'Comments', price: 0.60 },
        ]
    },
    { 
        id: 'tiktok', 
        name: 'TikTok', 
        icon: <Music2 className="w-5 h-5" />, 
        largeIcon: <Music2 className="w-12 h-12" />,
        color: '#000000',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        glowColor: 'shadow-slate-500/20',
        themeBg: 'bg-[#010101]',
        themeText: 'text-white',
        cardBg: 'bg-[#111111]/80 backdrop-blur-xl border-[#00f2fe]/20',
        inputBg: 'bg-black border-[#fe0979]/30 text-white placeholder:text-white/50 focus:border-[#00f2fe] focus:ring-[#00f2fe]/20',
        btnBg: 'bg-gradient-to-r from-[#00f2fe] to-[#fe0979] text-white shadow-[0_0_20px_rgba(254,9,121,0.4)]',
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
        largeIcon: <Facebook className="w-12 h-12" />,
        color: '#1877F2',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
        glowColor: 'shadow-blue-500/20',
        themeBg: 'bg-gradient-to-br from-blue-600 via-blue-800 to-[#0f172a]',
        themeText: 'text-white',
        cardBg: 'bg-white/10 backdrop-blur-xl border-white/10',
        inputBg: 'bg-black/20 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20',
        btnBg: 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(24,119,242,0.4)]',
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
        largeIcon: <Instagram className="w-12 h-12" />,
        color: '#E4405F',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-100',
        glowColor: 'shadow-pink-500/20',
        themeBg: 'bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]',
        themeText: 'text-white',
        cardBg: 'bg-white/10 backdrop-blur-xl border-white/20',
        inputBg: 'bg-black/20 border-white/30 text-white placeholder:text-white/60 focus:border-white focus:ring-white/20',
        btnBg: 'bg-white text-[#dc2743] hover:bg-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.3)]',
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
        largeIcon: <Globe className="w-12 h-12" />,
        color: '#10B981',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
        glowColor: 'shadow-emerald-500/20',
        themeBg: 'bg-gradient-to-br from-emerald-500 via-teal-700 to-slate-900',
        themeText: 'text-white',
        cardBg: 'bg-white/10 backdrop-blur-xl border-white/10',
        inputBg: 'bg-black/20 border-white/20 text-white placeholder:text-white/50 focus:border-emerald-400 focus:ring-emerald-400/20',
        btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]',
        services: [
            { id: 'web_traffic', name: 'Organic Traffic', price: 0.30 },
            { id: 'web_backlinks', name: 'Backlinks', price: 5.00 },
        ]
    },
    { 
        id: 'other', 
        name: 'Other', 
        icon: <MoreHorizontal className="w-5 h-5" />, 
        largeIcon: <MoreHorizontal className="w-12 h-12" />,
        color: '#6366F1',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-100',
        glowColor: 'shadow-indigo-500/20',
        themeBg: 'bg-gradient-to-br from-indigo-600 via-purple-800 to-slate-900',
        themeText: 'text-white',
        cardBg: 'bg-white/10 backdrop-blur-xl border-white/10',
        inputBg: 'bg-black/20 border-white/20 text-white placeholder:text-white/50 focus:border-indigo-400 focus:ring-indigo-400/20',
        btnBg: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]',
        services: [
            { id: 'other_custom', name: 'Custom Service', price: 1.00 },
        ]
    }
];

export default function QuickPromotions({ balance, onUpdateBalance }: QuickPromotionsProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [link, setLink] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState<number>(100);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    React.useEffect(() => {
        if (selectedPlatform && auth.currentUser) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const q = query(collection(db, 'promotion_orders'), where('userId', '==', auth.currentUser.uid));
                    const snapshot = await getDocs(q);
                    const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    const platformOrders = allOrders
                        .filter((o: any) => o.platform === selectedPlatform.name)
                        .sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
                    setHistory(platformOrders);
                } catch (error) {
                    console.error("Error fetching history:", error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        } else {
            setHistory([]);
            setShowHistory(false);
        }
    }, [selectedPlatform]);

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
                title: title,
                description: description,
                quantity: quantity,
                price: totalPrice,
                status: 'pending',
                timestamp: serverTimestamp()
            });

            setStatus('success');
            setLink('');
            setTitle('');
            setDescription('');
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

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedPlatform && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 bg-black">
                            <motion.div 
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className={`w-full h-full ${selectedPlatform.themeBg} ${selectedPlatform.themeText} relative overflow-y-auto no-scrollbar flex flex-col`}
                            >
                                {/* Top Navigation Bar */}
                                <div className="sticky top-0 z-20 px-4 py-4 flex items-center justify-between bg-black/10 backdrop-blur-md border-b border-white/10">
                                    <button 
                                        onClick={() => {
                                            setSelectedPlatform(null);
                                            setSelectedService(null);
                                            setStatus('idle');
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-xl transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-white" />
                                        <span className="text-sm font-bold text-white hidden sm:inline">Back</span>
                                    </button>
                                    <div className="font-black text-xl tracking-tighter text-white drop-shadow-md">
                                        Task<span className="text-amber-400">Mint</span>
                                    </div>
                                    <div className="w-16 sm:w-20"></div> {/* Spacer for centering */}
                                </div>

                                <div className="flex-1 w-full max-w-2xl mx-auto p-6 sm:p-8 flex flex-col">
                                    {/* Persistent Platform Header */}
                                    <div className="flex flex-col items-center text-center mb-8">
                                        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md shadow-2xl mb-4 border border-white/20">
                                            {selectedPlatform.largeIcon}
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tight mb-1 drop-shadow-lg">{selectedPlatform.name} Promotions</h3>
                                        <p className="text-xs font-bold opacity-80">Boost your presence instantly</p>
                                    </div>

                                    {!selectedService ? (
                                        <div className="flex-1 flex flex-col">
                                            <div className="space-y-3 flex-1">
                                                {selectedPlatform.services.map((service: any) => (
                                                    <button
                                                        key={service.id}
                                                        onClick={() => setSelectedService(service)}
                                                        className={`w-full p-5 rounded-2xl ${selectedPlatform.cardBg} hover:bg-white/20 transition-all flex items-center justify-between group shadow-lg`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                                                            <span className="text-lg font-bold">{service.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xs font-black opacity-80 bg-black/20 px-3 py-1.5 rounded-lg">{service.price.toFixed(2)} PKR / unit</span>
                                                            <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col">
                                            <button 
                                                onClick={() => setSelectedService(null)}
                                                className="mb-6 text-xs font-black flex items-center gap-2 hover:underline opacity-80 hover:opacity-100 w-fit bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm"
                                            >
                                                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Services
                                            </button>

                                            <div className="flex items-center gap-4 mb-8 bg-black/20 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                                                <div className="p-3 bg-white/10 rounded-xl shadow-inner">
                                                    {selectedPlatform.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black drop-shadow-md">{selectedService.name}</h3>
                                                    <p className="text-xs font-bold opacity-70">Selected Campaign</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6 flex-1">
                                                <div className={`p-6 rounded-3xl ${selectedPlatform.cardBg} shadow-xl`}>
                                                    <label className="text-xs font-black uppercase tracking-widest mb-3 block opacity-90">Target Link (Profile/Video/Post)</label>
                                                    <div className="relative">
                                                        <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                                                        <input 
                                                            type="text" 
                                                            placeholder="https://..."
                                                            value={link}
                                                            onChange={(e) => setLink(e.target.value)}
                                                            className={`w-full rounded-2xl py-4 pl-14 pr-5 text-base font-bold focus:outline-none transition-all ${selectedPlatform.inputBg}`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className={`p-6 rounded-3xl ${selectedPlatform.cardBg} shadow-xl`}>
                                                    <label className="text-xs font-black uppercase tracking-widest mb-3 block opacity-90">Promotion Title (Optional)</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="text" 
                                                            placeholder="e.g. My New Video"
                                                            value={title}
                                                            onChange={(e) => setTitle(e.target.value)}
                                                            className={`w-full rounded-2xl py-4 px-5 text-base font-bold focus:outline-none transition-all ${selectedPlatform.inputBg}`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className={`p-6 rounded-3xl ${selectedPlatform.cardBg} shadow-xl`}>
                                                    <label className="text-xs font-black uppercase tracking-widest mb-3 block opacity-90">Description (Optional)</label>
                                                    <div className="relative">
                                                        <textarea 
                                                            placeholder="Any specific instructions..."
                                                            value={description}
                                                            onChange={(e) => setDescription(e.target.value)}
                                                            rows={3}
                                                            className={`w-full rounded-2xl py-4 px-5 text-base font-bold focus:outline-none transition-all resize-none ${selectedPlatform.inputBg}`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className={`p-6 rounded-3xl ${selectedPlatform.cardBg} shadow-xl`}>
                                                    <label className="text-xs font-black uppercase tracking-widest mb-3 block opacity-90">Quantity</label>
                                                    <div className="relative">
                                                        <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                                                        <input 
                                                            type="number" 
                                                            placeholder="e.g. 500"
                                                            value={quantity}
                                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                                            className={`w-full rounded-2xl py-4 pl-14 pr-5 text-base font-bold focus:outline-none transition-all ${selectedPlatform.inputBg}`}
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-4">
                                                        {[100, 500, 1000, 5000].map(q => (
                                                            <button 
                                                                key={q}
                                                                onClick={() => setQuantity(q)}
                                                                className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${quantity === q ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-black/30 hover:bg-black/50 text-white'}`}
                                                            >
                                                                {q}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between shadow-2xl gap-4">
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-70">Total Investment</p>
                                                        <p className="text-3xl font-black drop-shadow-lg">{totalPrice.toFixed(2)} <span className="text-sm opacity-80">PKR</span></p>
                                                    </div>
                                                    <div className="sm:text-right bg-white/10 px-4 py-2 rounded-xl">
                                                        <p className="text-xs font-bold opacity-90">Rate: {selectedService.price.toFixed(2)} PKR / unit</p>
                                                    </div>
                                                </div>

                                                {status === 'error' && (
                                                    <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 animate-shake">
                                                        <AlertCircle className="w-6 h-6 text-red-200 shrink-0" />
                                                        <p className="text-sm font-bold text-white">{errorMsg}</p>
                                                    </div>
                                                )}

                                                {status === 'success' && (
                                                    <div className="bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3 animate-bounce-small">
                                                        <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
                                                        <p className="text-sm font-bold text-white">Order placed successfully! Campaign starting soon.</p>
                                                    </div>
                                                )}

                                                <button 
                                                    onClick={handleConfirmOrder}
                                                    disabled={isSubmitting || status === 'success'}
                                                    className={`w-full font-black py-5 rounded-2xl text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 mt-4 ${selectedPlatform.btnBg}`}
                                                >
                                                    {isSubmitting ? (
                                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <Zap className="w-6 h-6" /> Launch Campaign
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Order History Section */}
                                    <div className="mt-12 mb-8">
                                        <button 
                                            onClick={() => setShowHistory(!showHistory)}
                                            className="w-full py-4 flex items-center justify-center gap-2 text-sm font-bold opacity-80 hover:opacity-100 transition-opacity border-t border-white/10 pt-8"
                                        >
                                            {showHistory ? 'Hide Order History' : 'View Order History'}
                                            <ChevronRight className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {showHistory && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-6 space-y-3">
                                                        {isLoadingHistory ? (
                                                            <div className="text-center py-8 opacity-50 text-sm font-bold flex flex-col items-center gap-3">
                                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                Loading history...
                                                            </div>
                                                        ) : history.length === 0 ? (
                                                            <div className="text-center py-8 opacity-50 text-sm font-bold bg-black/20 rounded-2xl border border-white/5">
                                                                No orders found for {selectedPlatform.name}
                                                            </div>
                                                        ) : (
                                                            history.map(order => (
                                                                <div key={order.id} className={`p-5 rounded-2xl ${selectedPlatform.cardBg} flex flex-col gap-3 shadow-lg`}>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="font-bold text-base">{order.service}</span>
                                                                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : order.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/10 border border-white/20'}`}>
                                                                            {order.status}
                                                                        </span>
                                                                    </div>
                                                                    {(order.title || order.description) && (
                                                                        <div className="bg-black/20 p-3 rounded-xl space-y-1">
                                                                            {order.title && <p className="text-sm font-bold">{order.title}</p>}
                                                                            {order.description && <p className="text-xs opacity-80">{order.description}</p>}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between items-center text-sm opacity-80 bg-black/20 p-3 rounded-xl">
                                                                        <span className="font-bold">Qty: {order.quantity}</span>
                                                                        <span className="font-black">{order.price} PKR</span>
                                                                    </div>
                                                                    <div className="text-xs opacity-60 truncate bg-black/10 px-3 py-2 rounded-lg border border-white/5">
                                                                        {order.link}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            , document.body)}
        </div>
    );
}
