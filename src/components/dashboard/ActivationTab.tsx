import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, History, Clock, XCircle, ArrowLeft, Copy, ExternalLink, Camera, Upload, MessageCircle } from 'lucide-react';
import { rtdb, auth, db } from '../../firebase';
import { ref, set, update, onValue } from 'firebase/database';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sha256Hex, compressImage } from '../../utils/proofImage';

import PaymentQrCard from '../PaymentQrCard';

interface ActivationTabProps {
  onBack: () => void;
  appSettings: {
    activationFee: number;
    paymentNumber: string;
    paymentName: string;
  };
  userName: string;
  onOpenVerification?: (depositId: string) => void;
}

export default function ActivationTab({ onBack, appSettings, userName, onOpenVerification }: ActivationTabProps) {
  const [transactionId, setTransactionId] = useState('');
  const [proofMethod, setProofMethod] = useState<'upload' | 'whatsapp'>('upload');
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const [proofHash, setProofHash] = useState('');

  const handleProofFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const [hash, dataUrl] = await Promise.all([sha256Hex(file), compressImage(file)]);
      setProofHash(hash);
      setProofDataUrl(dataUrl);
    } catch {
      alert('Could not read that image. Please try another screenshot.');
    }
  };

  const handleUploadSubmit = async () => {
    if (!auth.currentUser) return;
    if (!proofDataUrl) {
      alert('Please upload your payment screenshot first.');
      return;
    }
    setIsSubmitting(true);
    try {
      const depositId = `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const data = {
        id: depositId,
        userId: auth.currentUser.uid,
        userName: userName,
        amount: appSettings.activationFee,
        method,
        transactionId: 'In-app upload',
        date: new Date().toISOString(),
        status: 'Pending',
        type: 'activation',
        description: 'Account Activation Fee',
        timestamp: Date.now(),
        proofMethod: 'upload',
        screenshotHash: proofHash,
        hasProof: true
      };

      // Firestore deposit record — the proof image and the verification
      // chat hang off it, and the admin panel reviews the screenshot there.
      await setDoc(doc(db, 'deposits', depositId), data);
      await setDoc(doc(db, 'deposits', depositId, 'proof', 'image'), {
        userId: auth.currentUser.uid,
        data: proofDataUrl,
        createdAt: serverTimestamp()
      });

      // RTDB joining queue (same destination as the WhatsApp flow)
      await set(ref(rtdb, `activation_requests/${auth.currentUser.uid}/latest_request`), data);
      await set(ref(rtdb, `pending_requests/${auth.currentUser.uid}`), { ...data, requestId: 'latest_request' });
      const statusRef = ref(rtdb, `users/${auth.currentUser.uid}`);
      await update(statusRef, { status: 'pending' });

      if (onOpenVerification) {
        onOpenVerification(depositId);
      } else {
        alert('Screenshot submitted! Your payment is being verified.');
      }
    } catch (error) {
      console.error('Activation upload error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const [method, setMethod] = useState<'EasyPaisa'>('EasyPaisa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen for activation requests history in RTDB
    const historyRef = ref(rtdb, `activation_requests/${auth.currentUser.uid}`);
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        })).sort((a, b) => b.timestamp - a.timestamp);
        setHistory(list);
        
        // Find if there's a pending one
        const pending = list.find(item => item.status === 'Pending');
        setActiveRequest(pending || null);
      } else {
        setHistory([]);
        setActiveRequest(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleWhatsAppClick = async () => {
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const requestId = 'latest_request';
      const data = {
        userId: auth.currentUser.uid,
        userName: userName,
        amount: appSettings.activationFee,
        method,
        transactionId: 'Sent via WhatsApp', // Dummy value since we removed the input
        date: new Date().toISOString(),
        status: 'Pending',
        type: 'activation',
        description: 'Account Activation Fee',
        timestamp: Date.now()
      };

      // Save to RTDB activation_requests (for history)
      await set(ref(rtdb, `activation_requests/${auth.currentUser.uid}/${requestId}`), data);

      // Also update the main pending_requests path for admin convenience (as requested before)
      await set(ref(rtdb, `pending_requests/${auth.currentUser.uid}`), {
        ...data,
        requestId // link to the history item
      });

      // Update status to pending in RTDB
      const statusRef = ref(rtdb, `users/${auth.currentUser.uid}`);
      await update(statusRef, { status: 'pending' });

      // Redirect to WhatsApp
      const whatsappNumber = (appSettings as any)?.whatsappNumber || "923338739929";
      const message = `🌟 *TASKMINT OFFICIAL* 🌟\n\n*Hi Admin!* 👋\nMera naam *${userName || 'User'}* hai. ✨\n\nMaine *Rs. ${appSettings.activationFee}* Joining Fee pay kar di hai. ✅\nYe raha mera *Payment Screenshot* as a proof. 📸\n\n*Please mera account jaldi active kar dein!* 🙏🔥\n\n_Sent via TaskMint App_`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

    } catch (error) {
      console.error("Activation submission error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={onBack}
          className="p-2 bg-[#15181D] rounded-xl shadow-sm hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-300" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Account Activation</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
            Joining Fee: <span className="text-teal-400">Rs {appSettings.activationFee}</span>
          </p>
        </div>
      </div>

      {/* Instructions Card (Always Visible) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#15181D] rounded-[2rem] p-6 shadow-sm border border-white/5 space-y-6"
      >
        <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-emerald-300 leading-relaxed">
              Neeche diye gaye number par <span className="text-emerald-200 font-black text-lg">Rs {appSettings.activationFee}</span> send karein aur button daba kar WhatsApp par screenshot bhej dein.
            </p>
          </div>
        </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setMethod('EasyPaisa')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 border-emerald-500 bg-emerald-500/10`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-[10px]">EP</div>
              <span className="text-xs font-bold">EasyPaisa</span>
            </button>
          </div>

          <div className="bg-emerald-600 rounded-2xl p-5 text-white space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Account Title</span>
              <span className="text-sm font-black text-emerald-400">{appSettings.paymentName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-wider">{appSettings.paymentNumber}</span>
                <button onClick={() => copyToClipboard(appSettings.paymentNumber)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                </button>
              </div>
            </div>
          </div>

          {/* EasyPaisa QR — fixed at the joining fee */}
          <PaymentQrCard amount={appSettings.activationFee} />

          {/* Payment proof method */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProofMethod('upload')}
                className={`text-left rounded-2xl border px-3.5 py-3 transition ${proofMethod === 'upload' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:border-white/25'}`}
              >
                <span className="flex items-center gap-1.5 text-xs font-black text-white"><Upload className="w-3.5 h-3.5 text-emerald-400" /> Upload Screenshot</span>
                <span className="inline-block mt-1.5 text-[8px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">Fast</span>
                <span className="block text-[10px] font-semibold text-zinc-400 mt-1.5 leading-snug">Auto verification — about 2 minutes</span>
              </button>
              <button
                type="button"
                onClick={() => setProofMethod('whatsapp')}
                className={`text-left rounded-2xl border px-3.5 py-3 transition ${proofMethod === 'whatsapp' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:border-white/25'}`}
              >
                <span className="flex items-center gap-1.5 text-xs font-black text-white"><MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp</span>
                <span className="inline-block mt-1.5 text-[8px] font-black uppercase tracking-widest text-zinc-300 bg-white/10 border border-white/15 px-1.5 py-0.5 rounded">Manual</span>
                <span className="block text-[10px] font-semibold text-zinc-400 mt-1.5 leading-snug">Send proof on WhatsApp instead</span>
              </button>
            </div>
            {proofMethod === 'upload' && (
              <label className="mt-3 flex flex-col items-center justify-center gap-2 bg-white/5 border border-dashed border-white/15 rounded-2xl px-4 py-5 cursor-pointer hover:border-emerald-500/50 transition">
                {proofDataUrl ? (
                  <img src={proofDataUrl} alt="Payment screenshot preview" className="max-h-44 rounded-lg" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-zinc-500" />
                    <span className="text-[11px] font-bold text-zinc-400">Tap to upload payment screenshot</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleProofFile} />
              </label>
            )}
          </div>

          <div className="space-y-4">
            <button
              onClick={proofMethod === 'upload' ? handleUploadSubmit : handleWhatsAppClick}
              disabled={isSubmitting}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : proofMethod === 'upload' ? (
                <>Submit Screenshot & Track Verification <ExternalLink className="w-5 h-5" /></>
              ) : (
                <>Pay & Send Proof on WhatsApp <ExternalLink className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </motion.div>

      {/* Active Request Status */}
      {activeRequest && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#15181D] rounded-[2rem] p-8 shadow-sm border border-white/5 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">Verification Pending</h3>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[200px] mx-auto mb-6">
            Your request is being verified. This usually takes <span className="text-white font-bold">1-6 hours</span>.
          </p>
          <div className="bg-white/5 rounded-2xl p-4 text-left space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-zinc-500 uppercase">TID</span>
              <span className="text-white">{activeRequest.transactionId}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-zinc-500 uppercase">Method</span>
              <span className="text-white">{activeRequest.method}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <History className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Activation History</h3>
        </div>

        <div className="space-y-3">
          {history.length > 0 ? history.map((item) => (
            <div key={item.id} className="bg-[#15181D] rounded-2xl p-4 shadow-sm border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.status === 'Approved' ? 'bg-emerald-100 text-emerald-400' :
                  item.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                  'bg-emerald-100 text-emerald-400'
                }`}>
                  {item.status === 'Approved' ? <CheckCircle2 className="w-5 h-5" /> :
                   item.status === 'Rejected' ? <XCircle className="w-5 h-5" /> :
                   <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-black text-white">Rs {item.amount}</p>
                  <p className="text-[9px] text-zinc-500 font-bold">{new Date(item.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-black uppercase ${
                  item.status === 'Approved' ? 'text-emerald-400' :
                  item.status === 'Rejected' ? 'text-red-600' :
                  'text-emerald-400'
                }`}>
                  {item.status}
                </p>
                <p className="text-[9px] text-zinc-500 font-bold">TID: {item.transactionId}</p>
              </div>
            </div>
          )) : (
            <div className="bg-[#15181D] rounded-2xl p-8 text-center border border-dashed border-white/10">
              <p className="text-xs text-zinc-500 font-bold">No history found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
