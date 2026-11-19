import { PoseFrame, Pose } from '../engine/types';
import { burpeePose, squatPose } from '../engine/synthetic';
import { ExerciseId } from '../engine/types';

/** Liefert Pose-Frames (Körperpunkte) – egal ob echte Kamera-Erkennung oder Demo. */
export interface PoseSource {
  start(onFrame: (f: PoseFrame) => void): void;
  stop(): void;
}

/** Demo-Quelle: spielt eine sauber-werdende, dann ermüdende Bewegung ab (Pipeline-Test in Expo Go). */
export function createDemoPoseSource(exercise: ExerciseId): PoseSource {
  let timer: ReturnType<typeof setInterval> | null = null;
  return {
    start(onFrame) {
      const t0 = Date.now();
      timer = setInterval(() => {
        const t = Date.now() - t0, rep = t / 2400, ph = (rep % 1) * 2 * Math.PI, w = (1 - Math.cos(ph)) / 2;
        const fatigue = Math.min(1, rep / 14); // mit der Zeit weniger Tiefe -> No-Reps
        let pose: Pose;
        if (exercise === 'burpee') pose = burpeePose(88 - w * (83 - fatigue * 30));
        else if (exercise === 'lunge') pose = squatPose(172 - w * (82 - fatigue * 35));
        else pose = squatPose(175 - w * (105 - fatigue * 45));
        onFrame({ t, pose });
      }, 33);
    },
    stop() { if (timer) clearInterval(timer); timer = null; },
  };
}
