import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const HOUR_MS = 60 * 60 * 1000;

function loadRecorder({ active = true, interval = 10_000, recording = true, pauseStop, checkpointError } = {}) {
  const source = fs.readFileSync(new URL('../src/recording/recorder.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const calls = { append: [], starts: [], stops: 0, writes: [] };
  let isActive = active;
  let taskOptions = interval === null ? null : { timeInterval: interval };
  const modules = {
    'expo-location': {
      Accuracy: { Highest: 5 },
      async hasServicesEnabledAsync() { return true; },
      async requestForegroundPermissionsAsync() { return { granted: true, status: 'granted' }; },
      async requestBackgroundPermissionsAsync() { return { granted: true, status: 'granted' }; },
      async hasStartedLocationUpdatesAsync() { return isActive; },
      async startLocationUpdatesAsync(taskName, options) {
        calls.starts.push({ taskName, options });
        isActive = true;
        taskOptions = options;
      },
      async stopLocationUpdatesAsync() {
        calls.stops++;
        if (pauseStop) await pauseStop;
        isActive = false;
      },
    },
    'expo-task-manager': { async getTaskOptionsAsync() { return taskOptions; } },
    'expo-device': { modelName: 'Test phone', manufacturer: 'Test maker', osName: 'Android', osVersion: '1' },
    'expo-application': { nativeApplicationVersion: '1', nativeBuildVersion: '1' },
    'react-native': { Platform: { OS: 'android' } },
    '../security/passcode': { async authorize() {} },
    '../evidence/ledger': {
      async appendRecord(kind, payload) { calls.append.push({ kind, payload }); },
      async checkLocalCheckpoint() { if (checkpointError) throw checkpointError; }, async getIdentity() {},
    },
    '../storage/database': {
      async readMetadata(key) { return key === 'recording' ? (recording ? 'true' : 'false') : null; },
      async writeMetadata(key, value) { calls.writes.push({ key, value }); if (key === 'recording') recording = value === 'true'; },
    },
    './background-task': { LOCATION_TASK: 'location-log-observations-v1' },
    './schedule': {
      REQUESTED_INTERVAL_MS: HOUR_MS,
      getTaskIntervalMs(options) { return typeof options?.timeInterval === 'number' ? options.timeInterval : null; },
      hasRequestedAndroidInterval(options) { return options?.timeInterval === HOUR_MS; },
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) {
    if (!(name in modules)) throw new Error(`Unexpected module ${name}`);
    return modules[name];
  } });
  return { recorder: exports, calls, getState: () => ({ active: isActive, interval: taskOptions?.timeInterval ?? null, recording }) };
}

test('reconciles a persisted legacy 10-second task in place and signs the applied change', async () => {
  const { recorder, calls, getState } = loadRecorder();
  assert.equal(await recorder.reconcileActiveRecordingSchedule('app-resume'), true);
  assert.equal(calls.starts.length, 1);
  assert.equal(calls.starts[0].taskName, 'location-log-observations-v1');
  assert.equal(calls.starts[0].options.timeInterval, HOUR_MS);
  assert.equal(JSON.stringify(calls.append), JSON.stringify([{ kind: 'configuration', payload: {
    change: 'android-location-request-interval', previousIntervalMs: 10_000,
    requestedIntervalMs: HOUR_MS, trigger: 'app-resume',
  } }]));
  assert.deepEqual(getState(), { active: true, interval: HOUR_MS, recording: true });
});

test('does not re-register a task whose persisted Android interval is already hourly', async () => {
  const { recorder, calls } = loadRecorder({ interval: HOUR_MS });
  assert.equal(await recorder.reconcileActiveRecordingSchedule('app-resume'), false);
  assert.deepEqual(calls.starts, []);
  assert.deepEqual(calls.append, []);
});

test('does not restart an inactive recording task', async () => {
  const { recorder, calls } = loadRecorder({ active: false, recording: true });
  assert.equal(await recorder.reconcileActiveRecordingSchedule('app-resume'), false);
  assert.deepEqual(calls.starts, []);
  assert.deepEqual(calls.append, []);
});

test('does not replace persisted task options when the local checkpoint is invalid', async () => {
  const { recorder, calls } = loadRecorder({ checkpointError: new Error('History differs from the saved device checkpoint.') });
  await assert.rejects(recorder.reconcileActiveRecordingSchedule('app-resume'), /checkpoint/);
  assert.deepEqual(calls.starts, []);
  assert.deepEqual(calls.append, []);
});

test('queues reconciliation after Stop so it cannot re-enable an old task', async () => {
  let releaseStop;
  const pausedStop = new Promise(resolve => { releaseStop = resolve; });
  const { recorder, calls, getState } = loadRecorder({ pauseStop: pausedStop });
  const stopping = recorder.changeRecording('123456', false);
  const reconciling = recorder.reconcileActiveRecordingSchedule('app-resume');
  releaseStop();
  await Promise.all([stopping, reconciling]);
  assert.equal(calls.stops, 1);
  assert.deepEqual(calls.starts, []);
  assert.equal(JSON.stringify(calls.append), JSON.stringify([{ kind: 'session-stop', payload: { reason: 'passcode-authorized' } }]));
  assert.deepEqual(getState(), { active: false, interval: 10_000, recording: false });
});
