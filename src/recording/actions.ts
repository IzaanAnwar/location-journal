import { createPasscode } from '../security/passcode';
import { exportEvidence } from '../evidence/export-evidence';
import { changeRecording } from './recorder';

export type RecorderAction = 'setup' | 'start' | 'stop' | 'export';

export async function executeAction(action: RecorderAction, passcode: string): Promise<void> {
  if (action === 'setup') return createPasscode(passcode);
  if (action === 'export') return exportEvidence(passcode);
  return changeRecording(passcode, action === 'start');
}
