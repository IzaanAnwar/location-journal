import { createHash, createPublicKey, verify } from 'node:crypto';

const sha256 = text => createHash('sha256').update(text).digest('hex');
const HEX_HASH = /^[a-f0-9]{64}$/;

/** Verifies a streamed export. No network access or project dependencies are required. */
export function createEvidenceVerifier(header, expectedHead) {
  if (header.type !== 'header' || header.format !== 'location-log/v1') throw new Error('Unsupported export format.');
  const publicHex = header.identity?.publicKeyHex;
  if (typeof publicHex !== 'string' || !/^04[a-f0-9]{128}$/.test(publicHex)) throw new Error('Invalid P-256 public key.');
  if (header.identity.keyId !== sha256(publicHex)) throw new Error('Device key fingerprint does not match.');
  const key = createPublicKey({ key: { kty: 'EC', crv: 'P-256',
    x: Buffer.from(publicHex.slice(2, 66), 'hex').toString('base64url'),
    y: Buffer.from(publicHex.slice(66), 'hex').toString('base64url') }, format: 'jwk' });
  let previousHash = '0'.repeat(64);
  let count = 0;
  let gaps = 0;
  let simulated = 0;
  return {
    accept(record) {
      if (record.type !== 'record' || typeof record.body !== 'string' || Buffer.byteLength(record.body) > 65_536) throw new Error('Invalid record envelope.');
      if (!HEX_HASH.test(record.hash) || sha256(record.body) !== record.hash) throw new Error('Record hash mismatch.');
      if (typeof record.signature !== 'string' || !/^[a-f0-9]{16,160}$/.test(record.signature) || record.signature.length % 2) throw new Error('Invalid signature encoding.');
      if (!verify('sha256', Buffer.from(record.body), key, Buffer.from(record.signature, 'hex'))) throw new Error('Signature verification failed.');
      const body = JSON.parse(record.body);
      if (body.format !== header.format || body.keyId !== header.identity.keyId) throw new Error('Record identity mismatch.');
      if (body.sequence !== count + 1 || body.previousHash !== previousHash) throw new Error('Broken record sequence or hash chain.');
      if (!Number.isFinite(body.recordedAt) || !Number.isFinite(body.uptimeMs) || typeof body.runtimeId !== 'string') throw new Error('Invalid timing metadata.');
      if (!['session-start', 'session-stop', 'location', 'interruption', 'configuration', 'error'].includes(body.kind)) throw new Error('Unknown event kind.');
      if (body.kind === 'location') validateLocation(body.payload);
      previousHash = record.hash;
      count++;
      if (body.kind === 'interruption') gaps++;
      if (body.kind === 'location' && body.payload.mocked === true) simulated++;
    },
    finish() {
      if (!count || count !== header.head?.sequence || previousHash !== header.head?.hash) throw new Error('Export does not match its declared head.');
      if (expectedHead && previousHash !== expectedHead) throw new Error('Export differs from the independently supplied head.');
      return { records: count, gaps, simulated, head: previousHash,
        keyId: header.identity.keyId, signaturesValid: true,
        independentlyTimestamped: false,
        limitations: 'Does not establish GPS truth, personal presence, trusted time, complete history, or admissibility. Header metadata and hardware claims are not attested.' };
    },
  };
}

function validateLocation(payload) {
  if (!payload || !Number.isFinite(payload.latitude) || Math.abs(payload.latitude) > 90 ||
    !Number.isFinite(payload.longitude) || Math.abs(payload.longitude) > 180 ||
    !Number.isFinite(payload.measuredAt) || payload.measuredAt < 0) throw new Error('Invalid location payload.');
}
