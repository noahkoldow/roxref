import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseId, RepResult, SessionSummary } from './engine/types';

export type SessionRecord = {
  id: string; date: string; exercise: ExerciseId; mode: 'camera' | 'demo' | 'sensor';
  summary: SessionSummary; reps: RepResult[];
};
const KEY = 'sessions';

export async function loadSessions(): Promise<SessionRecord[]> {
  try { const v = await AsyncStorage.getItem(KEY); return v ? JSON.parse(v) : []; } catch { return []; }
}
export async function addSession(r: SessionRecord) {
  await AsyncStorage.setItem(KEY, JSON.stringify([r, ...(await loadSessions())]));
}
export const clearSessions = () => AsyncStorage.removeItem(KEY);
