import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { StringDecoder } from 'node:string_decoder';
import { createEvidenceVerifier } from './evidence-verifier.mjs';

const [path, expectedHead] = process.argv.slice(2);
if (!path || (expectedHead && !/^[a-f0-9]{64}$/.test(expectedHead))) {
  console.error('Usage: npm run verify -- evidence.jsonl [independently-saved-head-hash]');
  process.exit(1);
}
try {
  const details = await stat(path);
  if (!details.isFile() || details.size > 4 * 1024 ** 3) throw new Error('Expected a file under 4 GiB.');
  let pending = '';
  let verifier;
  const fileHash = createHash('sha256');
  const decoder = new StringDecoder('utf8');
  for await (const chunk of createReadStream(path)) {
    fileHash.update(chunk);
    pending += decoder.write(chunk);
    let newline;
    while ((newline = pending.indexOf('\n')) >= 0) {
      const line = pending.slice(0, newline);
      pending = pending.slice(newline + 1);
      if (line.length > 131_072 || !line) throw new Error('Invalid export line.');
      const envelope = JSON.parse(line);
      if (!verifier) verifier = createEvidenceVerifier(envelope, expectedHead);
      else verifier.accept(envelope);
    }
    if (pending.length > 131_072) throw new Error('Export line exceeds limit.');
  }
  if (pending || decoder.end() || !verifier) throw new Error('Incomplete export.');
  console.log(JSON.stringify({ ...verifier.finish(), exportFileSha256: fileHash.digest('hex') }, null, 2));
} catch (error) {
  console.error(`Verification failed: ${error.message}`);
  process.exitCode = 1;
}
