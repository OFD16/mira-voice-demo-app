import { useEffect } from 'react';
import { AudioSession } from '@livekit/react-native';

// L2-09: start the native audio session when the call screen mounts (before <LiveKitRoom connect>) and STOP it
// on unmount. Never stopping it leaves the phone in "call mode" after hang-up (YouTube quiet / from the earpiece).
export function useAudioSession() {
  useEffect(() => {
    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);
}
