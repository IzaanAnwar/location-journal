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
