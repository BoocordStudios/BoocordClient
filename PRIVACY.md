# Datenschutzinformationen zum Boocord Client

Diese Hinweise beschreiben den im Repository enthaltenen Desktop-Client. Für
Webseiten, Community-Angebote und die Dienste Dritter gelten deren eigene
Datenschutzinformationen.

## Lokal gespeicherte Daten

Der Client speichert Profileinstellungen, Installationsstatus, Logs und
Minecraft-Laufzeitdaten lokal. Microsoft-/Minecraft-Konten werden mit
Kontometadaten und einem Refresh-Token in einer lokalen JSON-Sitzungsdatei unter
`%APPDATA%\Boocord Client\installations\<Installations-ID>` gespeichert. Diese
Datei ist vertraulich und darf nicht geteilt oder in ein Repository übernommen
werden.

Der geprüfte Client-Code enthält keine eigene Telemetrie- oder
Analytics-Funktion. Diagnoseinformationen werden lokal protokolliert, können
aber Benutzernamen, Dateipfade, Serverinformationen oder Startparameter
enthalten.

## Kontaktierte Dienste

Abhängig von der verwendeten Funktion verbindet sich der Client direkt mit:

- Microsoft-, Xbox- und Minecraft-Diensten für Anmeldung und Spielberechtigung,
- Mojang-/Minecraft-, Fabric- und Adoptium-Endpunkten für Spiel-, Loader- und
  Java-Dateien,
- Modrinth für Projektmetadaten und Downloads,
- Discord über die lokal installierte Discord-Anwendung für Rich Presence,
- `boocord.com` für den angezeigten Serverstatus,
- Google Fonts beim Laden der Oberfläche und `mineskin.eu` für bestimmte
  Spielerkopf-Grafiken.

Dabei erhalten die jeweiligen Betreiber technisch notwendige Verbindungsdaten
wie die IP-Adresse. An Microsoft/Xbox/Minecraft werden außerdem die für die
Anmeldung erforderlichen Konto- und Token-Daten übertragen. Der überprüfte
Client-Code sendet Microsoft-Refresh-Tokens nicht an einen eigenen
Boocord-Server.

## Kontrolle und Löschung

Konten können über die Abmeldefunktion aus der lokalen Sitzung entfernt werden.
Eine Deinstallation entfernt nicht zwingend Profile, Logs, Laufzeiten oder
Sitzungsdateien. Für eine vollständige lokale Löschung muss der zugehörige
Installationsordner unter `%APPDATA%\Boocord Client\installations` sowie ein
eventuell selbst gewählter Spieldatenordner gelöscht werden. Vorher sollte der
Client vollständig beendet sein.

Veröffentliche bei Support- oder Sicherheitsmeldungen niemals Refresh-Tokens,
vollständige Sitzungsdateien oder ungefilterte Logs. Sicherheitsprobleme werden
über den vertraulichen Meldeweg in [.github/SECURITY.md](.github/SECURITY.md)
gemeldet.
