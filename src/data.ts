export type Segment = { type: 'run' | 'station'; name: string; unit: string; idx: number };

export const STATIONS = [
  { id: 'ski', name: 'SkiErg', unit: '1000 m' },
  { id: 'push', name: 'Sled Push', unit: '50 m' },
  { id: 'pull', name: 'Sled Pull', unit: '50 m' },
  { id: 'bbj', name: 'Burpee Broad Jumps', unit: '80 m' },
  { id: 'row', name: 'Rudern', unit: '1000 m' },
  { id: 'carry', name: 'Farmers Carry', unit: '200 m' },
  { id: 'lunge', name: 'Sandbag Lunges', unit: '100 m' },
  { id: 'wb', name: 'Wall Balls', unit: '100 Wdh.' },
] as const;

type Std = Record<string, string>;
// Gewichte nach Hyrox-Regelwerk (Stand 24/25) – vor dem Rennen gegenprüfen.
export const DIVISIONS: Record<string, Std> = {
  'Open Männer': { push: '152 kg', pull: '103 kg', carry: '2×24 kg', lunge: '20 kg', wb: '6 kg / 3,00 m' },
  'Open Frauen': { push: '102 kg', pull: '78 kg', carry: '2×16 kg', lunge: '10 kg', wb: '4 kg / 2,70 m' },
  'Pro Männer': { push: '202 kg', pull: '153 kg', carry: '2×32 kg', lunge: '30 kg', wb: '9 kg / 3,00 m' },
  'Pro Frauen': { push: '152 kg', pull: '103 kg', carry: '2×24 kg', lunge: '20 kg', wb: '6 kg / 2,70 m' },
};

// Anteil der Stationen an der gesamten Stationszeit (Näherung).
const STATION_WEIGHT = [0.12, 0.10, 0.11, 0.14, 0.12, 0.08, 0.15, 0.18];

export const SEGMENTS: Segment[] = STATIONS.flatMap((s, i) => [
  { type: 'run' as const, name: `Lauf ${i + 1}`, unit: '1 km', idx: i },
  { type: 'station' as const, name: s.name, unit: s.unit, idx: i },
]);

export function parseGoal(s: string): number | null {
  const m = s.trim().match(/^(\d+):(\d{1,2})$/);
  return m ? (+m[1] * 60 + +m[2]) * 60000 : null;
}

/** Soll-Zeit je Segment in ms. */
export function plan(goalMs: number, runPct: number): number[] {
  const runTotal = (goalMs * runPct) / 100;
  const stTotal = goalMs - runTotal;
  return SEGMENTS.map((s) => (s.type === 'run' ? runTotal / 8 : stTotal * STATION_WEIGHT[s.idx]));
}

export function fmt(ms: number, forceHours = false): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return forceHours || h ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}
