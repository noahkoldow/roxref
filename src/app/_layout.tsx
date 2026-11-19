import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { C } from '../theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: C.bg }, headerTintColor: C.fg, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="session" options={{ title: 'Training', presentation: 'fullScreenModal' }} />
      </Stack>
    </>
  );
}
