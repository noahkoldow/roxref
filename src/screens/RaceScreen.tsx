import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { SEGMENTS, fmt, parseGoal, plan } from '../data';
import { HistoryEntry, RaceState, loadJSON, removeKey, saveJSON, usePersisted } from '../storage';
import { C, s } from '../theme';

type Props = { division: string; goal: string; runPct: number };

export default function RaceScreen({ division, goal, runPct }: Props) {
  const [race, setRace, ready] = usePersisted<RaceState | null>('race', null);
  const [now, setNow] = useState(Date.now());
  const running = !!race && race.splits.length < SEGMENTS.length;
  useEffect(() => {
    if (!race) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [race]);
  return (
    <View style={s.screen}>
      {running && <KeepAwake />}
      {ready && <Body {...{ race, setRace, now, division, goal, runPct }} />}
    </View>
  );
}

const KeepAwake = () => { useKeepAwake(); return null; };

function Body({ race, setRace, now, division, goal, runPct }: Props & {
  race: RaceState | null; setRace: (r: RaceState | null) => void; now: number;
}) {
  const idx = race ? race.splits.length : 0;
  const done = idx >= SEGMENTS.length;
  const goalMs = parseGoal(goal);
  const p = goalMs ? plan(goalMs, runPct) : null;
  const last = race ? (idx ? race.splits[idx - 1] : race.start) : 0;
  const total = race ? (done ? race.splits[idx - 1] : now) - race.start : 0;
  const clear = () => { setRace(null); removeKey('race'); };

  const onMain = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!race) return setRace({ start: Date.now(), splits: [] });
    if (!done) return setRace({ ...race, splits: [...race.splits, Date.now()] });
    let prev = race.start;
    const entry: HistoryEntry = {
      date: new Date().toISOString(), division, total: race.splits[race.splits.length - 1] - race.start,
      splits: race.splits.map((t) => { const d = t - prev; prev = t; return d; }),
    };
    const hist = await loadJSON<HistoryEntry[]>('history', []);
    await saveJSON('history', [entry, ...hist]);
    clear();
    Alert.alert('Gespeichert', 'Das Rennen ist im Verlauf.');
  };
  const onUndo = () => race && race.splits.length && setRace({ ...race, splits: race.splits.slice(0, -1) });
  const onReset = () => race && Alert.alert('Rennen verwerfen?', undefined, [
    { text: 'Abbrechen', style: 'cancel' }, { text: 'Verwerfen', style: 'destructive', onPress: clear }]);

  let diffEl = null;
  if (race && p && !done) {
    const target = p.slice(0, idx + 1).reduce((a, b) => a + b, 0);
    const diff = now - race.start - target;
    diffEl = <Text style={{ color: diff <= 0 ? C.ok : C.bad, textAlign: 'center', marginBottom: 4 }}>
      {diff <= 0 ? 'Vorsprung' : 'Rückstand'} {fmt(Math.abs(diff))} zum Plan (Segmentende)</Text>;
  }

  let prev = race?.start ?? 0;
  const done_splits = SEGMENTS.map((_, i) => {
    if (!race || i >= idx) return null;
    const d = race.splits[i] - prev; prev = race.splits[i]; return d;
  });

  return (
    <>
      <Text style={{ color: C.acc, fontSize: 56, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] }}>
        {fmt(total, true)}</Text>
      <Text style={{ color: C.fg, fontSize: 20, textAlign: 'center' }}>
        {!race ? 'Bereit' : done ? 'Im Ziel!' : `${SEGMENTS[idx].name} · ${SEGMENTS[idx].unit}`}</Text>
      <Text style={{ color: C.fg, fontSize: 36, textAlign: 'center', fontVariant: ['tabular-nums'], minHeight: 44 }}>
        {race && !done ? fmt(now - last) : ' '}</Text>
      {diffEl ?? <View style={{ height: 20 }} />}
      <Pressable onPress={onMain} style={{ backgroundColor: C.acc, borderRadius: 14, paddingVertical: 22, marginVertical: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', textAlign: 'center' }}>
          {!race ? 'START' : done ? 'FERTIG – SPEICHERN' : 'NÄCHSTES SEGMENT'}</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
        <Pressable style={s.ghost} onPress={onUndo}><Text style={s.txt}>Zurück</Text></Pressable>
        <Pressable style={s.ghost} onPress={onReset}><Text style={s.txt}>Reset</Text></Pressable>
      </View>
      <FlatList style={{ marginTop: 12 }} data={SEGMENTS} keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index: i }) => {
          const d = done_splits[i];
          const diff = d != null && p ? d - p[i] : null;
          return (
            <View style={[s.row, race && i === idx && { backgroundColor: C.card }]}>
              <Text style={[s.txt, item.type === 'station' && { color: C.acc }]}>{item.name}</Text>
              <Text style={s.txt}>{d != null ? fmt(d) : ''}
                {diff != null && <Text style={{ color: diff <= 0 ? C.ok : C.bad, fontSize: 13 }}>
                  {'  '}{diff <= 0 ? '-' : '+'}{fmt(Math.abs(diff))}</Text>}</Text>
            </View>
          );
        }} />
    </>
  );
}
