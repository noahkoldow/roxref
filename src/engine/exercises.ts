import { avgOf, clamp, hipBelowKnee, kneeAngle, torsoAngle } from './geometry';
import { ExerciseId, Pose } from './types';

/**
 * Pro Übung: ein Bewegungssignal (`signal`), das zwischen "oben" und "unten" pendelt,
 * Schwellen mit Hysterese und eine Bewertung je Wiederholung aus den Extremwerten.
 * Annahme: Seitenansicht, Handy ca. 2–3 m entfernt auf Hüfthöhe.
 */
export type RepStats = { minSig: number; maxSig: number; extra: Record<string, number> };
export type Evaluation = { valid: boolean; score: number; issues: string[] };

export type ExerciseConfig = {
  id: ExerciseId;
  name: string;
  hint: string;
  /** Bewegungssignal pro Frame; null = nicht auswertbar. Kleiner = tiefer. */
  signal: (p: Pose) => number | null;
  /** Zusatzwerte pro Frame, über die Wiederholung als Minimum erfasst. */
  extras?: Record<string, (p: Pose) => number | null>;
  downBelow: number; // Signal fällt darunter → Wiederholung beginnt
  upAbove: number;   // Signal steigt darüber → Wiederholung abgeschlossen
  evaluate: (s: RepStats) => Evaluation;
};

const finish = (issues: string[], score: number, mustHave: boolean[]): Evaluation => ({
  valid: mustHave.every(Boolean), score: Math.round(clamp(score)), issues,
});

export const EXERCISES: Record<ExerciseId, ExerciseConfig> = {
  wallBall: {
    id: 'wallBall', name: 'Wall Balls',
    hint: 'Seitlich zur Kamera, ganzer Körper im Bild. Hüftbeuge unter Kniehöhe, oben Streckung.',
    signal: (p) => avgOf(kneeAngle(p, 'l'), kneeAngle(p, 'r')),
    extras: { hipDepth: hipBelowKnee as (p: Pose) => number | null },
    downBelow: 120, upAbove: 160,
    evaluate: ({ minSig, maxSig, extra }) => {
      const issues: string[] = [];
      const deep = (extra.hipDepth ?? -1) >= 0 || minSig <= 90;
      if (!deep) issues.push('Zu wenig Tiefe');
      const lockout = maxSig >= 165;
      if (!lockout) issues.push('Oben nicht gestreckt');
      const depthScore = clamp(((130 - minSig) / 40) * 100);
      const lockScore = clamp(((maxSig - 140) / 30) * 100);
      return finish(issues, depthScore * 0.6 + lockScore * 0.4, [deep]);
    },
  },
  lunge: {
    id: 'lunge', name: 'Sandbag Lunges',
    hint: 'Seitlich zur Kamera. Hinteres Knie muss fast den Boden berühren, Oberkörper aufrecht.',
    signal: (p) => {
      const l = kneeAngle(p, 'l'), r = kneeAngle(p, 'r');
      return l != null && r != null ? Math.min(l, r) : (l ?? r);
    },
    extras: { torso: torsoAngle },
    downBelow: 110, upAbove: 155,
    evaluate: ({ minSig, maxSig, extra }) => {
      const issues: string[] = [];
      const deep = minSig <= 100;
      if (!deep) issues.push('Hinteres Knie nicht tief genug');
      if ((extra.torso ?? 90) < 70) issues.push('Oberkörper zu weit vorgebeugt');
      if (maxSig < 160) issues.push('Nicht ganz aufgerichtet');
      const depthScore = clamp(((125 - minSig) / 35) * 100);
      const uprightScore = clamp((((extra.torso ?? 90)) - 55) / 30 * 100);
      return finish(issues, depthScore * 0.6 + uprightScore * 0.25 + clamp((maxSig - 140) / 25 * 100) * 0.15, [deep]);
    },
  },
  burpee: {
    id: 'burpee', name: 'Burpee Broad Jumps',
    hint: 'Seitlich zur Kamera, genug Platz für den Sprung. Brust muss zum Boden, am Ende aufrecht.',
    signal: torsoAngle,
    downBelow: 30, upAbove: 70,
    evaluate: ({ minSig, maxSig }) => {
      const issues: string[] = [];
      const chestDown = minSig <= 22;
      if (!chestDown) issues.push('Brust nicht tief genug am Boden');
      if (maxSig < 80) issues.push('Nicht ganz aufgerichtet');
      return finish(issues, clamp((40 - minSig) / 30 * 100) * 0.65 + clamp((maxSig - 60) / 30 * 100) * 0.35, [chestDown]);
    },
  },
};
