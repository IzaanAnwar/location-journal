export interface TransactionConnection {
  execAsync(sql: string): Promise<void>;
  closeAsync(): Promise<void>;
}

/** Applies the existing SQLCipher key before this connection can access any database pages. */
export async function unlockConnection(connection: TransactionConnection, key: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('The database key is invalid.');
  // PRAGMA cannot bind parameters; only validated hexadecimal enters this statement.
  await connection.execAsync(`PRAGMA key = "x'${key}'";`);
}

/** Owns a dedicated keyed connection so unrelated reads cannot join the write transaction. */
export async function runEncryptedTransaction<T, C extends TransactionConnection>(
  connection: C, key: string, operation: (transaction: C) => Promise<T>,
): Promise<T> {
  let hasBegun = false;
  try {
    await unlockConnection(connection, key);
    await connection.execAsync('PRAGMA synchronous = FULL; PRAGMA busy_timeout = 5000;');
    await connection.execAsync('BEGIN IMMEDIATE;');
    hasBegun = true;
    const result = await operation(connection);
    await connection.execAsync('COMMIT;');
    hasBegun = false;
    return result;
  } catch (error) {
    if (hasBegun) {
      try { await connection.execAsync('ROLLBACK;'); } catch { /* Preserve the original failure. */ }
    }
    throw error;
  } finally { await connection.closeAsync(); }
}
