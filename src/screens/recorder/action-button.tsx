import { Button, Host } from '@expo/ui';
import { useState } from 'react';
import { View } from 'react-native';
import { palette } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}

/** Numeric measured widths avoid percentage values crossing the Compose modifier bridge.
 * Native button text must use label, not a raw string child in the Compose tree. */
export function ActionButton({ label, onPress, disabled, secondary }: Props) {
  const [width, setWidth] = useState(0);
  return <View style={{ width: '100%', minHeight: 52 }} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    {width > 0 ? <Host matchContents={{ vertical: true }} style={{ width }} seedColor={palette.accent} colorScheme="light">
    <Button label={label} onPress={onPress} disabled={disabled} variant={secondary ? 'outlined' : 'filled'}
      style={{ width, height: 52 }} />
    </Host> : null}
  </View>;
}
