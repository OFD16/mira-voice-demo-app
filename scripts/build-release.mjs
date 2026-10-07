// Builds a signed release APK pointing at the production API.
//   npm run release:apk   → dist/mira-<version>.apk
// Needs (all gitignored): src/config.release.json, android/keystore.properties, android/app/<storeFile>.
// The app imports src/config.local.json, so it is swapped for the release config during the build and
// always restored afterwards (your local dev config is never lost).
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const p = (...x) => path.join(root, ...x);
for (const f of ['src/config.release.json', 'android/keystore.properties']) {
  if (!fs.existsSync(p(f))) throw new Error(`missing ${f} (see README → Release)`);
}
const release = JSON.parse(fs.readFileSync(p('src/config.release.json'), 'utf8'));
if (!release.API_URL.startsWith('https://')) throw new Error('release API_URL must be https:// (release builds block cleartext)');

const local = p('src/config.local.json');
const backup = fs.existsSync(local) ? fs.readFileSync(local) : null;
fs.copyFileSync(p('src/config.release.json'), local);
try {
  // Absolute path: some Windows shells don't resolve a bare `gradlew.bat` from the cwd.
  const gradlew = p('android', process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
  // arm64-v8a covers practically every Android phone from the last years and builds ~4x lighter than all ABIs
  // (matters on 8 GB machines). Override: ARCHS=armeabi-v7a,arm64-v8a npm run release:apk
  const archs = process.env.ARCHS ?? 'arm64-v8a';
  // Low-memory friendly: one worker, smaller Gradle heap → more RAM left for the native (clang) compiles.
  const lowMem = process.env.LOW_MEM === '0' ? '' : '--no-daemon --max-workers=1 -Dorg.gradle.jvmargs=-Xmx1536m';
  execSync(`"${gradlew}" assembleRelease --console=plain -PreactNativeArchitectures=${archs} ${lowMem}`, {
    cwd: p('android'),
    stdio: 'inherit',
    shell: true,
  });
} finally {
  if (backup) fs.writeFileSync(local, backup);
  else fs.rmSync(local);
}

const version = fs.readFileSync(p('android/app/build.gradle'), 'utf8').match(/versionName "([^"]+)"/)[1];
fs.mkdirSync(p('dist'), { recursive: true });
const out = p('dist', `mira-${version}.apk`);
fs.copyFileSync(p('android/app/build/outputs/apk/release/app-release.apk'), out);
console.log(`\n✔ ${path.relative(root, out)}`);
