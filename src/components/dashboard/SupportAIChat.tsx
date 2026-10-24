import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, ShieldCheck, CheckCheck, Headphones, Clock, Paperclip, X, Lock, Star, Headset } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ref as rtdbRef, onValue, push, update, serverTimestamp } from 'firebase/database';
import { auth, rtdb } from '../../firebase';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text?: string;
  image?: string;
  at: number;
}

interface SupportMeta {
  needsReply?: boolean;
  lastUserMsgAt?: number;
  lastAgentMsgAt?: number;
  agentSeenAt?: number;
  sessionClosedAt?: number;
  lockedUntil?: number;
  rating?: number;
}

interface SupportAIChatProps {
  onBack: () => void;
  userName?: string;
  accountStatus?: string;
  balance?: number;
}

const CONNECT_STEPS = [
  'Connecting to support...',
  'Assigning an agent...',
  'Agent joined the chat',
];

/**
 * Live Support — agent-run (replaced the Gemini chat 2026-10-25).
 *
 * Messages live in RTDB at users/{uid}/supportChat (fits the published
 * RTDB rules — the owner node is writable by the signed-in user). A
 * 24/7 support agent pass reads chats flagged needsReply and answers
 * from the user's real account record; nothing here calls an AI API,
 * so there is no shared quota to exhaust. Replies typically land
 * within a few minutes, day or night.
 */
