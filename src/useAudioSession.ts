import { useEffect } from 'react';
import { AudioSession } from '@livekit/react-native';

// TODO(L2-09): Start the native audio session when the call screen mounts and STOP it on unmount.
//   useEffect(() => { AudioSession.startAudioSession(); return () => { AudioSession.stopAudioSession(); } }, [])
//   Start it BEFORE connecting the room (the call screen mounts before <LiveKitRoom connect>).
//   Common mistake: never stopping it → after hanging up, music/YouTube stays in "call mode" (quiet, earpiece).
//   Terms: audio session, audio focus, AudioManager (Android) / AVAudioSession (iOS).
export function useAudioSession() {
  // @sol-start L2-09 blank
  useEffect(() => {
    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);
  // @sol-end
}
