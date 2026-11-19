/** Normalisierte Bildkoordinaten (0..1), y wächst nach unten. */
export type Landmark = { x: number; y: number; v?: number };

export const JOINTS = [
  'nose', 'lShoulder', 'rShoulder', 'lElbow', 'rElbow', 'lWrist', 'rWrist',
  'lHip', 'rHip', 'lKnee', 'rKnee', 'lAnkle', 'rAnkle',
] as const;
export type JointName = (typeof JOINTS)[number];
export type Pose = Partial<Record<JointName, Landmark>>;
export type PoseFrame = { t: number; pose: Pose };

export type ExerciseId = 'wallBall' | 'lunge' | 'burpee';

export type RepResult = {
  index: number;            // laufende Nummer (auch No-Reps zählen mit)
  valid: boolean;           // false = No-Rep nach Hyrox-Standard
  score: number;            // 0..100 Ausführungsgüte
  issues: string[];         // z. B. "Zu wenig Tiefe"
  durationMs: number;
  tEnd: number;
  source: 'camera' | 'sensor';
};

export type SessionSummary = {
  exercise: ExerciseId;
  total: number;
  valid: number;
  noReps: number;
  avgScore: number;
  consistency: number;      // 0..100, 100 = völlig gleichmäßiges Tempo
  fatigue: number;          // Δ Score zweite vs. erste Hälfte (negativ = Abfall)
  topIssues: { issue: string; count: number }[];
};
