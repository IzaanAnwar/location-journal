import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { authorize } from '../security/passcode';
import { appendRecord, checkLocalCheckpoint, getIdentity } from '../evidence/ledger';
import { readMetadata, writeMetadata } from '../storage/database';
import { LOCATION_TASK } from './background-task';
import { hasRequestedAndroidInterval, REQUESTED_INTERVAL_MS, getTaskIntervalMs } from './schedule';

let isChanging = false;
let pendingLifecycleChange: Promise<unknown> = Promise.resolve();

type ScheduleReconciliationTrigger = 'app-resume' | 'passcode-authorized-start';

function serializeLifecycleChange<T>(operation: () => Promise<T>): Promise<T> {
  const next = pendingLifecycleChange.then(operation);
  pendingLifecycleChange = next.catch(() => undefined);
  return next;
}

export async function changeRecording(passcode: string, shouldRecord: boolean): Promise<void> {
  if (isChanging) throw new Error('Recording is already changing.');
  isChanging = true;
  try {
    await serializeLifecycleChange(async () => {
      await authorize(passcode);
      await getIdentity();
      await checkLocalCheckpoint();
      if (shouldRecord) await startRecording();
      else await stopRecording();
    });
  } finally { isChanging = false; }
}

/** Re-applies the Android schedule after an APK upgrade without creating a second task. */
export function reconcileActiveRecordingSchedule(trigger: ScheduleReconciliationTrigger): Promise<boolean> {
  return serializeLifecycleChange(() => reconcileActiveAndroidSchedule(trigger));
}

async function reconcileActiveAndroidSchedule(trigger: ScheduleReconciliationTrigger): Promise<boolean> {
  if (Platform.OS !== 'android' || await readMetadata('recording') !== 'true' ||
      !await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) return false;
  await getIdentity();
  await checkLocalCheckpoint();
  const previousOptions = await TaskManager.getTaskOptionsAsync<Record<string, unknown>>(LOCATION_TASK);
  if (hasRequestedAndroidInterval(previousOptions)) return false;
  const previousIntervalMs = getTaskIntervalMs(previousOptions);
  await Location.startLocationUpdatesAsync(LOCATION_TASK, locationTaskOptions());
  await appendRecord('configuration', { change: 'android-location-request-interval',
    previousIntervalMs, requestedIntervalMs: REQUESTED_INTERVAL_MS, trigger });
  return true;
}

async function startRecording(): Promise<void> {
  if (!await Location.hasServicesEnabledAsync()) throw new Error('Enable location services in device settings.');
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) throw new Error('Location permission is needed to record.');
  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) throw new Error('Allow background location in device settings to continue.');
  if (await readMetadata('recording') === 'true' && await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
    await reconcileActiveAndroidSchedule('passcode-authorized-start');
    return;
  }
  await appendRecord('session-start', { device: Device.modelName, manufacturer: Device.manufacturer,
    os: Device.osName, osVersion: Device.osVersion, appVersion: Application.nativeApplicationVersion,
    build: Application.nativeBuildVersion, requestedIntervalMs: Platform.OS === 'android' ? REQUESTED_INTERVAL_MS : null,
    permission: background.status, timeSource: 'device-clock-untrusted' });
  await writeMetadata('recording', 'true');
  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, locationTaskOptions());
  } catch (error) {
    await writeMetadata('recording', 'false');
    await appendRecord('error', { reason: 'recording-start-failed' });
    throw error;
  }
}

async function stopRecording(): Promise<void> {
  const wasActive = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  await writeMetadata('recording', 'false');
  try {
    if (wasActive) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  } catch (error) {
    await writeMetadata('recording', 'true');
    await appendRecord('error', { reason: 'recording-stop-failed' });
    throw error;
  }
  await appendRecord('session-stop', { reason: 'passcode-authorized' });
}

function locationTaskOptions(): Location.LocationTaskOptions {
  return {
    accuracy: Location.Accuracy.Highest, timeInterval: REQUESTED_INTERVAL_MS, distanceInterval: 0,
    deferredUpdatesInterval: 0, pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: { notificationTitle: 'Location Log is recording',
      notificationBody: 'Hourly location requests. Saved privately on this device.', killServiceOnDestroy: false },
  };
}
