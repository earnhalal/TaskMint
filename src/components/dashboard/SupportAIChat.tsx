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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
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

  const [isConnecting, setIsConnecting] = useState(() => {
    // If we have messages, we are already connected
    if (persistedMessages && persistedMessages.length > 0) return false;
    return true;
  });
  const [connectionStep, setConnectionStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>(persistedMessages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Sound effects
  const sendSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
  const receiveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

  // Connection Simulation Logic
  useEffect(() => {
    if (!isConnecting) return;

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
          const verb = agent.gender === 'female' ? 'rahi hoon' : 'raha hoon';
          const canVerb = agent.gender === 'female' ? 'sakti hoon' : 'sakta hoon';
          const greeting = `Asalam-o-Alaikum ${userName || 'User'}! Main TaskMint HQ se ${agent.name} baat kar ${verb}. Kaise hain aap? Main aap ki kis tarah madad kar ${canVerb}? Agar koi issue araha hai toh mujhe zaroor batayein, main note kar loongi.`;
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
        }, 1500);
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isConnecting) {
      scrollToBottom();
    }
  }, [messages, isConnecting]);

  const getSystemPrompt = () => {
    const verb = agent.gender === 'female' ? 'rahi hoon' : 'raha hoon';
    const canVerb = agent.gender === 'female' ? 'sakti hoon' : 'sakta hoon';
    
    return `You are "${agent.name}", a standard human support representative working at the TaskMint office in Pakistan.
### IDENTITY & TONE:
1. You are 100% human. Talk like a person using Roman Urdu/Hinglish (e.g., "G", "Bilkul", "Thek hai").
2. Your gender is ${agent.gender}. Use correct Urdu grammar (rahi/raha, sakti/sakta).
3. If a user says there is an ERROR or PROBLEM, listen attentively and say "Main ye note kar ${verb} aur technical team ko reports bhej ${verb}."
4. Stay helpful and professional. You can see user balance and status.

### TASKMINT KNOWLEDGE:
- Bronze (Free), Silver (2x), Gold (Max Earnings).
- Ad Earnings: Rs. 2-5 per ad.
- Withdraw: Min Rs. 500 via EasyPaisa/JazzCash.
- Referral: Rs. 100 flat reward.
- Activation: Send screenshot to WhatsApp Admin (+923338739929).

User Context: ${userName}, Status: ${accountStatus}, Balance: Rs. ${balance}.`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const updatedMessages: Message[] = [...messages, { role: 'user', text: userMessage, timestamp: now, status: 'sent' }];
    setInput('');
    setMessages(updatedMessages);
    onUpdateMessages?.(updatedMessages);
    
    sendSound.play().catch(() => {});
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      const modelName = "gemini-3-flash-preview";
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
        config: { systemInstruction: getSystemPrompt(), temperature: 0.8 },
      });

      const aiText = response.text || "Ji? Main samajh nahi sakka. Dobara puchen please.";
      const typingTime = Math.min(Math.max(1500, aiText.length * 25), 5000); 

      setTimeout(() => {
        const receivedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const finalMessages: Message[] = [...updatedMessages, { role: 'model', text: aiText, timestamp: receivedTime, status: 'read' }];
        setMessages(finalMessages);
        onUpdateMessages?.(finalMessages);
        receiveSound.play().catch(() => {});
        setIsLoading(false);
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
          
          <div className="flex items-center gap-2 shrink-0">
             <button 
               onClick={() => setShowFeedback(true)}
               className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
             >
                End
             </button>
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
              <div className={`relative max-w-[85%] p-4 pt-3 rounded-[1.5rem] shadow-[0_5px_20px_rgba(0,0,0,0.2)] ${
                msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm border border-indigo-400/30'
                : 'bg-[#151E32] text-slate-200 rounded-bl-sm border border-white/10'
              }`}>
                <p className="text-[13px] sm:text-[14px] leading-relaxed pr-6 pb-1 font-medium">{msg.text}</p>
                <div className="flex items-center justify-end gap-1.5 mt-2 border-t border-white/5 pt-1.5">
                   <span className="text-[8px] uppercase font-black text-white/40 tracking-widest">{msg.timestamp}</span>
                   {msg.role === 'user' && (
                     <CheckCheck className={`w-3.5 h-3.5 ${msg.status === 'read' ? 'text-white' : 'text-white/30'}`} />
                   )}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-[#151E32] px-5 py-4 rounded-[1.5rem] rounded-bl-sm border border-white/10 shadow-lg">
                 <div className="flex gap-2.5">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-12" />
        </div>
      </div>

      {/* Input */}
      <div className="bg-[#0A0F1C]/90 backdrop-blur-2xl p-4 flex items-center gap-3 border-t border-white/10 relative z-20 pb-8">
         <div className="flex-1 bg-[#151E32] rounded-[1.2rem] flex items-center px-4 py-3 shadow-inner border border-white/5 transition-all focus-within:border-indigo-500/50">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="w-full bg-transparent outline-none text-[14px] font-medium text-white placeholder:text-slate-500"
            />
         </div>
         <motion.button 
           whileTap={{ scale: 0.9 }}
           disabled={!input.trim() || isLoading}
           onClick={handleSend}
           className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-[1.2rem] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 disabled:grayscale active:scale-95"
         >
           {isLoading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
           ) : (
             <Send className="w-5 h-5 translate-x-0.5" />
           )}
         </motion.button>
      </div>
    </div>
  );
}

