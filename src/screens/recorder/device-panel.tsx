import { StyleSheet, Text, View } from 'react-native';
import type { RecorderSnapshot } from '../../recording/snapshot';
import { palette } from '../../theme';

export function DevicePanel({ snapshot }: { snapshot: RecorderSnapshot }) {
  return <View style={styles.panel}>
    <Text style={styles.title}>Recorded by this device</Text>
    <View style={styles.row}><Text style={styles.label}>Device</Text><Text selectable style={styles.value}>{snapshot.model}</Text></View>
    <View style={styles.row}><Text style={styles.label}>System</Text><Text selectable style={styles.value}>{snapshot.os || 'Unavailable'}</Text></View>
    <View style={styles.row}><Text style={styles.label}>Signing key</Text><Text selectable style={styles.value}>{snapshot.keyId ? `${snapshot.keyId.slice(0, 8)} · ${snapshot.keyId.slice(-8)}` : 'Not available'}</Text></View>
    <View style={styles.row}><Text style={styles.label}>Key storage</Text><Text style={styles.value}>{snapshot.protection === 'secure-enclave' ? 'Secure Enclave' : snapshot.protection === 'android-hardware' ? 'Android hardware' : snapshot.protection === 'software' ? 'Software · lower assurance' : 'Not available'}</Text></View>
    <View style={styles.counts}>
      <Text style={styles.count}>{snapshot.records.toLocaleString()} <Text style={styles.label}>signed records</Text></Text>
      <Text style={styles.count}>{snapshot.gaps} <Text style={styles.label}>observed gaps</Text></Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  panel: { gap: 18, paddingHorizontal: 4 },
  title: { fontSize: 17, fontWeight: '600', color: palette.ink, marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 24 },
  label: { color: palette.muted, fontSize: 13, fontWeight: '400' },
  value: { color: palette.ink, fontSize: 13, flexShrink: 1, textAlign: 'right' },
  counts: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTopWidth: 1, borderColor: palette.line, paddingTop: 20 },
  count: { fontSize: 17, color: palette.ink, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
