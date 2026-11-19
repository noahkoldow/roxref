import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DIVISIONS } from './src/data';
import { usePersisted } from './src/storage';
import { C } from './src/theme';
import RaceScreen from './src/screens/RaceScreen';
import PaceScreen from './src/screens/PaceScreen';
import StandardsScreen from './src/screens/StandardsScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const TABS = ['Race', 'Pacing', 'Standards', 'Verlauf'] as const;
const DIVS = Object.keys(DIVISIONS);

export default function App() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Race');
  const [division, setDivision] = usePersisted('division', DIVS[0]);
  const [goal, setGoal] = usePersisted('goal', '1:30');
  const [runPct, setRunPct] = usePersisted('runPct', 55);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar style="light" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: C.fg, fontSize: 22, fontWeight: '800', letterSpacing: 2 }}>ROX<Text style={{ color: C.acc }}>REF</Text></Text>
          <Pressable onPress={() => setDivision(DIVS[(DIVS.indexOf(division) + 1) % DIVS.length])}
            style={{ backgroundColor: C.card, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}>
            <Text style={{ color: C.fg }}>{division} ⇅</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          {/* Race bleibt gemountet, damit der Timer beim Tab-Wechsel weiterläuft */}
          <View style={{ flex: 1, display: tab === 'Race' ? 'flex' : 'none' }}>
            <RaceScreen division={division} goal={goal} runPct={runPct} />
          </View>
          {tab === 'Pacing' && <PaceScreen {...{ goal, setGoal, runPct, setRunPct }} />}
          {tab === 'Standards' && <StandardsScreen division={division} />}
          <View style={{ flex: 1, display: tab === 'Verlauf' ? 'flex' : 'none' }}><HistoryScreen active={tab === 'Verlauf'} /></View>
        </View>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line }}>
          {TABS.map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 14 }}>
              <Text style={{ textAlign: 'center', color: tab === t ? C.acc : C.mut, fontWeight: tab === t ? '700' : '400' }}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
