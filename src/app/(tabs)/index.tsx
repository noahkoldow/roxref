import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { EXERCISES } from '../../engine/exercises';
import { ExerciseId } from '../../engine/types';
import { C, s } from '../../theme';

export default function Pick() {
  return (
    <ScrollView style={s.screen}>
      <Text style={s.h2}>Übung wählen</Text>
      <Text style={s.hint}>Roxref zählt deine Wiederholungen und bewertet jede einzelne nach dem Hyrox-Standard.</Text>
      {(Object.keys(EXERCISES) as ExerciseId[]).map((id) => (
        <Pressable key={id} style={s.card} onPress={() => router.push({ pathname: '/session', params: { exercise: id } })}>
          <Text style={{ color: C.acc, fontSize: 20, fontWeight: '700' }}>{EXERCISES[id].name}</Text>
          <View style={{ height: 4 }} />
          <Text style={s.mut}>{EXERCISES[id].hint}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
