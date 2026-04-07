import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  Users, 
  Wallet, 
  Crown,
  Search,
  Filter,
  Settings,
  Save
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc,
  setDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase';

interface AdminPanelViewProps {
  onBack: () => void;
  onApproveActivation: (userId: string, depositId: string) => Promise<void>;
  onApprovePartner: (userId: string, requestId: string) => Promise<void>;
  onApproveDeposit: (userId: string, depositId: string, amount: number) => Promise<void>;
  onApproveWithdrawal: (userId: string, withdrawalId: string) => Promise<void>;
}

function SettingsView() {
  const [settings, setSettings] = useState({
    activationFee: 100,
    partnerFee: 2500,
    paymentNumber: '0312-3456789',
    paymentName: 'TaskMint Admin',
    referralBonusBasic: 30,
    referralBonusPartner: 70,
    indirectReferralBonus: 10
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'app_settings', 'global'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as any);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'app_settings', 'global'), settings);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-xs font-bold text-slate-400">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-amber-500" /> Payment & Fees
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Activation Fee (Rs)</label>
            <input 
              type="number" 
              value={settings.activationFee}
              onChange={(e) => setSettings({...settings, activationFee: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Partner Fee (Rs)</label>
            <input 
              type="number" 
              value={settings.partnerFee}
              onChange={(e) => setSettings({...settings, partnerFee: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payment Number (EasyPaisa/JazzCash)</label>
          <input 
            type="text" 
            value={settings.paymentNumber}
            onChange={(e) => setSettings({...settings, paymentNumber: e.target.value})}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Account Name</label>
          <input 
            type="text" 
            value={settings.paymentName}
            onChange={(e) => setSettings({...settings, paymentName: e.target.value})}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" /> Referral Bonuses
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Basic Referral (Rs)</label>
            <input 
              type="number" 
              value={settings.referralBonusBasic}
              onChange={(e) => setSettings({...settings, referralBonusBasic: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Partner Referral (Rs)</label>
            <input 
              type="number" 
              value={settings.referralBonusPartner}
              onChange={(e) => setSettings({...settings, referralBonusPartner: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Indirect Bonus (L2) (Rs)</label>
          <input 
            type="number" 
            value={settings.indirectReferralBonus}
            onChange={(e) => setSettings({...settings, indirectReferralBonus: Number(e.target.value)})}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
      >
        <Save className="w-4 h-4" /> {saving ? 'SAVING...' : 'SAVE SETTINGS'}
      </button>
    </div>
  );
}

export default function AdminPanelView({ onBack, onApproveActivation, onApprovePartner, onApproveDeposit, onApproveWithdrawal }: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState<'activations' | 'partners' | 'deposits' | 'withdrawals' | 'settings'>('activations');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'settings') return;
    setLoading(true);
    let q;
    
    if (activeTab === 'activations') {
      q = query(collection(db, 'deposits'), where('type', '==', 'activation'), where('status', '==', 'Pending'));
    } else if (activeTab === 'partners') {
      q = query(collection(db, 'partnerRequests'), where('status', '==', 'pending'));
    } else if (activeTab === 'withdrawals') {
      q = query(collection(db, 'withdrawals'), where('status', '==', 'Pending'));
    } else {
      q = query(collection(db, 'deposits'), where('type', '==', 'regular'), where('status', '==', 'Pending'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // Sort in memory
      data.sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp).getTime();
        const dateB = new Date(b.date || b.timestamp).getTime();
        return dateB - dateA;
      });
      setRequests(data);
      setLoading(false);
    }, (error) => {
      console.error("Admin Panel Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const handleReject = async (collectionName: string, id: string) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    try {
      await updateDoc(doc(db, collectionName, id), { status: 'Rejected' });
      alert("Request rejected.");
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.txId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 px-4 pt-4"
    >
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold">
          <Shield className="w-3 h-3 text-amber-400" /> ADMIN PANEL
        </div>
      </div>

      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 mb-6 flex gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'activations', label: 'Activations', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'partners', label: 'Partners', icon: <Crown className="w-3.5 h-3.5" /> },
          { id: 'deposits', label: 'Deposits', icon: <Wallet className="w-3.5 h-3.5" /> },
          { id: 'withdrawals', label: 'Withdrawals', icon: <ArrowLeft className="w-3.5 h-3.5 rotate-180" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'settings' ? (
        <SettingsView />
      ) : (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, ID or Transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-bold text-slate-400">Loading requests...</p>
              </div>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {req.userName?.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{req.userName}</h3>
                        <p className="text-[10px] text-slate-400 font-medium">UID: {req.userId?.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">Rs {req.amount || 2500}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{req.method || 'Partner Fee'}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">ID / Transaction ID</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">{req.transactionId || req.txId || req.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Date</span>
                      <span className="text-[10px] font-bold text-slate-600">
                        {new Date(req.date || req.timestamp?.toDate()).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleReject(
                        activeTab === 'partners' ? 'partnerRequests' : 
                        activeTab === 'withdrawals' ? 'withdrawals' : 'deposits', 
                        req.id
                      )}
                      className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> REJECT
                    </button>
                    <button 
                      onClick={() => {
                        if (activeTab === 'activations') onApproveActivation(req.userId, req.id);
                        else if (activeTab === 'partners') onApprovePartner(req.userId, req.id);
                        else if (activeTab === 'withdrawals') onApproveWithdrawal(req.userId, req.id);
                        else onApproveDeposit(req.userId, req.id, req.amount);
                      }}
                      className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> APPROVE
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-bold">No pending {activeTab} found.</p>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
