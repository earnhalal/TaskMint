import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Youtube, Facebook, Globe, Heart, Users, Link as LinkIcon, DollarSign, CheckCircle2 } from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const TASK_TYPES = [
  { id: 'yt_sub', name: 'YouTube Subscribers', icon: <Youtube className="w-6 h-6" />, color: 'bg-red-50 text-red-600 border-red-100', placeholder: 'https://youtube.com/c/yourchannel' },
  { id: 'fb_follow', name: 'Facebook Followers', icon: <Facebook className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600 border-blue-100', placeholder: 'https://facebook.com/yourpage' },
  { id: 'tt_follow', name: 'TikTok Followers', icon: <TikTokIcon className="w-6 h-6" />, color: 'bg-slate-100 text-slate-900 border-slate-200', placeholder: 'https://tiktok.com/@yourprofile' },
  { id: 'tt_like', name: 'TikTok Likes', icon: <Heart className="w-6 h-6" />, color: 'bg-pink-50 text-pink-600 border-pink-100', placeholder: 'https://tiktok.com/@yourprofile/video/123' },
  { id: 'web_visit', name: 'Website Visit', icon: <Globe className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', placeholder: 'https://yourwebsite.com' },
];

export default function CreateTaskView({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [taskLink, setTaskLink] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [reward, setReward] = useState('5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedTaskDef = TASK_TYPES.find(t => t.id === selectedType);
  const totalCost = parseInt(quantity || '0') * parseInt(reward || '0');

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Task Created!</h2>
        <p className="text-sm text-slate-500">Your campaign is now live and users will start completing it shortly.</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={step === 2 ? () => setStep(1) : onBack}
          className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Create New Task</h2>
          <p className="text-xs text-slate-500">Step {step} of 2</p>
        </div>
      </div>

      {step === 1 ? (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h3 className="text-sm font-bold text-slate-900 mb-4">Select Task Type</h3>
          <div className="grid grid-cols-1 gap-3">
            {TASK_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id);
                  setStep(2);
                }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  selectedType === type.id 
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20' 
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${type.color}`}>
                  {type.icon}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-900">{type.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Get real {type.name.toLowerCase()}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 mb-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${selectedTaskDef?.color}`}>
                {selectedTaskDef?.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedTaskDef?.name}</h4>
                <p className="text-[10px] text-slate-500">Configure your campaign</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Target Link
                </label>
                <input
                  type="url"
                  value={taskLink}
                  onChange={(e) => setTaskLink(e.target.value)}
                  placeholder={selectedTaskDef?.placeholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Reward (Rs)
                  </label>
                  <input
                    type="number"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 mb-6">
            <h4 className="text-xs font-bold text-blue-900 mb-3 uppercase tracking-wider">Campaign Summary</h4>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Cost per action</span>
                <span className="font-bold text-blue-900">Rs {reward}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Total actions</span>
                <span className="font-bold text-blue-900">x {quantity}</span>
              </div>
              <div className="h-px bg-blue-200 my-2"></div>
              <div className="flex justify-between text-base">
                <span className="font-bold text-blue-900">Total Cost</span>
                <span className="font-black text-blue-700">Rs {totalCost}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!taskLink || isSubmitting || totalCost <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Launch Campaign'
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
