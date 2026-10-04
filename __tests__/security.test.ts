// "Common mistakes" guard rails — these run on every `npm test`.
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
const srcFiles = ['App.tsx', 'index.js', ...fs.readdirSync(path.join(root, 'src')).filter((f: string) => /\.(ts|tsx|js)$/.test(f)).map((f: string) => `src/${f}`)];

describe('security', () => {
  it('never ships the LiveKit API secret or server SDK in the app', () => {
    for (const f of srcFiles) {
      const s = read(f);
      expect(s).not.toMatch(/LIVEKIT_API_SECRET|livekit-server-sdk|AccessToken\(/);
    }
    const pkg = JSON.parse(read('package.json'));
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })).not.toContain('livekit-server-sdk');
  });
  it('local config is gitignored', () => {
    expect(read('.gitignore')).toMatch(/src\/config\.local\.json/);
  });
});

describe('L2-01..03 native setup', () => {
  it('L2-01 registerGlobals() is called in index.js', () => {
    expect(read('index.js')).toMatch(/^\s*registerGlobals\(\)/m);
  });
  it('L2-02 LiveKitReactNative.setup with CommunicationAudioType before super.onCreate', () => {
    const kt = read('android/app/src/main/java/com/miravoicedemo/MainApplication.kt');
    const setup = kt.search(/^\s*LiveKitReactNative\.setup\(this,\s*AudioType\.CommunicationAudioType\(\)\)/m);
    expect(setup).toBeGreaterThan(-1);
    expect(setup).toBeLessThan(kt.search(/^\s*super\.onCreate\(\)/m));
  });
  it('L2-03 manifest declares RECORD_AUDIO and MODIFY_AUDIO_SETTINGS', () => {
    const m = read('android/app/src/main/AndroidManifest.xml');
    expect(m).toMatch(/<uses-permission android:name="android\.permission\.RECORD_AUDIO"/);
    expect(m).toMatch(/<uses-permission android:name="android\.permission\.MODIFY_AUDIO_SETTINGS"/);
  });
});
