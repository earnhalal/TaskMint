package click.taskmint.app;

import android.app.Activity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.startapp.sdk.adsbase.Ad;
import com.startapp.sdk.adsbase.AdRequest;
import com.startapp.sdk.adsbase.StartAppAd;
import com.startapp.sdk.adsbase.StartAppSDK;
import com.startapp.sdk.adsbase.VideoListener;
import com.startapp.sdk.adsbase.adlisteners.AdEventListener;

/**
 * Minimal Capacitor bridge over the Start.io (StartApp) InApp SDK 5.x,
 * rewarded video only.
 *
 * Like the Unity bridge, this class knows nothing about TaskMint's
 * configuration: the Start.io App ID and test mode arrive from the
 * TypeScript layer, which reads them from the admin-panel-driven
 * document {@code app_settings/ads}. Nothing is hardcoded here.
 *
 * Methods exposed to JavaScript:
 * <ul>
 *   <li>{@code initialize({ appId, testMode })} — one-time SDK init.</li>
 *   <li>{@code showRewarded()} — loads one rewarded video and shows it as
 *       soon as it arrives; the promise settles when the ad activity
 *       closes and the app resumes: {@code { state: "COMPLETED" }} only
 *       when the SDK's video listener reported the video played to the
 *       end, otherwise {@code { state: "SKIPPED" }}. Load failures
 *       reject. The TS layer pays the user ONLY for "COMPLETED".</li>
 * </ul>
 *
 * Start.io's classic API has no single "ad closed" callback for
 * StartAppAd, so the close is detected through the plugin lifecycle:
 * while the rewarded activity is on screen the host activity is paused,
 * and it resumes the moment the ad is dismissed.
 */
@CapacitorPlugin(name = "StartIoAdsBridge")
public class StartIoAdsBridge extends Plugin {

    private boolean initialised = false;
    private PluginCall pendingShowCall = null;
    private boolean adShowing = false;
    private boolean videoCompleted = false;

    @PluginMethod
    public void initialize(final PluginCall call) {
        final String appId = call.getString("appId", "");
        Boolean testModeBoxed = call.getBoolean("testMode", false);
        final boolean testMode = testModeBoxed != null && testModeBoxed;
        if (appId == null || appId.trim().isEmpty()) {
            call.reject("A Start.io App ID is required.");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No Android activity is available.");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                if (testMode) {
                    StartAppSDK.setTestAdsEnabled(true);
                }
                StartAppSDK.init(activity, appId, false);
                initialised = true;
                call.resolve();
            } catch (Exception e) {
                call.reject("Start.io failed to initialise: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void showRewarded(final PluginCall call) {
        if (!initialised) {
            call.reject("Start.io is not initialised yet.");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No Android activity is available to show the ad.");
            return;
        }
        if (pendingShowCall != null) {
            call.reject("Another Start.io ad is already in progress.");
            return;
        }
        pendingShowCall = call;
        videoCompleted = false;
        adShowing = false;

        activity.runOnUiThread(() -> {
            try {
                final StartAppAd rewardedAd = new StartAppAd(activity);
                rewardedAd.setVideoListener(new VideoListener() {
                    @Override
                    public void onVideoCompleted() {
                        // Only records completion — the promise settles
                        // when the ad closes and the app resumes, so a
                        // reward is never paid for an ad the user did
                        // not actually finish and dismiss.
                        videoCompleted = true;
                    }
                });
                rewardedAd.loadAd(
                    StartAppAd.AdMode.REWARDED,
                    new AdRequest(),
                    new AdEventListener() {
                        @Override
                        public void onReceiveAd(Ad ad) {
                            adShowing = true;
                            ((StartAppAd) ad).showAd();
                        }

                        @Override
                        public void onFailedToReceiveAd(Ad ad) {
                            PluginCall pending = pendingShowCall;
                            pendingShowCall = null;
                            if (pending != null) {
                                String reason = ad != null && ad.getErrorMessage() != null
                                    ? ad.getErrorMessage()
                                    : "no fill";
                                pending.reject("Start.io failed to load an ad (" + reason + ")");
                            }
                        }
                    }
                );
            } catch (Exception e) {
                PluginCall pending = pendingShowCall;
                pendingShowCall = null;
                if (pending != null) {
                    pending.reject("Start.io failed to show: " + e.getMessage());
                }
            }
        });
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        // The rewarded activity has closed and the host activity is back
        // in front: settle the pending show with the recorded outcome.
        if (adShowing && pendingShowCall != null) {
            PluginCall pending = pendingShowCall;
            pendingShowCall = null;
            adShowing = false;
            JSObject result = new JSObject();
            result.put("state", videoCompleted ? "COMPLETED" : "SKIPPED");
            videoCompleted = false;
            pending.resolve(result);
        }
    }
}
