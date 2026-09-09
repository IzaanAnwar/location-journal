import { useState } from 'react';
import { Host, Button } from '@expo/ui';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecorder } from '../../recording/use-recorder';
import { executeAction, type RecorderAction } from '../../recording/actions';
import { ObservationPanel } from './observation-panel';
import { DevicePanel } from './device-panel';
import { PasscodeForm } from './passcode-form';
import { palette } from '../../theme';

export function RecorderScreen() {
  const { snapshot, error, refresh } = useRecorder();
  const [action, setAction] = useState<RecorderAction | null>(null);
  const insets = useSafeAreaInsets();
  const isStale = snapshot.isRecording && (!snapshot.latest || Date.now() - snapshot.latest.measuredAt > 120_000);
  const attention = snapshot.needsAttention || Boolean(snapshot.error) || isStale;
  const status = process.env.EXPO_OS === 'web' ? 'Interface preview' : !snapshot.isReady ? 'Preparing device' : !snapshot.isRecording ? 'Ready when you are' : attention ? 'Check recording' : 'Recording enabled';
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
        <View style={styles.status}><View style={[styles.dot, attention && styles.warningDot]} /><Text style={styles.statusText}>{status}</Text></View>
        <Text style={styles.heading}>Your private location log.</Text>
        <Text style={styles.subtitle}>Saved on your device. Yours to keep.</Text>
      </View>
      {error || snapshot.error ? <Text selectable accessibilityRole="alert" style={styles.error}>{error || snapshot.error}</Text> : null}
      {snapshot.needsAttention ? <Text style={styles.error}>Background recording is interrupted. Restart it with your passcode.</Text> : null}
      <ObservationPanel observation={snapshot.latest} />
      {snapshot.lastSavedAt ? <Text style={styles.saved}>Last saved {Math.max(0, Math.floor((Date.now() - snapshot.lastSavedAt) / 1000))}s ago{isStale ? ' · Waiting for a fresh observation' : ''}</Text> : null}
      {action ? <PasscodeForm key={action} title={action === 'setup' ? 'Protect your recording' : action === 'export' ? 'Export your records' : action === 'start' ? 'Start recording' : 'Stop recording'}
        isSetup={action === 'setup'} onSubmit={submit} onCancel={() => setAction(null)} /> : <View style={styles.actions}>
        <Host matchContents seedColor={palette.accent} colorScheme="light"><Button disabled={!snapshot.isReady || Boolean(error)} onPress={() => setAction(!snapshot.hasPasscode ? 'setup' : snapshot.isRecording && !snapshot.needsAttention ? 'stop' : 'start')}>
          {!snapshot.hasPasscode ? 'Set passcode' : snapshot.isRecording && !snapshot.needsAttention ? 'Stop recording' : 'Start recording'}
        </Button></Host>
        <Text style={styles.centerNote}>Passcode required to start and stop</Text>
        <Host matchContents seedColor={palette.accent} colorScheme="light"><Button variant="text" disabled={!snapshot.records || Boolean(error)} onPress={() => setAction('export')}>Export records</Button></Host>
        <Text style={styles.centerNote}>Export contains exact locations. Share only with someone you trust.</Text>
      </View>}
      <DevicePanel snapshot={snapshot} />
      <View style={styles.integrity}>
        <Text style={styles.integrityTitle}>Private by default</Text>
        <Text style={styles.note}>Original observations are signed and stored with encryption. No location uploads.</Text>
        <Text style={styles.note}>Independent timestamp: not connected. Device time and location remain estimates.</Text>
      </View>
      <Text style={styles.footer}>Location evidence, with its limits preserved.</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: 24, paddingTop: 16, gap: 26, maxWidth: 540, width: '100%', alignSelf: 'center' },
  intro: { gap: 14, paddingVertical: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent },
  warningDot: { backgroundColor: palette.warning },
  statusText: { fontSize: 12, fontWeight: '600', color: palette.accent },
  heading: { fontSize: 27, lineHeight: 33, letterSpacing: -0.8, fontWeight: '600', color: palette.ink },
  subtitle: { fontSize: 14, lineHeight: 21, color: palette.muted },
  saved: { color: palette.muted, fontSize: 12, marginTop: -16 },
  integrity: { borderTopWidth: 1, borderColor: palette.line, paddingTop: 20, gap: 8 },
  integrityTitle: { fontWeight: '600', fontSize: 14, color: palette.ink },
  note: { color: palette.muted, fontSize: 12, lineHeight: 19 },
  actions: { gap: 10 },
  centerNote: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  footer: { textAlign: 'center', fontSize: 11, color: palette.muted, paddingTop: 4 },
  error: { color: palette.warning, fontSize: 13, lineHeight: 20 },
});
