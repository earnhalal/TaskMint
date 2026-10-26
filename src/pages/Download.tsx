import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Download,
  ShieldCheck,
  Wallet,
  ArrowLeft,
  CheckCircle2,
  ListChecks,
  PlayCircle,
  UserPlus,
  BadgeCheck,
  Info,
  History,
  ChevronDown,
  Mail,
  Trophy,
  Coins,
  Package,
  CalendarDays,
  HardDrive,
  User,
  Grid2x2,
  Smartphone,
  Tag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

const APK_URL = 'https://github.com/earnhalal/TaskMint/releases/latest/download/TaskMint.apk';
const RELEASES_API = 'https://api.github.com/repos/earnhalal/TaskMint/releases?per_page=30';
const RELEASES_PAGE = 'https://github.com/earnhalal/TaskMint/releases';

interface ReleaseInfo {
  tag: string;
  version: string;
  name: string;
  date: string;
  sizeMb: string;
  apkUrl: string;
  pageUrl: string;
  notes: string;
}

function cleanNotes(body: string): string {
  return (body || '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function parseReleases(data: any): ReleaseInfo[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((r) => r && !r.draft && r.tag_name)
    .map((r) => {
      const assets = Array.isArray(r.assets) ? r.assets : [];
      const apk = assets.find((a: any) => typeof a?.name === 'string' && a.name.toLowerCase().endsWith('.apk'));
      const tag = String(r.tag_name);
      return {
        tag,
        version: tag.replace(/^v/i, ''),
        name: r.name || `TaskMint ${tag}`,
        date: r.published_at
          ? new Date(r.published_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
          : '',
        sizeMb: apk?.size ? `${(apk.size / 1048576).toFixed(1)} MB` : '—',
        apkUrl: apk?.browser_download_url || `https://github.com/earnhalal/TaskMint/releases/download/${tag}/TaskMint.apk`,
        pageUrl: r.html_url || RELEASES_PAGE,
        notes: cleanNotes(r.body || ''),
      } as ReleaseInfo;
    });
}

const FEATURES = [
  {
    icon: ListChecks,
    chip: 'bg-emerald-500',
    title: 'Daily Tasks',
    text: 'Complete simple daily tasks and social media tasks to earn money from your phone.',
  },
  {
    icon: PlayCircle,
    chip: 'bg-rose-500',
    title: 'Watch & Earn',
    text: 'Watch sponsored video ads in the app and earn Gold Coins for every completed view.',
  },
  {
    icon: UserPlus,
    chip: 'bg-orange-500',
    title: 'Refer & Earn',
    text: 'Invite friends and earn Rs. 100 per referral — Rs. 125 per referral for partner accounts.',
  },
  {
    icon: Wallet,
    chip: 'bg-teal-500',
    title: 'EasyPaisa & JazzCash Payouts',
    text: 'Deposit and withdraw with EasyPaisa and JazzCash. Minimum withdrawal is Rs. 500 with a 5% fee.',
  },
  {
    icon: Mail,
    chip: 'bg-sky-500',
    title: 'Built-in Mailbox',
    text: 'A Gmail-style mailbox inside the app — read messages from the TaskMint team and write to them any time.',
  },
  {
    icon: Trophy,
    chip: 'bg-amber-500',
    title: 'Leaderboard & Rewards',
    text: 'Daily Bonus, Streak Rewards and a Champions leaderboard ranked by balance, with Gold Coins on top.',
  },
];

const TAGS = ['Earning App', 'Online Earning Pakistan', 'Daily Tasks', 'Watch & Earn', 'Refer & Earn', 'EasyPaisa', 'JazzCash', 'Gold Coins', 'Finance'];

const FAQS = [
  {
    q: 'Is the TaskMint app free to download?',
    a: 'Yes — downloading and installing the app is completely free. Creating an account is free too; a one-time activation fee of Rs. 150 applies inside the app to unlock earning.',
  },
  {
    q: 'How do I install the APK?',
    a: 'Tap the Install button, open the downloaded file, and allow "Install unknown apps" for your browser if Android asks — this is normal for apps installed directly from the official website. Then tap Install and sign in.',
  },
  {
    q: 'How and when do I get paid?',
    a: 'Earnings are paid to EasyPaisa or JazzCash. The minimum withdrawal is Rs. 500 with a 5% fee, and payouts are processed in the monthly windows (1st–3rd and 16th–18th).',
  },
  {
    q: 'Can I install an older version?',
    a: 'Yes — every published version is listed in the Old Versions section on this page with its own download button. Installing any version keeps your account, balance and data — newer versions include everything from the older ones.',
  },
  {
    q: 'Is this the official download page?',
    a: 'Yes. This page on taskmint.click is the only official source for the TaskMint app. Do not install TaskMint APKs from other websites.',
  },
];

const INSTALL_STEPS = [
  {
    title: 'Tap "Download APK"',
    text: 'Tap the green Download APK button on this page — or pick any version from the Old Versions list below. The official TaskMint APK (about 13 MB) will start downloading.',
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

/** Stylised phone mockups of the app (design elements in the app palette). */
function PhoneShot({ caption, children, tilt }: { caption: string; children: React.ReactNode; tilt: string }) {
  return (
    <div className={`w-40 sm:w-48 shrink-0 snap-center rounded-[1.9rem] bg-slate-900 p-2 shadow-xl shadow-slate-900/20 ${tilt}`}>
      <div className="rounded-[1.5rem] bg-[#0B0D10] overflow-hidden min-h-[240px]">{children}</div>
      <p className="text-center text-[11px] font-black text-slate-300 py-2">{caption}</p>
    </div>
  );
}

function Screenshots() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <PhoneShot caption="Home & Balance" tilt="">
        <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 p-3.5">
          <p className="text-[8px] font-black text-emerald-50/80 uppercase tracking-widest">Total Balance</p>
          <p className="text-xl font-black text-white leading-tight">Rs. 8,863</p>
          <div className="h-1.5 rounded-full bg-black/25 mt-2 overflow-hidden">
            <div className="h-full w-4/5 bg-gradient-to-r from-amber-300 to-yellow-500 rounded-full" />
          </div>
          <div className="mt-3 inline-block bg-gradient-to-r from-amber-300 to-yellow-500 text-[8px] font-black text-black px-2.5 py-1.5 rounded-lg">CASH OUT</div>
        </div>
        <div className="p-3.5 space-y-2">
          {[
            ['bg-rose-500', 'Watch Ads', '+ Coins'],
            ['bg-violet-500', 'Earn Zone', 'Tasks'],
            ['bg-teal-500', 'Daily Bonus', '100–1,000'],
          ].map(([c, t, r]) => (
            <div key={t} className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-2">
              <span className={`w-4 h-4 rounded ${c} shrink-0`} />
              <span className="text-[10px] font-bold text-zinc-200 flex-1">{t}</span>
              <span className="text-[9px] font-black text-amber-300">{r}</span>
            </div>
          ))}
        </div>
      </PhoneShot>

      <PhoneShot caption="Watch & Earn Coins" tilt="">
        <div className="p-3.5">
          <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-300/25 rounded-full px-2.5 py-1.5 w-max">
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[10px] font-black text-amber-200">1,250 Gold Coins</span>
          </div>
          <p className="text-[9px] font-bold text-zinc-400 mt-2">100 Coins = Rs. 1 • Convert any time</p>
          <div className="mt-3 rounded-xl bg-gradient-to-br from-emerald-600/40 to-teal-800/40 border border-emerald-400/20 p-3 text-center">
            <PlayCircle className="w-8 h-8 text-emerald-300 mx-auto" />
            <p className="text-[10px] font-black text-white mt-1.5">Rewarded Video Ad</p>
            <p className="text-[9px] font-bold text-emerald-300">+50 Gold Coins</p>
          </div>
          <div className="mt-2.5 flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold text-zinc-300">Ad completed — coins added</span>
          </div>
        </div>
      </PhoneShot>

      <PhoneShot caption="Lottery" tilt="">
        <div className="bg-gradient-to-b from-[#2b1152] to-[#170a30] p-3.5">
          <p className="text-[8px] font-black text-fuchsia-200 uppercase tracking-widest">Mega Lottery</p>
          <p className="text-xl font-black text-white leading-tight">Rs. 25,000</p>
          <p className="text-[9px] font-bold text-violet-300 mt-0.5">Prize pool • Winners paid to balance</p>
          <div className="mt-3 inline-block bg-gradient-to-r from-amber-300 to-yellow-500 text-[8px] font-black text-amber-950 px-2.5 py-1.5 rounded-lg">JOIN NOW</div>
        </div>
        <div className="p-3.5 space-y-2">
          {[
            ['Weekly Draw', 'Rs. 5,000'],
            ['Daily Draw', 'Rs. 1,000'],
          ].map(([t, r]) => (
            <div key={t} className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-2">
              <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="text-[10px] font-bold text-zinc-200 flex-1">{t}</span>
              <span className="text-[9px] font-black text-amber-300">{r}</span>
            </div>
          ))}
        </div>
      </PhoneShot>

      <PhoneShot caption="Mailbox" tilt="">
        <div className="p-3.5 space-y-2">
          <p className="text-[10px] font-black text-white">Inbox</p>
          {[
            ['bg-emerald-500', 'T', 'TaskMint Team', 'Your withdrawal window is…', true],
            ['bg-sky-500', 'T', 'TaskMint Team', 'Welcome to TaskMint!', false],
            ['bg-violet-500', 'T', 'TaskMint Team', 'Gold Coins are live 🪙', false],
          ].map(([c, i, f, s, unread]) => (
            <div key={s as string} className="flex items-start gap-2 bg-white/5 rounded-lg px-2.5 py-2">
              <span className={`w-6 h-6 rounded-full ${c} text-white text-[9px] font-black flex items-center justify-center shrink-0`}>{i}</span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black text-zinc-100 truncate">{f}</span>
                <span className="block text-[9px] font-semibold text-zinc-400 truncate">{s}</span>
              </span>
              {unread ? <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" /> : null}
            </div>
          ))}
          <div className="bg-sky-500 text-black text-[9px] font-black text-center rounded-lg py-2">+ COMPOSE</div>
        </div>
      </PhoneShot>
    </div>
  );
}

export default function DownloadPage() {
  const navigate = useNavigate();
  const [releases, setReleases] = useState<ReleaseInfo[]>([]);
  const [releasesState, setReleasesState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAllVersions, setShowAllVersions] = useState(false);

  useSEO({
    title: 'TaskMint APK Download — Latest & Old Versions | TaskMint for Android',
    description:
      'Download the official TaskMint APK for Android — the latest version plus all old versions. Complete daily tasks, watch video ads and refer friends to earn money online in Pakistan, with EasyPaisa and JazzCash withdrawals from Rs. 500.',
    canonical: 'https://www.taskmint.click/app-download',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('releases fetch failed'))))
      .then((data) => {
        if (cancelled) return;
        const parsed = parseReleases(data);
        setReleases(parsed);
        setReleasesState(parsed.length ? 'ok' : 'error');
      })
      .catch(() => {
        if (!cancelled) setReleasesState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = releases[0];

  const techInfo = [
    { icon: Tag, label: 'Version', value: latest ? latest.version : '1.21' },
    { icon: CalendarDays, label: 'Updated on', value: latest ? latest.date : '—' },
    { icon: HardDrive, label: 'Size', value: latest ? latest.sizeMb : 'About 13 MB' },
    { icon: User, label: 'Developer', value: 'TaskMint' },
    { icon: Grid2x2, label: 'Category', value: 'Finance / Earning' },
    { icon: Smartphone, label: 'Requires Android', value: '7.0 and up' },
    { icon: Package, label: 'Package name', value: 'click.taskmint.app' },
    { icon: ShieldCheck, label: 'License', value: 'Free' },
  ];

  const visibleVersions = showAllVersions ? releases : releases.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f4f6f5] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="TaskMint" className="w-8 h-8 rounded-lg shadow-md shadow-emerald-500/20" />
            <span className="font-black text-xl tracking-tighter text-slate-900">TaskMint</span>
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white px-2 py-0.5 rounded-full">App Store</span>
          </div>
          <a
            href={APK_URL}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-full transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Get the App
          </a>
        </div>
      </header>

      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* ── App header card (APKPure/Uptodown style) ─────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <img
                src="/favicon.svg"
                alt="TaskMint app icon"
                className="w-24 h-24 md:w-28 md:h-28 rounded-[1.6rem] shadow-lg shadow-emerald-600/20 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  TaskMint <span className="text-slate-400 text-xl md:text-2xl font-black">APK</span>
                </h1>
                <p className="text-emerald-600 font-bold mt-1 flex items-center gap-1.5">
                  TaskMint Official
                  <BadgeCheck className="w-4.5 h-4.5 w-[18px] h-[18px] text-sky-500" />
                </p>
                <p className="text-slate-500 font-medium text-sm mt-1">Earn money online in Pakistan — tasks, video ads &amp; referrals</p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm">
                  <span className="flex items-center gap-1.5 font-black text-slate-800">
                    <Download className="w-4 h-4 text-emerald-600" /> 3,500+ members
                  </span>
                  <span className="font-black text-slate-800">{latest ? latest.sizeMb : '13.1 MB'}</span>
                  <span className="font-black text-slate-800">{latest ? `v${latest.version}` : 'Latest'}</span>
                  <span className="font-semibold text-slate-500">Android 7.0+</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <ShieldCheck className="w-4 h-4" /> Verified safe
                  </span>
                </div>
              </div>
            </div>

            <a
              href={APK_URL}
              download
              className="mt-7 flex items-center justify-center gap-2.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.99]"
            >
              <Download className="w-5 h-5" />
              Download APK{latest ? ` — v${latest.version}` : ''}
            </a>
            <p className="mt-2.5 text-center text-xs font-semibold text-slate-400">
              Fast, direct download from the official TaskMint source · Free · One-time in-app activation fee of Rs. 150 applies
            </p>
          </motion.section>

          {/* ── Screenshots ─────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-5"
          >
            <h2 className="text-xl font-black text-slate-900 mb-5">Screenshots</h2>
            <Screenshots />
          </motion.section>

          {/* ── What's New ──────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-5"
          >
            <h2 className="text-xl font-black text-slate-900 mb-1">What&apos;s New</h2>
            <p className="text-sm font-bold text-emerald-600 mb-4">
              {latest ? `${latest.name}${latest.date ? ` · ${latest.date}` : ''}` : 'Latest version'}
            </p>
            {latest && latest.notes ? (
              <div className="text-slate-600 font-medium leading-relaxed text-[15px] whitespace-pre-wrap">{latest.notes}</div>
            ) : (
              <p className="text-slate-600 font-medium leading-relaxed text-[15px]">
                Version 1.21 — a Gmail-style mailbox in the app (read and write to the TaskMint
                team), a fixed Invite page, a Champions leaderboard ranked by balance with profile
                pictures, and a fresh, colourful look across Home, Lottery and Invite.
              </p>
            )}
          </motion.section>

          {/* ── About ───────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-5"
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
                Rs. 150, and start completing tasks. Video ads pay in Gold Coins (100 Gold Coins =
                Rs. 1), which you can convert into your main balance at any time. Earnings can be
                withdrawn to EasyPaisa or JazzCash once your balance reaches Rs. 500. A 5% withdrawal
                fee applies, and payouts are processed in the monthly payout windows (1st–3rd and
                16th–18th). Referrals pay Rs. 100 per friend, or Rs. 125 per friend for partner
                accounts.
              </p>
              <p>
                Installing the app from this page also makes you eligible for the Rs. 100 app-install
                bonus — just sign in after installing and claim it in the app.
              </p>
            </div>

            <h3 className="text-base font-black text-slate-900 mt-8 mb-4">Features</h3>
            <div className="grid sm:grid-cols-2 gap-5">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 ${feature.chip} rounded-xl flex items-center justify-center text-white shrink-0 shadow-md`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-0.5">{feature.title}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-8">
              {TAGS.map((t) => (
                <span key={t} className="text-[11px] font-bold text-slate-500 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors px-3 py-1.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </motion.section>

          {/* ── Technical information ─────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-5"
          >
            <h2 className="text-xl font-black text-slate-900 mb-5">Information</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
              {techInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{item.value}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                <strong>Safe &amp; official.</strong> Every APK on this page is the original,
                signed TaskMint release — the same signature on every version, so updates install
                cleanly over older versions and your account stays untouched. This page on
                taskmint.click is the only official download source.
              </p>
            </div>
          </motion.section>

          {/* ── Old Versions ──────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-5"
          >
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
              <span className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                <History className="w-5 h-5" />
              </span>
              Old Versions
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-3 leading-relaxed">
              Every TaskMint version ever published — pick any one. Newer versions include
              everything from the older ones, so the latest version is recommended; older versions
              stay available here if you ever need them.
            </p>

            <div className="mt-5 divide-y divide-slate-100">
              {releasesState === 'loading' && (
                <p className="py-6 text-sm font-semibold text-slate-400">Loading versions…</p>
              )}
              {releasesState === 'error' && (
                <div className="py-6">
                  <p className="text-sm font-semibold text-slate-500 mb-3">
                    The version list could not be loaded right now.
                  </p>
                  <a
                    href={RELEASES_PAGE}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-700 hover:text-emerald-600"
                  >
                    View all releases <ChevronDown className="w-4 h-4 -rotate-90" />
                  </a>
                </div>
              )}
              {releasesState === 'ok' &&
                visibleVersions.map((rel, i) => (
                  <div key={rel.tag} className="py-4 flex items-center gap-4">
                    <img src="/favicon.svg" alt="" className="w-11 h-11 rounded-xl shadow-sm shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900 flex items-center gap-2 flex-wrap">
                        TaskMint {rel.tag}
                        {i === 0 && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            Latest
                          </span>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          APK
                        </span>
                      </p>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">
                        {rel.date} · {rel.sizeMb}
                      </p>
                    </div>
                    <a
                      href={rel.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden sm:inline text-xs font-black text-slate-400 hover:text-emerald-700 shrink-0"
                    >
                      Notes
                    </a>
                    <a
                      href={rel.apkUrl}
                      download
                      className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-full transition-all active:scale-95 ${
                        i === 0
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25'
                          : 'bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                ))}
            </div>

            {releasesState === 'ok' && releases.length > 6 && (
              <button
                onClick={() => setShowAllVersions((s) => !s)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-sm font-black text-emerald-700 hover:text-emerald-600 py-2"
              >
                {showAllVersions ? 'Show fewer versions' : `Show all ${releases.length} versions`}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllVersions ? 'rotate-180' : ''}`} />
              </button>
            )}
          </motion.section>

          {/* ── How to install ────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-5"
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

            <div className="mt-8 flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 font-medium leading-relaxed">
                <strong>Seeing a security prompt?</strong> That is normal. Android and some phone
                brands (such as Huawei) show a caution screen for any app installed from outside the
                Play Store. This page on <strong>taskmint.click</strong> is the official TaskMint
                download page — if your phone asks, choose &quot;Install anyway&quot; to continue.
                Only download the TaskMint app from this page.
              </p>
            </div>

            <div className="mt-6 space-y-2.5">
              {[
                'Free to download — works on Android 7.0 and up',
                'Same account and wallet as taskmint.click',
                'Rs. 100 app-install bonus for app users',
                'Updating keeps your balance, coins and history',
              ].map((line) => (
                <p key={line} className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
                  <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 shrink-0" />
                  {line}
                </p>
              ))}
            </div>
          </motion.section>

          {/* ── FAQ ───────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-5"
          >
            <h2 className="text-xl font-black text-slate-900 mb-4">Frequently asked questions</h2>
            <div className="divide-y divide-slate-100">
              {FAQS.map((faq, i) => (
                <div key={faq.q}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="text-sm font-black text-slate-800">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <p className="pb-4 text-sm font-medium text-slate-500 leading-relaxed">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── Bottom CTA ────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-8 text-center shadow-xl shadow-emerald-900/20"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-yellow-300/20 blur-3xl" />
            <img src="/favicon.svg" alt="TaskMint" className="relative w-16 h-16 rounded-2xl mx-auto shadow-2xl bg-white" />
            <h2 className="relative text-2xl font-black text-white mt-4">Get TaskMint for Android</h2>
            <p className="relative text-emerald-50/85 font-medium text-sm mt-1.5 max-w-md mx-auto">
              Tasks, video ads, Gold Coins and referrals — start earning from your phone today.
            </p>
            <a
              href={APK_URL}
              download
              className="relative mt-6 inline-flex items-center gap-2.5 bg-white text-emerald-800 px-8 py-3.5 rounded-full font-black text-base shadow-xl active:scale-[0.98] transition-all"
            >
              <Download className="w-5 h-5" />
              Download APK{latest ? ` — v${latest.version}` : ''}
            </a>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
