# Mira Voice Demo — React Native App

Mobile client for **Mira**, a full-duplex voice companion built on LiveKit.
🧠 Backend (token API + voice agent): **[OFD16/mira-voice-demo-api](https://github.com/OFD16/mira-voice-demo-api)**

- Bare **React Native 0.87** (no Expo) + `@livekit/react-native` (WebRTC).
- Talk to the agent; switch **Cascaded (STT → LLM → TTS)** vs **Realtime (speech-to-speech)**.
- Live transcript with **per-turn latency** badges (green < 800 ms), **✋ interrupted** markers (barge-in) and a running **p50/p95**.
- **Safety banner** when the agent's fail-closed crisis protocol fires.
- **"What Mira remembers"** screen: view and delete long-term memories.
- No provider secrets in the app; it only asks the API for a short-lived LiveKit token (guarded by tests).

## Run (Android)
```bash
npm i                       # creates src/config.local.json
# edit src/config.local.json → API_URL + DEMO_API_KEY (same as the API's .env)
npm run reverse             # real phone over USB → localhost:3000 reaches your PC
npm run android
npm test
```
Start the API and agent first (see the api repo).

## Branches
- `main` is a **learning version** with guided `TODO(L2-xx)` exercises: [docs/LESSONS.md](docs/LESSONS.md) (Turkish).
- `solution` is the complete implementation.

MIT · built by [Ömer Faruk Demirsoy](https://www.linkedin.com/in/omerfarukdemirsoy)
