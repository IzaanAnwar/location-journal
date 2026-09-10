import { useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import type { Observation } from '../../evidence/record';
import { fonts, usePalette, type Palette } from '../../theme';
import { ActionButton } from './action-button';

/** An explicit, foreground-only lookup. Returned labels never enter the evidence ledger. */
export function PlaceLookup({ observation }: { observation: Observation }) {
  const styles = createStyles(usePalette());
  const [isConfirming, setConfirming] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRequesting = useRef(false);
  const lookup = async () => {
    if (isRequesting.current || AppState.currentState !== 'active') return;
    isRequesting.current = true;
    setConfirming(false); setBusy(true); setError(null);
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Location permission is required for this lookup.');
      if (AppState.currentState !== 'active') return;
      const results = await Location.reverseGeocodeAsync({ latitude: observation.latitude, longitude: observation.longitude });
      const place = results[0];
      const label = place && (place.formattedAddress || [...new Set([
        [place.streetNumber, place.street].filter(Boolean).join(' '),
        place.district, place.city, place.region, place.postalCode, place.country,
      ].filter(Boolean))].join(', '));
      if (!label) throw new Error('No address found for this reading. Coordinates are still available.');
      setAddress(label);
    } catch {
      setError('Address unavailable. Check connectivity and location permission, then try again.');
    } finally { isRequesting.current = false; setBusy(false); }
  };
  return <View style={styles.section}>
    <Text style={styles.title}>Place name</Text>
    {address ? <><Text selectable style={styles.address}>{address}</Text><Text style={styles.note}>Approximate result from your phone's geocoding provider. Not part of the signed evidence.</Text></> : <>
      <Text style={styles.note}>Optional address lookup. Coordinates remain the original observation.</Text>
      {isConfirming ? <View style={styles.consent}>
        <Text style={styles.note}>This sends this reading's coordinates to your phone's geocoding provider, which may be Google or Apple. It may need internet. No lookup runs automatically.</Text>
        <ActionButton label="Allow this lookup" onPress={() => void lookup()} />
        <ActionButton secondary label="Cancel" onPress={() => setConfirming(false)} />
      </View> : <ActionButton secondary label={isBusy ? 'Looking up address…' : 'Look up address'} disabled={isBusy || process.env.EXPO_OS === 'web'} onPress={() => setConfirming(true)} />}
      {error ? <Text accessibilityRole="alert" style={styles.warning}>{error}</Text> : null}
    </>}
  </View>;
}
const createStyles = (palette: Palette) => StyleSheet.create({
  section: { gap: 10, marginTop: 8 }, title: { color: palette.ink, fontFamily: fonts.medium, fontSize: 15 },
  address: { color: palette.ink, fontFamily: fonts.medium, fontSize: 18, lineHeight: 25 },
  note: { color: palette.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19 },
  consent: { padding: 14, gap: 12, backgroundColor: palette.accentSoft, borderRadius: 16 },
  warning: { color: palette.warning, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19 },
});
