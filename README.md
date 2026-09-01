# Boocord Client

Ein eigenständiger Windows-Launcher für einen Minecraft-Client auf Basis von Fabric.

> **NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH
> MOJANG OR MICROSOFT.**

## Was das Projekt macht

- meldet Nutzer per Microsoft-Login direkt im Launcher an
- installiert Fabric für Minecraft `1.21.11`
- legt eine getrennte Runtime- und Instanzstruktur im eigenen App-Datenordner an
- lädt Mods über die Modrinth-API inklusive Pflicht-Abhängigkeiten herunter
- startet Minecraft direkt über `minecraft-launcher-core`
- paketiert den Launcher als Windows-`.exe` mit `electron-builder`

## Voraussetzungen

- Windows
- Java 21 oder neuer
- Microsoft-Konto mit Minecraft Java Edition
- Node.js 22.12 oder neuer

## Entwicklung

```powershell
npm install
npm run check:translations
npm run smoke
npm run start
```

Optionales getrenntes Profil:

```powershell
npm run start -- --profile=alt
```

## Installer bauen

Für das vollständige Setup mit Boocord-Oberfläche:

```powershell
npm run dist:installer
```

Das veröffentlichbare Ergebnis ist `dist/Boocord Client Installer <version>.exe`.
`dist/SHA256SUMS.txt` enthält die dazugehörigen SHA-256-Prüfsummen. Mit
`npm run dist` lässt sich nur der innere NSIS-Installer bauen.

Der Windows-Installer nutzt ein reduziertes Boocord-Branding mit eigenem
Header/Sidebar und installiert standardmäßig direkt für den aktuellen Benutzer.

## Mehrere Installationen und Profile

- jede Installation bekommt automatisch einen eigenen getrennten App-Datenbereich
- zusätzliche Profile aus derselben Installation sind über `--profile=<name>` möglich
- jedes Profil hat eigene Settings, Runtime und Instanzdaten
- Accounts werden installationsweit geteilt und stehen in allen Profilen zur Verfügung

## Client anpassen

- Basis-Mods in `client.manifest.json`
- vordefinierte Konfigurationen in `overrides/`
- Branding und UI in `src/renderer/`

## Datenschutz und externe Dienste

Informationen zur lokalen Kontospeicherung und zu kontaktierten Diensten stehen
in [PRIVACY.md](PRIVACY.md). Sitzungsdateien, Profile, Logs und Build-Ausgaben
gehören nicht in Commits oder Fehlerberichte.

## Unabhängiges Projekt

Boocord Client ist ein unabhängiges Community-Projekt und wird nicht von
Microsoft, Mojang, Minecraft, Fabric, Discord oder Modrinth angeboten,
unterstützt oder geprüft. Namen und Marken gehören ihren jeweiligen Inhabern.
Mods werden zur Laufzeit aus den angegebenen Drittquellen geladen und unterliegen
den Lizenz- und Nutzungsbedingungen der jeweiligen Projekte.

## Sicherheitsstatus

Der Quellcode wird automatisiert auf Syntaxfehler, Secrets und bekannte
Schwachstellen geprüft. Im Abhängigkeitsbaum von
`minecraft-launcher-core@3.18.2` bestehen derzeit bekannte Audit-Meldungen; der
aktuelle Stand ist in [.github/OPEN_SOURCE_CHECKLIST.md](.github/OPEN_SOURCE_CHECKLIST.md)
dokumentiert. Veröffentlichte Windows-Dateien sind nur dann als signiert zu
betrachten, wenn GitHub dies in den jeweiligen Release-Hinweisen ausdrücklich
bestätigt.
