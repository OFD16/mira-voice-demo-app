import { PermissionsAndroid, Platform } from 'react-native';

// TODO(L2-06): Ask for the microphone at RUNTIME (Android 6+). Return true only if granted.
//   - iOS: return true (iOS asks automatically using NSMicrophoneUsageDescription in Info.plist)
//   - Android: PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, { title, message, buttonPositive })
//              granted === PermissionsAndroid.RESULTS.GRANTED
//   - Optional: BLUETOOTH_CONNECT on Android 12+ (Platform.Version >= 31) for headsets — don't fail if denied
//   Common mistake: only the manifest entry → call connects, agent talks, but never hears you.
//   Terms: dangerous permission, runtime permission.
export async function ensureMicPermission(): Promise<boolean> {
  // @sol-start L2-06
  if (Platform.OS !== 'android') return true;
  const mic = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Microphone',
    message: 'Mira needs your microphone to hear you.',
    buttonPositive: 'Allow',
  });
  if (Number(Platform.Version) >= 31) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT).catch(() => undefined);
  }
  return mic === PermissionsAndroid.RESULTS.GRANTED;
  // @sol-end
}
