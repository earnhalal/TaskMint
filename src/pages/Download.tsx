import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, ShieldCheck, Zap, Wallet, ArrowLeft, Star, CheckCircle2, Smartphone, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DownloadPage() {
  const navigate = useNavigate();
  const apkLink = "https://apk.e-droid.net/apk/app3991921-5okpg1.apk?v=4";

  useEffect(() => {
    document.title = "Download TaskMint App APK | Best Online Earning App in Pakistan 2026";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', "Download TaskMint App APK - The #1 real online earning app in Pakistan. Earn money daily by watching ads, completing tasks, and surveys. Fast JazzCash & Easypaisa withdrawals. Get TaskMint APK download for free.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* SEO Optimized Meta Tags */}
      <h1 className="sr-only">TaskMint App APK Download - Best Online Earning App in Pakistan</h1>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tighter">TaskMint</span>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </header>

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest mb-6"
            >
              <Star className="w-3 h-3 fill-amber-500" /> Official TaskMint App APK
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight"
            >
              Download TaskMint <br/> 
              <span className="text-amber-500">Real Earning App APK.</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-600 text-lg mb-10 max-w-2xl mx-auto font-medium"
            >
              TaskMint app apk download karein aur ghar baithy online earning shuru karein. Pakistan ka sabse bharosemand online work platform.
            </motion.p>

            {/* Download Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-amber-500/40 animate-float">
                  <Smartphone className="w-16 h-16 md:w-20 md:h-20" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">TaskMint App APK (Latest)</h3>
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <Star className="w-4 h-4 fill-amber-500" />
                      <Star className="w-4 h-4 fill-amber-500" />
                      <Star className="w-4 h-4 fill-amber-500" />
                      <Star className="w-4 h-4 fill-amber-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">4.9/5 Rating</span>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">Version 4.0</span>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">Size: 12MB</span>
                    <span className="px-3 py-1 bg-emerald-50 rounded-full text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Verified Secure</span>
                  </div>

                  <a 
                    href={apkLink}
                    download
                    className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-slate-900/20 active:scale-95 group"
                  >
                    <Download className="w-6 h-6 group-hover:animate-bounce" />
                    Download TaskMint APK
                  </a>
                  
                  <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    TaskMint app install karein aur Rs. 100 bonus claim karein!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">100% Secure APK</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Verified TaskMint app apk with no malware. Safe for all Android devices.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <Wallet className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">JazzCash Earnings</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">TaskMint app se earn kiya hua paisa JazzCash aur Easypaisa mein withdraw karein.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-6">
                <Gift className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">App Install Bonus</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">TaskMint app apk install karne par Rs. 100 ka instant welcome bonus milta hai.</p>
            </div>
          </div>

          {/* SEO Content Section */}
          <article className="prose prose-slate max-w-none bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-6">TaskMint App APK: Pakistan's Best Online Earning App</h3>
            <p className="text-slate-600 font-medium leading-relaxed mb-6">
              Agar aap real <strong>online earning app</strong> talash kar rahe hain, to <strong>TaskMint app apk</strong> aapke liye behtareen choice hai. Is app mein aap video ads dekh kar, surveys mukammal kar ke, aur doston ko invite kar ke rozana hazaron rupaye kama sakte hain.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
                <p className="text-sm text-slate-700 font-bold">TaskMint App APK Download: Simple aur fast installation process.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
                <p className="text-sm text-slate-700 font-bold">Online Work from Home: Ghar baithy mobile par kaam karein.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
                <p className="text-sm text-slate-700 font-bold">Real Earning App: 100% verified payouts aur local support.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
                <p className="text-sm text-slate-700 font-bold">TaskMint APK: Low data usage aur fast performance.</p>
              </div>
            </div>

            <h4 className="text-xl font-black text-slate-900 mb-4">How to Download and Install TaskMint App APK?</h4>
            <ol className="list-decimal list-inside space-y-3 text-slate-600 font-medium">
              <li>Upar diye gaye <strong>"Download TaskMint APK"</strong> button par click karein.</li>
              <li>APK file download hone ke baad notification bar se file open karein.</li>
              <li>Settings mein ja kar "Allow from this source" ya "Unknown Sources" ko enable karein.</li>
              <li>Install par click karein aur app open kar ke Register karein.</li>
              <li>Apna referral code enter karein aur bonus hasil karein!</li>
            </ol>
          </article>

          {/* Footer SEO Keywords */}
          <div className="mt-12 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Keywords</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["online earning pakistan", "earn money online", "taskmint app apk", "taskmint download", "jazzcash earning app", "easypaisa earning app", "real earning app 2026", "make money online pakistan", "taskmint apk download"].map(tag => (
                <span key={tag} className="text-[9px] font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded-md">#{tag.replace(/\s+/g, '')}</span>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
