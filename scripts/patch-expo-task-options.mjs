import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// SDK 57 TaskManager drops Long values, including LocationOptions.timeInterval.
// Fail on upstream changes so an Expo upgrade requires reviewing this workaround.
const path = fileURLToPath(new URL('../node_modules/expo-task-manager/android/src/main/java/expo/modules/taskManager/TaskManagerUtils.java', import.meta.url));
const original = readFileSync(path, 'utf8');
const before = '      } else if (value instanceof Integer) {\n        bundle.putInt(key, (Integer) value);';
const after = '      } else if (value instanceof Long) {\n        bundle.putLong(key, (Long) value);\n' + before;
if (!original.includes(after)) {
  if (original.split(before).length !== 2) throw new Error('Expo TaskManager changed: review Long task-option patch.');
  writeFileSync(path, original.replace(before, after));
}
console.log('Expo TaskManager Long task options preserved.');

// JSON persistence can restore an hourly value as Integer rather than Long.
const locationPath = fileURLToPath(new URL('../node_modules/expo-location/android/src/main/java/expo/modules/location/records/LocationArguments.kt', import.meta.url));
const locationSource = readFileSync(locationPath, 'utf8');
const oldInterval = 'timeInterval = map["timeInterval"] as? Long';
const newInterval = 'timeInterval = (map["timeInterval"] as? Number)?.toLong()';
if (!locationSource.includes(newInterval)) {
  if (locationSource.split(oldInterval).length !== 2) throw new Error('Expo Location changed: review persisted interval conversion.');
  writeFileSync(locationPath, locationSource.replace(oldInterval, newInterval));
}
