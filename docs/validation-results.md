# Validation results

Checked during initial implementation on 9 September 2026.

- TypeScript: passed.
- Eleven automated tests: passed. Coverage includes P-256 verification, altered bodies, reordered/missing/duplicated records, substituted keys, truncation, external checkpoint comparison, malformed credentials, passcode throttling policy, measurement validation, stable encoding, Unicode stream boundaries, incomplete files, and exact export file hashing.
- Metro production bundles: Android, iOS, and web passed.
- Expo prebuild: both native projects generated with SQLCipher and background-location configuration; local native signing module resolves through autolinking.
- Swift syntax parsing: passed. This is not native typechecking or linking.
- Browser preview: inspected at a phone-sized viewport. Read-only preview has no fabricated records or enabled recording controls.
- Expo Doctor: 20/21 checks passed; CocoaPods/native tooling is absent. Full Xcode and Android SDK are also absent.
- React Doctor: unsafe credential/identity parsing findings fixed. Its run could not complete maintainability analysis. Remaining source warnings concern deliberate sequential location processing and screen conditional complexity. A generated-bundle crypto warning is not validation of the app's native crypto implementation.
- Dependency audit after a scoped uuid update: three moderate findings remain through expo-router → query-string → decode-uri-component. See security notes. No forced major-version downgrade was applied.

Not tested: iOS native compilation/linking, real Keystore/Secure Enclave behavior, real SQLCipher database lifecycle, actual passcode UI on device, permission transitions, background delivery, reboot/first-unlock behavior, battery use, GPS accuracy, share-sheet cleanup, or platform backup exclusion. These remain release gates.

No independent timestamp provider, remote attestation verifier, or legally signed evidence certificate is included in this development version.

## Android CI build

The [first GitHub Actions APK build](https://github.com/IzaanAnwar/location-journal/actions/runs/34362059071) passed on 9 September 2026 for commit `7f20f7d114b9594e91260a702fef61328c20f145`. Node 24 typechecking and all 11 tests passed. Gradle compiled and packaged a standalone release-variant APK for ARM64 and ARMv7, including the local signing module and SQLCipher configuration. The build uses the public Expo template debug signing key and is for testing only.

This establishes Android compilation and packaging, not successful installation, runtime behavior, hardware key protection, or background recording on a physical phone. The download includes matching source, license notices, the commit ID, and checksums.

## Encrypted writer and Android button correction

The Android 13 report showed `file is not a database` when starting a session, after device identity loaded successfully. Inspection of Expo SQLite's exclusive transaction helper showed that it opens a second connection without replaying `PRAGMA key`. The recorder now opens its own dedicated connection, applies the existing key before accessing database pages, and uses `BEGIN IMMEDIATE` with commit/rollback and close. No database reset, key replacement, or record migration is part of this fix.

Expo UI's Android button implementation renders raw children directly into Compose. All recorder buttons now use the `label` property, which creates the native text node. The screen puts the primary action above the latest observation, uses smaller panels, and keeps record details readable.

Typechecking, all 15 tests, and Android/iOS/web bundles passed locally. Four new regression tests cover key application ordering, commit/rollback, failed begin, and invalid keys. These tests use a connection double; they do not constitute a physical-device SQLCipher integration test. Install the updated APK over the existing app and verify Start, screen-lock recording, Stop, and Export on the affected device. Do not clear app storage or uninstall to apply this fix.

## Startup crash audit

The subsequent startup-crash report was audited against installed Expo UI 57.0.17. The universal Android style transformer forwards width/height to a native `size` modifier; the modifier expects numeric fields. The recorder button passed `width: '100%'`, which can fail native field conversion as soon as the screen renders. The button now waits for React Native layout and passes measured numeric dimensions to Expo UI, keeping its explicit `label` property.

Two render-contract regression tests cover pre-layout rendering, numeric native dimensions, and label preservation. Typechecking and Android/iOS bundle generation passed. The emulator installation was stopped at the user's request; no emulator or physical-phone reproduction is claimed. Install the new same-key APK over the existing app to check startup without deleting history.
