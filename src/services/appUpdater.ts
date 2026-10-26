import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

/**
 * TypeScript side of the native UpdateInstaller bridge
 * (android/.../UpdateInstallerBridge.java).
 *
 * Used by the in-app self-update flow: the APK is downloaded by
 * Android's DownloadManager without leaving the app, then Android's
 * own package installer is opened for the user's final confirmation.
 * Only meaningful on the native app — the website never updates
 * itself this way.
 */
export interface UpdateProgressEvent {
  downloaded: number;
  total: number;
  /** 0–100, or -1 while the total size is still unknown. */
  percent: number;
}

interface UpdateInstallerPlugin {
  canInstallPackages(): Promise<{ allowed: boolean }>;
  openInstallSettings(): Promise<void>;
  downloadAndInstall(options: { url: string }): Promise<{ started: boolean }>;
  installDownloaded(): Promise<{ launched: boolean }>;
  addListener(
    eventName: 'updateProgress',
    listener: (event: UpdateProgressEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'updateReady',
    listener: () => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'updateError',
    listener: (event: { message: string }) => void,
  ): Promise<PluginListenerHandle>;
}

export const UpdateInstaller = registerPlugin<UpdateInstallerPlugin>('UpdateInstaller');

export function isInAppUpdateAvailable(): boolean {
  return Capacitor.isNativePlatform();
}
