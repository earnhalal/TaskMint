# TaskMint Android App (Capacitor)

The TaskMint website (React + Vite) is wrapped as a native Android app with
[Capacitor](https://capacitorjs.com). The same codebase serves both the
website and the app — there is no separate app code to maintain.

- **App ID:** `click.taskmint.app`
- **App name:** TaskMint
- **Config:** `capacitor.config.ts` (web build output: `dist`)
- **Current version:** 1.2 (versionCode 3) — the single source of truth for
  the JS side is `APP_VERSION` in `src/services/appUpdate.ts`; keep it in
  sync with `versionName` in `android/app/build.gradle`.

## How the app is built

### Option A — GitHub Actions (no local Android setup needed)

The workflow **Android APK** (`.github/workflows/android-debug.yml`) runs
on demand (**Actions → Android APK → Run workflow**) and automatically on
pushes to the `feature/release-signing-and-update` branch.

1. It installs Node 22 dependencies, builds the web app, syncs it into the
   Android project and generates the launcher/splash images.
2. It sets up JDK 21 and the Android SDK (platform 36, build-tools 36).
3. It decodes the release keystore from the repository secret
   `RELEASE_KEYSTORE_BASE64` into `android/release.p12` (never committed —
   `*.p12` is git-ignored).
4. It runs `gradlew assembleRelease` with the signing environment below,
   then verifies the APK with `apksigner verify --print-certs` so the
   signing certificate fingerprint is visible in the build log.
5. Download the **`taskmint-release-apk`** artifact from the run page. It
   contains `app-release.apk`, the signed release build users install.

### Release signing

Release builds are signed with a dedicated PKCS12 keystore:

- **Alias:** `taskmint`
- **Passwords:** one password is used for both the keystore and the key.
- The keystore itself is **never stored in git**. CI receives it through
  these GitHub repository secrets:
  - `RELEASE_KEYSTORE_BASE64` — base64 of the `.p12` keystore file
  - `RELEASE_KEYSTORE_PASSWORD` — the keystore/key password
  - `RELEASE_KEY_ALIAS` — `taskmint`
- `android/app/build.gradle` reads, in order, the Gradle project
  properties or the environment variables `TM_KEYSTORE_FILE`,
  `TM_KEYSTORE_PASSWORD`, `TM_KEY_ALIAS` and `TM_KEY_PASSWORD` (the key
  password defaults to the store password when absent) and applies the
  release signing config **only when `TM_KEYSTORE_FILE` is set**, so local
  unsigned builds keep working.
- **Back the keystore and its password up safely.** If they are lost, no
  future update can ever install over an existing TaskMint install — users
  would have to uninstall and reinstall.

> **One-time uninstall for v1.0 users:** the v1.0 APK that was shared
> first was a CI *debug* build signed with a throwaway debug key. Android
> will refuse to install the release-signed v1.1 over it ("App not
> installed" / signature mismatch). Users on v1.0 must **uninstall once**
> and then install v1.1. From v1.1 onward every build uses the same
> release key, so all later updates install in place with no uninstall.

### In-app update notifications

`src/services/appUpdate.ts` implements the update check:

- Native app only (`Capacitor.isNativePlatform()`); the website never
  checks.
- It queries `https://api.github.com/repos/earnhalal/TaskMint/releases/latest`,
  compares the release tag (e.g. `v1.2`) with `APP_VERSION`, and when a
  newer version exists the Dashboard shows a dismissible banner:
  "Update available — TaskMint vX is ready" with an **Update now** button
  that opens the release's APK download URL.
- Checks are cached in localStorage and run at most once every 6 hours.
  Dismissing the banner remembers that version and does not nag again
  until a still newer version appears.
- Publishing an update = bump `versionName`/`versionCode` in
  `android/app/build.gradle`, bump `APP_VERSION` in
  `src/services/appUpdate.ts`, build the signed APK via the workflow, and
  publish a GitHub Release tagged `v<version>` with the asset named
  exactly `TaskMint.apk`. Existing apps then offer the update
  automatically; the website Download page button uses the
  `releases/latest/download/TaskMint.apk` magic URL so it always serves
  the newest release too.

### Option B — Local build (Android Studio)

Prerequisites: Node.js 22, JDK 21, Android Studio (which provides the
Android SDK).

```bash
npm ci
npm run build
npx cap sync android
npx -y @capacitor/assets@3.0.5 generate --android   # launcher + splash images
cd android && gradle wrapper --gradle-version 8.14.3 # one-time, if gradlew is missing its JAR
./gradlew assembleDebug                              # or assembleRelease with the TM_* env vars set
```

> Launcher icons, splash images and the Gradle wrapper JAR are generated
> files (from the vector sources in `assets/`); they are intentionally not
> stored as binaries in git. The steps above regenerate them.

## Ads status

AdMob is initialised in the native app only (`src/services/admob.ts`) and is
a no-op on the website. The app currently uses **Google's test AdMob App ID**
and test ad units only — no real ads are shown, and no ad is placed in the
watch-earn / reward flow.

## Unity Ads (rewarded)

Unity rewarded ads run **only inside the native app** and are controlled
entirely from the admin panel — no Unity account detail is hardcoded in
the app, so changing the game ID, placements, reward or limits never
needs a new APK release.

### How it is built

- **Native bridge:** the Unity Ads SDK
  (`com.unity3d.ads:unity-ads:4.12.2` in `android/app/build.gradle`) is
  wrapped by a small in-house Capacitor plugin,
  `android/app/src/main/java/click/taskmint/app/UnityAdsBridge.java`
  (`@CapacitorPlugin(name = "UnityAdsBridge")`, registered explicitly in
  `MainActivity.onCreate`). It exposes `initialize`, `load`, `isReady`
  and `show`. `show` resolves only with the completion state from
  `onUnityAdsShowComplete` (`COMPLETED` / `SKIPPED`) and rejects on any
  show failure.
- **TS service:** `src/services/unityAds.ts` runs the
  initialise → load → show flow with timeouts and returns a result union
  (`COMPLETED` / `SKIPPED` / `UNAVAILABLE`). It never throws to the UI.
- **Config:** `src/services/adsSettings.ts` reads the Firestore document
  `app_settings/ads` once per app session (cached) with safe defaults —
  a missing document means Unity stays disabled.
- **Watch tab:** when the config is enabled, a "Unity Rewarded Ad" card
  appears at the top of the Watch tab (native builds only). On
  `COMPLETED` the user is credited through the exact same balance path
  as the video ads (`onUpdateBalance(amount, 'unity_ad', …)` — RTDB
  ledger transaction, Firestore mirror, and an `earning_history` record
  with source `unity_ad`). `SKIPPED` and failures never pay.

### Panel config contract — `app_settings/ads`

| Field | Type | Meaning |
| --- | --- | --- |
| `unityEnabled` | boolean | Master switch for Unity ads. |
| `unityGameId` | string | Unity Ads game ID (Android project). Empty = hidden. |
| `unityRewardedPlacementId` | string | Rewarded placement / ad unit ID. Default when empty: `Rewarded_Android`. |
| `unityInterstitialPlacementId` | string | Stored for future use; not wired yet. Default: `Interstitial_Android`. |
| `unityTestMode` | boolean | Serve Unity test ads while setting up. |
| `unityRewardAmount` | number | Rs. credited per completed rewarded view. |
| `unityDailyLimit` | number | Max rewarded views per user per day; `0` = unlimited. Counted from today's `earning_history` records with source `unity_ad` (userId query + client-side filter, the same no-composite-index pattern as Earning History). |

### Owner's steps in the Unity Dashboard

1. Sign in at **Unity Cloud / Unity Ads** with the TaskMint Unity account
   and select the Android game project for TaskMint (create one if it
   does not exist yet: **Monetization → Unity Ads**, platform Android,
   package `click.taskmint.app`).
2. Copy the project's **Game ID** and paste it into the admin panel's ads
   settings (`unityGameId`).
3. Under **Monetization → Ad units**, make sure a **Rewarded** ad unit
   exists for Android. Its placement ID goes into the panel as
   `unityRewardedPlacementId` — if the panel field is left empty the app
   uses Unity's default name `Rewarded_Android`.
4. Set the reward amount and daily limit in the panel, keep
   `unityTestMode` ON while testing on a real device, and turn it OFF
   for production traffic. Enable `unityEnabled` when ready.

## Still needed from the owner

1. **Real AdMob account** — the real AdMob App ID and ad unit IDs, to
   replace the test ID in `android/app/src/main/AndroidManifest.xml`
   (`com.google.android.gms.ads.APPLICATION_ID`) and in
   `src/services/admob.ts`.
2. **Google Play Console account** — one-time $25 fee, only if the app
   will be published on Google Play (currently distributed as a direct
   APK download from taskmint.click and the GitHub releases page).
3. **app-ads.txt** — publish the AdMob `app-ads.txt` lines on the website
   root once the real AdMob account exists (needed for full ad serving).
