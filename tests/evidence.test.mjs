import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createEvidenceVerifier } from '../scripts/evidence-verifier.mjs';
import { encodeRecord, validateObservation } from '../src/evidence/record.ts';

const hash = text => createHash('sha256').update(text).digest('hex');
function fixture(payload = {}) {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = publicKey.export({ format: 'jwk' });
  const publicKeyHex = '04' + Buffer.from(jwk.x, 'base64url').toString('hex') + Buffer.from(jwk.y, 'base64url').toString('hex');
  const identity = { publicKeyHex, keyId: hash(publicKeyHex) };
  let previousHash = '0'.repeat(64);
  const records = [1, 2, 3].map(sequence => {
    const body = encodeRecord({ format: 'location-log/v1', sequence, previousHash, keyId: identity.keyId,
      recordedAt: 1_800_000_000_000 + sequence, uptimeMs: sequence * 1000, runtimeId: 'test', kind: 'session-start', payload });
    const record = { type: 'record', body, hash: hash(body), signature: sign('sha256', Buffer.from(body), privateKey).toString('hex') };
    previousHash = record.hash;
    return record;
  });
  return { records, header: { type: 'header', format: 'location-log/v1', identity, head: { sequence: 3, hash: previousHash } } };
}

test('valid P-256 records verify without claiming independent time', () => {
  const { records, header } = fixture();
  const verifier = createEvidenceVerifier(header);
  records.forEach(record => verifier.accept(record));
  assert.equal(verifier.finish().records, 3);
  assert.equal(verifier.finish().independentlyTimestamped, false);
});
test('changed coordinates with recomputed hash cannot reuse a signature', () => {
  const { records, header } = fixture();
  const forged = { ...records[0], body: records[0].body.replace('"payload":{}', '"payload":{"latitude":1}') };
  forged.hash = hash(forged.body);
  assert.throws(() => createEvidenceVerifier(header).accept(forged), /Signature/);
});
test('reordering, omission and duplication break the chain', () => {
  for (const order of [[1, 0, 2], [0, 2], [0, 0, 1]]) {
    const { records, header } = fixture();
    const verifier = createEvidenceVerifier(header);
    assert.throws(() => order.forEach(index => verifier.accept(records[index])), /sequence/);
  }
});
test('truncation is rejected against the declared head', () => {
  const { records, header } = fixture();
  const verifier = createEvidenceVerifier(header);
  verifier.accept(records[0]);
  assert.throws(() => verifier.finish(), /head/);
});
test('rewritten export head requires an outside checkpoint to detect truncation', () => {
  const { records, header } = fixture();
  const altered = { ...header, head: { sequence: 1, hash: records[0].hash } };
  const localOnly = createEvidenceVerifier(altered);
  localOnly.accept(records[0]);
  assert.equal(localOnly.finish().records, 1);
  const witnessed = createEvidenceVerifier(altered, header.head.hash);
  witnessed.accept(records[0]);
  assert.throws(() => witnessed.finish(), /independently/);
});
test('substituting the verification key is rejected', () => {
  const { records, header } = fixture();
  const replacement = fixture();
  assert.throws(() => createEvidenceVerifier({ ...header, identity: replacement.header.identity }).accept(records[0]), /Signature/);
});
test('encoding is deterministic and rejects ambiguous non-JSON values', () => {
  assert.equal(encodeRecord({ b: 2, a: 'é' }), encodeRecord({ a: 'é', b: 2 }));
  for (const value of [NaN, Infinity, undefined, { a: undefined }]) assert.throws(() => encodeRecord(value));
});
test('invalid coordinates are rejected while poor accuracy is retained', () => {
  const observation = { latitude: 12, longitude: 77, measuredAt: 1000, accuracy: 500,
    altitude: null, altitudeAccuracy: null, speed: null, heading: null, mocked: null };
  assert.doesNotThrow(() => validateObservation(observation));
  assert.throws(() => validateObservation({ ...observation, latitude: 91 }));
});

test('CLI verifies UTF-8 across stream boundaries and hashes the exact file', () => {
  const { records, header } = fixture({ description: 'é'.repeat(15_000) });
  const contents = [header, ...records].map(JSON.stringify).join('\n') + '\n';
  const directory = mkdtempSync(join(tmpdir(), 'location-log-verifier-'));
  const path = join(directory, 'sample.jsonl');
  try {
    writeFileSync(path, contents);
    const result = spawnSync(process.execPath, ['scripts/verify-evidence.mjs', path], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).exportFileSha256, hash(contents));
    writeFileSync(path, contents.slice(0, -1));
    const incomplete = spawnSync(process.execPath, ['scripts/verify-evidence.mjs', path], { encoding: 'utf8' });
    assert.equal(incomplete.status, 1);
  } finally { rmSync(directory, { recursive: true }); }
});
