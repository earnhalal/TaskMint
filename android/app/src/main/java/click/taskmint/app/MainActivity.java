package click.taskmint.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // In-app plugins are not part of capacitor.plugins.json (that file is
        // generated from npm packages), so the Unity Ads bridge is registered
        // explicitly before the bridge starts.
        registerPlugin(UnityAdsBridge.class);
        super.onCreate(savedInstanceState);
    }
}
