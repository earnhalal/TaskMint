import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  X as CloseIcon,
  Wallet as WalletIcon,
  CheckCircle2 as CheckCircleIcon,
  Landmark as BankIcon,
  Sparkles as SparklesIcon,
  Users as UserGroupIcon,
  ArrowRight,
  ShieldCheck,
  Briefcase as BriefcaseIcon,
  PlayCircle as PlayCircleIcon,
  Gift as GiftIcon,
  Zap,
  Coins,
  ClipboardList,
  Smartphone,
  CircleDollarSign,
  CalendarCheck,
  Dices,
  ChevronDown,
  Clock3,
  BadgeCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { blogPosts } from '../data/blogPosts';

const faqs = [
  {
    q: 'Is there a joining fee on TaskMint?',
    a: 'Creating an account is free, and to activate the earning features you pay a one-time joining fee of Rs. 150. After activation you earn by completing tasks such as watching video ads, answering surveys, trying offers, daily check-ins and the spin wheel.',
  },
  {
    q: 'How do I withdraw my earnings?',
    a: 'Once your wallet reaches the minimum payout of Rs. 500, you can request a withdrawal to JazzCash, EasyPaisa or your bank account from the dashboard. Add your correct account details and submit the request — that is it.',
  },
  {
    q: 'What is the minimum payout on TaskMint?',
    a: 'The minimum payout is Rs. 500. Once your balance reaches it, you can request a payout to JazzCash, EasyPaisa or your bank account.',
  },
  {
    q: 'How does the referral programme work?',
    a: 'Share your personal referral link with friends. When a friend joins TaskMint through your link and becomes an active user, you earn a referral bonus of Rs. 125 per active referral, credited to your wallet.',
  },
  {
    q: 'Which tasks pay the most?',
    a: 'Surveys and offer walls from partners such as CPX Research, CPA Lead and Wannads usually pay the highest rewards. Video ads and daily check-ins are quicker tasks that add up steadily every day.',
  },
  {
    q: 'Is there a TaskMint mobile app?',
    a: 'Yes, TaskMint has an Android app. Visit the Download App page to get the latest version and earn on the go with the same account and wallet.',
  },
];

const earnWays = [
  {
    icon: PlayCircleIcon,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Watch Video Ads',
    text: 'Watch short rewarded video ads powered by Unity Ads and get credited instantly in your wallet.',
  },
  {
    icon: ClipboardList,
    color: 'bg-sky-50 text-sky-600',
    title: 'Surveys that Pay',
    text: 'Share your opinion through CPX Research surveys. Longer surveys pay higher rewards.',
  },
  {
    icon: BriefcaseIcon,
    color: 'bg-violet-50 text-violet-600',
    title: 'Offer Walls',
    text: 'Try apps and offers from CPA Lead and Wannads — the highest-paying tasks on TaskMint.',
  },
  {
    icon: Dices,
    color: 'bg-amber-50 text-amber-600',
    title: 'Lottery Draws',
    text: 'Try your luck in regular lottery draws for bonus cash prizes.',
  },
  {
    icon: CalendarCheck,
    color: 'bg-rose-50 text-rose-600',
    title: 'Daily Check-in',
    text: 'Open TaskMint every day and claim your daily check-in reward. Consistency pays.',
  },
  {
    icon: UserGroupIcon,
    color: 'bg-teal-50 text-teal-600',
    title: 'Refer & Earn Rs. 125',
    text: 'Invite friends with your referral link and earn Rs. 125 for every active user you bring.',
  },
];

