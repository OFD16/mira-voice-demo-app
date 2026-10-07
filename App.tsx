import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  BarVisualizer,
  LiveKitRoom,
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
  useVoiceAssistant,
} from '@livekit/react-native';
import { ConnectionState } from 'livekit-client';
import { deleteMemory, fetchMemories, fetchSession, type MemoryRow, type Pipeline, type SessionInfo } from './src/api';
import { EVENTS_TOPIC, initialCallState, type Line, p50p95, parseEvent, reduceCall } from './src/events';
import { deviceLang } from './src/locale';
import { ensureMicPermission } from './src/permissions';
import { useAudioSession } from './src/useAudioSession';

const C = { bg: '#0f1115', card: '#1a1d24', ink: '#eceef2', ink2: '#9aa1ad', acc: '#7c6cf2', ok: '#2fb36b', bad: '#e5534b', warn: '#e0a030' };

export default function App() {
  const [screen, setScreen] = useState<'home' | 'call' | 'memory'>('home');
  const [userId, setUserId] = useState('omer');
  const [pipeline, setPipeline] = useState<Pipeline>('cascaded');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!(await ensureMicPermission())) throw new Error('Microphone permission denied');
      setSession(await fetchSession(userId.trim(), pipeline, deviceLang()));
      setScreen('call');
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={s.root}>
        {screen === 'home' && (
          <View style={s.pad}>
            <Text style={s.h1}>Mira</Text>
            <Text style={s.sub}>Voice companion demo · LiveKit</Text>
            <Text style={s.label}>User ID</Text>
            <TextInput value={userId} onChangeText={setUserId} autoCapitalize="none" style={s.input} placeholderTextColor={C.ink2} />
            <Text style={s.label}>Pipeline</Text>
            <View style={s.row}>
              {(['cascaded', 'realtime'] as const).map((p) => (
                <Pressable key={p} onPress={() => setPipeline(p)} style={[s.chip, pipeline === p && s.chipOn]}>
                  <Text style={s.chipTxt}>{p === 'cascaded' ? 'Cascaded (STT→LLM→TTS)' : 'Realtime (speech-to-speech)'}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={start} disabled={busy} style={s.btn}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>🎙 Start talking</Text>}
            </Pressable>
            <Pressable onPress={() => setScreen('memory')} style={s.btnGhost}>
              <Text style={s.chipTxt}>🧠 What Mira remembers</Text>
            </Pressable>
            {error && <Text style={s.err}>{error}</Text>}
          </View>
        )}

        {screen === 'call' && session && (
          <LiveKitRoom
            serverUrl={session.serverUrl}
            token={session.token}
            connect
            audio
            video={false}
            onDisconnected={() => setScreen('home')}
            onError={(e) => setError(e.message)}>
            <CallScreen onHangup={() => setScreen('home')} />
          </LiveKitRoom>
        )}

        {screen === 'memory' && <MemoryScreen userId={userId.trim()} onBack={() => setScreen('home')} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function CallScreen({ onHangup }: { onHangup: () => void }) {
  useAudioSession();
  const conn = useConnectionState();
  const { state, audioTrack } = useVoiceAssistant();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const [call, dispatch] = useReducer(reduceCall, initialCallState);
  const list = useRef<FlatList<Line>>(null);

  useDataChannel(EVENTS_TOPIC, (msg) => {
    const ev = parseEvent(msg.payload);
    if (ev) dispatch(ev);
  });

  useEffect(() => {
    list.current?.scrollToEnd({ animated: true });
  }, [call.lines.length]);

  const stats = p50p95(call.latencies);
  const toggleMic = useCallback(() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled), [localParticipant, isMicrophoneEnabled]);

  return (
    <View style={s.flex}>
      {call.safetyAlert && (
        <View style={s.banner}>
          <Text style={s.bannerTxt}>🛡 Safety protocol active — fixed response sent, LLM skipped</Text>
        </View>
      )}
      <View style={s.pad}>
        <View style={s.row}>
          <Text style={s.badge}>{conn === ConnectionState.Connected ? '● live' : conn}</Text>
          <Text style={s.badge}>{call.pipeline ?? '…'}</Text>
          <Text style={s.badge}>agent: {state}</Text>
          {stats && <Text style={s.badge}>p50 {stats.p50} · p95 {stats.p95} ms</Text>}
        </View>
        <BarVisualizer state={state} barCount={7} trackRef={audioTrack} style={s.viz} options={{ minHeight: 0.1, barColor: C.acc }} />
      </View>

      <FlatList
        ref={list}
        style={s.flex}
        contentContainerStyle={s.pad}
        data={call.lines}
        keyExtractor={(l, i) => `${l.at}-${i}`}
        renderItem={({ item }) => (
          <View style={[s.bubble, item.role === 'user' ? s.me : s.bot]}>
            <Text style={s.bubbleTxt}>{item.text}</Text>
            <View style={s.row}>
              {item.interrupted && <Text style={[s.tag, { color: C.warn }]}>✋ interrupted</Text>}
              {item.latencyMs != null && (
                <Text style={[s.tag, { color: item.latencyMs < 800 ? C.ok : C.bad }]}>⏱ {item.latencyMs} ms</Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.sub}>Say hi — Mira is listening.</Text>}
      />

      {call.newFacts.length > 0 && <Text style={[s.sub, s.pad]}>🧠 saved: {call.newFacts[call.newFacts.length - 1]}</Text>}

      <View style={[s.row, s.pad]}>
        <Pressable onPress={toggleMic} style={[s.btnGhost, s.flex]}>
          <Text style={s.chipTxt}>{isMicrophoneEnabled ? '🔇 Mute' : '🎙 Unmute'}</Text>
        </Pressable>
        <Pressable onPress={onHangup} style={[s.btn, s.flex, { backgroundColor: C.bad }]}>
          <Text style={s.btnTxt}>Hang up</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MemoryScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [rows, setRows] = useState<MemoryRow[] | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    fetchMemories(userId)
      .then((r) => {
        setRows(r.memories);
        setEnabled(r.enabled);
      })
      .catch((e) => setErr(String(e.message ?? e)));
  }, [userId]);
  useEffect(load, [load]);

  return (
    <View style={[s.flex, s.pad]}>
      <Pressable onPress={onBack}>
        <Text style={s.chipTxt}>← Back</Text>
      </Pressable>
      <Text style={s.h1}>Memories</Text>
      <Text style={s.sub}>Users must be able to see and delete what the companion remembers (GDPR / KVKK).</Text>
      {!enabled && <Text style={s.err}>Memory is disabled on the API (no DATABASE_URL).</Text>}
      {err && <Text style={s.err}>{err}</Text>}
      {!rows && !err && <ActivityIndicator color={C.acc} />}
      <FlatList
        data={rows ?? []}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <View style={[s.bubble, s.bot, s.row]}>
            <Text style={[s.bubbleTxt, s.flex]}>{item.fact}</Text>
            <Pressable onPress={() => deleteMemory(userId, item.id).then(load).catch((e) => setErr(String(e.message)))}>
              <Text style={[s.tag, { color: C.bad }]}>delete</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  pad: { padding: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  h1: { color: C.ink, fontSize: 32, fontWeight: '700', marginTop: 8 },
  sub: { color: C.ink2, fontSize: 14, marginBottom: 12 },
  label: { color: C.ink2, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: C.card, color: C.ink, borderRadius: 10, padding: 12, fontSize: 16 },
  chip: { backgroundColor: C.card, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2b2f38' },
  chipOn: { borderColor: C.acc, backgroundColor: '#262145' },
  chipTxt: { color: C.ink, fontSize: 14 },
  btn: { backgroundColor: C.acc, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 18 },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnGhost: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 18, borderWidth: 1, borderColor: '#2b2f38' },
  err: { color: C.bad, marginTop: 12 },
  badge: { color: C.ink2, backgroundColor: C.card, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, overflow: 'hidden' },
  viz: { height: 90, marginTop: 12 },
  bubble: { borderRadius: 12, padding: 10, marginBottom: 8, maxWidth: '88%' },
  me: { backgroundColor: '#262145', alignSelf: 'flex-end' },
  bot: { backgroundColor: C.card, alignSelf: 'flex-start' },
  bubbleTxt: { color: C.ink, fontSize: 15 },
  tag: { fontSize: 11, marginTop: 4 },
  banner: { backgroundColor: '#4a1d1a', padding: 10 },
  bannerTxt: { color: '#ffd7d4', fontSize: 13, textAlign: 'center' },
});
