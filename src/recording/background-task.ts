import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { appendRecord, appendHourlyObservation, checkLocalCheckpoint } from '../evidence/ledger';
import { validateObservation, type Observation } from '../evidence/record';
import { readMetadata } from '../storage/database';
import { writeSecret } from '../security/secure-values';

export const LOCATION_TASK = 'location-log-observations-v1';
let pendingLocationDelivery: Promise<void> = Promise.resolve();

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(LOCATION_TASK, async ({ data, error }) => {
  const delivery = pendingLocationDelivery.then(() => processLocationDelivery(data?.locations ?? [], error));
  pendingLocationDelivery = delivery.catch(() => undefined);
  await delivery;
});

async function processLocationDelivery(locations: Location.LocationObject[], error: TaskManager.TaskManagerError | null): Promise<void> {
  try {
    await checkLocalCheckpoint();
    if (error) {
      await appendRecord('error', { reason: 'location-task-failed', code: error.code });
      await writeSecret('recorder-error', 'Location delivery failed. Reopen the app to check permissions.');
      return;
    }
    if (await readMetadata('recording') !== 'true') return;
    for (const location of locations) await saveObservation(location);
    await writeSecret('recorder-error', '');
  } catch {
    // Never log coordinates or secrets. Keep a separate signal when the ledger cannot be written.
    await writeSecret('recorder-error', 'A location could not be saved. Your history may have a gap.');
  }
}

async function saveObservation(location: Location.LocationObject): Promise<void> {
  if (await readMetadata('recording') !== 'true') return;
  const observation: Observation = { ...location.coords, measuredAt: location.timestamp,
    mocked: location.mocked ?? null };
  validateObservation(observation);
  await appendHourlyObservation(observation);
}
