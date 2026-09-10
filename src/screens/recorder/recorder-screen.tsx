import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecorder } from '../../recording/use-recorder';
import { executeAction, type RecorderAction } from '../../recording/actions';
import { ObservationPanel } from './observation-panel';
import { DevicePanel } from './device-panel';
import { CoveragePanel } from './coverage-panel';
import { RecordingStatus } from './recording-status';
import { PasscodeForm } from './passcode-form';
import { ActionButton } from './action-button';
import { formatElapsedTime } from './measurement-time';
import { fonts, usePalette, type Palette } from '../../theme';

const labels = { setup: 'Set passcode', start: 'Start recording', stop: 'Stop recording', export: 'Export journal' };

export function RecorderScreen() {
  const { snapshot, error, refresh } = useRecorder();
  const [action, setAction] = useState<RecorderAction | null>(null);
  const styles = createStyles(usePalette());
  const insets = useSafeAreaInsets();
  const isPreview = process.env.EXPO_OS === 'web';
  const mainAction = !snapshot.hasPasscode ? 'setup' : snapshot.isRecording && !snapshot.needsAttention ? 'stop' : 'start';
  const submit = async (passcode: string) => {
    if (!action) return;
    await executeAction(action, passcode);
    setAction(null);
    await refresh();
  };
  return <KeyboardAvoidingView style={styles.root} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <RecordingStatus snapshot={snapshot} error={isPreview ? null : error} />
      {!isPreview && (error || snapshot.error) ? <View style={styles.notice}><Text selectable accessibilityRole="alert" style={styles.error}>{error || snapshot.error}</Text></View> : null}
      {snapshot.needsAttention ? <Text style={styles.error}>Background recording stopped. Use your passcode to restart.</Text> : null}
      {action ? <PasscodeForm key={action} title={labels[action]} isSetup={action === 'setup'} onSubmit={submit} onCancel={() => setAction(null)} /> :
        <View style={styles.actions}>
          <ActionButton label={labels[mainAction]} disabled={!snapshot.isReady || Boolean(error)} onPress={() => setAction(mainAction)} />
          <Text style={styles.note}>{isPreview ? 'Install the Android app to begin.' : 'Passcode required to start or stop.'}</Text>
        </View>}
      <ObservationPanel observation={snapshot.latest} />
      {snapshot.lastSavedAt != null ? <Text style={styles.saved}>Last saved {formatElapsedTime(snapshot.lastSavedAt)}</Text> : null}
      <CoveragePanel locations={snapshot.locations} records={snapshot.records} gaps={snapshot.gaps} />
      <DevicePanel snapshot={snapshot} />
      {!action ? <View style={styles.actions}>
        <ActionButton secondary label="Export journal" disabled={!snapshot.records || Boolean(error)} onPress={() => setAction('export')} />
        <Text style={styles.note}>Includes precise coordinates and signed records. Share with care.</Text>
      </View> : null}
      <Text style={styles.footer}>Stored on your phone. No automatic location uploads.</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const createStyles = (palette: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: 18, paddingTop: 12, gap: 20, maxWidth: 560, width: '100%', alignSelf: 'center' },
  actions: { gap: 8 }, note: { color: palette.muted, fontSize: 12, lineHeight: 18, fontFamily: fonts.regular, textAlign: 'center' },
  saved: { color: palette.muted, fontSize: 12, fontFamily: fonts.regular, marginTop: -8, marginLeft: 6 },
  notice: { backgroundColor: palette.warningSoft, padding: 14, borderRadius: 16 },
  error: { color: palette.warning, fontSize: 13, lineHeight: 20, fontFamily: fonts.regular },
  footer: { color: palette.muted, fontSize: 12, lineHeight: 18, fontFamily: fonts.regular, textAlign: 'center', marginBottom: 12 },
});
