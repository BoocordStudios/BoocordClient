# Checkliste für die öffentliche Freigabe

Diese Datei dokumentiert den geprüften Freigabestatus, ist aber keine Garantie.
Offene Punkte zum Signieren und zu Laufzeitabhängigkeiten blockieren einen als
stabil beworbenen Binär-Release; der Quellcode darf mit transparentem Hinweis
darauf öffentlich entwickelt werden.

## Lokale Vorbereitung

- [x] Build-, Abhängigkeits-, Test-, Laufzeit- und Profilverzeichnisse sind in
      `.gitignore` ausgeschlossen.
- [x] Bekannte Sitzungsdateien, Logs, Umgebungsdateien und Signaturschlüssel sind
      in `.gitignore` ausgeschlossen.
- [x] MIT-Lizenz, Beitragsregeln, Verhaltenskodex, Support- und
      Sicherheitsrichtlinie sind vorhanden.
- [x] CI-, CodeQL-, Dependency-Review- und Secret-Scan-Workflows verwenden
      minimale Berechtigungen und auf Commit-SHAs fixierte Actions.
- [ ] `npm audit --package-lock-only --omit=dev` meldet keine ungeklärten hohen
      oder kritischen Laufzeitrisiken. Stand 01.09.2026: **nicht erfüllt**
      (zwei hohe und zwei kritische Meldungen im Pfad über
      `minecraft-launcher-core`).
- [ ] `npm audit --package-lock-only --audit-level=high` meldet auch für die
      paketierte Electron-Laufzeit und die Build-Werkzeuge keine ungeklärten
      hohen oder kritischen Risiken. Stand 01.09.2026: **nicht erfüllt**.
- [x] Nicht verwendete Duplikate im Repository-Root (`main.js`, `preload.js`)
      wurden geprüft und aus dem Veröffentlichungsumfang entfernt. Produktive
      Einstiegspunkte liegen ausschließlich unter `src/`.
- [x] Alle für den ersten Commit vorgemerkten Dateien wurden einzeln geprüft;
      insbesondere keine Inhalte aus `tmp*`, `game-data`, `dist*`,
      `node_modules` oder App-Profilen.
- [ ] Ein Secret-Scan des vollständigen zu veröffentlichenden Git-Verlaufs ist
      ohne ungeklärte Treffer abgeschlossen. Gefundene Secrets wurden widerrufen,
      nicht nur aus Dateien gelöscht.
- [ ] Rechte an Quellcode, Logo, Installer-Grafiken, Konfigurationen und sonstigen
      Assets sind geklärt. Inhalte Dritter sind mit Quelle und Lizenz erfasst.
- [x] README, Projektbeschreibung und Markenhinweise erklären die Beziehung zu
      Minecraft, Microsoft, Fabric, Discord und Modrinth korrekt und vermeiden
      den Eindruck einer offiziellen Zugehörigkeit.

## GitHub-Einstellungen

- [x] Private Vulnerability Reporting ist aktiviert.
- [x] Secret Scanning und Push Protection sind aktiviert.
- [x] Dependency Graph, Dependabot Alerts und Security Updates sind aktiviert.
- [x] Das Standard-Token für Actions besitzt nur Leserechte; Schreibrechte werden
      ausschließlich pro Job vergeben.
- [ ] Für den Standard-Branch gilt ein Ruleset: Pull Request erforderlich,
      mindestens ein unabhängiges Review, veraltete Freigaben verwerfen,
      Diskussionen auflösen, erforderliche Checks erzwingen sowie Force-Pushes
      und Löschung sperren.
- [ ] Als erforderliche Checks sind mindestens CI, CodeQL, Dependency Review und
      Secret Scan ausgewählt, nachdem sie einmal erfolgreich gelaufen sind.
- [x] CODEOWNERS benennt `@BoocordStudios` für das Repository und die
      sicherheitskritischen Bereiche.
- [ ] Nicht benötigte Actions, Apps, Deploy Keys, Webhooks und Repository-Secrets
      wurden entfernt; verbleibende Zugriffe folgen dem Least-Privilege-Prinzip.

## Release und Betrieb

- [ ] Windows-Builds werden reproduzierbar aus einem geschützten Tag erstellt.
- [ ] Installer und Updates sind mit einem geschützten Code-Signing-Zertifikat
      signiert; dessen privater Schlüssel liegt niemals im Repository.
- [x] Der vollständige Installer-Build erzeugt SHA-256-Prüfsummen.
- [x] Für den aktuellen 1.0.2-Build wurde eine validierte CycloneDX-1.6-SBOM
      mit reproduzierbarer Ausgabe erzeugt und in die Prüfsummendatei
      aufgenommen.
- [ ] Update- und Downloadquellen verwenden HTTPS, prüfen erwartete Herkunft und
      validieren Hashes beziehungsweise Signaturen vor der Ausführung.
- [x] Datenschutzinformationen erklären Microsoft-Login, Discord Rich Presence,
      externe APIs, lokal gespeicherte Kontodaten und Löschmöglichkeiten.
- [x] `@BoocordStudios` ist als Maintainer benannt; Sicherheitsmeldungen können
      über GitHubs Private Vulnerability Reporting vertraulich eingereicht werden.

## Direkt vor der Veröffentlichung

```powershell
git status --short
git check-ignore -v node_modules tmp-launch.log game-data dist
npm ci
npm run check:translations
npm run smoke
npm audit --package-lock-only --audit-level=high
```

Nach dem Push sämtliche GitHub-Checks und Einstellungen verifizieren. Erst wenn
die offenen Release-Punkte geklärt sind, einen Binär-Release als stabil markieren.
