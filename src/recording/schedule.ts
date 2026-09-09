export const REQUESTED_INTERVAL_MS = 60 * 60 * 1000;

// Scheduling tolerance is for the status display, not evidence of continuous coverage.
export const READING_OVERDUE_MS = REQUESTED_INTERVAL_MS + 5 * 60 * 1000;
