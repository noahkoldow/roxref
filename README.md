# Roxref – Hyrox Rep-Counter & Form-Coach (iOS, Expo)

Zählt Wiederholungen und bewertet die Ausführung jeder einzelnen nach dem Hyrox-Standard
(No-Rep bei zu wenig Tiefe etc.). Übungen: **Wall Balls, Sandbag Lunges, Burpee Broad Jumps**.

## Architektur
- `src/engine/` – reine TypeScript-Logik: Gelenkwinkel, Rep-Zustandsautomat mit Hysterese, Bewertung
  (Tiefe, Streckung, Oberkörper, Tempo-Konsistenz, Ermüdung).
- `src/pose/` – Pose-Quellen: `NativePoseCamera` (MediaPipe Pose Landmarker via `expo-mediapipe-pose`,
  nur im Development-Build) und Demo-Quelle; `mapLandmarks` rechnet 33 Landmarks inkl. Seitenverhältnis um.
- `src/sensors/motionCounter.ts` – Sensor-Add-on (Beschleunigung): zählt Reps, bewertet Tempo/Intensität.
- `src/app/` – Expo Router (Tabs: Training, Verlauf; Vollbild-Modal: Session).

## Zwei Modi
| | Expo Go | Development-Build (TestFlight später genauso) |
|---|---|---|
| Oberfläche, Verlauf | ✔ | ✔ |
| Demo-Modus, Sensor-Add-on | ✔ | ✔ |
| **Kamera-Pose (echte Erkennung)** | ✘ (natives Modul) | ✔ |

## Schnellstart: in Expo Go öffnen
1. iPhone: **Expo Go** aus dem App Store installieren.
2. Auf dem Rechner (Node.js 20+):
```bash
git clone https://github.com/noahkoldow/roxref.git && cd roxref
git checkout claude/stoic-hypatia-ijh58v
npm install
npm start                # = expo start --go, zeigt einen QR-Code
```
3. QR-Code mit der iPhone-Kamera scannen → öffnet Roxref in Expo Go.
Anderes WLAN / Firewall: `npm run start:tunnel`.
In Expo Go funktionieren Oberfläche, Demo-Modus und Sensor-Add-on (nicht die Kamera-Pose, siehe unten).

## Tests
```bash
npm test            # Engine + Landmark-Mapping
npm run typecheck
```

## Kamera-Modus ausprobieren (Development-Build)
Voraussetzung: Apple-Developer-Account, Expo-Account.
```bash
npm i -g eas-cli && eas login
eas device:create                          # iPhone registrieren (einmalig)
eas build --profile development -p ios     # ~15 Min in der Cloud, installiert per QR/Link
npm run start:dev-client                   # App auf dem iPhone öffnen, mit dem Dev-Server verbinden
```
(Ohne iPhone-Registrierung: `eas build --profile development-simulator -p ios` für den Simulator – dort gibt es aber keine Kamera.)

Aufstellung: iPhone ca. 2–3 m entfernt auf ~Hüfthöhe, **seitlich** zum Körper, ganzer Körper im Bild.
Im Session-Screen wird der aktuelle Messwert (Winkel) angezeigt – damit lassen sich die Schwellen in
`src/engine/exercises.ts` (`downBelow`, `upAbove`, Tiefen-Grenzen) am echten Körper kalibrieren.

## TestFlight
```bash
eas build -p ios --profile production
eas submit -p ios --latest
```
`ios.bundleIdentifier` in `app.json` (`com.noahkoldow.roxref`) vorher anpassen.
