# Dersler — mira-voice-demo-app (Türkçe)

> Önce API derslerini (L1) bitir: [mira-voice-demo-api/docs/LESSONS.md](https://github.com/OFD16/mira-voice-demo-api/blob/main/docs/LESSONS.md). Uygulama, API'deki `/session` uç noktası ve agent olmadan konuşamaz.

## Nasıl çalışılır
- `main` dalında görevler `TODO(L2-xx)` satırlarıdır. `solution` dalında doğru çözüm var:
  ```bash
  git diff main origin/solution -- src/events.ts
  ```
- Her görevde aynı döngü: önce yaygın hatayı yap ve sonucunu gör, sonra düzelt, sonra test.
- `npm test` önce 10 kırmızı gösterir. Native kurulum testleri de var (`__tests__/security.test.ts`): manifest, `registerGlobals` ve `LiveKitReactNative.setup` gerçekten yapılmış mı diye kontrol eder.

## L0 — Ortam (Windows + Android, ≈30–60 dk; ilk kurulum en uzun kısım)
1. **Android Studio**'yu kur. SDK, Platform Tools ve bir emulator gelir. `JAVA_HOME` olarak Android Studio'nun JBR'sini (JDK 17+) göster. `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`.
2. Kurulumu kontrol et: `npx react-native doctor` (kırmızı satırları düzelt).
3. `npm i`. Postinstall adımı `src/config.local.json` dosyasını otomatik oluşturur.
4. Telefonda Geliştirici seçeneklerini ve USB hata ayıklamayı aç, sonra `adb devices` ile telefonun göründüğünü kontrol et.
5. `npm run android`. İlk derleme 5–15 dakika sürebilir.

**Herkesin yaptığı hatalar:**
| Belirti | Sebep | Çözüm |
|---|---|---|
| `npm i` → `ERESOLVE … react-dom` | `@livekit/components-react` peer olarak `react-dom` istiyor | `.npmrc` içindeki `legacy-peer-deps=true` (repoda var) |
| Derleme "Filename longer than 260 characters" ya da garip CMake hataları | Windows'ta uzun ya da boşluklu yol | Projeyi `F:\Projeler\...` gibi kısa, boşluksuz bir yola koy. Gerekirse Windows'ta long paths'i aç |
| `SDK location not found` | `ANDROID_HOME` yok | `android/local.properties` → `sdk.dir=C:\\Users\\<sen>\\AppData\\Local\\Android\\Sdk` |
| Metro "Unable to resolve module ./config.local.json" | Config dosyası yok | `npm i` tekrar (postinstall) ya da example dosyasını kopyala |
| Uygulama açılıyor ama "Network request failed" | Telefonda `localhost` telefonun kendisi demek | `src/config.ts` notlarına bak: USB'de `npm run reverse`, emulator'de `10.0.2.2` |
| Expo Go ile açmaya çalışmak | Bu bare React Native projesi; LiveKit native modül gerektiriyor | `npm run android` ile derle |

## L2-01 · WebRTC global'leri (`index.js`)
- **Terimler:** polyfill, WebRTC, `RTCPeerConnection`.
- **Önce hatayı yap:** `registerGlobals()` çağırmadan "Start talking"e bas. Kırmızı ekranda "WebRTC isn't detected" ya da "RTCPeerConnection doesn't exist" hatası çıkar.
- **Doğrusu:** `index.js` dosyasının en üstünde, uygulama import edilmeden önce çağır.

## L2-02 · Native ses kurulumu (`android/.../MainApplication.kt`)
- **Terimler:** AudioType, communication mode, AEC (echo cancellation), audio focus.
- **Önce hatayı yap:** `AudioType.MediaAudioType()` kullan ve **hoparlörden** konuş. Bot kendi sesini kullanıcı sanıp kendi sözünü keser; uygulamada sürekli ✋ interrupted görürsün. Buna yankı döngüsü denir.
- **Doğrusu:** `LiveKitReactNative.setup(this, AudioType.CommunicationAudioType())` satırı `super.onCreate()`'den **önce** gelmeli. Native kod değiştiği için yeniden derle: `npm run android` (Metro reload yetmez).

## L2-03 · Manifest izinleri (`AndroidManifest.xml`)
- **Terimler:** dangerous permission, manifest.
- **Önce hatayı yap:** `RECORD_AUDIO` yazmadan çalıştır. Bağlantı kurulur, bot konuşur ama seni hiç duymaz. Bu, ses uygulamalarında en sık rastlanan "sessiz" hata.
- **Doğrusu:** `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `ACCESS_NETWORK_STATE`, `BLUETOOTH_CONNECT`.

## L2-04 · API adresi (`src/config.local.json`)
- **Terimler:** loopback, `adb reverse`, cleartext traffic, LAN IP.
- **Önce hatayı yap:** Gerçek telefonda `http://localhost:3000` kullan, `adb reverse` yapma. Sonuç "Cannot reach API…".
- **Doğrusu:**
  - USB: `npm run reverse` (yani `adb reverse tcp:3000 tcp:3000`)
  - Emulator: `http://10.0.2.2:3000`
  - Wi-Fi: PC'nin LAN IP'si + Windows güvenlik duvarında 3000 portunu aç
- **Prod:** Release build düz `http`'yi engeller (`usesCleartextTraffic=false`). Gerçek dağıtımda API HTTPS arkasında olmalı.

## L2-05 · Oturum isteği (`src/api.ts`)
- **Terimler:** token server, trust boundary.
- **Önce hatayı yap:** Yanlış `DEMO_API_KEY` yaz → 401 alırsın. Sonra `userId` olarak `../x` dene → 400. Hata mesajını kullanıcıya düzgün göster.
- **Asıl büyük hata (yapma, sadece anla):** LiveKit secret'ını uygulamaya koyup token'ı uygulamada üretmek. Güvenlik testi `livekit-server-sdk` paketini ve `AccessToken(` çağrısını yakalar.
- **Doğrusu:** `POST /session` → `{ serverUrl, token, roomName }`.

## L2-06 · Çalışma zamanı mikrofon izni (`src/permissions.ts`)
- **Terimler:** runtime permission.
- **Önce hatayı yap:** Fonksiyon her zaman `true` döndürsün. Ayarlar'dan uygulamanın mikrofon iznini kapat; uygulama yine "bağlandı" der ama seni duymaz.
- **Doğrusu:** `PermissionsAndroid.request(RECORD_AUDIO)`, Android 12+ için `BLUETOOTH_CONNECT`. İzin reddedilirse aramayı hiç başlatma ve kullanıcıya nedenini söyle.

## L2-07 · Olayı çözme (`src/events.ts` → `parseEvent`)
- **Terimler:** data channel payload, UTF-8, forward compatibility.
- **Önce hatayı yap:** `JSON.parse(String.fromCharCode(...payload))` kullan. Türkçe karakterler bozulur ("Ã–mer"). Bir de try/catch koyma: sunucu yeni bir olay tipi gönderdiği gün uygulama çöker.
- **Doğrusu:** `utf8()` ile çöz, sonra güvenli `JSON.parse`, bilinmeyen tipe `null`.
- **Test:** `npm test -- events`

## L2-08 · Reducer (`src/events.ts` → `reduceCall`)
- **Terimler:** immutable update, reducer, derived state.
- **Önce hatayı yap:** `state.lines.push(line); return state;` yaz. Ekran güncellenmez, çünkü referans aynı kalıyor ve React değişikliği görmüyor.
- **Doğrusu:** Spread ile yeni dizi döndür, en fazla 200 satır tut, latency'yi son assistant satırına ekle. Güvenlik uyarısı bir kez açılınca açık kalsın.
- **Test:** `npm test -- events`

## L2-09 · Audio session yaşam döngüsü (`src/useAudioSession.ts`)
- **Terimler:** audio session, AudioManager, AVAudioSession.
- **Önce hatayı yap:** `stopAudioSession` çağırma. Aramayı kapattıktan sonra YouTube aç; ses kısık gelir ya da ahizeden çıkar, çünkü telefon hâlâ "arama modunda".
- **Doğrusu:** `useEffect` içinde start, cleanup'ta stop.

---

## L3 — Uçtan uca test senaryoları (gerçek telefonda; videoda göstereceklerin)
1. **Gecikme:** 20 tur konuş ve "p50 · p95" rozetini not al. Her balonda ⏱ değeri var: yeşil < 800 ms, kırmızı ≥ 800 ms.
2. **Barge-in:** Bot konuşurken sözünü kes. Balonda ✋ interrupted görünmeli ve bot seni dinlemeye geçmeli.
3. **False interruption:** Bot konuşurken kısa bir öksür. Bot susmamalı (API'de `minDuration 500`).
4. **Ağ değişimi:** Konuşma sırasında Wi-Fi'yi kapat. LiveKit yeniden bağlanmalı, rozet `reconnecting` → `● live` olmalı. Bu, Red Cactus'ta production'da çözdüğün problemin aynısı.
5. **Bluetooth / hoparlör:** Kulaklık tak, çıkar, hoparlöre geç. AEC bozuluyor mu?
6. **Güvenlik:** "Artık yaşamak istemiyorum" de. Kırmızı bant çıkmalı ve sabit cevap gelmeli.
7. **Hafıza:** "Adım Ömer, cuma sınavım var" de, aramayı kapat, yeniden ara. Sonra 🧠 ekranında gör ve sil.
8. **Cascaded ⇄ Realtime:** Aynı cümleleri iki modda söyle. Hangisi daha doğal? Gecikme rozeti nasıl değişiyor? Realtime modda güvenlik kancası neden daha zayıf?

## Prod'da herkesin unuttukları (çözüm dalında yapılmış)
- `fetch` için timeout (`src/api.ts` → `call`): mobil ağ hata vermek yerine asılı kalır.
- API çağrıları HTTPS, release'te cleartext kapalı.
- Uygulamada hiçbir sağlayıcı anahtarı (OpenAI, Deepgram, LiveKit secret) yok; güvenlik testi bunu garanti ediyor.
- Transkript sınırı (200 satır): uzun bir aramada bellek sürekli büyümesin.
- Kullanıcı hafızasını görebilmeli ve silebilmeli (KVKK/GDPR).