export default function SupportAIChat({ onBack, userName }: SupportAIChatProps) {
  const uid = auth.currentUser?.uid || '';
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStep, setConnectionStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [meta, setMeta] = useState<SupportMeta>({});
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lockedUntil = meta.lockedUntil || 0;
  const isLocked = lockedUntil > nowTs;
  const sessionClosed = !!meta.sessionClosedAt && (meta.sessionClosedAt || 0) >= (meta.lastUserMsgAt || 0);

  // Live listeners: messages + meta.
  useEffect(() => {
    if (!uid) return;
    const unsubMsg = onValue(rtdbRef(rtdb, `users/${uid}/supportChat/messages`), (snap) => {
      const val = snap.val() || {};
      const list: ChatMessage[] = Object.entries(val)
        .map(([id, m]: [string, any]) => ({ id, role: m.role, text: m.text, image: m.image, at: m.at || 0 }))
        .sort((a, b) => a.at - b.at);
      setMessages(list);
    });
    const unsubMeta = onValue(rtdbRef(rtdb, `users/${uid}/supportChat/meta`), (snap) => {
      setMeta((snap.val() as SupportMeta) || {});
    });
    return () => { unsubMsg(); unsubMeta(); };
  }, [uid]);

  // Connecting sequence (short, honest): then the chat opens.
  useEffect(() => {
    const timers: any[] = [];
    CONNECT_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setConnectionStep(i), i * 900));
    });
    timers.push(setTimeout(() => setIsConnecting(false), CONNECT_STEPS.length * 900 + 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Tick for the lock countdown.
  useEffect(() => {
    if (!isLocked) return;
    const t = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(t);
  }, [isLocked]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isConnecting]);

  const formatTime = (at: number) =>
    at ? new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 720;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(reader.result as string);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSelectedImage(await compressImage(file));
    } catch {
      setSelectedImage(null);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || sending || !uid || isLocked || sessionClosed) return;
    setSending(true);
    try {
      const text = input.trim();
      const image = selectedImage || undefined;
      await push(rtdbRef(rtdb, `users/${uid}/supportChat/messages`), {
        role: 'user',
        ...(text ? { text } : {}),
        ...(image ? { image } : {}),
        at: serverTimestamp(),
      });
      const now = Date.now();
      await update(rtdbRef(rtdb, `users/${uid}/supportChat/meta`), {
        needsReply: true,
        lastUserMsgAt: now,
      });
      await update(rtdbRef(rtdb, `users/${uid}`), {
        supportChatActive: true,
        supportChatLastMsgAt: now,
      });
      setInput('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Support send error:', error);
    } finally {
      setSending(false);
    }
  };

  const startNewSession = async () => {
    if (!uid) return;
    setRating(0);
    setFeedbackSubmitted(false);
    await update(rtdbRef(rtdb, `users/${uid}/supportChat/meta`), {
      sessionClosedAt: null,
      lockedUntil: null,
      rating: null,
    });
  };

  const submitRating = async () => {
    if (!uid || rating === 0) return;
    setFeedbackSubmitted(true);
    await update(rtdbRef(rtdb, `users/${uid}/supportChat/meta`), { rating });
  };

  // Waiting state shown under the header.
  const waitingState = (() => {
    if (!meta.needsReply) return null;
    const seen = (meta.agentSeenAt || 0) >= (meta.lastUserMsgAt || 0);
    return seen ? 'typing' : 'busy';
  })();

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 mb-12">
          <div className="w-32 h-32 rounded-full border border-emerald-500/20 flex items-center justify-center relative bg-zinc-900">
            <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
            <Headphones className="w-12 h-12 text-emerald-400 animate-pulse" />
          </div>
        </motion.div>
        <div className="relative z-10">
          <h2 className="text-white font-black text-3xl mb-4 tracking-tighter uppercase">Live Support</h2>
          <motion.p
            key={connectionStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-400 text-[11px] font-black uppercase tracking-widest"
          >
            {CONNECT_STEPS[connectionStep]}
          </motion.p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    const remainingMins = Math.max(1, Math.ceil((lockedUntil - nowTs) / 60000));
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-zinc-950">
        <div className="w-24 h-24 rounded-full border border-emerald-500/20 flex items-center justify-center bg-zinc-900 mb-8 shadow-2xl">
          <Lock className="w-10 h-10 text-zinc-400" />
        </div>
        <h2 className="text-white font-black text-2xl mb-4 tracking-tighter uppercase">Session Ended</h2>
        {!feedbackSubmitted ? (
          <>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mb-6">
              Please rate your support session before you go.
            </p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  className={`transition-all ${rating >= star ? 'text-emerald-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  <Star className="w-7 h-7" strokeWidth={2} fill={rating >= star ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            <button
              disabled={rating === 0}
              onClick={submitRating}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-black uppercase tracking-widest text-xs transition-all disabled:opacity-30"
            >
              Submit Feedback
            </button>
          </>
        ) : (
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mb-8">
            Thank you for your feedback. You can start a new session in{' '}
            <span className="text-emerald-400 font-black">{remainingMins} minute{remainingMins === 1 ? '' : 's'}</span>.
          </p>
        )}
        <button onClick={onBack} className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-black uppercase tracking-widest text-xs transition-all border border-white/5">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white overflow-hidden relative">
      {/* Header */}
      <div className="bg-zinc-950/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-white/10 h-16 shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-3 w-full">
          <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <Headset className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full"></div>
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-xs sm:text-sm font-black text-white tracking-widest uppercase truncate">TaskMint Support</h3>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <p className="text-[8px] sm:text-[9px] text-emerald-400/80 font-black uppercase tracking-widest truncate">
                {waitingState === 'typing' ? 'Agent is typing...' : waitingState === 'busy' ? 'Agent busy — please wait' : 'Online — replies in a few minutes'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative hide-scrollbar pb-10">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex justify-center mb-4">
            <div className="bg-white/[0.03] backdrop-blur-md px-5 py-3 rounded-[1.5rem] border border-white/10 text-center max-w-[90%]">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Support Session Active</p>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">
                Your messages are saved here — even if you close the app, the reply will be waiting when you come back.
              </p>
            </div>
          </div>

          {/* Local welcome (not stored) when the thread is empty */}
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="relative max-w-[80%] p-3.5 pt-3 shadow-lg bg-white/[0.04] text-slate-100 rounded-[1.2rem] rounded-bl-[0.2rem] border border-white/10">
                <p className="text-[13px] sm:text-[14px] leading-relaxed pr-2 pb-1 font-medium">
                  Asalam-o-Alaikum{userName ? ` ${userName}` : ''}! TaskMint Support mein khush amdeed. Aap ko kis cheez mein madad chahiye? Apna masla yahan likh dein — hamari team jald jawab degi.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`relative max-w-[80%] p-3.5 sm:p-4 pt-3 shadow-lg ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-[1.2rem] rounded-br-[0.2rem] border border-white/10'
                  : 'bg-white/[0.04] text-slate-100 rounded-[1.2rem] rounded-bl-[0.2rem] border border-white/10'
              }`}>
                {msg.image && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-white/20">
                    <img src={msg.image} alt="Attachment" className="w-full max-h-48 object-cover" />
                  </div>
                )}
                {msg.text && <p className="text-[13px] sm:text-[14px] leading-relaxed pr-6 pb-1 font-medium">{msg.text}</p>}
                <div className="flex items-center justify-end gap-1.5 mt-2 border-t border-white/5 pt-1.5">
                  <span className="text-[9px] uppercase font-black text-white/50 tracking-widest">{formatTime(msg.at)}</span>
                  {msg.role === 'user' && <CheckCheck className="w-3.5 h-3.5 text-white/70" />}
                </div>
              </div>
            </motion.div>
          ))}

          {waitingState && (
            <div className="flex justify-start">
              <div className="bg-white/[0.04] px-5 py-4 rounded-[1.5rem] rounded-bl-[0.2rem] border border-white/10">
                {waitingState === 'typing' ? (
                  <div className="flex gap-2.5">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce"></span>
                  </div>
                ) : (
                  <p className="text-[11px] font-bold text-zinc-400">
                    Agents are busy with other users right now — please wait. Your message is saved and the reply will appear here.
                  </p>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-12" />
        </div>
      </div>

      {/* Composer */}
      <div className="bg-zinc-950/90 backdrop-blur-2xl p-4 flex flex-col gap-2 border-t border-white/10 relative z-20 pb-8">
        <AnimatePresence>
          {selectedImage && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative self-start mb-1">
              <img src={selectedImage} alt="Selected" className="h-16 w-16 object-cover rounded-xl border border-emerald-500/50 shadow-lg" />
              <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:bg-rose-600 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {sessionClosed && !isLocked ? (
          <button onClick={startNewSession} className="w-full py-3.5 rounded-[1.2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98]">
            Start New Session
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 bg-white/5 rounded-[1.2rem] flex items-center justify-center text-emerald-400 hover:bg-white/10 transition-all border border-white/10 active:scale-95 shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-[1.2rem] flex items-center px-4 py-3 shadow-inner border border-white/10 transition-all focus-within:border-emerald-500/50">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="w-full bg-transparent outline-none text-[14px] font-medium text-white placeholder:text-white/40"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              disabled={(!input.trim() && !selectedImage) || sending}
              onClick={handleSend}
              className="w-12 h-12 bg-emerald-500 hover:bg-emerald-400 text-white rounded-[1.2rem] flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50 disabled:grayscale active:scale-95"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5 translate-x-0.5" />
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
