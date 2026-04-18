import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Smartphone, 
  History, 
  Clock, 
  XCircle,
  ArrowLeft,
  Copy,
  ExternalLink
} from 'lucide-react';
import { rtdb, auth } from '../../firebase';
import { ref, set, update, onValue, push } from 'firebase/database';

interface ActivationTabProps {
  onBack: () => void;
  appSettings: {
    activationFee: number;
    paymentNumber: string;
    paymentName: string;
  };
  userName: string;
}

export default function ActivationTab({ onBack, appSettings, userName }: ActivationTabProps) {
  const [transactionId, setTransactionId] = useState('');
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
      const whatsappNumber = "923338739929";
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
          className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Account Activation</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
            Joining Fee: <span className="text-indigo-600">Rs {appSettings.activationFee}</span>
          </p>
        </div>
      </div>

      {/* Instructions Card (Always Visible) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6"
      >
        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
              Neeche diye gaye number par <span className="text-amber-900 font-black text-lg">Rs {appSettings.activationFee}</span> send karein aur button daba kar WhatsApp par screenshot bhej dein.
            </p>
          </div>
        </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setMethod('EasyPaisa')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 border-emerald-500 bg-emerald-50`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-[10px]">EP</div>
              <span className="text-xs font-bold">EasyPaisa</span>
            </button>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Account Title</span>
              <span className="text-sm font-black text-amber-400">{appSettings.paymentName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-wider">{appSettings.paymentNumber}</span>
                <button onClick={() => copyToClipboard(appSettings.paymentNumber)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleWhatsAppClick}
              disabled={isSubmitting}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
          className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 text-center"
        >
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Verification Pending</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[200px] mx-auto mb-6">
            Your request is being verified. This usually takes <span className="text-slate-900 font-bold">1-6 hours</span>.
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-400 uppercase">TID</span>
              <span className="text-slate-900">{activeRequest.transactionId}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-400 uppercase">Method</span>
              <span className="text-slate-900">{activeRequest.method}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Activation History</h3>
        </div>

        <div className="space-y-3">
          {history.length > 0 ? history.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                  item.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {item.status === 'Approved' ? <CheckCircle2 className="w-5 h-5" /> :
                   item.status === 'Rejected' ? <XCircle className="w-5 h-5" /> :
                   <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Rs {item.amount}</p>
                  <p className="text-[9px] text-slate-400 font-bold">{new Date(item.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-black uppercase ${
                  item.status === 'Approved' ? 'text-emerald-600' :
                  item.status === 'Rejected' ? 'text-red-600' :
                  'text-amber-600'
                }`}>
                  {item.status}
                </p>
                <p className="text-[9px] text-slate-400 font-bold">TID: {item.transactionId}</p>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200">
              <p className="text-xs text-slate-400 font-bold">No history found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
