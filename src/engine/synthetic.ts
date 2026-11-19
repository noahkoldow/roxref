import { Pose, PoseFrame } from './types';

/** Erzeugt eine Seitenansicht-Pose aus Kniewinkel (Grad) und Rumpfneigung (0 = aufrecht … 90 = liegend). */
export function squatPose(kneeDeg: number, torsoLean = 10): Pose {
  const thigh = 0.2, shin = 0.2, torso = 0.25;
  const ankle = { x: 0.5, y: 0.9, v: 1 };
  const k = (kneeDeg * Math.PI) / 180;
  // Schienbein senkrecht, Oberschenkel nach hinten-oben um (180-knee) geneigt
  const knee = { x: ankle.x, y: ankle.y - shin, v: 1 };
  const dir = Math.PI - k; // Abweichung von der Senkrechten
  const hip = { x: knee.x - Math.sin(dir) * thigh, y: knee.y - Math.cos(dir) * thigh, v: 1 };
  const lean = (torsoLean * Math.PI) / 180;
  const shoulder = { x: hip.x + Math.sin(lean) * torso, y: hip.y - Math.cos(lean) * torso, v: 1 };
  const wrist = { x: shoulder.x, y: shoulder.y - 0.1, v: 1 };
  return { nose: { ...shoulder, y: shoulder.y - 0.05 }, lShoulder: shoulder, rShoulder: shoulder, lHip: hip, rHip: hip,
    lKnee: knee, rKnee: knee, lAnkle: ankle, rAnkle: ankle, lWrist: wrist, rWrist: wrist };
}

/** Rumpf liegend/aufrecht (für Burpees): torsoDeg 90 = aufrecht, 0 = Brust am Boden. */
export function burpeePose(torsoDeg: number): Pose {
  const a = (torsoDeg * Math.PI) / 180, len = 0.3;
  const hip = { x: 0.5, y: 0.7, v: 1 };
  const shoulder = { x: hip.x - Math.cos(a) * len, y: hip.y - Math.sin(a) * len, v: 1 };
  return { lShoulder: shoulder, rShoulder: shoulder, lHip: hip, rHip: hip };
}

/** Sinusbewegung zwischen top und bottom, `reps` Wiederholungen, 30 fps. */
export function repsFrames(make: (v: number) => Pose, top: number, bottom: number, reps: number,
  repMs = 2000, t0 = 0): PoseFrame[] {
  const out: PoseFrame[] = [];
  const n = Math.round((reps * repMs) / 33);
  for (let i = 0; i <= n; i++) {
    const t = i * 33, ph = (t / repMs) * 2 * Math.PI;
    const v = top + ((bottom - top) * (1 - Math.cos(ph))) / 2;
    out.push({ t: t0 + t, pose: make(v) });
  }
  return out;
}
