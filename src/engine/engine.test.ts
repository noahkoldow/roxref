import { strict as assert } from 'node:assert';
import test from 'node:test';
import { RepCounter } from './repCounter';
import { burpeePose, repsFrames, squatPose } from './synthetic';
import { kneeAngle } from './geometry';

const run = (ex: 'wallBall' | 'lunge' | 'burpee', frames: ReturnType<typeof repsFrames>) => {
  const c = new RepCounter(ex); frames.forEach((f) => c.push(f)); return { c, s: c.summary() };
};

test('synthetic pose hat den vorgegebenen Kniewinkel', () => {
  assert.ok(Math.abs(kneeAngle(squatPose(90), 'l')! - 90) < 1);
  assert.ok(Math.abs(kneeAngle(squatPose(170), 'l')! - 170) < 1);
});

test('Wall Balls: tiefe Wiederholungen zählen und sind gültig', () => {
  const { s } = run('wallBall', repsFrames((v) => squatPose(v), 175, 70, 10));
  assert.equal(s.total, 10); assert.equal(s.valid, 10); assert.ok(s.avgScore >= 80, `score ${s.avgScore}`);
});

test('Wall Balls: flache Wiederholungen sind No-Reps mit Hinweis', () => {
  const { s } = run('wallBall', repsFrames((v) => squatPose(v), 175, 110, 6));
  assert.equal(s.total, 6); assert.equal(s.noReps, 6); assert.equal(s.topIssues[0].issue, 'Zu wenig Tiefe');
});

test('Wall Balls: fehlende Streckung oben senkt den Score', () => {
  const good = run('wallBall', repsFrames((v) => squatPose(v), 175, 70, 6)).s.avgScore;
  const bad = run('wallBall', repsFrames((v) => squatPose(v), 158, 70, 6)).s.avgScore;
  assert.ok(bad < good, `${bad} < ${good}`);
});

test('Rauschen unter der Schwelle erzeugt keine Wiederholung', () => {
  const { s } = run('wallBall', repsFrames((v) => squatPose(v), 175, 150, 10));
  assert.equal(s.total, 0);
});

test('Burpees: Brust am Boden zählt, halber Weg ist No-Rep', () => {
  assert.equal(run('burpee', repsFrames(burpeePose, 88, 5, 5, 2500)).s.valid, 5);
  const half = run('burpee', repsFrames(burpeePose, 88, 28, 5, 2500)).s;
  assert.equal(half.total, 5); assert.equal(half.noReps, 5);
});

test('Gleichmäßiges Tempo ergibt hohe Konsistenz', () => {
  assert.ok(run('wallBall', repsFrames((v) => squatPose(v), 175, 70, 10)).s.consistency >= 90);
});

test('Verlorenes Tracking wird erkannt', () => {
  const c = new RepCounter('wallBall');
  c.push({ t: 0, pose: squatPose(170) }); assert.equal(c.tracking, true);
  c.push({ t: 3000, pose: {} }); assert.equal(c.tracking, false);
});
