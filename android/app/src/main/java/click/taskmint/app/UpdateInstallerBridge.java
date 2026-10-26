package click.taskmint.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

/**
 * In-app self-update for the sideloaded TaskMint APK.
 *
 * The app is distributed as a direct APK download (GitHub Releases), not
 * through the Play Store, so updates are delivered by the app itself:
 *
 * <ol>
 *   <li>{@code canInstallPackages()} — whether Android currently allows
 *       this app to install packages (the "unknown sources" per-app
 *       permission, Android 8+).</li>
 *   <li>{@code openInstallSettings()} — opens that permission screen.</li>
 *   <li>{@code downloadAndInstall({ url })} — downloads the APK with the
 *       system DownloadManager into the app's private external folder,
 *       emits {@code updateProgress} events, and on completion emits
 *       {@code updateReady} and immediately opens Android's package
 *       installer. The user confirms the install on Android's own screen
 *       — no app can (or should) bypass that final tap.</li>
 *   <li>{@code installDownloaded()} — re-opens the installer for an APK
 *       that already finished downloading (e.g. the user granted the
 *       install permission after the download completed).</li>
 * </ol>
 *
 * Failures are reported through the {@code updateError} event.
 */
@CapacitorPlugin(name = "UpdateInstaller")
public class UpdateInstallerBridge extends Plugin {

    private static final String APK_NAME = "TaskMint-update.apk";

    private long downloadId = -1;
    private boolean downloading = false;
    private boolean downloaded = false;
    private final Handler handler = new Handler(Looper.getMainLooper());

    private File apkFile() {
        File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (dir == null) dir = getContext().getFilesDir();
        return new File(dir, APK_NAME);
    }

    @PluginMethod
    public void canInstallPackages(final PluginCall call) {
        boolean allowed = Build.VERSION.SDK_INT < Build.VERSION_CODES.O
                || getContext().getPackageManager().canRequestPackageInstalls();
        JSObject ret = new JSObject();
        ret.put("allowed", allowed);
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallSettings(final PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open install settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void downloadAndInstall(final PluginCall call) {
        final String url = call.getString("url", "");
        if (url == null || url.trim().isEmpty()) {
            call.reject("A download URL is required.");
            return;
        }
        if (downloading) {
            call.reject("An update download is already in progress.");
            return;
        }
        try {
            final File dest = apkFile();
            if (dest.exists() && !dest.delete()) {
                // A stale file that cannot be removed would corrupt the new
                // download — fail loudly instead.
                call.reject("Could not clear the previous update file.");
                return;
            }
            downloaded = false;
            DownloadManager dm = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm == null) {
                call.reject("The Android download service is unavailable.");
                return;
            }
            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
            req.setTitle("TaskMint update");
            req.setDescription("Downloading the latest TaskMint app");
            req.setMimeType("application/vnd.android.package-archive");
            req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE);
            req.setDestinationUri(Uri.fromFile(dest));
            downloadId = dm.enqueue(req);
            downloading = true;
            JSObject ret = new JSObject();
            ret.put("started", true);
            call.resolve(ret);
            pollProgress(dm);
        } catch (Exception e) {
            downloading = false;
            call.reject("Could not start the download: " + e.getMessage());
        }
    }

    private void pollProgress(final DownloadManager dm) {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!downloading || downloadId < 0) return;
                Cursor c = null;
                try {
                    c = dm.query(new DownloadManager.Query().setFilterById(downloadId));
                    if (c != null && c.moveToFirst()) {
                        int status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                        long soFar = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                        long total = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            downloading = false;
                            downloaded = true;
                            notifyListeners("updateReady", new JSObject());
                            launchInstaller();
                            return;
                        }
                        if (status == DownloadManager.STATUS_FAILED) {
                            downloading = false;
                            int reason = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON));
                            JSObject data = new JSObject();
                            data.put("message", "Download failed (code " + reason + ").");
                            notifyListeners("updateError", data);
                            return;
                        }
                        JSObject data = new JSObject();
                        data.put("downloaded", soFar);
                        data.put("total", total);
                        data.put("percent", total > 0 ? (int) (soFar * 100 / total) : -1);
                        notifyListeners("updateProgress", data);
                    }
                } catch (Exception ignored) {
                    // A transient query failure just skips one tick.
                } finally {
                    if (c != null) c.close();
                }
                if (downloading) handler.postDelayed(this, 600);
            }
        }, 600);
    }

    @PluginMethod
    public void installDownloaded(final PluginCall call) {
        boolean launched = downloaded && apkFile().exists() && launchInstaller();
        JSObject ret = new JSObject();
        ret.put("launched", launched);
        call.resolve(ret);
    }

    private boolean launchInstaller() {
        try {
            File file = apkFile();
            if (!file.exists()) return false;
            Uri uri = FileProvider.getUriForFile(getContext(),
                    getContext().getPackageName() + ".fileprovider", file);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getContext().startActivity(intent);
            return true;
        } catch (Exception e) {
            JSObject data = new JSObject();
            data.put("message", "Could not open the installer: " + e.getMessage());
            notifyListeners("updateError", data);
            return false;
        }
    }
}
