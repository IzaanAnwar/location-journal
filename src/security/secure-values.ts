import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const readSecret = (key: string) => SecureStore.getItemAsync(key, options);
export const writeSecret = (key: string, value: string) => SecureStore.setItemAsync(key, value, options);
export const hashText = (text: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);

export async function randomHex(): Promise<string> {
  return Array.from(await Crypto.getRandomBytesAsync(32), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Compares equal-length derived hashes without early exits on mismatched bytes. */
export function equalHashes(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}
