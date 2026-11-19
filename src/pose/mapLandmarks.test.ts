import { strict as assert } from 'node:assert';
import test from 'node:test';
import { mapLandmarks, portraitAspect } from './mapLandmarks';
import { kneeAngle } from '../engine/geometry';

const lm = (x: number, y: number, visibility = 1) => ({ x, y, visibility });

test('mappt Indizes und stellt echte Winkel im Pixelraum wieder her', () => {
  const W = 1080, H = 1920;
  const px = (x: number, y: number) => lm(x / W, y / H);
  const arr = Array.from({ length: 33 }, () => lm(0, 0));
  arr[23] = px(500, 600); arr[25] = px(500, 1000); arr[27] = px(700, 1200); // im Pixelraum exakt 135°
  const fixed = kneeAngle(mapLandmarks(arr, W / H), 'l')!;
  const raw = kneeAngle(mapLandmarks(arr, 1), 'l')!;
  assert.ok(Math.abs(fixed - 135) < 0.5, `fixed ${fixed}`);
  assert.ok(Math.abs(raw - 135) > 5, `ohne Korrektur verzerrt: ${raw}`);
});

test('Sichtbarkeit: niedrigster Wert aus visibility/presence', () => {
  const arr = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0.9, presence: 0.3 }));
  assert.equal(mapLandmarks(arr, 1).nose?.v, 0.3);
});

test('portraitAspect ist unabhängig von der Ausrichtung', () => {
  assert.equal(portraitAspect(1920, 1080), 1080 / 1920);
  assert.equal(portraitAspect(0, 0), 9 / 16);
});
