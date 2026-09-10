import { Pressable, Text } from 'react-native';
import { usePalette } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}

/** Web preview keeps disabled labels readable without the native theme bridge. */
export function ActionButton({ label, onPress, disabled, secondary }: Props) {
  const palette = usePalette();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => ({ minHeight: 52, padding: 14, borderRadius: 26,
      justifyContent: 'center', alignItems: 'center', borderWidth: secondary ? 1 : 0,
      borderColor: palette.line, opacity: pressed ? 0.8 : 1,
      backgroundColor: secondary ? palette.surface : disabled ? palette.line : palette.accent })}>
    <Text style={{ fontSize: 15, fontWeight: '600', color: disabled ? palette.muted : secondary ? palette.ink : palette.background }}>{label}</Text>
  </Pressable>;
}
