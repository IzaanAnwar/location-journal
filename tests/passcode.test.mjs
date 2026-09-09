import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAttempts, parseCredential, nextAttempt } from '../src/security/credentials.ts';

test('damaged credentials and throttle state fail closed', () => {
  for (const invalid of ['null', '{}', '{"hash":"x","salt":"x"}', 'false']) assert.throws(() => parseCredential(invalid));
  for (const invalid of ['null', '{}', '{"failures":-1,"until":0}', '{"failures":1,"until":"tomorrow"}']) assert.throws(() => parseAttempts(invalid));
});
test('passcode throttling starts at five failures and caps at one hour', () => {
  const now = 1_000_000;
  assert.equal(nextAttempt({ failures: 3, until: 0 }, now).until, now);
  assert.equal(nextAttempt({ failures: 4, until: 0 }, now).until, now + 30_000);
  assert.equal(nextAttempt({ failures: 19, until: 0 }, now).until, now + 3_600_000);
});
