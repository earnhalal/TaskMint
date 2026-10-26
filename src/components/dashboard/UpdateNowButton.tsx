import React from 'react';

/**
 * The "Update Now" action (owner direction, 2026-10-26): updates are
 * NOT downloaded inside the app. Tapping opens the official TaskMint
 * download page in the browser, where the latest version — and every
 * previous version — is listed with its own download button. The user
 * picks the version, downloads the APK and installs it the standard
 * Android way.
 *
 * Used in the Profile "App Update" card (variant "profile") and the
 * Home update banner (variant "banner").
 */
export const DOWNLOAD_PAGE_URL = 'https://www.taskmint.click/app-download';

export default function UpdateNowButton({
  version,
  variant = 'profile',
}: {
  version: string;
  variant?: 'profile' | 'banner';
}) {
  const openDownloadPage = () => {
    window.open(DOWNLOAD_PAGE_URL, '_blank');
  };

  if (variant === 'banner') {
    return (
      <button
        onClick={openDownloadPage}
        className="bg-sky-500 hover:bg-sky-400 text-black text-[10px] font-black px-3 py-2 rounded-lg active:scale-95 transition shrink-0"
      >
        UPDATE NOW
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={openDownloadPage}
        className="w-full mt-3 bg-sky-500 hover:bg-sky-400 text-black text-xs font-black py-3 rounded-xl active:scale-95 transition"
      >
        UPDATE NOW — v{version}
      </button>
      <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
        Opens the official TaskMint download page — the latest version and all previous versions
        are available there. Download the APK and install it; your account and balance stay as
        they are.
      </p>
    </div>
  );
}
