import { StyleSheet, Text, View } from 'react-native';
import type { Observation } from '../../evidence/record';
import { fonts, usePalette, type Palette } from '../../theme';
import { PlaceLookup } from './place-lookup';
import { formatMeasurementTime } from './measurement-time';

export function ObservationPanel({ observation }: { observation: Observation | null }) {
  const styles = createStyles(usePalette());
  const time = observation ? formatMeasurementTime(observation.measuredAt) : null;
  const accuracy = observation?.accuracy;
  return <View style={styles.shell}><View style={styles.panel}>
    <Text style={styles.label}>Latest observation</Text>
    {observation && time ? <>
      <View style={styles.timeBlock}>
        <Text selectable style={styles.time}>{time.local}</Text>
        <Text selectable style={styles.date}>{time.localDate}</Text>
        <Text selectable style={styles.label}>{time.timeZone} • Your current time zone</Text>
      </View>
      <View style={styles.coordinates}>
        <View style={styles.coordinateBlock}><Text style={styles.label}>Latitude</Text>
          <Text selectable style={styles.coordinate}>{Math.abs(observation.latitude).toFixed(6)}° {observation.latitude >= 0 ? 'N' : 'S'}</Text></View>
        <View style={styles.coordinateBlock}><Text style={styles.label}>Longitude</Text>
          <Text selectable style={styles.coordinate}>{Math.abs(observation.longitude).toFixed(6)}° {observation.longitude >= 0 ? 'E' : 'W'}</Text></View>
      </View>
      <View style={styles.accuracy}>
        <Text style={styles.accuracyValue}>{accuracy != null && accuracy >= 0 ? `${accuracy.toFixed(1)} m` : 'Unavailable'}</Text>
        <View style={styles.accuracyText}><Text style={styles.date}>Reported accuracy</Text>
          <Text style={styles.note}>Estimated uncertainty, not an exact address.</Text></View>
      </View>
      <Text selectable style={styles.utc}>{time.utc}</Text>
      <Text style={styles.note}>Both times use this phone's clock.</Text>
      <PlaceLookup key={`${observation.measuredAt}:${observation.latitude}:${observation.longitude}`} observation={observation} />
      {observation.mocked ? <Text style={styles.warning}>Android marked this location as simulated.</Text> : null}
    </> : <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Your journal starts here.</Text>
      <Text style={styles.note}>Start recording to save the first location and its measurement time.</Text>
    </View>}
  </View></View>;
}

const createStyles = (palette: Palette) => StyleSheet.create({
  shell: { padding: 5, borderRadius: 29, backgroundColor: palette.line },
  panel: { backgroundColor: palette.surface, borderRadius: 24, padding: 20, gap: 12, borderCurve: 'continuous' },
  timeBlock: { gap: 5, paddingVertical: 6 },
  time: { color: palette.ink, fontSize: 36, fontFamily: fonts.medium, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  date: { color: palette.ink, fontSize: 15, fontFamily: fonts.medium },
  coordinates: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingVertical: 16 },
  coordinateBlock: { flexGrow: 1, gap: 7 },
  coordinate: { color: palette.ink, fontSize: 18, fontFamily: fonts.medium, fontVariant: ['tabular-nums'] },
  label: { color: palette.muted, fontSize: 12, fontFamily: fonts.medium },
  accuracy: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', backgroundColor: palette.accentSoft, borderRadius: 16, padding: 14, gap: 12 },
  accuracyValue: { color: palette.accent, fontSize: 23, fontFamily: fonts.semibold },
  accuracyText: { flex: 1, minWidth: 140, gap: 4 },
  utc: { color: palette.ink, fontFamily: fonts.medium, fontSize: 12, marginTop: 4, fontVariant: ['tabular-nums'] },
  note: { color: palette.muted, fontSize: 12, lineHeight: 18, fontFamily: fonts.regular },
  warning: { color: palette.warning, fontSize: 13, fontFamily: fonts.medium },
  empty: { minHeight: 125, justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 27, lineHeight: 32, fontFamily: fonts.medium, color: palette.ink },
});
