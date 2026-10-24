import { useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Download,
  ShieldCheck,
  Coins,
  Wallet,
  ArrowLeft,
  CheckCircle2,
  Gift,
  ListChecks,
  PlayCircle,
  UserPlus,
  BadgeCheck,
  Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

const APK_URL = 'https://github.com/earnhalal/TaskMint/releases/latest/download/TaskMint.apk';

const INFO_ITEMS = [
  { label: 'Version', value: '1.10' },
  { label: 'Size', value: 'About 10 MB' },
  { label: 'Requires Android', value: '7.0 and up' },
  { label: 'Category', value: 'Finance / Earning' },
];

const FEATURES = [
  {
    icon: ListChecks,
    title: 'Daily Tasks',
    text: 'Complete simple daily tasks and social media tasks to earn money from your phone.',
  },
  {
    icon: PlayCircle,
    title: 'Watch & Earn',
    text: 'Watch sponsored video ads in the app and get rewarded for every completed view.',
  },
  {
    icon: UserPlus,
    title: 'Refer & Earn',
    text: 'Invite friends and earn Rs. 100 per referral — Rs. 125 per referral for partner accounts.',
  },
  {
    icon: Wallet,
    title: 'EasyPaisa & JazzCash Payouts',
    text: 'Deposit and withdraw with EasyPaisa and JazzCash. Minimum withdrawal is Rs. 500 with a 5% fee.',
  },
  {
    icon: Gift,
    title: 'Rs. 100 App Bonus',
    text: 'Install the app, sign in with your TaskMint account and claim a Rs. 100 app-install bonus.',
  },
  {
    icon: ShieldCheck,
    title: 'Official & Secure',
    text: 'This page on taskmint.click is the only official download source for the TaskMint app.',
  },
];

const INSTALL_STEPS = [
  {
    title: 'Tap "Download APK"',
    text: 'Tap the green Install button on this page. The official TaskMint APK (about 10 MB) will start downloading.',
  },
  {
    title: 'Open the downloaded file',
    text: 'When the download finishes, tap the file from your notifications or your Downloads folder.',
  },
  {
    title: 'Allow installation if Android asks',
    text: 'Because this app is installed directly from taskmint.click instead of the Play Store, Android may ask you to allow "Install unknown apps" for your browser. This is normal for direct installs — allow it for this download.',
  },
  {
    title: 'Install, sign in and claim your bonus',
    text: 'Tap Install, open TaskMint, sign in with your account and claim the Rs. 100 app-install bonus.',
  },
];

export default function DownloadPage() {
  const navigate = useNavigate();

  useSEO({
    title: 'Download the TaskMint App | TaskMint for Android',
    description:
      'Download the official TaskMint Android app. Complete daily tasks, watch video ads and refer friends to earn money online in Pakistan, with EasyPaisa and JazzCash withdrawals from Rs. 500.',
    canonical: 'https://www.taskmint.click/app-download',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
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
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tighter">TaskMint</span>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </header>

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Store-style app header */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 mb-6"
          >
            <div className="flex items-start gap-5 mb-6">
              <img
                src="/favicon.svg"
                alt="TaskMint app icon"
                className="w-20 h-20 md:w-24 md:h-24 rounded-[1.4rem] shadow-lg shadow-emerald-500/20 shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  TaskMint
                </h1>
                <p className="text-slate-600 font-semibold mt-0.5">Earn Money Online in Pakistan</p>
                <p className="text-emerald-600 text-sm font-bold mt-1 flex items-center gap-1.5">
                  TaskMint
                  <BadgeCheck className="w-4 h-4" />
                  <span className="text-slate-400 font-semibold">· Contains ads</span>
                </p>
              </div>
            </div>

            {/* Info strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-y border-slate-100 py-4 mb-6">
              {INFO_ITEMS.map((item) => (
                <div key={item.label} className="text-center px-2">
                  <p className="text-sm font-black text-slate-900">{item.value}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <a
              href={APK_URL}
              download
              className="flex items-center justify-center gap-2.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-black text-lg transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              Install
            </a>
            <p className="mt-3 text-center text-xs font-semibold text-slate-400">
              Direct APK download — free. One-time account activation fee of Rs. 150 applies in the app.
            </p>
          </motion.section>

          {/* About this app */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 mb-6"
          >
            <h2 className="text-xl font-black text-slate-900 mb-4">About this app</h2>
            <div className="space-y-4 text-slate-600 font-medium leading-relaxed text-[15px]">
              <p>
                TaskMint is an online earning platform for Pakistan. With the TaskMint Android app you
                can complete daily tasks, watch sponsored video ads and invite friends — and manage
                your balance, deposits and withdrawals in one place, using the same account and wallet
                as the TaskMint website.
              </p>
              <p>
                Getting started is simple: create your account, activate it with a one-time fee of
                Rs. 150, and start completing tasks. Earnings can be withdrawn to EasyPaisa or JazzCash
                once your balance reaches Rs. 500. A 5% withdrawal fee applies, and payouts are
                processed in the monthly payout windows (1st–3rd and 16th–18th). Referrals pay
                Rs. 100 per friend, or Rs. 125 per friend for partner accounts.
              </p>
              <p>
                Installing the app from this page also makes you eligible for the Rs. 100 app-install
                bonus — just sign in after installing and claim it in the app.
              </p>
            </div>

            <h3 className="text-base font-black text-slate-900 mt-8 mb-4">What's new</h3>
            <p className="text-slate-600 font-medium text-[15px] leading-relaxed">
              Version 1.10 — the signed release build of the TaskMint Android app. The app now
              notifies you in the dashboard whenever a newer version is available, so you always
              have the latest TaskMint dashboard, tasks, video ads, wallet and referral system.
              This download button always serves the latest published version.
            </p>
          </motion.section>

          {/* Features */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 mb-6"
          >
            <h2 className="text-xl font-black text-slate-900 mb-6">Features</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <feature.icon className="w-5.5 h-5.5 w-[22px] h-[22px]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* How to install */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 mb-6"
          >
            <h2 className="text-xl font-black text-slate-900 mb-6">How to install</h2>
            <ol className="space-y-6">
              {INSTALL_STEPS.map((step, i) => (
                <li key={step.title} className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-black flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                <strong>Seeing a security prompt?</strong> That is normal. Android and some phone
                brands (such as Huawei) show a caution screen for any app installed from outside the
                Play Store. This page on <strong>taskmint.click</strong> is the official TaskMint
                download link — if your phone asks, choose "Install anyway" to continue. Only download
                the TaskMint app from this page.
              </p>
            </div>

            <a
              href={APK_URL}
              download
              className="mt-8 flex items-center justify-center gap-2.5 w-full bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-black text-lg transition-all shadow-lg active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              Download APK
            </a>

            <div className="mt-6 space-y-2.5">
              {[
                'Free to download — about 10 MB, works on Android 7.0 and up',
                'Same account and wallet as taskmint.click',
                'Rs. 100 app-install bonus for app users',
              ].map((line) => (
                <p key={line} className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
                  <CheckCircle2 className="w-4.5 h-4.5 w-[18px] h-[18px] text-emerald-500 shrink-0" />
                  {line}
                </p>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
