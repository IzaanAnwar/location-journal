import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMeasurementTime, formatElapsedTime } from '../src/screens/recorder/measurement-time.ts';

test('local day rolls forward while UTC retains the original observation date', () => {
  const timestamp = Date.parse('2026-09-10T20:00:00Z');
  const result = formatMeasurementTime(timestamp, 'Asia/Kolkata');
  assert.equal(result.utc, '2026-09-10 20:00:00 UTC');
  assert.equal(result.timeZone, 'Asia/Kolkata');
  assert.match(result.localDate, /11/);
  assert.equal(new Date(timestamp).toISOString(), '2026-09-10T20:00:00.000Z');
});

test('DST transition and invalid timestamps do not invent a measurement', () => {
  const before = formatMeasurementTime(Date.parse('2026-03-08T06:30:00Z'), 'America/New_York');
  const after = formatMeasurementTime(Date.parse('2026-03-08T07:30:00Z'), 'America/New_York');
  assert.notEqual(before.local, after.local);
  assert.equal(formatMeasurementTime(NaN), null);
  assert.match(formatElapsedTime(2000, 1000), /clock/);
  assert.equal(formatElapsedTime(0, 3660000), '1h 1m ago');
});
