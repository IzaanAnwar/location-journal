# Install and test on Android

This is an early test build. Start with disposable test recordings. Do not rely on it as your only record of where you were. Android 7 or later is the Expo SDK baseline; this APK includes ARM64 and ARMv7 phone architectures. Hardware and OS behavior still require testing.

## Download without building anything

1. Sign in to GitHub and open [Android test APK](https://github.com/IzaanAnwar/location-journal/actions/workflows/android-apk.yml).
2. Choose a green, successful run for the `main` branch. Pull request builds are unreviewed contributor code.
3. Scroll to **Artifacts** and download `location-journal-android-<commit>`.
4. Extract the ZIP using your phone's Files app. It contains `location-journal-test.apk`, `SHA256SUMS.txt`, `COMMIT.txt`, the matching source archive, and license notices.
5. Tap the APK. If Android asks, allow installation from that Files app or browser. Disable that permission again after installing. Keep Play Protect enabled.
6. Open **Location Log** from your app list.

No Expo account, Expo Go, development server, or USB connection is needed. GitHub builds the code; your recordings are not sent to GitHub. Internet is needed to download the APK, but the recorder does not depend on an application server.

If no successful run exists yet, wait for the first build. A maintainer can select **Run workflow** to generate another APK. Downloads expire after 30 days. A red run means compilation or checks failed; there is no APK from that run.

## First recording

1. Enable your phone's location service and open the app.
2. Set and confirm a 6–12 digit passcode. Store it safely; there is no passcode recovery.
3. Select Start and enter your passcode if requested.
4. Grant precise location access. For background recording, open the app's location permission settings and choose **Allow all the time** when prompted. Android wording varies by version.
5. Check that the app reports recording and shows a recent observation with its reported accuracy. Start outdoors with a clear sky view if possible.
6. Lock the screen and walk a short route. Reopen the app after several minutes and check timestamps. Android should show a foreground-service notification while recording; this app is not an invisible tracker.
7. Select Stop and enter your passcode. Export a test session and check it with the verifier described below.

If your phone restricts the app's battery use, select unrestricted battery use for Location Log in system settings and test again. This can increase battery consumption. Force-stop, revoked permissions, power loss, or vendor battery management can interrupt recording. A passcode cannot stop the phone owner or OS from force-stopping or uninstalling the app.

For example, a reported accuracy of 25 metres is an estimate around a measurement, not proof that the phone was at an exact doorway. Keeping a phone at home also does not prove its owner stayed home.

## Verify a test export

On a computer with Node 22.18 or newer, clone the matching source or extract `source.tar.gz` from the APK download. Run:

```sh
node scripts/verify-evidence.mjs /path/to/export.jsonl
```

This checks the signed record chain and prints the exported file's SHA-256. It does not establish that the coordinates or phone clock were truthful. Exported JSONL contains plaintext location history; share only with someone you intend to receive it. Never attach it to a public GitHub issue.

On Linux, you can check the downloaded APK against its accompanying checksum with `sha256sum -c SHA256SUMS.txt`. On macOS use `shasum -a 256 -c SHA256SUMS.txt`. This detects a mismatched file; the checksum is not independent certification of the build.

## Updating and test signing

The workflow builds the release variant with bundled JavaScript, signed with the Expo template's public debug key. This avoids requiring private signing credentials for initial testing. Anyone with that key could sign a replacement application, so these builds are unsuitable for sensitive production use.

Install later APKs over the existing app when Android permits. If it reports a signing conflict, export records before considering uninstalling. **Uninstalling or clearing app storage can destroy the database and keys.** Exported files cannot be imported back into the app. Production signing must be established before relying on retained history across releases.

## Build the same test APK locally

Install Node 24, Java 17, and Android Studio with its SDK and command-line tools. Set `ANDROID_HOME` to your SDK directory and accept SDK licenses using Android's SDK manager. The build uses the Android versions selected by Expo SDK 57.

```sh
git clone https://github.com/IzaanAnwar/location-journal.git
cd location-journal
npm ci
npm run typecheck
npm test
npx expo prebuild --platform android --no-install
cd android
./gradlew :app:assembleRelease --no-daemon --max-workers=2 -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

The APK is `android/app/build/outputs/apk/release/app-release.apk` relative to the repository root. For a USB-connected phone with USB debugging enabled:

```sh
adb install -r app/build/outputs/apk/release/app-release.apk
```

The `adb` command above runs from the `android` directory. Windows users can use `gradlew.bat` instead of `./gradlew`.

## What to test

Use the [device validation checklist](device-validation.md), particularly screen lock, background delivery, permission loss, reboot, wrong passcodes, export verification, and battery use. Report the build commit, phone model, Android version, and redacted steps in a bug report. Current validation is recorded in [validation results](validation-results.md).
