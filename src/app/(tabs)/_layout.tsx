import { Tabs } from 'expo-router';
import { C } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerStyle: { backgroundColor: C.bg }, headerTintColor: C.fg,
      tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: C.line }, tabBarActiveTintColor: C.acc, tabBarInactiveTintColor: C.mut }}>
      <Tabs.Screen name="index" options={{ title: 'Training' }} />
      <Tabs.Screen name="history" options={{ title: 'Verlauf' }} />
    </Tabs>
  );
}
