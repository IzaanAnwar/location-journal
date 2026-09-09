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

Not tested: native compilation/linking, real Keystore/Secure Enclave behavior, real SQLCipher database lifecycle, actual passcode UI on device, permission transitions, background delivery, reboot/first-unlock behavior, battery use, GPS accuracy, share-sheet cleanup, or platform backup exclusion. These remain release gates.

No independent timestamp provider, remote attestation verifier, or legally signed evidence certificate is included in this development version.
