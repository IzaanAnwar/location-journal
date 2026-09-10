import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

test('native interval patches are installed and idempotent', () => {
  const taskPath = new URL('../node_modules/expo-task-manager/android/src/main/java/expo/modules/taskManager/TaskManagerUtils.java', import.meta.url);
  const locationPath = new URL('../node_modules/expo-location/android/src/main/java/expo/modules/location/records/LocationArguments.kt', import.meta.url);
  const task = readFileSync(taskPath, 'utf8');
  const location = readFileSync(locationPath, 'utf8');
  assert.match(task, /value instanceof Long\) \{\s*bundle.putLong\(key, \(Long\) value\)/);
  assert.ok(location.includes('(map["timeInterval"] as? Number)?.toLong()'));
  execFileSync(process.execPath, ['scripts/patch-expo-task-options.mjs']);
  assert.equal(readFileSync(taskPath, 'utf8'), task);
  assert.equal(readFileSync(locationPath, 'utf8'), location);
});
