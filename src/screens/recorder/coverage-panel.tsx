import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, usePalette, type Palette } from '../../theme';

export function CoveragePanel({ locations, records, gaps }: { locations: number; records: number; gaps: number }) {
  const [isExpanded, setExpanded] = useState(false);
  const styles = createStyles(usePalette());
  return <View style={styles.panel}>
    <Text style={styles.title}>Journal coverage</Text>
    <View style={styles.counts}>
      <View style={styles.metric}><Text style={styles.number}>{locations.toLocaleString()}</Text><Text style={styles.label}>Location readings</Text></View>
      <View style={styles.metric}><Text style={styles.number}>{gaps.toLocaleString()}</Text><Text style={styles.label}>Intervals without readings</Text></View>
    </View>
    <Text style={styles.note}>Hourly readings leave time between observations unrecorded.</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: isExpanded }} onPress={() => setExpanded(!isExpanded)}
      style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
      <Text style={styles.link}>{isExpanded ? 'Hide explanation' : 'What does this mean?'}</Text>
    </Pressable>
    {isExpanded ? <View style={styles.explanation}>
      <Text style={styles.note}>The journal counts a gap whenever two measurements are more than two minutes apart. An hourly schedule will therefore add gaps during normal operation. This count does not mean the app crashed that many times.</Text>
      <Text style={styles.note}>For example, readings at 2 pm and 3 pm do not show where the phone was at 2:30 pm. Old gap records stay in your history.</Text>
      <Text style={styles.note}>{records.toLocaleString()} signed events in total, including locations, starts, stops, gaps and other journal events. This is why the event count can exceed the number of readings.</Text>
    </View> : null}
  </View>;
}
const createStyles = (palette: Palette) => StyleSheet.create({
  panel: { padding: 20, backgroundColor: palette.surface, borderRadius: 24, gap: 14 },
  title: { color: palette.ink, fontFamily: fonts.medium, fontSize: 16 },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: 22, paddingVertical: 5 },
  metric: { flex: 1, minWidth: 120, gap: 6 }, number: { color: palette.ink, fontFamily: fonts.medium, fontSize: 29, fontVariant: ['tabular-nums'] },
  label: { color: palette.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  note: { color: palette.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  link: { color: palette.accent, fontFamily: fonts.medium, fontSize: 13 }, explanation: { gap: 12 },
});
