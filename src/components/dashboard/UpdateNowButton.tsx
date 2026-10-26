import React from 'react';
import type { PluginListenerHandle } from '@capacitor/core';
import { UpdateInstaller } from '../../services/appUpdater';

/**
 * The "Update Now" action for the native app: downloads the new APK
 * inside the app (with progress), then opens Android's own installer
 * for the user's final confirmation — the browser is never involved.
 *
 * Used in two places: the Profile "App Update" card (variant
 * "profile", full width with helper text) and the Home update banner
 * (variant "banner", compact).
 *
 * Phases:
 * - idle: ready to start.
 * - permission: Android has not yet granted this app permission to
 *   install packages; the settings screen has been opened and this
 *   button resumes the flow once the user returns and taps again.
 * - downloading: DownloadManager is fetching the APK; progress shows.
 * - installing: the installer was launched — Android's screen asks
 *   for the final confirmation tap.
 * - error: something failed; tapping retries the whole flow.
 */
type Phase = 'idle' | 'permission' | 'downloading' | 'installing' | 'error';

export default function UpdateNowButton({
  url,
  version,
  variant = 'profile',
}: {
  url: string;
  version: string;
  variant?: 'profile' | 'banner';
}) {
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [percent, setPercent] = React.useState(0);
  const handlesRef = React.useRef<PluginListenerHandle[]>([]);

  React.useEffect(() => {
    return () => {
      handlesRef.current.forEach((h) => {
        try {
          h.remove();
        } catch {
          // Listener already gone — nothing to clean up.
        }
      });
      handlesRef.current = [];
    };
  }, []);

  const attachListeners = async () => {
    if (handlesRef.current.length) return;
    handlesRef.current.push(
      await UpdateInstaller.addListener('updateProgress', (e) => {
        if (e.percent >= 0) setPercent(e.percent);
      }),
      await UpdateInstaller.addListener('updateReady', () => setPhase('installing')),
      await UpdateInstaller.addListener('updateError', () => setPhase('error')),
    );
  };

  const beginDownload = async () => {
    setPhase('downloading');
    setPercent(0);
    await attachListeners();
    await UpdateInstaller.downloadAndInstall({ url });
  };

  const start = async () => {
    try {
      const { allowed } = await UpdateInstaller.canInstallPackages();
      if (!allowed) {
        await UpdateInstaller.openInstallSettings();
        setPhase('permission');
        return;
      }
      await beginDownload();
    } catch {
      setPhase('error');
    }
  };

  const continueAfterPermission = async () => {
    try {
      const { allowed } = await UpdateInstaller.canInstallPackages();
      if (!allowed) {
        await UpdateInstaller.openInstallSettings();
        return;
      }
      const res = await UpdateInstaller.installDownloaded();
      if (res.launched) {
        setPhase('installing');
        return;
      }
      await beginDownload();
    } catch {
      setPhase('error');
    }
  };

  const onClick = () => {
    if (phase === 'permission') {
      void continueAfterPermission();
    } else if (phase === 'idle' || phase === 'error') {
      void start();
    }
  };

  if (variant === 'banner') {
    const label =
      phase === 'downloading'
        ? percent > 0
          ? `${percent}%`
          : '…'
        : phase === 'installing'
          ? 'INSTALL…'
          : phase === 'permission'
            ? 'CONTINUE'
            : phase === 'error'
              ? 'RETRY'
              : 'UPDATE NOW';
    return (
      <button
        onClick={onClick}
        disabled={phase === 'downloading' || phase === 'installing'}
        className="bg-sky-500 hover:bg-sky-400 text-black text-[10px] font-black px-3 py-2 rounded-lg active:scale-95 transition shrink-0 disabled:opacity-70"
      >
        {label}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={onClick}
        disabled={phase === 'downloading' || phase === 'installing'}
        className={`w-full mt-3 text-xs font-black py-3 rounded-xl active:scale-95 transition disabled:opacity-80 ${
          phase === 'error'
            ? 'bg-red-500 hover:bg-red-400 text-white'
            : phase === 'permission'
              ? 'bg-amber-400 hover:bg-amber-300 text-black'
              : 'bg-sky-500 hover:bg-sky-400 text-black'
        }`}
      >
        {phase === 'downloading'
          ? `DOWNLOADING… ${percent}%`
          : phase === 'installing'
            ? 'OPENING INSTALLER…'
            : phase === 'permission'
              ? 'CONTINUE UPDATE'
              : phase === 'error'
                ? 'DOWNLOAD FAILED — TAP TO RETRY'
                : `UPDATE NOW — v${version}`}
      </button>
      {phase === 'downloading' && (
        <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-sky-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>
      )}
      {phase === 'permission' && (
        <p className="text-[11px] text-amber-300/90 mt-2 leading-relaxed">
          Android needs your permission to let TaskMint install its own updates. We opened the
          permission screen — switch it on, come back here, then tap Continue Update.
        </p>
      )}
      {phase === 'installing' && (
        <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
          Android's install screen should now be open — tap <strong>Install</strong> there to finish.
          Your account, balance and data stay exactly as they are.
        </p>
      )}
      {phase === 'error' && (
        <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
          The in-app download did not finish. Check your internet connection and tap the button to
          try again.
        </p>
      )}
    </div>
  );
}
