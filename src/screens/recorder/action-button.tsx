import { Button, Host } from '@expo/ui';
import { palette } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}

/** Native button text must use label, not a raw string child in the Compose tree. */
export function ActionButton({ label, onPress, disabled, secondary }: Props) {
  return <Host matchContents={{ vertical: true }} style={{ width: '100%' }} seedColor={palette.accent} colorScheme="light">
    <Button label={label} onPress={onPress} disabled={disabled} variant={secondary ? 'outlined' : 'filled'}
      style={{ width: '100%', height: 52 }} />
  </Host>;
}
