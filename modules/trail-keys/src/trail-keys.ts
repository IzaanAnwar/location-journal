import { requireNativeModule } from 'expo';

export interface DeviceKey {
  publicKeyHex: string;
  protection: 'secure-enclave' | 'android-hardware' | 'software';
}

interface TrailKeysModule {
  getIdentity(): Promise<DeviceKey>;
  sign(message: string): Promise<string>;
  derivePasscode(passcode: string, saltHex: string): Promise<string>;
  uptimeMilliseconds(): number;
  protectStorage(): Promise<void>;
}

export const trailKeys = requireNativeModule<TrailKeysModule>('TrailKeys');
