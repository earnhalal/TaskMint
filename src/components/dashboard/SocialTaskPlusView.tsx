import React, { useState, useEffect } from 'react';
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
  Trophy
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface SocialTaskPlusViewProps {
  onBack: () => void;
  userName: string;
}

export default function SocialTaskPlusView({ onBack, userName }: SocialTaskPlusViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [proof, setProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch active tasks
    const tasksQuery = query(collection(db, 'social_tasks'), where('status', '==', 'active'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
      setIsLoading(false);
    });

    // Fetch user submissions
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

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return <Youtube className="w-5 h-5 text-red-600" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'facebook': return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'telegram': return <Send className="w-5 h-5 text-sky-500" />;
      default: return <Share2 className="w-5 h-5 text-slate-600" />;
    }
  };

  const isTaskSubmitted = (taskId: string) => {
    return submissions.some(s => s.taskId === taskId);
  };

  const getSubmissionStatus = (taskId: string) => {
    const sub = submissions.find(s => s.taskId === taskId);
    return sub ? sub.status : null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="pb-24 px-4 pt-4"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Social Task+</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Earn from Social Media</p>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white mb-8 relative overflow-hidden shadow-2xl shadow-blue-900/20 group border border-white/5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-amber-500/30 transition-colors duration-500"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Premium Rewards</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 leading-none font-display drop-shadow-md">
            Social Task<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">+</span>
          </h1>
          <p className="text-sm text-blue-200 font-medium max-w-[220px]">Complete simple social tasks and get instant rewards directly to your wallet.</p>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Available Tasks</h3>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Tasks...</p>
          </div>
        ) : tasks.length > 0 ? (
          tasks.map((task) => {
            const status = getSubmissionStatus(task.id);
            const isSubmitted = !!status;

            return (
              <motion.div
                key={task.id}
                whileHover={{ y: -2 }}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    {getPlatformIcon(task.platform)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        Rs. {task.reward}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> {task.platform}
                      </span>
                    </div>
                  </div>
                </div>

                {isSubmitted ? (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                    status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {status}
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
                  >
                    Start
                  </button>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="bg-slate-50 rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertCircle className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-black text-lg mb-1">No Tasks Available</h3>
            <p className="text-slate-400 text-xs font-medium">Check back later for new social tasks!</p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                      {getPlatformIcon(selectedTask.platform)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedTask.title}</h3>
                      <p className="text-xs font-bold text-emerald-600">Reward: Rs. {selectedTask.reward}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-400 rotate-90" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instructions</h4>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {selectedTask.instructions || "Click the button below to open the link. Complete the task (Like/Follow/Subscribe) and then provide your username or screenshot link as proof."}
                    </p>
                  </div>

                  <button
                    onClick={() => window.open(selectedTask.link, '_blank')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Task Link
                  </button>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Proof of Completion</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                        placeholder="Enter your username or proof link"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <Camera className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !proof}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-black text-sm disabled:opacity-50 shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Submit Task
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Submitted!</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">
                Aapka task review ke liye bhej diya gaya hai. Approval ke baad reward mil jayega.
              </p>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
              >
                Great!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
