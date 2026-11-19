import { clamp, mean } from '../engine/geometry';
import { RepResult } from '../engine/types';

export type Accel = { t: number; x: number; y: number; z: number }; // in g (expo-sensors)

const MIN_INTERVAL_MS = 700;

/**
 * Sensor-Add-on: zählt Wiederholungen aus der Beschleunigung (iPhone am Körper/Gerät).
 * Bewertet nicht die Technik, sondern Tempo-Gleichmäßigkeit und Intensität je Wiederholung.
 */
export class MotionCounter {
  reps: RepResult[] = [];
  private g = { x: 0, y: 0, z: 1 };
  private dyn = 0; private peak = 0; private armed = true; private lastRepT = 0; private repStart = 0;
  private amps: number[] = [];
  /** Dynamische Beschleunigung (g), über der eine Bewegung als Wiederholung zählt. */
  constructor(private hi = 0.35, private lo = 0.12) {}

  push(a: Accel): RepResult | null {
    // Schwerkraft per Tiefpass abschätzen, Rest = Bewegungsbeschleunigung
    const k = 0.05;
    this.g = { x: this.g.x + k * (a.x - this.g.x), y: this.g.y + k * (a.y - this.g.y), z: this.g.z + k * (a.z - this.g.z) };
    const d = Math.hypot(a.x - this.g.x, a.y - this.g.y, a.z - this.g.z);
    this.dyn = this.dyn + 0.3 * (d - this.dyn);

    if (this.armed) {
      if (this.dyn > this.hi) {
        if (this.peak === 0) this.repStart = a.t;
        this.peak = Math.max(this.peak, this.dyn);
      } else if (this.peak > 0 && this.dyn < this.lo) {
        // Bewegung abgeklungen → Wiederholung
        const amp = this.peak; this.peak = 0;
        if (a.t - this.lastRepT < MIN_INTERVAL_MS) return null;
        const dur = this.lastRepT ? a.t - this.lastRepT : a.t - this.repStart;
        this.lastRepT = a.t;
        const ref = this.amps.length >= 3 ? mean(this.amps) : amp;
        this.amps.push(amp);
        const ratio = amp / ref;
        const issues: string[] = [];
        if (ratio < 0.65) issues.push('Weniger Schwung/Weg als zuvor');
        const rep: RepResult = {
          index: this.reps.length + 1, valid: true, score: Math.round(clamp(100 - Math.abs(1 - ratio) * 120)),
          issues, durationMs: dur, tEnd: a.t, source: 'sensor',
        };
        this.reps.push(rep);
        return rep;
      }
    }
    return null;
  }
}
