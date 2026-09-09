# Location Journal

<img src="assets/location-journal-icon.png" alt="Location Journal: a journal with a location marker" width="128" height="128" />

A minimal Expo / React Native location recorder for Android and iOS. Records stay on the device unless the user explicitly exports them. There are no accounts, analytics SDKs, map requests, or application-operated location servers.

**Development build, not a validated forensic instrument.** Do not rely on this version as your sole source of evidence. Signatures establish integrity relative to a key, not location truth, personal presence, trusted measurement time, complete history, or legal admissibility.

## Install on your Android phone

Open [Releases and download history](https://github.com/IzaanAnwar/location-journal/releases), choose the newest Android test build, and download **location-journal-test.apk** under **Assets**. Open the APK on your phone. No GitHub account or ZIP extraction is needed.

Follow the [Android installation and testing guide](docs/android-install.md) for permissions, first recording, updates, and local builds. The installed app is currently named **Location Log**. The APK includes its JavaScript bundle and does not need Expo Go, Metro, an Expo account, or a connected computer.

Builds are for testing and use the Expo template's public debug signing key. They are not production-signed releases. Each successful push build on `main` automatically publishes a prerelease with the APK, matching source, checksums, and build notes. The Releases page is the automatically maintained release history. Release downloads do not use Actions’ 30-day artifact expiry. Failed and pull-request builds do not publish releases.

## Implemented

- One screen for latest location, reported accuracy, timestamps, device model, OS, key identifier, and recording health.
- A 6–12 digit passcode to authorize Start, Stop, and Export. Initial setup requires confirmation. PBKDF2-HMAC-SHA256 uses a random salt and 600,000 iterations; retry delays persist in secure storage. There is no unauthenticated reset.
- Expo Location and TaskManager background delivery, separate from screen lifecycle. The OS collects locations; the headless JavaScript task signs and persists delivered observations. This is not a fully native, JavaScript-independent persistence engine.
- SQLCipher-encrypted SQLite, full synchronous transactions, append-only triggers, ordered hash links, P-256 ECDSA signatures. Android Keystore / iOS Secure Enclave signing with explicit software-key classification where applicable.
- Observation and receipt times, monotonic receipt uptime, runtime identifiers, simulation flag where exposed, session events, and observed gaps over two minutes. No interpolated tracks or location editing.
- Device-local checkpoint comparison for some rollback detection. It is not an independent witness and is not an atomic commit with SQLite.
- Streaming JSONL export and a dependency-free Node verifier. Temporary plaintext exports are removed after sharing finishes; interrupted/crashed exports need cleanup as described in the security notes.
- Android automatic backup disabled; iOS SQLite directory excluded from backup. SecureStore secrets use device-only, after-first-unlock accessibility.

## Run

Use Node 22.18+ for the verifier/tests, and an Expo-supported Node version for the CLI. This workspace was checked with Node 26.8.1.

```sh
npm ci
npm run typecheck
npm test
npm run android
# or, with full Xcode and CocoaPods installed:
npm run ios
```

`npm run android` requires an Android SDK/emulator or connected phone. `npm run ios` requires full Xcode. After installing a development build, `npm start` starts Metro. Expo Go cannot run the encrypted recorder or local native module. Use `npx expo prebuild` after native configuration changes.

`npm run web` opens a read-only interface preview. It does not collect locations, create keys, or simulate successful recording. Do not use the browser preview to judge native background reliability.

`eas.json` includes development, preview, and production profiles. Cloud building is optional and has not been invoked. Native source lives under `modules/trail-keys`; generated `ios/` and `android/` are ignored and reproducible through prebuild.

## Verify an export

```sh
npm run verify -- /path/to/location-log-export.jsonl
# Also compare with a previously saved checkpoint, if you have one:
npm run verify -- /path/to/location-log-export.jsonl <64-character-head-hash>
```

The verifier streams the file, checks every hash/signature/key/sequence, compares its declared head, and prints SHA-256 of the exact exported file. It does not print coordinates. An externally supplied head must be independently preserved to be useful; copying it from the same export adds no assurance.

See [evidence format](docs/evidence-format.md), [security limits](docs/security.md), and [device validation](docs/device-validation.md).

## Before real-world reliance

1. Build and exercise native signing, SQLCipher, passcode, permissions, and background delivery on real Android and iOS devices.
2. Select and integrate an independent timestamp provider. None is currently connected. No code silently sends commitments to an arbitrary service.
3. Obtain a security review, including native code, key lifecycle, database rollback, export cleanup, and hostile-device assumptions.
4. Have an Indian lawyer and digital forensic examiner validate a sample package and the applicable certificate workflow. Human certificate preparation/signatures are not automated in this version.
5. Complete license/App Store compatibility review before iOS distribution.

## License

GPL-3.0-only for project code. Redistribution of covered derivatives must comply with GPLv3. Commercial use is allowed; this license does not forbid private use or make unrelated software open source. Third-party dependencies retain their own licenses. No proprietary relicensing exception is granted here.

## Contribute and get help

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md). Use [issues](https://github.com/IzaanAnwar/location-journal/issues) for bugs and focused proposals. Follow [SECURITY.md](SECURITY.md) for private vulnerability reporting. Never post real location records in public issues.

The full license is in [LICENSE](LICENSE). Original starter attribution is preserved in [THIRD-PARTY-NOTICES](THIRD-PARTY-NOTICES).
