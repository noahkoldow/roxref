import { ScrollView, Text, TextInput, View } from 'react-native';
import { SEGMENTS, fmt, parseGoal, plan } from '../data';
import { C, s } from '../theme';

type Props = { goal: string; setGoal: (g: string) => void; runPct: number; setRunPct: (n: number) => void };

export default function PaceScreen({ goal, setGoal, runPct, setRunPct }: Props) {
  const goalMs = parseGoal(goal);
  const p = goalMs ? plan(goalMs, runPct) : null;
  let cum = 0;
  return (
    <ScrollView style={s.screen} keyboardShouldPersistTaps="handled">
      <Text style={s.h2}>Pacing-Rechner</Text>
      <Text style={s.mut}>Zielzeit (h:mm)</Text>
      <TextInput value={goal} onChangeText={setGoal} keyboardType="numbers-and-punctuation" placeholder="1:30"
        placeholderTextColor={C.mut}
        style={{ backgroundColor: C.card, color: C.fg, fontSize: 20, padding: 12, borderRadius: 10, marginVertical: 8 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 }}>
        <Text style={s.mut}>Laufanteil {runPct} %</Text>
        {[-5, 5].map((d) => (
          <Text key={d} onPress={() => setRunPct(Math.min(70, Math.max(40, runPct + d)))}
            style={[s.ghost, s.txt]}>{d > 0 ? '+5' : '−5'}</Text>
        ))}
      </View>
      <Text style={s.hint}>Standard 55 % Lauf / 45 % Stationen; Stationsverteilung ist eine Näherung.</Text>
      {p ? (
        <>
          {SEGMENTS.map((seg, i) => { cum += p[i]; return (
            <View key={i} style={s.row}>
              <Text style={[s.txt, seg.type === 'station' && { color: C.acc }]}>{seg.name}</Text>
              <Text style={s.txt}>{fmt(p[i])}  <Text style={s.mut}>{fmt(cum)}</Text></Text>
            </View>); })}
          <Text style={[s.txt, { marginTop: 12 }]}>Lauf-Pace: {fmt(p[0])} min/km</Text>
        </>
      ) : <Text style={s.hint}>Zielzeit als h:mm eingeben, z. B. 1:30</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
