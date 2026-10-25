package click.taskmint.app;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.unity3d.mediation.LevelPlay;
import com.unity3d.mediation.LevelPlayAdError;
import com.unity3d.mediation.LevelPlayAdInfo;
import com.unity3d.mediation.LevelPlayConfiguration;
import com.unity3d.mediation.LevelPlayInitError;
import com.unity3d.mediation.LevelPlayInitListener;
import com.unity3d.mediation.LevelPlayInitRequest;
import com.unity3d.mediation.interstitial.LevelPlayInterstitialAd;
import com.unity3d.mediation.interstitial.LevelPlayInterstitialAdListener;
import com.unity3d.mediation.rewarded.LevelPlayReward;
import com.unity3d.mediation.rewarded.LevelPlayRewardedAd;
import com.unity3d.mediation.rewarded.LevelPlayRewardedAdListener;

/**
 * Minimal Capacitor bridge over the Unity LevelPlay mediation SDK 9.5
 * (com.unity3d.ads-mediation:mediation-sdk), rewarded video + interstitial.
 *
 * Like the other bridges, this class knows nothing about TaskMint's
 * configuration: the LevelPlay App Key, the ad unit IDs and the user ID
 * arrive from the TypeScript layer, which reads them from the
 * admin-panel-driven document {@code app_settings/ads}. Nothing is
 * hardcoded here.
 *
 * Methods exposed to JavaScript:
 * <ul>
 *   <li>{@code initialize({ appKey, userId })} — one-time SDK init; the
 *       user ID is passed at init for server-to-server callback
 *       readiness.</li>
 *   <li>{@code showRewarded({ adUnitId })} — creates/reuses the rewarded
 *       ad object, loads and shows it; the promise settles when the ad
 *       closes: {@code { state: "COMPLETED" }} only when the SDK fired
 *       its reward callback, otherwise {@code { state: "SKIPPED" }}.
 *       Load failures reject. The TS layer pays ONLY for "COMPLETED".</li>
 *   <li>{@code showInterstitial({ adUnitId })} — loads and shows an
 *       interstitial if one becomes ready; resolves as soon as the ad
 *       is displayed or the attempt ends (fire-and-forget, never pays).</li>
 * </ul>
 */
@CapacitorPlugin(name = "LevelPlayAdsBridge")
public class LevelPlayAdsBridge extends Plugin {

    private boolean initialised = false;
    private PluginCall pendingInitCall = null;

    private LevelPlayRewardedAd rewardedAd = null;
    private String rewardedUnitId = null;
    private PluginCall pendingRewardedCall = null;
    private boolean rewardEarned = false;
    private boolean rewardedClosed = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void initialize(final PluginCall call) {
        final String appKey = call.getString("appKey", "");
        final String userId = call.getString("userId", "");
        if (appKey == null || appKey.trim().isEmpty()) {
            call.reject("A LevelPlay App Key is required.");
            return;
        }
        if (initialised) {
            call.resolve();
            return;
        }
        if (pendingInitCall != null) {
            call.reject("LevelPlay initialisation is already in progress.");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No Android activity is available.");
            return;
        }
        pendingInitCall = call;
        activity.runOnUiThread(() -> {
            try {
                LevelPlayInitRequest.Builder builder = new LevelPlayInitRequest.Builder(appKey);
                if (userId != null && !userId.trim().isEmpty()) {
                    builder.withUserId(userId.trim());
                }
                LevelPlay.init(activity, builder.build(), new LevelPlayInitListener() {
                    @Override
                    public void onInitSuccess(LevelPlayConfiguration configuration) {
                        initialised = true;
                        PluginCall pending = pendingInitCall;
                        pendingInitCall = null;
                        if (pending != null) pending.resolve();
                    }

                    @Override
                    public void onInitFailed(@NonNull LevelPlayInitError error) {
                        PluginCall pending = pendingInitCall;
                        pendingInitCall = null;
                        if (pending != null) {
                            pending.reject("LevelPlay failed to initialise: " + error.getErrorMessage());
                        }
                    }
                });
            } catch (Exception e) {
                PluginCall pending = pendingInitCall;
                pendingInitCall = null;
                if (pending != null) {
                    pending.reject("LevelPlay failed to initialise: " + e.getMessage());
                }
            }
        });
    }

