package click.taskmint.app;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.unity3d.ads.IUnityAdsInitializationListener;
import com.unity3d.ads.IUnityAdsLoadListener;
import com.unity3d.ads.IUnityAdsShowListener;
import com.unity3d.ads.UnityAds;
import com.unity3d.ads.UnityAdsShowOptions;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Minimal Capacitor bridge over the Unity Ads SDK (4.x).
 *
 * The bridge is deliberately thin: it knows nothing about TaskMint's
 * configuration. The game ID, placement IDs and test mode all arrive from
 * the TypeScript layer, which reads them from the admin-panel-driven
 * Firestore document {@code app_settings/ads}. Nothing Unity-specific is
 * hardcoded here.
 *
 * Methods exposed to JavaScript:
 * <ul>
 *   <li>{@code initialize({ gameId, testMode })} — one-time SDK init.</li>
 *   <li>{@code load({ placementId })} — loads one ad; resolves when loaded.</li>
 *   <li>{@code isReady({ placementId })} — whether a previously loaded ad
 *       for that placement is still waiting to be shown. (Unity Ads 4.x has
 *       no isReady API — readiness is tracked from the load callbacks.)</li>
 *   <li>{@code show({ placementId })} — shows a loaded ad; resolves with
 *       {@code { state: "COMPLETED" | "SKIPPED" }} from
 *       onUnityAdsShowComplete and rejects on any show failure. The TS
 *       layer pays the user ONLY for "COMPLETED".</li>
 * </ul>
 */
@CapacitorPlugin(name = "UnityAdsBridge")
public class UnityAdsBridge extends Plugin {

    /** Placements whose ad finished loading and has not been shown yet. */
    private final Set<String> readyPlacements = new HashSet<>();

    /** Calls waiting for SDK initialisation to finish. */
    private final List<PluginCall> pendingInitCalls = new ArrayList<>();

    private boolean initInProgress = false;

    /** Unity Ads SDK calls are posted here: the SDK expects the main thread. */
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private PluginCall pendingLoadCall = null;
    private PluginCall pendingShowCall = null;

    @PluginMethod
    public void initialize(final PluginCall call) {
        String gameId = call.getString("gameId", "");
        Boolean testModeBoxed = call.getBoolean("testMode", false);
        boolean testMode = testModeBoxed != null && testModeBoxed;

        if (gameId == null || gameId.trim().isEmpty()) {
            call.reject("A Unity Ads game ID is required.");
            return;
        }

        if (UnityAds.isInitialized()) {
            call.resolve();
            return;
        }

        pendingInitCalls.add(call);
        if (initInProgress) {
            return;
        }
        initInProgress = true;

        mainHandler.post(() -> UnityAds.initialize(
            getContext(),
            gameId,
            testMode,
            new IUnityAdsInitializationListener() {
                @Override
                public void onInitializationComplete() {
                    initInProgress = false;
                    for (PluginCall pending : drainInitCalls()) {
                        pending.resolve();
                    }
                }

                @Override
                public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
                    initInProgress = false;
                    String detail = (error != null ? error.name() : "UNKNOWN") + ": " + message;
                    for (PluginCall pending : drainInitCalls()) {
                        pending.reject("Unity Ads failed to initialise (" + detail + ")");
                    }
                }
            }
        ));
    }

    private List<PluginCall> drainInitCalls() {
        List<PluginCall> calls = new ArrayList<>(pendingInitCalls);
        pendingInitCalls.clear();
        return calls;
    }

    @PluginMethod
    public void load(final PluginCall call) {
        final String placementId = call.getString("placementId", "");
        if (placementId == null || placementId.trim().isEmpty()) {
            call.reject("A placement ID is required.");
            return;
        }
        if (!UnityAds.isInitialized()) {
            call.reject("Unity Ads is not initialised yet.");
            return;
        }
        if (pendingLoadCall != null) {
            call.reject("Another Unity ad is already loading.");
            return;
        }
        pendingLoadCall = call;

        mainHandler.post(() -> UnityAds.load(
            placementId,
            new IUnityAdsLoadListener() {
                @Override
                public void onUnityAdsAdLoaded(String loadedPlacementId) {
                    readyPlacements.add(loadedPlacementId);
                    PluginCall pending = pendingLoadCall;
                    pendingLoadCall = null;
                    if (pending != null) {
                        pending.resolve();
                    }
                }

                @Override
                public void onUnityAdsFailedToLoad(String failedPlacementId, UnityAds.UnityAdsLoadError error, String message) {
                    PluginCall pending = pendingLoadCall;
                    pendingLoadCall = null;
                    if (pending != null) {
                        String detail = (error != null ? error.name() : "UNKNOWN") + ": " + message;
                        pending.reject("Unity Ads failed to load (" + detail + ")");
                    }
                }
            }
        ));
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        String placementId = call.getString("placementId", "");
        JSObject result = new JSObject();
        result.put("ready", placementId != null && readyPlacements.contains(placementId));
        call.resolve(result);
    }

    @PluginMethod
    public void show(final PluginCall call) {
        final String placementId = call.getString("placementId", "");
        if (placementId == null || placementId.trim().isEmpty()) {
            call.reject("A placement ID is required.");
            return;
        }
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No Android activity is available to show the ad.");
            return;
        }
        if (pendingShowCall != null) {
            call.reject("Another Unity ad is already showing.");
            return;
        }
        pendingShowCall = call;

        activity.runOnUiThread(() ->
            UnityAds.show(
                activity,
                placementId,
                new UnityAdsShowOptions(),
                new IUnityAdsShowListener() {
                    @Override
                    public void onUnityAdsShowFailure(String failedPlacementId, UnityAds.UnityAdsShowError error, String message) {
                        readyPlacements.remove(failedPlacementId);
                        PluginCall pending = pendingShowCall;
                        pendingShowCall = null;
                        if (pending != null) {
                            pending.reject("Unity Ads failed to show: " + message);
                        }
                    }

                    @Override
                    public void onUnityAdsShowStart(String startedPlacementId) {
                        // Nothing to report to JS yet — the promise settles
                        // only on completion or failure.
                    }

                    @Override
                    public void onUnityAdsShowClick(String clickedPlacementId) {
                        // Clicks do not affect the reward; ignore.
                    }

                    @Override
                    public void onUnityAdsShowComplete(String completedPlacementId, UnityAds.UnityAdsShowCompletionState state) {
                        readyPlacements.remove(completedPlacementId);
                        PluginCall pending = pendingShowCall;
                        pendingShowCall = null;
                        if (pending != null) {
                            JSObject result = new JSObject();
                            result.put("state", state != null ? state.name() : "SKIPPED");
                            pending.resolve(result);
                        }
                    }
                }
            )
        );
    }
}
