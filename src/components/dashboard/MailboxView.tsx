import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, onValue, push, set, update } from 'firebase/database';
import { rtdb } from '../../firebase';
import { ArrowLeft, PenSquare, Send, Inbox, MailOpen, X } from 'lucide-react';

/**
 * Mailbox — a Gmail-style inbox for the app (2026-10-26).
 *
 * Data flow (the Firestore `mails` collection is staff-only under the
 * live rules, so the server agent relays through RTDB):
 * - Inbox: `users/{uid}/mailbox/{mailId}` — personal mails from the
 *   team / AI agent, mirrored by the runner from Firestore `mails`.
 * - Sent: `users/{uid}/teamOutbox/{id}` — mails the user composed
 *   here; the runner relays them into the panel's Team Inbox and
 *   stamps `relayed`.
 * Broadcast announcements keep travelling as notifications (Updates),
 * not mail.
 */

interface MailEntry {
  id: string;
  from?: string;
  subject: string;
  body: string;
  timestamp: number;
  read?: boolean;
  relayed?: boolean;
}

const AVATAR_COLORS = [
  'from-emerald-400 to-teal-600',
  'from-amber-300 to-orange-500',
  'from-sky-400 to-blue-600',
  'from-rose-400 to-pink-600',
  'from-violet-400 to-purple-600',
  'from-cyan-400 to-teal-600',
];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function fmtTime(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString([], sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtFull(ts: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function MailboxView({ uid, onBack }: { uid: string; onBack: () => void }) {
  const [folder, setFolder] = React.useState<'inbox' | 'sent'>('inbox');
  const [inbox, setInbox] = React.useState<MailEntry[]>([]);
  const [sent, setSent] = React.useState<MailEntry[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [composing, setComposing] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [notice, setNotice] = React.useState('');

  React.useEffect(() => {
    if (!uid) return;
    const unsubInbox = onValue(ref(rtdb, `users/${uid}/mailbox`), (snap) => {
      const val = snap.val() || {};
      const list = Object.keys(val).map((id) => ({ id, ...(val[id] as any) })) as MailEntry[];
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setInbox(list);
    });
    const unsubSent = onValue(ref(rtdb, `users/${uid}/teamOutbox`), (snap) => {
      const val = snap.val() || {};
      const list = Object.keys(val).map((id) => ({ id, ...(val[id] as any) })) as MailEntry[];
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setSent(list);
    });
    return () => {
      unsubInbox();
      unsubSent();
    };
  }, [uid]);

  const unread = inbox.filter((m) => !m.read).length;
  const mails = folder === 'inbox' ? inbox : sent;
  const openMail = openId ? mails.find((m) => m.id === openId) || null : null;

  const openEntry = (m: MailEntry) => {
    setOpenId(m.id);
    if (folder === 'inbox' && !m.read) {
      update(ref(rtdb, `users/${uid}/mailbox/${m.id}`), { read: true }).catch(() => {});
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || sending) return;
    setSending(true);
    try {
      const entryRef = push(ref(rtdb, `users/${uid}/teamOutbox`));
      await set(entryRef, {
        subject: subject.trim(),
        body: body.trim(),
        timestamp: Date.now(),
        relayed: false,
      });
      await set(ref(rtdb, `users/${uid}/teamOutboxPending`), Date.now());
      setSubject('');
      setBody('');
      setComposing(false);
      setFolder('sent');
      setNotice('Your mail has been sent to the TaskMint team.');
      setTimeout(() => setNotice(''), 4000);
    } catch {
      setNotice('Could not send the mail. Please check your connection and try again.');
      setTimeout(() => setNotice(''), 4000);
    } finally {
      setSending(false);
    }
  };

  /* ---------- reading view ---------- */
  if (openMail) {
    const fromName = folder === 'inbox' ? openMail.from || 'TaskMint Team' : 'You';
    return (
      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="pb-32 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-5 px-1">
          <button onClick={() => setOpenId(null)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-black text-white truncate">{openMail.subject}</h2>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-5">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <span className={`w-11 h-11 rounded-full bg-gradient-to-br ${colorFor(fromName)} flex items-center justify-center text-white text-base font-black shrink-0`}>
              {fromName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-white truncate">{fromName}</p>
              <p className="text-[11px] font-semibold text-zinc-400">
                {folder === 'inbox' ? 'to me' : 'to TaskMint Team'} • {fmtFull(openMail.timestamp)}
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap pt-4">{openMail.body}</p>
        </div>
      </motion.div>
    );
  }

  /* ---------- compose view ---------- */
  if (composing) {
    return (
      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="pb-32 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-5 px-1">
          <button onClick={() => setComposing(false)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition shrink-0">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-base font-black text-white">New Mail</h2>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400 font-bold w-14 shrink-0">To</span>
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-black">TaskMint Team</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold w-14 shrink-0 text-sm">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this about?"
              className="flex-1 bg-transparent border-b border-white/10 focus:border-emerald-400/60 outline-none py-2 text-sm font-semibold text-white placeholder:text-zinc-500"
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message to the TaskMint team…"
            rows={9}
            className="w-full bg-black/25 border border-white/10 focus:border-emerald-400/60 outline-none rounded-2xl p-4 text-sm font-medium text-white placeholder:text-zinc-500 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-40 shadow-lg shadow-emerald-500/25"
          >
            <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send Mail'}
          </button>
          <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
            The team reads every mail in the admin panel and replies here in your mailbox. For urgent account issues, Live Support in the app is faster.
          </p>
        </div>
      </motion.div>
    );
  }

  /* ---------- list view ---------- */
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-32 max-w-2xl mx-auto w-full relative">
      <div className="flex items-center gap-3 mb-4 px-1">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-white tracking-tight">
            Mailbox {unread > 0 && <span className="text-sm font-black text-emerald-400">({unread} new)</span>}
          </h2>
          <p className="text-[11px] text-zinc-400 font-semibold">Messages from the TaskMint team — and yours to them</p>
        </div>
      </div>

      {/* Folder tabs */}
      <div className="flex gap-2 mb-4 px-1">
        {(
          [
            { id: 'inbox', label: 'Inbox', icon: Inbox },
            { id: 'sent', label: 'Sent', icon: Send },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setFolder(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition active:scale-95 ${
              folder === t.id
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white/5 border border-white/10 text-zinc-300'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
            {t.id === 'inbox' && unread > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">{unread}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {notice && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-1 mb-4 text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-2xl px-4 py-3">
            {notice}
          </motion.p>
        )}
      </AnimatePresence>

      {mails.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <MailOpen className="w-7 h-7 text-zinc-400" />
          </div>
          <p className="text-sm font-black text-zinc-200">{folder === 'inbox' ? 'Your inbox is empty' : 'No sent mails yet'}</p>
          <p className="text-[11px] font-semibold text-zinc-500 mt-1.5 leading-relaxed max-w-[17rem] mx-auto">
            {folder === 'inbox'
              ? 'When the TaskMint team writes to you, their mails will appear here.'
              : 'Mails you write to the TaskMint team will appear here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 overflow-hidden divide-y divide-white/5 bg-white/[0.02]">
          {mails.map((m) => {
            const fromName = folder === 'inbox' ? m.from || 'TaskMint Team' : 'TaskMint Team';
            const isUnread = folder === 'inbox' && !m.read;
            return (
              <button key={m.id} onClick={() => openEntry(m)} className={`w-full flex items-start gap-3 px-4 py-3.5 text-left active:scale-[0.99] transition ${isUnread ? 'bg-emerald-400/[0.06]' : ''}`}>
                <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorFor(fromName)} flex items-center justify-center text-white text-sm font-black shrink-0`}>
                  {fromName.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className={`flex-1 truncate text-[13px] ${isUnread ? 'font-black text-white' : 'font-bold text-zinc-200'}`}>{fromName}</span>
                    <span className={`text-[10px] font-bold shrink-0 ${isUnread ? 'text-emerald-300' : 'text-zinc-500'}`}>{fmtTime(m.timestamp)}</span>
                  </span>
                  <span className={`block truncate text-[13px] mt-0.5 ${isUnread ? 'font-extrabold text-zinc-100' : 'font-semibold text-zinc-300'}`}>{m.subject}</span>
                  <span className="block truncate text-[11px] font-medium text-zinc-500 mt-0.5">{m.body}</span>
                </span>
                {isUnread && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />}
                {folder === 'sent' && (
                  <span className={`text-[9px] font-black uppercase tracking-wider shrink-0 mt-1 ${m.relayed ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {m.relayed ? 'Delivered' : 'Sending'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Compose FAB */}
      <button
        onClick={() => setComposing(true)}
        className="fixed bottom-24 right-5 sm:right-auto sm:left-1/2 sm:translate-x-[190px] z-40 flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-emerald-500/35 active:scale-95 transition"
      >
        <PenSquare className="w-4 h-4" /> Compose
      </button>
    </motion.div>
  );
}
