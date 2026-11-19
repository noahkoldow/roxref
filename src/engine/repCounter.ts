import { EXERCISES, ExerciseConfig } from './exercises';
import { clamp, mean } from './geometry';
import { ExerciseId, PoseFrame, RepResult, SessionSummary } from './types';

const SMOOTH = 0.45;          // EMA-Glättung des Signals
const MIN_REP_MS = 600;       // schneller als das ist Rauschen
const LOST_AFTER_MS = 1500;   // keine gültigen Frames → Tracking verloren

/** Zählt Wiederholungen aus einem Strom von Pose-Frames. Rein funktional, ohne Kamera testbar. */
export class RepCounter {
  readonly cfg: ExerciseConfig;
  reps: RepResult[] = [];
  phase: 'up' | 'down' = 'up';
  tracking = false;
  private ema: number | null = null;
  private tStart = 0; private minSig = 0; private maxSig = 0;
  private extra: Record<string, number> = {};
  private lastGood = 0;
  private pending: { rep: RepResult; minSig: number; extra: Record<string, number> } | null = null;
  /** Erhöht sich, wenn eine bereits gezählte Wiederholung nachträglich neu bewertet wurde. */
  revision = 0;

  constructor(readonly exercise: ExerciseId) { this.cfg = EXERCISES[exercise]; }

  /** Gibt die neue Wiederholung zurück, falls dieser Frame eine abgeschlossen hat. */
  push(f: PoseFrame): RepResult | null {
    const raw = this.cfg.signal(f.pose);
    if (raw == null) { this.tracking = f.t - this.lastGood < LOST_AFTER_MS; return null; }
    this.lastGood = f.t; this.tracking = true;
    this.ema = this.ema == null ? raw : this.ema + SMOOTH * (raw - this.ema);
    const s = this.ema;

    if (this.phase === 'up') {
      this.maxSig = Math.max(this.maxSig, s);
      if (s < this.cfg.downBelow) {
        this.settle();
        this.phase = 'down'; this.tStart = f.t; this.minSig = s; this.extra = {};
      }
    } else {
      this.minSig = Math.min(this.minSig, s);
      for (const [k, fn] of Object.entries(this.cfg.extras ?? {})) {
        const v = fn(f.pose);
        if (v != null) this.extra[k] = k === 'torso' ? Math.min(this.extra[k] ?? 180, v) : Math.max(this.extra[k] ?? -Infinity, v);
      }
      if (s > this.cfg.upAbove) {
        this.phase = 'up';
        const dur = f.t - this.tStart;
        this.maxSig = s;
        if (dur < MIN_REP_MS) return null;
        const ev = this.cfg.evaluate({ minSig: this.minSig, maxSig: s, extra: this.extra });
        const rep: RepResult = {
          index: this.reps.length + 1, valid: ev.valid, score: ev.valid ? ev.score : Math.min(ev.score, 40),
          issues: ev.issues, durationMs: dur, tEnd: f.t, source: 'camera',
        };
        this.reps.push(rep);
        this.pending = { rep, minSig: this.minSig, extra: this.extra };
        return rep;
      }
    }
    return null;
  }

  /** Bewertet die letzte Wiederholung mit dem tatsächlichen Streckungs-Höhepunkt neu. */
  private settle() {
    const p = this.pending; if (!p) return;
    this.pending = null;
    const ev = this.cfg.evaluate({ minSig: p.minSig, maxSig: this.maxSig, extra: p.extra });
    p.rep.issues = ev.issues; p.rep.score = ev.valid ? ev.score : Math.min(ev.score, 40);
    this.revision++;
  }

  summary() { this.settle(); return summarize(this.exercise, this.reps); }
}

export function summarize(exercise: ExerciseId, reps: RepResult[]): SessionSummary {
  const valid = reps.filter((r) => r.valid);
  const durs = reps.map((r) => r.durationMs);
  const m = mean(durs);
  const cv = durs.length > 1 ? Math.sqrt(mean(durs.map((d) => (d - m) ** 2))) / m : 0;
  const half = Math.floor(reps.length / 2);
  const fatigue = reps.length >= 4 ? mean(reps.slice(half).map((r) => r.score)) - mean(reps.slice(0, half).map((r) => r.score)) : 0;
  const counts = new Map<string, number>();
  reps.forEach((r) => r.issues.forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 1)));
  return {
    exercise, total: reps.length, valid: valid.length, noReps: reps.length - valid.length,
    avgScore: reps.length ? Math.round(mean(reps.map((r) => r.score))) : 0,
    consistency: Math.round(clamp(100 - cv * 200)),
    fatigue: Math.round(fatigue),
    topIssues: [...counts].map(([issue, count]) => ({ issue, count })).sort((a, b) => b.count - a.count).slice(0, 3),
  };
}
