import { StyleSheet, Text, View } from 'react-native';
import type { Observation } from '../../evidence/record';
import { palette } from '../../theme';

export function ObservationPanel({ observation }: { observation: Observation | null }) {
  const accuracy = observation?.accuracy;
  return <View style={styles.panel}>
    <Text style={styles.eyebrow}>LATEST OBSERVATION</Text>
    {observation ? <>
      <Text selectable style={styles.coordinate}>{Math.abs(observation.latitude).toFixed(6)}° <Text style={styles.direction}>{observation.latitude >= 0 ? 'N' : 'S'}</Text></Text>
      <Text selectable style={styles.coordinate}>{Math.abs(observation.longitude).toFixed(6)}° <Text style={styles.direction}>{observation.longitude >= 0 ? 'E' : 'W'}</Text></Text>
      <View style={styles.rule} />
      <View style={styles.row}>
        <View style={styles.metric}><Text style={styles.label}>Reported accuracy</Text><Text selectable style={styles.value}>{accuracy != null && accuracy >= 0 ? `${accuracy.toFixed(1)} m` : 'Unavailable'}</Text></View>
        <View style={styles.metric}><Text style={styles.label}>Measured at · UTC</Text><Text selectable style={styles.value}>{new Date(observation.measuredAt).toISOString().slice(11, 19)}</Text></View>
      </View>
      <Text selectable style={styles.note}>{new Date(observation.measuredAt).toISOString().slice(0, 10)} · Device-reported time</Text>
      {observation.mocked ? <Text style={styles.warning}>This reading is marked as simulated.</Text> : null}
    </> : <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Your next location starts here.</Text>
      <Text style={styles.note}>Start recording to save this device’s location, time, and reported accuracy.</Text>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  panel: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 20, padding: 24, gap: 10 },
  eyebrow: { color: palette.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, marginBottom: 12 },
  coordinate: { color: palette.ink, fontSize: 32, fontWeight: '500', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  direction: { color: palette.muted, fontSize: 22 },
  rule: { height: 1, backgroundColor: palette.line, marginVertical: 14 },
  row: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },
  metric: { gap: 6, flexGrow: 1 },
  label: { color: palette.muted, fontSize: 12 },
  value: { color: palette.ink, fontSize: 17, fontWeight: '500', fontVariant: ['tabular-nums'] },
  note: { color: palette.muted, fontSize: 12, lineHeight: 19 },
  warning: { color: palette.warning, fontSize: 13 },
  empty: { minHeight: 108, justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 26, lineHeight: 33, fontWeight: '500', letterSpacing: -0.7, color: palette.ink, maxWidth: 240 },
});
