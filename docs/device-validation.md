# Device validation checklist

No physical-device tests have been completed in this workspace. Full Xcode and Android SDK are absent. Successful Metro bundling and Swift syntax parsing do not establish native compilation or runtime correctness.

For each phone, retain model, OS, app build hash, signing-key protection result, test procedure, independent reference, and observed outcomes.

| Scenario | Required observation |
| --- | --- |
| First launch | No recording before explicit passcode setup and Start |
| Wrong passcode | Start/Stop/Export refused; five failures cause a persistent delay |
| Reopen/reboot | Passcode state persists; interruption is visible; no invented observations |
| Locked screen for several hours | Locations and signatures remain readable and verifiable afterward |
| Permission reduced/revoked | No false claim of fresh location; reauthorization has a clear path |
| Force-stop, app swipe-away, OEM battery saver | Measure missing interval and actual recovery behavior |
| Tunnel, indoors, urban canyon | Preserve poor accuracy and gaps without snapping to a road |
| Clock moved backward/forward | Both measurement/receipt time and uptime remain inspectable |
| Mock location | Preserve the available simulation indicator |
| Storage full and write failure | Show failure without claiming a successful save |
| Export while recording | Export has a fixed head; later observations continue in the ledger |
| Cancel share / crash during share | Clean up temporary plaintext export; source history stays intact |
| Alter body/hash/signature/order | Independent verifier rejects the artifact |
| Delete tail / restore database | Known checkpoint comparisons behave as documented |
| Key removed/replaced | Existing history is retained; app blocks further recording |
| Database copied off device | SQLCipher prevents plain SQLite inspection without the key |
| Airplane mode | Collection can continue where GPS is available; no network dependency |

Run multi-day battery and delivery tests on more than one Android vendor and on real iPhones. Publish coverage and accuracy distributions, not a single accuracy percentage.
