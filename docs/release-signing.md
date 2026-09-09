# Android release signing

Repository Actions secrets `ANDROID_RELEASE_KEYSTORE` and `ANDROID_RELEASE_PASSWORD` hold a base64 PKCS12 keystore and its password. The key alias is `location-journal`. The main-branch signing step injects these secrets only after compilation, re-signs the APK, verifies its Android signatures, and removes the temporary keystore on exit. PR jobs do not receive signing secrets. Do not enable secret access for contributor builds.

The local backup is in the ignored `.release-signing/` directory with restrictive filesystem permissions. It includes the encrypted keystore and a password file. Move a copy into a secure password manager or encrypted offline backup; protect the two files as signing credentials. GitHub cannot return secret values after upload. Losing both the local backup and GitHub secrets prevents signing compatible updates. Never regenerate the key as a routine build fix.

Anyone who can edit trusted main-branch workflows can potentially access repository secrets. Restrict repository write access and review workflow changes. This is private-key CI signing, not an offline signing service.

The APK key and each phone's location-record signing key are separate. Changing APK signing keys does not migrate app data. The first privately signed release cannot update the previous public-debug-key installation.
