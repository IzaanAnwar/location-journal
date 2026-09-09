import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '../storage/database';
import { authorize } from '../security/passcode';
import { getIdentity, checkLocalCheckpoint } from './ledger';
import { encodeRecord, FORMAT, type SignedRecord } from './record';

/** Streams a bounded snapshot to a temporary file and removes the plaintext after sharing. */
export async function exportEvidence(passcode: string): Promise<void> {
  await authorize(passcode);
  await checkLocalCheckpoint();
  if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device.');
  const identity = await getIdentity();
  const database = await getDatabase();
  const head = await database.getFirstAsync<{ sequence: number; hash: string }>('SELECT sequence, hash FROM records ORDER BY sequence DESC LIMIT 1');
  if (!head) throw new Error('There are no records to export yet.');
  const file = new File(Paths.cache, `location-log-${Crypto.randomUUID()}.jsonl`);
  file.create();
  const handle = file.open();
  try {
    const writeLine = (value: unknown) => handle.writeBytes(new TextEncoder().encode(`${encodeRecord(value)}\n`));
    writeLine({ type: 'header', format: FORMAT, identity, exportedAt: Date.now(),
      timeSource: 'device-clock-untrusted', independentTimestamp: null,
      scope: 'complete-local-history-through-head', head,
      note: 'Signatures do not establish location truth, user presence, completeness, or legal admissibility.' });
    let cursor = 0;
    while (cursor < head.sequence) {
      const records = await database.getAllAsync<SignedRecord & { sequence: number }>(
        'SELECT sequence, body, hash, signature FROM records WHERE sequence > ? AND sequence <= ? ORDER BY sequence LIMIT 250', cursor, head.sequence);
      if (!records.length) throw new Error('History changed during export.');
      for (const record of records) {
        writeLine({ type: 'record', body: record.body, hash: record.hash, signature: record.signature });
        cursor = record.sequence;
      }
    }
  } catch (error) { handle.close(); file.delete(); throw error; }
  handle.close();
  try { await Sharing.shareAsync(file.uri, { mimeType: 'application/x-ndjson', dialogTitle: 'Export private location evidence' }); }
  finally { if (file.exists) file.delete(); }
}
