import { JOINTS, JointName, Pose } from '../engine/types';

type RawLandmark = { x: number; y: number; visibility?: number; presence?: number };

// MediaPipe-Namen → unsere Gelenknamen
const NAMES: Record<JointName, string> = {
  nose: 'nose', lShoulder: 'leftShoulder', rShoulder: 'rightShoulder', lElbow: 'leftElbow', rElbow: 'rightElbow',
  lWrist: 'leftWrist', rWrist: 'rightWrist', lHip: 'leftHip', rHip: 'rightHip', lKnee: 'leftKnee', rKnee: 'rightKnee',
  lAnkle: 'leftAnkle', rAnkle: 'rightAnkle',
};
// Index in MediaPipes 33-Punkte-Reihenfolge
const INDEX: Record<string, number> = {
  nose: 0, leftShoulder: 11, rightShoulder: 12, leftElbow: 13, rightElbow: 14, leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24, leftKnee: 25, rightKnee: 26, leftAnkle: 27, rightAnkle: 28,
};

/**
 * Wandelt MediaPipe-Landmarks (normiert 0..1 auf Breite/Höhe) in unser Pose-Format um.
 * `aspect` = Breite/Höhe des Bildes: x wird darauf skaliert, damit Winkel nicht verzerren
 * (sonst wirkt ein 9:16-Bild horizontal gestreckt).
 */
export function mapLandmarks(landmarks: readonly RawLandmark[], aspect: number): Pose {
  const pose: Pose = {};
  for (const j of JOINTS) {
    const l = landmarks[INDEX[NAMES[j]]];
    if (!l) continue;
    const v = Math.min(l.visibility ?? 1, l.presence ?? 1);
    pose[j] = { x: l.x * aspect, y: l.y, v };
  }
  return pose;
}

/** Seitenverhältnis des aufrechten (Hochformat-)Bildes aus der Aufnahmegröße. */
export const portraitAspect = (w: number, h: number) => (w > 0 && h > 0 ? Math.min(w, h) / Math.max(w, h) : 9 / 16);
