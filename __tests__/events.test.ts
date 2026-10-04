import { initialCallState, parseEvent, reduceCall, type MiraEvent } from '../src/events';

const enc = (o: unknown) => new TextEncoder().encode(typeof o === 'string' ? o : JSON.stringify(o));

describe('L2-07 parseEvent', () => {
  it('decodes UTF-8 (Turkish)', () => {
    expect(parseEvent(enc({ type: 'memory', fact: 'Ömer sınavdan önce çok gergin' }))).toEqual({ type: 'memory', fact: 'Ömer sınavdan önce çok gergin' });
  });
  it('decodes known events', () => {
    expect(parseEvent(enc({ type: 'memory', fact: 'x' }))).toEqual({ type: 'memory', fact: 'x' });
  });
  it('ignores garbage and unknown types instead of throwing', () => {
    expect(parseEvent(enc('{not json'))).toBeNull();
    expect(parseEvent(enc({ type: 'future_feature' }))).toBeNull();
    expect(parseEvent(enc('42'))).toBeNull();
  });
});

describe('L2-08 reduceCall', () => {
  const t = (role: 'user' | 'assistant', text: string, interrupted = false): MiraEvent => ({ type: 'transcript', role, text, interrupted, at: 1 });

  it('appends lines immutably', () => {
    const s1 = reduceCall(initialCallState, t('user', 'hi'));
    expect(s1).not.toBe(initialCallState);
    expect(initialCallState.lines).toHaveLength(0);
    expect(s1.lines[0]).toMatchObject({ role: 'user', text: 'hi' });
    expect(reduceCall(s1, t('user', '   '))).toBe(s1);
  });
  it('attaches latency to the last assistant line', () => {
    let s = reduceCall(initialCallState, t('user', 'hi'));
    s = reduceCall(s, t('assistant', 'hello', true));
    s = reduceCall(s, { type: 'latency', speechId: 'a', eouMs: 1, ttftMs: 1, ttfbMs: 1, totalMs: 640 });
    expect(s.lines[1].latencyMs).toBe(640);
    expect(s.lines[1].interrupted).toBe(true);
    expect(s.latencies).toEqual([640]);
  });
  it('keeps the safety alert once raised', () => {
    let s = reduceCall(initialCallState, { type: 'safety', flagged: true, layer: 'keyword', ms: 0 });
    s = reduceCall(s, { type: 'safety', flagged: false, layer: 'classifier', ms: 200 });
    expect(s.safetyAlert).toBe(true);
    expect(s.lastSafetyMs).toBe(200);
  });
  it('caps transcript at 200 lines', () => {
    let s = initialCallState;
    for (let i = 0; i < 250; i++) s = reduceCall(s, t('user', `m${i}`));
    expect(s.lines).toHaveLength(200);
    expect(s.lines[0].text).toBe('m50');
  });
});
