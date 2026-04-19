import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Share2, 
  Youtube, 
  Instagram, 
  Facebook, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Camera,
  Loader2,
  Sparkles,
  Trophy,
  Zap,
  Filter
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface SocialTaskPlusViewProps {
  onBack: () => void;
  userName: string;
}

const PLATFORM_THEMES: Record<string, any> = {
  all: { 
    label: 'All', 
    icon: <Filter className="w-4 h-4" />, 
    color: 'from-slate-700 to-slate-900', 
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    activeBg: 'bg-slate-900 text-white',
    cardBg: 'from-slate-50 to-white'
  },
  youtube: { 
    label: 'YouTube', 
    icon: <Youtube className="w-4 h-4" />, 
    color: 'from-red-600 to-red-800', 
    text: 'text-red-600',
    bg: 'bg-red-50',
    activeBg: 'bg-[#FF0000] text-white',
    cardBg: 'from-red-50 to-white',
    glow: 'shadow-red-500/20'
  },
  instagram: { 
    label: 'Instagram', 
    icon: <Instagram className="w-4 h-4" />, 
    color: 'from-purple-600 via-pink-600 to-orange-500', 
    text: 'text-pink-600',
    bg: 'bg-pink-50',
    activeBg: 'bg-gradient-to-tr from-[#833AB4] via-[#F56040] to-[#FCAF45] text-white',
    cardBg: 'from-pink-50 to-white',
    glow: 'shadow-pink-500/20'
  },
  facebook: { 
    label: 'Facebook', 
    icon: <Facebook className="w-4 h-4" />, 
    color: 'from-blue-600 to-blue-800', 
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    activeBg: 'bg-[#1877F2] text-white',
    cardBg: 'from-blue-50 to-white',
    glow: 'shadow-blue-500/20'
  },
  telegram: { 
    label: 'Telegram', 
    icon: <Send className="w-4 h-4" />, 
    color: 'from-sky-500 to-sky-700', 
    text: 'text-sky-500',
    bg: 'bg-sky-50',
    activeBg: 'bg-[#24A1DE] text-white',
    cardBg: 'from-sky-50 to-white',
    glow: 'shadow-sky-500/20'
  }
};

