import { Directory, File, Paths } from 'expo-file-system';

let didCleanExports = false;

/** Runs before the screen first allows an export, cleaning files left by a previous crash. */
export function cleanInterruptedExports(): void {
  if (didCleanExports) return;
  for (const entry of new Directory(Paths.cache).list()) {
    if (entry instanceof File && /^location-log-[a-f0-9-]{36}\.jsonl$/.test(entry.name)) entry.delete();
  }
  didCleanExports = true;
}