    @PluginMethod
    public void showRewarded(final PluginCall call) {
        final String adUnitId = call.getString("adUnitId", "");
        if (!initialised) {
            call.reject("LevelPlay is not initialised yet.");
            return;
        }
        if (adUnitId == null || adUnitId.trim().isEmpty()) {
            call.reject("A LevelPlay rewarded ad unit ID is required.");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No Android activity is available to show the ad.");
            return;
        }
        if (pendingRewardedCall != null) {
            call.reject("Another LevelPlay ad is already in progress.");
            return;
        }
        pendingRewardedCall = call;
        rewardEarned = false;
        rewardedClosed = false;

        activity.runOnUiThread(() -> {
            try {
                if (rewardedAd == null || !adUnitId.equals(rewardedUnitId)) {
                    rewardedUnitId = adUnitId;
                    rewardedAd = new LevelPlayRewardedAd(adUnitId);
                    rewardedAd.setListener(new LevelPlayRewardedAdListener() {
                        @Override
                        public void onAdLoaded(@NonNull LevelPlayAdInfo adInfo) {
                            Activity act = getActivity();
                            if (act != null && rewardedAd != null && rewardedAd.isAdReady() && pendingRewardedCall != null) {
                                rewardedAd.showAd(act);
                            }
                        }

                        @Override
                        public void onAdLoadFailed(@NonNull LevelPlayAdError error) {
                            settleRewardedReject("LevelPlay failed to load an ad (" + error.getErrorMessage() + ")");
                        }

                        @Override
                        public void onAdDisplayed(@NonNull LevelPlayAdInfo adInfo) {
                        }

                        @Override
                        public void onAdDisplayFailed(@NonNull LevelPlayAdError error, @NonNull LevelPlayAdInfo adInfo) {
                            settleRewardedReject("LevelPlay failed to display the ad (" + error.getErrorMessage() + ")");
                        }

                        @Override
                        public void onAdClicked(@NonNull LevelPlayAdInfo adInfo) {
                        }

                        @Override
                        public void onAdClosed(@NonNull LevelPlayAdInfo adInfo) {
                            rewardedClosed = true;
                            // onAdRewarded is documented to sometimes fire
                            // AFTER onAdClosed — give it a short grace
                            // window before settling as SKIPPED.
                            mainHandler.postDelayed(() -> settleRewardedFromState(), 700);
                        }

                        @Override
                        public void onAdInfoChanged(@NonNull LevelPlayAdInfo adInfo) {
                        }

                        @Override
                        public void onAdRewarded(@NonNull LevelPlayReward reward, @NonNull LevelPlayAdInfo adInfo) {
                            rewardEarned = true;
                            if (rewardedClosed) {
                                settleRewardedFromState();
                            }
                        }
                    });
                }
                rewardedAd.loadAd();
            } catch (Exception e) {
                settleRewardedReject("LevelPlay failed to show: " + e.getMessage());
            }
        });
    }

    private void settleRewardedFromState() {
        PluginCall pending = pendingRewardedCall;
        if (pending == null) return;
        if (!rewardedClosed) return;
        pendingRewardedCall = null;
        JSObject result = new JSObject();
        result.put("state", rewardEarned ? "COMPLETED" : "SKIPPED");
        rewardEarned = false;
        rewardedClosed = false;
        pending.resolve(result);
    }

    private void settleRewardedReject(String message) {
        PluginCall pending = pendingRewardedCall;
        pendingRewardedCall = null;
        rewardEarned = false;
        rewardedClosed = false;
        if (pending != null) pending.reject(message);
    }

    @PluginMethod
    public void showInterstitial(final PluginCall call) {
        final String adUnitId = call.getString("adUnitId", "");
        if (!initialised || adUnitId == null || adUnitId.trim().isEmpty()) {
            call.reject("LevelPlay interstitial is not ready.");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No Android activity is available to show the ad.");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                final LevelPlayInterstitialAd interstitialAd = new LevelPlayInterstitialAd(adUnitId);
                interstitialAd.setListener(new LevelPlayInterstitialAdListener() {
                    @Override
                    public void onAdLoaded(@NonNull LevelPlayAdInfo adInfo) {
                        Activity act = getActivity();
                        if (act != null && interstitialAd.isAdReady()) {
                            interstitialAd.showAd(act);
                        }
                    }

                    @Override
                    public void onAdLoadFailed(@NonNull LevelPlayAdError error) {
                        call.reject("LevelPlay interstitial failed to load (" + error.getErrorMessage() + ")");
                    }

                    @Override
                    public void onAdDisplayed(@NonNull LevelPlayAdInfo adInfo) {
                        call.resolve();
                    }

                    @Override
                    public void onAdDisplayFailed(@NonNull LevelPlayAdError error, @NonNull LevelPlayAdInfo adInfo) {
                        call.reject("LevelPlay interstitial failed to display (" + error.getErrorMessage() + ")");
                    }

                    @Override
                    public void onAdClicked(@NonNull LevelPlayAdInfo adInfo) {
                    }

                    @Override
                    public void onAdClosed(@NonNull LevelPlayAdInfo adInfo) {
                    }

                    @Override
                    public void onAdInfoChanged(@NonNull LevelPlayAdInfo adInfo) {
                    }
                });
                interstitialAd.loadAd();
            } catch (Exception e) {
                call.reject("LevelPlay interstitial failed: " + e.getMessage());
            }
        });
    }
}
