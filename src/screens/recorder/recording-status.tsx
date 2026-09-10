import { StyleSheet, Text, View } from 'react-native';
import type { RecorderSnapshot } from '../../recording/snapshot';
import { READING_OVERDUE_MS } from '../../recording/schedule';
import { fonts, usePalette, type Palette } from '../../theme';

export function RecordingStatus({ snapshot, error }: { snapshot: RecorderSnapshot; error: string | null }) {
  const styles = createStyles(usePalette());
  const isAndroid = process.env.EXPO_OS === 'android';
  const isPreview = process.env.EXPO_OS === 'web';
  const isOverdue = snapshot.isRecording && snapshot.latest && Date.now() - snapshot.latest.measuredAt > (isAndroid ? READING_OVERDUE_MS : 120_000);
  const isUnknown = isAndroid && snapshot.isRecording && snapshot.nativeIntervalMs == null;
  const isMismatch = isAndroid && snapshot.isRecording && snapshot.nativeIntervalMs != null && !snapshot.hasRequestedSchedule;
  const needsAttention = snapshot.needsAttention || Boolean(error || snapshot.error) || isOverdue || isMismatch || isUnknown;
  const title = isPreview ? 'Your private journal' : !snapshot.isReady ? 'Opening journal' : !snapshot.isRecording ? 'Ready when you are' : needsAttention ? 'Check recording' : 'Recording is on';
  const interval = snapshot.nativeIntervalMs;
  return <View style={styles.container}>
    <View style={styles.statusRow}><View style={[styles.dot, needsAttention ? styles.warningDot : null]} />
      <Text style={styles.status}>{isPreview ? 'On-device recording' : snapshot.isRecording ? 'Background location' : 'Recording is off'}</Text></View>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.description}>{isPreview ? 'Your locations, kept on your phone.' : snapshot.isRecording
      ? 'You can lock your screen. Android may still interrupt background delivery.' : 'Save location observations with a passcode-protected recorder.'}</Text>
    {snapshot.isRecording ? <View style={styles.schedule}>
      <Text style={styles.scheduleLabel}>Requested interval</Text>
      <Text style={styles.scheduleValue}>{isAndroid ? interval == null ? 'Unavailable' : interval >= 60_000 ? `${Math.round(interval / 60_000)} minutes` : `${Math.round(interval / 1000)} seconds` : 'Managed by iOS'}</Text>
    </View> : null}
    {isUnknown ? <Text style={styles.warning}>Android did not return the active interval. The schedule cannot be verified.</Text> : null}
    {isMismatch ? <Text style={styles.warning}>The active interval does not match the hourly schedule. Reopen the app to retry updating it.</Text> : null}
    {snapshot.isRecording && !snapshot.latest ? <Text style={styles.description}>Waiting for the first location fix.</Text> : null}
    {isOverdue ? <Text style={styles.warning}>The last reading is older than expected. Check location permission and battery restrictions.</Text> : null}
  </View>;
}
const createStyles = (palette: Palette) => StyleSheet.create({
  container: { gap: 10, paddingHorizontal: 4, paddingTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent }, warningDot: { backgroundColor: palette.warning },
  status: { fontFamily: fonts.medium, fontSize: 12, color: palette.muted },
  title: { fontFamily: fonts.medium, fontSize: 31, color: palette.ink, letterSpacing: -0.8 },
  description: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: palette.muted },
  schedule: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, backgroundColor: palette.accentSoft, padding: 12, borderRadius: 14, marginTop: 4 },
  scheduleLabel: { fontFamily: fonts.regular, fontSize: 13, color: palette.ink },
  scheduleValue: { fontFamily: fonts.medium, fontSize: 13, color: palette.accent },
  warning: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: palette.warning },
});
