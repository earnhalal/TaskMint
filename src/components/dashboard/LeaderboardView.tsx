import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Medal, Crown, Star, Sparkles, BadgeCheck } from 'lucide-react';
import { DynamicAvatar } from '../ui/DynamicAvatar';

interface LeaderboardViewProps {
  earners: any[];
  currentUserId?: string;
  onBack: () => void;
}

/**
 * Leaderboard — "Champions" redesign (2026-10-25).
 *
 * Data: `earners` is the server-precomputed top 10 (app_settings/
 * leaderboard) — the client can no longer query the whole users
 * collection under the current security rules. Per the owner's
 * direction (2026-10-26) the board ranks by current BALANCE: the
 * member holding the most money tops the board. Amounts render
 * balance (falling back to totalEarnings for older payloads).
 * Identity (username / avatar / photo) is published by the server
 * from the RTDB profile mirrors, so DPs show.
 *
 * Look: deep emerald night background with gold champion accents —
 * a glowing crowned #1 on a raised pedestal, silver and bronze
 * flanks, then glass ranking rows with medal-tinted rank chips.
 * The signed-in user's own row is highlighted with a YOU chip.
 */

const amountOf = (u: any) => Number(u?.balance ?? u?.totalEarnings ?? 0);

const RING: Record<number, string> = {
  1: 'from-amber-300 via-yellow-500 to-amber-600 shadow-[0_0_45px_rgba(245,197,66,0.35)]',
  2: 'from-slate-200 via-slate-400 to-slate-500 shadow-[0_0_30px_rgba(203,213,225,0.28)]',
  3: 'from-orange-300 via-amber-600 to-amber-800 shadow-[0_0_30px_rgba(217,119,6,0.30)]',
};
const CHIP: Record<number, string> = {
  1: 'bg-gradient-to-br from-amber-300 to-yellow-600 text-amber-950',
  2: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900',
  3: 'bg-gradient-to-br from-orange-300 to-amber-700 text-amber-950',
};

