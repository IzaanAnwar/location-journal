import * as Location from 'expo-location';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { authorize } from '../security/passcode';
import { appendRecord, checkLocalCheckpoint, getIdentity } from '../evidence/ledger';
import { readMetadata, writeMetadata } from '../storage/database';
import { LOCATION_TASK } from './background-task';

let isChanging = false;

export async function changeRecording(passcode: string, shouldRecord: boolean): Promise<void> {
  if (isChanging) throw new Error('Recording is already changing.');
  isChanging = true;
  try {
    await authorize(passcode);
    await getIdentity();
    await checkLocalCheckpoint();
    if (shouldRecord) await startRecording();
    else await stopRecording();
  } finally { isChanging = false; }
}

async function startRecording(): Promise<void> {
  if (!await Location.hasServicesEnabledAsync()) throw new Error('Enable location services in device settings.');
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) throw new Error('Location permission is needed to record.');
  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) throw new Error('Allow background location in device settings to continue.');
  if (await readMetadata('recording') === 'true' && await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) return;
  await appendRecord('session-start', { device: Device.modelName, manufacturer: Device.manufacturer,
    os: Device.osName, osVersion: Device.osVersion, appVersion: Application.nativeApplicationVersion,
    build: Application.nativeBuildVersion, requestedIntervalMs: 10_000,
    permission: background.status, timeSource: 'device-clock-untrusted' });
  await writeMetadata('recording', 'true');
  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Highest, timeInterval: 10_000, distanceInterval: 0,
      deferredUpdatesInterval: 0, pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: { notificationTitle: 'Location Log is recording',
        notificationBody: 'Your location is saved privately on this device.', killServiceOnDestroy: false },
    });
  } catch (error) {
    await writeMetadata('recording', 'false');
    await appendRecord('error', { reason: 'recording-start-failed' });
    throw error;
  }
}

async function stopRecording(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  await writeMetadata('recording', 'false');
  await appendRecord('session-stop', { reason: 'passcode-authorized' });
}
