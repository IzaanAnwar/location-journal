import type { RecordBody } from './record';
import { REQUESTED_INTERVAL_MS } from '../recording/schedule';

/** Sample only when both measurement time and durable receipt time advance a full hour.
 * A backwards clock blocks new samples until it catches up; it never rewrites history. */
export function isObservationDue(previous: RecordBody | null, measuredAt: number, receivedAt: number): boolean {
  if (!Number.isFinite(measuredAt) || !Number.isFinite(receivedAt)) throw new Error('Invalid observation time.');
  if (!previous) return true;
  const previousMeasurement = previous.payload.measuredAt;
  if (typeof previousMeasurement !== 'number' || !Number.isFinite(previousMeasurement) || !Number.isFinite(previous.recordedAt)) {
    throw new Error('Cannot establish the previous observation time.');
  }
  return measuredAt - previousMeasurement >= REQUESTED_INTERVAL_MS &&
    receivedAt - previous.recordedAt >= REQUESTED_INTERVAL_MS;
}
