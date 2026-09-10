/** Display timezone conversion never changes the signed device timestamp. */
export function formatMeasurementTime(timestamp: number, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  const local = new Intl.DateTimeFormat(undefined, {
    timeZone, hour: 'numeric', minute: '2-digit', second: '2-digit',
  }).format(date);
  const localDate = new Intl.DateTimeFormat(undefined, {
    timeZone, day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
  return { local, localDate, timeZone, utc: date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC') };
}

export function formatElapsedTime(timestamp: number, now = Date.now()): string {
  const seconds = Math.floor((now - timestamp) / 1000);
  if (seconds < 0) return 'Device clock is behind this timestamp';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
