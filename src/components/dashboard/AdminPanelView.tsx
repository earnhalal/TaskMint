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
  Save,
  Ticket,
  Zap,
  ExternalLink,
  Sparkles
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
  limit,
  addDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../../firebase';

interface AdminPanelViewProps {
  onBack: () => void;
  onApproveActivation: (userId: string, depositId: string) => Promise<void>;
  onRejectActivation: (userId: string, depositId: string) => Promise<void>;
  onApprovePartner: (userId: string, requestId: string) => Promise<void>;
  onApproveDeposit: (userId: string, depositId: string, amount: number) => Promise<void>;
  onApproveWithdrawal: (userId: string, withdrawalId: string) => Promise<void>;
  onRejectWithdrawal: (userId: string, withdrawalId: string, reason: string) => Promise<void>;
}

function SettingsView() {
  const [settings, setSettings] = useState({
    activationFee: 100,
    partnerFee: 2500,
    paymentNumber: '0312-3456789',
    paymentName: 'TaskMint Admin',
    referralBonusBasic: 50,
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

function LotteriesAdminView() {
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLottery, setNewLottery] = useState({
    fee: 50,
    maxMembers: 100,
    prizePool: 4000,
    color: 'from-purple-500 to-indigo-600'
  });

  useEffect(() => {
    const q = query(collection(db, 'lotteries'), orderBy('drawDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLotteries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Draw date 7 days from now
      const drawDate = new Date();
      drawDate.setDate(drawDate.getDate() + 7);

      await setDoc(doc(collection(db, 'lotteries')), {
        fee: newLottery.fee,
        maxMembers: newLottery.maxMembers,
        currentMembers: 0,
        prizePool: newLottery.prizePool,
        drawDate: drawDate,
        status: 'active',
        color: newLottery.color
      });
      alert("Lottery created successfully!");
    } catch (error) {
      console.error("Error creating lottery:", error);
      alert("Failed to create lottery.");
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (id: string) => {
    if (!window.confirm("Mark this lottery as completed?")) return;
    try {
      await updateDoc(doc(db, 'lotteries', id), { status: 'completed' });
    } catch (error) {
      console.error("Error updating lottery:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-purple-500" /> Create New Lottery
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Entry Fee (Rs)</label>
            <input 
              type="number" 
              value={newLottery.fee}
              onChange={(e) => setNewLottery({...newLottery, fee: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Prize Pool (Rs)</label>
            <input 
              type="number" 
              value={newLottery.prizePool}
              onChange={(e) => setNewLottery({...newLottery, prizePool: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Max Members</label>
            <input 
              type="number" 
              value={newLottery.maxMembers}
              onChange={(e) => setNewLottery({...newLottery, maxMembers: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Color Theme</label>
            <select 
              value={newLottery.color}
              onChange={(e) => setNewLottery({...newLottery, color: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="from-purple-500 to-indigo-600">Purple/Indigo</option>
              <option value="from-amber-400 to-orange-500">Amber/Orange</option>
              <option value="from-emerald-400 to-teal-500">Emerald/Teal</option>
              <option value="from-rose-400 to-red-500">Rose/Red</option>
            </select>
          </div>
        </div>
        <button 
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {creating ? 'CREATING...' : 'CREATE LOTTERY'}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-900">Active & Past Lotteries</h3>
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading lotteries...</p>
        ) : lotteries.length > 0 ? (
          lotteries.map(lottery => (
            <div key={lottery.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Prize: Rs {lottery.prizePool}</p>
                <p className="text-[10px] text-slate-500">Fee: Rs {lottery.fee} • Members: {lottery.currentMembers}/{lottery.maxMembers}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${lottery.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {lottery.status}
                </span>
              </div>
              {lottery.status === 'active' && (
                <button 
                  onClick={() => handleComplete(lottery.id)}
                  className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold"
                >
                  Mark Completed
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">No lotteries found.</p>
        )}
      </div>
    </div>
  );
}

function PromotionOrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'promotion_orders'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'promotion_orders', id), { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" /> Promotion Orders
      </h3>
      {loading ? (
        <p className="text-xs text-slate-400 text-center py-4">Loading orders...</p>
      ) : orders.length > 0 ? (
        orders.map(order => (
          <div key={order.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-black text-slate-900">{order.username}</p>
                <p className="text-[10px] text-slate-500">{order.platform} • {order.service} • {order.quantity} Units</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-emerald-600">Rs {order.price}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                  order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                  order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-mono text-slate-600 truncate flex-1">{order.link}</p>
              <button 
                onClick={() => window.open(order.link, '_blank')}
                className="p-1.5 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {(order.title || order.description) && (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                {order.title && (
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Title</span>
                    <p className="text-xs font-bold text-slate-800">{order.title}</p>
                  </div>
                )}
                {order.description && (
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Description</span>
                    <p className="text-xs text-slate-600 leading-relaxed">{order.description}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(order.id, 'rejected')}
                    className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-[10px] font-bold"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(order.id, 'completed')}
                    className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-[10px] font-bold"
                  >
                    Mark Completed
                  </button>
                </>
              )}
              {order.status !== 'pending' && (
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'pending')}
                  className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-[10px] font-bold"
                >
                  Reset to Pending
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-xs text-slate-400 text-center py-4">No promotion orders found.</p>
      )}
    </div>
  );
}

function SocialTasksAdminView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    platform: 'YouTube',
    reward: 10,
    link: '',
    instructions: '',
    status: 'active'
  });

  useEffect(() => {
    const qTasks = query(collection(db, 'social_tasks'), orderBy('timestamp', 'desc'));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qSubs = query(collection(db, 'social_task_submissions'), where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
    const unsubscribeSubs = onSnapshot(qSubs, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeSubs();
    };
  }, []);

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.link) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'social_tasks'), {
        ...newTask,
        timestamp: serverTimestamp()
      });
      setNewTask({ title: '', platform: 'YouTube', reward: 10, link: '', instructions: '', status: 'active' });
      alert("Task created!");
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleApproveSubmission = async (sub: any) => {
    try {
      // 1. Update submission status
      await updateDoc(doc(db, 'social_task_submissions', sub.id), { status: 'approved' });
      
      // 2. Update user balance (centralized logic would be better but this is admin panel)
      // We'll use a custom function in Dashboard or just do it here for simplicity in admin panel
      // Actually, we should trigger the balance update logic.
      // For now, let's just update Firestore and RTDB directly like other admin actions.
      
      const userRef = doc(db, 'users', sub.userId);
      await updateDoc(userRef, { balance: increment(sub.reward) });
      
      // Record in earning history
      await addDoc(collection(db, 'earning_history'), {
        userId: sub.userId,
        amount: sub.reward,
        source: 'social_task',
        description: `Social Task Approved: ${sub.taskTitle || 'Task'}`,
        timestamp: serverTimestamp()
      });

      alert("Submission approved and reward paid!");
    } catch (error) {
      console.error("Error approving submission:", error);
    }
  };

  const handleRejectSubmission = async (id: string) => {
    try {
      await updateDoc(doc(db, 'social_task_submissions', id), { status: 'rejected' });
      alert("Submission rejected.");
    } catch (error) {
      console.error("Error rejecting submission:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Task */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" /> Create Social Task+
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Task Title</label>
            <input 
              type="text" 
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="e.g. Subscribe to our YouTube"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Platform</label>
            <select 
              value={newTask.platform}
              onChange={(e) => setNewTask({...newTask, platform: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="YouTube">YouTube</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="TikTok">TikTok</option>
              <option value="Telegram">Telegram</option>
              <option value="Twitter">Twitter</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Reward (Rs)</label>
            <input 
              type="number" 
              value={newTask.reward}
              onChange={(e) => setNewTask({...newTask, reward: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Task Link</label>
            <input 
              type="text" 
              value={newTask.link}
              onChange={(e) => setNewTask({...newTask, link: e.target.value})}
              placeholder="https://..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
        <button 
          onClick={handleCreateTask}
          disabled={creating}
          className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {creating ? 'CREATING...' : 'CREATE SOCIAL TASK'}
        </button>
      </div>

      {/* Pending Submissions */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" /> Pending Submissions ({submissions.length})
        </h3>
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading submissions...</p>
        ) : submissions.length > 0 ? (
          submissions.map(sub => (
            <div key={sub.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black text-slate-900">{sub.userName}</p>
                  <p className="text-[10px] text-slate-500">{sub.taskTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-600">Rs {sub.reward}</p>
                  <p className="text-[8px] text-slate-400 uppercase font-bold">{new Date(sub.timestamp?.toDate()).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Proof Provided:</p>
                <p className="text-xs font-bold text-slate-700 break-all">{sub.proof}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleRejectSubmission(sub.id)}
                  className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-[10px] font-bold"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleApproveSubmission(sub)}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-[10px] font-bold"
                >
                  Approve & Pay
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">No pending submissions.</p>
        )}
      </div>

      {/* Active Tasks List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-900">Existing Tasks</h3>
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{task.title}</p>
              <p className="text-[10px] text-slate-500">{task.platform} • Rs {task.reward}</p>
            </div>
            <button 
              onClick={async () => {
                const newStatus = task.status === 'active' ? 'inactive' : 'active';
                await updateDoc(doc(db, 'social_tasks', task.id), { status: newStatus });
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${task.status === 'active' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
            >
              {task.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPanelView({ onBack, onApproveActivation, onRejectActivation, onApprovePartner, onApproveDeposit, onApproveWithdrawal, onRejectWithdrawal }: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState<'activations' | 'partners' | 'deposits' | 'withdrawals' | 'settings' | 'lotteries' | 'promotions' | 'social_tasks'>('activations');
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

  const handleReject = async (collectionName: string, id: string, userId?: string) => {
    if (collectionName === 'withdrawals') {
      const reason = prompt("Enter reason for rejection:");
      if (!reason) return;
      await onRejectWithdrawal(userId!, id, reason);
    } else {
      if (!window.confirm("Are you sure you want to reject this request?")) return;
      try {
        if (activeTab === 'activations' && userId) {
          await onRejectActivation(userId, id);
        } else {
          await updateDoc(doc(db, collectionName, id), { status: 'Rejected' });
          alert("Request rejected.");
        }
      } catch (error) {
        console.error("Error rejecting request:", error);
      }
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
          { id: 'social_tasks', label: 'Social Tasks', icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: 'promotions', label: 'Promotions', icon: <Zap className="w-3.5 h-3.5" /> },
          { id: 'lotteries', label: 'Lotteries', icon: <Ticket className="w-3.5 h-3.5" /> },
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
      ) : activeTab === 'lotteries' ? (
        <LotteriesAdminView />
      ) : activeTab === 'promotions' ? (
        <PromotionOrdersView />
      ) : activeTab === 'social_tasks' ? (
        <SocialTasksAdminView />
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
                        req.id,
                        req.userId
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
