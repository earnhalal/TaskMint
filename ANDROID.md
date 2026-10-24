# TaskMint Android App (Capacitor)

The TaskMint website (React + Vite) is wrapped as a native Android app with
[Capacitor](https://capacitorjs.com). The same codebase serves both the
website and the app — there is no separate app code to maintain.

- **App ID:** `click.taskmint.app`
- **App name:** TaskMint
- **Config:** `capacitor.config.ts` (web build output: `dist`)

## How the app is built

### Option A — GitHub Actions (no local Android setup needed)

> **One-time setup:** the workflow file is provided at
> `ci/android-debug.yml`. Move it to `.github/workflows/android-debug.yml`
> (on GitHub: open the file → **Copy path** is not needed — simply create
> `.github/workflows/android-debug.yml` in the web editor and paste the
> contents, or move the file locally and push). It could not be committed
> directly under `.github/workflows/` because the integration used to push
> this branch does not hold the GitHub "Workflows" permission.

1. Open the repository on GitHub → **Actions** → **Android Debug APK**.
2. Click **Run workflow** (it also runs automatically on pushes to the
   `feature/capacitor-android` branch).
3. When the run finishes, download the **`taskmint-debug-apk`** artifact
   from the run page. It contains `app-debug.apk`, which can be installed
   directly on an Android phone (debug-signed, for testing only).

The workflow installs Node dependencies, builds the web app, syncs it into
the Android project, generates the launcher/splash images, sets up JDK 17
and the Android SDK, and runs `gradlew assembleDebug`.

### Option B — Local build (Android Studio)

Prerequisites: Node.js 20+, JDK 17, Android Studio (which provides the
Android SDK).

```bash
npm ci
npm run build
npx cap sync android
npx -y @capacitor/assets@3.0.5 generate --android   # launcher + splash images
cd android && gradle wrapper --gradle-version 8.14.3 # one-time, if gradlew is missing its JAR
```

Then open the `android/` folder in Android Studio and run or build as usual
(**Build → Build APK(s)**).

> Launcher icons, splash images and the Gradle wrapper JAR are generated
> files (from the vector sources in `assets/`); they are intentionally not
> stored as binaries in git. The steps above regenerate them.

## Ads status

AdMob is initialised in the native app only (`src/services/admob.ts`) and is
a no-op on the website. The app currently uses **Google's test AdMob App ID**
and test ad units only — no real ads are shown, and no ad is placed in the
watch-earn / reward flow.

## Still needed from the owner before a release

1. **Real AdMob account** — the real AdMob App ID and ad unit IDs, to
   replace the test ID in `android/app/src/main/AndroidManifest.xml`
   (`com.google.android.gms.ads.APPLICATION_ID`) and in
   `src/services/admob.ts`.
2. **Release signing keystore** — required to build a signed release
   AAB/APK; keep it backed up, it cannot be recovered if lost.
3. **Google Play Console account** — one-time $25 fee, if the app will be
   published on Google Play.
4. **app-ads.txt** — publish the AdMob `app-ads.txt` lines on the website
   root once the real AdMob account exists (needed for full ad serving).
