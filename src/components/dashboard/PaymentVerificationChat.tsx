import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bot, CheckCircle2, XCircle, Clock, MessageCircle, ShieldCheck } from 'lucide-react';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

interface PaymentVerificationChatProps {
  depositId: string;
  whatsappNumber?: string;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  text: string;
  kind?: string;
  createdAt?: any;
}

// Live verification thread for an in-app screenshot deposit. The proof
// image is the user's first bubble; every agent update (received,
// approved, rejected with reason) is posted by the TaskMint agent into
// deposits/{id}/chat and appears here in real time.
export default function PaymentVerificationChat({ depositId, whatsappNumber, onBack }: PaymentVerificationChatProps) {
  const [deposit, setDeposit] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const unsubDep = onSnapshot(doc(db, 'deposits', depositId), snap => {
      if (snap.exists()) setDeposit({ id: snap.id, ...snap.data() });
    });
    getDoc(doc(db, 'deposits', depositId, 'proof', 'image')).then(snap => {
      if (snap.exists()) setProofUrl((snap.data() as any).data || '');
    }).catch(() => {});
    const q = query(collection(db, 'deposits', depositId, 'chat'), orderBy('createdAt', 'asc'));
    const unsubChat = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }, () => {});
    return () => { unsubDep(); unsubChat(); };
  }, [depositId]);

  const status = (deposit?.status || 'Pending').toLowerCase();
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const wa = whatsappNumber || '923338739929';

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white flex flex-col pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-black/20 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <Bot className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black leading-tight">TaskMint Agent</p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Payment Verification</p>
        </div>
        {isApproved ? (
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>
        ) : isRejected ? (
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5 rounded-lg"><XCircle className="w-3.5 h-3.5" /> Rejected</span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-lg"><Clock className="w-3.5 h-3.5" /> Verifying</span>
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 px-4 py-5 space-y-4 max-w-md w-full mx-auto">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Screenshot received — verification started. Usually verified within about 2 minutes.
          </span>
        </div>

        {/* User's proof bubble */}
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-emerald-600/90 rounded-3xl rounded-br-md p-2.5">
            {proofUrl ? (
              <img src={proofUrl} alt="Payment screenshot" className="rounded-2xl max-h-64 w-auto" />
            ) : (
              <div className="w-44 h-32 rounded-2xl bg-black/20 animate-pulse" />
            )}
            <p className="text-[10px] font-bold text-emerald-100 mt-2 px-1">
              Payment screenshot • Rs. {deposit?.amount?.toLocaleString?.() || deposit?.amount || ''}
              {deposit?.type === 'activation' ? ' • Joining fee' : ''}
            </p>
          </div>
        </div>

        {/* Agent messages */}
        {messages.map(msg => (
          <div key={msg.id} className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className={`max-w-[80%] rounded-3xl rounded-bl-md px-4 py-3 ${msg.kind === 'rejected' ? 'bg-rose-500/10 border border-rose-500/20' : msg.kind === 'approved' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-[#15181D] border border-white/5'}`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">TaskMint Agent</p>
              <p className="text-[13px] font-medium leading-relaxed text-zinc-100">{msg.text}</p>
            </div>
          </div>
        ))}

        {!isApproved && !isRejected && (
          <p className="text-center text-[11px] font-bold text-zinc-500 animate-pulse pt-1">Verification in progress — please wait…</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 max-w-md w-full mx-auto">
        <a
          href={`https://wa.me/${wa}?text=${encodeURIComponent(`Assalam-o-Alaikum! My TaskMint payment verification (Deposit ID: ${depositId}) needs attention.`)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#1fb857] text-black font-black text-xs uppercase tracking-wider rounded-xl active:scale-[0.98] transition"
        >
          <MessageCircle className="w-4 h-4" /> Need help? Chat on WhatsApp
        </a>
        <button onClick={onBack} className="w-full h-11 mt-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-wider rounded-xl transition">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
