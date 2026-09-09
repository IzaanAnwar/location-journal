export const FORMAT = 'location-log/v1';
export const GENESIS = '0'.repeat(64);

export interface Observation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  speed: number | null;
  heading: number | null;
  measuredAt: number;
  mocked: boolean | null;
}

export interface RecordBody {
  format: typeof FORMAT;
  sequence: number;
  previousHash: string;
  keyId: string;
  recordedAt: number;
  uptimeMs: number;
  runtimeId: string;
  kind: 'session-start' | 'session-stop' | 'location' | 'interruption' | 'error';
  payload: Record<string, unknown>;
}

export interface SignedRecord {
  body: string;
  hash: string;
  signature: string;
}

/** Rejects malformed measurements without rounding or improving their accuracy. */
export function validateObservation(observation: Observation): void {
  if (!Number.isFinite(observation.latitude) || Math.abs(observation.latitude) > 90 ||
      !Number.isFinite(observation.longitude) || Math.abs(observation.longitude) > 180 ||
      !Number.isFinite(observation.measuredAt) || observation.measuredAt < 0) {
    throw new Error('Invalid location observation.');
  }
  for (const value of [observation.accuracy, observation.altitude,
    observation.altitudeAccuracy, observation.speed, observation.heading]) {
    if (value !== null && !Number.isFinite(value)) throw new Error('Invalid measurement metadata.');
  }
}

/** Stable JSON for the restricted record types; signatures cover these exact UTF-8 bytes. */
export function encodeRecord(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(encodeRecord).join(',')}]`;
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const fields = value as Record<string, unknown>;
    return `{${Object.keys(fields).sort().map(key => `${JSON.stringify(key)}:${encodeRecord(fields[key])}`).join(',')}}`;
  }
  throw new Error('Unsupported record value.');
}
