# Roxref – Hyrox Rep-Counter & Form-Coach (iOS, Expo)

Zählt Wiederholungen und bewertet die Ausführung jeder einzelnen nach dem Hyrox-Standard
(No-Rep bei zu wenig Tiefe etc.). Übungen: **Wall Balls, Sandbag Lunges, Burpee Broad Jumps**.

## Architektur
- `src/engine/` – reine TypeScript-Logik: Gelenkwinkel, Rep-Zustandsautomat mit Hysterese, Bewertung
  (Tiefe, Streckung, Oberkörper, Tempo-Konsistenz, Ermüdung). Getestet: `npm test`.
- `src/pose/PoseSource.ts` – Quelle der Körperpunkte. **Kamera-Pose ist noch nicht angeschlossen**
  (`createNativePoseSource()` gibt `null`); der Demo-Modus spielt eine synthetische Bewegung ab.
- `src/sensors/motionCounter.ts` – Sensor-Add-on (Beschleunigung): zählt Reps, bewertet Tempo/Intensität.
- `src/app/` – Expo Router (Tabs: Training, Verlauf; Modal: Session).
- `web/` – alte Web-Version (Race-Plan), nur noch Archiv.

## Starten
```bash
npm install
npx expo start      # Expo Go: Oberfläche, Demo-Modus, Sensor-Add-on, Kamera-Vorschau
npm test            # Engine-Tests
```

## Nächster Schritt: echte Pose-Erkennung (Development-Build)
Kamera-Frames → Pose-Modell → `PoseFrame` braucht nativen Code und läuft **nicht in Expo Go**:
1. Vision-Camera-Frame-Processor + Pose-Modell (MediaPipe oder Apple Vision) einbinden.
2. Landmarks auf `JOINTS` (`engine/types.ts`) mappen, in `createNativePoseSource()` zurückgeben.
3. `eas build --profile development -p ios`, auf dem iPhone installieren, `npx expo start --dev-client`.

## TestFlight
`eas build -p ios --profile production` → `eas submit -p ios --latest`
(Apple-Developer-Account nötig; `ios.bundleIdentifier` in `app.json` anpassen).
