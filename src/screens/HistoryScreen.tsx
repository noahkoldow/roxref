import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { fmt } from '../data';
import { HistoryEntry, loadJSON, removeKey } from '../storage';
import { C, s } from '../theme';

export default function HistoryScreen({ active }: { active: boolean }) {
  const [hist, setHist] = useState<HistoryEntry[]>([]);
  const reload = useCallback(() => loadJSON<HistoryEntry[]>('history', []).then(setHist), []);
  useEffect(() => { if (active) reload(); }, [active, reload]);
  const clear = () => Alert.alert('Verlauf löschen?', undefined, [
    { text: 'Abbrechen', style: 'cancel' },
    { text: 'Löschen', style: 'destructive', onPress: () => removeKey('history').then(reload) }]);
  return (
    <ScrollView style={s.screen}>
      <Text style={s.h2}>Verlauf</Text>
      {hist.length === 0 && <Text style={s.hint}>Noch keine Rennen gespeichert.</Text>}
      {hist.map((r, i) => {
        const runs = r.splits.filter((_, j) => j % 2 === 0);
        const avg = runs.reduce((a, b) => a + b, 0) / (runs.length || 1);
        return (
          <View key={i} style={{ backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ color: C.acc, fontSize: 20, fontWeight: '700' }}>{fmt(r.total, true)}
              <Text style={s.txt}>  {r.division}</Text></Text>
            <Text style={s.mut}>{new Date(r.date).toLocaleDateString('de-DE')} · Ø Lauf {fmt(avg)} /km</Text>
          </View>);
      })}
      {hist.length > 0 && <Pressable style={[s.ghost, { alignSelf: 'center' }]} onPress={clear}>
        <Text style={s.txt}>Verlauf löschen</Text></Pressable>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
