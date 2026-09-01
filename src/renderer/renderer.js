document.body.style.opacity = "0";

const languagePromptVersion = 1;
const supportedLanguages = new Set(["de", "en"]);
let currentLanguage = "de";
let translationObserver = null;
let isApplyingTranslations = false;

const translationText = {
  de: {
    "Settings": "Einstellungen",
    "Music": "Musik",
    "Launcher Bereiche": "Launcher-Bereiche",
    "Account Avatar": "Account-Avatar",
    "Modding Modus": "Modding-Modus",
    "Mod Browser": "Mod-Browser",
    "Resource Pack Browser": "Resource-Pack-Browser",
    "Shader Pack Browser": "Shader-Pack-Browser",
    "Boocord Links": "Boocord-Links",
    "Minecraft Version": "Minecraft-Version",
    "Launcher Status": "Launcher-Status",
    "Microsoft Login und Multi-Account": "Microsoft-Login und Multi-Account",
    "Fabric Runtime für den Client": "Fabric-Runtime für den Client",
    "Launcher Sprache": "Launcher-Sprache",
    "RAM Minimum": "Minimaler RAM",
    "RAM Maximum": "Maximaler RAM",
    "Launcher Hintergrundbild": "Launcher-Hintergrundbild",
    "Launcher Hintergrund": "Launcher-Hintergrund",
    "Mod Info": "Mod-Info",
    "Modrinth Details": "Modrinth-Details",
    "Ändert die Sprache des Launchers sofort.": "Ändert die Sprache des Launchers sofort.",
    "Install, Update und Start": "Installation, Update und Start"
  },
  en: {
    "Start": "Home",
    "Settings": "Settings",
    "Nicht angemeldet": "Not signed in",
    "Boocord Launcher für Login, Modding, Updates und direkten Minecraft-Start.": "Boocord launcher for login, modding, updates and direct Minecraft launch.",
    "Minimieren": "Minimize",
    "Maximieren": "Maximize",
    "Schließen": "Close",
    "Launcher Bereiche": "Launcher sections",
    "Account Avatar": "Account avatar",
    "Kein Account": "No account",
    "Navigation öffnen": "Open navigation",
    "Boocord direkt starten": "Start Boocord directly",
    "Logs kopieren": "Copy logs",
    "Logs leeren": "Clear logs",
    "Modding Modus": "Modding mode",
    "Inhaltstyp": "Content type",
    "Auswahltyp": "Selection type",
    "Boocord Links": "Boocord links",
    "Mod-Details schließen": "Close mod details",
    "Importauswahl schließen": "Close import selection",
    "Launcher auswählen": "Select launcher",
    "Fehlermeldung schließen": "Close error message",
    "Account-Dialog schließen": "Close account dialog",
    "Löschdialog schließen": "Close delete dialog",
    "z. B. PvP, Vanilla, Replay": "e.g. PvP, Vanilla, Replay",
    "z. B. Sodium, ReplayMod, Mod Menu": "e.g. Sodium, ReplayMod, Mod Menu",
    "Mods im Paket durchsuchen": "Search mods in package",
    "Noch kein Account gespeichert": "No account saved yet",
    "Account hinzufügen": "Add account",
    "Account entfernen": "Remove account",
    "Die einfachste Art, Minecraft zu genießen. Mit einem Client, der zu dir passt. Ohne Kompromisse.": "The easiest way to enjoy Minecraft. With a client that fits you. No compromises.",
    "Spiel starten": "Start game",
    "Spiel stoppen": "Stop game",
    "Installieren / Updaten": "Install / Update",
    "Standard": "Default",
    "Aktuelles Profil": "Current profile",
    "Minecraft Version": "Minecraft version",
    "Verbindung herstellen": "Connect",
    "Lädt...": "Loading...",
    "Spieler online": "Players online",
    "Prüfe...": "Checking...",
    "Neues Profil": "New profile",
    "Profil anlegen": "Create profile",
    "Instanz importieren": "Import instance",
    "Profile werden geladen...": "Loading profiles...",
    "Launcher Status": "Launcher status",
    "Bereit.": "Ready.",
    "Noch keine Aktion aktiv.": "No action active.",
    "Warten auf Aktion": "Waiting for action",
    "Launcher bereit.": "Launcher ready.",
    "Konto": "Account",
    "Microsoft Login und Multi-Account": "Microsoft login and multi-account",
    "Nicht angemeldet. Melde dich an, um Minecraft mit deinem Microsoft-Profil zu starten.": "Not signed in. Sign in to start Minecraft with your Microsoft profile.",
    "Login direkt im Launcher": "Sign in directly in the launcher",
    "Aktiven Account sofort wechseln": "Switch the active account instantly",
    "Avatar direkt in der Navbar": "Avatar directly in the navigation bar",
    "Install, Update und Start": "Install, update and launch",
    "Installation, Update und Start": "Install, update and launch",
    "Noch keine Runtime installiert.": "No runtime installed yet.",
    "Fabric Runtime für den Client": "Fabric runtime for the client",
    "Wiederverwendung bestehender Installationen": "Reuse existing installations",
    "Verwaltete Java-Runtime pro Minecraft-Version": "Managed Java runtime per Minecraft version",
    "Java neu installieren": "Reinstall Java",
    "Dateien": "Files",
    "Datenpfade und Schnellzugriff": "Data paths and quick access",
    "Profil: Standard": "Profile: Default",
    "Weitere Profile: Launcher mit": "More profiles: start the launcher with",
    "starten.": "to use them.",
    "Eigene Runtime- und Instanzstruktur": "Dedicated runtime and instance structure",
    "Saves, Mods und Runtime getrennt": "Saves, mods and runtime kept separate",
    "Speicherort jederzeit änderbar": "Storage location can be changed anytime",
    "Ordner ändern": "Change folder",
    "Ordner öffnen": "Open folder",
    "Modding Modus": "Modding mode",
    "Wähle deinen Bereich": "Choose your area",
    "Mods suchen und filtern": "Search and filter mods",
    "Aktives Paket": "Active package",
    "Ausgewählte Mods verwalten": "Manage selected mods",
    "Modus auswählen": "Select mode",
    "Wähle oben aus, ob du neue Mods suchen oder dein aktuelles Paket verwalten willst.": "Choose above whether you want to search for new mods or manage your current package.",
    "Mod suchen": "Search for mods",
    "Suchen": "Search",
    "Kategorie": "Category",
    "Sortierung": "Sort",
    "Beliebtheit": "Popularity",
    "Zuletzt aktualisiert": "Last updated",
    "Neu veröffentlicht": "Newly published",
    "Relevanz": "Relevance",
    "Typ": "Type",
    "Noch keine Suche": "No search yet",
    "Suchergebnisse": "Search results",
    "Seite 1": "Page 1",
    "Noch keine Suche gestartet.": "No search started yet.",
    "Aktive Auswahl": "Active selection",
    "Suche im Paket": "Search package",
    "Ausgewählte Mods": "Selected mods",
    "Mods importieren": "Import mods",
    "Dateien auswählen oder direkt hier hineinziehen.": "Choose files or drag them here.",
    "Dateien wählen": "Choose files",
    "Noch keine Mods ausgewählt.": "No mods selected yet.",
    "Sprache": "Language",
    "Launcher-Sprache": "Launcher language",
    "Launcher Sprache": "Launcher language",
    "Ändert die Sprache des Launchers sofort.": "Changes the launcher language immediately.",
    "Versionen und Runtime": "Versions and runtime",
    "Java benötigt": "Java required",
    "Java erkannt": "Java detected",
    "RAM Minimum": "Minimum RAM",
    "RAM Maximum": "Maximum RAM",
    "Garbage Collector": "Garbage collector",
    "Automatisch (empfohlen)": "Automatic (recommended)",
    "G1 (kompatibel)": "G1 (compatible)",
    "ZGC (niedrige Pausen)": "ZGC (low pauses)",
    "Steuert die Java-GC-Strategie für Minecraft beim nächsten Start.": "Controls the Java GC strategy for Minecraft on the next launch.",
    "Beim Spielstart automatisch zu Logs wechseln": "Switch to logs automatically when launching the game",
    "Springt beim Start über den Launcher direkt in den Logs-Tab.": "Jumps directly to the logs tab when starting from the launcher.",
    "Launcher beim Spielstart minimieren": "Minimize launcher when launching the game",
    "Der Launcher wird nach dem erfolgreichen Start im Hintergrund verstaut.": "The launcher is minimized after a successful game launch.",
    "Launcher Hintergrundbild": "Launcher background image",
    "Kein Hintergrundbild ausgewählt.": "No background image selected.",
    "Kein Bild aktiv": "No image active",
    "Bild auswählen": "Choose image",
    "Bild entfernen": "Remove image",
    "Boocord Studios. Alle Rechte vorbehalten.": "Boocord Studios. All rights reserved.",
    "Mod Info": "Mod info",
    "Modrinth Details": "Modrinth details",
    "Modrinth öffnen": "Open Modrinth",
    "Wähle eine Mod aus, um Details zu sehen.": "Select a mod to view details.",
    "Instanzen importieren": "Import instances",
    "Modrinth und CurseForge": "Modrinth and CurseForge",
    "Launcher werden gesucht...": "Searching launchers...",
    "Neu scannen": "Scan again",
    "Ordner manuell wählen": "Choose folder manually",
    "Start fehlgeschlagen": "Launch failed",
    "Der Startprozess wurde beendet und als gestoppt markiert.": "The launch process ended and was marked as stopped.",
    "Der Startprozess wurde beendet und als gestoppt markiert. Prüfe Version, Loader und Mod-Auswahl.": "The launch process ended and was marked as stopped. Check the version, loader, and mod selection.",
    "Der Startvorgang konnte nicht abgeschlossen werden.": "The launch could not be completed.",
    "Verstanden": "Understood",
    "Accountverwaltung": "Account management",
    "Account entfernen?": "Remove account?",
    "Dieser Schritt entfernt den aktuell ausgewählten Account aus dem Launcher.": "This removes the currently selected account from the launcher.",
    "Willst du diesen Account wirklich entfernen?": "Do you really want to remove this account?",
    "Betroffener Account": "Affected account",
    "Abbrechen": "Cancel",
    "Profilverwaltung": "Profile management",
    "Profil löschen?": "Delete profile?",
    "Dieser Schritt entfernt die komplette lokale Instanz dieses Profils.": "This removes the complete local instance for this profile.",
    "Der komplette Profilordner wird entfernt.": "The complete profile folder will be removed.",
    "Betroffener Ordner": "Affected folder",
    "Profil löschen": "Delete profile",
    "Alle Kategorien": "All categories",
    "Wird geladen...": "Loading...",
    "Keine Optionen": "No options",
    "Keine Optionen verfügbar": "No options available",
    "Unbekannt": "Unknown",
    "Nicht installiert": "Not installed",
    "Direkt auf boocord.com": "Directly to boocord.com",
    "Verbinde direkt mit boocord.com": "Connecting directly to boocord.com",
    "Minecraft wird beendet": "Minecraft is stopping",
    "Boocord startet...": "Boocord is starting...",
    "Startet...": "Starting...",
    "Wird beendet...": "Stopping...",
    "Startverhalten gespeichert.": "Launch behavior saved.",
    "Die Logs-Ansicht beim Spielstart wurde aktualisiert.": "The logs view on game launch was updated.",
    "Das Minimieren des Launchers beim Spielstart wurde aktualisiert.": "Launcher minimization on game launch was updated.",
    "Sprache gespeichert.": "Language saved.",
    "Die Launcher-Sprache wurde aktualisiert.": "The launcher language was updated.",
    "Resource Pack suchen": "Search for resource packs",
    "Shader Pack suchen": "Search for shader packs",
    "Resource Pack Browser": "Resource pack browser",
    "Shader Pack Browser": "Shader pack browser",
    "Ausgewählte Resource Packs": "Selected resource packs",
    "Ausgewählte Shader Packs": "Selected shader packs",
    "Noch keine Resource Packs ausgewählt.": "No resource packs selected yet.",
    "Noch keine Shader Packs ausgewählt.": "No shader packs selected yet.",
    "Keine kompatiblen Resource Packs für diese Suche gefunden.": "No compatible resource packs found for this search.",
    "Keine kompatiblen Shader Packs für diese Suche gefunden.": "No compatible shader packs found for this search.",
    "Kompatible Fabric-Mods werden geladen...": "Compatible Fabric mods are loading...",
    "Kompatible Mods werden geladen...": "Compatible mods are loading...",
    "Details": "Details",
    "Entfernen": "Remove",
    "Hinzufügen": "Add",
    "Ausgewählt": "Selected",
    "Version festhalten": "Lock version",
    "Importiert": "Imported",
    "Importieren": "Import",
    "Nicht unterstützt": "Not supported",
    "Nur Fabric oder Vanilla": "Fabric or Vanilla only",
    "Instanz": "Instance",
    "Instanzen": "Instances",
    "gefunden": "found",
    "Standardpfad wird verwendet": "Default path is used",
    "Keine Instanzen gefunden": "No instances found",
    "Der Launcher wurde erkannt, aber es konnten keine importierbaren Instanzen gelesen werden.": "The launcher was detected, but no importable instances could be read.",
    "Launcher und Profile werden gesucht...": "Searching launchers and profiles...",
    "Launcher und Instanzen werden gesucht...": "Searching launchers and instances...",
    "Keine automatisch gefundenen Instanzen. Du kannst jederzeit manuell einen Ordner auswählen.": "No automatically found instances. You can choose a folder manually anytime.",
    "Aktiver Account": "Active account",
    "Gespeicherter Account": "Saved account",
    "Account wird gewechselt...": "Switching account...",
    "Aktiver Account wird entfernt...": "Removing active account...",
    "Kein Account mehr gespeichert.": "No saved accounts remain.",
    "Microsoft-Login wird vorbereitet...": "Preparing Microsoft login...",
    "Profil wird erstellt": "Creating profile",
    "Profil wird angelegt...": "Creating profile...",
    "Profil konnte nicht angelegt werden.": "Profile could not be created.",
    "Bitte gib einen Namen für das neue Profil ein.": "Enter a name for the new profile.",
    "Ohne Namen kann kein getrenntes Profil angelegt werden.": "A separate profile cannot be created without a name.",
    "Noch keine Profile gefunden.": "No profiles found yet.",
    "Profil umbenennen": "Rename profile",
    "Profil-Icon": "Profile icon",
    "Profil-Icon wählen": "Choose profile icon",
    "Profil-Icon ändern": "Change profile icon",
    "Profil-Icon konnte nicht gesetzt werden.": "Profile icon could not be set.",
    "Aktives Profil kann nicht gelöscht werden": "The active profile cannot be deleted",
    "Standard-Profil kann nicht gelöscht werden": "The default profile cannot be deleted",
    "Nutzen": "Use",
    "Aktiv": "Active",
    "Speicherort": "Storage location",
    "Spielversion": "Game version",
    "Icon wählen": "Choose icon",
    "Icon ändern": "Change icon",
    "Löschen": "Delete",
    "dieses Profil": "this profile",
    "Datenordner konnte nicht gespeichert werden.": "Data folder could not be saved.",
    "Der Datenordner wurde gespeichert.": "The data folder was saved.",
    "Ordner konnte nicht geöffnet werden.": "Folder could not be opened.",
    "Profilordner konnte nicht geöffnet werden.": "Profile folder could not be opened.",
    "Bild wird übernommen...": "Applying image...",
    "Hintergrundbild wird gespeichert...": "Saving background image...",
    "Hintergrundbild gespeichert.": "Background image saved.",
    "Hintergrundbild konnte nicht gespeichert werden.": "Background image could not be saved.",
    "Hintergrundbild wird entfernt...": "Removing background image...",
    "Hintergrundbild konnte nicht entfernt werden.": "Background image could not be removed.",
    "Gespeichertes Bild wird entfernt...": "Removing saved image...",
    "Die Bilddatei wurde als Kopie im Profilordner gespeichert.": "The image file was saved as a copy in the profile folder.",
    "RAM-Einstellungen gespeichert.": "RAM settings saved.",
    "RAM-Einstellungen konnten nicht gespeichert werden.": "RAM settings could not be saved.",
    "Die Speichergrenzen werden beim nächsten Start verwendet.": "The memory limits will be used on the next launch.",
    "Der Garbage Collector wird beim nächsten Start verwendet.": "The garbage collector will be used on the next launch.",
    "Java-Startparameter gespeichert.": "Java launch parameters saved.",
    "GC-Einstellung konnte nicht gespeichert werden.": "GC setting could not be saved.",
    "Fabric-Loader aktualisiert.": "Fabric loader updated.",
    "Fabric-Loader konnte nicht gespeichert werden.": "Fabric loader could not be saved.",
    "Die Runtime-Einstellung wurde gespeichert.": "The runtime setting was saved.",
    "Minecraft-Version konnte nicht gespeichert werden.": "Minecraft version could not be saved.",
    "Java wird automatisch verwaltet.": "Java is managed automatically.",
    "Java-Status wird geladen...": "Loading Java status...",
    "Java wird neu installiert": "Java is being reinstalled",
    "Java wird neu installiert...": "Java is being reinstalled...",
    "Java wurde neu installiert.": "Java was reinstalled.",
    "Verwaltete Java-Runtime wird vorbereitet...": "Preparing managed Java runtime...",
    "Runtime und Startdateien werden geprüft...": "Checking runtime and launch files...",
    "Launcher-Dateien werden installiert...": "Installing launcher files...",
    "Launcher arbeitet": "Launcher is working",
    "Anmeldung": "Signing in",
    "Installation läuft": "Installation is running",
    "Installation abgeschlossen": "Installation complete",
    "Spielstart läuft": "Game launch is running",
    "Boocord Connect läuft": "Boocord Connect is running",
    "Boocord verbunden": "Boocord connected",
    "Minecraft gestartet": "Minecraft started",
    "Java bereit": "Java ready",
    "Runtime bereit": "Runtime ready",
    "Minecraft wird gestartet...": "Starting Minecraft...",
    "Boocord wird gestartet...": "Starting Boocord...",
    "Minecraft wird beendet...": "Stopping Minecraft...",
    "Warte auf das Schließen der laufenden Instanz...": "Waiting for the running instance to close...",
    "Stop angefordert.": "Stop requested.",
    "Stop-Signal gesendet.": "Stop signal sent.",
    "Start fehlgeschlagen.": "Launch failed.",
    "Start wurde abgebrochen.": "Launch was canceled.",
    "Login wurde abgebrochen.": "Login was canceled.",
    "login wurde abgebrochen.": "Login was canceled.",
    "Logs konnten nicht kopiert werden.": "Logs could not be copied.",
    "Logs konnten nicht in die Zwischenablage geschrieben werden.": "Logs could not be written to the clipboard.",
    "Suche fehlgeschlagen.": "Search failed.",
    "Mod-Suche fehlgeschlagen.": "Mod search failed.",
    "Keine Treffer": "No results",
    "Keine Treffer auf dieser Seite": "No results on this page",
    "Noch leer": "Still empty",
    "Bereit": "Ready",
    "Keine ausstehenden Änderungen.": "No pending changes.",
    "Keine Beschreibung verfügbar.": "No description available.",
    "Keine Kurzbeschreibung verfügbar.": "No short description available.",
    "Keine Detailbeschreibung verfügbar.": "No detailed description available.",
    "Beschreibung": "Description",
    "Bild": "Image",
    "Katalog aktuell nicht erreichbar. Gespeicherte Versionen und Runtime-Werte werden weiter verwendet.": "Catalog is currently unavailable. Saved versions and runtime values will continue to be used.",
    "Dateien oder Ordner wählen": "Choose files or folders",
    "JAR- oder ZIP-Dateien auswählen oder direkt hier hineinziehen.": "Choose JAR or ZIP files or drag them here.",
    "ZIP-Dateien oder Ordner auswählen oder direkt hier hineinziehen.": "Choose ZIP files or folders or drag them here.",
    "Keine kompatiblen Fabric-Mods für diese Suche gefunden.": "No compatible Fabric mods found for this search.",
    "Lade Vorschläge...": "Loading suggestions...",
    "Auswählen": "Select",
    "Lokaler Inhalt konnte nicht entfernt werden.": "Local content could not be removed.",
    "Profil konnte nicht gelöscht werden.": "Profile could not be deleted.",
    "Profil konnte nicht umbenannt werden.": "Profile could not be renamed.",
    "Instanz wird importiert...": "Importing instance...",
    "Instanz konnte nicht importiert werden.": "Instance could not be imported.",
    "Launcher-Instanzen konnten nicht geladen werden.": "Launcher instances could not be loaded.",
    "Modrinth-Mods werden geladen...": "Loading Modrinth mods...",
    "Mod-Details konnten nicht geladen werden.": "Mod details could not be loaded.",
    "Details konnten nicht geladen werden.": "Details could not be loaded.",
    "Details werden geladen...": "Loading details...",
    "Details werden aktualisiert...": "Updating details...",
    "Sprache konnte nicht gespeichert werden.": "Language could not be saved.",
    "Startverhalten konnte nicht gespeichert werden.": "Launch behavior could not be saved.",
    "Launcher-Startverhalten konnte nicht gespeichert werden.": "Launcher launch behavior could not be saved.",
    "Angemeldet als": "Signed in as",
    "Aktiver Account": "Active account",
    "Aktiver Account entfernt.": "Active account removed.",
    "Account wurde nicht gefunden.": "Account was not found.",
    "Installation und Update abgeschlossen.": "Installation and update complete.",
    "Installation fehlgeschlagen.": "Installation failed.",
    "Java-Neuinstallation fehlgeschlagen.": "Java reinstallation failed.",
    "Accountwechsel fehlgeschlagen.": "Account switch failed.",
    "Logout fehlgeschlagen.": "Logout failed.",
    "Datenordner aktualisiert.": "Data folder updated.",
    "Hintergrundauswahl abgebrochen.": "Background selection canceled.",
    "Es wurde kein Hintergrundbild übernommen.": "No background image was applied.",
    "Der Launcher verwendet jetzt dein ausgewähltes Bild.": "The launcher now uses your selected image.",
    "Hintergrundbild entfernt.": "Background image removed.",
    "Der Launcher nutzt wieder den Standardhintergrund.": "The launcher uses the default background again.",
    "Das Hintergrundbild wurde übernommen.": "The background image was applied.",
    "Das Hintergrundbild wurde entfernt.": "The background image was removed.",
    "Die Suchergebnisse wurden aktualisiert.": "The search results were updated.",
    "Der Mod wurde zur Auswahl hinzugefügt.": "The mod was added to the selection.",
    "Der Mod wurde aus der Auswahl entfernt.": "The mod was removed from the selection.",
    "Prozess gestoppt": "Process stopped",
    "Der Startprozess wurde beendet.": "The launch process ended.",
    "Stoppen fehlgeschlagen.": "Stopping failed.",
    "Profilwechsel fehlgeschlagen.": "Profile switch failed.",
    "Bitte gib einen Profilnamen ein.": "Enter a profile name.",
    "Für dieses Projekt fehlt eine gültige Projekt-ID.": "This project is missing a valid project ID.",
    "Der Dateiname für den lokalen Eintrag fehlt.": "The file name for the local entry is missing.",
    "Einträge wurden als Modrinth-Projekte übernommen.": "entries were adopted as Modrinth projects.",
    "wurden importiert und erkannt.": "were imported and recognized.",
    "Einträge importiert,": "entries imported,",
    "erkannt.": "recognized.",
    "Einträge wurden lokal übernommen.": "entries were imported locally.",
    "wurden importiert.": "were imported.",
    "Lokal importiert": "Imported locally",
    "Erstellt": "Created",
    "Gelöscht": "Deleted",
    "Umbenannt": "Renamed",
    "Änderung": "change",
    "Änderungen": "changes",
    "Icon gesetzt": "Icon set",
    "Java wird entpackt...": "Extracting Java...",
    "Lade die Minecraft-Basisdateien vorab...": "Preloading Minecraft base files...",
    "Lade Libraries und Assets vorab...": "Preloading libraries and assets...",
    "Prüfe Java-Download...": "Checking Java download...",
    "Microsoft-Sitzung wird aktualisiert...": "Updating Microsoft session...",
    "Microsoft-Login wird gestartet...": "Starting Microsoft login...",
    "Bereite Laufzeitverzeichnis vor...": "Preparing runtime directory...",
    "Löse Mod-Abhängigkeiten auf...": "Resolving mod dependencies...",
    "Kopiere Client-Dateien...": "Copying client files...",
    "Launcher-Dateien sind aktuell.": "Launcher files are up to date.",
    "Vorhandene Installation wird verwendet...": "Using existing installation...",
    "Vorhandene Installation wird ohne Update gestartet...": "Starting existing installation without update...",
    "Vorhandene Installation wird mit aktueller Auswahl synchronisiert...": "Synchronizing existing installation with current selection...",
    "Runtime wird aktualisiert...": "Updating runtime...",
    "Startprozess wurde beendet.": "Launch process ended.",
    "Minecraft wurde beendet.": "Minecraft was closed.",
    "Minecraft konnte kein Stop-Signal erhalten.": "Minecraft could not receive a stop signal.",
    "Minecraft konnte nicht gestartet werden. Prüfe die Log-Ausgabe im Launcher.": "Minecraft could not be started. Check the log output in the launcher.",
    "Minecraft läuft bereits.": "Minecraft is already running.",
    "Minecraft startet oder läuft bereits.": "Minecraft is starting or already running.",
    "Die heruntergeladene Java-Runtime hat eine ungültige Prüfsumme.": "The downloaded Java runtime has an invalid checksum.",
    "Fabric-Installer-Version konnte nicht bestimmt werden.": "Fabric installer version could not be determined.",
    "Keine Mod-ID für die Detailansicht übergeben.": "No mod ID was provided for the detail view.",
    "Accountwechsel": "Account switch",
    "Account entfernen": "Remove account",
    "Profil umbenennen": "Rename profile",
    "Profil wird erstellt": "Creating profile",
    "Profilimport": "Profile import",
    "Profilwechsel": "Profile switch",
    "Profil löschen": "Delete profile",
    "Launcher Hintergrund": "Launcher background",
    "Minecraft wird beendet": "Stopping Minecraft",
    "Mod-Suche": "Mod search",
    "Mod wird hinzugefügt": "Adding mod",
    "Mod wird entfernt": "Removing mod",
    "Mod wurde hinzugefügt.": "Mod was added.",
    "Mod wurde entfernt.": "Mod was removed.",
    "Veröffentlicht": "Published",
    "Aktualisiert": "Updated",
    "Lizenz": "License",
    "Versionen": "Versions",
    "Installierte Version": "Installed version",
    "Alle Kategorien": "All categories",
    "Änderungen seit letzter Installation": "Changes since last installation",
    "Gespeicherten Account aktivieren...": "Activating saved account...",
    "Aktives Hintergrundbild": "Active background image",
    "Installierte Version": "Installed version",
    "Bereits im Paket": "Already in package",
    "Bereits ausgewählt": "Already selected",
    "Kompatibel mit aktueller Auswahl": "Compatible with current selection",
    "Änderungen seit letzter Installation:": "Changes since last installation:",
    "Standardpfad wird verwendet": "Default path is used",
    "Scan fehlgeschlagen": "Scan failed",
    "Es wurden keine Instanzordner an den bekannten Standardpfaden erkannt.": "No instance folders were detected at the known default paths.",
    "wurde nicht gefunden": "was not found",
    "Music": "Music",
    "Ordner": "Folder",
    "Datei": "File",
    "Inhalt": "item",
    "Inhalte": "items",
    "keine Inhalte": "no items",
    "Inhalt hinzugefügt": "item added",
    "Inhalte hinzugefügt": "items added",
    "Inhalt entfernt": "item removed",
    "Inhalte entfernt": "items removed",
    "Keine Antwort": "No response",
    "Lade...": "Loading...",
    "Version wechseln": "Change version",
    "Übersicht": "Overview",
    "Galerie": "Gallery",
    "Mitglied": "Member",
    "Kompatible Versionen": "Compatible versions",
    "Loader unbekannt": "Unknown loader",
    "Doppelklick zum Umbenennen": "Double-click to rename",
    "Enter speichert, Esc bricht ab.": "Press Enter to save or Esc to cancel.",
    "Wähle einen Eintrag aus, um Details zu sehen.": "Select an item to view details.",
    "Mods, Resource Packs und Shader Packs verwalten": "Manage mods, resource packs, and shader packs",
    "Lokal importiert.": "Imported locally.",
    "Weitere Profile: Launcher mit --profile=name starten. Jede Installation ist automatisch getrennt.": "More profiles: start the launcher with --profile=name. Each installation is automatically isolated.",
    "starten. Jede Installation ist automatisch getrennt.": "to use them. Each installation is automatically isolated.",
    "Aktion fehlgeschlagen.": "Action failed.",
    "Ein Profil mit diesem Namen existiert bereits.": "A profile with this name already exists.",
    "Profil wurde nicht gefunden.": "Profile was not found.",
    "Ein anderes Profil verwendet bereits diesen Namen.": "Another profile already uses this name.",
    "Bitte wähle eine Bilddatei für das Profil aus.": "Select an image file for the profile.",
    "Nur PNG, JPG, WEBP, GIF, BMP oder ICO können als Profil-Icon verwendet werden.": "Only PNG, JPG, WEBP, GIF, BMP, or ICO files can be used as a profile icon.",
    "Die ausgewählte Icon-Datei konnte nicht gelesen werden.": "The selected icon file could not be read.",
    "Bitte wähle eine Bilddatei für den Launcher-Hintergrund aus.": "Select an image file for the launcher background.",
    "Das ausgewählte Hintergrundbild wird nicht unterstützt.": "The selected background image is not supported.",
    "Die ausgewählte Hintergrunddatei konnte nicht gelesen werden.": "The selected background file could not be read.",
    "Das aktive Profil kann nicht gelöscht werden.": "The active profile cannot be deleted.",
    "Das Standard-Profil kann nicht gelöscht werden.": "The default profile cannot be deleted.",
    "Im gewählten Ordner wurde keine Modrinth- oder CurseForge-Instanz gefunden.": "No Modrinth or CurseForge instance was found in the selected folder.",
    "Kein Instanzordner ausgewählt.": "No instance folder was selected.",
    "Der gewählte Instanzordner wurde nicht gefunden.": "The selected instance folder was not found.",
    "Das interne Installationspaket wurde nicht gefunden.": "The internal installation package was not found.",
    "Die Installation ist abgeschlossen, aber die Client-Datei wurde nicht gefunden.": "The installation completed, but the client executable was not found.",
    "Kein Pfad übergeben.": "No path was provided.",
    "Profilwechsel ist nicht möglich, solange Minecraft startet oder läuft.": "Profiles cannot be switched while Minecraft is starting or running.",
    "Bitte zuerst mit einem Microsoft-Konto anmelden.": "Sign in with a Microsoft account first.",
    "Microsoft- oder Minecraft-Anmeldung konnte nicht aktualisiert werden.": "The Microsoft or Minecraft sign-in could not be refreshed.",
    "Keine Dateien oder Ordner zum Importieren ausgewählt.": "No files or folders were selected for import.",
    "Ungültiger Pfad für lokalen Inhalt.": "Invalid path for local content.",
    "Lokaler Inhalt konnte nicht entfernt werden.": "Local content could not be removed.",
    "Resource Packs können nur als .zip-Datei oder Ordner importiert werden.": "Resource packs can only be imported as .zip files or folders.",
    "Shader Packs können nur als .zip-Datei oder Ordner importiert werden.": "Shader packs can only be imported as .zip files or folders.",
    "Mods können nur als .jar- oder .zip-Datei importiert werden.": "Mods can only be imported as .jar or .zip files.",
    "Minecraft-Dateien konnten nicht vorbereitet werden, weil Java nicht gestartet werden konnte.": "Minecraft files could not be prepared because Java could not be started.",
    "Die verwaltete Java-Runtime wird aktuell nur unter Windows unterstützt.": "The managed Java runtime is currently supported on Windows only.",
    "Minecraft läuft gerade nicht.": "Minecraft is not running.",
    "Start wird abgebrochen. Aktuelle Downloads werden noch abgeschlossen...": "Canceling launch. Current downloads are still being completed...",
    "Unvollständiges Paket.": "Incomplete packet.",
    "VarInt ist zu groß.": "VarInt is too large.",
    "JSON-Daten konnten nicht verarbeitet werden.": "JSON data could not be processed.",
    "Dieses Microsoft-Konto hat kein Xbox-Profil.": "This Microsoft account does not have an Xbox profile.",
    "Xbox Live ist für das Land dieses Microsoft-Kontos nicht verfügbar.": "Xbox Live is not available in this Microsoft account's country.",
    "Dieses Konto ist als Kinderkonto markiert und muss in einer Familiengruppe freigegeben werden.": "This account is marked as a child account and must be approved in a family group.",
    "Konfiguriertes Java": "Configured Java",
    "Lokal importierte Datei.": "Locally imported file.",
    "Lokal importierter Ordner.": "Locally imported folder.",
    "Projekt konnte aktuell nicht geladen werden.": "The project could not be loaded at this time.",
    "Minecraft-Versionen konnten nicht rechtzeitig geladen werden.": "Minecraft versions could not be loaded in time.",
    "Mod-Kategorien konnten nicht rechtzeitig geladen werden.": "Mod categories could not be loaded in time.",
    "Resource-Pack-Kategorien konnten nicht rechtzeitig geladen werden.": "Resource pack categories could not be loaded in time.",
    "Shader-Kategorien konnten nicht rechtzeitig geladen werden.": "Shader categories could not be loaded in time.",
    "Ausgewählte Mods konnten nicht rechtzeitig aufgelöst werden.": "Selected mods could not be resolved in time.",
    "Ausgewählte Resource Packs konnten nicht rechtzeitig aufgelöst werden.": "Selected resource packs could not be resolved in time.",
    "Ausgewählte Shader Packs konnten nicht rechtzeitig aufgelöst werden.": "Selected shader packs could not be resolved in time.",
    "Die Java-Installation konnte nicht rechtzeitig geprüft werden.": "The Java installation could not be checked in time.",
    "Minecraft konnte nicht beendet werden.": "Minecraft could not be stopped.",
    "Stop-Signal an Minecraft gesendet.": "Stop signal sent to Minecraft.",
    "Der Server": "The server"
  }
};

const translationAttributes = ["aria-label", "title", "placeholder", "alt", "content"];
const translationAttributeSources = new WeakMap();

function normalizeLanguage(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return supportedLanguages.has(normalized) ? normalized : "de";
}

function getCurrentLocale() {
  return currentLanguage === "en" ? "en-US" : "de-DE";
}

