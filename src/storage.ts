import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type RaceState = { start: number; splits: number[] };
export type HistoryEntry = { date: string; division: string; total: number; splits: number[] };

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
export const saveJSON = (key: string, v: unknown) => AsyncStorage.setItem(key, JSON.stringify(v));
export const removeKey = (key: string) => AsyncStorage.removeItem(key);

/** useState, das in AsyncStorage persistiert. `ready` ist true, sobald geladen. */
export function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadJSON(key, initial).then((v) => { setValue(v); setReady(true); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T) => { setValue(v); saveJSON(key, v); };
  return [value, set, ready] as const;
}
