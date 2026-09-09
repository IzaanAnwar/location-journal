import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecorder } from '../../recording/use-recorder';
import { executeAction, type RecorderAction } from '../../recording/actions';
import { ObservationPanel } from './observation-panel';
import { DevicePanel } from './device-panel';
import { PasscodeForm } from './passcode-form';
import { ActionButton } from './action-button';
import { palette } from '../../theme';
import { READING_OVERDUE_MS } from '../../recording/schedule';

export function RecorderScreen() {
  const { snapshot, error, refresh } = useRecorder();
  const [action, setAction] = useState<RecorderAction | null>(null);
  const insets = useSafeAreaInsets();
  const isPreview = process.env.EXPO_OS === 'web';
  const isStale = snapshot.isRecording && (!snapshot.latest || Date.now() - snapshot.latest.measuredAt > (process.env.EXPO_OS === 'android' ? READING_OVERDUE_MS : 120_000));
  const attention = snapshot.needsAttention || Boolean(error || snapshot.error) || isStale;
  const status = isPreview ? 'Preview' : attention ? 'Needs attention' : !snapshot.isReady ? 'Opening journal' : snapshot.isRecording ? 'Recording' : 'Not recording';
  const mainAction = !snapshot.hasPasscode ? 'setup' : snapshot.isRecording && !snapshot.needsAttention ? 'stop' : 'start';
  const labels = { setup: 'Set passcode', start: 'Start recording', stop: 'Stop recording', export: 'Export records' };
  const submit = async (passcode: string) => {
    if (!action) return;
    await executeAction(action, passcode);
    setAction(null);
    await refresh();
  };
  return <KeyboardAvoidingView style={styles.root} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.intro}>
        <View style={styles.statusRow}><View style={[styles.dot, { backgroundColor: attention ? palette.warning : snapshot.isRecording ? palette.accent : palette.muted }]} />
          <Text style={styles.statusLabel}>{isPreview ? 'Read-only web preview' : 'On-device location journal'}</Text></View>
        <Text accessibilityRole="header" style={styles.heading}>{status}</Text>
        <Text style={styles.subtitle}>{snapshot.isRecording ? 'Background recording enabled. Android requests a reading each hour.' : 'Location, time and accuracy. Stored on this phone.'}</Text>
      </View>
      {error || snapshot.error ? <View style={styles.notice}><Text selectable accessibilityRole="alert" style={styles.error}>{error || snapshot.error}</Text></View> : null}
      {snapshot.needsAttention ? <Text style={styles.error}>Background recording stopped. Use your passcode to restart.</Text> : null}
      {action ? <PasscodeForm key={action} title={labels[action]} isSetup={action === 'setup'} onSubmit={submit} onCancel={() => setAction(null)} /> :
        <View style={styles.actions}>
          <ActionButton label={labels[mainAction]} disabled={!snapshot.isReady || Boolean(error)} onPress={() => setAction(mainAction)} />
          <Text style={styles.note}>{isPreview ? 'Recording is available in the Android and iOS app.' : 'Your passcode is required to start or stop.'}</Text>
        </View>}
      <ObservationPanel observation={snapshot.latest} />
      {snapshot.lastSavedAt ? <Text style={styles.saved}>Saved {Math.max(0, Math.floor((Date.now() - snapshot.lastSavedAt) / 1000))} seconds ago{isStale ? ' · Waiting for a fresh reading' : ''}</Text> : null}
      <DevicePanel snapshot={snapshot} />
      {!action ? <View style={styles.actions}>
        <ActionButton secondary label="Export records" disabled={!snapshot.records || Boolean(error)} onPress={() => setAction('export')} />
        <Text style={styles.note}>Exports include exact locations. Share them carefully.</Text>
      </View> : null}
      <View style={styles.integrity}>
        <Text style={styles.integrityTitle}>Encrypted storage · Signed records</Text>
        <Text style={styles.note}>No location uploads. Time comes from this device; independent timestamps are not connected.</Text>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  intro: { gap: 8, paddingTop: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { color: palette.muted, fontSize: 12, fontWeight: '500' },
  heading: { color: palette.ink, fontSize: 32, lineHeight: 39, fontWeight: '600', letterSpacing: -1 },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  actions: { gap: 8 },
  note: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  saved: { color: palette.muted, fontSize: 12, marginTop: -16 },
  notice: { backgroundColor: palette.warningSoft, padding: 14, borderRadius: 12 },
  error: { color: palette.warning, fontSize: 13, lineHeight: 20 },
  integrity: { borderTopWidth: 1, borderColor: palette.line, paddingTop: 18, gap: 6 },
  integrityTitle: { color: palette.ink, fontSize: 13, fontWeight: '500' },
});