function translateText(value, language = currentLanguage) {
  const text = String(value ?? "");
  const trimmed = text.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return text;
  }

  const dictionary = translationText[language] || {};
  let translated = dictionary[trimmed] || trimmed;

  if (language === "en") {
    translated = translated
      .replace(/^Profil: /, "Profile: ")
      .replace(/^Aktiv per /, "Active via ")
      .replace(/Jede Installation ist zusätzlich automatisch getrennt\./g, "Each installation is automatically isolated as well.")
      .replace(/Jede Installation ist automatisch getrennt\./g, "Each installation is automatically isolated.")
      .replace(/^Profil (.+) wird geladen\.\.\.$/, "Profile $1 is loading...")
      .replace(/^Profil (.+) wurde geladen\.$/, "Profile $1 was loaded.")
      .replace(/^Profil (.+) ist jetzt aktiv\.$/, "Profile $1 is now active.")
      .replace(/^Profil (.+) ist jetzt in der Startseite auswählbar\.$/, "Profile $1 is now selectable on the home page.")
      .replace(/^Profil (.+) wurde angelegt\.$/, "Profile $1 was created.")
      .replace(/^Profil (.+) wurde importiert\.$/, "Profile $1 was imported.")
      .replace(/^Profil (.+) wurde gelöscht\.$/, "Profile $1 was deleted.")
      .replace(/^Profil (.+) wurde aus der Auswahl entfernt\.$/, "Profile $1 was removed from the selection.")
      .replace(/^Profil (.+) wird umbenannt\.\.\.$/, "Renaming profile $1...")
      .replace(/^Profil (.+) wurde in (.+) umbenannt\.$/, "Profile $1 was renamed to $2.")
      .replace(/^Profil (.+) löschen\?$/, "Delete profile $1?")
      .replace(/^Profil "(.+)" wirklich löschen\? Der komplette Profilordner wird entfernt\.$/, "Do you really want to delete profile \"$1\"? The complete profile folder will be removed.")
      .replace(/^Profilordner von (.+) wird entfernt\.\.\.$/, "Removing profile folder for $1...")
      .replace(/^Profil-Icon für (.+) wird übernommen\.\.\.$/, "Applying profile icon for $1...")
      .replace(/^Profil-Icon für (.+) wurde aktualisiert\.$/, "Profile icon for $1 was updated.")
      .replace(/^Der neue Profilname (.+) wurde gespeichert\.$/, "The new profile name $1 was saved.")
      .replace(/^Der komplette Profilordner von (.+) wird dauerhaft entfernt\.$/, "The complete profile folder for $1 will be permanently removed.")
      .replace(/^Willst du (.+) wirklich aus dem Launcher entfernen\?$/, "Do you really want to remove $1 from the launcher?")
      .replace(/^Account "(.+)" entfernen\?$/, "Remove account \"$1\"?")
      .replace(/^Icon für (.+) ändern$/, "Change icon for $1")
      .replace(/^Icon für (.+) wählen$/, "Choose icon for $1")
      .replace(/^Profilnamen für (.+) bearbeiten$/, "Edit profile name for $1")
      .replace(/^(.+) löschen$/, "Delete $1")
      .replace(/^(.+)-Profil$/, "$1 profile")
      .replace(/^(.+) wurde nicht gefunden$/, "$1 was not found")
      .replace(/^Lösche (.+)\.\.\.$/, "Deleting $1...")
      .replace(/^(.+)-Instanz wurde als neues Profil übernommen\.$/, "$1 instance was imported as a new profile.")
      .replace(/^(\d[\d.,]*) Instanz gefunden$/, "$1 instance found")
      .replace(/^(\d[\d.,]*) Instanzen gefunden$/, "$1 instances found")
      .replace(/^(.+) konnten nicht importiert werden\.$/, "$1 could not be imported.")
      .replace(/^(.+) werden importiert\.\.\.$/, "$1 are being imported...")
      .replace(/^(.+) werden importiert$/, "$1 are being imported")
      .replace(/^(.+) wurden importiert und erkannt\.$/, "$1 were imported and recognized.")
      .replace(/^(.+) wurden importiert\.$/, "$1 were imported.")
      .replace(/^(\d[\d.,]*) Einträge wurden als Modrinth-Projekte übernommen\.$/, "$1 entries were adopted as Modrinth projects.")
      .replace(/^(\d[\d.,]*) Einträge importiert, (\d[\d.,]*) erkannt\.$/, "$1 entries imported, $2 recognized.")
      .replace(/^(\d[\d.,]*) Einträge wurden lokal übernommen\.$/, "$1 entries were imported locally.")
      .replace(/^(\d[\d.,]*) Einträge$/, "$1 entries")
      .replace(/^(\d[\d.,]*) Mod-Ergebnisse geladen\.$/, "$1 mod results loaded.")
      .replace(/^(\d[\d.,]*) Mods geladen\.$/, "$1 mods loaded.")
      .replace(/^(\d[\d.,]*) Resource Packs geladen\.$/, "$1 resource packs loaded.")
      .replace(/^(\d[\d.,]*) Shader Packs geladen\.$/, "$1 shader packs loaded.")
      .replace(/^(\d[\d.,]*) Inhalte ausgewählt$/, "$1 items selected")
      .replace(/^(\d[\d.,]*) Mods ausgewählt$/, "$1 mods selected")
      .replace(/^(\d[\d.,]*) Resource Packs ausgewählt$/, "$1 resource packs selected")
      .replace(/^(\d[\d.,]*) Shader Packs ausgewählt$/, "$1 shader packs selected")
      .replace(/^(\d[\d.,]*) Treffer$/, "$1 results")
      .replace(/^(.+) von (.+) \| Seite (.+) \/ (.+)$/, "$1 of $2 | Page $3 / $4")
      .replace(/^(\d+-\d+) von (.+)$/, "$1 of $2")
      .replace(/^(.+)-Suche$/, "$1 search")
      .replace(/^(.+) im Paket durchsuchen$/, "Search $1 in package")
      .replace(/^Keine ausgewählten (.+) für "(.+)" gefunden\.$/, "No selected $1 found for \"$2\".")
      .replace(/^Keine kompatible Modrinth-Version für (.+) auf Minecraft (.+) gefunden\.$/, "No compatible Modrinth version found for $1 on Minecraft $2.")
      .replace(/^(.+) ist nicht mit Minecraft (.+) kompatibel\. Bitte wähle eine passende Version aus\.$/, "$1 is not compatible with Minecraft $2. Please select a compatible version.")
      .replace(/^(.+) ist nicht mit (.+) kompatibel\. Bitte wähle eine passende Version aus\.$/, "$1 is not compatible with $2. Please select a compatible version.")
      .replace(/^Fabric (.+) auf (.+)$/, "Fabric $1 on $2")
      .replace(/^(.+) ist angemeldet und startbereit\.$/, "$1 is signed in and ready to launch.")
      .replace(/^Katalog aktuell nicht erreichbar: (.+)$/, "Catalog is currently unavailable: $1")
      .replace(/^Java (.+) ist verwaltet installiert\.$/, "Java $1 is installed as a managed runtime.")
      .replace(/^Java (.+) wird bei Bedarf automatisch installiert\.$/, "Java $1 will be installed automatically when needed.")
      .replace(/^Java (.+) ist wieder verfügbar\.$/, "Java $1 is available again.")
      .replace(/^Java (.+) wird aus der verwalteten Runtime verwendet\.$/, "Java $1 is used from the managed runtime.")
      .replace(/^Java (.+) konnte nicht korrekt installiert werden\.$/, "Java $1 could not be installed correctly.")
      .replace(/^Keine verwaltete Java-Runtime für Java (.+) gefunden\.$/, "No managed Java runtime found for Java $1.")
      .replace(/^Java wird bei Bedarf automatisch neu geladen\. Letzter Hinweis: (.+)$/, "Java will be downloaded again automatically if needed. Last hint: $1")
      .replace(/^Keine Fabric-Loader für Minecraft (.+) gefunden\.$/, "No Fabric loader found for Minecraft $1.")
      .replace(/^Keine herunterladbare Datei für (.+) gefunden\.$/, "No downloadable file found for $1.")
      .replace(/^Minecraft-Version (.+) wurde nicht gefunden\.$/, "Minecraft version $1 was not found.")
      .replace(/^Importquelle wurde nicht gefunden: (.+)$/, "Import source was not found: $1")
      .replace(/^Download fehlgeschlagen: (.+)$/, "Download failed: $1")
      .replace(/^Request fehlgeschlagen: (.+)$/, "Request failed: $1")
      .replace(/^HTTP-Anfrage fehlgeschlagen \((.+)\)\.$/, "HTTP request failed ($1).")
      .replace(/^Nicht unterstützte Importquelle: (.+)$/, "Unsupported import source: $1")
      .replace(/^Ungültiger Importname: (.+)$/, "Invalid import name: $1")
      .replace(/^Der Installer wurde mit Exit-Code (.+) beendet\.$/, "The installer exited with code $1.")
      .replace(/^(.+)-Instanzen mit (.+) werden aktuell nicht unterstützt\. Importiert werden nur Fabric-Instanzen\.$/, "$1 instances using $2 are not currently supported. Only Fabric instances can be imported.")
      .replace(/^Für Minecraft (.+) wird Java (.+)\+ benötigt, erkannt wurde aber Java (.+)\.$/, "Minecraft $1 requires Java $2 or newer, but Java $3 was detected.")
      .replace(/^Die verwaltete Java-Runtime unterstützt aktuell keine (.+)-Builds\.$/, "The managed Java runtime does not currently support $1 builds.")
      .replace(/^Die Java-Anforderung für Minecraft (.+) konnte nicht rechtzeitig bestimmt werden\.$/, "The Java requirement for Minecraft $1 could not be determined in time.")
      .replace(/^Fabric-Loader für Minecraft (.+) konnten nicht rechtzeitig geladen werden\.$/, "Fabric loaders for Minecraft $1 could not be loaded in time.")
      .replace(/^(.+) hat nicht rechtzeitig geantwortet\.$/, "$1 did not respond in time.")
      .replace(/^(.+) hat eine leere JSON-Antwort geliefert\.$/, "$1 returned an empty JSON response.")
      .replace(/^(.+) hat ungültige JSON-Daten geliefert\.$/, "$1 returned invalid JSON data.")
      .replace(/^Befehl fehlgeschlagen \((.+)\): (.+)$/, "Command failed ($1): $2")
      .replace(/^Optimiere Minecraft-Downloads mit (.+) parallelen Verbindungen\.\.\.$/, "Optimizing Minecraft downloads with $1 parallel connections...")
      .replace(/^Vorhandener Asset-Cache erkannt, vollständiger Asset-Scan wird übersprungen\.$/, "Existing asset cache detected; skipping the full asset scan.")
      .replace(/^: Vorhandener Asset-Cache erkannt, vollständiger Asset-Scan wird übersprungen\.$/, ": Existing asset cache detected; skipping the full asset scan.")
      .replace(/^Konnte JSON-Datei nicht lesen: (.+)$/, "Could not read JSON file: $1")
      .replace(/^Microsoft-Anmeldung fehlgeschlagen(.*)\. Bitte melde dich erneut an\.$/, "Microsoft sign-in failed$1. Please sign in again.")
      .replace(/^Xbox-Live-Anmeldung fehlgeschlagen(.*)\. Bitte prüfe dein Microsoft-Konto und melde dich erneut an\.$/, "Xbox Live sign-in failed$1. Check your Microsoft account and sign in again.")
      .replace(/^Minecraft-Anmeldung fehlgeschlagen(.*)\. Minecraft Services hat die Xbox-Anmeldung abgelehnt\.$/, "Minecraft sign-in failed$1. Minecraft Services rejected the Xbox sign-in.")
      .replace(/^Minecraft-Profil konnte nicht geladen werden(.*)\. Prüfe, ob das Konto Minecraft besitzt\.$/, "The Minecraft profile could not be loaded$1. Check whether the account owns Minecraft.")
      .replace(/^Minecraft-Besitzrechte konnten nicht geprüft werden(.*)\.$/, "Minecraft ownership could not be verified$1.")
      .replace(/^Minecraft-Dateien konnten nicht komplett vorab geladen werden: (.+)$/, "Minecraft files could not be fully preloaded: $1")
      .replace(/^Stop-Signal an Minecraft gesendet \(PID (.+)\)\.$/, "Stop signal sent to Minecraft (PID $1).")
      .replace(/^(.+) wurde erkannt \((.+)\)\. Beim Installieren oder Starten kann weiterhin die verwaltete Runtime verwendet werden\.$/, "$1 was detected ($2). The managed runtime can still be used for installation or launch.")
      .replace(/^(.+) wurde erkannt\. Beim Installieren oder Starten kann weiterhin die verwaltete Runtime verwendet werden\.$/, "$1 was detected. The managed runtime can still be used for installation or launch.")
      .replace(/(\d[\d.,]*) Inhalt hinzugefügt/g, "$1 item added")
      .replace(/(\d[\d.,]*) Inhalte hinzugefügt/g, "$1 items added")
      .replace(/(\d[\d.,]*) Inhalt entfernt/g, "$1 item removed")
      .replace(/(\d[\d.,]*) Inhalte entfernt/g, "$1 items removed")
      .replace(/(\d[\d.,]*) Inhalt\b/g, "$1 item")
      .replace(/(\d[\d.,]*) Inhalte\b/g, "$1 items")
      .replace(/(\d[\d.,]*) Mods\b/g, "$1 mods")
      .replace(/(\d[\d.,]*) Resource Packs\b/g, "$1 resource packs")
      .replace(/(\d[\d.,]*) Shader Packs\b/g, "$1 shader packs")
      .replace(/(\d[\d.,]*) Änderung\b/g, "$1 change")
      .replace(/(\d[\d.,]*) Änderungen\b/g, "$1 changes")
      .replace(/\bkeine Inhalte\b/g, "no items")
      .replace(/Änderungen seit letzter Installation:/g, "Changes since last installation:")
      .replace(/Fabric ([0-9A-Za-z.+_-]+) auf ([0-9A-Za-z.+_-]+)/g, "Fabric $1 on $2")
      .replace(/Java ([0-9A-Za-z.+_-]+) ist verwaltet installiert\./g, "Java $1 is installed as a managed runtime.")
      .replace(/Java ([0-9A-Za-z.+_-]+) wird bei Bedarf automatisch installiert\./g, "Java $1 will be installed automatically when needed.")
      .replace(/Aktuell: /g, "Current: ")
      .replace(/(Der Server|[A-Za-z0-9.:[\]-]+) hat nicht rechtzeitig geantwortet\./g, "$1 did not respond in time.")
      .replace(/(Der Server|[A-Za-z0-9.:[\]-]+) hat eine leere JSON-Antwort geliefert\./g, "$1 returned an empty JSON response.")
      .replace(/(Der Server|[A-Za-z0-9.:[\]-]+) hat ungültige JSON-Daten geliefert\./g, "$1 returned invalid JSON data.")
      .replace(/\bDer Server\b/g, "The server")
      .replace(/\(stabil\)/g, "(stable)")
      .replace(/Request fehlgeschlagen: /g, "Request failed: ")
      .replace(/Download fehlgeschlagen: /g, "Download failed: ")
      .replace(/Runtime noch nicht installiert\./g, "Runtime not installed yet.")
      .replace(/Installiert: /g, "Installed: ")
      .replace(/Auswahl: /g, "Selection: ")
      .replace(/Ausgewählte Version: /g, "Selected version: ")
      .replace(/wird geladen\.\.\.$/g, "is loading...")
      .replace(/werden geladen\.\.\.$/g, "are loading...")
      .replace(/wird gespeichert\.\.\.$/g, "is being saved...")
      .replace(/wurde gespeichert\.$/g, "was saved.")
      .replace(/wurde hinzugefügt\.$/g, "was added.")
      .replace(/wird hinzugefügt$/g, "is being added")
      .replace(/wird hinzugefügt\.\.\.$/g, "is being added...")
      .replace(/wurde entfernt\.$/g, "was removed.")
      .replace(/wird entfernt$/g, "is being removed")
      .replace(/wird entfernt\.\.\.$/g, "is being removed...")
      .replace(/wird lokal entfernt\.\.\.$/g, "is being removed locally...")
      .replace(/wurde lokal entfernt\.$/g, "was removed locally.")
      .replace(/wurde aus dem Profil gelöscht\.$/g, "was deleted from the profile.")
      .replace(/wurde zur Auswahl hinzugefügt\.$/g, "was added to the selection.")
      .replace(/wurde aus der Auswahl entfernt\.$/g, "was removed from the selection.")
      .replace(/werden importiert$/g, "are being imported")
      .replace(/werden importiert\.\.\.$/g, "are being imported...")
      .replace(/konnte nicht geladen werden\.$/g, "could not be loaded.")
      .replace(/konnte nicht gespeichert werden\.$/g, "could not be saved.")
      .replace(/konnte nicht hinzugefügt werden\.$/g, "could not be added.")
      .replace(/konnte nicht entfernt werden\.$/g, "could not be removed.")
      .replace(/konnte nicht lokal entfernt werden\.$/g, "could not be removed locally.")
      .replace(/\bHinzugefügt\b/g, "Added")
      .replace(/\bEntfernt\b/g, "Removed")
      .replace(/\bLokal entfernt\b/g, "Removed locally");
  }

  if (translated === trimmed) {
    return text;
  }

  const leading = text.match(/^\s*/)?.[0] || "";
  const trailing = text.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function translateLogLine(line, language = currentLanguage) {
  const rawLine = String(line ?? "");

  if (language !== "en" || !rawLine.trim()) {
    return rawLine;
  }

  if (/^\s+at\s|\b(?:Error|TypeError|ReferenceError|SyntaxError):\s/.test(rawLine)) {
    return rawLine;
  }

  const stageMatch = rawLine.match(/^(\[[^\]]+\]\s*)(.*)$/);
  const prefix = stageMatch ? stageMatch[1] : "";
  const body = stageMatch ? stageMatch[2] : rawLine;
  const translatedBody = translateText(body, language)
    .replace(/^Angemeldet als (.+)$/, "Signed in as $1")
    .replace(/^Aktiver Account: (.+)\.$/, "Active account: $1.")
    .replace(/^Aktiver Account: (.+)$/, "Active account: $1")
    .replace(/^Login wurde abgebrochen\.$/, "Login was canceled.")
    .replace(/^Umbenannt: (.+) -> (.+)$/, "Renamed: $1 -> $2")
    .replace(/^Erstellt: (.+)$/, "Created: $1")
    .replace(/^Importiert: (.+) aus (.+)$/, "Imported: $1 from $2")
    .replace(/^Aktiv: (.+)$/, "Active: $1")
    .replace(/^Gelöscht: (.+)$/, "Deleted: $1")
    .replace(/^Icon gesetzt: (.+) -> (.+)$/, "Icon set: $1 -> $2")
    .replace(/^Hinzugefügt: (.+)$/, "Added: $1")
    .replace(/^Entfernt: (.+)$/, "Removed: $1")
    .replace(/^Lokal entfernt: (.+)$/, "Removed locally: $1")
    .replace(/^Lokal importiert: (.+)$/, "Imported locally: $1")
    .replace(/^Start wurde abgebrochen\.$/, "Launch was canceled.")
      .replace(/^Profil (.+) ist jetzt in der Startseite auswählbar\.$/, "Profile $1 is now selectable on the home page.")
      .replace(/^Profil (.+) wurde aus der Auswahl entfernt\.$/, "Profile $1 was removed from the selection.")
      .replace(/^(.+)-Instanz wurde als neues Profil übernommen\.$/, "$1 instance was imported as a new profile.")
      .replace(/^(\d+) Einträge importiert, (\d+) erkannt\.$/, "$1 entries imported, $2 recognized.")
      .replace(/^(\d+) Einträge wurden lokal übernommen\.$/, "$1 entries were imported locally.")
      .replace(/^(.+)-Suche$/, "$1 search")
      .replace(/^(.+) im Paket durchsuchen$/, "Search $1 in package")
      .replace(/^(.+) wurde nicht gefunden$/, "$1 was not found")
      .replace(/^Datei-Download (.+)$/, "File download $1")
      .replace(/^Datei (.+)$/, "File $1")
      .replace(/^Fabric (.+) für Minecraft (.+) ist bereit\.$/, "Fabric $1 for Minecraft $2 is ready.")
      .replace(/^Minecraft läuft für (.+) auf (.+)\.$/, "Minecraft is running for $1 on $2.")
      .replace(/^Minecraft läuft für (.+)\.$/, "Minecraft is running for $1.")
      .replace(/^(.+) ist mit (.+) verbunden\.$/, "$1 is connected to $2.")
      .replace(/^Verbinde direkt mit (.+)\.\.\.$/, "Connecting directly to $1...")
      .replace(/^PID (.+) für (.+)$/, "PID $1 for $2")
      .replace(/^(.+) Mods bereit\.$/, "$1 mods ready.")
      .replace(/^Änderungen seit letzter Installation: (.+)\.$/, "Changes since last installation: $1.")
      .replace(/^Verwaltete Java-Runtime (.+) wird eingerichtet\.\.\.$/, "Setting up managed Java runtime $1...")
      .replace(/^Lade (.+) herunter\.\.\.$/, "Downloading $1...")
    .replace(/^(.+) wird eingerichtet\.\.\.$/, "Setting up $1...")
    .replace(/^Lade (.+) Installer (.+)\.\.\.$/, "Downloading $1 installer $2...")
    .replace(/^Lade (.+) (.+)\.\.\.$/, "Downloading $1 $2...")
    .replace(/^Java (.+) wurde neu installiert\.$/, "Java $1 was reinstalled.")
    .replace(/^Minecraft wurde beendet \(Code (.+)\)\.$/, "Minecraft closed (code $1).")
    .replace(/^Starte Minecraft als (.+)\.\.\.$/, "Starting Minecraft as $1...")
    .replace(/^Minecraft gestartet \(PID (.+)\)\.$/, "Minecraft started (PID $1).")
    .replace(/^(.+) wurde beendet\.$/, "$1 was closed.");

  return `${prefix}${translatedBody}`;
}

function translateLogLines(lines, language = currentLanguage) {
  return (lines || []).map((line) => translateLogLine(line, language));
}

function setLocalizedText(element, value) {
  if (!element) {
    return;
  }

  const source = String(value ?? "");
  element.__boocordLocalizedSource = source;
  element.setAttribute("data-i18n-skip", "true");
  element.textContent = translateLogLine(source, currentLanguage);
}

function refreshLocalizedText(element) {
  if (!element || !Object.prototype.hasOwnProperty.call(element, "__boocordLocalizedSource")) {
    return;
  }

  element.textContent = translateLogLine(element.__boocordLocalizedSource, currentLanguage);
}

function refreshLocalizedProgressTexts() {
  refreshLocalizedText(elements.statusText);
  refreshLocalizedText(elements.statusDetail);
  refreshLocalizedText(elements.progressMeta);
}

function shouldSkipTranslation(node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return Boolean(element?.closest?.("[data-i18n-skip], .material-icons"));
}

function translateTextNode(node, { refreshSource = true } = {}) {
  if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkipTranslation(node)) {
    return;
  }

  if (node.__boocordI18nApplying) {
    return;
  }

  const currentValue = node.nodeValue || "";

  if (!node.__boocordI18nSource) {
    node.__boocordI18nSource = currentValue;
  } else if (refreshSource && currentValue !== translateText(node.__boocordI18nSource, currentLanguage)) {
    node.__boocordI18nSource = currentValue;
  }

  const translated = translateText(node.__boocordI18nSource, currentLanguage);

  if (translated !== currentValue) {
    node.__boocordI18nApplying = true;
    node.nodeValue = translated;
    node.__boocordI18nApplying = false;
  }
}

function translateElementAttributes(element, { refreshSource = true } = {}) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE || shouldSkipTranslation(element)) {
    return;
  }

  let sourceByAttribute = translationAttributeSources.get(element);

  if (!sourceByAttribute) {
    sourceByAttribute = {};
    translationAttributeSources.set(element, sourceByAttribute);
  }

  translationAttributes.forEach((attributeName) => {
    if (!element.hasAttribute(attributeName)) {
      return;
    }

    const currentValue = element.getAttribute(attributeName) || "";
    const translatedSource = sourceByAttribute[attributeName]
      ? translateText(sourceByAttribute[attributeName], currentLanguage)
      : null;

    if (!sourceByAttribute[attributeName]) {
      sourceByAttribute[attributeName] = currentValue;
    } else if (refreshSource && currentValue !== translatedSource) {
      sourceByAttribute[attributeName] = currentValue;
    }

    const translated = translateText(sourceByAttribute[attributeName], currentLanguage);
    if (translated !== currentValue) {
      element.setAttribute(attributeName, translated);
    }
  });
}

function applyTranslations(root = document.body, { refreshSources = true } = {}) {
  if (!root || isApplyingTranslations) {
    return;
  }

  isApplyingTranslations = true;

  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root, { refreshSource: refreshSources });
  } else if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_NODE) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    translateElementAttributes(root, { refreshSource: refreshSources });

    if (root.querySelectorAll) {
      root.querySelectorAll("*").forEach((element) => {
        translateElementAttributes(element, { refreshSource: refreshSources });
      });
    }

    while (walker.nextNode()) {
      translateTextNode(walker.currentNode, { refreshSource: refreshSources });
    }
  }

  document.documentElement.lang = currentLanguage;
  isApplyingTranslations = false;
}

function startTranslationObserver() {
  if (translationObserver) {
    return;
  }

  translationObserver = new MutationObserver((mutations) => {
    if (isApplyingTranslations) {
      return;
    }

    window.requestAnimationFrame(() => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target);
          return;
        }

        mutation.addedNodes.forEach((node) => {
          applyTranslations(node);
        });

        if (mutation.type === "attributes") {
          translateElementAttributes(mutation.target);
        }
      });
    });
  });

  translationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: translationAttributes
  });
}

function setCurrentLanguage(language) {
  currentLanguage = normalizeLanguage(language);
  applyTranslations(document.body, { refreshSources: false });
  refreshLocalizedProgressTexts();
  renderLogOutput();
}

const maxLauncherLogLines = 400;
const logFlushDelayMs = 50;
const selectedProjectRemovalAnimationMs = 240;
const selectedProjectLayoutEasing = "cubic-bezier(0.22, 1, 0.36, 1)";
const moddingContentConfigs = {
  mod: {
    projectType: "mod",
    label: "Mods",
    singularLabel: "Mod",
    browserTitle: "Mod Browser",
    packageTitle: "Ausgewählte Mods",
    searchLabel: "Mod suchen",
    searchPlaceholder: "z. B. Sodium, ReplayMod, Mod Menu",
    fallbackTag: "Fabric Mod",
    emptySearch: "Keine kompatiblen Fabric-Mods für diese Suche gefunden.",
    emptySelection: "Noch keine Mods ausgewählt.",
    selectionKey: "selectedMods",
    detailActionInstalled: "Bereits im Paket",
    detailActionAvailable: "Kompatibel mit aktueller Auswahl",
    installTarget: "Mods",
    detailOpenLabel: "Modrinth öffnen"
  },
  resourcepack: {
    projectType: "resourcepack",
    label: "Resource Packs",
    singularLabel: "Resource Pack",
    browserTitle: "Resource Pack Browser",
    packageTitle: "Ausgewählte Resource Packs",
    searchLabel: "Resource Pack suchen",
    searchPlaceholder: "z. B. Faithful, Fresh Animations, Bare Bones",
    fallbackTag: "Resource Pack",
    emptySearch: "Keine kompatiblen Resource Packs für diese Suche gefunden.",
    emptySelection: "Noch keine Resource Packs ausgewählt.",
    selectionKey: "selectedResourcePacks",
    detailActionInstalled: "Bereits ausgewählt",
    detailActionAvailable: "Kompatibel mit aktueller Auswahl",
    installTarget: "Resource Packs",
    detailOpenLabel: "Modrinth öffnen"
  },
  shader: {
    projectType: "shader",
    label: "Shader Packs",
    singularLabel: "Shader Pack",
    browserTitle: "Shader Pack Browser",
    packageTitle: "Ausgewählte Shader Packs",
    searchLabel: "Shader Pack suchen",
    searchPlaceholder: "z. B. Complementary, BSL, Bliss",
    fallbackTag: "Shader Pack",
    emptySearch: "Keine kompatiblen Shader Packs für diese Suche gefunden.",
    emptySelection: "Noch keine Shader Packs ausgewählt.",
    selectionKey: "selectedShaderPacks",
    detailActionInstalled: "Bereits ausgewählt",
    detailActionAvailable: "Kompatibel mit aktueller Auswahl",
    installTarget: "Shader Packs",
    detailOpenLabel: "Modrinth öffnen"
  }
};

const javaGcProfileOptions = [
  {
    value: "auto",
    label: "Automatisch (empfohlen)"
  },
  {
    value: "g1",
    label: "G1 (kompatibel)"
  },
  {
    value: "zgc",
    label: "ZGC (niedrige Pausen)"
  }
];

const state = {
  activeTab: "start",
  language: "de",
  languagePromptOpen: false,
  config: null,
  launcherWindow: {
    isFullScreen: false,
    isMaximized: false,
    isRestorable: false
  },
  lastOpenDirectory: null,
  browseFilters: {
    category: "all",
    sortIndex: "downloads"
  },
  serverStatus: {
    loading: true,
    online: null,
    host: "boocord.com",
    port: 25565,
    resolvedHost: "boocord.com",
    playersOnline: null,
    playersMax: null,
    latencyMs: null,
    version: null,
    motd: null,
    samplePlayers: [],
    checkedAt: null,
    error: null
  },
  serverPollTimer: null,
  searchResults: [],
  searchHasRun: false,
  searchLoading: false,
  searchPagination: {
    limit: 12,
    offset: 0,
    totalHits: 0
  },
  selectedContentSearchQuery: {
    mod: "",
    resourcepack: "",
    shader: ""
  },
  modDetailsCache: new Map(),
  activeModPreview: null,
  activeModDetail: null,
  activeModDetailCacheKey: null,
  activeModdingMode: "package",
  activeModdingContentType: "mod",
  modDetailLoading: false,
  importBrowser: {
    open: false,
    loading: false,
    activeSource: "modrinth",
    error: null,
    sources: []
  },
  localImportDragDepth: 0,
  accountDeleteDialog: {
    account: null,
    resolve: null
  },
  profileDeleteDialog: {
    profile: null,
    resolve: null
  },
  profileRename: {
    slug: null,
    value: ""
  },
  isBusy: false,
  isStopping: false,
  lastProcessState: null,
  logLines: ["Launcher bereit."],
  logsCleared: false,
  pendingLogLines: [],
  logFlushTimer: null,
  renderQueued: false,
  unsubscribe: null,
  configVersion: 0,
  moddingRevision: 0,
  moddingRefreshToken: 0,
  moddingRefreshRevision: 0,
  moddingRefreshPromise: null,
  pendingProjectOperations: [],
  queuedProjectOperations: [],
  moddingPollTimer: null,
  manualWindowDrag: {
    active: false,
    beginPending: false,
    pointerId: null
  },
  progress: {
    active: false,
    label: "Warten auf Aktion",
    detail: "Noch keine Aktion aktiv.",
    percent: 0,
    indeterminate: false
  },
  unsubscribeWindowState: null
};

const elements = {
  bgAnimation: document.querySelector(".bg-animation"),
  launcherWindowDragRegion: document.querySelector(".launcher-windowbar-drag"),
  launcherWindowMinimizeButton: document.getElementById("launcher-window-minimize"),
  launcherWindowMaximizeButton: document.getElementById("launcher-window-maximize"),
  launcherWindowMaximizeIcon: document.getElementById("launcher-window-maximize-icon"),
  launcherWindowCloseButton: document.getElementById("launcher-window-close"),
  navbar: document.querySelector(".navbar"),
  navCenter: document.querySelector(".nav-center"),
  navLinks: document.querySelector(".nav-links"),
  mobileMenuButton: document.querySelector(".mobile-menu-btn"),
  navAccount: document.querySelector(".nav-account"),
  tabButtons: [...document.querySelectorAll("[data-tab-target]")],
  tabPanels: [...document.querySelectorAll("[data-tab-panel]")],
  accountTrigger: document.getElementById("account-trigger"),
  accountDropdown: document.getElementById("account-dropdown"),
  accountAvatar: document.getElementById("account-avatar"),
  accountTriggerName: document.getElementById("account-trigger-name"),
  accountTriggerSubtitle: document.getElementById("account-trigger-subtitle"),
  accountList: document.getElementById("account-list"),
  navLoginButton: document.getElementById("nav-login-button"),
  navLogoutButton: document.getElementById("nav-logout-button"),
  currentProfileLabel: document.getElementById("current-profile-label"),
  versionLabel: document.getElementById("version-label"),
  heroBoocordButton: document.getElementById("hero-boocord-button"),
  heroBoocordButtonLabel: document.getElementById("hero-boocord-button-label"),
  heroBoocordButtonSubtitle: document.getElementById("hero-boocord-button-subtitle"),
  accountCardText: document.getElementById("account-card-text"),
  runtimeCardText: document.getElementById("runtime-card-text"),
  dataDirDisplay: document.getElementById("data-dir-display"),
  profileLabel: document.getElementById("profile-label"),
  profileHint: document.getElementById("profile-hint"),
  profileCreateInput: document.getElementById("profile-create-input"),
  profileCreateButton: document.getElementById("profile-create-button"),
  profileImportButton: document.getElementById("profile-import-button"),
  profileCardGrid: document.getElementById("profile-card-grid"),
  minecraftVersionSelect: document.getElementById("minecraft-version-select"),
  fabricLoaderSelect: document.getElementById("fabric-loader-select"),
  requiredJavaVersion: document.getElementById("required-java-version"),
  detectedJavaVersion: document.getElementById("detected-java-version"),
  memoryMinInput: document.getElementById("memory-min-input"),
  memoryMaxInput: document.getElementById("memory-max-input"),
  languageSelect: document.getElementById("language-select"),
  languageChoiceModal: document.getElementById("language-choice-modal"),
  languageChoiceButtons: [...document.querySelectorAll("[data-language-choice]")],
  javaGcProfileSelect: document.getElementById("java-gc-profile-select"),
  openLogsOnLaunchInput: document.getElementById("open-logs-on-launch-input"),
  minimizeOnLaunchInput: document.getElementById("minimize-on-launch-input"),
  launcherBackgroundStatus: document.getElementById("launcher-background-status"),
  launcherBackgroundPreview: document.getElementById("launcher-background-preview"),
  launcherBackgroundPreviewLabel: document.getElementById("launcher-background-preview-label"),
  launcherBackgroundSelectButton: document.getElementById("launcher-background-select-button"),
  launcherBackgroundRemoveButton: document.getElementById("launcher-background-remove-button"),
  modSearchInput: document.getElementById("mod-search-input"),
  modCategorySelect: document.getElementById("mod-category-select"),
  modSortSelect: document.getElementById("mod-sort-select"),
  modSearchButton: document.getElementById("mod-search-button"),
  modSearchResults: document.getElementById("mod-search-results"),
  modSearchCount: document.getElementById("mod-search-count"),
  modSearchLabel: document.getElementById("mod-search-label"),
  modPageSummary: document.getElementById("mod-page-summary"),
  modPagination: document.getElementById("mod-pagination"),
  selectedModTotal: document.getElementById("selected-mod-total"),
  selectedModState: document.getElementById("selected-mod-state"),
  selectedContentSearchInput: document.getElementById("selected-content-search-input"),
  selectedMods: document.getElementById("selected-mods"),
  localImportSurface: document.getElementById("local-import-surface"),
  localImportTitle: document.getElementById("local-import-title"),
  localImportHint: document.getElementById("local-import-hint"),
  localImportButton: document.getElementById("local-import-button"),
  localImportButtonLabel: document.getElementById("local-import-button-label"),
  moddingBrowserHeading: document.getElementById("modding-browser-heading"),
  selectedContentHeading: document.getElementById("selected-content-heading"),
  selectedContentListHeading: document.getElementById("selected-content-list-heading"),
  modInstallTarget: document.getElementById("mod-install-target"),
  modDetailModal: document.getElementById("mod-detail-modal"),
  modDetailOverlay: document.getElementById("mod-detail-overlay"),
  modDetailClose: document.getElementById("mod-detail-close"),
  modDetailContent: document.getElementById("mod-detail-content"),
  modDetailTitle: document.getElementById("mod-detail-title"),
  profileImportModal: document.getElementById("profile-import-modal"),
  profileImportOverlay: document.getElementById("profile-import-overlay"),
  profileImportClose: document.getElementById("profile-import-close"),
  profileImportSubtitle: document.getElementById("profile-import-subtitle"),
  profileImportSources: document.getElementById("profile-import-sources"),
  profileImportList: document.getElementById("profile-import-list"),
  profileImportRefresh: document.getElementById("profile-import-refresh"),
  profileImportBrowse: document.getElementById("profile-import-browse"),
  launchErrorModal: document.getElementById("launch-error-modal"),
  launchErrorOverlay: document.getElementById("launch-error-overlay"),
  launchErrorClose: document.getElementById("launch-error-close"),
  launchErrorTitle: document.getElementById("launch-error-title"),
  launchErrorDetail: document.getElementById("launch-error-detail"),
  launchErrorMessage: document.getElementById("launch-error-message"),
  launchErrorConfirm: document.getElementById("launch-error-confirm"),
  accountDeleteModal: document.getElementById("account-delete-modal"),
  accountDeleteOverlay: document.getElementById("account-delete-overlay"),
  accountDeleteClose: document.getElementById("account-delete-close"),
  accountDeleteTitle: document.getElementById("account-delete-title"),
  accountDeleteMessage: document.getElementById("account-delete-message"),
  accountDeleteName: document.getElementById("account-delete-name"),
  accountDeleteCancel: document.getElementById("account-delete-cancel"),
  accountDeleteConfirm: document.getElementById("account-delete-confirm"),
  profileDeleteModal: document.getElementById("profile-delete-modal"),
  profileDeleteOverlay: document.getElementById("profile-delete-overlay"),
  profileDeleteClose: document.getElementById("profile-delete-close"),
  profileDeleteTitle: document.getElementById("profile-delete-title"),
  profileDeleteMessage: document.getElementById("profile-delete-message"),
  profileDeletePath: document.getElementById("profile-delete-path"),
  profileDeleteCancel: document.getElementById("profile-delete-cancel"),
  profileDeleteConfirm: document.getElementById("profile-delete-confirm"),
  moddingModeButtons: [...document.querySelectorAll("[data-modding-mode-target]")],
  moddingContentButtons: [...document.querySelectorAll("[data-modding-content-target]")],
  moddingModePanels: [...document.querySelectorAll("[data-modding-mode-panel]")],
  moddingModeEmpty: document.getElementById("modding-mode-empty"),
  moddingBrowserSummary: document.getElementById("modding-browser-summary"),
  moddingPackageSummary: document.getElementById("modding-package-summary"),
  statusText: document.getElementById("status-text"),
  statusDetail: document.getElementById("status-detail"),
  progressShell: document.getElementById("progress-shell"),
  progressMeta: document.getElementById("progress-meta"),
  progressBar: document.getElementById("progress-bar"),
  resultCopyButton: document.getElementById("result-copy-button"),
  resultCopyIcon: document.getElementById("result-copy-icon"),
  resultClearButton: document.getElementById("result-clear-button"),
  resultClearIcon: document.getElementById("result-clear-icon"),
  resultBox: document.getElementById("result-box"),
  logoutButton: document.getElementById("logout-button"),
  browseButton: document.getElementById("browse-button"),
  reinstallJavaButton: document.getElementById("card-reinstall-java-button"),
  openDataButton: document.getElementById("open-data-button"),
  serverHealthCard: document.getElementById("server-health-card"),
  serverHealthLabel: document.getElementById("server-health-label"),
  serverPlayersLabel: document.getElementById("server-players-label"),
  clientReadyLabel: document.getElementById("client-ready-label"),
  serverLatencyLabel: document.getElementById("server-latency-label"),
  clientModsDetail: document.getElementById("client-mods-detail"),
  year: document.getElementById("year")
};

const buttonGroups = {
  login: [elements.navLoginButton, document.getElementById("card-login-button")],
  install: [document.getElementById("hero-install-button"), document.getElementById("card-install-button")],
  java: [elements.reinstallJavaButton],
  launch: [document.getElementById("hero-launch-button")],
  stop: [document.getElementById("hero-stop-button"), document.getElementById("card-stop-button")],
  open: [elements.openDataButton],
  search: [elements.modSearchButton]
};

const liveOverviewAnimations = new WeakMap();
const customSelectRegistry = new Map();
let activeCustomSelect = null;
let customSelectEventsBound = false;
const boocordLaunchTarget = Object.freeze({
  type: "multiplayer",
  identifier: "boocord.com"
});

function getCustomSelectData(select) {
  return [...select.options].map((option, index) => ({
    id: `${select.id || "launcher-select"}-option-${index}`,
    value: option.value,
    label: option.textContent?.trim() || option.value,
    disabled: option.disabled
  }));
}

function getCustomSelectSelectedIndex(select, optionData) {
  if (!optionData.length) {
    return -1;
  }

  const selectedIndex = optionData.findIndex((option) => option.value === select.value);
  return selectedIndex >= 0 ? selectedIndex : 0;
}

function closeCustomSelect(customSelect, { restoreFocus = false } = {}) {
  if (!customSelect?.isOpen) {
    return;
  }

  customSelect.isOpen = false;
  customSelect.shell.classList.remove("is-open");
  customSelect.trigger.setAttribute("aria-expanded", "false");
  customSelect.menu.hidden = true;
  customSelect.trigger.removeAttribute("aria-activedescendant");

  if (activeCustomSelect === customSelect) {
    activeCustomSelect = null;
  }

  if (restoreFocus) {
    customSelect.trigger.focus();
  }
}

function closeAllCustomSelects({ except = null, restoreFocus = false } = {}) {
  customSelectRegistry.forEach((customSelect) => {
    if (customSelect !== except) {
      closeCustomSelect(customSelect, { restoreFocus });
    }
  });
}

function getCustomSelectButtons(customSelect) {
  return [...customSelect.menu.querySelectorAll(".launcher-select-option")];
}

function focusCustomSelectOption(customSelect, index) {
  const buttons = getCustomSelectButtons(customSelect);

  if (!buttons.length) {
    return;
  }

  const safeIndex = Math.min(Math.max(index, 0), buttons.length - 1);
  const nextButton = buttons[safeIndex];

  customSelect.highlightedIndex = safeIndex;
  customSelect.trigger.setAttribute("aria-activedescendant", nextButton.id);
  nextButton.focus();
}

function openCustomSelect(customSelect, focusIndex = customSelect.selectedIndex) {
  if (!customSelect || customSelect.trigger.disabled || !customSelect.optionData.length) {
    return;
  }

  closeAllCustomSelects({ except: customSelect });
  customSelect.isOpen = true;
  activeCustomSelect = customSelect;
  customSelect.shell.classList.add("is-open");
  customSelect.trigger.setAttribute("aria-expanded", "true");
  customSelect.menu.hidden = false;

  const initialIndex = focusIndex >= 0 ? focusIndex : 0;
  window.requestAnimationFrame(() => {
    focusCustomSelectOption(customSelect, initialIndex);
  });
}

