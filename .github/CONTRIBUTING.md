# Zum Boocord Client beitragen

Danke für dein Interesse. Kleine, klar abgegrenzte Änderungen lassen sich am
einfachsten prüfen und sicher veröffentlichen.

## Vor dem Start

1. Suche in bestehenden Issues und Pull Requests nach ähnlichen Themen.
2. Eröffne für größere oder inkompatible Änderungen zuerst einen Vorschlag.
3. Melde Sicherheitsprobleme niemals öffentlich, sondern wie in
   [SECURITY.md](SECURITY.md) beschrieben.

## Entwicklungsumgebung

Benötigt werden Windows, Node.js 22.12 oder neuer, npm und für vollständige
Launcher-Tests Java 21 oder neuer.

```powershell
npm ci
npm run check:translations
npm run smoke
npm run start
```

Der Microsoft-Login und ein Minecraft-Konto sind für den Smoke-Test nicht
erforderlich. Verwende beim manuellen Testen ausschließlich eigene Testkonten.

## Änderungen einreichen

- Erstelle einen thematisch fokussierten Branch.
- Ändere den Lockfile zusammen mit `package.json`, wenn sich Abhängigkeiten
  ändern.
- Nimm keine generierten Installer, Laufzeitdaten, Kontositzungen oder Logs in
  den Commit auf.
- Ergänze Tests oder nachvollziehbare manuelle Prüfschritte.
- Beschreibe bei Änderungen an Downloads, Authentifizierung, IPC oder
  Dateisystemzugriff die Sicherheitsauswirkungen.
- Stelle sicher, dass du neu beigesteuerte Inhalte unter der MIT-Lizenz
  veröffentlichen darfst und kennzeichne Inhalte Dritter.

Vor einem Pull Request sollten mindestens folgende Befehle erfolgreich sein:

```powershell
npm ci
npm run check:translations
npm run smoke
npm audit --package-lock-only --audit-level=high
```

Ein bestehender Audit-Befund darf nicht durch Ausnahmen oder das Abschalten der
Prüfung verborgen werden. Dokumentiere unvermeidbare Restbefunde mit Ursache,
Auswirkung und geplantem Fix.

## Review

Ein Pull Request kann Änderungen benötigen, bevor er zusammengeführt wird.
Maintainer dürfen einen Beitrag ablehnen, wenn er außerhalb des Projektumfangs
liegt, nicht ausreichend prüfbar ist oder ein unvertretbares Sicherheits- oder
Wartungsrisiko erzeugt.
