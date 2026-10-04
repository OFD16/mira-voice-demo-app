// Local config lives in src/config.local.json (gitignored). Copy src/config.local.example.json first.
//
// API_URL — where is mira-voice-demo-api from the PHONE's point of view?
//   • Android emulator:            http://10.0.2.2:3000   (10.0.2.2 = your PC from inside the emulator)
//   • Real phone via USB:           http://localhost:3000  + run `adb reverse tcp:3000 tcp:3000`
//   • Real phone over Wi-Fi:        http://<PC LAN IP>:3000 (same network, Windows firewall must allow port 3000)
//   • Production / release build:   https://your-api.example.com   (release builds block plain http — cleartext)
//   Common mistake: "localhost" on a real phone = the phone itself → "Network request failed".
//
// DEMO_API_KEY identifies the app to YOUR API. It is NOT a LiveKit secret and it is not real auth.
// LiveKit API secret NEVER goes into the app: an APK can be unzipped in 10 seconds.
import local from './config.local.json';

export const API_URL: string = local.API_URL;
export const DEMO_API_KEY: string = local.DEMO_API_KEY;