function updateCustomSelectValue(
  customSelect,
  value,
  { dispatch = true, restoreFocus = true } = {}
) {
  if (!customSelect || customSelect.select.disabled) {
    return;
  }

  customSelect.select.value = value;
  syncCustomSelect(customSelect.select);

  if (dispatch) {
    customSelect.select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  closeCustomSelect(customSelect, { restoreFocus });
}

function syncCustomSelect(select) {
  const customSelect = customSelectRegistry.get(select);

  if (!customSelect) {
    return;
  }

  const wasOpen = customSelect.isOpen;
  const highlightedIndex = customSelect.highlightedIndex;

  const optionData = getCustomSelectData(select);
  const selectedIndex = getCustomSelectSelectedIndex(select, optionData);
  const selectedOption = selectedIndex >= 0 ? optionData[selectedIndex] : null;
  const isDisabled = select.disabled || !optionData.length;

  customSelect.optionData = optionData;
  customSelect.selectedIndex = selectedIndex;
  customSelect.highlightedIndex = selectedIndex;
  customSelect.trigger.disabled = isDisabled;
  customSelect.shell.classList.toggle("is-disabled", isDisabled);
  customSelect.trigger.setAttribute("aria-disabled", String(isDisabled));
  customSelect.valueLabel.textContent = selectedOption?.label || "Keine Optionen";
  customSelect.trigger.removeAttribute("aria-activedescendant");

  customSelect.menu.innerHTML = "";

  if (!optionData.length) {
    closeCustomSelect(customSelect);
    const emptyState = document.createElement("div");
    emptyState.className = "launcher-select-empty";
    emptyState.textContent = "Keine Optionen verfügbar";
    customSelect.menu.appendChild(emptyState);
    return;
  }

  optionData.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.id = option.id;
    button.className = "launcher-select-option";
    button.dataset.value = option.value;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(index === selectedIndex));
    button.tabIndex = -1;
    button.disabled = option.disabled;

    if (index === selectedIndex) {
      button.classList.add("is-selected");
    }

    button.textContent = option.label;

    button.addEventListener("click", () => {
      updateCustomSelectValue(customSelect, option.value);
    });

    button.addEventListener("keydown", (event) => {
      const buttons = getCustomSelectButtons(customSelect);
      const currentIndex = buttons.indexOf(button);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusCustomSelectOption(customSelect, currentIndex + 1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusCustomSelectOption(customSelect, currentIndex - 1);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        focusCustomSelectOption(customSelect, 0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        focusCustomSelectOption(customSelect, buttons.length - 1);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        updateCustomSelectValue(customSelect, option.value);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeCustomSelect(customSelect, { restoreFocus: true });
        return;
      }

      if (event.key === "Tab") {
        closeCustomSelect(customSelect);
      }
    });

    customSelect.menu.appendChild(button);
  });

  if (isDisabled) {
    closeCustomSelect(customSelect);
    return;
  }

  if (!wasOpen) {
    customSelect.menu.hidden = true;
    customSelect.trigger.setAttribute("aria-expanded", "false");

    if (activeCustomSelect === customSelect) {
      activeCustomSelect = null;
    }

    return;
  }

  customSelect.isOpen = true;
  activeCustomSelect = customSelect;
  customSelect.shell.classList.add("is-open");
  customSelect.trigger.setAttribute("aria-expanded", "true");
  customSelect.menu.hidden = false;

  const nextFocusIndex = Math.min(
    Math.max(highlightedIndex >= 0 ? highlightedIndex : selectedIndex, 0),
    optionData.length - 1
  );

  window.requestAnimationFrame(() => {
    if (customSelect.isOpen) {
      focusCustomSelectOption(customSelect, nextFocusIndex);
    }
  });
}

function shouldDisableMinecraftVersionSelect(modding = state.config?.modding) {
  const hasOptions = Array.isArray(modding?.availableMinecraftVersions) && modding.availableMinecraftVersions.length > 0;
  return Boolean(state.isBusy || (!hasOptions && modding?.loading));
}

function shouldDisableFabricLoaderSelect(modding = state.config?.modding) {
  const hasOptions = Array.isArray(modding?.availableFabricLoaders) && modding.availableFabricLoaders.length > 0;
  return Boolean(state.isBusy || (!hasOptions && modding?.loading));
}

function updateModdingVersionSelectAvailability(modding = state.config?.modding) {
  const nextMinecraftDisabled = shouldDisableMinecraftVersionSelect(modding);
  const nextFabricDisabled = shouldDisableFabricLoaderSelect(modding);
  const minecraftDisabledChanged = elements.minecraftVersionSelect.disabled !== nextMinecraftDisabled;
  const fabricDisabledChanged = elements.fabricLoaderSelect.disabled !== nextFabricDisabled;

  elements.minecraftVersionSelect.disabled = nextMinecraftDisabled;
  elements.fabricLoaderSelect.disabled = nextFabricDisabled;

  if (minecraftDisabledChanged) {
    syncCustomSelect(elements.minecraftVersionSelect);
  }

  if (fabricDisabledChanged) {
    syncCustomSelect(elements.fabricLoaderSelect);
  }
}

function initializeCustomSelect(select) {
  if (!select || customSelectRegistry.has(select)) {
    return;
  }

  const shell = select.closest(".select-shell");

  if (!shell) {
    return;
  }

  const trigger = document.createElement("button");
  const valueLabel = document.createElement("span");
  const menu = document.createElement("div");
  const label = select.id ? document.querySelector(`label[for="${select.id}"]`) : null;

  trigger.type = "button";
  trigger.className = "launcher-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  if (label) {
    trigger.setAttribute("aria-label", label.textContent?.trim() || "Auswahl");
  }

  valueLabel.className = "launcher-select-value";
  trigger.appendChild(valueLabel);

  menu.className = "launcher-select-menu";
  menu.setAttribute("role", "listbox");
  menu.hidden = true;

  select.classList.add("launcher-select-native");
  shell.insertBefore(trigger, shell.querySelector(".select-shell-icon"));
  shell.appendChild(menu);

  const customSelect = {
    select,
    shell,
    trigger,
    valueLabel,
    menu,
    optionData: [],
    selectedIndex: -1,
    highlightedIndex: -1,
    isOpen: false
  };

  customSelectRegistry.set(select, customSelect);

  trigger.addEventListener("click", () => {
    if (customSelect.isOpen) {
      closeCustomSelect(customSelect);
      return;
    }

    openCustomSelect(customSelect);
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openCustomSelect(customSelect, customSelect.selectedIndex >= 0 ? customSelect.selectedIndex : 0);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openCustomSelect(
        customSelect,
        customSelect.selectedIndex >= 0 ? customSelect.selectedIndex : customSelect.optionData.length - 1
      );
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (customSelect.isOpen) {
        closeCustomSelect(customSelect);
      } else {
        openCustomSelect(customSelect);
      }
      return;
    }

    if (event.key === "Escape") {
      closeCustomSelect(customSelect);
    }
  });

  select.addEventListener("change", () => {
    syncCustomSelect(select);
  });

  const observer = new MutationObserver(() => {
    syncCustomSelect(select);
  });

  observer.observe(select, {
    childList: true,
    subtree: true,
    characterData: true
  });

  syncCustomSelect(select);
}

function initializeCustomSelects() {
  [
    elements.minecraftVersionSelect,
    elements.fabricLoaderSelect,
    elements.languageSelect,
    elements.javaGcProfileSelect,
    elements.modCategorySelect,
    elements.modSortSelect,
    elements.modInstallTarget,
    elements.selectedModState
  ].forEach(initializeCustomSelect);

  if (customSelectEventsBound) {
    return;
  }

  document.addEventListener("click", (event) => {
    if ([...customSelectRegistry.values()].some((customSelect) => customSelect.shell.contains(event.target))) {
      return;
    }

    closeAllCustomSelects();
  });

  window.addEventListener("resize", () => {
    closeAllCustomSelects();
  });

  window.addEventListener("scroll", () => {
    closeAllCustomSelects();
  });

  customSelectEventsBound = true;
}

function relocateModdingToolbars() {
  const browserPanel = document.querySelector('[data-modding-mode-panel="browser"]');
  const browserSidebar = browserPanel?.querySelector(".modding-sidebar-card");
  const browserResultsCard = browserPanel?.querySelector(".modding-results-card");
  const browserResults = browserPanel?.querySelector("#mod-search-results");

  if (browserSidebar && browserResultsCard && browserResults) {
    const searchForm = browserSidebar.querySelector(".launcher-form");
    const browserDetails = browserSidebar.querySelector(".modding-sidebar-details");
    const browserPaging = browserResultsCard.querySelector(".mod-browser-paging");
    const browserControls = document.createElement("div");

    browserControls.className = "modding-inline-controls";

    if (searchForm) {
      searchForm.classList.add("modding-inline-form");
      searchForm.querySelector(".mod-search-stack")?.classList.add("mod-search-row");
      browserControls.append(searchForm);
    }

    if (browserPaging) {
      browserPaging.classList.add("mod-browser-paging-toolbar");

      if (browserDetails) {
        browserDetails.classList.add("modding-toolbar-meta");
        browserPaging.prepend(browserDetails);
      }
    }

    browserResultsCard.insertBefore(browserControls, browserResults);
    if (browserPaging) {
      browserResultsCard.append(browserPaging);
    }
    browserSidebar.remove();
  }

  const packagePanel = document.querySelector('[data-modding-mode-panel="package"]');
  const packageSidebar = packagePanel?.querySelector(".modding-sidebar-card");
  const packageResultsCard = packagePanel?.querySelector(".modding-results-card");
  const selectedMods = packagePanel?.querySelector("#selected-mods");

  if (packageSidebar && packageResultsCard && selectedMods) {
    const packageDetails = packageSidebar.querySelector(".modding-sidebar-details");
    const packageControls = document.createElement("div");

    packageControls.className = "modding-inline-controls";

    if (packageDetails) {
      packageDetails.classList.add("modding-toolbar-meta");
      packageControls.append(packageDetails);
    }

    packageResultsCard.insertBefore(packageControls, selectedMods);
    packageSidebar.remove();
  }
}

function attachImageFallback(image) {
  if (!image) {
    return;
  }

  image.addEventListener("error", () => {
    const fallback = image.dataset.fallback || "./logo.png";

    if (image.src.endsWith(fallback)) {
      return;
    }

    image.src = fallback;
  });
}

function closeMobileMenu() {
  if (!elements.navCenter) {
    return;
  }

  elements.navCenter.classList.remove("is-open");
}

function tabNeedsModdingState(tabId) {
  return tabId === "launcher" || tabId === "modding" || tabId === "settings";
}

function getActiveModdingContentConfig() {
  return moddingContentConfigs[state.activeModdingContentType] || moddingContentConfigs.mod;
}

function getSelectedContentSearchQuery(projectType = state.activeModdingContentType) {
  return state.selectedContentSearchQuery?.[projectType] || "";
}

function setSelectedContentSearchQuery(query, projectType = state.activeModdingContentType) {
  state.selectedContentSearchQuery = {
    ...state.selectedContentSearchQuery,
    [projectType]: String(query || "")
  };
}

function getSelectedProjects(projectType = state.activeModdingContentType, source = state.config?.modding) {
  const config = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  return source?.[config.selectionKey] || [];
}

function getSelectedProjectSearchText(project) {
  return [
    project?.title,
    project?.projectId,
    project?.slug,
    project?.description,
    project?.localFileName,
    project?.linkedProjectId,
    project?.linkedProjectSlug,
    getSelectedVersionLabel(project)
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("de-DE");
}

function filterSelectedProjects(projects, query) {
  const normalizedQuery = String(query || "").trim().toLocaleLowerCase("de-DE");

  if (!normalizedQuery) {
    return projects;
  }

  return projects.filter((project) => getSelectedProjectSearchText(project).includes(normalizedQuery));
}

function getActiveProfileSlug() {
  return String(state.config?.profile?.slug || "").trim();
}

function getProjectLocalFileName(project) {
  return String(project?.localFileName || project?.localImportFileNames?.[0] || "").trim();
}

function normalizeProjectReference(value) {
  return String(value || "").trim().toLowerCase();
}

function toLocalProjectReference(localFileName, projectType = state.activeModdingContentType) {
  const normalizedFileName = String(localFileName || "").trim().split(/[\\/]/).pop().toLowerCase();
  const normalizedProjectType = String(projectType || "mod").trim() || "mod";

  return normalizedFileName ? `local:${normalizedProjectType}:${normalizedFileName}` : "";
}

function buildProjectReferenceSet(project) {
  const references = new Set();

  [
    project?.projectId,
    project?.slug,
    project?.linkedProjectId,
    project?.linkedProjectSlug
  ].forEach((value) => {
    const normalized = normalizeProjectReference(value);

    if (normalized) {
      references.add(normalized);
    }
  });

  return references;
}

function projectMatchesReference(project, references) {
  if (!references?.size) {
    return false;
  }

  return [...buildProjectReferenceSet(project)].some((reference) => references.has(reference));
}

function getProjectInstallationState(projectReference, projectType = state.activeModdingContentType) {
  const selectedProjects = getSelectedProjects(projectType);
  const projectReferences =
    typeof projectReference === "string"
      ? buildProjectReferenceSet({
          projectId: projectReference
        })
      : buildProjectReferenceSet(projectReference);
  const selectedProject = selectedProjects.find(
    (project) => !project.isLocalOnly && projectMatchesReference(project, projectReferences)
  );
  const isManagedInstalled = Boolean(selectedProject);
  const importedProject = selectedProjects.find(
    (project) => project.isLocalOnly && projectMatchesReference(project, projectReferences)
  );
  const isImportedInstalled = Boolean(importedProject);

  return {
    selectedProject: selectedProject || null,
    importedProject: importedProject || null,
    isManagedInstalled,
    isImportedInstalled,
    isInstalled: isManagedInstalled || isImportedInstalled
  };
}

function resolveProjectActionReference(projectOrId, projectType = state.activeModdingContentType) {
  if (projectOrId && typeof projectOrId === "object") {
    const resolvedProjectId = String(projectOrId.projectId || "").trim();
    const projectReference = {
      ...projectOrId,
      projectId: resolvedProjectId,
      projectType: projectOrId.projectType || projectType
    };

    return {
      projectId: resolvedProjectId,
      projectReference,
      projectReferences: buildProjectReferenceSet(projectReference)
    };
  }

  const projectId = String(projectOrId || "").trim();
  const projectReference =
    state.searchResults.find(
      (entry) => String(entry?.projectId || "").trim() === projectId && (entry.projectType || projectType) === projectType
    ) ||
    (
      state.activeModDetail &&
      String(state.activeModDetail.projectId || "").trim() === projectId &&
      (state.activeModDetail.projectType || projectType) === projectType
        ? state.activeModDetail
        : null
    ) ||
    (
      state.activeModPreview &&
      String(state.activeModPreview.projectId || "").trim() === projectId &&
      (state.activeModPreview.projectType || projectType) === projectType
        ? state.activeModPreview
        : null
    ) || {
      projectId,
      projectType
    };

  return {
    projectId,
    projectReference,
    projectReferences: buildProjectReferenceSet(projectReference)
  };
}

function buildOptimisticSelectedProject(projectReference, projectType = state.activeModdingContentType, version = null) {
  const fallbackTitle = String(
    projectReference?.title || projectReference?.slug || projectReference?.projectId || "Projekt"
  ).trim();

  return {
    projectId: String(projectReference?.projectId || "").trim(),
    slug: projectReference?.slug || null,
    title: projectReference?.title || fallbackTitle,
    description: projectReference?.description || null,
    iconUrl: projectReference?.iconUrl || null,
    projectType: projectReference?.projectType || projectType,
    clientSide: projectReference?.clientSide || projectReference?.client_side || null,
    serverSide: projectReference?.serverSide || projectReference?.server_side || null,
    manualSelection: true,
    versionId: version?.id || projectReference?.versionId || null,
    versionNumber: version?.versionNumber || projectReference?.versionNumber || null,
    versionName: version?.name || projectReference?.versionName || null,
    versionType: version?.versionType || projectReference?.versionType || null
  };
}

function getPendingProjectOperationReferences(projectReference, projectType = state.activeModdingContentType) {
  const normalizedProjectType = String(projectType || state.activeModdingContentType || "mod");

  if (projectReference?.isLocalOnly || getProjectLocalFileName(projectReference)) {
    const localFileName = getProjectLocalFileName(projectReference);

    return {
      projectType: normalizedProjectType,
      localFileName,
      references: localFileName ? [toLocalProjectReference(localFileName, normalizedProjectType)] : []
    };
  }

  const { projectReferences } = resolveProjectActionReference(projectReference, normalizedProjectType);

  return {
    projectType: normalizedProjectType,
    localFileName: "",
    references: [...projectReferences]
  };
}

function beginPendingProjectOperation(action, projectReference, projectType = state.activeModdingContentType) {
  const operation = {
    action,
    ...getPendingProjectOperationReferences(projectReference, projectType),
    startedAt: Date.now()
  };

  state.pendingProjectOperations = [
    ...state.pendingProjectOperations.filter((entry) => {
      if (entry.projectType !== operation.projectType) {
        return true;
      }

      if (operation.localFileName) {
        return String(entry.localFileName || "").trim().toLowerCase() !== operation.localFileName.toLowerCase();
      }

      const referenceSet = new Set(operation.references);
      return !(entry.references || []).some((reference) => referenceSet.has(reference));
    }),
    operation
  ];

  return operation;
}

function completePendingProjectOperation(operation) {
  if (!operation) {
    return;
  }

  state.pendingProjectOperations = state.pendingProjectOperations.filter((entry) => entry !== operation);
}

function getPendingProjectOperation(projectReference, projectType = state.activeModdingContentType) {
  const normalizedProjectType = String(projectType || state.activeModdingContentType || "mod");
  const localFileName = String(projectReference?.localFileName || "").trim().toLowerCase();
  const referenceSet = buildProjectReferenceSet(projectReference);

  return [...state.pendingProjectOperations].reverse().find((entry) => {
    if (entry.projectType !== normalizedProjectType) {
      return false;
    }

    if (localFileName && String(entry.localFileName || "").trim().toLowerCase() === localFileName) {
      return true;
    }

    return (entry.references || []).some((reference) => referenceSet.has(reference));
  }) || null;
}

function getQueuedProjectOperation(projectReference, projectType = state.activeModdingContentType) {
  const normalizedProjectType = String(projectType || state.activeModdingContentType || "mod");
  const localFileName = String(projectReference?.localFileName || "").trim().toLowerCase();
  const referenceSet = buildProjectReferenceSet(projectReference);

  return [...state.queuedProjectOperations].reverse().find((entry) => {
    if (entry.projectType !== normalizedProjectType) {
      return false;
    }

    if (localFileName && String(entry.localFileName || "").trim().toLowerCase() === localFileName) {
      return true;
    }

    return (entry.references || []).some((reference) => referenceSet.has(reference));
  }) || null;
}

function clearQueuedProjectOperation(projectReference, projectType = state.activeModdingContentType) {
  const queuedOperation = getQueuedProjectOperation(projectReference, projectType);

  if (!queuedOperation) {
    return null;
  }

  state.queuedProjectOperations = state.queuedProjectOperations.filter((entry) => entry !== queuedOperation);
  return queuedOperation;
}

function queueProjectOperation(action, projectReference, projectType = state.activeModdingContentType, options = {}) {
  const operation = {
    action,
    version: options.version || null,
    animateSelection: options.animateSelection !== false,
    projectReference,
    ...getPendingProjectOperationReferences(projectReference, projectType),
    queuedAt: Date.now()
  };

  state.queuedProjectOperations = [
    ...state.queuedProjectOperations.filter((entry) => {
      if (entry.projectType !== operation.projectType) {
        return true;
      }

      if (operation.localFileName) {
        return String(entry.localFileName || "").trim().toLowerCase() !== operation.localFileName.toLowerCase();
      }

      const referenceSet = new Set(operation.references);
      return !(entry.references || []).some((reference) => referenceSet.has(reference));
    }),
    operation
  ];

  return operation;
}

function isSameQueuedAddVersion(leftVersion, rightVersion) {
  const leftVersionId = String(leftVersion?.id || leftVersion?.versionId || "").trim();
  const rightVersionId = String(rightVersion?.id || rightVersion?.versionId || "").trim();

  if (leftVersionId || rightVersionId) {
    return leftVersionId === rightVersionId;
  }

  return String(leftVersion?.versionNumber || "").trim() === String(rightVersion?.versionNumber || "").trim();
}

function shouldKeepCurrentProjectOperation(pendingOperation, action, options = {}) {
  if (!pendingOperation || pendingOperation.action !== action) {
    return false;
  }

  if (action !== "add") {
    return true;
  }

  return isSameQueuedAddVersion(pendingOperation.version, options.version);
}

function handleProjectOperationWhilePending(pendingOperation, action, projectReference, projectType, options = {}) {
  if (!pendingOperation) {
    return false;
  }

  if (shouldKeepCurrentProjectOperation(pendingOperation, action, options)) {
    clearQueuedProjectOperation(projectReference, projectType);
    renderProjectSelectionViews();
    return true;
  }

  queueProjectOperation(action, projectReference, projectType, options);
  renderProjectSelectionViews();
  return true;
}

function runQueuedProjectOperation(operation) {
  if (!operation) {
    return;
  }

  if (operation.action === "add") {
    void handleAddProject(operation.projectReference || operation, operation.projectType, operation.version || null);
    return;
  }

  if (operation.action === "remove") {
    void handleRemoveProject(operation.projectReference || operation, operation.projectType, {
      animateSelection: operation.animateSelection !== false
    });
    return;
  }

  if (operation.action === "remove-local") {
    void handleRemoveLocalProject(operation.projectReference || operation);
  }
}

function finalizeProjectOperation(operation, projectReference, projectType = state.activeModdingContentType) {
  completePendingProjectOperation(operation);
  const queuedOperation = clearQueuedProjectOperation(projectReference, projectType);
  renderProjectSelectionViews();

  if (queuedOperation) {
    window.setTimeout(() => {
      runQueuedProjectOperation(queuedOperation);
    }, 0);
  }
}

function hasPendingProjectOperations() {
  return state.pendingProjectOperations.length > 0;
}

function rollbackAddedProject(projectReference, projectType = state.activeModdingContentType) {
  const { projectReferences } = resolveProjectActionReference(projectReference, projectType);
  const nextSelection = getSelectedProjects(projectType).filter(
    (entry) => entry.isLocalOnly || !projectMatchesReference(entry, projectReferences)
  );

  setSelectedProjectsForType(projectType, nextSelection);
  if (state.config?.modding) {
    syncActiveProfileSelectionCounts(state.config.modding);
  }
}

function rollbackRemovedProject(previousSelection, projectReference, projectType = state.activeModdingContentType) {
  const { projectReferences } = resolveProjectActionReference(projectReference, projectType);
  const previousProject = (previousSelection || []).find(
    (entry) => !entry.isLocalOnly && projectMatchesReference(entry, projectReferences)
  );

  if (!previousProject) {
    return;
  }

  const currentSelection = getSelectedProjects(projectType);
  const alreadyPresent = currentSelection.some(
    (entry) => !entry.isLocalOnly && projectMatchesReference(entry, projectReferences)
  );

  if (alreadyPresent) {
    return;
  }

  setSelectedProjectsForType(projectType, [...currentSelection, previousProject]);
  if (state.config?.modding) {
    syncActiveProfileSelectionCounts(state.config.modding);
  }
}

function getTotalSelectedProjectCount(source = state.config?.modding) {
  return Object.keys(moddingContentConfigs).reduce(
    (total, projectType) => total + getSelectedProjects(projectType, source).length,
    0
  );
}

function getSelectionCounts(source = state.config?.modding) {
  const mod = getSelectedProjects("mod", source).length;
  const resourcepack = getSelectedProjects("resourcepack", source).length;
  const shader = getSelectedProjects("shader", source).length;

  return {
    mod,
    resourcepack,
    shader,
    total: mod + resourcepack + shader
  };
}

function getInstalledSelectionSnapshot(installState = state.config?.installState) {
  return {
    selectedMods: installState?.displaySelectedMods || installState?.selectedMods || [],
    selectedResourcePacks:
      installState?.displaySelectedResourcePacks || installState?.selectedResourcePacks || [],
    selectedShaderPacks:
      installState?.displaySelectedShaderPacks || installState?.selectedShaderPacks || []
  };
}

function getSelectedProjectComparisonKey(project) {
  if (project?.isLocalOnly) {
    return `local:${String(
      project.localFileName || project.localPath || project.projectId || project.title || ""
    ).trim().toLowerCase()}`;
  }

  return `managed:${String(project?.projectId || project?.slug || project?.title || "").trim().toLowerCase()}@${String(
    project?.versionId || project?.versionNumber || ""
  ).trim().toLowerCase()}`;
}

function getSelectionChangeStats(
  currentSource = state.config?.modding,
  installedSource = getInstalledSelectionSnapshot()
) {
  const currentKeys = new Set();
  const installedKeys = new Set();

  Object.keys(moddingContentConfigs).forEach((projectType) => {
    getSelectedProjects(projectType, currentSource).forEach((project) => {
      currentKeys.add(getSelectedProjectComparisonKey(project));
    });
    getSelectedProjects(projectType, installedSource).forEach((project) => {
      installedKeys.add(getSelectedProjectComparisonKey(project));
    });
  });

  let added = 0;
  let removed = 0;

  currentKeys.forEach((entry) => {
    if (!installedKeys.has(entry)) {
      added += 1;
    }
  });
  installedKeys.forEach((entry) => {
    if (!currentKeys.has(entry)) {
      removed += 1;
    }
  });

  return {
    added,
    removed,
    total: added + removed
  };
}

function formatCountLabel(count, singular, plural) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

function formatSelectionBreakdown(counts) {
  const parts = [];

  if (counts.mod) {
    parts.push(formatCountLabel(counts.mod, "Mod", "Mods"));
  }

  if (counts.resourcepack) {
    parts.push(formatCountLabel(counts.resourcepack, "Resource Pack", "Resource Packs"));
  }

  if (counts.shader) {
    parts.push(formatCountLabel(counts.shader, "Shader Pack", "Shader Packs"));
  }

  return parts.length ? parts.join(", ") : "keine Inhalte";
}

function formatSelectionChangeSummary(changeStats) {
  if (!changeStats.total) {
    return "Keine ausstehenden Änderungen.";
  }

  const parts = [];

  if (changeStats.added) {
    parts.push(formatCountLabel(changeStats.added, "Inhalt hinzugefügt", "Inhalte hinzugefügt"));
  }

  if (changeStats.removed) {
    parts.push(formatCountLabel(changeStats.removed, "Inhalt entfernt", "Inhalte entfernt"));
  }

  return `Änderungen seit letzter Installation: ${parts.join(", ")}.`;
}

function syncActiveProfileSelectionCounts(source = state.config?.modding) {
  if (!Array.isArray(state.config?.profiles)) {
    return;
  }

  const counts = getSelectionCounts(source);
  state.config.profiles = state.config.profiles.map((profile) =>
    profile?.isActive
      ? {
          ...profile,
          selectedModsCount: counts.mod,
          selectedResourcePacksCount: counts.resourcepack,
          selectedShaderPacksCount: counts.shader
        }
      : profile
  );
}

function getAvailableCategoriesForActiveType() {
  const activeType = state.activeModdingContentType;
  return state.config?.modding?.availableCategoriesByType?.[activeType] || [];
}

function getPendingProjectMergeKey(project) {
  const projectType = String(project?.projectType || state.activeModdingContentType || "mod");
  const nonLocalReferences = [...buildProjectReferenceSet(project)]
    .filter((reference) => !reference.startsWith("local:"))
    .sort((left, right) => left.localeCompare(right));

  if (nonLocalReferences.length) {
    return `${projectType}:linked:${nonLocalReferences[0]}`;
  }

  if (project?.isLocalOnly) {
    return `${projectType}:local:${String(
      project.localFileName || project.projectId || project.title || ""
    ).trim().toLowerCase()}`;
  }

  return `${projectType}:managed:${String(
    project?.projectId || project?.slug || project?.title || ""
  ).trim().toLowerCase()}`;
}

function mergePendingProjectSelections(previousProjects, nextProjects) {
  const previousSelection = Array.isArray(previousProjects) ? previousProjects : [];
  const nextSelection = Array.isArray(nextProjects) ? nextProjects : [];
  const previousByKey = new Map(
    previousSelection.map((project) => [getPendingProjectMergeKey(project), project])
  );
  const mergedProjects = nextSelection.map((project) => {
    const previousProject = previousByKey.get(getPendingProjectMergeKey(project));

    if (!previousProject) {
      return project;
    }

    return {
      ...previousProject,
      ...project
    };
  });
  const mergedKeys = new Set(mergedProjects.map((project) => getPendingProjectMergeKey(project)));
  const preserveAllPreviousProjects = hasPendingProjectOperations();

  previousSelection.forEach((project) => {
    if (!preserveAllPreviousProjects && !project?.isLocalOnly) {
      return;
    }

    const mergeKey = getPendingProjectMergeKey(project);

    if (!mergedKeys.has(mergeKey)) {
      mergedProjects.push(project);
      mergedKeys.add(mergeKey);
    }
  });

  return mergedProjects;
}

function mergeDisplayedSelectedProjects(projectType, managedProjects) {
  const nextManagedProjects = Array.isArray(managedProjects) ? managedProjects : [];
  const localProjects = getSelectedProjects(projectType).filter((project) => project?.isLocalOnly);
  const mergedProjects = [...nextManagedProjects];
  const mergedKeys = new Set(nextManagedProjects.map((project) => getPendingProjectMergeKey(project)));

  localProjects.forEach((project) => {
    const mergeKey = getPendingProjectMergeKey(project);

    if (!mergedKeys.has(mergeKey)) {
      mergedProjects.push(project);
      mergedKeys.add(mergeKey);
    }
  });

  return mergedProjects;
}

function mergePendingModdingState(previousModding, nextModding) {
  if (!previousModding || !nextModding?.loading) {
    return nextModding;
  }

  const previousMinecraftVersions = previousModding.availableMinecraftVersions || [];
  const nextMinecraftVersions = nextModding.availableMinecraftVersions || [];
  const previousFabricLoaders = previousModding.availableFabricLoaders || [];
  const nextFabricLoaders = nextModding.availableFabricLoaders || [];
  const previousCategories = previousModding.availableCategoriesByType || {};
  const nextCategories = nextModding.availableCategoriesByType || {};

  return {
    ...nextModding,
    availableMinecraftVersions:
      previousMinecraftVersions.length > nextMinecraftVersions.length
        ? previousMinecraftVersions
        : nextMinecraftVersions,
    availableFabricLoaders:
      previousModding.minecraftVersion === nextModding.minecraftVersion &&
      previousFabricLoaders.length > nextFabricLoaders.length
        ? previousFabricLoaders
        : nextFabricLoaders,
    availableCategoriesByType: {
      mod: (nextCategories.mod || []).length ? nextCategories.mod : previousCategories.mod || [],
      resourcepack:
        (nextCategories.resourcepack || []).length
          ? nextCategories.resourcepack
          : previousCategories.resourcepack || [],
      shader:
        (nextCategories.shader || []).length
          ? nextCategories.shader
          : previousCategories.shader || []
    },
    selectedMods: mergePendingProjectSelections(previousModding.selectedMods, nextModding.selectedMods),
    selectedResourcePacks: mergePendingProjectSelections(
      previousModding.selectedResourcePacks,
      nextModding.selectedResourcePacks
    ),
    selectedShaderPacks: mergePendingProjectSelections(
      previousModding.selectedShaderPacks,
      nextModding.selectedShaderPacks
    )
  };
}

function stableSerializeComparisonValue(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerializeComparisonValue(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => `${JSON.stringify(key)}:${stableSerializeComparisonValue(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sameRenderedModdingState(left, right) {
  return stableSerializeComparisonValue(left ?? null) === stableSerializeComparisonValue(right ?? null);
}

function switchTab(tabId) {
  const didTabChange = state.activeTab !== tabId;
  state.activeTab = tabId;
  document.body.dataset.activeTab = tabId;

  if (tabId !== "modding" && !elements.modDetailModal.hidden) {
    closeModDetailModal();
  }

  if (state.importBrowser.open) {
    closeProfileImportModal();
  }

  if (isProfileDeleteModalOpen()) {
    closeProfileDeleteModal();
  }

  elements.tabButtons.forEach((button) => {
    const isActive = button.dataset.tabTarget === tabId;
    button.classList.toggle("is-active", isActive);

    if (button.classList.contains("tab-button")) {
      button.setAttribute("aria-selected", String(isActive));
    }
  });

  elements.tabPanels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === tabId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  if (didTabChange) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  closeMobileMenu();

  if (tabId === "modding") {
    renderModdingModeState();
    hydrateModdingState();
    return;
  }

  if (tabNeedsModdingState(tabId) && state.config?.modding?.loading) {
    hydrateModdingState();
  }
}

function applyLauncherBackground() {
  const background = state.config?.settings?.launcherBackground || null;
  const backgroundUrl = String(background?.fileUrl || "").trim();
  const hasBackground = Boolean(backgroundUrl);

  document.body.classList.toggle("has-launcher-background", hasBackground);

  if (elements.bgAnimation) {
    if (hasBackground) {
      elements.bgAnimation.style.setProperty("--launcher-background-image", `url("${backgroundUrl}")`);
    } else {
      elements.bgAnimation.style.removeProperty("--launcher-background-image");
    }
  }

  if (elements.launcherBackgroundPreview) {
    elements.launcherBackgroundPreview.dataset.hasImage = String(hasBackground);
    elements.launcherBackgroundPreview.style.backgroundImage = hasBackground
      ? `url("${backgroundUrl}")`
      : "";
  }

  if (elements.launcherBackgroundPreviewLabel) {
    elements.launcherBackgroundPreviewLabel.textContent = hasBackground
      ? "Aktives Hintergrundbild"
      : "Kein Bild aktiv";
  }

  if (elements.launcherBackgroundStatus) {
    elements.launcherBackgroundStatus.textContent = hasBackground
      ? ""
      : "Kein Hintergrundbild ausgewählt.";
  }

  if (elements.launcherBackgroundRemoveButton) {
    elements.launcherBackgroundRemoveButton.disabled = state.isBusy || !hasBackground;
  }
}

function getModdingBrowserSummary() {
  const contentConfig = getActiveModdingContentConfig();

  if (state.searchLoading && !state.searchHasRun) {
    return "Lade Vorschläge...";
  }

  if (!state.searchHasRun) {
    return `${contentConfig.label} suchen und filtern`;
  }

  if (!state.searchResults.length) {
    return state.searchPagination.totalHits
      ? `${formatNumber(state.searchPagination.totalHits)} Treffer`
      : "Keine Treffer";
  }

  const rangeStart = state.searchPagination.offset + 1;
  const rangeEnd = state.searchPagination.offset + state.searchResults.length;
  return `${rangeStart}-${rangeEnd} von ${formatNumber(state.searchPagination.totalHits)}`;
}

function getLocalImportHint(projectType = state.activeModdingContentType) {
  if (projectType === "resourcepack" || projectType === "shader") {
    return "ZIP-Dateien oder Ordner auswählen oder direkt hier hineinziehen.";
  }

  return "JAR- oder ZIP-Dateien auswählen oder direkt hier hineinziehen.";
}

function getLocalImportButtonLabel(projectType = state.activeModdingContentType) {
  return projectType === "mod" ? "Dateien wählen" : "Dateien oder Ordner wählen";
}

function hasTransferredFiles(event) {
  return Array.from(event?.dataTransfer?.types || []).includes("Files");
}

function getTransferredPaths(event) {
  return Array.from(event?.dataTransfer?.files || [])
    .map((file) => String(file?.path || "").trim())
    .filter(Boolean);
}

function setLocalImportSurfaceActive(isActive) {
  if (!elements.localImportSurface) {
    return;
  }

  elements.localImportSurface.dataset.dragActive = String(Boolean(isActive));
}

function renderModdingModeState() {
  const contentConfig = getActiveModdingContentConfig();
  const selectedProjects = getSelectedProjects();
  const totalSelectedProjects = getTotalSelectedProjectCount();
  const activeMode = state.activeModdingMode || "package";

  if (state.activeModdingMode !== activeMode) {
    state.activeModdingMode = activeMode;
  }

  if (elements.moddingBrowserSummary) {
    elements.moddingBrowserSummary.textContent = getModdingBrowserSummary();
  }

  if (elements.moddingPackageSummary) {
    elements.moddingPackageSummary.textContent = totalSelectedProjects
      ? `${formatNumber(totalSelectedProjects)} Inhalte ausgewählt`
      : "Mods, Resource Packs und Shader Packs verwalten";
    /*
      ? `${formatNumber(selectedMods.length)} Mods ausgewählt`
      : "Ausgewählte Mods verwalten";
  }

    */
  }
  if (elements.moddingBrowserHeading) {
    elements.moddingBrowserHeading.textContent = contentConfig.browserTitle;
  }

  if (elements.selectedContentHeading) {
    elements.selectedContentHeading.textContent = "Aktive Auswahl";
  }

  if (elements.selectedContentListHeading) {
    elements.selectedContentListHeading.textContent = contentConfig.packageTitle;
  }

  if (elements.localImportTitle) {
    elements.localImportTitle.textContent = `${contentConfig.label} importieren`;
  }

  if (elements.localImportHint) {
    elements.localImportHint.textContent = getLocalImportHint(contentConfig.projectType);
  }

  if (elements.localImportButtonLabel) {
    elements.localImportButtonLabel.textContent = getLocalImportButtonLabel(contentConfig.projectType);
  }

  if (elements.modSearchLabel) {
    elements.modSearchLabel.textContent = contentConfig.searchLabel;
  }

  if (elements.modSearchInput) {
    elements.modSearchInput.placeholder = contentConfig.searchPlaceholder;
  }

  if (elements.selectedContentSearchInput) {
    const selectedContentSearchQuery = getSelectedContentSearchQuery(contentConfig.projectType);
    elements.selectedContentSearchInput.placeholder = `${contentConfig.label} im Paket durchsuchen`;

    if (elements.selectedContentSearchInput.value !== selectedContentSearchQuery) {
      elements.selectedContentSearchInput.value = selectedContentSearchQuery;
    }
  }

  if (elements.modInstallTarget) {
    setSelectValue(elements.modInstallTarget, contentConfig.projectType);
  }

  if (elements.selectedModState) {
    setSelectValue(elements.selectedModState, contentConfig.projectType);
  }

  if (elements.selectedModTotal) {
    elements.selectedModTotal.textContent = String(selectedProjects.length);
  }

  elements.moddingModeButtons.forEach((button) => {
    const isActive = button.dataset.moddingModeTarget === activeMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  elements.moddingContentButtons.forEach((button) => {
    const isActive = button.dataset.moddingContentTarget === state.activeModdingContentType;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  elements.moddingModePanels.forEach((panel) => {
    panel.hidden = panel.dataset.moddingModePanel !== activeMode;
  });

  if (elements.moddingModeEmpty) {
    elements.moddingModeEmpty.hidden = Boolean(activeMode);
  }
}

function switchModdingMode(mode) {
  if (!mode || state.activeModdingMode === mode) {
    return;
  }

  state.activeModdingMode = mode;
  renderModdingModeState();

  if (mode === "browser") {
    void ensureInitialModSearchResults();
  }
}

function switchModdingContentType(projectType) {
  if (!projectType || !moddingContentConfigs[projectType] || state.activeModdingContentType === projectType) {
    return;
  }

  state.activeModdingContentType = projectType;
  state.searchResults = [];
  state.searchHasRun = false;
  state.searchLoading = false;
  state.searchPagination = {
    limit: 12,
    offset: 0,
    totalHits: 0
  };
  state.browseFilters.category = "all";
  state.activeModPreview = null;
  state.activeModDetail = null;
  state.activeModDetailCacheKey = null;
  renderModdingState();

  if (state.activeModdingMode === "browser") {
    void ensureInitialModSearchResults();
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeExternalUrl(value) {
  invalidateModdingStateHydration();
  try {
    const parsed = new URL(String(value || "").trim());

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {}

  return null;
}

function sanitizeMarkdownSource(value, fallback = "Keine Detailbeschreibung verfügbar.") {
  const text = String(value || "")
    .replace(/\r/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|blockquote|pre)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text || fallback;
}

function renderMarkdownInline(value) {
  const placeholders = [];
  const createPlaceholder = (html) => {
    const token = `@@MD_${placeholders.length}@@`;
    placeholders.push(html);
    return token;
  };

  let rendered = String(value || "");

  rendered = rendered.replace(/`([^`\n]+)`/g, (_, code) => createPlaceholder(`<code>${escapeHtml(code)}</code>`));
  rendered = rendered.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g, (_, altText, url) => {
    const safeUrl = sanitizeExternalUrl(url);

    if (!safeUrl) {
      return escapeHtml(altText || "Bild");
    }

    return createPlaceholder(
      `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">${escapeHtml((altText || "Bild").trim())}</a>`
    );
  });
  rendered = rendered.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, url) => {
    const safeUrl = sanitizeExternalUrl(url);

    if (!safeUrl) {
      return escapeHtml(label);
    }

    return createPlaceholder(
      `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">${escapeHtml(label.trim() || safeUrl)}</a>`
    );
  });

  rendered = escapeHtml(rendered)
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>")
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(?=\S)([\s\S]*?\S)\*/g, "<em>$1</em>")
    .replace(/(https?:\/\/[^\s<]+)/g, (match) => {
      const trimmed = match.replace(/[),.;!?]+$/, "");
      const suffix = match.slice(trimmed.length);
      const safeUrl = sanitizeExternalUrl(trimmed);

      if (!safeUrl) {
        return match;
      }

      return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">${escapeHtml(trimmed)}</a>${suffix}`;
    });

  return rendered.replace(/@@MD_(\d+)@@/g, (_, index) => placeholders[Number(index)] || "");
}

