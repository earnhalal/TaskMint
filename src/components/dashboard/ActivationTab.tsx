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
  CheckCircle, 
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
  const [method, setMethod] = useState<'EasyPaisa' | 'JazzCash'>('EasyPaisa');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) return;
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const requestId = push(ref(rtdb, `activation_requests/${auth.currentUser.uid}`)).key;
      const data = {
        userId: auth.currentUser.uid,
        userName: userName,
        amount: appSettings.activationFee,
        method,
        transactionId,
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

      setTransactionId('');
      alert("Activation request submitted successfully!");
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
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Joining Fee: Rs {appSettings.activationFee}</p>
        </div>
      </div>

      {/* Instructions Card */}
      {!activeRequest && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6"
        >
          <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
              Please pay the joining fee of <span className="text-amber-900 font-black">Rs {appSettings.activationFee}</span> to the account below to unlock all earning features.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod('EasyPaisa')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'EasyPaisa' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-[10px]">EP</div>
              <span className="text-xs font-bold">EasyPaisa</span>
            </button>
            <button
              onClick={() => setMethod('JazzCash')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'JazzCash' ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-[10px]">JC</div>
              <span className="text-xs font-bold">JazzCash</span>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Transaction ID (TID)</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter 10-12 digit TID"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !transactionId}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>Submit Verification <CheckCircle2 className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </motion.div>
      )}

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
                  {item.status === 'Approved' ? <CheckCircle className="w-5 h-5" /> :
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
