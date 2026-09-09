export type RecorderAction = 'setup' | 'start' | 'stop' | 'export';
export async function executeAction(_action: RecorderAction, _passcode: string): Promise<void> {
  throw new Error('Recording requires a native device build.');
}
