import { ScrollView, Text, View } from 'react-native';
import { DIVISIONS, STATIONS } from '../data';
import { C, s } from '../theme';

export default function StandardsScreen({ division }: { division: string }) {
  const d = DIVISIONS[division];
  return (
    <ScrollView style={s.screen}>
      <Text style={s.h2}>Standards · {division}</Text>
      {STATIONS.map((st) => (
        <View key={st.id} style={s.row}>
          <Text style={[s.txt, { color: C.acc }]}>{st.name}</Text>
          <Text style={s.txt}>{st.unit}{d[st.id] ? `  ·  ${d[st.id]}` : ''}</Text>
        </View>
      ))}
      <Text style={s.hint}>Gewichte nach Hyrox-Regelwerk (Stand 24/25) – vor dem Rennen im aktuellen Regelwerk prüfen.</Text>
    </ScrollView>
  );
}
