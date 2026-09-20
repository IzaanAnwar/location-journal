import type { SQLiteDatabase } from 'expo-sqlite';
import { REQUESTED_INTERVAL_MS } from '../recording/schedule';
import { isObservationDue } from './observation-cadence';
import * as Crypto from 'expo-crypto';
import { trailKeys, type DeviceKey } from '../../modules/trail-keys/src/trail-keys';
import { getDatabase, readMetadata, writeMetadata, withEncryptedWrite } from '../storage/database';
import { hashText, readSecret, writeSecret } from '../security/secure-values';
import { encodeRecord, FORMAT, GENESIS, type RecordBody, type SignedRecord, type Observation } from './record';

export interface Identity extends DeviceKey { keyId: string }
const runtimeId = Crypto.randomUUID();
let identityPromise: Promise<Identity> | undefined;
let pending: Promise<unknown> = Promise.resolve();

export function getIdentity(): Promise<Identity> {
  identityPromise ??= initializeIdentity().catch(error => { identityPromise = undefined; throw error; });
  return identityPromise;
}

async function initializeIdentity(): Promise<Identity> {
  const native = await trailKeys.getIdentity();
  const identity = { ...native, keyId: await hashText(native.publicKeyHex) };
  const saved = await readMetadata('identity');
  if (saved) {
    const stored: unknown = JSON.parse(saved);
    if (!stored || typeof stored !== 'object' || !('keyId' in stored) || stored.keyId !== identity.keyId) {
      throw new Error('Device signing key changed. Existing history is preserved; recording is blocked.');
    }
  }
  if (!saved) await writeMetadata('identity', JSON.stringify(identity));
  return identity;
}

/** Serializes writers and signs each original record before its durable transaction. */
export function appendRecord(kind: RecordBody['kind'], payload: Record<string, unknown>): Promise<void> {
  const operation = pending.then(() => commitRecord(kind, payload));
  pending = operation.catch(() => undefined);
  return operation;
}

async function commitRecord(kind: RecordBody['kind'], payload: Record<string, unknown>): Promise<void> {
  const identity = await getIdentity();
  const head = await withEncryptedWrite(async transaction => {
    return insertSignedRecord(transaction, identity, kind, payload);
  });
  await writeSecret('ledger-checkpoint-v1', JSON.stringify(head));
}


async function insertSignedRecord(transaction: SQLiteDatabase, identity: Identity, kind: RecordBody['kind'], payload: Record<string, unknown>) {
    const previous = await transaction.getFirstAsync<SignedRecord & { sequence: number }>('SELECT * FROM records ORDER BY sequence DESC LIMIT 1');
    const body: RecordBody = { format: FORMAT, sequence: (previous?.sequence ?? 0) + 1,
      previousHash: previous?.hash ?? GENESIS, keyId: identity.keyId, recordedAt: Date.now(),
      uptimeMs: trailKeys.uptimeMilliseconds(), runtimeId, kind, payload };
    const encoded = encodeRecord(body);
    const [hash, signature] = await Promise.all([hashText(encoded), trailKeys.sign(encoded)]);
    await transaction.runAsync('INSERT INTO records VALUES (?, ?, ?, ?, ?, ?)',
      body.sequence, encoded, hash, signature, kind, body.recordedAt);
    return { hash, sequence: body.sequence };
}

/** The cadence check and inserts share one SQLite write lock, including across runtimes. */
export function appendHourlyObservation(observation: Observation): Promise<void> {
  const operation = pending.then(async () => {
    const identity = await getIdentity();
    const head = await withEncryptedWrite(async transaction => {
      const enabled = await transaction.getFirstAsync<{ value: string }>("SELECT value FROM metadata WHERE key = 'recording'");
      if (enabled?.value !== 'true') return null;
      const latest = await transaction.getFirstAsync<{ body: string }>("SELECT body FROM records WHERE kind = 'location' ORDER BY sequence DESC LIMIT 1");
      const previous = latest ? JSON.parse(latest.body) as RecordBody : null;
      const now = Date.now();
      if (!isObservationDue(previous, observation.measuredAt, now)) return null;
      if (previous) await insertSignedRecord(transaction, identity, 'interruption', {
        reason: 'observations-separated', from: previous.payload.measuredAt,
        to: observation.measuredAt, cause: 'unknown', samplingIntervalMs: REQUESTED_INTERVAL_MS,
      });
      return insertSignedRecord(transaction, identity, 'location', {
        ...observation, source: 'os-location-service', samplingPolicy: 'hourly-first-eligible-v1',
        minimumIntervalMs: REQUESTED_INTERVAL_MS,
        accuracyMeaning: process.env.EXPO_OS === 'android' ? 'estimated-radius-68-percent' : 'os-estimated-radius',
      });
    });
    if (head) await writeSecret('ledger-checkpoint-v1', JSON.stringify(head));
  });
  pending = operation.catch(() => undefined);
  return operation;
}

/** Detects rollback against this device's last saved checkpoint, not against an outside witness. */
export async function checkLocalCheckpoint(): Promise<void> {
  const saved = await readSecret('ledger-checkpoint-v1');
  if (!saved) return;
  const checkpoint = JSON.parse(saved);
  const database = await getDatabase();
  const record = await database.getFirstAsync<{ hash: string }>('SELECT hash FROM records WHERE sequence = ?', checkpoint.sequence);
  if (record?.hash !== checkpoint.hash) throw new Error('History differs from the saved device checkpoint. Recording is blocked.');
}
