import type { RecorderSnapshot } from './snapshot';

const snapshot: RecorderSnapshot = { isReady: false, hasPasscode: false, isRecording: false,
  needsAttention: false, model: 'Native device required', os: 'Browser preview', keyId: '',
  protection: '', records: 0, locations: 0, nativeIntervalMs: null, hasRequestedSchedule: false, gaps: 0, latest: null, lastSavedAt: null, error: null };

export function useRecorder() {
  return { snapshot, error: 'Interface preview. Install an Android or iOS development build to record locations.', refresh: async () => {} };
}