export default function Landing() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'TaskMint - Earn Money Online in Pakistan | Online Earning Platform';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'TaskMint is an online earning platform in Pakistan. Earn money by watching ads, taking surveys and completing simple tasks. Withdraw from Rs. 500 via JazzCash, EasyPaisa or bank transfer.');
    }
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const onGetStarted = (view: 'login' | 'signup') => navigate(`/${view}`);
  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const latestPosts = blogPosts.slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden antialiased">
      {/* --- Header --- */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled || mobileMenu ? 'bg-white/95 backdrop-blur border-b border-slate-100 shadow-[0_1px_12px_rgba(15,23,42,0.04)]' : 'bg-white/70 backdrop-blur'}`}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-[72px] flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5" aria-label="TaskMint home">
            <span className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <Coins className="w-5.5 h-5.5" />
            </span>
            <span className="text-[22px] font-extrabold tracking-tight">Task<span className="text-emerald-600">Mint</span></span>
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button onClick={() => scrollTo('ways-to-earn')} className="hover:text-emerald-700 transition-colors">Ways to Earn</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-emerald-700 transition-colors">How It Works</button>
            <button onClick={() => scrollTo('payouts')} className="hover:text-emerald-700 transition-colors">Payouts</button>
            <button onClick={() => navigate('/blog')} className="hover:text-emerald-700 transition-colors">Blog</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-emerald-700 transition-colors">FAQ</button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => onGetStarted('login')} className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-emerald-700 transition-colors">Log In</button>
            <button onClick={() => onGetStarted('signup')} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors">Create Account</button>
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-slate-800" aria-label="Menu">
            {mobileMenu ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 flex flex-col gap-1 text-[15px] font-semibold text-slate-700">
            <button onClick={() => scrollTo('ways-to-earn')} className="text-left py-2.5">Ways to Earn</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-left py-2.5">How It Works</button>
            <button onClick={() => scrollTo('payouts')} className="text-left py-2.5">Payouts</button>
            <button onClick={() => { navigate('/blog'); setMobileMenu(false); }} className="text-left py-2.5">Blog</button>
            <button onClick={() => scrollTo('faq')} className="text-left py-2.5">FAQ</button>
            <div className="grid grid-cols-2 gap-3 pt-3 pb-2">
              <button onClick={() => onGetStarted('login')} className="py-3 rounded-xl border border-slate-200 font-bold">Log In</button>
              <button onClick={() => onGetStarted('signup')} className="py-3 rounded-xl bg-emerald-600 text-white font-bold">Sign Up</button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* --- Hero --- */}
        <section className="relative pt-[130px] pb-16 md:pt-[160px] md:pb-24 bg-gradient-to-b from-emerald-50/80 via-white to-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-14 items-center relative">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Online earning platform — Pakistan
              </span>
              <h1 className="mt-6 text-4xl sm:text-5xl xl:text-[56px] font-extrabold leading-[1.08] tracking-tight">
                Earn money online in your <span className="text-emerald-600">free time</span>
              </h1>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-xl">
                Complete simple tasks on your phone — watch video ads, answer surveys and try offers — and withdraw your balance once it reaches Rs. 500 to JazzCash, EasyPaisa or your bank.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button onClick={() => onGetStarted('signup')} className="inline-flex justify-center items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-colors">
                  Start Earning <ArrowRight className="w-4.5 h-4.5" />
                </button>
                <button onClick={() => scrollTo('how-it-works')} className="inline-flex justify-center items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition-colors">
                  See How It Works
                </button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
                <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-4.5 h-4.5 text-emerald-600" /> One-time joining fee Rs. 150</li>
                <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-4.5 h-4.5 text-emerald-600" /> Minimum payout Rs. 500</li>
                <li className="flex items-center gap-1.5"><CheckCircleIcon className="w-4.5 h-4.5 text-emerald-600" /> JazzCash &amp; EasyPaisa</li>
              </ul>
            </motion.div>

            {/* Wallet preview card */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: [0, -10, 0] }} transition={{ duration: 0.5, delay: 0.12, y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.7 } }} className="relative max-w-md w-full mx-auto lg:ml-auto">
              <div className="rounded-3xl bg-slate-900 text-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white/70"><WalletIcon className="w-4.5 h-4.5" /> My Wallet</span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300">LIVE BALANCE</span>
                </div>
                <p className="mt-5 text-4xl font-extrabold tracking-tight">Rs. 1,250<span className="text-white/40 text-2xl">.00</span></p>
                <div className="mt-7 space-y-3">
                  {[
                    { label: 'Watched a video ad', amount: '+ Rs. 15', icon: PlayCircleIcon },
                    { label: 'CPX survey completed', amount: '+ Rs. 180', icon: ClipboardList },
                    { label: 'Daily check-in bonus', amount: '+ Rs. 10', icon: CalendarCheck },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                      <span className="flex items-center gap-3 text-sm font-medium text-white/85"><row.icon className="w-4.5 h-4.5 text-emerald-300" />{row.label}</span>
                      <span className="text-sm font-bold text-emerald-300">{row.amount}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => onGetStarted('signup')} className="mt-7 w-full py-3.5 rounded-xl bg-emerald-500 font-bold text-white hover:bg-emerald-400 transition-colors">Withdraw to JazzCash</button>
                <p className="mt-3 text-center text-xs text-white/40">Sample wallet preview — your earnings depend on tasks completed.</p>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="max-w-7xl mx-auto px-5 lg:px-8 mt-16 md:mt-20">
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-6 rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] px-6 py-8">
              {[
                { val: '50K+', label: 'Active users' },
                { val: 'Rs. 2.5M+', label: 'Paid out to users' },
                { val: 'Rs. 500', label: 'Minimum payout' },
                { val: '24/7', label: 'Tasks available' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <dt className="order-2 block text-sm font-medium text-slate-500 mt-1">{s.label}</dt>
                  <dd className="text-2xl md:text-3xl font-extrabold text-slate-900">{s.val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* --- Partners --- */}
        <section className="py-10 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Earning partners</p>
            <div className="mt-6 flex flex-wrap justify-center gap-x-12 gap-y-4 text-lg font-extrabold text-slate-400">
              <span>CPX Research</span><span>CPA Lead</span><span>Wannads</span><span>Unity Ads</span>
            </div>
          </div>
        </section>

        {/* --- Ways to Earn --- */}
        <section id="ways-to-earn" className="py-20 md:py-24 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Six simple ways to earn</h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">No skills required — a one-time joining fee of Rs. 150 activates your account. Pick any task, finish it, and the reward lands in your TaskMint wallet.</p>
            </div>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {earnWays.map((way, i) => (
                <motion.article key={way.title} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, delay: (i % 3) * 0.1 }} className="rounded-3xl border border-slate-100 bg-white p-7 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 transition-all">
                  <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${way.color}`}><way.icon className="w-6 h-6" /></span>
                  <h3 className="mt-5 text-lg font-bold">{way.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{way.text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* --- How It Works --- */}
        <section id="how-it-works" className="py-20 md:py-24 bg-slate-50 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Start earning in 3 steps</h2>
              <p className="mt-4 text-lg text-slate-600">From sign-up to your first withdrawal in minutes.</p>
            </div>
            <ol className="mt-14 grid md:grid-cols-3 gap-5">
              {[
                { icon: Smartphone, step: 'Step 1', title: 'Create your account', text: 'Sign up with your details in under a minute, then activate your account with the one-time Rs. 150 joining fee. Your wallet and referral link are created automatically.' },
                { icon: ClipboardList, step: 'Step 2', title: 'Complete simple tasks', text: 'Watch ads, take surveys, try offers, check in daily and spin the wheel. Every completed task adds money to your wallet.' },
                { icon: CircleDollarSign, step: 'Step 3', title: 'Withdraw from Rs. 500', text: 'Reach Rs. 500 and cash out to JazzCash, EasyPaisa or your bank account directly from the dashboard.' },
              ].map((item, i) => (
                <motion.li key={item.title} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, delay: i * 0.12 }} className="rounded-3xl bg-white border border-slate-100 p-8 text-center shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
                  <span className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20"><item.icon className="w-7 h-7" /></span>
                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">{item.step}</p>
                  <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{item.text}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* --- Payouts --- */}
        <section id="payouts" className="py-20 md:py-24 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Fast payouts, low minimum</h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Your money should not sit locked in an app. TaskMint lets you withdraw as soon as your balance reaches Rs. 500, using the payment methods Pakistan actually uses.
              </p>
              <ul className="mt-7 space-y-3.5 text-[15px] font-medium text-slate-700">
                <li className="flex gap-2.5"><CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" /> Withdraw directly from your dashboard — no forms or phone calls</li>
                <li className="flex gap-2.5"><CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" /> Full transaction history inside your wallet</li>
                <li className="flex gap-2.5"><Clock3 className="w-5 h-5 text-emerald-600 shrink-0" /> Requests are processed in order, every day</li>
              </ul>
              <button onClick={() => onGetStarted('signup')} className="mt-9 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-colors">Create Account <ArrowRight className="w-4.5 h-4.5" /></button>
            </div>
            <div className="grid gap-4">
              {[
                { icon: Smartphone, name: 'JazzCash', note: 'Withdraw to your JazzCash mobile account.' },
                { icon: WalletIcon, name: 'EasyPaisa', note: 'Withdraw to your EasyPaisa mobile account.' },
                { icon: BankIcon, name: 'Bank Transfer', note: 'Withdraw directly to your local bank account.' },
              ].map((m, i) => (
                <motion.div key={m.name} initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, delay: i * 0.1 }} className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
                  <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><m.icon className="w-6 h-6" /></span>
                  <div>
                    <h3 className="font-bold text-lg">{m.name}</h3>
                    <p className="text-sm text-slate-600">{m.note}</p>
                  </div>
                  <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">Min Rs. 500</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Referral banner --- */}
        <section className="px-5 lg:px-8 pb-20 md:pb-24">
          <div className="max-w-7xl mx-auto rounded-[2rem] bg-gradient-to-br from-emerald-700 to-teal-700 text-white px-7 py-12 md:p-14 grid md:grid-cols-[1fr_auto] gap-8 items-center overflow-hidden">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100/90"><GiftIcon className="w-4 h-4" /> Referral programme</span>
              <h2 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">Refer friends, earn Rs. 125 each</h2>
              <p className="mt-3 text-emerald-50/85 text-lg max-w-xl">Every active friend who joins with your link adds Rs. 125 to your wallet. There is no limit on referrals.</p>
            </div>
            <button onClick={() => onGetStarted('signup')} className="px-7 py-3.5 rounded-xl bg-white text-emerald-800 font-bold shadow-xl hover:bg-emerald-50 transition-colors whitespace-nowrap">Get My Referral Link</button>
          </div>
        </section>

        {/* --- Why TaskMint / About --- */}
        <section className="py-20 md:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">About TaskMint</h2>
              <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-slate-600">
                <p>TaskMint is an online earning platform built for Pakistan. We connect users with global advertising and research partners — including CPX Research, CPA Lead, Wannads and Unity Ads — and share the revenue with the people who complete the tasks.</p>
                <p>Instead of spending hours searching for scattered earning apps, you get one wallet, one dashboard and tasks that are available around the clock: rewarded videos, surveys, offer walls, daily check-ins and a referral programme that keeps paying as your network grows.</p>
                <p>Whether you are a student covering pocket money or simply want a productive use for your free time, TaskMint keeps the rules simple: complete a task, earn the reward, withdraw from Rs. 500.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 self-start">
              {[
                { icon: ShieldCheck, title: 'Clear, simple rules', text: 'Task rewards, payout minimums and policies are written on the site — read them any time.' },
                { icon: BadgeCheck, title: 'Real task partners', text: 'Tasks come from established global networks, not screenshots or manual approvals.' },
                { icon: Zap, title: 'Instant wallet credit', text: 'Most task rewards are credited to your wallet as soon as the partner confirms completion.' },
                { icon: SparklesIcon, title: 'Made for mobile', text: 'TaskMint is designed for phones first, and the Android app keeps your wallet in your pocket.' },
              ].map((f) => (
                <div key={f.title} className="rounded-3xl bg-white border border-slate-100 p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
                  <f.icon className="w-7 h-7 text-emerald-600" />
                  <h3 className="mt-4 font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Latest from the blog --- */}
        <section className="py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Guides from the TaskMint blog</h2>
                <p className="mt-3 text-lg text-slate-600">Practical guides on earning more and withdrawing safely.</p>
              </div>
              <button onClick={() => navigate('/blog')} className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:gap-2.5 transition-all">View all articles <ArrowRight className="w-4.5 h-4.5" /></button>
            </div>
            <div className="mt-10 grid md:grid-cols-3 gap-5">
              {latestPosts.map((post, i) => (
                <motion.article key={post.id} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, delay: i * 0.1 }} className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-shadow cursor-pointer" onClick={() => navigate(`/blog/${post.slug}`)}>
                  <img src={post.image} alt={post.title} className="w-full h-44 object-cover" loading="lazy" />
                  <div className="p-6">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">{post.category}</span>
                    <h3 className="mt-3.5 font-bold text-lg leading-snug">{post.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">{post.excerpt}</p>
                    <p className="mt-4 text-xs font-semibold text-slate-400">{post.date} · {post.author}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* --- FAQ --- */}
        <section id="faq" className="py-20 md:py-24 bg-slate-50 scroll-mt-20">
          <div className="max-w-3xl mx-auto px-5 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center">Frequently asked questions</h2>
            <p className="mt-4 text-lg text-slate-600 text-center">Everything new users ask before their first withdrawal.</p>
            <div className="mt-10 space-y-3">
              {faqs.map((item, i) => (
                <div key={item.q} className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-bold" aria-expanded={openFaq === i}>
                    {item.q}
                    <ChevronDown className={`w-5 h-5 text-emerald-600 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && <p className="px-6 pb-6 text-[15px] leading-relaxed text-slate-600">{item.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Your free time is worth money</h2>
            <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">Join TaskMint today, activate your account with the one-time Rs. 150 joining fee, complete your first task in minutes, and cash out once you reach Rs. 500.</p>
            <button onClick={() => onGetStarted('signup')} className="mt-9 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-colors">Create Account <ArrowRight className="w-4.5 h-4.5" /></button>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="flex items-center gap-2.5 text-white">
              <span className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center"><Coins className="w-5 h-5" /></span>
              <span className="text-xl font-extrabold">Task<span className="text-emerald-400">Mint</span></span>
            </p>
            <p className="mt-5 text-sm leading-relaxed max-w-sm">TaskMint is an online earning platform for Pakistan. Earn by watching ads, taking surveys and completing simple tasks, and withdraw via JazzCash, EasyPaisa or bank transfer.</p>
            <p className="mt-5 text-sm">Support: <a href="mailto:support@taskmint.click" className="text-emerald-400 font-semibold">support@taskmint.click</a></p>
          </div>
          <nav>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Platform</h3>
            <ul className="mt-5 space-y-3 text-sm font-medium">
              <li><button onClick={() => scrollTo('ways-to-earn')} className="hover:text-emerald-400">Ways to Earn</button></li>
              <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-emerald-400">How It Works</button></li>
              <li><button onClick={() => navigate('/app-download')} className="hover:text-emerald-400">Download App</button></li>
              <li><button onClick={() => navigate('/blog')} className="hover:text-emerald-400">Blog</button></li>
            </ul>
          </nav>
          <nav>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Legal</h3>
            <ul className="mt-5 space-y-3 text-sm font-medium">
              <li><button onClick={() => navigate('/privacy')} className="hover:text-emerald-400">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/terms')} className="hover:text-emerald-400">Terms of Service</button></li>
              <li><button onClick={() => navigate('/refund')} className="hover:text-emerald-400">Refund Policy</button></li>
              <li><button onClick={() => navigate('/disclaimer')} className="hover:text-emerald-400">Disclaimer</button></li>
            </ul>
          </nav>
          <nav>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Support</h3>
            <ul className="mt-5 space-y-3 text-sm font-medium">
              <li><button onClick={() => navigate('/contact')} className="hover:text-emerald-400">Contact Us</button></li>
              <li><button onClick={() => scrollTo('faq')} className="hover:text-emerald-400">FAQ</button></li>
              <li><button onClick={() => navigate('/promotion')} className="hover:text-emerald-400">Promotion &amp; Ads</button></li>
              <li><button onClick={() => onGetStarted('login')} className="hover:text-emerald-400">Log In</button></li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 py-6 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs">
            <p>© 2026 TaskMint. All rights reserved.</p>
            <p>Earnings depend on tasks completed. Please read our Terms and Disclaimer.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
