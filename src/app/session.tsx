import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { Accelerometer } from 'expo-sensors';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { EXERCISES } from '../engine/exercises';
import { RepCounter, summarize } from '../engine/repCounter';
import { ExerciseId, PoseFrame, RepResult } from '../engine/types';
import { NativePoseCamera, nativePoseAvailable } from '../pose/NativePoseCamera';
import { createDemoPoseSource } from '../pose/PoseSource';
import { MotionCounter } from '../sensors/motionCounter';
import { addSession } from '../storage';
import { C, s, scoreColor } from '../theme';

type Mode = 'camera' | 'demo';
const noop = () => {};

export default function Session() {
  useKeepAwake();
  const { exercise } = useLocalSearchParams<{ exercise: ExerciseId }>();
  const cfg = EXERCISES[exercise ?? 'wallBall'];
  const nativeOk = nativePoseAvailable;
  const [mode, setMode] = useState<Mode>(nativeOk ? 'camera' : 'demo');
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [camError, setCamError] = useState<string | null>(null);
  const [sensorOn, setSensorOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [perm, requestPerm] = useCameraPermissions();

  const [reps, setReps] = useState<RepResult[]>([]);
  const [sensorReps, setSensorReps] = useState<RepResult[]>([]);
  const [tracking, setTracking] = useState(true);
  const [signal, setSignal] = useState<number | null>(null);
  const counter = useRef<RepCounter | null>(null);

  const stop = useCallback(() => setRunning(false), []);

  const onFrame = useCallback((f: PoseFrame) => {
    const c = counter.current;
    if (!c) return;
    const rep = c.push(f);
    setTracking(c.tracking);
    setSignal(c.signal);
    if (rep) {
      Haptics.notificationAsync(rep.valid ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
      setReps([...c.reps]);
    } else if (c.revision) setReps([...c.reps]);
  }, []);

  // Zähler anlegen/abbauen; Demo speist Frames selbst ein, die Kamera über <NativePoseCamera>
  useEffect(() => {
    if (!running || (mode === 'camera' && !nativeOk)) return;
    counter.current = new RepCounter(cfg.id);
    if (mode !== 'demo') return;
    const src = createDemoPoseSource(cfg.id);
    src.start(onFrame);
    return () => src.stop();
  }, [running, mode, nativeOk, cfg.id, onFrame]);

  // Sensor-Add-on
  useEffect(() => {
    if (!running || !sensorOn) return;
    const m = new MotionCounter();
    Accelerometer.setUpdateInterval(33);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      if (m.push({ t: Date.now(), x, y, z })) setSensorReps([...m.reps]);
    });
    return () => sub.remove();
  }, [running, sensorOn]);

  const begin = () => { counter.current = null; setReps([]); setSensorReps([]); setRunning(true); };
  const finish = async () => {
    setRunning(false);
    const primary = counter.current ? (counter.current.summary(), counter.current.reps) : reps;
    const list = primary.length ? primary : sensorReps;
    if (!list.length) return router.back();
    const summary = summarize(cfg.id, list);
    await addSession({ id: String(Date.now()), date: new Date().toISOString(), exercise: cfg.id,
      mode: primary.length ? mode : 'sensor', summary, reps: list });
    Alert.alert('Gespeichert', `${summary.valid} gültig · ${summary.noReps} No-Reps · Ø ${summary.avgScore}/100`, [{ text: 'OK', onPress: () => router.back() }]);
  };

  const last = reps[reps.length - 1];
  const valid = reps.filter((r) => r.valid).length;
  const avg = reps.length ? Math.round(reps.reduce((a, r) => a + r.score, 0) / reps.length) : 0;
  const cameraBlocked = mode === 'camera' && !nativeOk;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.h2}>{cfg.name}</Text>
      <View style={{ height: 320, borderRadius: 14, overflow: 'hidden', backgroundColor: C.card, marginBottom: 12 }}>
        {!perm?.granted ? (
          <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={requestPerm}>
            <Text style={s.txt}>Kamera erlauben</Text>
          </Pressable>
        ) : mode === 'camera' && nativeOk ? (
          <NativePoseCamera style={{ flex: 1 }} active facing={facing} onFrame={running ? onFrame : noop} onError={setCamError} />
        ) : (
          <CameraView style={{ flex: 1 }} facing={facing} />
        )}
      </View>
      {camError && <Text style={[s.hint, { color: C.bad }]}>Kamera/Modell-Fehler: {camError}</Text>}
      {mode === 'camera' && nativeOk && !running && (
        <Pressable style={[s.ghost, { marginBottom: 8 }]} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
          <Text style={s.txt}>Kamera wechseln ({facing === 'back' ? 'hinten' : 'vorne'})</Text></Pressable>)}
      <Text style={s.hint}>{cfg.hint}</Text>

      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
        {(['camera', 'demo'] as Mode[]).map((m) => (
          <Pressable key={m} disabled={running} onPress={() => setMode(m)}
            style={[s.ghost, { flex: 1 }, mode === m && { borderColor: C.acc, borderWidth: 1 }]}>
            <Text style={s.txt}>{m === 'camera' ? 'Kamera' : 'Demo'}</Text>
          </Pressable>))}
      </View>
      {cameraBlocked && <Text style={[s.hint, { color: C.bad }]}>
        Kamera-Pose-Erkennung läuft nur im Development-Build, nicht in Expo Go. Hier: Demo oder Sensor-Add-on.</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={s.txt}>Sensor-Add-on (iPhone am Körper)</Text>
        <Switch value={sensorOn} onValueChange={setSensorOn} disabled={running} trackColor={{ true: C.acc }} />
      </View>

      <View style={[s.card, { alignItems: 'center' }]}>
        <Text style={{ color: C.acc, fontSize: 72, fontWeight: '800' }}>{valid}</Text>
        <Text style={s.mut}>gültige Wiederholungen · {reps.length - valid} No-Reps</Text>
        {running && !tracking && <Text style={{ color: C.bad, marginTop: 6 }}>Körper nicht im Bild – ganzer Körper seitlich zeigen</Text>}
        {last && (
          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <Text style={{ color: scoreColor(last.score), fontSize: 28, fontWeight: '700' }}>{last.valid ? last.score : 'NO REP'}</Text>
            <Text style={s.mut}>{last.issues.length ? last.issues.join(' · ') : 'Saubere Wiederholung'}</Text>
          </View>)}
        {running && signal != null && <Text style={[s.mut, { marginTop: 8 }]}>Messwert {Math.round(signal)}° (unten &lt; {cfg.downBelow}°, oben &gt; {cfg.upAbove}°)</Text>}
        {reps.length > 0 && <Text style={[s.mut, { marginTop: 8 }]}>Ø Güte {avg}/100</Text>}
        {sensorOn && <Text style={[s.mut, { marginTop: 8 }]}>Sensor zählt: {sensorReps.length}
          {sensorReps.length ? ` · Ø Intensität ${Math.round(sensorReps.reduce((a, r) => a + r.score, 0) / sensorReps.length)}/100` : ''}</Text>}
      </View>

      {!running
        ? <Pressable style={s.btn} onPress={begin} disabled={cameraBlocked && !sensorOn}>
            <Text style={s.btnTxt}>{cameraBlocked && !sensorOn ? 'Modus wählen' : 'START'}</Text></Pressable>
        : <Pressable style={[s.btn, { backgroundColor: C.bad }]} onPress={stop}><Text style={s.btnTxt}>STOP</Text></Pressable>}
      {!running && (reps.length > 0 || sensorReps.length > 0) &&
        <Pressable style={[s.ghost, { marginTop: 10 }]} onPress={finish}><Text style={s.txt}>Speichern & beenden</Text></Pressable>}
      {!running && <Pressable style={[s.ghost, { marginTop: 10 }]} onPress={() => router.back()}><Text style={s.mut}>Schließen</Text></Pressable>}
    </ScrollView>
  );
}
