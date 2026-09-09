import test from 'node:test';
import assert from 'node:assert/strict';
import { runEncryptedTransaction } from '../src/storage/encrypted-transaction.ts';

function connection(failAt) {
  const calls = [];
  return { calls, async execAsync(sql) {
    calls.push(sql);
    if (sql === failAt) throw new Error('database operation failed');
  }, async closeAsync() { calls.push('close'); } };
}
const key = 'ab'.repeat(32);

test('dedicated writer is keyed before database access and closes after commit', async () => {
  const db = connection();
  const result = await runEncryptedTransaction(db, key, async transaction => {
    assert.equal(transaction, db);
    assert.match(db.calls[0], /^PRAGMA key/);
    assert.equal(db.calls.at(-1), 'BEGIN IMMEDIATE;');
    await transaction.execAsync('INSERT');
    return 'signed-head';
  });
  assert.equal(result, 'signed-head');
  assert.deepEqual(db.calls.slice(-3), ['INSERT', 'COMMIT;', 'close']);
});

test('failed insert rolls back and closes without committing', async () => {
  const db = connection('INSERT');
  await assert.rejects(runEncryptedTransaction(db, key, tx => tx.execAsync('INSERT')), /operation failed/);
  assert.deepEqual(db.calls.slice(-3), ['INSERT', 'ROLLBACK;', 'close']);
  assert.ok(!db.calls.includes('COMMIT;'));
});

test('failed commit rolls back, and a failed begin never runs the writer', async () => {
  const commit = connection('COMMIT;');
  await assert.rejects(runEncryptedTransaction(commit, key, async () => undefined));
  assert.deepEqual(commit.calls.slice(-3), ['COMMIT;', 'ROLLBACK;', 'close']);
  const begin = connection('BEGIN IMMEDIATE;');
  await assert.rejects(runEncryptedTransaction(begin, key, async () => assert.fail('writer ran')));
  assert.ok(!begin.calls.includes('ROLLBACK;'));
  assert.equal(begin.calls.at(-1), 'close');
});

test('invalid key never reaches SQL and still closes the connection', async () => {
  const db = connection();
  await assert.rejects(runEncryptedTransaction(db, 'invalid', async () => assert.fail('writer ran')), /key is invalid/);
  assert.deepEqual(db.calls, ['close']);
});