function renderMarkdownParagraph(lines) {
  return lines
    .map((line, index) => {
      const hardBreak = /(?: {2,}|\\)$/.test(line);
      const normalized = hardBreak ? line.replace(/(?: {2,}|\\)$/, "") : line.trim();
      const spacer = index < lines.length - 1 ? (hardBreak ? "<br>" : " ") : "";
      return `${renderMarkdownInline(normalized)}${spacer}`;
    })
    .join("");
}

function splitMarkdownTableCells(line) {
  const trimmed = String(line || "").trim();

  if (!trimmed) {
    return [];
  }

  const normalized = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let current = "";

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    const nextCharacter = normalized[index + 1];

    if (character === "\\" && nextCharacter === "|") {
      current += "|";
      index += 1;
      continue;
    }

    if (character === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());

  return cells;
}

function isMarkdownTableSeparator(line) {
  const cells = splitMarkdownTableCells(line);

  return Boolean(cells.length) && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isMarkdownTableRow(line) {
  const cells = splitMarkdownTableCells(line);

  return cells.length >= 2 && cells.some((cell) => cell.length);
}

function startsMarkdownTable(lines, index) {
  if (index + 1 >= lines.length) {
    return false;
  }

  return isMarkdownTableRow(lines[index]) && isMarkdownTableSeparator(lines[index + 1]);
}

function getMarkdownTableAlignments(line) {
  return splitMarkdownTableCells(line).map((cell) => {
    const trimmed = cell.trim();
    const alignLeft = trimmed.startsWith(":");
    const alignRight = trimmed.endsWith(":");

    if (alignLeft && alignRight) {
      return "center";
    }

    if (alignRight) {
      return "right";
    }

    if (alignLeft) {
      return "left";
    }

    return "";
  });
}

function renderMarkdownTable(headerLine, separatorLine, bodyLines) {
  const headerCells = splitMarkdownTableCells(headerLine);
  const alignments = getMarkdownTableAlignments(separatorLine);
  const columnCount = Math.max(headerCells.length, alignments.length);
  const normalizeCells = (cells) => {
    const normalized = cells.slice(0, columnCount);

    while (normalized.length < columnCount) {
      normalized.push("");
    }

    return normalized;
  };
  const renderCell = (tagName, content, alignment, index) => {
    const classes = ["mod-detail-table-cell"];

    if (tagName === "th") {
      classes.push("mod-detail-table-head");
    }

    if (alignment) {
      classes.push(`align-${alignment}`);
    }

    return `<${tagName} class="${classes.join(" ")}" data-column="${index + 1}">${renderMarkdownInline(content)}</${tagName}>`;
  };
  const headerHtml = normalizeCells(headerCells)
    .map((cell, index) => renderCell("th", cell, alignments[index] || "", index))
    .join("");
  const rowsHtml = bodyLines
    .map((line) => normalizeCells(splitMarkdownTableCells(line)))
    .map(
      (cells) =>
        `<tr>${cells.map((cell, index) => renderCell("td", cell, alignments[index] || "", index)).join("")}</tr>`
    )
    .join("");

  return [
    '<div class="mod-detail-table-wrap">',
    '<table class="mod-detail-table">',
    `<thead><tr>${headerHtml}</tr></thead>`,
    `<tbody>${rowsHtml}</tbody>`,
    "</table>",
    "</div>"
  ].join("");
}

function isMarkdownBlockStart(line) {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^```/.test(line.trim()) ||
    /^>\s?/.test(line) ||
    /^\s*[-+*]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)
  );
}

function renderMarkdownHtml(value, fallback = "Keine Detailbeschreibung verfügbar.") {
  const source = sanitizeMarkdownSource(value, "").trim();

  if (!source) {
    return fallback ? `<p>${escapeHtml(fallback)}</p>` : "";
  }

  const lines = source.split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^```/.test(line.trim())) {
      const codeLines = [];
      index += 1;

      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = Math.min(6, headingMatch[1].length);
      blocks.push(`<h${level}>${renderMarkdownInline(headingMatch[2].trim())}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      blocks.push("<hr>");
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];

      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push(`<blockquote>${renderMarkdownHtml(quoteLines.join("\n"), "")}</blockquote>`);
      continue;
    }

    if (startsMarkdownTable(lines, index)) {
      const headerLine = lines[index];
      const separatorLine = lines[index + 1];
      const bodyLines = [];
      index += 2;

      while (index < lines.length && isMarkdownTableRow(lines[index])) {
        bodyLines.push(lines[index]);
        index += 1;
      }

      blocks.push(renderMarkdownTable(headerLine, separatorLine, bodyLines));
      continue;
    }

    if (/^\s*[-+*]\s+/.test(line)) {
      const items = [];

      while (index < lines.length && /^\s*[-+*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-+*]\s+/, "").trim());
        index += 1;
      }

      blocks.push(`<ul>${items.map((item) => `<li>${renderMarkdownInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];

      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, "").trim());
        index += 1;
      }

      blocks.push(`<ol>${items.map((item) => `<li>${renderMarkdownInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraphLines = [];

    while (index < lines.length && lines[index].trim()) {
      if (paragraphLines.length && (isMarkdownBlockStart(lines[index]) || startsMarkdownTable(lines, index))) {
        break;
      }

      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push(`<p>${renderMarkdownParagraph(paragraphLines)}</p>`);
  }

  return blocks.join("");
}

function renderModTags(tags, fallback) {
  const normalized = (tags || []).filter(Boolean).slice(0, 3);
  const finalTags = normalized.length ? normalized : [fallback];

  return finalTags
    .map((tag) => `<span class="mod-tag">${escapeHtml(tag)}</span>`)
    .join("");
}

function normalizeInlineText(value, fallback = "-") {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

function formatDateLabel(isoString) {
  if (!isoString) {
    return "-";
  }

  const parsed = new Date(isoString);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString(getCurrentLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString(getCurrentLocale()) : "0";
}

function formatSupportLabel(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "required") {
    return "Erforderlich";
  }

  if (normalized === "optional") {
    return "Optional";
  }

  if (normalized === "unsupported") {
    return "Nicht unterstützt";
  }

  return "Unbekannt";
}

function normalizeBodyText(value, fallback = "Keine Detailbeschreibung verfügbar.") {
  const text = String(value || "")
    .replace(/\r/g, "")
    .replace(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g, "[Bild] $1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1 ($2)")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text || fallback;
}

function getSelectedVersionLabel(project) {
  if (!project) {
    return "";
  }

  return normalizeInlineText(project.versionName || project.versionNumber || project.versionId, "");
}

function formatVersionActionLabel(projectType, isInstalled, isSameVersion) {
  if (isSameVersion) {
    return "Ausgewählt";
  }

  if (projectType === "mod") {
    return isInstalled ? "Auswählen" : "Installieren";
  }

  return isInstalled ? "Version wechseln" : "Installieren";
}

function currentSearchPage() {
  const limit = Math.max(1, state.searchPagination.limit || 1);
  return Math.floor((state.searchPagination.offset || 0) / limit) + 1;
}

function getSearchPageCount() {
  const limit = Math.max(1, state.searchPagination.limit || 1);
  const totalHits = state.searchPagination.totalHits || state.searchResults.length;
  return Math.max(1, Math.ceil(totalHits / limit));
}

function buildPaginationWindow(page, pageCount) {
  const windowSize = 5;
  const halfWindow = Math.floor(windowSize / 2);
  let start = Math.max(1, page - halfWindow);
  let end = Math.min(pageCount, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages = [];

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  return pages;
}

function buildDetailCacheKey(projectId, minecraftVersion, loader = "fabric") {
  return [projectId, minecraftVersion || "-", loader || "fabric"].join(":");
}

function buildModLinkEntries(detail) {
  const links = [];

  if (detail?.projectUrl) {
    links.push({
      label: "Modrinth",
      url: detail.projectUrl,
      icon: "open_in_new"
    });
  }

  if (detail?.sourceUrl) {
    links.push({
      label: "Source",
      url: detail.sourceUrl,
      icon: "code"
    });
  }

  if (detail?.issuesUrl) {
    links.push({
      label: "Issues",
      url: detail.issuesUrl,
      icon: "bug_report"
    });
  }

  if (detail?.wikiUrl) {
    links.push({
      label: "Wiki",
      url: detail.wikiUrl,
      icon: "menu_book"
    });
  }

  if (detail?.discordUrl) {
    links.push({
      label: "Discord",
      url: detail.discordUrl,
      icon: "forum"
    });
  }

  (detail?.donationUrls || []).forEach((entry) => {
    if (entry?.url) {
      links.push({
        label: entry.platform || "Donate",
        url: entry.url,
        icon: "volunteer_activism"
      });
    }
  });

  return links;
}

function openModDetailModal() {
  elements.modDetailModal.hidden = false;
  document.body.classList.add("mod-detail-open");
}

function closeModDetailModal() {
  elements.modDetailModal.hidden = true;
  document.body.classList.remove("mod-detail-open");
  state.activeModPreview = null;
  state.activeModDetail = null;
  state.activeModDetailCacheKey = null;
  state.modDetailLoading = false;
}

function getDefaultImportSources() {
  return [
    {
      sourceType: "modrinth",
      sourceLabel: "Modrinth",
      detected: false,
      availableRoots: [],
      candidateRoots: [],
      profiles: []
    },
    {
      sourceType: "curseforge",
      sourceLabel: "CurseForge",
      detected: false,
      availableRoots: [],
      candidateRoots: [],
      profiles: []
    }
  ];
}

function normalizeImportSources(sources) {
  const sourceMap = new Map(
    (sources || []).map((entry) => [entry.sourceType, {
      ...entry,
      availableRoots: entry.availableRoots || [],
      candidateRoots: entry.candidateRoots || [],
      profiles: entry.profiles || []
    }])
  );

  return getDefaultImportSources().map((entry) => sourceMap.get(entry.sourceType) || entry);
}

function getActiveImportSource() {
  const sources = state.importBrowser.sources.length
    ? state.importBrowser.sources
    : getDefaultImportSources();

  return (
    sources.find((entry) => entry.sourceType === state.importBrowser.activeSource) ||
    sources[0]
  );
}

function openProfileImportModal() {
  state.importBrowser.open = true;
  elements.profileImportModal.hidden = false;
  document.body.classList.add("profile-import-open");
  renderProfileImportBrowser();
}

function closeProfileImportModal() {
  state.importBrowser.open = false;
  elements.profileImportModal.hidden = true;
  document.body.classList.remove("profile-import-open");
}

function renderProfileDeleteModal() {
  if (!elements.profileDeleteModal) {
    return;
  }

  const profile = state.profileDeleteDialog.profile;
  const profileName = profile?.name || "dieses Profil";

  elements.profileDeleteTitle.textContent = `Profil "${profileName}" löschen?`;
  elements.profileDeleteMessage.textContent = `Der komplette Profilordner von ${profileName} wird dauerhaft entfernt.`;
  elements.profileDeletePath.textContent = profile?.userDataPath || "-";
}

function renderAccountDeleteModal() {
  if (!elements.accountDeleteModal) {
    return;
  }

  const account = state.accountDeleteDialog.account;
  const accountName = account?.name || "diesen Account";

  elements.accountDeleteTitle.textContent = `Account "${accountName}" entfernen?`;
  elements.accountDeleteMessage.textContent = `Willst du ${accountName} wirklich aus dem Launcher entfernen?`;
  elements.accountDeleteName.textContent = account?.id || accountName;
}

function openAccountDeleteModal(account) {
  if (!elements.accountDeleteModal || !account) {
    return Promise.resolve(false);
  }

  if (typeof state.accountDeleteDialog.resolve === "function") {
    state.accountDeleteDialog.resolve(false);
  }

  state.accountDeleteDialog.account = account;
  elements.accountDeleteModal.hidden = false;
  document.body.classList.add("profile-delete-open");
  renderAccountDeleteModal();

  return new Promise((resolve) => {
    state.accountDeleteDialog.resolve = resolve;
    window.setTimeout(() => {
      elements.accountDeleteCancel?.focus();
    }, 0);
  });
}

function closeAccountDeleteModal(confirmed = false) {
  if (!elements.accountDeleteModal) {
    return;
  }

  const resolve = state.accountDeleteDialog.resolve;

  elements.accountDeleteModal.hidden = true;
  document.body.classList.remove("profile-delete-open");
  state.accountDeleteDialog.account = null;
  state.accountDeleteDialog.resolve = null;

  if (typeof resolve === "function") {
    resolve(Boolean(confirmed));
  }
}

function isAccountDeleteModalOpen() {
  return Boolean(elements.accountDeleteModal && !elements.accountDeleteModal.hidden);
}

function openProfileDeleteModal(profile) {
  if (!elements.profileDeleteModal || !profile) {
    return Promise.resolve(false);
  }

  if (typeof state.profileDeleteDialog.resolve === "function") {
    state.profileDeleteDialog.resolve(false);
  }

  state.profileDeleteDialog.profile = profile;
  elements.profileDeleteModal.hidden = false;
  document.body.classList.add("profile-delete-open");
  renderProfileDeleteModal();

  return new Promise((resolve) => {
    state.profileDeleteDialog.resolve = resolve;
    window.setTimeout(() => {
      elements.profileDeleteCancel?.focus();
    }, 0);
  });
}

function closeProfileDeleteModal(confirmed = false) {
  if (!elements.profileDeleteModal) {
    return;
  }

  const resolve = state.profileDeleteDialog.resolve;

  elements.profileDeleteModal.hidden = true;
  document.body.classList.remove("profile-delete-open");
  state.profileDeleteDialog.profile = null;
  state.profileDeleteDialog.resolve = null;

  if (typeof resolve === "function") {
    resolve(Boolean(confirmed));
  }
}

function isProfileDeleteModalOpen() {
  return Boolean(elements.profileDeleteModal && !elements.profileDeleteModal.hidden);
}

function isLaunchErrorModalOpen() {
  return Boolean(elements.launchErrorModal && !elements.launchErrorModal.hidden);
}

function setActiveImportSource(sourceType) {
  if (!sourceType) {
    return;
  }

  state.importBrowser.activeSource = sourceType;
  renderProfileImportBrowser();
}

function formatImportLoaderLabel(loaderType) {
  const normalized = String(loaderType || "").trim().toLowerCase();

  if (!normalized) {
    return "Loader unbekannt";
  }

  if (normalized === "fabric") {
    return "Fabric";
  }

  if (normalized === "vanilla") {
    return "Vanilla";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function buildImportSubtitle() {
  if (state.importBrowser.loading) {
    return "Launcher und Instanzen werden gesucht...";
  }

  if (state.importBrowser.error) {
    return state.importBrowser.error;
  }

  const totalProfiles = state.importBrowser.sources.reduce(
    (sum, entry) => sum + (entry.profiles?.length || 0),
    0
  );

  if (!totalProfiles) {
    return "Keine automatisch gefundenen Instanzen. Du kannst jederzeit manuell einen Ordner auswählen.";
  }

  return "";
}

function renderProfileImportBrowser() {
  if (!elements.profileImportModal) {
    return;
  }

  const sources = state.importBrowser.sources.length
    ? state.importBrowser.sources
    : getDefaultImportSources();
  const activeSource = getActiveImportSource();

  const importSubtitle = buildImportSubtitle();
  elements.profileImportSubtitle.textContent = importSubtitle;
  elements.profileImportSubtitle.hidden = !importSubtitle;
  elements.profileImportRefresh.disabled = state.importBrowser.loading || state.isBusy;
  elements.profileImportBrowse.disabled = state.isBusy;
  elements.profileImportClose.disabled = state.isBusy;

  elements.profileImportSources.innerHTML = sources
    .map((source) => {
      const count = source.profiles?.length || 0;
      const pathLabel = shortenPathLabel(source.availableRoots?.[0] || source.candidateRoots?.[0] || "");

      return `
        <button
          class="profile-import-source"
          type="button"
          data-import-source="${escapeHtml(source.sourceType)}"
          data-active="${String(activeSource.sourceType === source.sourceType)}"
          ${state.importBrowser.loading || state.isBusy ? "disabled" : ""}
        >
          <div class="profile-import-source-head">
            <div class="profile-import-source-copy">
              <strong>${escapeHtml(source.sourceLabel)}</strong>
              <small>${count} ${count === 1 ? "Instanz" : "Instanzen"} gefunden</small>
            </div>
          </div>
          <div class="profile-import-source-copy">
            <small>${escapeHtml(pathLabel || "Standardpfad wird verwendet")}</small>
          </div>
        </button>
      `;
    })
    .join("");

  elements.profileImportSources.querySelectorAll("[data-import-source]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveImportSource(button.dataset.importSource);
    });
  });

  if (state.importBrowser.loading) {
    elements.profileImportList.innerHTML = '<div class="empty-state">Launcher und Profile werden gesucht...</div>';
    return;
  }

  if (state.importBrowser.error) {
    elements.profileImportList.innerHTML = `
      <div class="profile-import-empty">
        <h3>Scan fehlgeschlagen</h3>
        <p>${escapeHtml(state.importBrowser.error)}</p>
      </div>
    `;
    return;
  }

  if (!activeSource.detected && !(activeSource.profiles || []).length) {
    elements.profileImportList.innerHTML = `
      <div class="profile-import-empty">
        <h3>${escapeHtml(activeSource.sourceLabel)} wurde nicht gefunden</h3>
        <p>Es wurden keine Instanzordner an den bekannten Standardpfaden erkannt.</p>
      </div>
    `;
    return;
  }

  if (!(activeSource.profiles || []).length) {
    elements.profileImportList.innerHTML = `
      <div class="profile-import-empty">
        <h3>Keine Instanzen gefunden</h3>
        <p>Der Launcher wurde erkannt, aber es konnten keine importierbaren Instanzen gelesen werden.</p>
      </div>
    `;
    return;
  }

  elements.profileImportList.innerHTML = activeSource.profiles
    .map((profile) => {
      const badges = [
        profile.minecraftVersion ? `Minecraft ${profile.minecraftVersion}` : null,
        formatImportLoaderLabel(profile.loaderType),
        profile.fabricLoaderVersion ? `Loader ${profile.fabricLoaderVersion}` : null
      ].filter(Boolean);

      return `
        <article class="profile-import-instance" data-supported="${String(profile.supported)}">
          <div class="profile-import-instance-head">
            <div class="profile-import-instance-copy">
              <strong class="profile-import-instance-name">${escapeHtml(profile.name)}</strong>
              <small>${escapeHtml(profile.sourceLabel)}-Profil</small>
            </div>
            <button
              class="btn btn-product profile-import-instance-action ${profile.supported ? "" : "btn-product-secondary"}"
              type="button"
              data-import-profile="${escapeHtml(profile.sourcePath)}"
              ${!profile.supported || state.isBusy ? "disabled" : ""}
            >
              <span>${profile.supported ? "Importieren" : "Nicht unterstützt"}</span>
            </button>
          </div>
          <div class="profile-import-instance-badges">
            ${badges
              .map((badge) => `<span class="profile-import-instance-badge">${escapeHtml(badge)}</span>`)
              .join("")}
            ${
              profile.supported
                ? ""
                : '<span class="profile-import-instance-badge" data-unsupported="true">Nur Fabric oder Vanilla</span>'
            }
          </div>
          <div class="profile-import-instance-root">${escapeHtml(profile.sourcePath)}</div>
        </article>
      `;
    })
    .join("");

  elements.profileImportList.querySelectorAll("[data-import-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      startProfileImport(button.dataset.importProfile);
    });
  });
}

async function loadProfileImportSources({ force = false } = {}) {
  if (state.importBrowser.loading) {
    return;
  }

  if (!force && state.importBrowser.sources.length) {
    renderProfileImportBrowser();
    return;
  }

  state.importBrowser.loading = true;
  state.importBrowser.error = null;
  renderProfileImportBrowser();

  try {
    state.importBrowser.sources = normalizeImportSources(await window.boocordApi.getProfileImportSources());

    if (!state.importBrowser.sources.some((entry) => entry.sourceType === state.importBrowser.activeSource)) {
      state.importBrowser.activeSource = state.importBrowser.sources[0]?.sourceType || "modrinth";
    }
  } catch (error) {
    state.importBrowser.sources = getDefaultImportSources();
    state.importBrowser.error = error.message || "Launcher-Instanzen konnten nicht geladen werden.";
  } finally {
    state.importBrowser.loading = false;
    renderProfileImportBrowser();
  }
}

function renderPagination() {
  const page = currentSearchPage();
  const pageCount = getSearchPageCount();
  const totalHits = state.searchPagination.totalHits || 0;
  const hasResults = state.searchResults.length > 0;

  elements.modPagination.innerHTML = "";

  if (state.searchLoading && !state.searchHasRun) {
    elements.modPageSummary.textContent = "Lade Vorschläge...";
    return;
  }

  if (!state.searchHasRun) {
    elements.modPageSummary.textContent = "Noch keine Suche";
    return;
  }

  if (!hasResults) {
    elements.modPageSummary.textContent = totalHits > 0 ? "Keine Treffer auf dieser Seite" : "Keine Treffer";
    return;
  }

  const start = state.searchPagination.offset + 1;
  const end = state.searchPagination.offset + state.searchResults.length;
  elements.modPageSummary.textContent = `${start}-${end} von ${formatNumber(totalHits)} | Seite ${page} / ${pageCount}`;

  buildPaginationWindow(page, pageCount).forEach((pageNumber) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mod-page-chip";
    button.dataset.active = String(pageNumber === page);
    button.textContent = String(pageNumber);
    button.disabled = state.isBusy || pageNumber === page;
    button.addEventListener("click", () => {
      handleModSearch(true, pageNumber);
    });
    elements.modPagination.appendChild(button);
  });
}

function renderModDetailModal() {
  const detail = state.activeModDetail || state.activeModPreview;

  if (!detail) {
    elements.modDetailTitle.textContent = "Modrinth Details";
    elements.modDetailContent.innerHTML = '<div class="empty-state">Wähle eine Mod aus, um Details zu sehen.</div>';
    return;
  }

  const selectedIds = new Set((state.config?.modding?.selectedMods || []).map((mod) => mod.projectId));
  const isInstalled = selectedIds.has(detail.projectId);
  const linkEntries = buildModLinkEntries(detail);
  const statEntries = [
    { label: "Downloads", value: formatNumber(detail.downloads || 0) },
    { label: "Follower", value: formatNumber(detail.followers || 0) },
    { label: "Client", value: formatSupportLabel(detail.clientSide) },
    { label: "Server", value: formatSupportLabel(detail.serverSide) },
    { label: "Veröffentlicht", value: formatDateLabel(detail.published || detail.dateCreated) },
    { label: "Aktualisiert", value: formatDateLabel(detail.updated || detail.dateModified) },
    {
      label: "Lizenz",
      value: normalizeInlineText(
        detail.license?.name || detail.license?.id || (typeof detail.license === "string" ? detail.license : null),
        "-"
      )
    },
    { label: "Versionen", value: formatNumber((detail.versions || detail.gameVersions || []).length) }
  ];
  const galleryEntries = (detail.gallery || []).slice(0, 6);
  const memberEntries = (detail.members || []).slice(0, 6);
  const categories = [
    ...(detail.categories || []),
    ...(detail.additionalCategories || [])
  ].filter(Boolean);
  elements.modDetailTitle.textContent = detail.title || detail.slug || detail.projectId;
  elements.modDetailContent.innerHTML = `
    <section class="mod-detail-section">
      <div class="mod-detail-hero">
        <img class="mod-detail-icon" src="${escapeHtml(detail.iconUrl || "./logo.png")}" alt="${escapeHtml(
          detail.title || detail.projectId
        )}" data-fallback="./logo.png">
        <div class="mod-detail-hero-copy">
          <span class="mod-detail-kicker">${escapeHtml(detail.projectType || "mod")}</span>
          <h2>${escapeHtml(detail.title || detail.slug || detail.projectId)}</h2>
          <p class="mod-detail-description">${escapeHtml(
            detail.description || "Keine Kurzbeschreibung verfügbar."
          )}</p>
          <div class="mod-entry-tags">${renderModTags(categories, "Fabric Mod")}</div>
          <div class="mod-entry-footer-actions mod-detail-actions">
            <button class="btn btn-product ${isInstalled ? "btn-product-secondary" : ""}" type="button" data-modal-toggle-mod="${escapeHtml(
              detail.projectId
            )}">
              <span>${isInstalled ? "Entfernen" : "Hinzufügen"}</span>
            </button>
            ${
              detail.projectUrl
                ? `<a class="btn btn-product btn-product-secondary mod-entry-open" href="${escapeHtml(
                    detail.projectUrl
                  )}" target="_blank" rel="noreferrer"><span>Modrinth öffnen</span></a>`
                : ""
            }
          </div>
        </div>
      </div>
    </section>
    <section class="mod-detail-section">
      <h3>Übersicht</h3>
      <div class="mod-detail-stats">
        ${statEntries
          .map(
            (entry) => `
              <div class="mod-detail-stat">
                <span>${escapeHtml(entry.label)}</span>
                <strong>${escapeHtml(entry.value)}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
    ${
      linkEntries.length
        ? `
          <section class="mod-detail-section">
            <h3>Links</h3>
            <div class="mod-detail-links">
              ${linkEntries
                .map(
                  (entry) => `
                    <a class="mod-detail-link" href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">
                      <span class="material-icons">${escapeHtml(entry.icon)}</span>
                      <span>${escapeHtml(entry.label)}</span>
                    </a>
                  `
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }
    ${
      memberEntries.length
        ? `
          <section class="mod-detail-section">
            <h3>Team</h3>
            <div class="mod-detail-members">
              ${memberEntries
                .map(
                  (member) => `
                    <div class="mod-detail-member">
                      <img src="${escapeHtml(member.avatarUrl || "./logo.png")}" alt="${escapeHtml(
                        member.username
                      )}" data-fallback="./logo.png">
                      <div>
                        <strong>${escapeHtml(member.username)}</strong>
                        <small>${escapeHtml(member.role || "Mitglied")}</small>
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }
    ${
      galleryEntries.length
        ? `
          <section class="mod-detail-section">
            <h3>Galerie</h3>
            <div class="mod-detail-gallery">
              ${galleryEntries
                .map(
                  (entry) => `
                    <a class="mod-detail-gallery-item" href="${escapeHtml(
                      entry.raw_url || entry.url
                    )}" target="_blank" rel="noreferrer">
                      <img src="${escapeHtml(entry.url || entry.raw_url)}" alt="${escapeHtml(
                        entry.title || detail.title
                      )}">
                      <strong>${escapeHtml(entry.title || "Screenshot")}</strong>
                      <small>${escapeHtml(entry.description || "")}</small>
                    </a>
                  `
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }
    ${
      (detail.versions || []).length
        ? `
          <section class="mod-detail-section">
            <h3>Kompatible Versionen</h3>
            <div class="mod-detail-version-list">
              ${detail.versions
                .map(
                  (version) => `
                    <div class="mod-detail-version">
                      <div>
                        <strong>${escapeHtml(version.name || version.versionNumber || version.id)}</strong>
                        <small>${escapeHtml(
                          `${formatDateLabel(version.datePublished)} | ${formatNumber(version.downloads)} Downloads | ${version.versionType || "release"}`
                        )}</small>
                      </div>
                      ${
                        (version.files || []).length
                          ? `
                            <div class="mod-detail-version-files">
                              ${(version.files || [])
                                .slice(0, 3)
                                .map(
                                  (file) => `
                                    <a class="mod-detail-file" href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">
                                      <span>${escapeHtml(file.filename)}</span>
                                      <span>${escapeHtml(formatBytes(file.size) || "-")}</span>
                                    </a>
                                  `
                                )
                                .join("")}
                            </div>
                          `
                          : ""
                      }
                      ${
                        version.changelog
                          ? `<small>${escapeHtml(normalizeBodyText(version.changelog, "").slice(0, 320))}</small>`
                          : ""
                      }
                    </div>
                  `
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }
    <section class="mod-detail-section">
      <h3>Beschreibung</h3>
      <div class="mod-detail-body">${renderMarkdownHtml(detail.body || detail.description)}</div>
    </section>
    ${
      state.modDetailLoading
        ? '<div class="empty-state">Details werden aktualisiert...</div>'
        : ""
    }
  `;

  attachImageFallback(elements.modDetailContent.querySelector(".mod-detail-icon"));
  elements.modDetailContent.querySelectorAll(".mod-detail-member img").forEach(attachImageFallback);

  const toggleButton = elements.modDetailContent.querySelector("[data-modal-toggle-mod]");

  if (toggleButton) {
    toggleButton.addEventListener("click", (event) => {
      event.stopPropagation();

      if (isInstalled) {
        handleRemoveMod(detail.projectId);
      } else {
        handleAddMod(detail.projectId);
      }
    });
  }
}

function formatProfileTitle(profile) {
  if (!profile) {
    return "Standard";
  }

  return profile.label || "Standard";
}

function formatLauncherWindowTitle(profile = state.config?.profile) {
  const profileTitle = formatProfileTitle(profile);

  return profile?.isCustom
    ? `Boocord Client [${profileTitle}]`
    : "Boocord Client";
}

function renderLauncherWindowChrome() {
  if (!elements.launcherWindowMaximizeIcon) {
    return;
  }

  const profile = state.config?.profile || null;
  const isRestorable = Boolean(state.launcherWindow.isRestorable);
  const isManualDragActive = Boolean(
    state.manualWindowDrag.active || state.manualWindowDrag.beginPending
  );

  document.title = formatLauncherWindowTitle(profile);
  document.body.classList.toggle("window-is-restorable", isRestorable);
  document.body.classList.toggle("window-is-manual-drag", isManualDragActive);

  elements.launcherWindowMaximizeIcon.textContent = isRestorable ? "filter_none" : "crop_square";
  elements.launcherWindowMaximizeButton.setAttribute(
    "aria-label",
    isRestorable ? "Wiederherstellen" : "Maximieren"
  );
}

function applyLauncherWindowState(nextState = {}) {
  state.launcherWindow = {
    ...state.launcherWindow,
    ...nextState
  };
  renderLauncherWindowChrome();
}

async function beginManualLauncherWindowDrag(event) {
  if (
    !state.launcherWindow.isRestorable ||
    !elements.launcherWindowDragRegion ||
    event.button !== 0 ||
    state.manualWindowDrag.active ||
    state.manualWindowDrag.beginPending ||
    (state.manualWindowDrag.pointerId !== null && state.manualWindowDrag.pointerId !== event.pointerId)
  ) {
    return;
  }

  event.preventDefault();
  state.manualWindowDrag = {
    ...state.manualWindowDrag,
    beginPending: true,
    pointerId: event.pointerId
  };
  renderLauncherWindowChrome();

  try {
    const nextState = await window.boocordApi.beginLauncherWindowDrag({
      pointerX: event.clientX,
      pointerY: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      windowWidth: window.innerWidth
    });

    if (
      !state.manualWindowDrag.beginPending ||
      state.manualWindowDrag.pointerId !== event.pointerId
    ) {
      return;
    }

    state.manualWindowDrag = {
      active: true,
      beginPending: false,
      pointerId: event.pointerId
    };
    applyLauncherWindowState(nextState);
    void window.boocordApi.updateLauncherWindowDrag();
    window.requestAnimationFrame(() => {
      if (
        state.manualWindowDrag.active &&
        state.manualWindowDrag.pointerId === event.pointerId
      ) {
        void window.boocordApi.updateLauncherWindowDrag();
      }
    });
  } catch {
    endManualLauncherWindowDrag(event.pointerId);
  }
}

function endManualLauncherWindowDrag(pointerId = null) {
  if (!state.manualWindowDrag.active && !state.manualWindowDrag.beginPending) {
    return;
  }

  if (
    pointerId !== null &&
    state.manualWindowDrag.pointerId !== null &&
    pointerId !== state.manualWindowDrag.pointerId
  ) {
    return;
  }

  const shouldNotifyMain =
    state.manualWindowDrag.active || state.manualWindowDrag.beginPending;

  state.manualWindowDrag = {
    active: false,
    beginPending: false,
    pointerId: null
  };

  if (
    elements.launcherWindowDragRegion &&
    pointerId !== null &&
    elements.launcherWindowDragRegion.hasPointerCapture(pointerId)
  ) {
    elements.launcherWindowDragRegion.releasePointerCapture(pointerId);
  }

  renderLauncherWindowChrome();
  if (shouldNotifyMain) {
    void window.boocordApi.endLauncherWindowDrag();
  }
}

function updateManualLauncherWindowDrag(event) {
  if (!state.manualWindowDrag.active && !state.manualWindowDrag.beginPending) {
    return;
  }

  if (
    event?.pointerId !== undefined &&
    state.manualWindowDrag.pointerId !== null &&
    event.pointerId !== state.manualWindowDrag.pointerId
  ) {
    return;
  }

  if (event && (event.buttons & 1) !== 1) {
    endManualLauncherWindowDrag(event.pointerId);
    return;
  }

  if (state.manualWindowDrag.beginPending) {
    return;
  }

  void window.boocordApi.updateLauncherWindowDrag();
}

function shortenPathLabel(pathValue) {
  const normalized = String(pathValue || "").trim();

  if (!normalized) {
    return "-";
  }

  if (normalized.length <= 48) {
    return normalized;
  }

  const segments = normalized.split(/[\\/]+/).filter(Boolean);

  if (segments.length <= 3) {
    return normalized;
  }

  return `...\\${segments.slice(-3).join("\\")}`;
}

function getProfileMonogram(profileName) {
  const parts = String(profileName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "BC";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function focusProfileRenameInput(profileSlug) {
  if (!elements.profileCardGrid || !profileSlug) {
    return;
  }

  requestAnimationFrame(() => {
    const renameInput = elements.profileCardGrid.querySelector(
      `[data-profile-rename-input="${profileSlug}"]`
    );

    if (!renameInput) {
      return;
    }

    renameInput.focus();
    renameInput.select();
  });
}

function cancelProfileRename(shouldRender = true) {
  state.profileRename.slug = null;
  state.profileRename.value = "";

  if (shouldRender) {
    renderProfileCards();
  }
}

function resetProfileInteractionState({
  closeDeleteModal = true,
  closeImportModal = false,
  closeModDetails = false,
  resetRename = true
} = {}) {
  if (resetRename) {
    cancelProfileRename(false);
  }

  if (closeDeleteModal) {
    if (isProfileDeleteModalOpen()) {
      closeProfileDeleteModal(false);
    } else {
      state.profileDeleteDialog.profile = null;
      state.profileDeleteDialog.resolve = null;
    }
  }

  if (closeImportModal && state.importBrowser.open) {
    closeProfileImportModal();
  }

  if (closeModDetails && !elements.modDetailModal.hidden) {
    closeModDetailModal();
  }
}

function reconcileProfileInteractionState(nextConfig) {
  const profiles = Array.isArray(nextConfig?.profiles) ? nextConfig.profiles : [];

  if (
    state.profileRename.slug &&
    !profiles.some((profile) => profile.slug === state.profileRename.slug)
  ) {
    cancelProfileRename(false);
  }

  if (
    state.profileDeleteDialog.profile?.slug &&
    !profiles.some((profile) => profile.slug === state.profileDeleteDialog.profile.slug)
  ) {
    resetProfileInteractionState({
      closeDeleteModal: true,
      resetRename: false
    });
  }
}

function startProfileRename(profile) {
  if (!profile || state.isBusy) {
    return;
  }

  state.profileRename.slug = profile.slug;
  state.profileRename.value = profile.name || "";
  renderProfileCards();
  focusProfileRenameInput(profile.slug);
}

async function submitProfileRename(profile, { fromBlur = false } = {}) {
  if (!profile || state.isBusy || state.profileRename.slug !== profile.slug) {
    return;
  }

  const currentName = String(profile.name || "").trim();
  const requestedName = String(state.profileRename.value || "").trim();

  if (!requestedName) {
    if (fromBlur) {
      cancelProfileRename();
      return;
    }

    setStatus("Bitte gib einen Profilnamen ein.", true);
    focusProfileRenameInput(profile.slug);
    return;
  }

  if (requestedName === currentName) {
    cancelProfileRename();
    return;
  }

  if (!projectId) {
    setStatus(`${contentConfig.singularLabel} konnte nicht hinzugefügt werden.`, true);
    setStatusDetail("Für dieses Projekt fehlt eine gültige Projekt-ID.");
    return;
  }

  invalidateModdingStateHydration();
  setBusy(true);
  invalidateModdingStateHydration();
  setSelectedProjectsForType(
    projectType,
    [
      ...previousSelection.filter((entry) => entry.isLocalOnly || !projectMatchesReference(entry, projectReferences)),
      buildOptimisticSelectedProject(projectReference, projectType, version)
    ]
  );
  if (state.config?.modding) {
    syncActiveProfileSelectionCounts(state.config.modding);
  }
  renderState();
  setStatus(`Profil ${currentName} wird umbenannt...`);
  setProgress({
    active: true,
    label: "Profil umbenennen",
    detail: `${currentName} -> ${requestedName}`,
    indeterminate: true
  });

  invalidateModdingStateHydration();
  try {
    const result = await window.boocordApi.renameProfile({
      slug: profile.slug,
      name: requestedName
    });
    cancelProfileRename(false);
    await refreshState();
    appendLog(`[profile] Umbenannt: ${currentName} (${profile.slug}) -> ${result.name}`);
    setStatus(`Profil ${currentName} wurde in ${result.name} umbenannt.`);
    resetProgress(`Der neue Profilname ${result.name} wurde gespeichert.`);
  } catch (error) {
    setStatus(error.message || "Profil konnte nicht umbenannt werden.", true);
    resetProgress(error.message || "Profil konnte nicht umbenannt werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
    focusProfileRenameInput(profile.slug);
  } finally {
    setBusy(false);
  }
}

async function submitProfileRename(profile, { fromBlur = false } = {}) {
  if (!profile || state.isBusy || state.profileRename.slug !== profile.slug) {
    return;
  }

  const currentName = String(profile.name || "").trim();
  const requestedName = String(state.profileRename.value || "").trim();

  if (!requestedName) {
    if (fromBlur) {
      cancelProfileRename();
      return;
    }

    setStatus("Bitte gib einen Profilnamen ein.", true);
    focusProfileRenameInput(profile.slug);
    return;
  }

  if (requestedName === currentName) {
    cancelProfileRename();
    return;
  }

  setBusy(true);
  setStatus(`Profil ${currentName} wird umbenannt...`);
  setProgress({
    active: true,
    label: "Profil umbenennen",
    detail: `${currentName} -> ${requestedName}`,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.renameProfile({
      slug: profile.slug,
      name: requestedName
    });
    cancelProfileRename(false);
    await refreshState();
    appendLog(`[profile] Umbenannt: ${currentName} (${profile.slug}) -> ${result.name}`);
    setStatus(`Profil ${currentName} wurde in ${result.name} umbenannt.`);
    resetProgress(`Der neue Profilname ${result.name} wurde gespeichert.`);
  } catch (error) {
    setStatus(error.message || "Profil konnte nicht umbenannt werden.", true);
    resetProgress(error.message || "Profil konnte nicht umbenannt werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
    focusProfileRenameInput(profile.slug);
  } finally {
    setBusy(false);
  }
}

function buildProfileBadges(profile) {
  const badges = [];

  if (profile.isActive) {
    badges.push("Aktiv");
  }

  if (profile.isDefault) {
    badges.push("Standard");
  }

  if (profile.importedFrom?.label) {
    badges.push(profile.importedFrom.label);
  }

  if (profile.runtimeInstalled) {
    badges.push("Runtime bereit");
  } else if (profile.hasLocalContent) {
    badges.push("Importiert");
  } else {
    badges.push("Noch leer");
  }

  return badges;
}

function renderProfileCards() {
  const profiles = state.config?.profiles || [];

  if (!elements.profileCardGrid) {
    return;
  }

  elements.profileCardGrid.innerHTML = "";

  if (!profiles.length) {
    elements.profileCardGrid.innerHTML = '<div class="empty-state">Noch keine Profile gefunden.</div>';
    return;
  }

  profiles.forEach((profile) => {
    const card = document.createElement("article");
    const isRenaming = state.profileRename.slug === profile.slug;
    const versionLabel = profile.minecraftVersion || state.config?.manifest?.minecraftVersion || "-";
    const dataPathLabel = profile.instanceDirectory || profile.dataDirectory || profile.userDataPath;
    const visiblePathLabel = shortenPathLabel(dataPathLabel);
    const canDelete = !profile.isActive && !profile.isDefault;
    const hasCustomIcon = Boolean(profile.iconUrl);
    const deleteTitle = profile.isActive
      ? "Aktives Profil kann nicht gelöscht werden"
      : profile.isDefault
        ? "Standard-Profil kann nicht gelöscht werden"
        : `${profile.name} löschen`;

    card.className = "profile-card";
    card.dataset.profileSlug = profile.slug;
    card.dataset.active = String(profile.isActive);
    card.dataset.ready = String(Boolean(profile.runtimeInstalled || profile.hasLocalContent));
    card.innerHTML = `
      <div class="profile-card-top">
        <div class="profile-card-identity">
          ${
            hasCustomIcon
              ? `<button class="profile-card-icon-trigger" type="button" data-profile-icon="${escapeHtml(
                  profile.slug
                )}" ${state.isBusy ? "disabled" : ""} title="Profil-Icon ändern" aria-label="${escapeHtml(
                  `Icon für ${profile.name} ändern`
                )}">
                  <img class="profile-card-icon" src="${escapeHtml(profile.iconUrl)}" alt="${escapeHtml(
                    `${profile.name} Icon`
                  )}" data-fallback="./logo.png">
                </button>`
              : `<button class="profile-card-icon-trigger" type="button" data-profile-icon="${escapeHtml(
                  profile.slug
                )}" ${state.isBusy ? "disabled" : ""} title="Profil-Icon wählen" aria-label="${escapeHtml(
                  `Icon für ${profile.name} wählen`
                )}">
                  <div class="profile-card-monogram">${escapeHtml(getProfileMonogram(profile.name))}</div>
                </button>`
           }
           <div class="profile-card-title-wrap">
             ${
               isRenaming
                 ? `<input
                     class="launcher-input profile-card-title-input"
                     type="text"
                     value="${escapeHtml(state.profileRename.value)}"
                     data-profile-rename-input="${escapeHtml(profile.slug)}"
                     aria-label="${escapeHtml(`Profilnamen für ${profile.name} bearbeiten`)}"
                     maxlength="64"
                     ${state.isBusy ? "disabled" : ""}
                   >
                   <small class="profile-card-title-hint">Enter speichert, Esc bricht ab.</small>`
                 : `<strong
                     class="profile-card-title"
                     data-profile-title="${escapeHtml(profile.slug)}"
                     title="Doppelklick zum Umbenennen"
                   >${escapeHtml(profile.name)}</strong>`
             }
           </div>
         </div>
       </div>
      <div class="profile-card-details">
        <div class="profile-card-detail">
          <span>Spielversion</span>
          <strong>${escapeHtml(versionLabel)}</strong>
        </div>
        <div class="profile-card-detail">
          <span>Mods</span>
          <strong>${escapeHtml(String(profile.selectedModsCount || 0))}</strong>
        </div>
      </div>
      <div class="profile-card-location" title="${escapeHtml(dataPathLabel)}">
        <span>Speicherort</span>
        <strong>${escapeHtml(visiblePathLabel)}</strong>
      </div>
      <div class="profile-card-actions">
        <button class="btn btn-product" type="button" data-profile-switch="${escapeHtml(profile.slug)}" ${
          profile.isActive || state.isBusy ? "disabled" : ""
        }>
          <span>${profile.isActive ? "Aktiv" : "Nutzen"}</span>
        </button>
        <button class="btn btn-product btn-product-secondary" type="button" data-profile-folder="${escapeHtml(
          profile.instanceDirectory || profile.dataDirectory || profile.userDataPath
        )}" ${state.isBusy ? "disabled" : ""}>
          <span>Ordner</span>
        </button>
        <button class="btn btn-product btn-product-secondary" type="button" data-profile-icon="${escapeHtml(
          profile.slug
        )}" ${state.isBusy ? "disabled" : ""}>
          <span>${hasCustomIcon ? "Icon ändern" : "Icon wählen"}</span>
        </button>
        <button
          class="btn btn-product btn-product-danger profile-card-delete"
          type="button"
          data-profile-delete="${escapeHtml(profile.slug)}"
          title="${escapeHtml(deleteTitle)}"
          ${!canDelete || state.isBusy ? "disabled" : ""}
        >
          <span>Löschen</span>
        </button>
      </div>
    `;

    const switchButton = card.querySelector("[data-profile-switch]");
    const folderButton = card.querySelector("[data-profile-folder]");
    const iconButton = card.querySelector("[data-profile-icon]");
    const deleteButton = card.querySelector("[data-profile-delete]");
    const titleDisplay = card.querySelector("[data-profile-title]");
    const renameInput = card.querySelector("[data-profile-rename-input]");
    const switchButtonLabel = switchButton?.querySelector("span");
    const folderButtonLabel = folderButton?.querySelector("span");
    const iconButtonLabel = iconButton?.querySelector("span");
    const deleteButtonLabel = deleteButton?.querySelector("span");
    const profileIcon = card.querySelector(".profile-card-icon");

    if (switchButtonLabel) {
      switchButtonLabel.textContent = profile.isActive ? "Aktiv" : "Nutzen";
    }

    if (folderButtonLabel) {
      folderButtonLabel.textContent = "Ordner";
    }

    if (deleteButtonLabel) {
      deleteButtonLabel.textContent = "Löschen";
    }

    if (iconButtonLabel) {
      iconButtonLabel.textContent = hasCustomIcon ? "Icon ändern" : "Icon wählen";
    }

    attachImageFallback(profileIcon);

    if (titleDisplay) {
      titleDisplay.addEventListener("dblclick", () => {
        startProfileRename(profile);
      });
    }

    if (renameInput) {
      renameInput.addEventListener("input", (event) => {
        state.profileRename.value = event.target.value;
      });
      renameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void submitProfileRename(profile);
        }

        if (event.key === "Escape") {
          event.preventDefault();
          cancelProfileRename();
        }
      });
      renameInput.addEventListener("blur", () => {
        void submitProfileRename(profile, {
          fromBlur: true
        });
      });
    }

    if (switchButton && !profile.isActive) {
      switchButton.addEventListener("click", () => {
        handleSwitchProfile(profile);
      });
    }

    if (folderButton) {
      folderButton.addEventListener("click", () => {
        handleOpenProfileFolder(
          profile.instanceDirectory || profile.dataDirectory || profile.userDataPath
        );
      });
    }

    if (iconButton) {
      iconButton.addEventListener("click", () => {
        handleChooseProfileIcon(profile);
      });
    }

    if (deleteButton && canDelete) {
      deleteButton.addEventListener("click", () => {
        confirmAndDeleteProfile(profile);
      });
    }

    elements.profileCardGrid.appendChild(card);
  });
}

function setLiveOverviewText(element, value, animate = true) {
  if (!element) {
    return;
  }

  const nextValue = value == null ? "" : String(value);

  if (element.textContent === nextValue) {
    return;
  }

  const shouldAnimate =
    animate &&
    element.dataset.liveOverviewInitialized === "true" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  element.textContent = nextValue;
  element.dataset.liveOverviewInitialized = "true";
  element.classList.add("live-overview-value");

  if (!shouldAnimate) {
    return;
  }

  const activeAnimation = liveOverviewAnimations.get(element);

  if (activeAnimation) {
    activeAnimation.cancel();
  }

  const animation = element.animate(
    [
      { opacity: 0.55, transform: "translateY(4px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    {
      duration: 220,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    }
  );

  liveOverviewAnimations.set(element, animation);
  animation.addEventListener(
    "finish",
    () => {
      if (liveOverviewAnimations.get(element) === animation) {
        liveOverviewAnimations.delete(element);
      }
    },
    { once: true }
  );
}

function renderLiveOverview() {
  const account = state.config?.account || null;
  const installState = state.config?.installState || null;
  const modding = state.config?.modding || null;
  const selectedCounts = getSelectionCounts(modding);
  const changeStats = installState
    ? getSelectionChangeStats(modding, getInstalledSelectionSnapshot(installState))
    : { added: 0, removed: 0, total: 0 };
  const isRunning = Boolean(state.config?.isRunning);
  const server = state.serverStatus;
  const hasServerSnapshot = Boolean(server.checkedAt);
  const isStopped = !isRunning && !state.config?.launchState?.canStop && Boolean(state.lastProcessState);
  const runtimeText = installState
    ? `Fabric ${installState.fabricLoaderVersion} auf ${installState.minecraftVersion}`
    : "Nicht installiert";
  setLiveOverviewText(elements.clientReadyLabel, account?.name || "Nicht angemeldet");
  setLiveOverviewText(
    elements.clientModsDetail,
    installState
      ? `Auswahl: ${formatCountLabel(selectedCounts.total, "Inhalt", "Inhalte")}${changeStats.total
        ? ` · ${formatCountLabel(changeStats.total, "Änderung", "Änderungen")}`
        : ""}`
      : `Auswahl: ${formatCountLabel(selectedCounts.total, "Inhalt", "Inhalte")}`
  );

  if (server.loading && !hasServerSnapshot) {
    elements.serverHealthCard.dataset.state = "loading";
    elements.serverHealthLabel.textContent = "Lädt...";
    elements.serverPlayersLabel.textContent = "-";
    elements.serverLatencyLabel.textContent = "-";
    return;
  }

  if (!server.online) {
    elements.serverHealthCard.dataset.state = "offline";
    setLiveOverviewText(elements.serverHealthLabel, "Offline");
    setLiveOverviewText(elements.serverPlayersLabel, "0 / 0");
    setLiveOverviewText(elements.serverLatencyLabel, "Keine Antwort");
    elements.serverHealthLabel.textContent = "Offline";
    elements.serverPlayersLabel.textContent = "0 / 0";
    elements.serverLatencyLabel.textContent = "Keine Antwort";
    return;
  }

  elements.serverHealthCard.dataset.state = "online";
  setLiveOverviewText(elements.serverHealthLabel, "Online");
  setLiveOverviewText(elements.serverPlayersLabel, `${server.playersOnline ?? 0} / ${server.playersMax ?? 0}`);
  setLiveOverviewText(elements.serverLatencyLabel, `${server.latencyMs ?? "-"} ms`);
  elements.serverHealthLabel.textContent = "Online";
  elements.serverPlayersLabel.textContent = `${server.playersOnline ?? 0} / ${server.playersMax ?? 0}`;
  elements.serverLatencyLabel.textContent = `${server.latencyMs ?? "-"} ms`;
}

async function refreshServerStatus() {
  if (state.serverStatus.loading && state.serverStatus.checkedAt) {
    return;
  }

  state.serverStatus = {
    ...state.serverStatus,
    loading: true,
    error: null
  };

  if (!state.serverStatus.checkedAt) {
    renderLiveOverview();
  }

  try {
    const nextStatus = await window.boocordApi.getServerStatus();
    state.serverStatus = {
      ...state.serverStatus,
      ...nextStatus,
      loading: false
    };
  } catch (error) {
    state.serverStatus = {
      ...state.serverStatus,
      loading: false,
      online: false,
      error: error.message || String(error),
      checkedAt: new Date().toISOString()
    };
  }

  renderLiveOverview();
}

function hydrateModdingState(configVersion = state.configVersion, moddingRevision = state.moddingRevision) {
  if (!state.config) {
    return Promise.resolve(null);
  }

  if (
    state.moddingRefreshPromise &&
    state.moddingRefreshToken === configVersion &&
    state.moddingRefreshRevision === moddingRevision
  ) {
    return state.moddingRefreshPromise;
  }

  state.moddingRefreshToken = configVersion;
  state.moddingRefreshRevision = moddingRevision;
  state.moddingRefreshPromise = window.boocordApi.getModdingState()
    .then((modding) => {
      if (!state.config || configVersion !== state.configVersion || moddingRevision !== state.moddingRevision) {
        return null;
      }

      const previousModding = state.config.modding || null;
      const nextModding = mergePendingModdingState(previousModding, modding);
      state.config.modding = nextModding;

      if (sameRenderedModdingState(previousModding, nextModding)) {
        syncSettingsWithModdingState(nextModding);
        syncActiveProfileSelectionCounts(nextModding);
      } else {
        renderModdingRefreshState();
      }

      if (state.activeTab === "modding" && state.activeModdingMode === "browser") {
        void ensureInitialModSearchResults();
      }
      return nextModding;
    })
    .catch((error) => {
      if (!state.config || configVersion !== state.configVersion || moddingRevision !== state.moddingRevision) {
        return null;
      }

      const previousModding = state.config.modding || null;
      const nextModding = {
        ...previousModding,
        loading: false,
        minecraftVersionsLoaded: true,
        fabricLoadersLoaded: true,
        error: error.message || String(error)
      };
      state.config.modding = nextModding;

      if (sameRenderedModdingState(previousModding, nextModding)) {
        syncSettingsWithModdingState(nextModding);
        syncActiveProfileSelectionCounts(nextModding);
      } else {
        renderModdingRefreshState();
      }

      appendLog(`[error] ${error.stack || error.message || String(error)}`);
      return null;
    })
    .finally(() => {
      if (state.moddingRefreshToken === configVersion && state.moddingRefreshRevision === moddingRevision) {
        state.moddingRefreshPromise = null;
      }
    });

  return state.moddingRefreshPromise;
}

function invalidateModdingStateHydration() {
  state.moddingRevision += 1;
}

function ensureInitialModSearchResults() {
  if (!state.config?.modding || state.searchHasRun || state.searchLoading) {
    return Promise.resolve();
  }

  if (!elements.minecraftVersionSelect.value) {
    return Promise.resolve();
  }

  return handleModSearch(true, 1, { silent: true });
}

function wirePageChrome() {
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 20) {
      elements.navbar.classList.add("scrolled");
    } else {
      elements.navbar.classList.remove("scrolled");
    }
  });

  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tabTarget;

      if (target) {
        switchTab(target);
      }
    });
  });

  elements.moddingModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.moddingModeTarget;

      if (target) {
        switchModdingMode(target);
      }
    });
  });

  elements.moddingContentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.moddingContentTarget;

      if (target) {
        switchModdingContentType(target);
      }
    });
  });

  if (elements.mobileMenuButton) {
    elements.mobileMenuButton.addEventListener("click", () => {
      elements.navCenter.classList.toggle("is-open");
    });
  }

  if (elements.launcherWindowMinimizeButton) {
    elements.launcherWindowMinimizeButton.addEventListener("click", () => {
      window.boocordApi.minimizeLauncherWindow();
    });
  }

  if (elements.launcherWindowDragRegion) {
    elements.launcherWindowDragRegion.addEventListener("pointerdown", (event) => {
      if (
        !state.launcherWindow.isRestorable ||
        event.button !== 0 ||
        state.manualWindowDrag.active ||
        state.manualWindowDrag.beginPending
      ) {
        return;
      }

      event.preventDefault();
      state.manualWindowDrag = {
        active: false,
        beginPending: false,
        pointerId: event.pointerId
      };

      try {
        elements.launcherWindowDragRegion.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture can be dropped during restore on Windows. The drag continues via window listeners.
      }

      void beginManualLauncherWindowDrag(event);
    });
  }

  window.addEventListener("pointermove", (event) => {
    updateManualLauncherWindowDrag(event);
  });

  window.addEventListener("pointerup", (event) => {
    endManualLauncherWindowDrag(event.pointerId);
  });

  window.addEventListener("pointercancel", (event) => {
    endManualLauncherWindowDrag(event.pointerId);
  });

  window.addEventListener("blur", () => {
    endManualLauncherWindowDrag();
  });

  if (elements.launcherWindowMaximizeButton) {
    elements.launcherWindowMaximizeButton.addEventListener("click", async () => {
      const nextState = await window.boocordApi.toggleLauncherMaximize();
      applyLauncherWindowState(nextState);
    });
  }

  if (elements.launcherWindowCloseButton) {
    elements.launcherWindowCloseButton.addEventListener("click", () => {
      window.boocordApi.closeLauncherWindow();
    });
  }

  elements.year.textContent = new Date().getFullYear();
}

function setStatus(message, isError = false) {
  if (!elements.statusText) {
    return;
  }

  setLocalizedText(elements.statusText, message);
  elements.statusText.style.color = isError ? "var(--danger)" : "var(--text)";
}

function setStatusDetail(message) {
  if (elements.statusDetail) {
    setLocalizedText(elements.statusDetail, message);
  }
}

function setProgress({
  active = false,
  label = "Warten auf Aktion",
  detail = null,
  percent = 0,
  indeterminate = false
}) {
  const safePercent = Number.isFinite(percent) ? Math.max(0, Math.min(percent, 100)) : 0;

  state.progress = {
    active,
    label,
    detail: detail || state.progress.detail,
    percent: safePercent,
    indeterminate
  };

  if (elements.progressShell) {
    elements.progressShell.dataset.active = String(active);
    elements.progressShell.dataset.indeterminate = String(indeterminate);
  }

  if (elements.progressMeta) {
    setLocalizedText(elements.progressMeta, label);
  }

  if (elements.progressBar) {
    elements.progressBar.style.width = indeterminate ? "35%" : `${safePercent}%`;
  }

  if (detail) {
    setStatusDetail(detail);
  }
}

function resetProgress(detail = "Noch keine Aktion aktiv.") {
  setProgress({
    active: false,
    label: "Warten auf Aktion",
    detail,
    percent: 0,
    indeterminate: false
  });
}

function isUnhelpfulObjectString(message) {
  return /^\[object .+\]$/i.test(String(message || "").trim());
}

function stringifyErrorObject(error, seen = new WeakSet()) {
  if (!error || typeof error !== "object") {
    return "";
  }

  if (seen.has(error)) {
    return "";
  }

  seen.add(error);

  const preferredKeys = ["message", "error", "reason", "detail", "details", "description"];

  for (const key of preferredKeys) {
    const value = error[key];
    const message = normalizeErrorValue(value, seen);

    if (message && !isUnhelpfulObjectString(message)) {
      return message;
    }
  }

  if (error.code && typeof error.code !== "object") {
    return String(error.code).trim();
  }

  try {
    const serialized = JSON.stringify(error);
    return serialized && serialized !== "{}" ? serialized : "";
  } catch {
    return "";
  }
}

function normalizeErrorValue(value, seen = new WeakSet()) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  return stringifyErrorObject(value, seen);
}

function normalizeIpcErrorMessage(channel, error, fallbackMessage) {
  let message = normalizeErrorValue(error?.message);

  if (!message || isUnhelpfulObjectString(message)) {
    message = normalizeErrorValue(error);
  }

  if (channel) {
    const escapedChannel = String(channel).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    message = message.replace(
      new RegExp(`^Error invoking remote method ['"\`]${escapedChannel}['"\`]:\\s*`, "i"),
      ""
    );
  }

  while (/^Error:\s*/i.test(message)) {
    message = message.replace(/^Error:\s*/i, "");
  }

  message = message.replace(/\s+/g, " ").trim();
  if (!message || isUnhelpfulObjectString(message)) {
    return fallbackMessage;
  }

  return message || fallbackMessage;
}

