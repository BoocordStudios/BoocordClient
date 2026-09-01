const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDirectory = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDirectory, relativePath), "utf8");
}

function fail(message) {
  throw new Error(`[translation-check] ${message}`);
}

function loadLauncherTranslations() {
  const source = read("src/renderer/renderer.js");
  const start = source.indexOf("const languagePromptVersion");
  const end = source.indexOf("function translateLogLines");

  if (start < 0 || end < 0 || end <= start) {
    fail("Launcher-Übersetzungsfunktionen konnten nicht gefunden werden.");
  }

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(
    `${source.slice(start, end)}
this.translateTextForTest = translateText;
this.translateLogLineForTest = translateLogLine;
this.getCurrentLocaleForTest = getCurrentLocale;
this.setCurrentLanguageForTest = (language) => { currentLanguage = normalizeLanguage(language); };`,
    sandbox
  );

  return {
    source,
    translateText: sandbox.translateTextForTest,
    translateLogLine: sandbox.translateLogLineForTest,
    getCurrentLocale: sandbox.getCurrentLocaleForTest,
    setCurrentLanguage: sandbox.setCurrentLanguageForTest
  };
}

function loadSetupTranslations() {
  const source = read("src/renderer/setup.js");
  const start = source.indexOf("const setupLanguage");
  const end = source.indexOf("const state");

  if (start < 0 || end < 0 || end <= start) {
    fail("Installer-Übersetzungsfunktionen konnten nicht gefunden werden.");
  }

  const sandbox = {
    navigator: {
      language: "en-US"
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(
    `${source.slice(start, end)}
this.translateSetupTextForTest = translateSetupText;
this.translateSetupLogLineForTest = translateSetupLogLine;`,
    sandbox
  );

  return {
    source,
    translateText: sandbox.translateSetupTextForTest,
    translateLogLine: sandbox.translateSetupLogLineForTest
  };
}

function loadPresenceTranslations() {
  const source = read("src/services/discordPresenceService.js");
  const start = source.indexOf("const presenceText");
  const end = source.indexOf("function clampActivityText");

  if (start < 0 || end < 0 || end <= start) {
    fail("Discord-Presence-Übersetzungen konnten nicht gefunden werden.");
  }

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(
    `${source.slice(start, end)}
this.translatePresenceForTest = translateStatusMessage;
this.presenceKeysForTest = {
  de: Object.keys(presenceText.de),
  en: Object.keys(presenceText.en)
};`,
    sandbox
  );

  return {
    translateStatus: sandbox.translatePresenceForTest,
    keys: sandbox.presenceKeysForTest
  };
}

function assertTranslation(translate, source, expected, context = source) {
  const actual = translate(source, "en");

  if (actual !== expected) {
    fail(`${context}\nErwartet: ${expected}\nErhalten: ${actual}`);
  }
}

function decodeHtmlText(value) {
  return String(value)
    .replace(/&copy;/g, "©")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractStaticUiStrings(html, { removeSkippedSections = false } = {}) {
  let normalizedHtml = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<span\b[^>]*class="[^"]*material-icons[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "");

  if (removeSkippedSections) {
    normalizedHtml = normalizedHtml.replace(
      /<section\b[^>]*data-i18n-skip="true"[^>]*>[\s\S]*?<\/section>/gi,
      ""
    );
  }

  const values = [];

  for (const match of normalizedHtml.matchAll(/>([^<>]+)</g)) {
    values.push(decodeHtmlText(match[1]));
  }

  for (const match of normalizedHtml.matchAll(/(?:aria-label|title|placeholder|alt|content)="([^"]+)"/g)) {
    values.push(decodeHtmlText(match[1]));
  }

  return [...new Set(values.filter(Boolean))];
}

const germanUiPattern = /(?:[äöüÄÖÜß]|\b(?:Alle|Bereiche|Bereit|Einstellungen|Entfernen|Hinzufügen|Instanz|Instanzen|Keine|Kein|Konto|Lädt|Ordner|Prüfe|Schließen|Spiel|Sprache|Suche|Veröffentlicht|Wähle|wird|werden|für|und|zur|zum)\b)/;
const unchangedUiTerms = new Set(["Profile", "Mods", "Runtime", "Account", "Accounts", "Server"]);

function assertStaticUiCoverage(htmlPath, translate, options = {}) {
  const untranslated = extractStaticUiStrings(read(htmlPath), options).filter((value) =>
    germanUiPattern.test(value) &&
    !unchangedUiTerms.has(value) &&
    translate(value, "en") === value
  );

  if (untranslated.length) {
    fail(`${htmlPath} enthält nicht übersetzte UI-Texte:\n- ${untranslated.join("\n- ")}`);
  }
}

const launcher = loadLauncherTranslations();

const launcherCases = [
  ["keine Inhalte", "no items"],
  ["1 Inhalt hinzugefügt", "1 item added"],
  ["2 Inhalte entfernt", "2 items removed"],
  [
    "Änderungen seit letzter Installation: 1 Inhalt hinzugefügt, 2 Inhalte entfernt.",
    "Changes since last installation: 1 item added, 2 items removed."
  ],
  ["1,234 Inhalte ausgewählt", "1,234 items selected"],
  ["Mods, Resource Packs und Shader Packs verwalten", "Manage mods, resource packs, and shader packs"],
  ["3 Instanzen gefunden", "3 instances found"],
  ["CurseForge wurde nicht gefunden", "CurseForge was not found"],
  ["CurseForge-Profil", "CurseForge profile"],
  ["Icon für PvP ändern", "Change icon for PvP"],
  ["Profilnamen für PvP bearbeiten", "Edit profile name for PvP"],
  ["Der neue Profilname PvP wurde gespeichert.", "The new profile name PvP was saved."],
  ["Fabric 0.16.10 auf 1.21.1", "Fabric 0.16.10 on 1.21.1"],
  ["Alex ist angemeldet und startbereit.", "Alex is signed in and ready to launch."],
  [
    "Fabric 0.16.10 auf 1.21.1. Installiert: 2 Mods. Aktuell: 3 Mods. Änderungen seit letzter Installation: 1 Inhalt hinzugefügt. Java 21 ist verwaltet installiert.",
    "Fabric 0.16.10 on 1.21.1. Installed: 2 mods. Current: 3 mods. Changes since last installation: 1 item added. Java 21 is installed as a managed runtime."
  ],
  [
    "Aktuell: keine Inhalte. Runtime noch nicht installiert. Java 21 wird bei Bedarf automatisch installiert.",
    "Current: no items. Runtime not installed yet. Java 21 will be installed automatically when needed."
  ],
  ["3 Mod-Ergebnisse geladen.", "3 mod results loaded."],
  ["1-12 von 1,234 | Seite 1 / 103", "1-12 of 1,234 | Page 1 / 103"],
  ["1,234 Treffer", "1,234 results"],
  ["Katalog aktuell nicht erreichbar: Request fehlgeschlagen: 503", "Catalog is currently unavailable: Request failed: 503"],
  [
    "Katalog aktuell nicht erreichbar: api.modrinth.com hat ungültige JSON-Daten geliefert.",
    "Catalog is currently unavailable: api.modrinth.com returned invalid JSON data."
  ],
  ["Profil PvP wurde aus der Auswahl entfernt.", "Profile PvP was removed from the selection."],
  ["Resource Pack wurde lokal entfernt.", "Resource Pack was removed locally."],
  ["3 Einträge wurden als Modrinth-Projekte übernommen.", "3 entries were adopted as Modrinth projects."],
  [
    'Profil "PvP" wirklich löschen? Der komplette Profilordner wird entfernt.',
    'Do you really want to delete profile "PvP"? The complete profile folder will be removed.'
  ],
  ["Keine Dateien oder Ordner zum Importieren ausgewählt.", "No files or folders were selected for import."],
  [
    "Für Minecraft 1.21.1 wird Java 21+ benötigt, erkannt wurde aber Java 17.",
    "Minecraft 1.21.1 requires Java 21 or newer, but Java 17 was detected."
  ],
  ["api.modrinth.com hat ungültige JSON-Daten geliefert.", "api.modrinth.com returned invalid JSON data."],
  [
    "Modrinth-Instanzen mit forge werden aktuell nicht unterstützt. Importiert werden nur Fabric-Instanzen.",
    "Modrinth instances using forge are not currently supported. Only Fabric instances can be imported."
  ],
  [
    "Microsoft-Anmeldung fehlgeschlagen (invalid_grant). Bitte melde dich erneut an.",
    "Microsoft sign-in failed (invalid_grant). Please sign in again."
  ],
  ["HTTP-Anfrage fehlgeschlagen (HTTP 503 Service Unavailable).", "HTTP request failed (HTTP 503 Service Unavailable)."]
];

launcherCases.forEach(([source, expected]) => {
  assertTranslation(launcher.translateLogLine, source, expected);
});

if (launcher.translateText("Settings", "de") !== "Einstellungen") {
  fail("Die deutsche Normalisierung für Settings fehlt.");
}
if (launcher.translateText("Music", "de") !== "Musik") {
  fail("Die deutsche Übersetzung für Music fehlt.");
}
if (launcher.translateText("Launcher Bereiche", "de") !== "Launcher-Bereiche") {
  fail("Die deutsche Schreibweise für Launcher-Bereiche ist nicht normalisiert.");
}
if (launcher.translateText("Mod Browser", "de") !== "Mod-Browser") {
  fail("Die deutsche Schreibweise für Mod-Browser ist nicht normalisiert.");
}

launcher.setCurrentLanguage("de");
if (launcher.getCurrentLocale() !== "de-DE") {
  fail("Der deutsche Locale-Wert ist nicht de-DE.");
}
launcher.setCurrentLanguage("en");
if (launcher.getCurrentLocale() !== "en-US") {
  fail("Der englische Locale-Wert ist nicht en-US.");
}

if (launcher.source.includes("Keine Detailbeschreibung verfugbar.")) {
  fail("Der Tippfehler 'verfugbar' ist noch vorhanden.");
}
if (!launcher.source.includes('closest?.("[data-i18n-skip], .material-icons")')) {
  fail("Material-Icon-Texte sind nicht vom Übersetzer ausgeschlossen.");
}

assertStaticUiCoverage("src/renderer/index.html", launcher.translateText, {
  removeSkippedSections: true
});

const setup = loadSetupTranslations();
const setupCases = [
  ["Installieren. Starten. Fertig.", "Install. Launch. Done."],
  ["Installieren und starten", "Install and launch"],
  ["Bereit für die Installation.", "Ready to install."],
  ["Installation abgeschlossen.", "Installation complete."],
  ["Der Installer wurde mit Exit-Code 5 beendet.", "The installer exited with code 5."],
  ["Das interne Installationspaket wurde nicht gefunden.", "The internal installation package was not found."]
];

setupCases.forEach(([source, expected]) => {
  assertTranslation(setup.translateText, source, expected, `Installer: ${source}`);
});

if (setup.translateText("Custom Setup UI", "de") !== "Eigene Setup-Oberfläche") {
  fail("Die deutsche Installer-Bezeichnung ist nicht vollständig lokalisiert.");
}

const translatedSetupLog = setup.translateLogLine("[setup] Installation abgeschlossen: C:\\Boocord\\Boocord.exe");
if (translatedSetupLog !== "[setup] Installation complete: C:\\Boocord\\Boocord.exe") {
  fail(`Installer-Log wurde nicht übersetzt: ${translatedSetupLog}`);
}

assertStaticUiCoverage("src/renderer/setup.html", setup.translateText);

const presence = loadPresenceTranslations();
const presenceCases = [
  [
    "Optimiere Minecraft-Downloads mit 16 parallelen Verbindungen...",
    "Optimizing Minecraft downloads with 16 parallel connections..."
  ],
  [
    "Start wird abgebrochen. Aktuelle Downloads werden noch abgeschlossen...",
    "Canceling launch. Current downloads are still being completed..."
  ]
];

presenceCases.forEach(([source, expected]) => {
  assertTranslation(presence.translateStatus, source, expected, `Discord Presence: ${source}`);
});

if (presence.keys.de.join("|") !== presence.keys.en.join("|")) {
  fail("Die Discord-Presence-Sprachpakete enthalten unterschiedliche Schlüssel.");
}

console.log(
  `Übersetzungsprüfung erfolgreich (${launcherCases.length + setupCases.length + presenceCases.length} dynamische Fälle).`
);
