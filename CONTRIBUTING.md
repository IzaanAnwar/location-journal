# Contributing

Location Journal is an early Android/iOS location recorder. Start with the [README](README.md), [security model](docs/security.md), and [device validation checklist](docs/device-validation.md).

For a small fix, open a pull request. For changes to the evidence format, key lifecycle, storage, or permissions, open an issue describing the problem and proposed approach first. Never attach real location exports, passcodes, private keys, or identifying screenshots to public issues.

## Development

1. Fork and clone the repository.
2. Install Node 24 and run `npm ci`.
3. Run `npm run typecheck` and `npm test`.
4. Use `npm run android` or `npm run ios` with the relevant native tools installed. Expo Go cannot run this app.

Keep screen code, recording, storage, and evidence verification separate. Never invent missing observations or change recorded coordinates. Use synthetic fixtures for tests. Add tests for meaningful security and evidence behavior changes.

For native changes, build the affected platform and report the device/OS tested. For JavaScript changes, check native bundles with `npx expo export --platform android --platform ios`. A successful bundle does not demonstrate background reliability. Describe untested paths honestly in your pull request.

## Pull requests

Explain the problem, what changed, and how you checked it. Keep changes focused. Update documentation when behavior or setup changes. Dependencies must be compatible with the project's license, and new network access requires an explicit privacy design.

By submitting a contribution, you agree to license your contribution under GPL-3.0-only. Submit only work you have the right to license. Third-party notices must be preserved. No separate contributor license agreement is required.
