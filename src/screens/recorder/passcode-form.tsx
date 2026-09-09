import { useEffect, useState } from 'react';
import { Host, Button } from '@expo/ui';
import { AppState, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette } from '../../theme';

interface Props {
  title: string;
  isSetup: boolean;
  onSubmit: (passcode: string) => Promise<void>;
  onCancel: () => void;
}

export function PasscodeForm({ title, isSetup, onSubmit, onCancel }: Props) {
  const [passcode, setPasscode] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isBusy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'background') { setPasscode(''); setConfirmation(''); }
    });
    return () => listener.remove();
  }, []);
  const submit = async () => {
    if (isBusy) return;
    if (!/^[0-9]{6,12}$/.test(passcode)) { setError('Enter 6 to 12 digits.'); return; }
    if (isSetup && passcode !== confirmation) { setError('The passcodes do not match.'); return; }
    setBusy(true); setError(null);
    try { await onSubmit(passcode); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'This action could not be completed.'); }
    finally { setBusy(false); setPasscode(''); setConfirmation(''); }
  };
  return <View style={styles.form}>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.note}>{isSetup ? 'Use 6 to 12 digits. Keep it safe: there is no passcode recovery.' : 'Enter your passcode to authorize this action.'}</Text>
    <Text style={styles.label}>Passcode</Text>
    <TextInput accessibilityLabel="Passcode" secureTextEntry keyboardType="number-pad" maxLength={12}
      autoComplete="off" value={passcode} onChangeText={setPasscode} editable={!isBusy} style={styles.input} />
    {isSetup ? <><Text style={styles.label}>Confirm passcode</Text><TextInput accessibilityLabel="Confirm passcode"
      secureTextEntry keyboardType="number-pad" maxLength={12} autoComplete="off" value={confirmation}
      onChangeText={setConfirmation} editable={!isBusy} style={styles.input} /></> : null}
    {error ? <Text selectable accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Host matchContents seedColor={palette.accent} colorScheme="light"><Button disabled={isBusy} onPress={() => void submit()}>{isBusy ? 'Please wait…' : 'Confirm'}</Button></Host>
    <Host matchContents seedColor={palette.accent} colorScheme="light"><Button disabled={isBusy} variant="text" onPress={onCancel}>Cancel</Button></Host>
  </View>;
}

const styles = StyleSheet.create({
  form: { padding: 22, gap: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 20 },
  title: { color: palette.ink, fontSize: 21, fontWeight: '600' },
  note: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  label: { color: palette.ink, fontSize: 13 },
  input: { minHeight: 50, borderWidth: 1, borderColor: palette.line, borderRadius: 10, paddingHorizontal: 16, fontSize: 22, color: palette.ink },
  error: { color: palette.warning, fontSize: 13, lineHeight: 19 },
});
