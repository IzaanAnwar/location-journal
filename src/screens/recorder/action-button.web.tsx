import { Pressable, Text } from 'react-native';
import { palette } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}

/** Web preview keeps disabled labels readable without the native theme bridge. */
export function ActionButton({ label, onPress, disabled, secondary }: Props) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => ({ minHeight: 52, padding: 14, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center', borderWidth: secondary ? 1 : 0,
      borderColor: palette.line, opacity: pressed ? 0.8 : 1,
      backgroundColor: secondary ? palette.surface : disabled ? '#526B62' : palette.accent })}>
    <Text style={{ fontSize: 15, fontWeight: '600', color: secondary ? palette.muted : '#FFFFFF' }}>{label}</Text>
  </Pressable>;
}
