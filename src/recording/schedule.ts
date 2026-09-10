export const REQUESTED_INTERVAL_MS = 60 * 60 * 1000;

// Scheduling tolerance is for the status display, not evidence of continuous coverage.
export const READING_OVERDUE_MS = REQUESTED_INTERVAL_MS + 5 * 60 * 1000;

/** Reads the persisted Android task interval without trusting an arbitrary task-options value. */
export function getTaskIntervalMs(options: unknown): number | null {
  if (!options || typeof options !== 'object' || Array.isArray(options)) return null;
  const interval = (options as Record<string, unknown>).timeInterval;
  return typeof interval === 'number' && Number.isFinite(interval) && interval >= 0 ? interval : null;
}

/** Whether TaskManager's persisted Android options request the current hourly schedule. */
export function hasRequestedAndroidInterval(options: unknown): boolean {
  return getTaskIntervalMs(options) === REQUESTED_INTERVAL_MS;
}
