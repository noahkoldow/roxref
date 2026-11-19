import { JointName, Landmark, Pose } from './types';

const MIN_VIS = 0.5;
export const visible = (l?: Landmark): l is Landmark => !!l && (l.v ?? 1) >= MIN_VIS;

/** Winkel im Punkt b (Grad, 0..180) zwischen den Strecken b→a und b→c. */
export function angle(a: Landmark, b: Landmark, c: Landmark): number {
  const v1x = a.x - b.x, v1y = a.y - b.y, v2x = c.x - b.x, v2y = c.y - b.y;
  const n = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (n === 0) return 180;
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / n));
  return (Math.acos(cos) * 180) / Math.PI;
}

const get = (p: Pose, ...names: JointName[]) => {
  const out = names.map((n) => p[n]);
  return out.every(visible) ? (out as Landmark[]) : null;
};

/** Kniewinkel (Hüfte–Knie–Knöchel) je Seite; null wenn nicht sichtbar. */
export function kneeAngle(p: Pose, side: 'l' | 'r'): number | null {
  const j = get(p, `${side}Hip` as JointName, `${side}Knee` as JointName, `${side}Ankle` as JointName);
  return j ? angle(j[0], j[1], j[2]) : null;
}

/** Winkel des Rumpfs (Schulter→Hüfte) zur Waagerechten: 90 = aufrecht, 0 = liegend. */
export function torsoAngle(p: Pose): number | null {
  const sides = (['l', 'r'] as const).map((s) => get(p, `${s}Shoulder` as JointName, `${s}Hip` as JointName)).filter(Boolean) as Landmark[][];
  if (!sides.length) return null;
  const vals = sides.map(([s, h]) => (Math.atan2(Math.abs(h.y - s.y), Math.abs(h.x - s.x)) * 180) / Math.PI);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Hüfte relativ zum Knie: >0 = Hüfte tiefer als Knie (Hyrox: "hip crease below knee"), normiert auf Oberschenkellänge. */
export function hipBelowKnee(p: Pose): number | null {
  const vals = (['l', 'r'] as const).map((s) => {
    const j = get(p, `${s}Hip` as JointName, `${s}Knee` as JointName);
    return j ? (j[0].y - j[1].y) / (Math.hypot(j[0].x - j[1].x, j[0].y - j[1].y) || 1) : null;
  }).filter((v): v is number => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

export const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
export const avgOf = (...v: (number | null)[]) => {
  const ok = v.filter((x): x is number => x != null);
  return ok.length ? mean(ok) : null;
};
export const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
