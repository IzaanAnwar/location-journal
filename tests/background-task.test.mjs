import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function createTaskHarness() {
  const source = fs.readFileSync(new URL('../src/recording/background-task.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const calls = { metadata: 0, checkpoints: 0, observations: [], records: [], secrets: [] };
  let isRecording = true;
  let task;
  const modules = {
    'expo-location': {},
    'expo-task-manager': { defineTask(_name, callback) { task = callback; } },
    '../evidence/ledger': {
      async appendRecord(kind, payload) { calls.records.push({ kind, payload }); },
      async appendHourlyObservation(observation) {
        if (isRecording) calls.observations.push(observation);
      },
      async checkLocalCheckpoint() { calls.checkpoints++; },
    },
    '../evidence/record': { validateObservation(observation) {
      if (!Number.isFinite(observation.latitude)) throw new Error('Invalid observation.');
    } },
    '../storage/database': { async readMetadata() { calls.metadata++; return isRecording ? 'true' : 'false'; } },
    '../security/secure-values': { async writeSecret(key, value) { calls.secrets.push({ key, value }); } },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) {
    if (!(name in modules)) throw new Error(`Unexpected module ${name}`);
    return modules[name];
  } });
  return { calls, deliver: event => task(event), stop: () => { isRecording = false; } };
}

const location = timestamp => ({ coords: { latitude: 12, longitude: 34, accuracy: 5 }, timestamp, mocked: false });

test('a callback queued after Stop does no checkpoint, signing, or secret-store work', async () => {
  const harness = createTaskHarness();
  harness.stop();
  await harness.deliver({ data: { locations: [location(1)] }, error: null });
  await harness.deliver({ data: null, error: { code: 'TEST' } });
  assert.equal(harness.calls.metadata, 2);
  assert.equal(harness.calls.checkpoints, 0);
  assert.deepEqual(harness.calls.observations, []);
  assert.deepEqual(harness.calls.records, []);
  assert.deepEqual(harness.calls.secrets, []);
});

test('an active batch checks recording state once and passes original measurements to the ledger', async () => {
  const harness = createTaskHarness();
  await harness.deliver({ data: { locations: [location(1), location(2)] }, error: null });
  assert.equal(harness.calls.metadata, 1);
  assert.equal(harness.calls.checkpoints, 1);
  assert.equal(harness.calls.observations.length, 2);
  assert.equal(harness.calls.observations[0].measuredAt, 1);
  assert.equal(harness.calls.observations[1].measuredAt, 2);
  assert.deepEqual(harness.calls.records, []);
  assert.equal(harness.calls.secrets.length, 1);
});
