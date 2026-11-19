import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { EXERCISES } from '../../engine/exercises';
import { SessionRecord, clearSessions, loadSessions } from '../../storage';
import { C, s, scoreColor } from '../../theme';

export default function History() {
  const [list, setList] = useState<SessionRecord[]>([]);
  const reload = useCallback(() => { loadSessions().then(setList); }, []);
  useFocusEffect(reload);
  const clear = () => Alert.alert('Verlauf löschen?', undefined, [
    { text: 'Abbrechen', style: 'cancel' },
    { text: 'Löschen', style: 'destructive', onPress: () => clearSessions().then(reload) }]);
  return (
    <ScrollView style={s.screen}>
      <Text style={s.h2}>Verlauf</Text>
      {list.length === 0 && <Text style={s.hint}>Noch keine Einheiten gespeichert.</Text>}
      {list.map((r) => (
        <View key={r.id} style={s.card}>
          <Text style={{ color: C.acc, fontSize: 18, fontWeight: '700' }}>{EXERCISES[r.exercise].name}</Text>
          <Text style={s.txt}>{r.summary.valid} gültig · {r.summary.noReps} No-Reps · <Text style={{ color: scoreColor(r.summary.avgScore) }}>Ø {r.summary.avgScore}/100</Text></Text>
          <Text style={s.mut}>{new Date(r.date).toLocaleString('de-DE')} · {r.mode === 'camera' ? 'Kamera' : r.mode === 'sensor' ? 'Sensor' : 'Demo'}
            · Tempo-Konsistenz {r.summary.consistency}</Text>
        </View>
      ))}
      {list.length > 0 && <Pressable style={s.ghost} onPress={clear}><Text style={s.txt}>Verlauf löschen</Text></Pressable>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
