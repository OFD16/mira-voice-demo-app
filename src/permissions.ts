import { PermissionsAndroid, Platform } from 'react-native';

// L2-06: ask for the microphone at RUNTIME (Android 6+); the manifest entry alone is not enough.
// Returns true only if granted, so the call is never started "deaf".
export async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true; // iOS asks by itself (NSMicrophoneUsageDescription)

  const mic = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Microphone',
    message: 'Mira needs the microphone to hear you during the call.',
    buttonPositive: 'Allow',
  });

  // Bluetooth headsets on Android 12+: nice to have, the call works without it.
  if (Number(Platform.Version) >= 31) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT).catch(() => undefined);
  }

  return mic === PermissionsAndroid.RESULTS.GRANTED;
}
