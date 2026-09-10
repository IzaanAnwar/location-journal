import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Application from 'expo-application';
import type { RecorderSnapshot } from '../../recording/snapshot';
import { fonts, usePalette, useTheme, type Palette } from '../../theme';

export function DevicePanel({ snapshot }: { snapshot: RecorderSnapshot }) {
  const [isExpanded, setExpanded] = useState(false);
  const { mode, setMode } = useTheme();
  const styles = createStyles(usePalette());
  const protection = snapshot.protection === 'secure-enclave' ? 'Secure Enclave' : snapshot.protection === 'android-hardware' ? 'Android hardware' : snapshot.protection === 'software' ? 'Software storage' : 'Unavailable';
  return <View style={styles.panel}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: isExpanded }} onPress={() => setExpanded(!isExpanded)}
      style={({ pressed }) => [styles.toggle, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={styles.summary}><Text style={styles.title}>Device & security</Text><Text style={styles.label}>{snapshot.model} • {snapshot.os || 'System unavailable'}</Text></View>
      <Text style={styles.expand}>{isExpanded ? 'Hide' : 'Details'}</Text>
    </Pressable>
    {isExpanded ? <View style={styles.details}>
      <Text style={styles.label}>Appearance</Text>
      <View style={styles.row}>{(['system', 'light', 'dark'] as const).map(choice => <Pressable key={choice}
        accessibilityRole="button" accessibilityState={{ selected: mode === choice }} onPress={() => setMode(choice)}
        style={[styles.themeChoice, mode === choice ? styles.themeSelected : null]}>
        <Text style={styles.value}>{choice.charAt(0).toUpperCase() + choice.slice(1)}</Text>
      </Pressable>)}</View>
      <View style={styles.row}><Text style={styles.label}>Key storage</Text><Text style={styles.value}>{protection}</Text></View>
      <View style={styles.row}><Text style={styles.label}>App version</Text><Text selectable style={styles.value}>{Application.nativeApplicationVersion ?? 'Web preview'}</Text></View>
      <Text style={styles.label}>Signing key fingerprint</Text>
      <Text selectable style={styles.fingerprint}>{snapshot.keyId || 'Available after journal setup'}</Text>
      <Text style={styles.note}>Encrypted on this device. Signatures help detect changes to records; they do not independently verify where you were.</Text>
    </View> : null}
  </View>;
}
const createStyles = (palette: Palette) => StyleSheet.create({
  panel: { backgroundColor: palette.surface, borderRadius: 22, paddingHorizontal: 18 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 80, paddingVertical: 16 },
  summary: { flex: 1, gap: 5 }, title: { fontFamily: fonts.medium, fontSize: 16, color: palette.ink },
  expand: { fontFamily: fonts.medium, fontSize: 13, color: palette.accent },
  themeChoice: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  themeSelected: { backgroundColor: palette.accentSoft },
  details: { gap: 14, paddingBottom: 20 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  label: { color: palette.muted, fontSize: 12, fontFamily: fonts.regular },
  value: { color: palette.ink, fontSize: 13, fontFamily: fonts.medium, flexShrink: 1, textAlign: 'right' },
  fingerprint: { color: palette.ink, fontSize: 12, fontFamily: fonts.regular },
  note: { color: palette.muted, fontSize: 12, lineHeight: 19, fontFamily: fonts.regular },
});