function PodiumSpot({ user, place, currentUserId }: { user: any; place: 1 | 2 | 3; currentUserId?: string }) {
  if (!user) return <div className="flex-1" />;
  const isYou = currentUserId && user.id === currentUserId;
  const big = place === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + place * 0.12, type: 'spring', damping: 16 }}
      className={`flex flex-col items-center flex-1 ${big ? '-mt-8 z-10' : ''}`}
    >
      <div className="relative mb-3">
        {place === 1 && (
          <motion.div
            animate={{ y: [0, -7, 0], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 z-20"
          >
            <Crown className="w-9 h-9 text-amber-400 fill-amber-400/25 drop-shadow-[0_0_14px_rgba(245,197,66,0.75)]" />
          </motion.div>
        )}
        <div className={`rounded-full bg-gradient-to-br p-[3px] ${RING[place]}`}>
          <div className={`${big ? 'w-24 h-24' : 'w-[4.5rem] h-[4.5rem]'} rounded-full overflow-hidden bg-[#052e22] border-4 border-[#04150f]`}>
            <DynamicAvatar avatarId={user.profile_avatar_id} photo={user.profile_photo} fallbackText={user.username} className="w-full h-full" />
          </div>
        </div>
        <div className={`absolute -bottom-2 -right-2 ${big ? 'w-9 h-9' : 'w-7 h-7'} rounded-full ${CHIP[place]} flex items-center justify-center border-[3px] border-[#04150f] shadow-lg`}>
          {place === 1 ? <Star className={`${big ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'} fill-current`} /> : <span className="text-[11px] font-black">{place}</span>}
        </div>
      </div>
      <p className={`font-black uppercase tracking-wide truncate max-w-[7.5rem] text-center ${big ? 'text-[13px] text-amber-300' : 'text-[11px] text-zinc-200'}`}>
        {user.username || 'Member'}
      </p>
      {isYou && (
        <span className="mt-1 text-[8px] font-black tracking-widest bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded-full">YOU</span>
      )}
      <p className={`${big ? 'text-xl' : 'text-base'} font-black text-white tracking-tight mt-0.5`}>
        Rs {amountOf(user).toLocaleString()}
      </p>
      <div
        className={`w-full mt-3 rounded-t-3xl border-x border-t flex flex-col items-center pt-3 ${
          place === 1
            ? 'h-32 bg-gradient-to-b from-amber-400/15 to-transparent border-amber-400/25'
            : place === 2
              ? 'h-24 bg-gradient-to-b from-slate-300/10 to-transparent border-white/10'
              : 'h-20 bg-gradient-to-b from-orange-400/10 to-transparent border-white/10'
        }`}
      >
        <span className={`font-black ${place === 1 ? 'text-4xl text-amber-400/90' : 'text-2xl text-zinc-500'}`}>{place}</span>
        <div className="flex gap-1 mt-2">
          {[...Array(4 - place + (place === 1 ? 2 : 0))].map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full ${place === 1 ? 'bg-amber-400/50' : 'bg-white/15'}`} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function LeaderboardView({ earners, currentUserId, onBack }: LeaderboardViewProps) {
  const topThree = earners.slice(0, 3);
  const rest = earners.slice(3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24 min-h-screen text-white relative overflow-hidden bg-[#04150f]"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] bg-amber-500/[0.07] rounded-full blur-[110px]" />
        <div className="absolute top-40 -left-40 w-[26rem] h-[26rem] bg-emerald-500/[0.08] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 -right-40 w-[26rem] h-[26rem] bg-teal-500/[0.06] rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      </div>

      {/* Header */}
      <div className="relative sticky top-0 z-40 bg-[#04150f]/85 backdrop-blur-xl border-b border-white/5 px-5 py-5">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-[22px] font-black tracking-tight leading-none">
              Top <span className="bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-500 bg-clip-text text-transparent">Balances</span>
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Champions board • Ranked by balance</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-amber-400/10 border border-amber-400/25 px-3.5 py-2 rounded-2xl shrink-0">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">Top 10</span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 relative z-10">
        {earners.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-300">No rankings yet</p>
            <p className="text-[11px] font-semibold text-zinc-500 mt-2 leading-relaxed max-w-[16rem] mx-auto">
              Complete tasks and watch ads to climb the board — the top earners appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="flex items-end justify-center gap-3 mt-14 mb-10 px-1">
              <PodiumSpot user={topThree[1]} place={2} currentUserId={currentUserId} />
              <PodiumSpot user={topThree[0]} place={1} currentUserId={currentUserId} />
              <PodiumSpot user={topThree[2]} place={3} currentUserId={currentUserId} />
            </div>

            {/* Rest of the board */}
            {rest.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-4 px-1 mb-1">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Rising Earners
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                </div>
                {rest.map((user, i) => {
                  const rank = user.rank || i + 4;
                  const isYou = currentUserId && user.id === currentUserId;
                  return (
                    <motion.div
                      key={user.id ? `earner-${user.id}` : `earner-idx-${i}`}
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.06 }}
                      className={`relative flex items-center gap-3.5 rounded-3xl px-4 py-3.5 border backdrop-blur-sm transition-colors ${
                        isYou
                          ? 'bg-emerald-500/[0.08] border-emerald-400/40 shadow-[0_0_24px_rgba(16,185,129,0.15)]'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[13px] shrink-0 ${
                          CHIP[rank] || 'bg-white/[0.06] text-zinc-300 border border-white/[0.07]'
                        }`}
                      >
                        {rank <= 3 ? <Medal className="w-4.5 h-4.5" /> : rank}
                      </div>
                      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white/5 border border-white/[0.07] shrink-0">
                        <DynamicAvatar avatarId={user.profile_avatar_id} photo={user.profile_photo} fallbackText={user.username} className="w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-[13px] tracking-tight uppercase truncate flex items-center gap-1.5">
                          {user.username || 'Member'}
                          {isYou && <span className="text-[8px] font-black tracking-widest bg-emerald-500 text-emerald-950 px-1.5 py-px rounded-full normal-case">YOU</span>}
                        </p>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                          <BadgeCheck className="w-3 h-3 text-emerald-500" /> Verified Earner
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[15px] font-black text-emerald-400 tracking-tight">Rs {amountOf(user).toLocaleString()}</p>
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total Earned</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <p className="text-center text-[10px] font-bold text-zinc-600 mt-8 leading-relaxed">
              Rankings refresh automatically through the day.
              <br />Keep earning to climb the board.
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