function normalizeLaunchErrorMessage(error) {
  return normalizeIpcErrorMessage("launcher:launch", error, "Start fehlgeschlagen.");
}

function isLoginAbortedError(error) {
  const message = normalizeIpcErrorMessage("launcher:login", error, "").toLowerCase();
  return message === "login wurde abgebrochen." || message === "error.gui.closed";
}

function markProcessStopped(kind = "stopped", detail = "Der Startprozess wurde beendet.") {
  state.isStopping = false;
  state.lastProcessState = kind;

  if (state.config) {
    state.config.launchState = getIdleLaunchState();
    state.config.isRunning = false;
    renderState();
  }

  setProgress({
    active: false,
    label: "Prozess gestoppt",
    detail,
    percent: 0,
    indeterminate: false
  });
}

function openLaunchErrorModal(message, detail = "Der Startprozess wurde beendet und als gestoppt markiert.") {
  if (!elements.launchErrorModal) {
    return;
  }

  elements.launchErrorTitle.textContent = "Start fehlgeschlagen";
  elements.launchErrorMessage.textContent = message || "Der Startvorgang konnte nicht abgeschlossen werden.";
  elements.launchErrorDetail.textContent = detail;
  elements.launchErrorModal.hidden = false;
  document.body.classList.add("launch-error-open");
}

function closeLaunchErrorModal() {
  if (!elements.launchErrorModal) {
    return;
  }

  elements.launchErrorModal.hidden = true;
  document.body.classList.remove("launch-error-open");
}

function sameLaunchState(left, right) {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.phase === right.phase &&
    left.isPreparing === right.isPreparing &&
    left.isRunning === right.isRunning &&
    left.isStopping === right.isStopping &&
    left.canStop === right.canStop &&
    left.pid === right.pid
  );
}

function getIdleLaunchState() {
  return {
    phase: "idle",
    isPreparing: false,
    isRunning: false,
    isStopping: false,
    canStop: false,
    pid: null
  };
}

function renderLogOutput({ preserveScroll = true } = {}) {
  if (!elements.resultBox) {
    return;
  }

  const shouldStickToBottom =
    !preserveScroll ||
    elements.resultBox.scrollTop + elements.resultBox.clientHeight >=
      elements.resultBox.scrollHeight - 12;
  const text = translateLogLines(state.logLines, currentLanguage).join("\n");
  elements.resultBox.textContent = text;

  if (shouldStickToBottom) {
    elements.resultBox.scrollTop = elements.resultBox.scrollHeight;
  }
}

function flushPendingLogs() {
  if (!state.pendingLogLines.length) {
    return;
  }

  const hasDefaultPlaceholder = state.logLines.length === 1 && state.logLines[0] === "Launcher bereit.";

  if (!elements.resultBox) {
    const existingLines = hasDefaultPlaceholder || state.logsCleared ? [] : state.logLines;
    state.logLines = [...existingLines, ...state.pendingLogLines].slice(-maxLauncherLogLines);
    state.pendingLogLines = [];
    state.logsCleared = false;
    return;
  }

  const shouldStickToBottom =
    elements.resultBox.scrollTop + elements.resultBox.clientHeight >=
    elements.resultBox.scrollHeight - 12;
  const existingLines = hasDefaultPlaceholder || state.logsCleared ? [] : state.logLines;

  state.logLines = [...existingLines, ...state.pendingLogLines].slice(-maxLauncherLogLines);
  state.pendingLogLines = [];
  state.logsCleared = false;
  renderLogOutput({ preserveScroll: !shouldStickToBottom });
}

function flushLogsNow() {
  if (state.logFlushTimer === null) {
    return;
  }

  window.clearTimeout(state.logFlushTimer);
  state.logFlushTimer = null;
  flushPendingLogs();
}

function getLauncherLogText() {
  const visibleLines =
    state.logLines.length === 1 && state.logLines[0] === "Launcher bereit."
      ? []
      : state.logLines;
  const combinedLines = [...visibleLines, ...state.pendingLogLines];

  if (combinedLines.length) {
    return combinedLines.join("\n");
  }

  return state.logsCleared ? "" : "Launcher bereit.";
}

function showTemporaryButtonLabel(labelElement, label, fallbackLabel, duration = 1800) {
  if (!labelElement) {
    return;
  }

  if (labelElement._resetTimer) {
    window.clearTimeout(labelElement._resetTimer);
  }

  labelElement.textContent = label;
  labelElement._resetTimer = window.setTimeout(() => {
    labelElement.textContent = fallbackLabel;
    labelElement._resetTimer = null;
  }, duration);
}

function showTemporaryCopyIconState(
  buttonElement,
  iconElement,
  iconName,
  label,
  fallbackIcon = "content_copy",
  fallbackLabel = "Logs kopieren",
  duration = 1800
) {
  if (!buttonElement || !iconElement) {
    return;
  }

  if (buttonElement._resetTimer) {
    window.clearTimeout(buttonElement._resetTimer);
  }

  iconElement.textContent = iconName;
  buttonElement.setAttribute("aria-label", label);
  buttonElement.title = label;
  buttonElement.dataset.feedback =
    iconName === "check" ? "success" : iconName === "error_outline" ? "error" : "";

  buttonElement._resetTimer = window.setTimeout(() => {
    iconElement.textContent = fallbackIcon;
    buttonElement.setAttribute("aria-label", fallbackLabel);
    buttonElement.title = fallbackLabel;
    delete buttonElement.dataset.feedback;
    buttonElement._resetTimer = null;
  }, duration);
}

function appendLog(message) {
  const normalizedMessage = String(message || "").trim();

  if (!normalizedMessage) {
    return;
  }

  state.pendingLogLines.push(normalizedMessage);

  if (state.logFlushTimer !== null) {
    return;
  }

  state.logFlushTimer = window.setTimeout(() => {
    state.logFlushTimer = null;
    flushPendingLogs();
  }, logFlushDelayMs);
}

async function handleCopyLogs() {
  const defaultLabel = "Logs kopieren";

  try {
    flushLogsNow();
    await window.boocordApi.copyText(getLauncherLogText());
    showTemporaryCopyIconState(
      elements.resultCopyButton,
      elements.resultCopyIcon,
      "check",
      "Logs kopiert",
      "content_copy",
      defaultLabel
    );
  } catch (error) {
    showTemporaryCopyIconState(
      elements.resultCopyButton,
      elements.resultCopyIcon,
      "error_outline",
      "Kopieren fehlgeschlagen",
      "content_copy",
      defaultLabel,
      2600
    );
    setStatus(error.message || "Logs konnten nicht kopiert werden.", true);
    setStatusDetail(error.message || "Logs konnten nicht in die Zwischenablage geschrieben werden.");
  }
}

function handleClearLogs() {
  const defaultLabel = "Logs leeren";

  if (state.logFlushTimer !== null) {
    window.clearTimeout(state.logFlushTimer);
    state.logFlushTimer = null;
  }

  state.logLines = [];
  state.logsCleared = true;
  state.pendingLogLines = [];

  if (elements.resultBox) {
    elements.resultBox.textContent = "";
    elements.resultBox.scrollTop = 0;
  }

  showTemporaryCopyIconState(
    elements.resultClearButton,
    elements.resultClearIcon,
    "check",
    "Logs geleert",
    "delete",
    defaultLabel
  );
}

