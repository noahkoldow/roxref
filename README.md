# Roxref – Hyrox Race Companion (iOS, Expo)

Race-Timer mit 16 Splits (8× Lauf + 8 Stationen), Pacing-Rechner, Divisions-Standards und Verlauf.
Die frühere Web-/PWA-Version liegt unverändert in `web/`.

## Entwickeln mit Expo Go
```bash
npm install
npx expo start
```
QR-Code mit der iPhone-Kamera scannen → öffnet sich in **Expo Go** (iPhone und Rechner im selben WLAN;
sonst `npx expo start --tunnel`). Nur Expo-Go-kompatible Module verwenden (aktuell: AsyncStorage, Haptics, KeepAwake).

## Später: TestFlight
Voraussetzung: Apple Developer Account (99 $/Jahr) und ein Expo-Account.
```bash
npm i -g eas-cli
eas login
eas build:configure          # einmalig, verknüpft das Projekt (projectId)
eas build -p ios --profile production
eas submit -p ios --latest   # lädt zu App Store Connect hoch → TestFlight
```
Vorher in `app.json` die `ios.bundleIdentifier` (`com.noahkoldow.roxref`) auf die eigene ID anpassen.
