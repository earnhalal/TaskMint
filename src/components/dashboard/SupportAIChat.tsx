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
  Headphones
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
}

// Support Agent Identities
const SUPPORT_AGENTS = [
  { name: "Ali", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ali" },
  { name: "Hamza", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hamza" },
  { name: "Sara", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara" },
  { name: "Zainab", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zainab" },
  { name: "Omar", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Omar" },
  { name: "Aisha", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha" },
];

export default function SupportAIChat({ onBack, userName, accountStatus, balance }: SupportAIChatProps) {
  const [agent] = useState(() => SUPPORT_AGENTS[Math.floor(Math.random() * SUPPORT_AGENTS.length)]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sound effects
  const sendSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
  const receiveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');

  useEffect(() => {
    const greeting = `Asalam-o-Alaikum ${userName || 'User'}! Main TaskMint Support se ${agent.name} baat kar raha hoon. Aap ko TaskMint ke baare mein koi bhi madad chahiye to zaroor batayein. Main aap ki kaise madad kar sakta hoon?`;
    setMessages([
        { 
          role: 'model', 
          text: greeting, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        }
    ]);
  }, [userName, agent.name]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSystemPrompt = () => `You are "${agent.name}", a standard human support agent for TaskMint Version 2.0.
### PERSONALITY & TONE:
1. Act like a REAL human (Customer Support Representative).
2. Use casual but professional "Hinglish" or "Roman Urdu" (e.g., "G zaroor", "Bilkul", "Humein dukh hua sun kar").
3. NEVER say you are an AI, AI model, or Bot. If asked, laugh it off like a human ("Nahi nahi, main bilkul insaan hoon haha").
4. Respond naturally with emotions where appropriate (empathy, excitement).
5. Only answer TaskMint related questions.

### TASKMINT KNOWLEDGE:
- Watch Ads: Rs. 1-3 reward.
- Referral: Rs. 125 per active ref.
- Activation: Check current tab. WhatsApp Admin +923338739929.
- Withdraw: JazzCash/EasyPaisa.

User Details: Name: ${userName}, Status: ${accountStatus}, Balance: Rs. ${balance}.`;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: now, status: 'sent' }]);
    
    // Play send sound
    sendSound.play().catch(() => {});

    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: getSystemPrompt(),
          temperature: 0.7,
        },
      });

      const aiText = response.text || "Main samajh nahi saka. Kya aap apna sawal dobara pooch sakte hain?";
      
      // Artificial Delay (Simulate Typing)
      // Base delay 1s + length-based delay (e.g., 20ms per character)
      const typingTime = Math.min(Math.max(1500, aiText.length * 20), 4000);
      
      setTimeout(() => {
        const receivedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { role: 'model', text: aiText, timestamp: receivedTime, status: 'read' }]);
        receiveSound.play().catch(() => {});
        setIsLoading(false);
      }, typingTime);

    } catch (error) {
      console.error("AI Chat Error:", error);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: "Maaf kijiyega, meri taraf internet ka kuch masla lag raha hai. Please thori dair baad koshish karein.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        }]);
        setIsLoading(false);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b141a] text-white">
      {/* WhatsApp Header */}
      <div className="sticky top-0 z-30 bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors mr-1">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-white/10">
               <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#202c33] rounded-full"></div>
          </div>
          <div className="ml-1">
             <h3 className="text-sm font-bold text-white tracking-wide">{agent.name}</h3>
             <p className="text-[10px] text-[#00a884] font-medium">online</p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-white/60">
           <Video className="w-5 h-5 cursor-pointer hover:text-white/80 transition-colors" />
           <Phone className="w-4 h-4 cursor-pointer hover:text-white/80 transition-colors" />
           <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white/80 transition-colors" />
        </div>
      </div>

      {/* Chat Background Styling */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 relative"
        style={{
          backgroundImage: `url('https://i.pinimg.com/originals/85/70/f6/8570f6339d318933ef0c28307d896135.png')`,
          backgroundSize: '400px'
        }}
      >
        {/* Overlay for background opacity */}
        <div className="absolute inset-0 bg-[#0b141a]/90 z-0 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-3">
          {/* Encryption Notice */}
          <div className="flex justify-center mb-6">
            <div className="bg-[#182229] px-4 py-2 rounded-lg border border-white/5 flex items-center gap-2 max-w-[85%] text-center">
               <ShieldCheck className="w-3 h-3 text-[#d1d7db]" />
               <p className="text-[10px] text-[#8696a0] font-medium">
                 Messages are end-to-end encrypted. No one outside of this chat, not even TaskMint, can read them.
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
              <div className={`relative max-w-[88%] min-w-[80px] p-2.5 pt-2 rounded-xl shadow-md ${
                msg.role === 'user'
                ? 'bg-[#005c4b] text-white rounded-tr-none'
                : 'bg-[#202c33] text-[#d1d7db] rounded-tl-none'
              }`}>
                <p className="text-[13px] leading-relaxed pr-8 pb-3">{msg.text}</p>
                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                   <span className="text-[9px] text-white/50">{msg.timestamp}</span>
                   {msg.role === 'user' && (
                     msg.status === 'read' 
                     ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" /> 
                     : <CheckCheck className="w-3.5 h-3.5 text-white/30" />
                   )}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
               <div className="bg-[#202c33] px-3 py-2 rounded-xl rounded-tl-none flex items-center gap-2">
                 <div className="flex gap-1.5 py-1">
                    <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce"></span>
                 </div>
               </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* WhatsApp Input */}
      <div className="bg-[#202c33] p-3 flex items-center gap-2 pb-8 sm:pb-3">
         <div className="flex-1 bg-[#2a3942] rounded-xl flex items-center px-4 py-2.5 border border-white/5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message"
              className="w-full bg-transparent outline-none text-sm font-medium text-white placeholder:text-white/30"
            />
         </div>
         <button 
           disabled={!input.trim() || isLoading}
           onClick={handleSend}
           className="w-11 h-11 bg-[#00a884] text-white rounded-full flex items-center justify-center shrink-0 shadow-lg active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
         >
           <Send className="w-4.5 h-4.5 translate-x-0.5" />
         </button>
      </div>
    </div>
  );
}

