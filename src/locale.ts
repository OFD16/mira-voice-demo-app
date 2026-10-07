// Device language → one of the languages the API supports (it rejects anything else with 400).
export type Lang = 'tr' | 'en';
const SUPPORTED: readonly Lang[] = ['tr', 'en'];

/** "tr-TR" → "tr". Unknown or unsupported locales fall back to English. Hermes ships Intl on Android. */
export function deviceLang(): Lang {
  try {
    const base = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0]?.toLowerCase();
    return SUPPORTED.includes(base as Lang) ? (base as Lang) : 'en';
  } catch {
    return 'en';
  }
}
