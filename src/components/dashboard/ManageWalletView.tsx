import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Wallet, Lock, ShieldCheck, Plus, ChevronRight, Save, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

interface Account {
  id: string;
  title: string;
  number: string;
  method: string;
}

interface ManageWalletViewProps {
  balance: number;
  accounts: Account[];
  onBack: () => void;
}

export default function ManageWalletView({ balance, accounts, onBack }: ManageWalletViewProps) {
  const { user } = useAuth();
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'success' });

  // New Account Form
  const [newAccount, setNewAccount] = useState({ title: '', number: '', method: 'easypaisa' });
  
  // PIN Change Form
  const [pinForm, setPinForm] = useState({ current: '', new: '', confirm: '' });

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  };

  const handleAddAccount = async () => {
    if (!user) return;
    if (!newAccount.title || !newAccount.number) {
      showMessage('Please fill all fields', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const accountData = {
        id: Math.random().toString(36).substr(2, 9),
        ...newAccount
      };
      await updateDoc(userRef, {
        withdrawalAccounts: arrayUnion(accountData)
      });
      setIsAddingAccount(false);
      setNewAccount({ title: '', number: '', method: 'easypaisa' });
      showMessage('Account added successfully');
    } catch (error) {
      console.error("Error adding account:", error);
      showMessage('Failed to add account', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        withdrawalAccounts: arrayRemove(account)
      });
      showMessage('Account deleted');
    } catch (error) {
      console.error("Error deleting account:", error);
      showMessage('Failed to delete account', 'error');
    }
  };

  const handleChangePin = async () => {
    if (!user) return;
    if (pinForm.new.length !== 4 || isNaN(Number(pinForm.new))) {
      showMessage('PIN must be 4 digits', 'error');
      return;
    }
    if (pinForm.new !== pinForm.confirm) {
      showMessage('PINs do not match', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        pin: pinForm.new
      });
      setIsChangingPin(false);
      setPinForm({ current: '', new: '', confirm: '' });
      showMessage('PIN updated successfully');
    } catch (error) {
      console.error("Error updating PIN:", error);
      showMessage('Failed to update PIN', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 px-4 pt-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Manage Wallet</h2>
      </div>

      {/* Status Message */}
      <AnimatePresence>
        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-bold text-sm ${
              message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Available Balance</span>
          </div>
          <h2 className="text-3xl font-black mb-1">Rs {balance.toLocaleString()}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verified Account</p>
        </div>
      </div>

      {/* Accounts Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Withdrawal Accounts</h3>
            <button 
              onClick={() => setIsAddingAccount(true)}
              className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add New
            </button>
        </div>
        
        <div className="space-y-3">
          {accounts.length > 0 ? (
            accounts.map((acc) => (
              <div key={acc.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                    acc.method === 'easypaisa' ? 'bg-emerald-50 text-emerald-600' : 
                    acc.method === 'jazzcash' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {acc.method === 'easypaisa' ? 'EP' : acc.method === 'jazzcash' ? 'JC' : 'BT'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{acc.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{acc.number} • {acc.method.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteAccount(acc)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-xs text-slate-400 font-medium">No withdrawal accounts added yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="mb-8">
        <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4 px-1">Security Settings</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <button 
            onClick={() => setIsChangingPin(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-900">Change Security PIN</h4>
                <p className="text-[10px] text-slate-500">Update your 4-digit withdrawal PIN</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
          
          <div className="flex items-center justify-between p-4 border-t border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-900">Two-Factor Auth</h4>
                <p className="text-[10px] text-slate-500">Secure your withdrawals</p>
              </div>
            </div>
            <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {isAddingAccount && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingAccount(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6">Add New Account</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Title</label>
                  <input 
                    type="text" 
                    value={newAccount.title}
                    onChange={e => setNewAccount({...newAccount, title: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Number</label>
                  <input 
                    type="text" 
                    value={newAccount.number}
                    onChange={e => setNewAccount({...newAccount, number: e.target.value})}
                    placeholder="e.g. 03001234567"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['easypaisa', 'jazzcash', 'bank'].map(m => (
                      <button
                        key={m}
                        onClick={() => setNewAccount({...newAccount, method: m})}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                          newAccount.method === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={handleAddAccount}
                  disabled={isSaving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-base mt-4 transition-all active:scale-95 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {isSaving ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change PIN Modal */}
      <AnimatePresence>
        {isChangingPin && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangingPin(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6">Change Security PIN</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">New 4-Digit PIN</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    value={pinForm.new}
                    onChange={e => setPinForm({...pinForm, new: e.target.value})}
                    placeholder="••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-center text-2xl font-black tracking-[1em] text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm New PIN</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    value={pinForm.confirm}
                    onChange={e => setPinForm({...pinForm, confirm: e.target.value})}
                    placeholder="••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-center text-2xl font-black tracking-[1em] text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                
                <button 
                  onClick={handleChangePin}
                  disabled={isSaving}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-base mt-4 transition-all active:scale-95 shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                >
                  {isSaving ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Update PIN'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
