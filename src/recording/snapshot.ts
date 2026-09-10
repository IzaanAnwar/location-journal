import * as Location from 'expo-location';
import * as Device from 'expo-device';
import * as TaskManager from 'expo-task-manager';
import { hasRequestedAndroidInterval, getTaskIntervalMs } from './schedule';
import { getIdentity, checkLocalCheckpoint } from '../evidence/ledger';
import { getDatabase, readMetadata } from '../storage/database';
import { readSecret } from '../security/secure-values';
import { hasPasscode } from '../security/passcode';
import type { Observation, RecordBody } from '../evidence/record';
import { LOCATION_TASK } from './background-task';
import { cleanInterruptedExports } from '../evidence/export-cleanup';

export interface RecorderSnapshot {
  isReady: boolean;
  hasPasscode: boolean;
  isRecording: boolean;
  needsAttention: boolean;
  model: string;
  os: string;
  keyId: string;
  protection: string;
  records: number;
  locations: number;
  nativeIntervalMs: number | null;
  hasRequestedSchedule: boolean;
  gaps: number;
  latest: Observation | null;
  lastSavedAt: number | null;
  error: string | null;
}

export const emptySnapshot: RecorderSnapshot = {
  isReady: false, hasPasscode: false, isRecording: false, needsAttention: false,
  model: 'This device', os: '', keyId: '', protection: '', records: 0, locations: 0, nativeIntervalMs: null, hasRequestedSchedule: false, gaps: 0,
  latest: null, lastSavedAt: null, error: null,
};

export async function getSnapshot(): Promise<RecorderSnapshot> {
  cleanInterruptedExports();
  const identity = await getIdentity();
  await checkLocalCheckpoint();
  const database = await getDatabase();
  const [configured, enabled, active, latest, count, locations, gaps, error] = await Promise.all([
    hasPasscode(), readMetadata('recording'), Location.hasStartedLocationUpdatesAsync(LOCATION_TASK),
    database.getFirstAsync<{ body: string }>("SELECT body FROM records WHERE kind = 'location' ORDER BY sequence DESC LIMIT 1"),
    database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM records'),
    database.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM records WHERE kind = 'location'"),
    database.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM records WHERE kind = 'interruption'"),
    readSecret('recorder-error'),
  ]);
  const options = active && process.env.EXPO_OS === 'android'
    ? await TaskManager.getTaskOptionsAsync(LOCATION_TASK) : null;
  const nativeIntervalMs = getTaskIntervalMs(options);
  const body = latest ? JSON.parse(latest.body) as RecordBody : null;
  return { isReady: true, hasPasscode: configured, isRecording: enabled === 'true',
    needsAttention: enabled === 'true' && !active, model: Device.modelName ?? 'Unknown device',
    os: `${Device.osName ?? ''} ${Device.osVersion ?? ''}`.trim(), keyId: identity.keyId,
    locations: locations?.count ?? 0, nativeIntervalMs,
    hasRequestedSchedule: process.env.EXPO_OS !== 'android' || hasRequestedAndroidInterval(options),
    protection: identity.protection, records: count?.count ?? 0, gaps: gaps?.count ?? 0,
    latest: body?.payload as unknown as Observation ?? null, lastSavedAt: body?.recordedAt ?? null, error: error || null };
}
