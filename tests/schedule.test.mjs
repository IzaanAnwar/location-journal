import test from 'node:test';
import assert from 'node:assert/strict';
import { getTaskIntervalMs, hasRequestedAndroidInterval, REQUESTED_INTERVAL_MS } from '../src/recording/schedule.ts';

test('recognizes only the persisted hourly Android task interval', () => {
  assert.equal(getTaskIntervalMs({ timeInterval: REQUESTED_INTERVAL_MS }), REQUESTED_INTERVAL_MS);
  assert.equal(hasRequestedAndroidInterval({ timeInterval: REQUESTED_INTERVAL_MS }), true);
  assert.equal(hasRequestedAndroidInterval({ timeInterval: 10_000 }), false);
});

test('does not mistake malformed native task options for an hourly registration', () => {
  for (const options of [null, {}, { timeInterval: '3600000' }, { timeInterval: -1 }, { timeInterval: Infinity }]) {
    assert.equal(getTaskIntervalMs(options), null);
    assert.equal(hasRequestedAndroidInterval(options), false);
  }
});
