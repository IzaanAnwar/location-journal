import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { DatabaseSync } from 'node:sqlite';

const HOUR = 3600000;
function loadModule(path, modules, extras = {}) {
  const exports = {};
  const source = fs.readFileSync(path, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(compiled, { exports, ...extras, require(name) {
    if (!(name in modules)) throw new Error(`Unexpected dependency ${name}`);
    return modules[name];
  }});
  return exports;
}
function harness() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE records(sequence INTEGER PRIMARY KEY, body TEXT, hash TEXT, signature TEXT, kind TEXT, recorded_at REAL);
    CREATE TABLE metadata(key TEXT PRIMARY KEY, value TEXT); INSERT INTO metadata VALUES('recording','true');`);
  const transaction = {
    async getFirstAsync(sql, ...params) { return db.prepare(sql).get(...params) ?? null; },
    async runAsync(sql, ...params) { return db.prepare(sql).run(...params); },
  };
  let clock = 10000000, sequence = 0, lock = Promise.resolve();
  const cadence = loadModule('src/evidence/observation-cadence.ts', { '../recording/schedule': { REQUESTED_INTERVAL_MS: HOUR } });
  const modules = {
    '../recording/schedule': { REQUESTED_INTERVAL_MS: HOUR }, './observation-cadence': cadence,
    'expo-crypto': { randomUUID: () => 'test-runtime' },
    '../../modules/trail-keys/src/trail-keys': { trailKeys: { getIdentity: async () => ({ publicKeyHex: 'test-key' }), sign: async () => 'signature', uptimeMilliseconds: () => clock } },
    '../security/secure-values': { hashText: async value => value === 'test-key' ? 'identity-hash' : `hash-${++sequence}`, writeSecret: async () => {}, readSecret: async () => null },
    './record': { encodeRecord: JSON.stringify, FORMAT: 'location-log/v1', GENESIS: '0'.repeat(64) },
    '../storage/database': {
      getDatabase: async () => transaction,
      readMetadata: async key => db.prepare('SELECT value FROM metadata WHERE key=?').get(key)?.value ?? null,
      writeMetadata: async (key, value) => db.prepare('INSERT OR REPLACE INTO metadata VALUES (?,?)').run(key,value),
      withEncryptedWrite(operation) {
        const result = lock.then(async () => {
          db.exec('BEGIN IMMEDIATE');
          try { const value = await operation(transaction); db.exec('COMMIT'); return value; }
          catch (error) { db.exec('ROLLBACK'); throw error; }
        });
        lock = result.catch(() => {}); return result;
      },
    },
  };
  const load = () => loadModule('src/evidence/ledger.ts', modules, { Date: { now: () => clock }, process: { env: { EXPO_OS: 'android' } } });
  const sample = measuredAt => ({ latitude: 1, longitude: 2, measuredAt, accuracy: 5, altitude: null, altitudeAccuracy: null, heading: null, speed: null, mocked: false });
  return { db, load, sample, setClock: value => { clock = value; }, rows: () => db.prepare('SELECT * FROM records ORDER BY sequence').all() };
}

test('bursts, concurrent runtimes and reloads cannot save extra readings inside the hour', async () => {
  const h = harness(); const first = h.load();
  await first.appendHourlyObservation(h.sample(10000000));
  const second = h.load();
  h.setClock(10010000);
  await Promise.all(Array.from({length: 20}, (_, i) => (i % 2 ? first : second).appendHourlyObservation(h.sample(10000000 + i * 100))));
  assert.equal(h.rows().length, 1);
  h.setClock(10000000 + HOUR - 1);
  await second.appendHourlyObservation(h.sample(10000000 + HOUR));
  assert.equal(h.rows().length, 1);
  h.setClock(10000000 + HOUR);
  await second.appendHourlyObservation(h.sample(10000000 + HOUR));
  assert.deepEqual(h.rows().map(row => row.kind), ['location','interruption','location']);
  const bodies = h.rows().map(row => JSON.parse(row.body));
  assert.equal(bodies[2].payload.samplingPolicy, 'hourly-first-eligible-v1');
  assert.equal(bodies[2].previousHash, h.rows()[1].hash);
  h.db.close();
});

test('backwards clocks, duplicate fixes and stopped recording produce no new records', async () => {
  const h = harness(); const ledger = h.load();
  await ledger.appendHourlyObservation(h.sample(10000000));
  h.setClock(10000000 - HOUR);
  await ledger.appendHourlyObservation(h.sample(10000000 + HOUR));
  h.setClock(10000000 + HOUR);
  await ledger.appendHourlyObservation(h.sample(10000000));
  h.db.prepare("UPDATE metadata SET value='false' WHERE key='recording'").run();
  await ledger.appendHourlyObservation(h.sample(10000000 + HOUR));
  assert.equal(h.rows().length, 1);
  h.db.close();
});

test('delayed batches cannot fill many hourly samples in one callback burst', async () => {
  const h = harness(); const ledger = h.load();
  await ledger.appendHourlyObservation(h.sample(10000000));
  h.setClock(10000000 + HOUR * 5);
  for (let hour=1; hour<=5; hour++) await ledger.appendHourlyObservation(h.sample(10000000 + HOUR * hour));
  assert.equal(h.rows().filter(row => row.kind === 'location').length, 2);
  h.db.close();
});
