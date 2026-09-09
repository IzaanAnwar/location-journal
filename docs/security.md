# Security boundaries

## What is protected

Database encryption protects stored locations against access without the encryption key. The encryption key is separate from the passcode and signing key, allowing background writes after device unlock. Hardware signing reduces key extraction risk. The app exposes no location update/delete API. SQLite triggers are a defence against accidental mutation, not a boundary against the device owner or malicious native code.

Passcode verification authorizes app actions. The native signing API is not passcode-gated because the background task must sign unattended. Modified or compromised app code may call it. Code publication cannot prove a phone runs that code, or that the app cannot be hacked.

## Residual risks

- Owner/root/jailbreak/OS compromise, forged sensor readings, GPS spoofing, and device sharing are outside the assurances of this implementation.
- Force-stop, uninstall, power loss, permission revocation, and first-unlock restrictions can stop collection. The app cannot passcode-protect OS controls.
- All current wall times are device-reported. Monotonic uptime is receipt-time metadata and resets at reboot. There is no independent timestamp provider or attestation certificate chain.
- Passcode throttling uses a device-clock deadline. Clock manipulation, secure-storage rollback, or a compromised runtime can undermine it. PBKDF2 does not turn a short PIN into a high-entropy secret.
- There is no passcode recovery, database recovery key, or encrypted cloud backup yet. Device loss can mean permanent loss of history.
- Keychain items can survive reinstall on iOS; SQLite may not. No promise is made that reinstall is detectable in all circumstances.
- The secure-storage checkpoint and SQLite commit are not atomic. A crash between them may leave newer records without a new checkpoint. A rollback of both stores may go undetected. There is no outside anchor.
- The app checks the saved checkpoint on opening and on background callbacks. It does not perform a full forensic scan of the database at each write. The independent export verifier checks every exported signature.
- App error signals live separately so a failed database can still be reported. These signals are not signed evidence.
- Export is deliberately plaintext for interoperability, only after passcode authorization. The share destination receives exact locations. The file is removed when sharing completes. A crash can leave a file in app cache until the next screen initialization, when the app removes its interrupted exports.
- No application location uploads exist. The OS, Google/Apple location services, carrier, development tooling, or a recipient selected in the share sheet may have independent data practices.
- Requested 10-second updates are not delivery guarantees. iOS may batch, and vendor battery management may terminate Android tasks.

## Dependency review

The initial SDK 57 dependency audit reported moderate advisories in transitive `uuid` and `decode-uri-component`, with affected Expo dependency paths. The `xcode` dependency now uses a scoped override to the patched, CommonJS-compatible `uuid` 11.1.1; it calls `uuid.v4()` without buffer arguments. The remaining `decode-uri-component` advisory affects routing/query parsing. Its patched release changes the module format, so it was not forced into the older CommonJS consumer. The automatic fix proposal downgraded Expo substantially and was not applied. Avoid exposing this development app to untrusted deep links until resolved. Re-run `npm audit` before distribution and track compatible upstream patches.

## Distribution

Do not distribute a development-client build as a production evidence recorder. Development tooling and Metro alter the execution environment. Release builds, dependency provenance, reproducible build documentation, native security testing, and a qualified forensic review are release gates.