function queueRenderState() {
  if (!state.config || state.renderQueued) {
    return;
  }

  state.renderQueued = true;
  window.requestAnimationFrame(() => {
    state.renderQueued = false;

    if (state.config) {
      renderState();
    }
  });
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded = value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

function asPercent(current, total) {
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.round((current / total) * 100);
}

function updateProgressFromEvent(payload) {
  if (!payload?.stage) {
    return;
  }

  if (payload.stage === "progress" && Number.isFinite(payload.task) && Number.isFinite(payload.total)) {
    const percent = asPercent(payload.task, payload.total);
    const label = `${payload.kind || "Download"} ${payload.task}/${payload.total} (${percent}%)`;
    setProgress({
      active: true,
      label,
      detail: payload.message,
      percent,
      indeterminate: false
    });
    return;
  }

  if (payload.stage === "download" && Number.isFinite(payload.current) && Number.isFinite(payload.total)) {
    const percent = asPercent(payload.current, payload.total);
    const currentText = formatBytes(payload.current);
    const totalText = formatBytes(payload.total);
    const detail =
      currentText && totalText
        ? `${payload.name || "Datei"} ${currentText} / ${totalText}`
        : payload.message;

    setProgress({
      active: true,
      label: `Datei-Download ${percent}%`,
      detail,
      percent,
      indeterminate: false
    });
    return;
  }

  if (payload.stage === "ready") {
    setProgress({
      active: true,
      label: "Installation abgeschlossen",
      detail: payload.message,
      percent: 100,
      indeterminate: false
    });
    return;
  }

  if (payload.stage === "launch") {
    setProgress({
      active: true,
      label: "Minecraft gestartet",
      detail: payload.message,
      percent: 100,
      indeterminate: false
    });
    return;
  }

  if (payload.stage === "close") {
    if (payload.failed) {
      markProcessStopped("failed", payload.message || "Startprozess wurde beendet.");
    } else {
      resetProgress(payload.message);
    }
    return;
  }

  if (payload.stage === "error") {
    const message = payload.message || "Start fehlgeschlagen.";
    setStatus(message, true);
    setStatusDetail(message);
    setProgress({
      active: false,
      label: "Start fehlgeschlagen",
      detail: message,
      percent: 0,
      indeterminate: false
    });
    return;
  }

  if (["status", "auth", "fabric", "download"].includes(payload.stage)) {
    setProgress({
      active: true,
      label: payload.stage === "auth" ? "Anmeldung" : "Launcher arbeitet",
      detail: payload.message,
      percent: state.progress.percent,
      indeterminate: true
    });
  }
}

function currentOptions() {
  return {
    dataDirectory: state.config?.settings?.dataDirectory,
    memory: {
      min: elements.memoryMinInput.value.trim(),
      max: elements.memoryMaxInput.value.trim()
    },
    modding: {
      minecraftVersion: elements.minecraftVersionSelect.value,
      fabricLoaderVersion: elements.fabricLoaderSelect.value || null
    }
  };
}

function setButtonsDisabled(buttons, disabled) {
  buttons.forEach((button) => {
    if (button) {
      button.disabled = disabled;
    }
  });
}

function setButtonLabels(buttons, text) {
  buttons.forEach((button) => {
    const label = button?.querySelector("span");

    if (label) {
      label.textContent = text;
    }
  });
}

function closeAccountDropdown() {
  elements.accountTrigger.dataset.open = "false";
  elements.accountDropdown.dataset.open = "false";
}

function openAccountDropdown() {
  elements.accountTrigger.dataset.open = "true";
  elements.accountDropdown.dataset.open = "true";
}

function toggleAccountDropdown() {
  const isOpen = elements.accountDropdown.dataset.open === "true";

  if (isOpen) {
    closeAccountDropdown();
  } else {
    openAccountDropdown();
  }
}

function renderAccountList() {
  const accounts = state.config?.accounts || [];
  const activeId = state.config?.account?.id || null;

  elements.accountList.innerHTML = "";

  if (accounts.length === 0) {
    const empty = document.createElement("button");
    empty.className = "account-entry account-entry-empty";
    empty.disabled = true;
    empty.innerHTML = `
      <img class="account-entry-avatar" src="./logo.png" alt="Kein Account">
      <span>Noch kein Account gespeichert</span>
    `;
    elements.accountList.appendChild(empty);
    return;
  }

  accounts.forEach(({ account }) => {
    const button = document.createElement("button");
    button.className = "account-entry";
    button.dataset.active = String(account.id === activeId);
    button.dataset.accountId = account.id;
    button.innerHTML = `
      <img class="account-entry-avatar" src="${account.avatarUrl || "./logo.png"}" alt="${account.name}" data-fallback="./logo.png">
      <div class="account-entry-main">
        <strong>${account.name}</strong>
        <small>${account.id === activeId ? "Aktiver Account" : "Gespeicherter Account"}</small>
      </div>
      <span class="material-icons account-entry-check">check_circle</span>
    `;

    button.addEventListener("click", async () => {
      if (account.id === activeId) {
        closeAccountDropdown();
        return;
      }

      await handleSwitchAccount(account.id);
    });

    attachImageFallback(button.querySelector(".account-entry-avatar"));
    elements.accountList.appendChild(button);
  });
}

function normalizeSelectOptions(options, formatLabel) {
  return (options || []).map((option) => ({
    value: String(option?.value ?? ""),
    label: formatLabel(option),
    disabled: Boolean(option?.disabled)
  }));
}

function selectMatchesOptions(select, options, value) {
  if (!select || select.options.length !== options.length) {
    return false;
  }

  if ((select.value || "") !== (value || "")) {
    return false;
  }

  return options.every((option, index) => {
    const current = select.options[index];

    return (
      Boolean(current) &&
      current.value === option.value &&
      current.textContent === option.label &&
      current.disabled === option.disabled
    );
  });
}

function setSelectValue(select, value) {
  if (!select) {
    return false;
  }

  const nextValue = String(value ?? "");

  if (select.value === nextValue) {
    return false;
  }

  select.value = nextValue;
  syncCustomSelect(select);
  return true;
}

function renderSelectOptions(select, options, value, formatLabel) {
  const normalizedOptions = normalizeSelectOptions(options, formatLabel);
  const normalizedValue = normalizedOptions.some((option) => option.value === String(value ?? ""))
    ? String(value ?? "")
    : normalizedOptions[0]?.value || "";

  if (selectMatchesOptions(select, normalizedOptions, normalizedValue)) {
    return;
  }

  select.innerHTML = "";

  normalizedOptions.forEach((option) => {
    const entry = document.createElement("option");
    entry.value = option.value;
    entry.textContent = option.label;
    entry.disabled = option.disabled;
    entry.selected = option.value === normalizedValue;
    select.appendChild(entry);
  });

  if (select.options.length) {
    select.value = normalizedValue;
  }

  syncCustomSelect(select);
}

function renderLoadingSelectOption(select, label = "Wird geladen...") {
  const normalizedOptions = [{
    value: "",
    label,
    disabled: true
  }];

  if (selectMatchesOptions(select, normalizedOptions, "")) {
    return;
  }

  select.innerHTML = "";

  const entry = document.createElement("option");
  entry.value = "";
  entry.textContent = label;
  entry.selected = true;
  entry.disabled = true;
  select.appendChild(entry);

  syncCustomSelect(select);
}

function renderSelectedMods() {
  const selectedMods = state.config?.modding?.selectedMods || [];
  if (elements.selectedModTotal) {
    elements.selectedModTotal.textContent = String(selectedMods.length);
  }
  elements.selectedModState.textContent = selectedMods.length ? "Bereit" : "Leer";
  elements.selectedMods.innerHTML = "";

  if (!selectedMods.length) {
    elements.selectedMods.innerHTML = '<div class="empty-state">Noch keine Mods ausgewählt.</div>';
    return;
  }

  selectedMods.forEach((mod) => {
    const card = document.createElement("div");
    card.className = "mod-entry selected-mod-entry";
    card.dataset.selected = "true";
    card.innerHTML = `
      <div class="mod-entry-main">
        <img class="mod-entry-icon" src="${escapeHtml(mod.iconUrl || "./logo.png")}" alt="${escapeHtml(mod.title || mod.projectId)}" data-fallback="./logo.png">
        <div>
          <strong>${escapeHtml(mod.title || mod.projectId)}</strong>
          <p>${escapeHtml(mod.description || "Keine Beschreibung verfügbar.")}</p>
        </div>
      </div>
      <div class="mod-entry-footer">
        <button class="btn btn-product btn-product-secondary mod-action-button" data-remove-mod="${escapeHtml(mod.projectId)}" type="button">
          <span>Entfernen</span>
        </button>
      </div>
    `;

    attachImageFallback(card.querySelector(".mod-entry-icon"));
    card.querySelector("[data-remove-mod]").addEventListener("click", () => {
      handleRemoveMod(mod.projectId);
    });
    elements.selectedMods.appendChild(card);
  });
}

function renderSearchResults() {
  const selectedIds = new Set((state.config?.modding?.selectedMods || []).map((mod) => mod.projectId));
  elements.modSearchResults.innerHTML = "";

  if (!state.searchHasRun) {
    elements.modSearchCount.textContent = "Noch keine Suche";
    elements.modSearchResults.innerHTML = '<div class="empty-state">Noch keine Suche gestartet.</div>';
    return;
  }

  if (!state.searchResults.length) {
    elements.modSearchCount.textContent = "Keine Treffer";
    elements.modSearchResults.innerHTML =
      '<div class="empty-state">Keine kompatiblen Fabric-Mods für diese Suche gefunden.</div>';
    return;
  }

  elements.modSearchCount.textContent = `${state.searchResults.length} Treffer`;

  state.searchResults.forEach((mod) => {
    const isInstalled = selectedIds.has(mod.projectId);
    const card = document.createElement("div");
    card.className = "mod-entry";
    card.dataset.selected = String(isInstalled);
    card.innerHTML = `
      <div class="mod-entry-main">
        <img class="mod-entry-icon" src="${escapeHtml(mod.iconUrl || "./logo.png")}" alt="${escapeHtml(mod.title || mod.slug)}" data-fallback="./logo.png">
        <div>
          <strong>${escapeHtml(mod.title || mod.slug || mod.projectId)}</strong>
          <p>${escapeHtml(mod.description || "Keine Beschreibung verfügbar.")}</p>
        </div>
      </div>
      <div class="mod-entry-footer">
        <div class="mod-entry-tags">
          ${renderModTags(mod.categories, "Fabric Mod")}
        </div>
        <button class="btn btn-product ${isInstalled ? "btn-product-secondary" : ""} mod-action-button" data-mod-action="${escapeHtml(mod.projectId)}" type="button">
          <span>${isInstalled ? "Ausgewählt" : "Hinzufügen"}</span>
        </button>
      </div>
    `;

    attachImageFallback(card.querySelector(".mod-entry-icon"));
    card.querySelector("[data-mod-action]").addEventListener("click", () => {
      if (isInstalled) {
        handleRemoveMod(mod.projectId);
      } else {
        handleAddMod(mod.projectId);
      }
    });
    elements.modSearchResults.appendChild(card);
  });
}

function renderSelectedMods() {
  const selectedMods = state.config?.modding?.selectedMods || [];
  if (elements.selectedModTotal) {
    elements.selectedModTotal.textContent = String(selectedMods.length);
  }
  elements.selectedModState.textContent = selectedMods.length ? "Bereit" : "Leer";
  elements.selectedMods.innerHTML = "";

  if (!selectedMods.length) {
    elements.selectedMods.innerHTML = '<div class="empty-state">Noch keine Mods ausgewählt.</div>';
    return;
  }

  selectedMods.forEach((mod) => {
    const card = document.createElement("div");
    card.className = isLocalOnly
      ? "mod-entry selected-mod-entry"
      : "mod-entry selected-mod-entry mod-entry-clickable";
    card.dataset.selected = "true";
    card.innerHTML = `
      <div class="mod-entry-body">
        <div class="mod-entry-main">
          <img class="mod-entry-icon" src="${escapeHtml(mod.iconUrl || "./logo.png")}" alt="${escapeHtml(
            mod.title || mod.projectId
          )}" data-fallback="./logo.png">
          <div>
            <strong>${escapeHtml(mod.title || mod.projectId)}</strong>
            <p>${escapeHtml(mod.description || "Keine Beschreibung verfügbar.")}</p>
          </div>
        </div>
      </div>
      <div class="mod-entry-footer">
        <div class="mod-entry-footer-actions">
          <button class="btn btn-product btn-product-secondary mod-entry-open" data-open-mod="${escapeHtml(
            mod.projectId
          )}" type="button">
            <span>Details</span>
          </button>
          <button class="btn btn-product btn-product-secondary mod-action-button" data-remove-mod="${escapeHtml(
            mod.projectId
          )}" type="button">
            <span>Entfernen</span>
          </button>
        </div>
      </div>
    `;

    attachImageFallback(card.querySelector(".mod-entry-icon"));
    card.addEventListener("click", () => {
      handleOpenModDetails(mod.projectId, mod);
    });
    card.querySelector("[data-open-mod]").addEventListener("click", (event) => {
      event.stopPropagation();
      handleOpenModDetails(mod.projectId, mod);
    });
    card.querySelector("[data-remove-mod]").addEventListener("click", (event) => {
      event.stopPropagation();
      handleRemoveMod(mod.projectId);
    });
    elements.selectedMods.appendChild(card);
  });
}

function renderSearchResults() {
  const selectedIds = new Set((state.config?.modding?.selectedMods || []).map((mod) => mod.projectId));
  elements.modSearchResults.innerHTML = "";
  renderPagination();

  if (state.searchLoading && !state.searchHasRun) {
    elements.modSearchCount.textContent = "Lade Vorschläge...";
    elements.modSearchResults.innerHTML = '<div class="empty-state">Kompatible Fabric-Mods werden geladen...</div>';
    return;
  }

  if (!state.searchHasRun) {
    elements.modSearchCount.textContent = "Noch keine Suche";
    elements.modSearchResults.innerHTML = '<div class="empty-state">Noch keine Suche gestartet.</div>';
    return;
  }

  if (!state.searchResults.length) {
    elements.modSearchCount.textContent = state.searchPagination.totalHits
      ? `${formatNumber(state.searchPagination.totalHits)} Treffer`
      : "Keine Treffer";
    elements.modSearchResults.innerHTML =
      '<div class="empty-state">Keine kompatiblen Fabric-Mods für diese Suche gefunden.</div>';
    return;
  }

  const rangeStart = state.searchPagination.offset + 1;
  const rangeEnd = state.searchPagination.offset + state.searchResults.length;
  elements.modSearchCount.textContent = `${rangeStart}-${rangeEnd} von ${formatNumber(state.searchPagination.totalHits)}`;

  state.searchResults.forEach((mod) => {
    const isInstalled = selectedIds.has(mod.projectId);
    const card = document.createElement("div");
    card.className = "mod-entry mod-entry-clickable";
    card.dataset.selected = String(isInstalled);
    card.innerHTML = `
      <div class="mod-entry-body">
        <div class="mod-entry-main">
          <img class="mod-entry-icon" src="${escapeHtml(mod.iconUrl || "./logo.png")}" alt="${escapeHtml(
            mod.title || mod.slug
          )}" data-fallback="./logo.png">
          <div>
            <strong>${escapeHtml(mod.title || mod.slug || mod.projectId)}</strong>
            <p>${escapeHtml(mod.description || "Keine Beschreibung verfügbar.")}</p>
          </div>
        </div>
      </div>
      <div class="mod-entry-footer">
        <div class="mod-entry-tags">
          ${renderModTags(mod.categories, "Fabric Mod")}
        </div>
        <div class="mod-entry-footer-actions">
          <button class="btn btn-product btn-product-secondary mod-entry-open" data-open-mod="${escapeHtml(
            mod.projectId
          )}" type="button">
            <span>Details</span>
          </button>
          <button class="btn btn-product ${isInstalled ? "btn-product-secondary" : ""} mod-action-button" data-mod-action="${escapeHtml(
            mod.projectId
          )}" type="button">
            <span>${isInstalled ? "Ausgewählt" : "Hinzufügen"}</span>
          </button>
        </div>
      </div>
    `;

    attachImageFallback(card.querySelector(".mod-entry-icon"));
    card.addEventListener("click", () => {
      handleOpenModDetails(mod.projectId, mod);
    });
    card.querySelector("[data-open-mod]").addEventListener("click", (event) => {
      event.stopPropagation();
      handleOpenModDetails(mod.projectId, mod);
    });
    card.querySelector("[data-mod-action]").addEventListener("click", (event) => {
      event.stopPropagation();

      if (isInstalled) {
        handleRemoveMod(mod.projectId);
      } else {
        handleAddMod(mod.projectId);
      }
    });
    elements.modSearchResults.appendChild(card);
  });

  renderPagination();
}

async function handleOpenModDetails(projectId, preview = null) {
  if (!projectId) {
    return;
  }

  const minecraftVersion = elements.minecraftVersionSelect.value;
  const cacheKey = buildDetailCacheKey(projectId, minecraftVersion, "fabric");
  state.activeModPreview = preview
    ? {
        ...preview,
        projectId,
        projectType: "mod"
      }
    : {
        projectId,
        projectType: "mod",
        title: projectId,
        description: "Details werden geladen..."
      };
  state.activeModDetail = state.modDetailsCache.get(cacheKey) || null;
  state.activeModDetailCacheKey = cacheKey;
  state.modDetailLoading = !state.activeModDetail;
  openModDetailModal();
  renderModDetailModal();

  if (state.modDetailsCache.has(cacheKey)) {
    return;
  }

  try {
    const detail = await window.boocordApi.getModDetails({
      projectId,
      minecraftVersion,
      loader: "fabric"
    });

    state.modDetailsCache.set(cacheKey, detail);

    if (state.activeModDetailCacheKey !== cacheKey) {
      return;
    }

    state.activeModDetail = detail;
    state.modDetailLoading = false;
    renderModDetailModal();
  } catch (error) {
    if (state.activeModDetailCacheKey !== cacheKey) {
      return;
    }

    state.modDetailLoading = false;
    setStatus(error.message || "Mod-Details konnten nicht geladen werden.", true);
    setStatusDetail(error.message || "Mod-Details konnten nicht geladen werden.");
    renderModDetailModal();
  }
}

function setBusy(isBusy) {
  const hasAccount = Boolean(state.config?.account);
  const launchState = state.config?.launchState || {};
  const canStop = Boolean(launchState.canStop);
  state.isBusy = isBusy;

  elements.browseButton.disabled = isBusy;
  elements.profileCreateInput.disabled = isBusy;
  elements.profileCreateButton.disabled = isBusy;
  elements.profileImportButton.disabled = isBusy;
  elements.logoutButton.disabled = isBusy || !hasAccount;
  elements.navLogoutButton.disabled = isBusy || !hasAccount;
  elements.accountTrigger.disabled = isBusy;
  elements.memoryMinInput.disabled = isBusy;
  elements.memoryMaxInput.disabled = isBusy;
  if (elements.languageSelect) {
    const languageDisabledChanged = elements.languageSelect.disabled !== isBusy;
    elements.languageSelect.disabled = isBusy;
    if (languageDisabledChanged) {
      syncCustomSelect(elements.languageSelect);
    }
  }
  elements.languageChoiceButtons.forEach((button) => {
    button.disabled = isBusy;
  });
  if (elements.javaGcProfileSelect) {
    const gcProfileDisabledChanged = elements.javaGcProfileSelect.disabled !== isBusy;
    elements.javaGcProfileSelect.disabled = isBusy;
    if (gcProfileDisabledChanged) {
      syncCustomSelect(elements.javaGcProfileSelect);
    }
  }
  elements.openLogsOnLaunchInput.disabled = isBusy;
  if (elements.minimizeOnLaunchInput) {
    elements.minimizeOnLaunchInput.disabled = isBusy;
  }
  if (elements.launcherBackgroundSelectButton) {
    elements.launcherBackgroundSelectButton.disabled = isBusy;
  }
  if (elements.launcherBackgroundRemoveButton) {
    elements.launcherBackgroundRemoveButton.disabled =
      isBusy || !state.config?.settings?.launcherBackground?.fileUrl;
  }
  elements.modSearchInput.disabled = isBusy;
  elements.modCategorySelect.disabled = isBusy;
  elements.modSortSelect.disabled = isBusy;
  updateModdingVersionSelectAvailability();
  [elements.modCategorySelect, elements.modSortSelect].forEach(syncCustomSelect);
  setButtonsDisabled(buttonGroups.login, isBusy);
  setButtonsDisabled(buttonGroups.install, isBusy);
  setButtonsDisabled(buttonGroups.java, isBusy);
  setButtonsDisabled(buttonGroups.launch, isBusy || !hasAccount || canStop);
  setButtonsDisabled(buttonGroups.stop, !canStop || state.isStopping);
  setButtonsDisabled(buttonGroups.open, isBusy);
  setButtonsDisabled(buttonGroups.search, isBusy);
  renderProfileCards();
  renderPagination();
  renderModDetailModal();
  renderProfileImportBrowser();
}

function describeManagedJavaRuntime(modding) {
  const javaRuntime = modding?.javaRuntime;

  if (!javaRuntime) {
    return {
      detectedLabel: "Unbekannt",
      hint: "Java-Status wird geladen..."
    };
  }

  const releaseLabel = javaRuntime.releaseName || javaRuntime.openjdkVersion || null;

  if (modding.error) {
    const errorMessage = String(modding.error || "").trim();
    const hasCatalogTransportError =
      /JSON|Antwort geliefert|Request fehlgeschlagen|fetch failed/i.test(errorMessage);

    return {
      detectedLabel: javaRuntime.installed
        ? `Java ${javaRuntime.detected || javaRuntime.requiredMajorVersion || "?"}`
        : "Nicht installiert",
      hint: hasCatalogTransportError
        ? "Katalog aktuell nicht erreichbar. Gespeicherte Versionen und Runtime-Werte werden weiter verwendet."
        : `Katalog aktuell nicht erreichbar: ${errorMessage}`
    };
  }

  if (javaRuntime.installed) {
    if (javaRuntime.mode === "system") {
      return {
        detectedLabel:
          javaRuntime.detected !== null && javaRuntime.detected !== undefined
            ? `Java ${javaRuntime.detected}`
            : "Java erkannt",
        hint: releaseLabel
          ? `${javaRuntime.source || "Java"} wurde erkannt (${releaseLabel}). Beim Installieren oder Starten kann weiterhin die verwaltete Runtime verwendet werden.`
          : `${javaRuntime.source || "Java"} wurde erkannt. Beim Installieren oder Starten kann weiterhin die verwaltete Runtime verwendet werden.`
      };
    }

    return {
      detectedLabel:
        javaRuntime.detected !== null && javaRuntime.detected !== undefined
          ? `Java ${javaRuntime.detected}`
          : `Java ${javaRuntime.requiredMajorVersion || "?"}`,
      hint: ""
    };
  }

  if (javaRuntime.error) {
    return {
      detectedLabel: "Nicht installiert",
      hint: `Java wird bei Bedarf automatisch neu geladen. Letzter Hinweis: ${javaRuntime.error}`
    };
  }

  return {
    detectedLabel: "Nicht installiert",
    hint: ""
  };
}

function renderModdingState() {
  const modding = state.config?.modding;
  const settings = state.config?.settings;

  if (!modding) {
    return;
  }

  const minecraftVersionOptions = (modding.availableMinecraftVersions || []).map((entry) => ({
    value: entry.version,
    label: entry.version
  }));
  const categoryOptions = [
    { value: "all", label: "Alle Kategorien" },
    ...getAvailableCategoriesForActiveType().map((entry) => ({
      value: entry.value,
      label: entry.label
    }))
  ];
  const fabricLoaderOptions = (modding.availableFabricLoaders || []).map((entry) => ({
    value: entry.version,
    label: entry.stable ? `${entry.version} (stabil)` : entry.version
  }));
  const hasMinecraftVersionOptions = minecraftVersionOptions.length > 0;
  const hasFabricLoaderOptions = fabricLoaderOptions.length > 0;

  if (modding.loading && !hasMinecraftVersionOptions) {
    renderLoadingSelectOption(elements.minecraftVersionSelect);
  } else {
    renderSelectOptions(
      elements.minecraftVersionSelect,
      minecraftVersionOptions,
      modding.minecraftVersion,
      (entry) => entry.label
    );
  }
  renderSelectOptions(
    elements.modCategorySelect,
    categoryOptions,
    state.browseFilters.category,
    (entry) => entry.label
  );
  if (modding.loading && !hasFabricLoaderOptions) {
    renderLoadingSelectOption(elements.fabricLoaderSelect);
  } else {
    renderSelectOptions(
      elements.fabricLoaderSelect,
      fabricLoaderOptions,
      modding.fabricLoaderVersion,
      (entry) => entry.label
    );
  }
  updateModdingVersionSelectAvailability(modding);
  setSelectValue(elements.modSortSelect, state.browseFilters.sortIndex);
  const javaSummary = describeManagedJavaRuntime(modding);

  elements.requiredJavaVersion.textContent = modding.requiredJavaVersion
    ? `Java ${modding.requiredJavaVersion}+`
    : "Unbekannt";
  elements.detectedJavaVersion.textContent = javaSummary.detectedLabel;
  elements.memoryMinInput.value = settings.memory.min;
  elements.memoryMaxInput.value = settings.memory.max;
  elements.modInstallTarget.textContent = `Minecraft ${modding.minecraftVersion}`;

  renderSelectedMods();
  renderSearchResults();
  renderModdingModeState();
}

function syncSettingsWithModdingState(modding = state.config?.modding) {
  if (!state.config?.settings || !modding) {
    return;
  }

  state.config.settings = {
    ...state.config.settings,
    modding: {
      ...(state.config.settings.modding || {}),
      minecraftVersion: modding.minecraftVersion || state.config.settings.modding?.minecraftVersion || null,
      fabricLoaderVersion: modding.fabricLoaderVersion ?? null
    }
  };
}

function renderLauncherSummary() {
  const { settings, installState, account, isRunning, modding } = state.config;
  const profile = state.config.profile || null;
  const launchState = state.config.launchState || {};
  const canStop = Boolean(launchState.canStop);
  const isPreparing = Boolean(launchState.isPreparing);
  const isStopping = Boolean(launchState.isStopping || state.isStopping);
  const isStopped = !isRunning && !canStop && Boolean(state.lastProcessState);
  const runtimeText = installState
    ? `Fabric ${installState.fabricLoaderVersion} auf ${installState.minecraftVersion}`
    : "Noch keine Runtime installiert.";
  const accountText = account
    ? `${account.name} ist angemeldet und startbereit.`
    : "Nicht angemeldet. Melde dich an, um Minecraft mit deinem Microsoft-Profil zu starten.";
  const selectedCounts = getSelectionCounts(modding);
  const installedSelectionSnapshot = getInstalledSelectionSnapshot(installState);
  const installedCounts = getSelectionCounts(installedSelectionSnapshot);
  const changeSummary = installState
    ? formatSelectionChangeSummary(getSelectionChangeStats(modding, installedSelectionSnapshot))
    : null;
  const javaInstallText = modding?.javaRuntime?.installed
    ? `Java ${modding.javaRuntime.detected || modding.requiredJavaVersion || "?"} ist verwaltet installiert.`
    : modding?.requiredJavaVersion
      ? `Java ${modding.requiredJavaVersion} wird bei Bedarf automatisch installiert.`
      : "Java wird automatisch verwaltet.";

  if (!canStop && state.isStopping) {
    state.isStopping = false;
  }

  elements.accountAvatar.src = account?.avatarUrl || "./logo.png";
  elements.accountAvatar.alt = account?.name || "Kein Account";
  elements.accountTriggerName.textContent = account?.name || "Account";
  elements.accountTriggerSubtitle.textContent = account
    ? `${state.config.accounts.length} Accounts`
    : "Nicht angemeldet";
  elements.currentProfileLabel.textContent = formatProfileTitle(profile);
  elements.versionLabel.textContent = modding?.minecraftVersion || state.config.manifest.minecraftVersion;
  applyLauncherBackground();
  elements.accountCardText.textContent = accountText;
  elements.runtimeCardText.textContent = installState
    ? `${runtimeText}. Installiert: ${formatSelectionBreakdown(installedCounts)}. Aktuell: ${formatSelectionBreakdown(
        selectedCounts
      )}. ${changeSummary} ${javaInstallText}`
    : `Aktuell: ${formatSelectionBreakdown(selectedCounts)}. Runtime noch nicht installiert. ${javaInstallText}`;
  elements.dataDirDisplay.textContent = settings.dataDirectory;
  if (elements.heroBoocordButtonLabel) {
    elements.heroBoocordButtonLabel.textContent = isPreparing ? "Boocord startet..." : "Boocord";
  }
  if (elements.heroBoocordButtonSubtitle) {
    elements.heroBoocordButtonSubtitle.textContent = isStopping
      ? "Minecraft wird beendet"
      : isPreparing
        ? "Verbinde direkt mit boocord.com"
        : "Direkt auf boocord.com";
  }
  elements.profileLabel.textContent = `Profil: ${formatProfileTitle(profile)}`;
  elements.profileHint.innerHTML = profile?.isCustom
    ? `Aktiv per <code>--profile=${escapeHtml(profile.slug)}</code>. Jede Installation ist zusätzlich automatisch getrennt.`
    : "Weitere Profile: Launcher mit <code>--profile=name</code> starten. Jede Installation ist automatisch getrennt.";
  renderLauncherWindowChrome();
  state.lastOpenDirectory = settings.dataDirectory;
  elements.logoutButton.disabled = !account;
  elements.navLogoutButton.disabled = !account;
  setButtonsDisabled(buttonGroups.launch, !account || canStop);
  setButtonsDisabled(buttonGroups.stop, !canStop || isStopping);
  if (elements.heroBoocordButton) {
    elements.heroBoocordButton.disabled = !account || canStop;
  }
  setButtonLabels(buttonGroups.launch, isPreparing ? "Startet..." : "Spiel starten");
  setButtonLabels(buttonGroups.stop, isStopping ? "Wird beendet..." : "Spiel stoppen");
}

function renderState() {
  renderLauncherSummary();
  renderAccountList();
  renderProfileCards();
  renderModdingState();
  renderLiveOverview();
  renderModDetailModal();
  renderProfileImportBrowser();
}

function renderModdingRefreshState() {
  syncSettingsWithModdingState(state.config?.modding);
  syncActiveProfileSelectionCounts(state.config?.modding);
  renderLauncherSummary();
  renderModdingState();
  renderLiveOverview();
  renderModDetailModal();
}

function applyLauncherConfig(nextConfig, { preservePendingModding = true } = {}) {
  const previousModding = state.config?.modding || null;

  nextConfig.modding = preservePendingModding
    ? mergePendingModdingState(previousModding, nextConfig.modding)
    : nextConfig.modding;

  reconcileProfileInteractionState(nextConfig);
  state.config = nextConfig;
  state.language = normalizeLanguage(nextConfig.settings?.language || state.language);
  setCurrentLanguage(state.language);
  state.configVersion += 1;
  flushPendingLogs();
  renderState();

  if (tabNeedsModdingState(state.activeTab) && state.config?.modding?.loading) {
    void hydrateModdingState(state.configVersion);
  }
}

async function refreshState({ fast = true } = {}) {
  const nextConfig = await window.boocordApi.getLauncherState({
    fast
  });
  applyLauncherConfig(nextConfig);
}

async function persistSettings(patch, refreshSearch = false) {
  const result = await window.boocordApi.saveSettings(patch);
  state.config.settings = result.settings;
  await refreshState();

  if (refreshSearch && state.searchHasRun) {
    await handleModSearch(false);
  }
}

function shouldShowLanguagePrompt() {
  const version = Number(state.config?.settings?.languagePromptVersion || 0);
  return version < languagePromptVersion;
}

function openLanguagePrompt() {
  if (!elements.languageChoiceModal || !shouldShowLanguagePrompt()) {
    return;
  }

  state.languagePromptOpen = true;
  elements.languageChoiceModal.hidden = false;
}

function closeLanguagePrompt() {
  if (!elements.languageChoiceModal) {
    return;
  }

  state.languagePromptOpen = false;
  elements.languageChoiceModal.hidden = true;
}

async function saveLanguage(language, { markPromptSeen = false } = {}) {
  const nextLanguage = normalizeLanguage(language);
  state.language = nextLanguage;
  setCurrentLanguage(nextLanguage);

  if (elements.languageSelect) {
    setSelectValue(elements.languageSelect, nextLanguage);
  }

  const result = await window.boocordApi.saveSettings({
    language: nextLanguage,
    ...(markPromptSeen
      ? {
          languagePromptVersion
        }
      : {})
  });

  if (state.config?.settings) {
    state.config.settings = result.settings;
  }

  state.language = normalizeLanguage(result.settings?.language || nextLanguage);
  setCurrentLanguage(state.language);
  renderState();
  applyTranslations(document.body);
}

function shouldOpenLogsOnLaunch() {
  return Boolean(state.config?.settings?.openLogsOnLaunch);
}

function getOperationGuard() {
  return {
    configVersion: state.configVersion,
    profileSlug: getActiveProfileSlug()
  };
}

function isOperationGuardCurrent(guard) {
  return (
    Boolean(guard) &&
    guard.configVersion === state.configVersion &&
    guard.profileSlug === getActiveProfileSlug()
  );
}

function maybePollModdingState() {
  if (!state.config || state.isBusy || hasPendingProjectOperations() || state.activeTab !== "modding") {
    return;
  }

  void hydrateModdingState(state.configVersion);
}

async function handleLogin() {
  setBusy(true);
  setStatus("Microsoft-Login wird vorbereitet...");
  setProgress({
    active: true,
    label: "Anmeldung",
    detail: "Microsoft-Login wird vorbereitet...",
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.login(currentOptions());
    state.config.account = result.account;
    state.config.accounts = result.accounts;
    state.config.settings = result.settings;
    await refreshState();
    closeAccountDropdown();
    appendLog(`[auth] Angemeldet als ${result.account.name}`);
    setStatus(`Angemeldet als ${result.account.name}.`);
    resetProgress(`Angemeldet als ${result.account.name}.`);
  } catch (error) {
    if (isLoginAbortedError(error)) {
      setStatus("Login wurde abgebrochen.");
      resetProgress("Login wurde abgebrochen.");
      appendLog("[auth] Login wurde abgebrochen.");
    } else {
      const message = normalizeIpcErrorMessage("launcher:login", error, "Login fehlgeschlagen.");
      setStatus(message, true);
      resetProgress(message);
      appendLog(`[error] ${error.stack || error.message || String(error)}`);
    }
  } finally {
    setBusy(false);
  }
}

async function handleSwitchAccount(accountId) {
  setBusy(true);
  setStatus("Account wird gewechselt...");
  setProgress({
    active: true,
    label: "Accountwechsel",
    detail: "Gespeicherten Account aktivieren...",
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.switchAccount({
      ...currentOptions(),
      accountId
    });
    state.config.account = result.account;
    state.config.accounts = result.accounts;
    state.config.settings = result.settings;
    await refreshState();
    closeAccountDropdown();
    appendLog(`[auth] Aktiver Account: ${result.account.name}`);
    setStatus(`Aktiver Account: ${result.account.name}.`);
    resetProgress(`Aktiver Account: ${result.account.name}.`);
  } catch (error) {
    setStatus(error.message || "Accountwechsel fehlgeschlagen.", true);
    resetProgress(error.message || "Accountwechsel fehlgeschlagen.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleLogout() {
  const activeAccount = state.config?.account || null;

  if (!activeAccount) {
    return;
  }

  closeAccountDropdown();

  const confirmed = await openAccountDeleteModal(activeAccount);

  if (!confirmed) {
    return;
  }

  setBusy(true);
  setStatus("Aktiver Account wird entfernt...");
  setProgress({
    active: true,
    label: "Account entfernen",
    detail: "Aktiver Account wird entfernt...",
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.logout(currentOptions());
    state.config.account = result.account;
    state.config.accounts = result.accounts;
    state.config.settings = result.settings;
    state.config.isRunning = false;
    await refreshState();
    closeAccountDropdown();
    appendLog("[auth] Aktiver Account entfernt.");
    setStatus(result.account ? `Aktiver Account: ${result.account.name}.` : "Kein Account mehr gespeichert.");
    resetProgress(result.account ? `Aktiver Account: ${result.account.name}.` : "Kein Account mehr gespeichert.");
  } catch (error) {
    setStatus(error.message || "Logout fehlgeschlagen.", true);
    resetProgress(error.message || "Logout fehlgeschlagen.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleInstall() {
  setBusy(true);
  setStatus("Launcher-Dateien werden installiert...");
  setProgress({
    active: true,
    label: "Installation läuft",
    detail: "Launcher-Dateien werden installiert...",
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.installRuntime(currentOptions());
    state.config.settings = result.settings;
    state.config.installState = result.installState;
    await refreshState();
    appendLog(
      `[ready] Fabric ${result.installState.fabricLoaderVersion}, ${result.installState.installedMods.length} Mods bereit.`
    );
    setStatus("Installation und Update abgeschlossen.");
    setProgress({
      active: true,
      label: "Installation abgeschlossen",
      detail: `Fabric ${result.installState.fabricLoaderVersion} für Minecraft ${result.installState.minecraftVersion} ist bereit.`,
      percent: 100,
      indeterminate: false
    });
  } catch (error) {
    setStatus(error.message || "Installation fehlgeschlagen.", true);
    resetProgress(error.message || "Installation fehlgeschlagen.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleReinstallJava() {
  setBusy(true);
  setStatus("Java wird neu installiert...");
  setProgress({
    active: true,
    label: "Java wird neu installiert",
    detail: "Verwaltete Java-Runtime wird vorbereitet...",
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.reinstallJavaRuntime(currentOptions());
    state.config.settings = result.settings;
    await refreshState();
    appendLog(
      `[java] ${result.javaRuntime.releaseName || `Java ${state.config?.modding?.requiredJavaVersion || "?"}`} neu installiert.`
    );
    setStatus("Java wurde neu installiert.");
    setProgress({
      active: true,
      label: "Java bereit",
      detail:
        result.javaRuntime.releaseName ||
        `Java ${state.config?.modding?.requiredJavaVersion || "?"} ist wieder verfügbar.`,
      percent: 100,
      indeterminate: false
    });
  } catch (error) {
    setStatus(error.message || "Java-Neuinstallation fehlgeschlagen.", true);
    resetProgress(error.message || "Java-Neuinstallation fehlgeschlagen.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

function isLaunchTarget(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const type = String(value.type || "").trim().toLowerCase();
  const identifier = String(value.identifier || "").trim();
  return Boolean(identifier && ["singleplayer", "multiplayer", "realms", "legacy"].includes(type));
}

function describeLaunchTarget(launchTarget = null) {
  if (!isLaunchTarget(launchTarget)) {
    return null;
  }

  const identifier = String(launchTarget?.identifier || "").trim();
  return identifier || null;
}

async function handleLaunch(launchTarget = null) {
  const launchTargetLabel = describeLaunchTarget(launchTarget);
  state.lastProcessState = null;
  closeLaunchErrorModal();
  setBusy(true);
  setStatus(launchTargetLabel ? "Boocord wird gestartet..." : "Minecraft wird gestartet...");
  setProgress({
    active: true,
    label: launchTargetLabel ? "Boocord Connect läuft" : "Spielstart läuft",
    detail: launchTargetLabel
      ? `Verbinde direkt mit ${launchTargetLabel}...`
      : "Runtime und Startdateien werden geprüft...",
    indeterminate: true
  });

  if (shouldOpenLogsOnLaunch()) {
    switchTab("launcher");
  }

  try {
    const result = await window.boocordApi.launchClient(buildLaunchRequestOptions(launchTarget));
    state.config.settings = result.settings;
    state.config.installState = result.installState;
    state.config.account = result.account;
    state.config.accounts = result.accounts;
    state.config.launchState = result.launchState || {
      phase: "running",
      isPreparing: false,
      isRunning: true,
      isStopping: false,
      canStop: true,
      pid: result.pid
    };
    state.config.isRunning = true;
    state.lastProcessState = null;
    await refreshState();
    appendLog(
      `[launch] PID ${result.pid}, Account ${result.account.name}${launchTargetLabel ? `, Server ${launchTargetLabel}` : ""}`
    );
    setStatus(
      launchTargetLabel
        ? `Minecraft läuft für ${result.account.name} auf ${launchTargetLabel}.`
        : `Minecraft läuft für ${result.account.name}.`
    );
    setProgress({
      active: true,
      label: launchTargetLabel ? "Boocord verbunden" : "Minecraft gestartet",
      detail: launchTargetLabel
        ? `${result.account.name} ist mit ${launchTargetLabel} verbunden.`
        : `PID ${result.pid} für ${result.account.name}`,
      percent: 100,
      indeterminate: false
    });
  } catch (error) {
    if (error?.code === "LAUNCH_ABORTED") {
      appendLog("[stop] Start wurde abgebrochen.");
      return;
    }

    const message = normalizeLaunchErrorMessage(error);
    markProcessStopped("failed", message);
    setStatus(message, true);
    setStatusDetail(message);
    openLaunchErrorModal(
      message,
      "Der Startprozess wurde beendet und als gestoppt markiert. Prüfe Version, Loader und Mod-Auswahl."
    );
    appendLog(`[error] ${message}`);
  } finally {
    setBusy(false);
  }
}

async function handleBoocordLaunch() {
  await handleLaunch(boocordLaunchTarget);
}

async function handleStop() {
  if (!state.config?.launchState?.canStop || state.isStopping) {
    return;
  }

  state.isStopping = true;
  renderState();
  setBusy(true);
  setStatus("Minecraft wird beendet...");
  setProgress({
    active: true,
    label: "Minecraft wird beendet",
    detail: "Warte auf das Schließen der laufenden Instanz...",
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.stopClient();
    state.config.launchState = result.launchState || state.config.launchState;
    state.config.isRunning = Boolean(result.launchState?.isRunning);
    appendLog(`[stop] ${result.message}`);

    if (result.alreadyStopped) {
      state.isStopping = false;
      state.lastProcessState = "stopped";
      state.config.launchState = result.launchState || {
        phase: "idle",
        isPreparing: false,
        isRunning: false,
        isStopping: false,
        canStop: false,
        pid: null
      };
      state.config.isRunning = false;
      renderState();
      setStatus(result.message);
      resetProgress(result.message);
      return;
    }

    renderState();
    setStatus(state.config.launchState?.isStopping ? "Stop angefordert." : "Stop-Signal gesendet.");
    setStatusDetail(result.message);
  } catch (error) {
    state.isStopping = false;
    renderState();
    setStatus(error.message || "Stoppen fehlgeschlagen.", true);
    resetProgress(error.message || "Stoppen fehlgeschlagen.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleOpenDirectory() {
  const targetPath = state.config?.settings?.dataDirectory || state.lastOpenDirectory;

  if (!targetPath) {
    return;
  }

  const result = await window.boocordApi.openPath(targetPath);

  if (!result.ok) {
    setStatus(result.message || "Ordner konnte nicht geöffnet werden.", true);
    setStatusDetail(result.message || "Ordner konnte nicht geöffnet werden.");
  }
}

async function handleBrowseDirectory() {
  const selectedDirectory = await window.boocordApi.selectFolder();

  if (!selectedDirectory) {
    return;
  }

  setBusy(true);

  try {
    await persistSettings({ dataDirectory: selectedDirectory });
    setStatus("Datenordner aktualisiert.");
    setStatusDetail("Der Datenordner wurde gespeichert.");
  } catch (error) {
    setStatus(error.message || "Datenordner konnte nicht gespeichert werden.", true);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleOpenProfileFolder(targetPath) {
  if (!targetPath) {
    return;
  }

  const result = await window.boocordApi.openPath(targetPath);

  if (!result.ok) {
    setStatus(result.message || "Profilordner konnte nicht geöffnet werden.", true);
    setStatusDetail(result.message || "Profilordner konnte nicht geöffnet werden.");
  }
}

async function handleChooseProfileIcon(profile) {
  if (!profile) {
    return;
  }

  const sourcePath = await window.boocordApi.selectProfileIcon();

  if (!sourcePath) {
    return;
  }

  setBusy(true);
  setStatus(`Profil-Icon für ${profile.name} wird übernommen...`);
  setProgress({
    active: true,
    label: "Profil-Icon",
    detail: sourcePath,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.setProfileIcon({
      slug: profile.slug,
      sourcePath
    });
    await refreshState();
    appendLog(`[profile] Icon gesetzt: ${result.name} (${result.slug}) -> ${result.iconPath || "-"}`);
    setStatus(`Profil-Icon für ${result.name} wurde aktualisiert.`);
    resetProgress("Die Bilddatei wurde als Kopie im Profilordner gespeichert.");
  } catch (error) {
    setStatus(error.message || "Profil-Icon konnte nicht gesetzt werden.", true);
    resetProgress(error.message || "Profil-Icon konnte nicht gesetzt werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleCreateProfile() {
  const profileName = elements.profileCreateInput.value.trim();

  if (!profileName) {
    setStatus("Bitte gib einen Namen für das neue Profil ein.", true);
    setStatusDetail("Ohne Namen kann kein getrenntes Profil angelegt werden.");
    return;
  }

  setBusy(true);
  setStatus("Profil wird angelegt...");
  setProgress({
    active: true,
    label: "Profil wird erstellt",
    detail: profileName,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.createProfile({
      name: profileName
    });
    elements.profileCreateInput.value = "";
    await refreshState();
    appendLog(`[profile] Erstellt: ${result.name} (${result.slug})`);
    setStatus(`Profil ${result.name} wurde angelegt.`);
    resetProgress(`Profil ${result.name} ist jetzt in der Startseite auswählbar.`);
  } catch (error) {
    setStatus(error.message || "Profil konnte nicht angelegt werden.", true);
    resetProgress(error.message || "Profil konnte nicht angelegt werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function startProfileImport(sourcePath) {
  if (!sourcePath) {
    return;
  }

  closeProfileImportModal();
  setBusy(true);
  setStatus("Instanz wird importiert...");
  setProgress({
    active: true,
    label: "Profilimport",
    detail: sourcePath,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.importProfile({
      sourcePath
    });
    await refreshState();
    appendLog(`[profile] Importiert: ${result.name} (${result.slug}) aus ${result.sourceLabel}`);
    setStatus(`Profil ${result.name} wurde importiert.`);
    resetProgress(`${result.sourceLabel}-Instanz wurde als neues Profil übernommen.`);
  } catch (error) {
    setStatus(error.message || "Instanz konnte nicht importiert werden.", true);
    resetProgress(error.message || "Instanz konnte nicht importiert werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleImportProfile() {
  openProfileImportModal();
  await loadProfileImportSources({
    force: true
  });
}

async function handleManualProfileImportBrowse() {
  const sourcePath = await window.boocordApi.selectProfileImportSource();

  if (!sourcePath) {
    return;
  }

  await startProfileImport(sourcePath);
}

async function handleSwitchProfile(profile) {
  if (!profile || profile.isActive) {
    return;
  }

  setBusy(true);
  setStatus(`Wechsle zu ${profile.name}...`);
  setProgress({
    active: true,
    label: "Profilwechsel",
    detail: `Profil ${profile.name} wird geladen...`,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.switchProfile({
      slug: profile.slug
    });
    resetProfileInteractionState({
      closeDeleteModal: true,
      closeImportModal: true,
      closeModDetails: true,
      resetRename: true
    });
    state.searchResults = [];
    state.searchHasRun = false;
    state.searchLoading = false;
    state.searchPagination = {
      limit: 12,
      offset: 0,
      totalHits: 0
    };
    state.modDetailsCache.clear();
    state.activeModPreview = null;
    state.activeModDetail = null;
    state.activeModDetailCacheKey = null;
    closeAccountDropdown();
    applyLauncherConfig(result, {
      preservePendingModding: false
    });
    appendLog(`[profile] Aktiv: ${profile.name} (${profile.slug})`);
    setStatus(`Profil ${profile.name} ist jetzt aktiv.`);
    resetProgress(`Profil ${profile.name} wurde geladen.`);
  } catch (error) {
    setStatus(error.message || "Profilwechsel fehlgeschlagen.", true);
    resetProgress(error.message || "Profilwechsel fehlgeschlagen.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function confirmAndDeleteProfile(profile) {
  if (!profile || profile.isActive || profile.isDefault) {
    return;
  }

  const confirmed = await openProfileDeleteModal(profile);

  if (!confirmed) {
    return;
  }

  setBusy(true);
  setStatus(`Lösche ${profile.name}...`);
  setProgress({
    active: true,
    label: "Profil löschen",
    detail: `Profilordner von ${profile.name} wird entfernt...`,
    indeterminate: true
  });

  try {
    await window.boocordApi.deleteProfile({
      slug: profile.slug
    });
    if (state.profileRename.slug === profile.slug) {
      cancelProfileRename(false);
    }
    await refreshState();
    appendLog(`[profile] Gelöscht: ${profile.name} (${profile.slug})`);
    setStatus(`Profil ${profile.name} wurde gelöscht.`);
    resetProgress(`Profil ${profile.name} wurde aus der Auswahl entfernt.`);
  } catch (error) {
    setStatus(error.message || "Profil konnte nicht gelöscht werden.", true);
    resetProgress(error.message || "Profil konnte nicht gelöscht werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleDeleteProfile(profile) {
  if (!profile || profile.isActive || profile.isDefault) {
    return;
  }

  const confirmed = window.confirm(
    translateText(`Profil "${profile.name}" wirklich löschen?\n\nDer komplette Profilordner wird entfernt.`)
  );

  if (!confirmed) {
    return;
  }

  setBusy(true);
  setStatus(`Lösche ${profile.name}...`);
  setProgress({
    active: true,
    label: "Profil löschen",
    detail: `Profilordner von ${profile.name} wird entfernt...`,
    indeterminate: true
  });

  try {
    await window.boocordApi.deleteProfile({
      slug: profile.slug
    });
    await refreshState();
    appendLog(`[profile] Gelöscht: ${profile.name} (${profile.slug})`);
    setStatus(`Profil ${profile.name} wurde gelöscht.`);
    resetProgress(`Profil ${profile.name} wurde aus der Auswahl entfernt.`);
  } catch (error) {
    setStatus(error.message || "Profil konnte nicht gelöscht werden.", true);
    resetProgress(error.message || "Profil konnte nicht gelöscht werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleModSearch(useBusy = true, page = 1, { silent = false } = {}) {
  if (state.searchLoading) {
    return;
  }

  const query = elements.modSearchInput.value.trim();
  state.browseFilters.category = elements.modCategorySelect.value || "all";
  state.browseFilters.sortIndex = elements.modSortSelect.value || "downloads";
  const safePage = Math.max(1, Number(page) || 1);
  const limit = state.searchPagination.limit || 12;
  const offset = (safePage - 1) * limit;
  const isInitialSearch = !state.searchHasRun;
  const selectedVersionLabel = "";

  state.searchLoading = true;

  if (isInitialSearch) {
    renderSearchResults();
    if (selectedVersionLabel) {
      setStatusDetail(`Ausgewählte Version: ${selectedVersionLabel}`);
    }
    renderModdingModeState();
  }

  if (useBusy) {
    setBusy(true);
  }

  if (!silent) {
    setStatus("Modrinth-Mods werden geladen...");
    setProgress({
      active: true,
      label: "Mod-Suche",
      detail: "Kompatible Mods werden geladen...",
      indeterminate: true
    });
  }

  try {
    const response = await window.boocordApi.searchMods({
      query,
      minecraftVersion: elements.minecraftVersionSelect.value,
      category: state.browseFilters.category,
      sortIndex: state.browseFilters.sortIndex,
      limit,
      offset
    });
    state.searchResults = response.hits || [];
    state.searchPagination = {
      limit: response.limit || limit,
      offset: response.offset || offset,
      totalHits: response.totalHits || 0
    };
    state.searchHasRun = true;
    state.searchLoading = false;
    renderSearchResults();
    renderModdingModeState();
    if (!silent) {
      setStatus(`${state.searchResults.length} Mod-Ergebnisse geladen.`);
      resetProgress("Die Suchergebnisse wurden aktualisiert.");
    }
  } catch (error) {
    state.searchLoading = false;
    renderSearchResults();
    renderModdingModeState();
    if (!silent) {
      setStatus(error.message || "Mod-Suche fehlgeschlagen.", true);
      resetProgress(error.message || "Mod-Suche fehlgeschlagen.");
    }
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    state.searchLoading = false;
    if (useBusy) {
      setBusy(false);
    }
  }
}

async function handleAddMod(projectId) {
  setBusy(true);
  setStatus("Mod wird hinzugefügt...");
  setProgress({
    active: true,
    label: "Mod wird hinzugefügt",
    detail: projectId,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.addMod(projectId);
    state.config.settings = result.settings;
    await refreshState();
    appendLog(`[mod] Hinzugefügt: ${projectId}`);
    setStatus("Mod wurde hinzugefügt.");
    resetProgress("Der Mod wurde zur Auswahl hinzugefügt.");
  } catch (error) {
    setStatus(error.message || "Mod konnte nicht hinzugefügt werden.", true);
    resetProgress(error.message || "Mod konnte nicht hinzugefügt werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleRemoveMod(projectId) {
  setBusy(true);
  setStatus("Mod wird entfernt...");
  setProgress({
    active: true,
    label: "Mod wird entfernt",
    detail: projectId,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.removeMod(projectId);
    state.config.settings = result.settings;
    if (state.config?.modding) {
      state.config.modding = {
        ...state.config.modding,
        [contentConfig.selectionKey]: mergeDisplayedSelectedProjects(projectType, result.selectedProjects)
      };
      syncActiveProfileSelectionCounts(state.config.modding);
      renderState();
    } else {
      await refreshState();
    }
    appendLog(`[mod] Entfernt: ${projectId}`);
    setStatus("Mod wurde entfernt.");
    resetProgress("Der Mod wurde aus der Auswahl entfernt.");
  } catch (error) {
    setStatus(error.message || "Mod konnte nicht entfernt werden.", true);
    resetProgress(error.message || "Mod konnte nicht entfernt werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

function currentOptions() {
  return {
    dataDirectory: state.config?.settings?.dataDirectory,
    memory: {
      min: elements.memoryMinInput.value.trim(),
      max: elements.memoryMaxInput.value.trim()
    },
    runtime: {
      gcProfile: elements.javaGcProfileSelect?.value || "auto"
    },
    modding: {
      minecraftVersion: elements.minecraftVersionSelect.value,
      fabricLoaderVersion: elements.fabricLoaderSelect.value || null
    }
  };
}

function buildLaunchRequestOptions(launchTarget = null) {
  const options = currentOptions();

  if (!isLaunchTarget(launchTarget)) {
    return options;
  }

  return {
    ...options,
    launchTarget
  };
}

function getSelectedProjectDomKey(project) {
  const projectType = String(project?.projectType || state.activeModdingContentType || "mod");

  if (project?.isLocalOnly) {
    return `${projectType}:local:${project.localFileName || project.linkedProjectId || project.title || "unknown"}`;
  }

  return `${projectType}:managed:${project?.projectId || project?.title || "unknown"}`;
}

function renderProjectSelectionViews() {
  renderSelectedMods();
  renderSearchResults();
  renderModdingModeState();
  renderLiveOverview();
  renderModDetailModal();
}

function setSelectedProjectsForType(projectType, selectedProjects) {
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const nextSelection = Array.isArray(selectedProjects) ? [...selectedProjects] : [];

  if (state.config?.modding) {
    state.config.modding = {
      ...state.config.modding,
      [contentConfig.selectionKey]: nextSelection
    };
  }

  if (state.config?.settings) {
    state.config.settings = {
      ...state.config.settings,
      modding: {
        ...(state.config.settings.modding || {}),
        [contentConfig.selectionKey]: nextSelection
      }
    };
  }
}

function getSelectedProjectCards() {
  return [...elements.selectedMods.querySelectorAll(".selected-mod-entry[data-project-key]")];
}

function captureSelectedProjectCardRects() {
  return new Map(
    getSelectedProjectCards().map((card) => [
      card.dataset.projectKey,
      card.getBoundingClientRect()
    ])
  );
}

function animateSelectedProjectLayout(previousRects) {
  getSelectedProjectCards().forEach((card) => {
    const previousRect = previousRects.get(card.dataset.projectKey);

    if (!previousRect) {
      return;
    }

    const nextRect = card.getBoundingClientRect();
    const deltaX = previousRect.left - nextRect.left;
    const deltaY = previousRect.top - nextRect.top;

    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
      return;
    }

    card.classList.add("is-layout-animating");
    card.style.transition = "none";
    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    card.getBoundingClientRect();

    window.requestAnimationFrame(() => {
      const cleanup = () => {
        card.classList.remove("is-layout-animating");
        card.style.transition = "";
        card.style.transform = "";
      };
      const handleTransitionEnd = (event) => {
        if (event.propertyName !== "transform") {
          return;
        }

        cleanup();
      };

      card.addEventListener("transitionend", handleTransitionEnd, { once: true });
      card.style.transition = `transform ${selectedProjectRemovalAnimationMs}ms ${selectedProjectLayoutEasing}`;
      card.style.transform = "";
      window.setTimeout(cleanup, selectedProjectRemovalAnimationMs + 80);
    });
  });
}

function animateSelectedProjectRemovalGhost(snapshot) {
  if (!snapshot) {
    return;
  }

  const ghost = snapshot.node;
  ghost.classList.add("selected-project-removal-ghost");
  ghost.style.left = `${snapshot.rect.left}px`;
  ghost.style.top = `${snapshot.rect.top}px`;
  ghost.style.width = `${snapshot.rect.width}px`;
  ghost.style.height = `${snapshot.rect.height}px`;
  document.body.appendChild(ghost);

  window.requestAnimationFrame(() => {
    ghost.style.opacity = "0";
    ghost.style.transform = "translateY(-16px) scale(0.96)";
  });

  window.setTimeout(() => {
    ghost.remove();
  }, selectedProjectRemovalAnimationMs + 80);
}

function animateSelectedProjectRemoval(removedProjectKey, applyStateChange, projectType) {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const selectedProjectsRect = elements.selectedMods?.getBoundingClientRect?.() || null;
  const isSelectionViewVisible = Boolean(
    selectedProjectsRect
    && selectedProjectsRect.width > 0
    && selectedProjectsRect.height > 0
  );
  const canAnimate = !prefersReducedMotion
    && state.activeTab === "modding"
    && state.activeModdingMode === "package"
    && state.activeModdingContentType === projectType
    && Boolean(elements.selectedMods)
    && isSelectionViewVisible;

  if (!canAnimate) {
    applyStateChange();
    renderProjectSelectionViews();
    return Promise.resolve();
  }

  const previousRects = captureSelectedProjectCardRects();
  const removedCard = getSelectedProjectCards().find((card) => card.dataset.projectKey === removedProjectKey);
  const removedSnapshot = removedCard
    ? (() => {
        const rect = removedCard.getBoundingClientRect();

        if (rect.width <= 0 || rect.height <= 0) {
          return null;
        }

        return {
          node: removedCard.cloneNode(true),
          rect
        };
      })()
    : null;
  const containerHeight = selectedProjectsRect.height;

  if (containerHeight > 0) {
    elements.selectedMods.style.minHeight = `${containerHeight}px`;
  }

  applyStateChange();
  renderProjectSelectionViews();
  animateSelectedProjectLayout(previousRects);
  animateSelectedProjectRemovalGhost(removedSnapshot);

  return new Promise((resolve) => {
    window.setTimeout(() => {
      elements.selectedMods.style.minHeight = "";
      resolve();
    }, selectedProjectRemovalAnimationMs + 80);
  });
}

function applyOptimisticSelectedProjectRemoval(projectType, matcher) {
  const selectedProjects = getSelectedProjects(projectType);
  const removedProject = selectedProjects.find(matcher);

  if (!removedProject) {
    return {
      changed: false,
      animationPromise: Promise.resolve(),
      restore: () => {}
    };
  }

  const previousSelection = [...selectedProjects];
  const nextSelection = previousSelection.filter((project) => !matcher(project));
  const removedProjectKey = getSelectedProjectDomKey(removedProject);

  return {
    changed: true,
    animationPromise: animateSelectedProjectRemoval(
      removedProjectKey,
      () => setSelectedProjectsForType(projectType, nextSelection),
      projectType
    ),
    restore: () => {
      setSelectedProjectsForType(projectType, previousSelection);
      renderProjectSelectionViews();
    }
  };
}

function renderSelectedMods() {
  const contentConfig = getActiveModdingContentConfig();
  const selectedProjects = getSelectedProjects();
  const selectedContentSearchQuery = getSelectedContentSearchQuery(contentConfig.projectType);
  const filteredSelectedProjects = filterSelectedProjects(selectedProjects, selectedContentSearchQuery);
  if (elements.selectedModTotal) {
    elements.selectedModTotal.textContent = String(selectedProjects.length);
  }
  setSelectValue(elements.selectedModState, contentConfig.projectType);
  elements.selectedMods.innerHTML = "";

  if (elements.selectedContentSearchInput) {
    elements.selectedContentSearchInput.disabled = !selectedProjects.length;
  }

  if (!selectedProjects.length) {
    elements.selectedMods.innerHTML = `<div class="empty-state">${escapeHtml(contentConfig.emptySelection)}</div>`;
    return;
  }

  if (!filteredSelectedProjects.length) {
    elements.selectedMods.innerHTML = `<div class="empty-state">Keine ausgewählten ${escapeHtml(
      contentConfig.label
    )} für "${escapeHtml(selectedContentSearchQuery.trim())}" gefunden.</div>`;
    return;
  }

  filteredSelectedProjects.forEach((project) => {
    const isLocalOnly = Boolean(project.isLocalOnly);
    const localFileName = getProjectLocalFileName(project);
    const hasLocalImport = Boolean(localFileName);
    const linkedProjectReference = project.linkedProjectId || (!isLocalOnly && project.projectId) || null;
    const canOpenLinkedDetails = Boolean(linkedProjectReference);
    const descriptionText = project.description || (hasLocalImport ? "Lokal importiert." : "Keine Beschreibung verfügbar.");
    const pendingOperation = getPendingProjectOperation(project, project.projectType || state.activeModdingContentType);
    const removeButtonLabel =
      pendingOperation?.action === "remove" || pendingOperation?.action === "remove-local"
        ? "Lade..."
        : "Entfernen";
    const card = document.createElement("div");
    card.className = hasLocalImport && !canOpenLinkedDetails
      ? "mod-entry selected-mod-entry"
      : "mod-entry selected-mod-entry mod-entry-clickable";
    card.dataset.selected = "true";
    card.dataset.projectKey = getSelectedProjectDomKey(project);
    card.innerHTML = `
      <div class="mod-entry-body">
        <div class="mod-entry-main">
          <img class="mod-entry-icon" src="${escapeHtml(project.iconUrl || "./logo.png")}" alt="${escapeHtml(
            project.title || project.projectId
          )}" data-fallback="./logo.png">
          <div>
            <strong>${escapeHtml(project.title || project.projectId)}</strong>
            <p>${escapeHtml(descriptionText)}</p>
          </div>
        </div>
      </div>
      <div class="mod-entry-footer">
        <div class="mod-entry-footer-actions">
          ${
            hasLocalImport
              ? `${canOpenLinkedDetails
                  ? `<button class="btn btn-product btn-product-secondary mod-entry-open-linked" data-open-linked-project="${escapeHtml(
                      linkedProjectReference
                    )}" type="button">
                      <span>Details</span>
                    </button>`
                  : ""}
                <button class="btn btn-product btn-product-secondary mod-action-button" data-remove-local-project="${escapeHtml(
                  localFileName
                )}" type="button">
                  <span>${escapeHtml(removeButtonLabel)}</span>
                </button>`
              : `<button class="btn btn-product btn-product-secondary mod-entry-open" data-open-project="${escapeHtml(
                  project.projectId
                )}" type="button">
                  <span>Details</span>
                </button>
                <button class="btn btn-product btn-product-secondary mod-action-button" data-remove-project="${escapeHtml(
                  project.projectId
                )}" type="button">
                  <span>${escapeHtml(removeButtonLabel)}</span>
                </button>`
          }
        </div>
      </div>
    `;

    attachImageFallback(card.querySelector(".mod-entry-icon"));
    if (hasLocalImport) {
      if (canOpenLinkedDetails) {
        const openLinkedDetails = () => {
          handleOpenModDetails(linkedProjectReference, {
            ...project,
            projectId: linkedProjectReference,
            slug: project.linkedProjectSlug || project.slug || null,
            projectUrl: project.linkedProjectUrl || project.projectUrl || null
          });
        };

        card.addEventListener("click", openLinkedDetails);
        card.querySelector("[data-open-linked-project]").addEventListener("click", (event) => {
          event.stopPropagation();
          openLinkedDetails();
        });
      }
      card.querySelector("[data-remove-local-project]").addEventListener("click", (event) => {
        event.stopPropagation();
        handleRemoveLocalProject(project);
      });
    } else {
      card.addEventListener("click", () => {
        handleOpenModDetails(project.projectId, project);
      });
      card.querySelector("[data-open-project]").addEventListener("click", (event) => {
        event.stopPropagation();
        handleOpenModDetails(project.projectId, project);
      });
      card.querySelector("[data-remove-project]").addEventListener("click", (event) => {
        event.stopPropagation();
        handleRemoveProject(project, project.projectType || state.activeModdingContentType);
      });
    }
    elements.selectedMods.appendChild(card);
  });
}

function renderSearchResults() {
  const contentConfig = getActiveModdingContentConfig();
  elements.modSearchResults.innerHTML = "";
  renderPagination();

  if (state.searchLoading && !state.searchHasRun) {
    elements.modSearchCount.textContent = "Lade Vorschläge...";
    elements.modSearchResults.innerHTML = `<div class="empty-state">${escapeHtml(contentConfig.label)} werden geladen...</div>`;
    return;
  }

  if (!state.searchHasRun) {
    elements.modSearchCount.textContent = "Noch keine Suche";
    elements.modSearchResults.innerHTML = '<div class="empty-state">Noch keine Suche gestartet.</div>';
    return;
  }

  if (!state.searchResults.length) {
    elements.modSearchCount.textContent = state.searchPagination.totalHits
      ? `${formatNumber(state.searchPagination.totalHits)} Treffer`
      : "Keine Treffer";
    elements.modSearchResults.innerHTML = `<div class="empty-state">${escapeHtml(contentConfig.emptySearch)}</div>`;
    return;
  }

  const rangeStart = state.searchPagination.offset + 1;
  const rangeEnd = state.searchPagination.offset + state.searchResults.length;
  elements.modSearchCount.textContent = `${rangeStart}-${rangeEnd} von ${formatNumber(state.searchPagination.totalHits)}`;

  state.searchResults.forEach((project) => {
    const installationState = getProjectInstallationState(project, project.projectType || state.activeModdingContentType);
    const isInstalled = installationState.isInstalled;
    const isImportedInstalled = installationState.isImportedInstalled;
    const pendingOperation = getPendingProjectOperation(
      installationState.importedProject || project,
      project.projectType || state.activeModdingContentType
    );
    const actionLabel = isImportedInstalled
      ? pendingOperation?.action === "remove-local"
        ? "Lade..."
        : "Entfernen"
      : pendingOperation?.action === "add"
        ? "Lade..."
        : pendingOperation?.action === "remove"
          ? "Lade..."
          : isInstalled
            ? "Ausgewählt"
            : "Hinzufügen";
    const card = document.createElement("div");
    card.className = "mod-entry mod-entry-clickable";
    card.dataset.selected = String(isInstalled);
    card.innerHTML = `
      <div class="mod-entry-body">
        <div class="mod-entry-main">
          <img class="mod-entry-icon" src="${escapeHtml(project.iconUrl || "./logo.png")}" alt="${escapeHtml(
            project.title || project.slug
          )}" data-fallback="./logo.png">
          <div>
            <strong>${escapeHtml(project.title || project.slug || project.projectId)}</strong>
            <p>${escapeHtml(project.description || "Keine Beschreibung verfügbar.")}</p>
          </div>
        </div>
      </div>
      <div class="mod-entry-footer">
        <div class="mod-entry-footer-actions">
          <button class="btn btn-product btn-product-secondary mod-entry-open" data-open-project="${escapeHtml(
            project.projectId
          )}" type="button">
            <span>Details</span>
          </button>
          <button class="btn btn-product ${isInstalled ? "btn-product-secondary" : ""} mod-action-button" data-project-action="${escapeHtml(
            project.projectId
          )}" type="button">
            <span>${escapeHtml(actionLabel)}</span>
          </button>
        </div>
      </div>
    `;

    attachImageFallback(card.querySelector(".mod-entry-icon"));
    card.addEventListener("click", () => {
      handleOpenModDetails(project.projectId, project);
    });
    card.querySelector("[data-open-project]").addEventListener("click", (event) => {
      event.stopPropagation();
      handleOpenModDetails(project.projectId, project);
    });
    card.querySelector("[data-project-action]").addEventListener("click", (event) => {
      event.stopPropagation();

      if (isImportedInstalled && installationState.importedProject) {
        handleRemoveLocalProject(installationState.importedProject);
      } else if (isInstalled) {
        handleRemoveProject(project, project.projectType || state.activeModdingContentType, {
          animateSelection: false
        });
      } else {
        handleAddProject(project, project.projectType || state.activeModdingContentType);
      }
    });
    elements.modSearchResults.appendChild(card);
  });

  renderPagination();
}

function renderModDetailModal() {
  const detail = state.activeModDetail || state.activeModPreview;

  if (!detail) {
    elements.modDetailTitle.textContent = "Modrinth Details";
    elements.modDetailContent.innerHTML = '<div class="empty-state">Wähle einen Eintrag aus, um Details zu sehen.</div>';
    return;
  }

  const projectType = detail.projectType || state.activeModdingContentType || "mod";
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const isLocalOnly = Boolean(detail.isLocalOnly);
  const installationState = getProjectInstallationState(detail, projectType);
  const selectedProject = installationState.selectedProject;
  const importedProject = installationState.importedProject;
  const pendingOperation = getPendingProjectOperation(importedProject || detail, projectType);
  const selectedVersionId = String(selectedProject?.versionId || "").trim();
  const selectedVersionLocked = selectedProject?.versionLocked === true;
  const isInstalled = isLocalOnly || installationState.isInstalled;
  const isImportedInstalled = !isLocalOnly && installationState.isImportedInstalled;
  const installedVersionLabel = getSelectedVersionLabel(selectedProject || (isLocalOnly ? detail : null));
  const toggleActionLabel = pendingOperation?.action === "add"
    ? "Lade..."
    : pendingOperation?.action === "remove"
      ? "Lade..."
      : isInstalled
        ? "Entfernen"
        : "Hinzufügen";
  const linkEntries = buildModLinkEntries(detail);
  const statEntries = [
    { label: "Downloads", value: formatNumber(detail.downloads || 0) },
    { label: "Follower", value: formatNumber(detail.followers || 0) },
    ...(projectType === "mod"
      ? [
          { label: "Client", value: formatSupportLabel(detail.clientSide) },
          { label: "Server", value: formatSupportLabel(detail.serverSide) }
        ]
      : []),
    { label: "Veröffentlicht", value: formatDateLabel(detail.published || detail.dateCreated) },
    { label: "Aktualisiert", value: formatDateLabel(detail.updated || detail.dateModified) },
    {
      label: "Lizenz",
      value: normalizeInlineText(
        detail.license?.name || detail.license?.id || (typeof detail.license === "string" ? detail.license : null),
        "-"
      )
    },
    ...(isInstalled && installedVersionLabel ? [{ label: "Installierte Version", value: installedVersionLabel }] : []),
    { label: "Versionen", value: formatNumber((detail.versions || detail.gameVersions || []).length) }
  ];
  const galleryEntries = (detail.gallery || []).slice(0, 6);
  const memberEntries = (detail.members || []).slice(0, 6);
  elements.modDetailTitle.textContent = detail.title || detail.slug || detail.projectId;
  elements.modDetailContent.innerHTML = `
    <section class="mod-detail-section">
      <div class="mod-detail-hero">
        <img class="mod-detail-icon" src="${escapeHtml(detail.iconUrl || "./logo.png")}" alt="${escapeHtml(
          detail.title || detail.projectId
        )}" data-fallback="./logo.png">
        <div class="mod-detail-hero-copy">
          <span class="mod-detail-kicker">${escapeHtml(contentConfig.singularLabel)}</span>
          <h2>${escapeHtml(detail.title || detail.slug || detail.projectId)}</h2>
          <p class="mod-detail-description">${escapeHtml(detail.description || "Keine Kurzbeschreibung verfügbar.")}</p>
          <div class="mod-entry-footer-actions mod-detail-actions">
            ${
              isLocalOnly
                ? `<button class="btn btn-product btn-product-secondary" type="button" data-modal-open-local-path="${escapeHtml(
                    detail.localDirectoryPath || detail.localPath || ""
                  )}">
                    <span>Ordner</span>
                  </button>
                  <button class="btn btn-product btn-product-secondary" type="button" data-modal-remove-local-project="${escapeHtml(
                    detail.localFileName || ""
                  )}">
                    <span>Entfernen</span>
                  </button>`
                : isImportedInstalled
                  ? `<button class="btn btn-product btn-product-secondary" type="button" data-modal-remove-imported-project="${escapeHtml(
                      importedProject?.localFileName || ""
                    )}">
                      <span>${escapeHtml(pendingOperation?.action === "remove-local" ? "Lade..." : "Entfernen")}</span>
                    </button>`
                : `<button class="btn btn-product ${isInstalled ? "btn-product-secondary" : ""}" type="button" data-modal-toggle-project="${escapeHtml(
                    detail.projectId
                  )}">
                    <span>${escapeHtml(toggleActionLabel)}</span>
                  </button>`
            }
            ${
              detail.projectUrl
                ? `<a class="btn btn-product btn-product-secondary mod-entry-open" href="${escapeHtml(
                    detail.projectUrl
                  )}" target="_blank" rel="noreferrer"><span>${escapeHtml(contentConfig.detailOpenLabel)}</span></a>`
                : ""
            }
          </div>
        </div>
      </div>
    </section>
    <section class="mod-detail-section">
      <h3>Übersicht</h3>
      <div class="mod-detail-stats">
        ${statEntries
          .map(
            (entry) => `
              <div class="mod-detail-stat">
                <span>${escapeHtml(entry.label)}</span>
                <strong>${escapeHtml(entry.value)}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
    ${
      linkEntries.length
        ? `
          <section class="mod-detail-section">
            <h3>Links</h3>
            <div class="mod-detail-links">
              ${linkEntries
                .map(
                  (entry) => `
                    <a class="mod-detail-link" href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">
                      <span class="material-icons">${escapeHtml(entry.icon)}</span>
                      <span>${escapeHtml(entry.label)}</span>
                    </a>
                  `
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }
    ${
      memberEntries.length
        ? `
          <section class="mod-detail-section">
            <h3>Team</h3>
            <div class="mod-detail-members">
              ${memberEntries
                .map(
                  (member) => `
                    <div class="mod-detail-member">
                      <img src="${escapeHtml(member.avatarUrl || "./logo.png")}" alt="${escapeHtml(
                        member.username
                      )}" data-fallback="./logo.png">
                      <div>
                        <strong>${escapeHtml(member.username)}</strong>
                        <small>${escapeHtml(member.role || "Mitglied")}</small>
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }
    ${
      galleryEntries.length
        ? `
          <section class="mod-detail-section">
            <h3>Galerie</h3>
            <div class="mod-detail-gallery">
              ${galleryEntries
                .map(
                  (entry) => `
                    <a class="mod-detail-gallery-item" href="${escapeHtml(
                      entry.raw_url || entry.url
                    )}" target="_blank" rel="noreferrer">
                      <img src="${escapeHtml(entry.url || entry.raw_url)}" alt="${escapeHtml(
                        entry.title || detail.title
                      )}">
                      <strong>${escapeHtml(entry.title || "Screenshot")}</strong>
                      <small>${escapeHtml(entry.description || "")}</small>
                    </a>
                  `
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }
    ${
      (detail.versions || []).length
        ? `
          <section class="mod-detail-section">
            <h3>Kompatible Versionen</h3>
            <div class="mod-detail-version-list">
              ${detail.versions
                .map(
                  (version) => {
                    const isSelectedVersion = Boolean(selectedVersionId) && selectedVersionId === String(version.id || "").trim();
                    const canLockSelectedVersion = isSelectedVersion && projectType === "mod" && !selectedVersionLocked;
                    const actionLabel = canLockSelectedVersion
                      ? "Version festhalten"
                      : formatVersionActionLabel(projectType, isInstalled, isSelectedVersion);

                    return `
                      <div class="mod-detail-version ${isSelectedVersion ? "is-selected" : ""}">
                        <div class="mod-detail-version-header">
                          <div>
                            <strong>${escapeHtml(version.name || version.versionNumber || version.id)}</strong>
                            <small>${escapeHtml(
                              `${formatDateLabel(version.datePublished)} | ${formatNumber(version.downloads)} Downloads | ${version.versionType || "release"}`
                            )}</small>
                          </div>
                          <button
                            class="btn btn-product ${isSelectedVersion ? "btn-product-secondary" : ""} mod-detail-version-action"
                            type="button"
                            data-install-version="${escapeHtml(version.id || "")}"
                            ${isImportedInstalled ? "disabled" : ""}
                            ${isSelectedVersion && !canLockSelectedVersion ? "disabled" : ""}
                          >
                            <span>${escapeHtml(isImportedInstalled ? "Importiert" : actionLabel)}</span>
                          </button>
                        </div>
                        ${version.changelog
                          ? `<small>${escapeHtml(normalizeBodyText(version.changelog, "").slice(0, 220))}</small>`
                          : ""}
                      </div>
                    `;
                  }
                )
                .join("")}
            </div>
          </section>
        `
        : ""
    }
    <section class="mod-detail-section">
      <h3>Beschreibung</h3>
      <div class="mod-detail-body">${renderMarkdownHtml(detail.body || detail.description)}</div>
    </section>
    ${state.modDetailLoading ? '<div class="empty-state">Details werden aktualisiert...</div>' : ""}
  `;

  attachImageFallback(elements.modDetailContent.querySelector(".mod-detail-icon"));
  elements.modDetailContent.querySelectorAll(".mod-detail-member img").forEach(attachImageFallback);

  const toggleButton = elements.modDetailContent.querySelector("[data-modal-toggle-project]");
  const openLocalPathButton = elements.modDetailContent.querySelector("[data-modal-open-local-path]");
  const removeLocalProjectButton = elements.modDetailContent.querySelector("[data-modal-remove-local-project]");
  const removeImportedProjectButton = elements.modDetailContent.querySelector("[data-modal-remove-imported-project]");
  const versionButtons = [...elements.modDetailContent.querySelectorAll("[data-install-version]")];

  if (openLocalPathButton) {
    openLocalPathButton.addEventListener("click", (event) => {
      event.stopPropagation();
      handleOpenProfileFolder(detail.localDirectoryPath || detail.localPath);
    });
  }

  if (removeLocalProjectButton) {
    removeLocalProjectButton.addEventListener("click", (event) => {
      event.stopPropagation();
      closeModDetailModal();
      handleRemoveLocalProject(detail);
    });
  }

  if (removeImportedProjectButton && importedProject) {
    removeImportedProjectButton.addEventListener("click", (event) => {
      event.stopPropagation();
      closeModDetailModal();
      handleRemoveLocalProject(importedProject);
    });
  }

  if (toggleButton) {
    toggleButton.addEventListener("click", (event) => {
      event.stopPropagation();

      if (isInstalled) {
        handleRemoveProject(detail, projectType, {
          animateSelection: false
        });
      } else {
        handleAddProject(detail, projectType);
      }
    });
  }

  versionButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const versionId = String(button.dataset.installVersion || "").trim();
      const targetVersion = (detail.versions || []).find(
        (entry) => String(entry.id || "").trim() === versionId
      );

      if (!targetVersion || isImportedInstalled) {
        return;
      }

      handleAddProject(detail, projectType, targetVersion);
    });
  });
}

async function handleOpenModDetails(projectId, preview = null) {
  if (!projectId) {
    return;
  }

  const projectType = preview?.projectType || state.activeModdingContentType || "mod";
  const minecraftVersion = elements.minecraftVersionSelect.value;
  const cacheKey = buildDetailCacheKey(
    `${projectType}:${projectId}`,
    minecraftVersion,
    projectType === "mod" ? "fabric" : "content"
  );
  state.activeModPreview = preview
    ? {
        ...preview,
        projectId,
        projectType
      }
    : {
        projectId,
        projectType,
        title: projectId,
        description: "Details werden geladen..."
      };
  state.activeModDetail = state.modDetailsCache.get(cacheKey) || null;
  state.activeModDetailCacheKey = cacheKey;
  state.modDetailLoading = !state.activeModDetail;
  openModDetailModal();
  renderModDetailModal();

  if (state.modDetailsCache.has(cacheKey)) {
    return;
  }

  try {
    const detail = await window.boocordApi.getProjectDetails({
      projectId,
      projectType,
      minecraftVersion,
      loader: projectType === "mod" ? "fabric" : null
    });

    state.modDetailsCache.set(cacheKey, detail);

    if (state.activeModDetailCacheKey !== cacheKey) {
      return;
    }

    state.activeModDetail = detail;
    state.modDetailLoading = false;
    renderModDetailModal();
  } catch (error) {
    if (state.activeModDetailCacheKey !== cacheKey) {
      return;
    }

    state.modDetailLoading = false;
    setStatus(error.message || "Details konnten nicht geladen werden.", true);
    setStatusDetail(error.message || "Details konnten nicht geladen werden.");
    renderModDetailModal();
  }
}

function renderModdingState() {
  const modding = state.config?.modding;
  const settings = state.config?.settings;

  if (!modding) {
    return;
  }

  const minecraftVersionOptions = (modding.availableMinecraftVersions || []).map((entry) => ({
    value: entry.version,
    label: entry.version
  }));
  const categoryOptions = [
    { value: "all", label: "Alle Kategorien" },
    ...getAvailableCategoriesForActiveType().map((entry) => ({
      value: entry.value,
      label: entry.label
    }))
  ];
  const fabricLoaderOptions = (modding.availableFabricLoaders || []).map((entry) => ({
    value: entry.version,
    label: entry.stable ? `${entry.version} (stabil)` : entry.version
  }));
  const contentConfig = getActiveModdingContentConfig();

  if (elements.languageSelect) {
    setSelectValue(elements.languageSelect, normalizeLanguage(settings?.language || state.language));
  }

  renderSelectOptions(
    elements.minecraftVersionSelect,
    minecraftVersionOptions,
    modding.minecraftVersion,
    (entry) => entry.label
  );
  renderSelectOptions(
    elements.modCategorySelect,
    categoryOptions,
    state.browseFilters.category,
    (entry) => entry.label
  );
  renderSelectOptions(
    elements.fabricLoaderSelect,
    fabricLoaderOptions,
    modding.fabricLoaderVersion,
    (entry) => entry.label
  );

  setSelectValue(elements.modSortSelect, state.browseFilters.sortIndex);
  const javaSummary = describeManagedJavaRuntime(modding);
  elements.requiredJavaVersion.textContent = modding.requiredJavaVersion ? `Java ${modding.requiredJavaVersion}+` : "Unbekannt";
  elements.detectedJavaVersion.textContent = javaSummary.detectedLabel;
  elements.memoryMinInput.value = settings.memory.min;
  elements.memoryMaxInput.value = settings.memory.max;
  renderSelectOptions(
    elements.javaGcProfileSelect,
    javaGcProfileOptions,
    settings?.runtime?.gcProfile || "auto",
    (entry) => entry.label
  );
  elements.openLogsOnLaunchInput.checked = Boolean(settings.openLogsOnLaunch);
  if (elements.minimizeOnLaunchInput) {
    elements.minimizeOnLaunchInput.checked = Boolean(settings.minimizeOnLaunch);
  }
  applyLauncherBackground();
  setSelectValue(elements.modInstallTarget, contentConfig.projectType);

  renderSelectedMods();
  renderSearchResults();
  renderModdingModeState();
}

async function handleModSearch(useBusy = true, page = 1, { silent = false } = {}) {
  if (state.searchLoading) {
    return;
  }

  const contentConfig = getActiveModdingContentConfig();
  const query = elements.modSearchInput.value.trim();
  state.browseFilters.category = elements.modCategorySelect.value || "all";
  state.browseFilters.sortIndex = elements.modSortSelect.value || "downloads";
  const safePage = Math.max(1, Number(page) || 1);
  const limit = state.searchPagination.limit || 12;
  const offset = (safePage - 1) * limit;
  const isInitialSearch = !state.searchHasRun;

  state.searchLoading = true;

  if (isInitialSearch) {
    renderSearchResults();
    renderModdingModeState();
  }

  if (useBusy) {
    setBusy(true);
  }

  if (!silent) {
    setStatus(`${contentConfig.label} werden geladen...`);
    setProgress({
      active: true,
      label: `${contentConfig.singularLabel}-Suche`,
      detail: `${contentConfig.label} werden geladen...`,
      indeterminate: true
    });
  }

  try {
    const response = await window.boocordApi.searchProjects({
      query,
      projectType: state.activeModdingContentType,
      minecraftVersion: elements.minecraftVersionSelect.value,
      category: state.browseFilters.category,
      sortIndex: state.browseFilters.sortIndex,
      limit,
      offset
    });
    state.searchResults = response.hits || [];
    state.searchPagination = {
      limit: response.limit || limit,
      offset: response.offset || offset,
      totalHits: response.totalHits || 0
    };
    state.searchHasRun = true;
    state.searchLoading = false;
    renderSearchResults();
    renderModdingModeState();
    if (!silent) {
      setStatus(`${state.searchResults.length} ${contentConfig.label} geladen.`);
      resetProgress("Die Suchergebnisse wurden aktualisiert.");
    }
  } catch (error) {
    state.searchLoading = false;
    renderSearchResults();
    renderModdingModeState();
    if (!silent) {
      setStatus(error.message || "Suche fehlgeschlagen.", true);
      resetProgress(error.message || "Suche fehlgeschlagen.");
    }
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    state.searchLoading = false;
    if (useBusy) {
      setBusy(false);
    }
  }
}

async function handleAddProject(projectOrId, projectType = state.activeModdingContentType, version = null) {
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const {
    projectId,
    projectReference,
    projectReferences
  } = resolveProjectActionReference(projectOrId, projectType);
  const selectedVersionLabel = getSelectedVersionLabel(version);
  const requestGuard = getOperationGuard();
  const previousSelection = [...getSelectedProjects(projectType)];
  invalidateModdingStateHydration();
  setBusy(true);
  setStatus(`${contentConfig.singularLabel} wird hinzugefügt...`);
  setProgress({
    active: true,
    label: `${contentConfig.singularLabel} wird hinzugefügt`,
    detail: projectId,
    indeterminate: true
  });

  try {
    invalidateModdingStateHydration();
    const result = await window.boocordApi.addProject({
      projectId,
      projectType,
      profileSlug: requestGuard.profileSlug,
      projectSnapshot: projectReference,
      versionId: version?.id || null,
      versionNumber: version?.versionNumber || null,
      versionName: version?.name || null,
      versionType: version?.versionType || null
    });
    if (!isOperationGuardCurrent(requestGuard)) {
      await refreshState({ fast: false });
      return;
    }
    state.config.settings = result.settings;
    if (state.config?.modding) {
      state.config.modding = {
        ...state.config.modding,
        [contentConfig.selectionKey]: mergeDisplayedSelectedProjects(projectType, result.selectedProjects)
      };
      syncActiveProfileSelectionCounts(state.config.modding);
      renderState();
    } else {
      await refreshState({ fast: false });
    }
    await refreshState({ fast: false });
    if (selectedVersionLabel) {
      setStatusDetail(`Ausgewählte Version: ${selectedVersionLabel}`);
    }
    appendLog(`[content] Hinzugefügt: ${projectType}:${projectId}`);
    setStatus(`${contentConfig.singularLabel} wurde hinzugefügt.`);
    resetProgress(`${contentConfig.singularLabel} wurde zur Auswahl hinzugefügt.`);
  } catch (error) {
    setStatus(error.message || `${contentConfig.singularLabel} konnte nicht hinzugefügt werden.`, true);
    resetProgress(error.message || `${contentConfig.singularLabel} konnte nicht hinzugefügt werden.`);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleRemoveProject(
  projectId,
  projectType = state.activeModdingContentType,
  { animateSelection = true } = {}
) {
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const normalizedProjectId = String(projectId || "").trim();
  const requestGuard = getOperationGuard();
  const optimisticRemoval = animateSelection
    ? applyOptimisticSelectedProjectRemoval(
        projectType,
        (project) => !project.isLocalOnly && project.projectId === normalizedProjectId
      )
    : {
        changed: false,
        animationPromise: Promise.resolve(),
        restore: () => {}
      };
  setBusy(true);
  setStatus(`${contentConfig.singularLabel} wird entfernt...`);
  setProgress({
    active: true,
    label: `${contentConfig.singularLabel} wird entfernt`,
    detail: projectId,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.removeProject({
      projectId,
      projectType,
      profileSlug: requestGuard.profileSlug,
      projectSnapshot: resolveProjectActionReference(projectOrId, projectType).projectReference
    });
    if (!isOperationGuardCurrent(requestGuard)) {
      optimisticRemoval.restore();
      await refreshState({ fast: false });
      return;
    }
    state.config.settings = result.settings;
    await optimisticRemoval.animationPromise;
    await refreshState({ fast: false });
    appendLog(`[content] Entfernt: ${projectType}:${projectId}`);
    setStatus(`${contentConfig.singularLabel} wurde entfernt.`);
    resetProgress(`${contentConfig.singularLabel} wurde aus der Auswahl entfernt.`);
  } catch (error) {
    optimisticRemoval.restore();
    setStatus(error.message || `${contentConfig.singularLabel} konnte nicht entfernt werden.`, true);
    resetProgress(error.message || `${contentConfig.singularLabel} konnte nicht entfernt werden.`);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleAddProject(projectOrId, projectType = state.activeModdingContentType, version = null) {
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const {
    projectId,
    projectReference,
    projectReferences
  } = resolveProjectActionReference(projectOrId, projectType);
  const selectedVersionLabel = getSelectedVersionLabel(version);
  const requestGuard = getOperationGuard();
  const previousSelection = [...getSelectedProjects(projectType)];

  if (!projectId) {
    setStatus(`${contentConfig.singularLabel} konnte nicht hinzugefügt werden.`, true);
    setStatusDetail("Für dieses Projekt fehlt eine gültige Projekt-ID.");
    return;
  }

  setBusy(true);
  setSelectedProjectsForType(
    projectType,
    [
      ...previousSelection.filter((entry) => entry.isLocalOnly || !projectMatchesReference(entry, projectReferences)),
      buildOptimisticSelectedProject(projectReference, projectType, version)
    ]
  );
  if (state.config?.modding) {
    syncActiveProfileSelectionCounts(state.config.modding);
  }
  renderState();
  setStatus(`${contentConfig.singularLabel} wird hinzugefügt...`);
  setProgress({
    active: true,
    label: `${contentConfig.singularLabel} wird hinzugefügt`,
    detail: projectId,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.addProject({
      projectId,
      projectType,
      profileSlug: requestGuard.profileSlug,
      projectSnapshot: projectReference,
      versionId: version?.id || null,
      versionNumber: version?.versionNumber || null,
      versionName: version?.name || null,
      versionType: version?.versionType || null
    });

    if (!isOperationGuardCurrent(requestGuard)) {
      setSelectedProjectsForType(projectType, previousSelection);
      if (state.config?.modding) {
        syncActiveProfileSelectionCounts(state.config.modding);
      }
      renderState();
      return;
    }

    state.config.settings = result.settings;
    if (state.config?.modding) {
      state.config.modding = {
        ...state.config.modding,
        [contentConfig.selectionKey]: mergeDisplayedSelectedProjects(projectType, result.selectedProjects)
      };
      syncActiveProfileSelectionCounts(state.config.modding);
      renderState();
    } else {
      await refreshState({ fast: false });
    }

    if (selectedVersionLabel) {
      setStatusDetail(`Ausgewählte Version: ${selectedVersionLabel}`);
    }
    appendLog(`[content] Hinzugefügt: ${projectType}:${projectId}`);
    setStatus(`${contentConfig.singularLabel} wurde hinzugefügt.`);
    resetProgress(`${contentConfig.singularLabel} wurde zur Auswahl hinzugefügt.`);
  } catch (error) {
    setSelectedProjectsForType(projectType, previousSelection);
    if (state.config?.modding) {
      syncActiveProfileSelectionCounts(state.config.modding);
    }
    renderState();
    setStatus(error.message || `${contentConfig.singularLabel} konnte nicht hinzugefügt werden.`, true);
    resetProgress(error.message || `${contentConfig.singularLabel} konnte nicht hinzugefügt werden.`);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleRemoveProject(
  projectOrId,
  projectType = state.activeModdingContentType,
  { animateSelection = true } = {}
) {
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const {
    projectId,
    projectReferences
  } = resolveProjectActionReference(projectOrId, projectType);
  const requestGuard = getOperationGuard();
  const previousSelection = [...getSelectedProjects(projectType)];
  const nextSelection = previousSelection.filter(
    (project) => project.isLocalOnly || !projectMatchesReference(project, projectReferences)
  );
  const optimisticRemoval = animateSelection
    ? applyOptimisticSelectedProjectRemoval(
        projectType,
        (project) => !project.isLocalOnly && projectMatchesReference(project, projectReferences)
      )
    : previousSelection.length !== nextSelection.length
      ? {
          changed: true,
          animationPromise: Promise.resolve(),
          restore: () => {
            setSelectedProjectsForType(projectType, previousSelection);
            if (state.config?.modding) {
              syncActiveProfileSelectionCounts(state.config.modding);
            }
            renderState();
          }
        }
      : {
          changed: false,
          animationPromise: Promise.resolve(),
          restore: () => {}
        };

  if (!projectId) {
    setStatus(`${contentConfig.singularLabel} konnte nicht entfernt werden.`, true);
    setStatusDetail("Für dieses Projekt fehlt eine gültige Projekt-ID.");
    return;
  }

  if (!animateSelection && optimisticRemoval.changed) {
    setSelectedProjectsForType(projectType, nextSelection);
    if (state.config?.modding) {
      syncActiveProfileSelectionCounts(state.config.modding);
    }
    renderState();
  }

  setBusy(true);
  setStatus(`${contentConfig.singularLabel} wird entfernt...`);
  setProgress({
    active: true,
    label: `${contentConfig.singularLabel} wird entfernt`,
    detail: projectId,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.removeProject({
      projectId,
      projectType,
      profileSlug: requestGuard.profileSlug,
      projectSnapshot: resolveProjectActionReference(projectOrId, projectType).projectReference
    });

    if (!isOperationGuardCurrent(requestGuard)) {
      optimisticRemoval.restore();
      return;
    }

    state.config.settings = result.settings;
    if (state.config?.modding) {
      state.config.modding = {
        ...state.config.modding,
        [contentConfig.selectionKey]: nextSelection
      };
      syncActiveProfileSelectionCounts(state.config.modding);
      renderState();
    }
    await optimisticRemoval.animationPromise;
    appendLog(`[content] Entfernt: ${projectType}:${projectId}`);
    setStatus(`${contentConfig.singularLabel} wurde entfernt.`);
    resetProgress(`${contentConfig.singularLabel} wurde aus der Auswahl entfernt.`);
  } catch (error) {
    optimisticRemoval.restore();
    setStatus(error.message || `${contentConfig.singularLabel} konnte nicht entfernt werden.`, true);
    resetProgress(error.message || `${contentConfig.singularLabel} konnte nicht entfernt werden.`);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleRemoveLocalProject(project) {
  const projectType = project?.projectType || state.activeModdingContentType;
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const localFileName = getProjectLocalFileName(project);
  const requestGuard = getOperationGuard();
  const optimisticRemoval = applyOptimisticSelectedProjectRemoval(
    projectType,
    (entry) => getProjectLocalFileName(entry).toLowerCase() === localFileName.toLowerCase()
  );

  if (!localFileName) {
    setStatus("Lokaler Inhalt konnte nicht entfernt werden.", true);
    setStatusDetail("Der Dateiname für den lokalen Eintrag fehlt.");
    return;
  }

  setBusy(true);
  setStatus(`${contentConfig.singularLabel} wird lokal entfernt...`);
  setProgress({
    active: true,
    label: `${contentConfig.singularLabel} wird entfernt`,
    detail: localFileName,
    indeterminate: true
  });

  try {
    await window.boocordApi.removeLocalProject({
      localFileName,
      projectType,
      profileSlug: requestGuard.profileSlug
    });
    if (!isOperationGuardCurrent(requestGuard)) {
      optimisticRemoval.restore();
      await refreshState({ fast: false });
      return;
    }
    await optimisticRemoval.animationPromise;
    await refreshState({ fast: false });
    appendLog(`[content] Lokal entfernt: ${projectType}:${localFileName}`);
    setStatus(`${contentConfig.singularLabel} wurde lokal entfernt.`);
    resetProgress(`${contentConfig.singularLabel} wurde aus dem Profil gelöscht.`);
  } catch (error) {
    optimisticRemoval.restore();
    setStatus(error.message || `${contentConfig.singularLabel} konnte nicht lokal entfernt werden.`, true);
    resetProgress(error.message || `${contentConfig.singularLabel} konnte nicht lokal entfernt werden.`);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleImportLocalProjects(sourcePaths, projectType = state.activeModdingContentType) {
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const normalizedSourcePaths = [...new Set(
    (sourcePaths || []).map((entry) => String(entry || "").trim()).filter(Boolean)
  )];
  const requestGuard = getOperationGuard();

  if (!normalizedSourcePaths.length) {
    return;
  }

  setBusy(true);
  setStatus(`${contentConfig.label} werden importiert...`);
  setProgress({
    active: true,
    label: `${contentConfig.label} werden importiert`,
    detail: normalizedSourcePaths.length === 1 ? normalizedSourcePaths[0] : `${normalizedSourcePaths.length} Einträge`,
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.importLocalProjects({
      sourcePaths: normalizedSourcePaths,
      projectType,
      profileSlug: requestGuard.profileSlug
    });
    if (!isOperationGuardCurrent(requestGuard)) {
      await refreshState({ fast: false });
      return;
    }
    await refreshState({ fast: false });
    await hydrateModdingState(state.configVersion);
    appendLog(`[content] Lokal importiert: ${projectType} (${result.importedCount})`);
    if (result.adoptedCount) {
      setStatus(`${contentConfig.label} wurden importiert und erkannt.`);
      setStatusDetail(`${result.adoptedCount} Einträge wurden als Modrinth-Projekte übernommen.`);
      resetProgress(`${result.importedCount} Einträge importiert, ${result.adoptedCount} erkannt.`);
    } else {
      setStatus(`${contentConfig.label} wurden importiert.`);
      resetProgress(`${result.importedCount} Einträge wurden lokal übernommen.`);
    }
  } catch (error) {
    setStatus(error.message || `${contentConfig.label} konnten nicht importiert werden.`, true);
    resetProgress(error.message || `${contentConfig.label} konnten nicht importiert werden.`);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
    state.localImportDragDepth = 0;
    setLocalImportSurfaceActive(false);
  }
}

async function handleSelectLocalProjects(projectType = state.activeModdingContentType) {
  const sourcePaths = await window.boocordApi.selectLocalProjects({
    projectType
  });

  if (!Array.isArray(sourcePaths) || !sourcePaths.length) {
    return;
  }

  await handleImportLocalProjects(sourcePaths, projectType);
}

async function handleAddMod(projectId) {
  return handleAddProject(projectId, state.activeModdingContentType);
}

async function handleRemoveMod(projectId) {
  return handleRemoveProject(projectId, state.activeModdingContentType);
}

async function handleSelectLauncherBackground() {
  setBusy(true);
  setStatus("Hintergrundbild wird gespeichert...");
  setProgress({
    active: true,
    label: "Launcher Hintergrund",
    detail: "Bild wird übernommen...",
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.pickLauncherBackgroundImage();

    if (!result) {
      setStatus("Hintergrundauswahl abgebrochen.");
      setStatusDetail("Es wurde kein Hintergrundbild übernommen.");
      resetProgress("Es wurde kein Hintergrundbild übernommen.");
      return;
    }

    state.config.settings = result.settings;
    renderState();
    setStatus("Hintergrundbild gespeichert.");
    setStatusDetail("Der Launcher verwendet jetzt dein ausgewähltes Bild.");
    resetProgress("Das Hintergrundbild wurde übernommen.");
  } catch (error) {
    setStatus(error.message || "Hintergrundbild konnte nicht gespeichert werden.", true);
    resetProgress(error.message || "Hintergrundbild konnte nicht gespeichert werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

async function handleRemoveLauncherBackground() {
  setBusy(true);
  setStatus("Hintergrundbild wird entfernt...");
  setProgress({
    active: true,
    label: "Launcher Hintergrund",
    detail: "Gespeichertes Bild wird entfernt...",
    indeterminate: true
  });

  try {
    const result = await window.boocordApi.removeLauncherBackgroundImage();
    state.config.settings = result.settings;
    renderState();
    setStatus("Hintergrundbild entfernt.");
    setStatusDetail("Der Launcher nutzt wieder den Standardhintergrund.");
    resetProgress("Das Hintergrundbild wurde entfernt.");
  } catch (error) {
    setStatus(error.message || "Hintergrundbild konnte nicht entfernt werden.", true);
    resetProgress(error.message || "Hintergrundbild konnte nicht entfernt werden.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    setBusy(false);
  }
}

function wireAccountMenu() {
  elements.accountTrigger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleAccountDropdown();
  });

  elements.accountDropdown.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", (event) => {
    if (!elements.navAccount.contains(event.target)) {
      closeAccountDropdown();
    }
  });
}

function wireLauncherActions() {
  elements.resultCopyButton?.addEventListener("click", handleCopyLogs);
  elements.resultClearButton?.addEventListener("click", handleClearLogs);

  buttonGroups.login.forEach((button) => {
    button.addEventListener("click", handleLogin);
  });

  buttonGroups.install.forEach((button) => {
    button.addEventListener("click", async () => {
      await handleInstall();
    });
  });

  buttonGroups.java.forEach((button) => {
    button.addEventListener("click", handleReinstallJava);
  });

  buttonGroups.launch.forEach((button) => {
    button.addEventListener("click", () => {
      void handleLaunch();
    });
  });

  elements.heroBoocordButton?.addEventListener("click", handleBoocordLaunch);

  buttonGroups.stop.forEach((button) => {
    button.addEventListener("click", handleStop);
  });

  buttonGroups.open.forEach((button) => {
    button.addEventListener("click", handleOpenDirectory);
  });

  elements.logoutButton.addEventListener("click", handleLogout);
  elements.navLogoutButton.addEventListener("click", handleLogout);
  elements.browseButton.addEventListener("click", handleBrowseDirectory);
  elements.launcherBackgroundSelectButton?.addEventListener("click", handleSelectLauncherBackground);
  elements.launcherBackgroundRemoveButton?.addEventListener("click", handleRemoveLauncherBackground);
  elements.languageChoiceButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      setBusy(true);

      try {
        await saveLanguage(button.dataset.languageChoice, {
          markPromptSeen: true
        });
        closeLanguagePrompt();
        setStatus("Sprache gespeichert.");
        setStatusDetail("Die Launcher-Sprache wurde aktualisiert.");
      } catch (error) {
        setStatus(error.message || "Sprache konnte nicht gespeichert werden.", true);
        setStatusDetail(error.message || "Sprache konnte nicht gespeichert werden.");
        appendLog(`[error] ${error.stack || error.message || String(error)}`);
      } finally {
        setBusy(false);
      }
    });
  });
  elements.profileCreateButton.addEventListener("click", handleCreateProfile);
  elements.profileImportButton.addEventListener("click", handleImportProfile);
  elements.modSearchButton.addEventListener("click", () => handleModSearch(true));
  elements.modDetailOverlay.addEventListener("click", closeModDetailModal);
  elements.modDetailClose.addEventListener("click", closeModDetailModal);
  elements.profileImportOverlay.addEventListener("click", closeProfileImportModal);
  elements.profileImportClose.addEventListener("click", closeProfileImportModal);
  elements.launchErrorOverlay.addEventListener("click", closeLaunchErrorModal);
  elements.launchErrorClose.addEventListener("click", closeLaunchErrorModal);
  elements.launchErrorConfirm.addEventListener("click", closeLaunchErrorModal);
  elements.accountDeleteOverlay.addEventListener("click", () => {
    closeAccountDeleteModal(false);
  });
  elements.accountDeleteClose.addEventListener("click", () => {
    closeAccountDeleteModal(false);
  });
  elements.accountDeleteCancel.addEventListener("click", () => {
    closeAccountDeleteModal(false);
  });
  elements.accountDeleteConfirm.addEventListener("click", () => {
    closeAccountDeleteModal(true);
  });
  elements.profileDeleteOverlay.addEventListener("click", () => {
    closeProfileDeleteModal(false);
  });
  elements.profileDeleteClose.addEventListener("click", () => {
    closeProfileDeleteModal(false);
  });
  elements.profileDeleteCancel.addEventListener("click", () => {
    closeProfileDeleteModal(false);
  });
  elements.profileDeleteConfirm.addEventListener("click", () => {
    closeProfileDeleteModal(true);
  });
  elements.profileImportRefresh.addEventListener("click", () => {
    loadProfileImportSources({
      force: true
    });
  });
  elements.profileImportBrowse.addEventListener("click", handleManualProfileImportBrowse);
  elements.localImportButton?.addEventListener("click", () => {
    handleSelectLocalProjects(state.activeModdingContentType);
  });

  elements.localImportSurface?.addEventListener("dragenter", (event) => {
    if (!hasTransferredFiles(event)) {
      return;
    }

    event.preventDefault();
    state.localImportDragDepth += 1;
    setLocalImportSurfaceActive(true);
  });

  elements.localImportSurface?.addEventListener("dragover", (event) => {
    if (!hasTransferredFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setLocalImportSurfaceActive(true);
  });

  elements.localImportSurface?.addEventListener("dragleave", (event) => {
    if (!hasTransferredFiles(event)) {
      return;
    }

    event.preventDefault();
    state.localImportDragDepth = Math.max(0, state.localImportDragDepth - 1);

    if (state.localImportDragDepth === 0) {
      setLocalImportSurfaceActive(false);
    }
  });

  elements.localImportSurface?.addEventListener("drop", (event) => {
    if (!hasTransferredFiles(event)) {
      return;
    }

    event.preventDefault();
    state.localImportDragDepth = 0;
    setLocalImportSurfaceActive(false);
    handleImportLocalProjects(getTransferredPaths(event), state.activeModdingContentType);
  });

  document.addEventListener("dragover", (event) => {
    if (!hasTransferredFiles(event)) {
      return;
    }

    event.preventDefault();
  });

  document.addEventListener("drop", (event) => {
    if (!hasTransferredFiles(event)) {
      return;
    }

    event.preventDefault();
  });

  elements.profileCreateInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCreateProfile();
    }
  });

  elements.modSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleModSearch(true);
    }
  });

  elements.selectedContentSearchInput?.addEventListener("input", () => {
    setSelectedContentSearchQuery(elements.selectedContentSearchInput.value);
    renderSelectedMods();
  });

  [elements.modInstallTarget, elements.selectedModState].forEach((select) => {
    select.addEventListener("change", () => {
      const targetType = select.value;

      if (targetType) {
        switchModdingContentType(targetType);
      }
    });
  });

  [elements.modCategorySelect, elements.modSortSelect].forEach((select) => {
    select.addEventListener("change", () => {
      handleModSearch(true);
    });
  });

  elements.minecraftVersionSelect.addEventListener("change", async () => {
    setBusy(true);

    try {
      state.searchResults = [];
      state.searchHasRun = false;
      state.searchPagination = {
        limit: 12,
        offset: 0,
        totalHits: 0
      };
      state.activeModPreview = null;
      state.activeModDetail = null;
      state.activeModDetailCacheKey = null;
      await persistSettings(
        {
          modding: {
            minecraftVersion: elements.minecraftVersionSelect.value,
            fabricLoaderVersion: null
          }
        },
        false
      );
      await handleModSearch(false);
    } catch (error) {
      setStatus(error.message || "Minecraft-Version konnte nicht gespeichert werden.", true);
      appendLog(`[error] ${error.stack || error.message || String(error)}`);
    } finally {
      setBusy(false);
    }
  });

  elements.fabricLoaderSelect.addEventListener("change", async () => {
    setBusy(true);

    try {
      await persistSettings({
        modding: {
          minecraftVersion: elements.minecraftVersionSelect.value,
          fabricLoaderVersion: elements.fabricLoaderSelect.value
        }
      });
      setStatus("Fabric-Loader aktualisiert.");
      setStatusDetail("Die Runtime-Einstellung wurde gespeichert.");
    } catch (error) {
      setStatus(error.message || "Fabric-Loader konnte nicht gespeichert werden.", true);
      appendLog(`[error] ${error.stack || error.message || String(error)}`);
    } finally {
      setBusy(false);
    }
  });

  [elements.memoryMinInput, elements.memoryMaxInput].forEach((input) => {
    input.addEventListener("change", async () => {
      setBusy(true);

      try {
        await persistSettings({
          memory: {
            min: elements.memoryMinInput.value.trim(),
            max: elements.memoryMaxInput.value.trim()
          }
        });
        setStatus("RAM-Einstellungen gespeichert.");
        setStatusDetail("Die Speichergrenzen werden beim nächsten Start verwendet.");
      } catch (error) {
        setStatus(error.message || "RAM-Einstellungen konnten nicht gespeichert werden.", true);
        appendLog(`[error] ${error.stack || error.message || String(error)}`);
      } finally {
        setBusy(false);
      }
    });
  });

  elements.javaGcProfileSelect?.addEventListener("change", async () => {
    setBusy(true);

    try {
      await persistSettings({
        runtime: {
          gcProfile: elements.javaGcProfileSelect.value || "auto"
        }
      });
      setStatus("Java-Startparameter gespeichert.");
      setStatusDetail("Der Garbage Collector wird beim nächsten Start verwendet.");
    } catch (error) {
      setStatus(error.message || "GC-Einstellung konnte nicht gespeichert werden.", true);
      appendLog(`[error] ${error.stack || error.message || String(error)}`);
    } finally {
      setBusy(false);
    }
  });

  elements.languageSelect?.addEventListener("change", async () => {
    setBusy(true);

    try {
      await saveLanguage(elements.languageSelect.value);
      setStatus("Sprache gespeichert.");
      setStatusDetail("Die Launcher-Sprache wurde aktualisiert.");
    } catch (error) {
      setStatus(error.message || "Sprache konnte nicht gespeichert werden.", true);
      setStatusDetail(error.message || "Sprache konnte nicht gespeichert werden.");
      appendLog(`[error] ${error.stack || error.message || String(error)}`);
    } finally {
      setBusy(false);
    }
  });

  elements.openLogsOnLaunchInput.addEventListener("change", async () => {
    setBusy(true);

    try {
      const result = await window.boocordApi.saveSettings({
        openLogsOnLaunch: elements.openLogsOnLaunchInput.checked
      });
      state.config.settings = result.settings;
      setStatus("Startverhalten gespeichert.");
      setStatusDetail("Die Logs-Ansicht beim Spielstart wurde aktualisiert.");
    } catch (error) {
      setStatus(error.message || "Startverhalten konnte nicht gespeichert werden.", true);
      appendLog(`[error] ${error.stack || error.message || String(error)}`);
    } finally {
      setBusy(false);
    }
  });

  elements.minimizeOnLaunchInput?.addEventListener("change", async () => {
    setBusy(true);

    try {
      const result = await window.boocordApi.saveSettings({
        minimizeOnLaunch: elements.minimizeOnLaunchInput.checked
      });
      state.config.settings = result.settings;
      setStatus("Startverhalten gespeichert.");
      setStatusDetail("Das Minimieren des Launchers beim Spielstart wurde aktualisiert.");
    } catch (error) {
      setStatus(error.message || "Launcher-Startverhalten konnte nicht gespeichert werden.", true);
      appendLog(`[error] ${error.stack || error.message || String(error)}`);
    } finally {
      setBusy(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (activeCustomSelect) {
      closeCustomSelect(activeCustomSelect, { restoreFocus: true });
      return;
    }

    if (isLaunchErrorModalOpen()) {
      closeLaunchErrorModal();
      return;
    }

    if (isAccountDeleteModalOpen()) {
      closeAccountDeleteModal(false);
      return;
    }

    if (isProfileDeleteModalOpen()) {
      closeProfileDeleteModal(false);
      return;
    }

    if (state.importBrowser.open) {
      closeProfileImportModal();
      return;
    }

    if (!elements.modDetailModal.hidden) {
      closeModDetailModal();
    }
  });
}

function sanitizeExternalUrl(value) {
  try {
    const parsed = new URL(String(value || "").trim());

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {}

  return null;
}

async function handleAddProject(projectOrId, projectType = state.activeModdingContentType, version = null) {
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const {
    projectId,
    projectReference,
    projectReferences
  } = resolveProjectActionReference(projectOrId, projectType);
  const selectedVersionLabel = getSelectedVersionLabel(version);
  const requestGuard = getOperationGuard();
  const previousSelection = [...getSelectedProjects(projectType)];

  if (!projectId) {
    setStatus(`${contentConfig.singularLabel} konnte nicht hinzugefügt werden.`, true);
    setStatusDetail("Für dieses Projekt fehlt eine gültige Projekt-ID.");
    return;
  }

  const existingPendingOperation = getPendingProjectOperation(projectReference, projectType);

  if (
    handleProjectOperationWhilePending(
      existingPendingOperation,
      "add",
      projectReference,
      projectType,
      {
        version
      }
    )
  ) {
    return;
  }

  const pendingOperation = beginPendingProjectOperation("add", projectReference, projectType);
  pendingOperation.projectReference = projectReference;
  pendingOperation.version = version || null;
  invalidateModdingStateHydration();
  setSelectedProjectsForType(
    projectType,
    [
      ...previousSelection.filter((entry) => entry.isLocalOnly || !projectMatchesReference(entry, projectReferences)),
      buildOptimisticSelectedProject(projectReference, projectType, version)
    ]
  );
  if (state.config?.modding) {
    syncActiveProfileSelectionCounts(state.config.modding);
  }
  renderProjectSelectionViews();
  setStatus(`${contentConfig.singularLabel} wird hinzugefügt...`);
  if (selectedVersionLabel) {
    setStatusDetail(`Ausgewählte Version: ${selectedVersionLabel}`);
  }

  try {
    const result = await window.boocordApi.addProject({
      projectId,
      projectType,
      profileSlug: requestGuard.profileSlug,
      projectSnapshot: projectReference,
      versionId: version?.id || null,
      versionNumber: version?.versionNumber || null,
      versionName: version?.name || null,
      versionType: version?.versionType || null
    });

    if (!isOperationGuardCurrent(requestGuard)) {
      return;
    }

    state.config.settings = result.settings;
    if (state.config?.modding) {
      state.config.modding = {
        ...state.config.modding,
        [contentConfig.selectionKey]: mergeDisplayedSelectedProjects(projectType, result.selectedProjects)
      };
      syncActiveProfileSelectionCounts(state.config.modding);
      renderProjectSelectionViews();
    } else {
      await refreshState({ fast: false });
    }

    appendLog(`[content] Hinzugefügt: ${projectType}:${projectId}`);
    setStatus(`${contentConfig.singularLabel} wurde hinzugefügt.`);
    resetProgress(`${contentConfig.singularLabel} wurde zur Auswahl hinzugefügt.`);
  } catch (error) {
    rollbackAddedProject(projectReference, projectType);
    renderProjectSelectionViews();
    setStatus(error.message || `${contentConfig.singularLabel} konnte nicht hinzugefügt werden.`, true);
    resetProgress(error.message || `${contentConfig.singularLabel} konnte nicht hinzugefügt werden.`);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    finalizeProjectOperation(pendingOperation, projectReference, projectType);
  }
}

async function handleRemoveProject(
  projectOrId,
  projectType = state.activeModdingContentType,
  { animateSelection = true } = {}
) {
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const {
    projectId,
    projectReference,
    projectReferences
  } = resolveProjectActionReference(projectOrId, projectType);
  const requestGuard = getOperationGuard();
  const previousSelection = [...getSelectedProjects(projectType)];
  const nextSelection = previousSelection.filter(
    (project) => project.isLocalOnly || !projectMatchesReference(project, projectReferences)
  );

  if (!projectId) {
    setStatus(`${contentConfig.singularLabel} konnte nicht entfernt werden.`, true);
    setStatusDetail("Für dieses Projekt fehlt eine gültige Projekt-ID.");
    return;
  }

  const existingPendingOperation = getPendingProjectOperation(projectReference, projectType);

  if (
    handleProjectOperationWhilePending(
      existingPendingOperation,
      "remove",
      projectReference,
      projectType,
      {
        animateSelection
      }
    )
  ) {
    return;
  }

  const optimisticRemoval = animateSelection
    ? applyOptimisticSelectedProjectRemoval(
        projectType,
        (project) => !project.isLocalOnly && projectMatchesReference(project, projectReferences)
      )
    : previousSelection.length !== nextSelection.length
      ? {
          changed: true,
          animationPromise: Promise.resolve(),
          restore: () => {
            rollbackRemovedProject(previousSelection, projectReference, projectType);
            renderProjectSelectionViews();
          }
        }
      : {
          changed: false,
          animationPromise: Promise.resolve(),
          restore: () => {}
        };

  const pendingOperation = beginPendingProjectOperation("remove", projectReference, projectType);
  pendingOperation.projectReference = projectReference;
  pendingOperation.animateSelection = animateSelection;
  invalidateModdingStateHydration();

  if (!animateSelection && optimisticRemoval.changed) {
    setSelectedProjectsForType(projectType, nextSelection);
    if (state.config?.modding) {
      syncActiveProfileSelectionCounts(state.config.modding);
    }
    renderProjectSelectionViews();
  }

  setStatus(`${contentConfig.singularLabel} wird entfernt...`);

  try {
    const result = await window.boocordApi.removeProject({
      projectId,
      projectType,
      profileSlug: requestGuard.profileSlug,
      projectSnapshot: projectReference
    });

    if (!isOperationGuardCurrent(requestGuard)) {
      optimisticRemoval.restore();
      return;
    }

    state.config.settings = result.settings;
    if (state.config?.modding) {
      state.config.modding = {
        ...state.config.modding,
        [contentConfig.selectionKey]: nextSelection
      };
      syncActiveProfileSelectionCounts(state.config.modding);
      renderProjectSelectionViews();
    }
    await optimisticRemoval.animationPromise;
    appendLog(`[content] Entfernt: ${projectType}:${projectId}`);
    setStatus(`${contentConfig.singularLabel} wurde entfernt.`);
    resetProgress(`${contentConfig.singularLabel} wurde aus der Auswahl entfernt.`);
  } catch (error) {
    optimisticRemoval.restore();
    setStatus(error.message || `${contentConfig.singularLabel} konnte nicht entfernt werden.`, true);
    resetProgress(error.message || `${contentConfig.singularLabel} konnte nicht entfernt werden.`);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    finalizeProjectOperation(pendingOperation, projectReference, projectType);
  }
}

async function handleRemoveLocalProject(project) {
  const projectType = project?.projectType || state.activeModdingContentType;
  const contentConfig = moddingContentConfigs[projectType] || moddingContentConfigs.mod;
  const localFileName = String(project?.localFileName || "").trim();
  const requestGuard = getOperationGuard();

  if (!localFileName) {
    setStatus("Lokaler Inhalt konnte nicht entfernt werden.", true);
    setStatusDetail("Der Dateiname für den lokalen Eintrag fehlt.");
    return;
  }

  if (handleProjectOperationWhilePending(
    getPendingProjectOperation(project, projectType),
    "remove-local",
    project,
    projectType
  )) {
    return;
  }

  const optimisticRemoval = applyOptimisticSelectedProjectRemoval(
    projectType,
    (entry) => entry.isLocalOnly && String(entry.localFileName || "").trim() === localFileName
  );
  const pendingOperation = beginPendingProjectOperation("remove-local", project, projectType);
  pendingOperation.projectReference = project;
  invalidateModdingStateHydration();
  setStatus(`${contentConfig.singularLabel} wird lokal entfernt...`);

  try {
    const result = await window.boocordApi.removeLocalProject({
      localFileName,
      projectType,
      profileSlug: requestGuard.profileSlug
    });

    if (!isOperationGuardCurrent(requestGuard)) {
      optimisticRemoval.restore();
      return;
    }

    state.config.settings = result?.settings || state.config.settings;
    const nextSelectedProjects =
      result?.selectedProjects ||
      result?.settings?.modding?.[contentConfig.selectionKey] ||
      getSelectedProjects(projectType).filter((entry) => {
        const entryFileName = String(entry?.localFileName || "").trim().toLowerCase();
        const entryLocalReference = toLocalProjectReference(entryFileName, projectType);

        return !(
          (entry?.isLocalOnly || normalizeProjectReference(entry?.projectId) === entryLocalReference) &&
          entryFileName === localFileName.toLowerCase()
        );
      });

    setSelectedProjectsForType(projectType, nextSelectedProjects);
    if (state.config?.modding) {
      syncActiveProfileSelectionCounts(state.config.modding);
      renderProjectSelectionViews();
    }
    await optimisticRemoval.animationPromise;
    appendLog(`[content] Lokal entfernt: ${projectType}:${localFileName}`);
    setStatus(`${contentConfig.singularLabel} wurde lokal entfernt.`);
    resetProgress(`${contentConfig.singularLabel} wurde aus dem Profil gelöscht.`);
  } catch (error) {
    optimisticRemoval.restore();
    setStatus(error.message || `${contentConfig.singularLabel} konnte nicht lokal entfernt werden.`, true);
    resetProgress(error.message || `${contentConfig.singularLabel} konnte nicht lokal entfernt werden.`);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    finalizeProjectOperation(pendingOperation, project, projectType);
  }
}

async function initialize() {
  startTranslationObserver();
  relocateModdingToolbars();
  initializeCustomSelects();
  wirePageChrome();
  wireAccountMenu();
  wireLauncherActions();
  attachImageFallback(elements.accountAvatar);
  applyLauncherWindowState(await window.boocordApi.getLauncherWindowState());
  state.unsubscribeWindowState = window.boocordApi.onLauncherWindowState((payload) => {
    applyLauncherWindowState(payload);
  });
  switchTab(state.activeTab);
  document.body.style.transition = "opacity 0.3s ease";
  document.body.style.opacity = "1";
  await refreshState();
  if (state.config?.modding?.loading) {
    void hydrateModdingState(state.configVersion);
  }
  void refreshServerStatus();
  state.serverPollTimer = window.setInterval(() => {
    refreshServerStatus();
  }, 30000);
  state.moddingPollTimer = window.setInterval(() => {
    maybePollModdingState();
  }, 4000);
  resetProgress();
  if (shouldShowLanguagePrompt()) {
    openLanguagePrompt();
  }

  state.unsubscribe = window.boocordApi.onLauncherEvent((payload) => {
    appendLog(`[${payload.stage}] ${payload.message}`);
    updateProgressFromEvent(payload);

    if (!state.config) {
      return;
    }

    let shouldRender = false;

    if (payload.launchState) {
      shouldRender = !sameLaunchState(state.config.launchState, payload.launchState);
      state.config.launchState = payload.launchState;
      state.config.isRunning = Boolean(payload.launchState.isRunning);

      if (!payload.launchState.isStopping) {
        state.isStopping = false;
      }

      if (payload.launchState.isRunning || payload.launchState.isPreparing || payload.launchState.isStopping) {
        state.lastProcessState = null;
      }
    }

    if (payload.stage === "launch") {
      state.isStopping = false;
      state.config.isRunning = true;
      state.lastProcessState = null;
      shouldRender = true;
    }

    if (payload.stage === "close") {
      state.isStopping = false;
      state.lastProcessState = payload.failed ? "failed" : "stopped";
      state.config.launchState = payload.launchState || getIdleLaunchState();
      state.config.isRunning = false;
      setStatus(payload.message);
      setStatusDetail(payload.message);
      shouldRender = true;
    }

    if (payload.stage === "status" || payload.stage === "ready" || payload.stage === "auth") {
      setStatus(payload.message);
      setStatusDetail(payload.message);
    }

    if (shouldRender) {
      queueRenderState();
    }
  });
}

initialize().catch((error) => {
  setStatus(error.message || "Initialisierung fehlgeschlagen.", true);
  setStatusDetail(error.message || "Initialisierung fehlgeschlagen.");
  if (elements.resultBox) {
    elements.resultBox.textContent = error.stack || error.message || String(error);
  }
  document.body.style.opacity = "1";
});

window.addEventListener("beforeunload", () => {
  if (state.logFlushTimer !== null) {
    window.clearTimeout(state.logFlushTimer);
    state.logFlushTimer = null;
  }

  if (state.unsubscribe) {
    state.unsubscribe();
  }

  if (state.unsubscribeWindowState) {
    state.unsubscribeWindowState();
  }

  if (state.serverPollTimer) {
    window.clearInterval(state.serverPollTimer);
  }

  if (state.moddingPollTimer) {
    window.clearInterval(state.moddingPollTimer);
  }
});
