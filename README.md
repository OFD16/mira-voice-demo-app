<p align="center"><img src="docs/logo.png" width="112" alt="Mira logo"></p>

# Mira — Voice Companion (React Native)

Mobile client for **Mira**, a full-duplex voice companion for wellbeing conversations, built on LiveKit.
🧠 Backend (token API + voice agent): **[OFD16/mira-voice-demo-api](https://github.com/OFD16/mira-voice-demo-api)**

## ⬇️ Try it (Android)
1. Download **`mira-<version>.apk`** from the **[latest release](https://github.com/OFD16/mira-voice-demo-app/releases/latest)**.
2. Install it (Android asks to allow installs from your browser / file manager).
3. Enter any name (3–40 letters/digits), tap **Start talking**, allow the microphone.

Things to try: say your name and an upcoming event, hang up, call again and ask what Mira remembers;
check **What Mira remembers** (view/delete); watch the per-turn latency badges and p50/p95.
The app follows your phone language (Turkish or English). Demo calls end after 10 minutes.

## Features
- Bare **React Native** (no Expo) + `@livekit/react-native` (WebRTC), voice-call audio mode (hardware AEC).
- Live transcript with **per-turn latency** badges, **✋ interrupted** markers (barge-in) and running **p50/p95**.
- **Safety banner** when the agent's fail-closed crisis protocol fires (stays on for the call).
- **What Mira remembers**: view and delete long-term memories.
- No provider secrets in the app: it only asks the API for a short-lived LiveKit token (guarded by tests).

## Run from source (Android)
```bash
npm i                       # creates src/config.local.json
# edit src/config.local.json → API_URL + DEMO_API_KEY (same as the API's .env)
npm run reverse             # real phone over USB → localhost:3000 reaches your PC
npm run android
npm test
```
Start the API and agent first (see the api repo).

## Release
`npm run release:apk` builds a signed APK into `dist/`. It needs three gitignored files:
`src/config.release.json` (`API_URL` must be `https://`), `android/keystore.properties` and the keystore it points to.

MIT · built by [Ömer Faruk Demirsoy](https://www.linkedin.com/in/omerfarukdemirsoy)