export default function SocialTaskPlusView({ onBack, userName }: SocialTaskPlusViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [proof, setProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (!auth.currentUser) return;

    const tasksQuery = query(collection(db, 'social_tasks'), where('status', '==', 'active'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
      setIsLoading(false);
    });

    const submissionsQuery = query(collection(db, 'social_task_submissions'), where('userId', '==', auth.currentUser.uid));
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const subsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(subsData);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeSubmissions();
    };
  }, []);

  const filteredTasks = useMemo(() => {
    if (activeCategory === 'all') return tasks;
    return tasks.filter(t => t.platform?.toLowerCase() === activeCategory);
  }, [tasks, activeCategory]);

  const handleSubmit = async () => {
    if (!auth.currentUser || !selectedTask || !proof) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'social_task_submissions'), {
        taskId: selectedTask.id,
        userId: auth.currentUser.uid,
        userName: userName,
        proof: proof,
        status: 'pending',
        reward: selectedTask.reward,
        taskTitle: selectedTask.title,
        platform: selectedTask.platform,
        timestamp: serverTimestamp()
      });
      setShowSuccess(true);
      setSelectedTask(null);
      setProof('');
    } catch (error) {
      console.error("Error submitting social task:", error);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlatformIcon = (platform: string, className?: string) => {
    const p = platform?.toLowerCase() || '';
    if (p === 'youtube') return <Youtube className={className || "w-5 h-5 text-red-600"} />;
    if (p === 'instagram') return <Instagram className={className || "w-5 h-5 text-pink-600"} />;
    if (p === 'facebook') return <Facebook className={className || "w-5 h-5 text-blue-600"} />;
    if (p === 'telegram') return <Send className={className || "w-5 h-5 text-sky-500"} />;
    return <Share2 className={className || "w-5 h-5 text-slate-600"} />;
  };

  const getSubmissionStatus = (taskId: string) => {
    const sub = submissions.find(s => s.taskId === taskId);
    return sub ? sub.status : null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 px-4 pt-4 font-sans max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Social Boost+</h2>
            <div className="flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Premium Earnings</p>
            </div>
          </div>
        </div>
        
        <div className="flex -space-x-2">
          {['youtube', 'instagram', 'facebook'].map((p, i) => (
            <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white p-1.5 shadow-sm ${PLATFORM_THEMES[p].activeBg}`}>
              {React.cloneElement(PLATFORM_THEMES[p].icon, { className: "w-full h-full" })}
            </div>
          ))}
        </div>
      </div>

      {/* Hero Banner (Digital Theme) */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative rounded-[2rem] p-6 text-white overflow-hidden mb-8 shadow-2xl shadow-indigo-500/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#060D2D] via-[#101438] to-[#1a1c29]"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 border border-white/10 mb-4">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Exclusive Reward Wall</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">Turn Followers into <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">Profit</span></h1>
          <p className="text-xs text-blue-100/70 font-medium max-w-[200px]">Complete simple actions on your favorite apps and earn real cash rewards instantly.</p>
        </div>
      </motion.div>

      {/* Platform Category Selector */}
      <div className="mb-8 relative">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Platform</h3>
          <div className="h-px flex-1 bg-slate-100 ml-4"></div>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          {Object.entries(PLATFORM_THEMES).map(([id, theme]) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                activeCategory === id 
                  ? `${theme.activeBg} border-transparent shadow-lg ${theme.glow || 'shadow-slate-500/20'}`
                  : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={activeCategory === id ? 'text-white' : theme.text}>
                {theme.icon}
              </div>
              {theme.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Task List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Active Campaigns</h3>
          <span className="text-[10px] font-bold text-slate-400">{filteredTasks.length} {activeCategory === 'all' ? 'Tasks' : activeCategory + ' Tasks'}</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Syncing Tasks...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task, idx) => {
              const status = getSubmissionStatus(task.id);
              const isSubmitted = !!status;
              const platform = task.platform?.toLowerCase() || 'all';
              const theme = PLATFORM_THEMES[platform] || PLATFORM_THEMES.all;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative overflow-hidden p-4 rounded-3xl border border-slate-100 shadow-sm transition-all group ${isSubmitted ? 'opacity-70 grayscale-[0.5]' : 'hover:shadow-md'}`}
                >
                  <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-20 ${theme.bg}`}></div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      {/* Platform Icon with Active Background */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${theme.activeBg}`}>
                        {getPlatformIcon(platform, "w-6 h-6 text-white")}
                      </div>
                      
                      <div>
                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                             <p className="text-[10px] font-black text-emerald-600 tracking-tighter">Rs. {task.reward}</p>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{platform}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {isSubmitted ? (
                        <div className={`flex flex-col items-end gap-0.5`}>
                           <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${
                             status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                             status === 'pending' ? 'bg-amber-100 text-amber-700' :
                             'bg-red-100 text-red-700'
                           }`}>
                             {status === 'approved' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                             {status}
                           </div>
                           <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest pr-1">Submitted</p>
                        </div>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedTask(task)}
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all ${theme.activeBg}`}
                        >
                          Unlock
                        </motion.button>
                      )}
                    </div>
                  </div>
                  
                  {/* Subtle Progress Bar logic could go here if multi-step */}
                  <div className="absolute bottom-0 left-0 h-[2px] bg-slate-100 w-full overflow-hidden">
                     <div className={`h-full opacity-50 ${theme.activeBg}`} style={{ width: isSubmitted ? '100%' : '5%' }}></div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 p-12 text-center"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <AlertCircle className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-black text-lg mb-1">No {activeCategory === 'all' ? '' : activeCategory} Tasks</h3>
            <p className="text-slate-400 text-xs font-medium max-w-[150px] mx-auto">New campaigns will arrive shortly. Check back in a bit!</p>
          </motion.div>
        )}
      </div>

      {/* Task Content Modal (Themed) */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-1 h-2 bg-slate-100 flex justify-center items-center">
                 <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
              </div>
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${PLATFORM_THEMES[selectedTask.platform?.toLowerCase() || 'all'].activeBg}`}>
                      {getPlatformIcon(selectedTask.platform, "w-7 h-7 text-white")}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedTask.title}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" />
                         <p className="text-xs font-bold text-amber-600">Reward Pool: Rs. {selectedTask.reward}</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="p-2.5 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                       {getPlatformIcon(selectedTask.platform, "w-12 h-12")}
                    </div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Verification Rules</h4>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed pr-6">
                      {selectedTask.instructions || "1. Link par click karein.\n2. Page subscribe/follow karein.\n3. Screen shot link ya handle yahan enter karein."}
                    </p>
                  </div>

                  <button
                    onClick={() => window.open(selectedTask.link, '_blank')}
                    className={`w-full py-4.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-all text-white py-4 ${PLATFORM_THEMES[selectedTask.platform?.toLowerCase() || 'all'].activeBg}`}
                  >
                    <ExternalLink className="w-4 h-4" /> Open Platform
                  </button>

                  <div className="pt-2">
                    <div className="flex items-center justify-between px-2 mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Proof</label>
                      <Zap className="w-3 h-3 text-blue-500" />
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                        placeholder="Enter Username / Handle / URL"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                      />
                      <Camera className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !proof}
                    className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black text-sm disabled:opacity-50 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirm Submission
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Success View */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white w-full max-w-xs rounded-[3rem] p-8 text-center shadow-3xl overflow-hidden relative"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
              
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 relative shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-white" />
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Well Done!</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-8 px-4">
                Task is processing. Credits will arrive shortly.
              </p>
              
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black text-sm hover:shadow-2xl transition-all active:scale-95"
              >
                Continue Earning
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </motion.div>
  );
}
