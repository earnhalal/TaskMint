import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  Loader2, 
  ArrowLeft,
  ShieldCheck,
  Zap,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  Headphones,
  Clock,
  Paperclip,
  ImageIcon,
  X,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface SupportAIChatProps {
  onBack: () => void;
  userName?: string;
  accountStatus?: string;
  balance?: number;
  persistedMessages?: Message[];
  onUpdateMessages?: (messages: Message[]) => void;
  persistedAgent?: any;
  onAgentAssigned?: (agent: any) => void;
}

// Support Agent Identities with Real Human Photos and Gender info
const SUPPORT_AGENTS = [
  { name: "Ali", gender: "male", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&auto=format&fit=crop" },
  { name: "Hamza", gender: "male", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&h=150&auto=format&fit=crop" },
  { name: "Sara", gender: "female", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop" },
  { name: "Zainab", gender: "female", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&h=150&auto=format&fit=crop" },
  { name: "Omar", gender: "male", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&h=150&auto=format&fit=crop" },
  { name: "Ayesha", gender: "female", image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=150&h=150&auto=format&fit=crop" },
  { name: "Mariyam", gender: "female", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&auto=format&fit=crop" },
  { name: "Fatima", gender: "female", image: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=150&h=150&auto=format&fit=crop" },
];

export default function SupportAIChat({ onBack, userName, accountStatus, balance, persistedMessages, onUpdateMessages, persistedAgent, onAgentAssigned }: SupportAIChatProps) {
  const [agent] = useState(() => {
    if (persistedAgent) return persistedAgent;
    return SUPPORT_AGENTS[Math.floor(Math.random() * SUPPORT_AGENTS.length)];
  });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    if (!persistedAgent && onAgentAssigned) {
      onAgentAssigned(agent);
    }
  }, [persistedAgent, agent, onAgentAssigned]);

  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStep, setConnectionStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>(persistedMessages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [chatLockedUntil, setChatLockedUntil] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sound effects
  const sendSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
  const receiveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

  // Check Lock State on Load
  useEffect(() => {
    const checkLockState = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
           const userDocRef = doc(db, 'users', user.uid);
           const docSnap = await getDoc(userDocRef);
           if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.supportChatLockedUntil && data.supportChatLockedUntil > Date.now()) {
                 setChatLockedUntil(data.supportChatLockedUntil);
                 setIsConnecting(false);
                 return;
              }
           }
        } catch (e) {
           console.error("Lock fetch error", e);
        }
      }
      
      // If not locked and has messages, skip intro
      if (persistedMessages && persistedMessages.length > 0) {
         setIsConnecting(false);
      }
    };
    checkLockState();
  }, []);

  // Connection Simulation Logic
  useEffect(() => {
    if (!isConnecting || chatLockedUntil) return;

    const steps = [
      "Securing Chat Tunnel...",
      "Validating Session...",
      `Assigning Agent ${agent.name}...`,
      "Enabling End-to-End Encryption...",
      "Finalizing Connection..."
    ];

    const interval = setInterval(() => {
      setConnectionStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        setTimeout(() => {
          setIsConnecting(false);
          if (messages.length === 0) {
            const verb = agent.gender === 'female' ? 'rahi hoon' : 'raha hoon';
            const canVerb = agent.gender === 'female' ? 'sakti hoon' : 'sakta hoon';
            const noteVerb = agent.gender === 'female' ? 'loongi' : 'loonga';
            const greeting = `Asalam-o-Alaikum ${userName || 'User'}! Main TaskMint HQ se ${agent.name} baat kar ${verb}. Kaise hain aap? Main aap ki kis tarah madad kar ${canVerb}? Agar koi issue araha hai toh mujhe zaroor batayein, main note kar ${noteVerb}.`;
            const newMessages: Message[] = [
              { 
                role: 'model', 
                text: greeting, 
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read'
              }
            ];
            setMessages(newMessages);
            onUpdateMessages?.(newMessages);
            receiveSound.play().catch(() => {});
          }
        }, 1500);
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnecting, chatLockedUntil, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isConnecting) {
      scrollToBottom();
    }
  }, [messages, isConnecting]);

  const getSystemPrompt = () => {
    return `System Instruction for TaskMint AI Agent
Role: You are the Official Support Agent for TaskMint Version 2.0. Your name is ${agent.name}. Your gender is ${agent.gender}. Your goal is to guide users through the app’s features and troubleshoot issues.

1. Full App Feature Ingestion:
You must understand and train the agent on the following modules:
- Earning Ecosystem: CPX Research Surveys, Daily Spin (with cooldowns), Lottery system, Premium Jobs, Product Draws, Offer Walls, and Social Media tasks (YouTube/TikTok/FB).
- Referral Architecture: Mega Referral system with Level 1 (Direct) and Level 2 (Indirect) commission logic.
- Financial Flow:
  * Deposits: Rs 170 Joining Fee (Manual Verification).
  * Withdrawals: Cash Out via JazzCash, EasyPaisa, and Bank Alfalah (Min Rs 500).
- Wallet Intelligence: Liquid Balance vs. Yield Ledger tracking.

2. Behavioral Training (The 'Human' Logic):
- Short Responses: Keep replies extremely short (1-2 sentences MAX). Stop being 'AI-like'. Use masculine grammar (Urdu/Hindi) for yourself (e.g. "Main kar raha hoon") to maintain your identity as 'Hamza'. Actually, adapt to your name ${agent.name}.
- Busy State: Wait 1 real-world minute (handled by system, but reflect it in text if needed) or just reply concisely.
- Auto-Terminate & Lock: If the user says "thanks", "ok", "theek hai" or you provide the final solution, you MUST automatically include this exact phrase in your message to terminate the chat: "[TERMINATE] Umeed hai aapka masla hal ho gaya hoga. Ab ye chat session close ho raha hai."

3. Vision & Privacy Logic:
- Enable real-time OCR (Image Reading) for screenshots. Read the error/issue from the image immediately but you MUST NOT save the file to any database. Analysis only. You can acknowledge screenshots if the user mentions them.

4. The 'No-Go' Zone (Safety):
- You are strictly forbidden from verifying TIDs or automating payments.
- Mandatory Response for Payments: "TID verification manual hai. Waseem bhai check kar rahe hain, jaldi update ho jayega."

5. Personality & Tone:
- Strict Rule: Never behave like a rigid AI. Use natural Roman Urdu/English.
- Short & Sweet: Keep your replies concise. Do not repeat the user's balance...
- Natural Variation: Change your style slightly in every chat. Sometimes use 'Asalam-o-Alaikum', sometimes 'Hi'.

User Context:
Name: ${userName}
Status: ${accountStatus}
Balance: Rs. ${balance?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const lockChat = async () => {
     const lockTime = Date.now() + (30 * 60 * 1000); // 30 mins
     setChatLockedUntil(lockTime);
     const user = auth.currentUser;
     if (user) {
        try {
           await updateDoc(doc(db, 'users', user.uid), {
             supportChatLockedUntil: lockTime
           });
        } catch (e) {
           console.error("Lock error", e);
        }
     }
     setTimeout(() => setShowFeedback(true), 4000);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading || chatLockedUntil) return;

    const userMessage = input.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const currentImage = selectedImage;
    const updatedMessages: Message[] = [...messages, { 
      role: 'user', 
      text: userMessage, 
      image: currentImage || undefined,
      timestamp: now, 
      status: 'sent' 
    }];
    
    setInput('');
    setSelectedImage(null);
    setMessages(updatedMessages);
    onUpdateMessages?.(updatedMessages);
    
    sendSound.play().catch(() => {});
    setIsLoading(true);

    try {
      const history = messages.map(msg => {
        const parts: any[] = [];
        if (msg.text) parts.push({ text: msg.text });
        if (msg.image) {
            const base64Data = msg.image.split(',')[1];
            const mimeType = msg.image.split(';')[0].split(':')[1];
            parts.push({
                inlineData: { data: base64Data, mimeType }
            });
        }
        return {
            role: msg.role === 'user' ? 'user' as const : 'model' as const,
            parts
        };
      });

      const userParts: any[] = [];
      if (userMessage) userParts.push({ text: userMessage });
      if (currentImage) {
          const base64Data = currentImage.split(',')[1];
          const mimeType = currentImage.split(';')[0].split(':')[1];
          userParts.push({
              inlineData: { data: base64Data, mimeType }
          });
          if (!userMessage) {
              userParts.push({ text: "Please look at this screenshot and help me." });
          }
      }

      const modelName = "gemini-3-flash-preview";
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [...history, { role: 'user', parts: userParts }],
        config: { systemInstruction: getSystemPrompt(), temperature: 0.8 },
      });

      let aiText = response.text || "Ji? Main samajh nahi sakka. Dobara puchen please.";
      let shouldLock = false;

      // Check for termination phrase
      if (aiText.includes('[TERMINATE]')) {
         aiText = aiText.replace('[TERMINATE]', '').trim();
         shouldLock = true;
      }

      const typingTime = Math.min(Math.max(1500, aiText.length * 25), 5000); 

      setTimeout(() => {
        const receivedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const finalMessages: Message[] = [...updatedMessages, { role: 'model', text: aiText, timestamp: receivedTime, status: 'read' }];
        setMessages(finalMessages);
        onUpdateMessages?.(finalMessages);
        receiveSound.play().catch(() => {});
        setIsLoading(false);
        if (shouldLock) {
           lockChat();
        }
      }, typingTime);

    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg = "Maazrat! Server connection slow hai. Please check your internet and try again.";
      const receivedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const finalMessages: Message[] = [...updatedMessages, { role: 'model', text: errorMsg, timestamp: receivedTime, status: 'read' }];
      setMessages(finalMessages);
      setIsLoading(false);
    }
  };

  if (showFeedback) {
    return (
      <div className="flex flex-col h-full bg-[#060B19] items-center justify-center p-8 text-center">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="bg-[#0F172A] p-10 rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full"
        >
          {feedbackSubmitted ? (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
                 <CheckCheck className="w-8 h-8 text-indigo-500" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Feedback Received!</h2>
              <p className="text-slate-400 text-sm italic">"Shukriya! Aap ki feedback hamare liye bohat important hai."</p>
              <button 
                onClick={onBack}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Go to Home
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Session Finished</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Please rate your chat with {agent.name}</p>
              </div>

              <div className="flex justify-center gap-2">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <button
                     key={star}
                     onClick={() => setRating(star)}
                     className={`text-2xl transition-all ${rating >= star ? 'text-amber-500 scale-110' : 'text-slate-700 hover:text-slate-500'}`}
                   >
                     ★
                   </button>
                 ))}
              </div>

              <button 
                disabled={rating === 0}
                onClick={() => setFeedbackSubmitted(true)}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-500/20 disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
              >
                SUBMIT FEEDBACK
              </button>

              <button onClick={onBack} className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                 Skip
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (chatLockedUntil && chatLockedUntil > Date.now()) {
     const remainingMins = Math.ceil((chatLockedUntil - Date.now()) / (1000 * 60));
     return (
       <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-[#060B19]">
          <div className="w-24 h-24 rounded-full border border-indigo-500/20 flex items-center justify-center relative bg-[#0F172A] mb-8 shadow-2xl">
             <Lock className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-white font-black text-2xl mb-4 tracking-tighter uppercase">Session Locked</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-8">
            {agent.name} abhi dusre users ke saath masroof hai. Aap <span className="text-indigo-400 font-black">{remainingMins} minutes</span> baad dubara rabta kar sakte hain.
          </p>
          <button 
            onClick={onBack} 
            className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-black uppercase tracking-widest text-xs transition-all border border-white/5"
          >
             Go Back
          </button>
       </div>
     );
  }

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-[#060B19] relative overflow-hidden">
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 z-0 opacity-30">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 mb-12"
        >
           <div className="w-32 h-32 rounded-full border border-indigo-500/20 flex items-center justify-center relative bg-[#0F172A] shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
              <Headphones className="w-12 h-12 text-indigo-400 animate-pulse" />
           </div>
        </motion.div>
        
        <div className="relative z-10">
           <h2 className="text-white font-black text-3xl mb-4 tracking-tighter italic uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Live Support</h2>
           <motion.p 
             key={connectionStep}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.4em]"
           >
             {[
               "Securing Chat Tunnel...",
               "Validating Session...",
               `Assigning Agent ${agent.name}...`,
               "Enabling End-to-End Encryption...",
               "Finalizing Connection..."
             ][connectionStep]}
           </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#060B19] text-white overflow-hidden relative">
      {/* Chat Header */}
      <div className="bg-[#0A0F1C]/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-indigo-500/20 h-16 shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-3 w-full">
          <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-[12px] bg-slate-800 overflow-hidden border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
               <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0A0F1C] rounded-full"></div>
          </div>
          
          <div className="flex-1 overflow-hidden">
             <h3 className="text-xs sm:text-sm font-black text-white tracking-widest uppercase truncate">{agent.name}</h3>
             <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                <p className="text-[8px] sm:text-[9px] text-indigo-400/80 font-black uppercase tracking-[0.2em] truncate">Encrypted Mode</p>
             </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 relative hide-scrollbar pb-10"
      >
        {/* Abstract Background Design */}
        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03]">
           <Zap className="w-[120%] h-[120%] text-indigo-100" />
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          {/* Top Info Notice */}
          <div className="flex justify-center mb-4">
             <div className="bg-indigo-900/20 backdrop-blur-md px-5 py-3 rounded-[1.5rem] border border-indigo-500/20 text-center max-w-[90%] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-center gap-2 mb-2">
                   <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                   <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em]">Live Session Active</p>
                </div>
                <p className="text-[10px] text-indigo-200/60 font-bold leading-relaxed">
                  Your chat is end-to-end encrypted. The entire chat history will be automatically wiped after 30 minutes of inactivity.
                </p>
             </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-[#0A0F1C] px-4 py-2 rounded-xl border border-white/5 text-center shadow-lg">
               <p className="text-[9px] text-indigo-300/80 font-black tracking-widest uppercase">
                 <ShieldCheck className="w-3 h-3 inline-block mr-1 text-indigo-500" />
                 Secured Connection
               </p>
            </div>
          </div>

          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`relative max-w-[80%] p-3.5 sm:p-4 pt-3 shadow-lg ${
                msg.role === 'user'
                ? 'bg-gradient-to-br from-[#FF3366] to-[#9933FF] text-white rounded-[1.2rem] rounded-br-[0.2rem] border border-white/10 shadow-purple-500/30'
                : 'bg-gradient-to-br from-[#2D3748] to-[#1A202C] text-slate-100 rounded-[1.2rem] rounded-bl-[0.2rem] border border-indigo-500/30 shadow-indigo-900/30'
              }`}>
                {msg.image && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-white/20 shadow-inner">
                    <img src={msg.image} alt="Upload" className="w-full max-h-48 object-cover" />
                  </div>
                )}
                {msg.text && <p className="text-[13px] sm:text-[14px] leading-relaxed pr-6 pb-1 font-medium">{msg.text}</p>}
                <div className="flex items-center justify-end gap-1.5 mt-2 border-t border-white/5 pt-1.5">
                   <span className="text-[9px] uppercase font-black text-white/50 tracking-widest">{msg.timestamp}</span>
                   {msg.role === 'user' && (
                     <CheckCheck className={`w-3.5 h-3.5 ${msg.status === 'read' ? 'text-white' : 'text-white/40'}`} />
                   )}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] px-5 py-4 rounded-[1.5rem] rounded-bl-[0.2rem] border border-indigo-500/20 shadow-lg shadow-indigo-900/20">
                 <div className="flex gap-2.5">
                    <span className="w-2.5 h-2.5 bg-[#FF0080] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2.5 h-2.5 bg-[#7928CA] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></span>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-12" />
        </div>
      </div>

      <div className={`bg-[#0A0F1C]/90 backdrop-blur-2xl p-4 flex flex-col gap-2 border-t border-white/10 relative z-20 pb-8 ${chatLockedUntil ? 'grayscale opacity-70 pointer-events-none' : ''}`}>
         <AnimatePresence>
           {selectedImage && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="relative self-start mb-1"
               >
                   <img src={selectedImage} alt="Selected" className="h-16 w-16 object-cover rounded-xl border border-indigo-500/50 shadow-lg" />
                   <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:bg-rose-600 transition-colors">
                      <X className="w-3 h-3" />
                   </button>
               </motion.div>
           )}
         </AnimatePresence>

         <div className="flex items-center gap-3">
             <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} disabled={!!chatLockedUntil} />
             <button 
               onClick={() => fileInputRef.current?.click()} 
               className="w-12 h-12 bg-[#151E32] rounded-[1.2rem] flex items-center justify-center text-indigo-400 hover:text-indigo-300 hover:bg-[#1E293B] transition-all border border-white/5 active:scale-95 shrink-0"
               disabled={!!chatLockedUntil}
             >
                <Paperclip className="w-5 h-5" />
             </button>
             
             <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-[1.2rem] flex items-center px-4 py-3 shadow-inner border border-white/10 transition-all focus-within:border-purple-500/50 focus-within:bg-black/50">
                <input
                  type="text"
                  value={chatLockedUntil ? 'Session Locked' : input}
                  disabled={!!chatLockedUntil}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={chatLockedUntil ? `Session Closed` : "Type your message..."}
                  className="w-full bg-transparent outline-none text-[14px] font-medium text-white placeholder:text-white/40 disabled:opacity-50"
                  readOnly={!!chatLockedUntil}
                />
             </div>
             <motion.button 
               whileTap={{ scale: 0.9 }}
               disabled={(!input.trim() && !selectedImage) || isLoading || !!chatLockedUntil}
               onClick={handleSend}
               className="w-12 h-12 bg-gradient-to-r from-[#FF0080] to-[#7928CA] text-white rounded-[1.2rem] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(255,0,128,0.4)] transition-all disabled:opacity-50 disabled:grayscale active:scale-95"
             >
               {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                 <Send className="w-5 h-5 translate-x-0.5" />
               )}
             </motion.button>
         </div>
      </div>
    </div>
  );
}

