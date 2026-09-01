document.body.style.opacity = "0";

const setupLanguage = String(navigator.language || "")
  .trim()
  .toLowerCase()
  .startsWith("de")
  ? "de"
  : "en";

const setupTranslationText = {
  de: {
    "Custom Setup UI": "Eigene Setup-Oberfläche",
    "Installer Bundle": "Installer-Paket",
    "Client Status": "Client-Status",
    "Setup Status": "Setup-Status",
    "Setup Log": "Setup-Protokoll",
    "Installer UI bereit.": "Installer-Oberfläche bereit.",
    "Installer UI": "Installer-Oberfläche",
    "Boocord statt Wizard": "Boocord statt Assistent",
    "Installer UI konnte nicht initialisiert werden.": "Installer-Oberfläche konnte nicht initialisiert werden.",
    "Die sichtbare Setup-Oberfläche läuft komplett in eurer eigenen UI-Language statt als Windows-Standard-Assistent.": "Die sichtbare Setup-Oberfläche läuft komplett in eurer eigenen UI-Sprache statt als Windows-Standard-Assistent."
  },
  en: {
    "Boocord Client Installer mit derselben visuellen Sprache wie der Launcher.": "Boocord Client installer with the same visual language as the launcher.",
    "Minimieren": "Minimize",
    "Schließen": "Close",
    "Custom Setup UI": "Custom setup UI",
    "Installieren. Starten. Fertig.": "Install. Launch. Done.",
    "Der Installer nutzt jetzt dieselbe visuelle Sprache wie der Client: keine Windows-Wizard-Optik mehr, sondern eine eigenständige Boocord-Oberfläche.": "The installer now uses the same visual language as the client: no Windows wizard styling, but a dedicated Boocord interface.",
    "Installieren und starten": "Install and launch",
    "Neu installieren und starten": "Reinstall and launch",
    "Zielordner öffnen": "Open target folder",
    "Installation pro Benutzer, direkter Client-Start nach erfolgreichem Abschluss.": "Per-user installation with direct client launch after successful completion.",
    "Herausgeber": "Publisher",
    "Prüfe Paket...": "Checking package...",
    "Installer Bundle": "Installer bundle",
    "Zielpfad": "Target path",
    "Nicht installiert": "Not installed",
    "Client Status": "Client status",
    "Setup Status": "Setup status",
    "Bereit für die Installation.": "Ready to install.",
    "Das Setup wartet auf den Start des Installationsvorgangs.": "Setup is waiting for the installation to start.",
    "Warten auf Aktion": "Waiting for action",
    "Warte auf die Installationsfreigabe.": "Waiting for installation approval.",
    "Paket vorbereiten": "Prepare package",
    "Das eingebettete Installationspaket wird geprüft und still gestartet.": "The embedded installation package is checked and started silently.",
    "Dateien installieren": "Install files",
    "Der eigentliche Client wird im Hintergrund für den aktuellen Benutzer eingerichtet.": "The client is installed in the background for the current user.",
    "Direkt starten": "Launch directly",
    "Nach erfolgreicher Installation öffnet sich der Boocord Client automatisch.": "Boocord Client opens automatically after a successful installation.",
    "Setup Log": "Setup log",
    "Technische Statusmeldungen des Installationsablaufs.": "Technical status messages from the installation process.",
    "Setup-Log kopieren": "Copy setup log",
    "Installer UI bereit.": "Installer UI ready.",
    "Boocord statt Wizard": "Boocord instead of a wizard",
    "Keine Standard-Dialoge mehr": "No more standard dialogs",
    "Die sichtbare Setup-Oberfläche läuft komplett in eurer eigenen UI-Language statt als Windows-Standard-Assistent.": "The visible setup runs entirely in your own interface instead of a standard Windows wizard.",
    "Schneller Ablauf": "Fast process",
    "Ein Klick bis zum Start": "One click to launch",
    "Der Installationsvorgang läuft still im Hintergrund und startet den Client nach Erfolg sofort automatisch.": "Installation runs silently in the background and launches the client automatically when complete.",
    "Saubere Trennung": "Clean separation",
    "UI oben, Installer darunter": "Interface on top, installer underneath",
    "Die Optik kommt aus Electron, der eigentliche Installationsmechanismus bleibt stabil über das bestehende Setup-Paket.": "Electron provides the interface while the existing setup package keeps the installation mechanism stable.",
    "Version wird geladen...": "Loading version...",
    "Status wird geladen...": "Loading status...",
    "Boocord Studios. Alle Rechte vorbehalten.": "Boocord Studios. All rights reserved.",
    "Kopiert": "Copied",
    "Kopieren fehlgeschlagen": "Copy failed",
    "Das eingebettete Setup wird vorbereitet.": "Preparing the embedded setup.",
    "Paket prüfen": "Checking package",
    "Die Installation läuft im Hintergrund.": "Installation is running in the background.",
    "Der Client wird final eingerichtet.": "Completing client setup.",
    "Setup abschließen": "Completing setup",
    "Boocord Client wird gleich gestartet.": "Boocord Client will launch shortly.",
    "Start vorbereiten": "Preparing launch",
    "Wird geladen": "Loading",
    "Installation läuft": "Installation in progress",
    "Bereits installiert": "Already installed",
    "Bereit für Installation": "Ready to install",
    "Installationspaket bereit": "Installation package ready",
    "Paket fehlt": "Package missing",
    "Installationspaket fehlt.": "Installation package is missing.",
    "Das Setup kann den Boocord Client jetzt installieren.": "Setup can now install Boocord Client.",
    "Der Installer-Wrapper hat das interne Setup-Paket noch nicht gefunden.": "The installer wrapper has not found the internal setup package yet.",
    "Zielordner konnte nicht geöffnet werden.": "The target folder could not be opened.",
    "Boocord Client wird installiert...": "Installing Boocord Client...",
    "Stiller Installationslauf wird gestartet.": "Starting silent installation.",
    "Der Client wurde installiert und wird jetzt gestartet.": "The client was installed and is now launching.",
    "Fertig": "Done",
    "Installation abgeschlossen.": "Installation complete.",
    "Boocord Client wird gestartet.": "Launching Boocord Client.",
    "Die Installation ist fehlgeschlagen.": "Installation failed.",
    "Fehler": "Error",
    "Installation fehlgeschlagen.": "Installation failed.",
    "Installer UI konnte nicht initialisiert werden.": "The installer UI could not be initialized.",
    "Unbekannter Fehler": "Unknown error",
    "Das interne Installationspaket wurde nicht gefunden.": "The internal installation package was not found.",
    "Die Installation ist abgeschlossen, aber die Client-Datei wurde nicht gefunden.": "The installation completed, but the client executable was not found.",
    "Kein Pfad übergeben.": "No path was provided."
  }
};

const setupTranslationAttributes = ["aria-label", "title", "placeholder", "alt", "content"];

function translateSetupText(value, language = setupLanguage) {
  const text = String(value ?? "");
  const trimmed = text.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return text;
  }

  const dictionary = setupTranslationText[language] || setupTranslationText.de;
  let translated = dictionary[trimmed] || trimmed;

  if (language === "en") {
    translated = translated
      .replace(/^Der Installer wurde mit Exit-Code (.+) beendet\.$/, "The installer exited with code $1.")
      .replace(/^Installation abgeschlossen: (.+)$/, "Installation complete: $1");
  }

  if (translated === trimmed) {
    return text;
  }

  const leading = text.match(/^\s*/)?.[0] || "";
  const trailing = text.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function translateSetupLogLine(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => {
      const stageMatch = line.match(/^(\[[^\]]+]\s*)(.*)$/);
      const stagePrefix = stageMatch?.[1] || "";
      const stageBody = stageMatch?.[2] ?? line;
      const errorMatch = stageBody.match(/^([A-Za-z]*Error:\s*)(.*)$/);

      if (errorMatch) {
        return `${stagePrefix}${errorMatch[1]}${translateSetupText(errorMatch[2])}`;
      }

      return `${stagePrefix}${translateSetupText(stageBody)}`;
    })
    .join("\n");
}

function getLocalizedSetupLogs() {
  return state.logs.map((line) => translateSetupLogLine(line));
}

function applySetupTranslations(root = document.body) {
  const translateElement = (element) => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE || element.closest(".material-icons")) {
      return;
    }

    setupTranslationAttributes.forEach((attributeName) => {
      if (element.hasAttribute(attributeName)) {
        element.setAttribute(attributeName, translateSetupText(element.getAttribute(attributeName)));
      }
    });
  };

  translateElement(root);
  root.querySelectorAll("*").forEach(translateElement);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement?.closest(".material-icons")) {
      node.nodeValue = translateSetupText(node.nodeValue);
    }
  }

  document.documentElement.lang = setupLanguage;
}

const state = {
  info: null,
  isInstalling: false,
  progressTimer: null,
  progress: {
    active: false,
    detail: "Warte auf die Installationsfreigabe.",
    indeterminate: false,
    label: "Warten auf Aktion",
    percent: 0
  },
  logs: ["[setup] Installer UI bereit."]
};

const elements = {
  companyLabel: document.getElementById("setup-company-label"),
  bundleLabel: document.getElementById("setup-bundle-label"),
  targetLabel: document.getElementById("setup-target-label"),
  installedLabel: document.getElementById("setup-installed-label"),
  primaryButton: document.getElementById("setup-primary-button"),
  primaryLabel: document.getElementById("setup-primary-label"),
  openDirButton: document.getElementById("setup-open-dir-button"),
  statusText: document.getElementById("setup-status-text"),
  statusDetail: document.getElementById("setup-status-detail"),
  progressShell: document.getElementById("setup-progress-shell"),
  progressMeta: document.getElementById("setup-progress-meta"),
  progressBar: document.getElementById("setup-progress-bar"),
  copyLogButton: document.getElementById("setup-copy-log-button"),
  copyLogLabel: document.getElementById("setup-copy-log-label"),
  logOutput: document.getElementById("setup-log-output"),
  versionLabel: document.getElementById("setup-version-label"),
  footerInstallState: document.getElementById("setup-install-state-footer"),
  yearLabel: document.getElementById("setup-year"),
  minimizeButton: document.getElementById("setup-window-minimize"),
  closeButton: document.getElementById("setup-window-close")
};

function appendLog(message) {
  state.logs.push(message);
  elements.logOutput.textContent = getLocalizedSetupLogs().join("\n");
  elements.logOutput.scrollTop = elements.logOutput.scrollHeight;
}

function showTemporaryButtonLabel(labelElement, label, fallbackLabel, duration = 1800) {
  if (!labelElement) {
    return;
  }

  if (labelElement._resetTimer) {
    window.clearTimeout(labelElement._resetTimer);
  }

  labelElement.textContent = translateSetupText(label);
  labelElement._resetTimer = window.setTimeout(() => {
    labelElement.textContent = translateSetupText(fallbackLabel);
    labelElement._resetTimer = null;
  }, duration);
}

async function handleCopyLogs() {
  const defaultLabel = "Setup-Log kopieren";

  try {
    await window.boocordApi.copyText(getLocalizedSetupLogs().join("\n"));
    showTemporaryButtonLabel(elements.copyLogLabel, "Kopiert", defaultLabel);
  } catch (error) {
    showTemporaryButtonLabel(elements.copyLogLabel, "Kopieren fehlgeschlagen", defaultLabel, 2600);
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  }
}

function setProgress(nextProgress) {
  state.progress = {
    ...state.progress,
    ...nextProgress
  };

  elements.progressShell.dataset.active = String(Boolean(state.progress.active));
  elements.progressShell.dataset.indeterminate = String(Boolean(state.progress.indeterminate));
  elements.progressMeta.textContent = translateSetupText(state.progress.label);
  elements.progressBar.style.width = `${Math.max(0, Math.min(100, state.progress.percent || 0))}%`;
  elements.statusDetail.textContent = translateSetupText(state.progress.detail);
}

function stopProgressSimulation() {
  if (state.progressTimer) {
    window.clearInterval(state.progressTimer);
    state.progressTimer = null;
  }
}

function startProgressSimulation() {
  stopProgressSimulation();

  const phases = [
    {
      detail: "Das eingebettete Setup wird vorbereitet.",
      label: "Paket prüfen",
      max: 18
    },
    {
      detail: "Die Installation läuft im Hintergrund.",
      label: "Dateien installieren",
      max: 62
    },
    {
      detail: "Der Client wird final eingerichtet.",
      label: "Setup abschließen",
      max: 88
    },
    {
      detail: "Boocord Client wird gleich gestartet.",
      label: "Start vorbereiten",
      max: 94
    }
  ];

  setProgress({
    active: true,
    detail: phases[0].detail,
    indeterminate: false,
    label: phases[0].label,
    percent: 6
  });

  state.progressTimer = window.setInterval(() => {
    const currentPercent = state.progress.percent || 0;

    if (currentPercent >= 94) {
      return;
    }

    const nextPercent = currentPercent + (currentPercent < 18 ? 4 : currentPercent < 62 ? 3 : 1);
    const activePhase = phases.find((phase) => nextPercent <= phase.max) || phases[phases.length - 1];

    setProgress({
      active: true,
      detail: activePhase.detail,
      indeterminate: false,
      label: activePhase.label,
      percent: nextPercent
    });
  }, 680);
}

function formatInstallState(info) {
  if (!info) {
    return translateSetupText("Wird geladen");
  }

  if (state.isInstalling) {
    return translateSetupText("Installation läuft");
  }

  return translateSetupText(info.installedExecutablePath ? "Bereits installiert" : "Bereit für Installation");
}

function updateActionState() {
  const ready = Boolean(state.info?.installerBundleReady);
  elements.primaryButton.disabled = state.isInstalling || !ready;
  elements.openDirButton.disabled = state.isInstalling || !state.info?.installDirectory;
  elements.primaryLabel.textContent = translateSetupText(
    state.info?.installedExecutablePath ? "Neu installieren und starten" : "Installieren und starten"
  );
}

function render() {
  const info = state.info;

  elements.companyLabel.textContent = info?.companyName || "Boocord Studios";
  elements.bundleLabel.textContent = translateSetupText(
    info?.installerBundleReady ? "Installationspaket bereit" : "Paket fehlt"
  );
  elements.targetLabel.textContent = info?.installDirectory || "-";
  elements.installedLabel.textContent = formatInstallState(info);
  elements.versionLabel.textContent = info?.version
    ? `${info.productName} ${info.version}`
    : translateSetupText("Version wird geladen...");
  elements.footerInstallState.textContent = formatInstallState(info);

  if (!state.isInstalling && !state.progress.active) {
    elements.statusText.textContent = translateSetupText(
      info?.installerBundleReady ? "Bereit für die Installation." : "Installationspaket fehlt."
    );
    elements.statusDetail.textContent = translateSetupText(
      info?.installerBundleReady
        ? "Das Setup kann den Boocord Client jetzt installieren."
        : "Der Installer-Wrapper hat das interne Setup-Paket noch nicht gefunden."
    );
  }

  updateActionState();
}

async function refreshInstallerState() {
  state.info = await window.boocordApi.getInstallerState();
  render();
}

async function handleOpenInstallDirectory() {
  if (!state.info?.installDirectory) {
    return;
  }

  const result = await window.boocordApi.openInstallerPath(state.info.installDirectory);

  if (!result.ok) {
    appendLog(`[error] ${result.message || "Zielordner konnte nicht geöffnet werden."}`);
  }
}

async function handleInstall() {
  if (state.isInstalling || !state.info?.installerBundleReady) {
    return;
  }

  state.isInstalling = true;
  updateActionState();
  elements.statusText.textContent = translateSetupText("Boocord Client wird installiert...");
  appendLog("[setup] Stiller Installationslauf wird gestartet.");
  startProgressSimulation();

  try {
    const result = await window.boocordApi.startInstaller({
      launchAfterInstall: true
    });

    stopProgressSimulation();
    setProgress({
      active: true,
      detail: "Der Client wurde installiert und wird jetzt gestartet.",
      indeterminate: false,
      label: "Fertig",
      percent: 100
    });
    elements.statusText.textContent = translateSetupText("Installation abgeschlossen.");
    appendLog(`[setup] Installation abgeschlossen: ${result.installedExecutablePath}`);
    appendLog("[setup] Boocord Client wird gestartet.");
    await refreshInstallerState();

    window.setTimeout(() => {
      window.boocordApi.closeInstallerWindow();
    }, 1400);
  } catch (error) {
    stopProgressSimulation();
    setProgress({
      active: true,
      detail: translateSetupText(error.message || "Die Installation ist fehlgeschlagen."),
      indeterminate: false,
      label: "Fehler",
      percent: 100
    });
    elements.statusText.textContent = translateSetupText("Installation fehlgeschlagen.");
    appendLog(`[error] ${error.stack || error.message || String(error)}`);
  } finally {
    state.isInstalling = false;
    updateActionState();
  }
}

function wireEvents() {
  elements.primaryButton.addEventListener("click", handleInstall);
  elements.openDirButton.addEventListener("click", handleOpenInstallDirectory);
  elements.copyLogButton?.addEventListener("click", handleCopyLogs);
  elements.minimizeButton.addEventListener("click", () => {
    window.boocordApi.minimizeInstallerWindow();
  });
  elements.closeButton.addEventListener("click", () => {
    window.boocordApi.closeInstallerWindow();
  });
}

async function initialize() {
  elements.yearLabel.textContent = String(new Date().getFullYear());
  applySetupTranslations();
  elements.logOutput.textContent = getLocalizedSetupLogs().join("\n");
  wireEvents();
  await refreshInstallerState();
  document.body.style.transition = "opacity 0.28s ease";
  document.body.style.opacity = "1";
}

initialize().catch((error) => {
  appendLog(`[error] ${error.stack || error.message || String(error)}`);
  elements.statusText.textContent = translateSetupText("Installer UI konnte nicht initialisiert werden.");
  elements.statusDetail.textContent = translateSetupText(error.message || "Unbekannter Fehler");
  document.body.style.opacity = "1";
});

window.addEventListener("beforeunload", () => {
  stopProgressSimulation();
});
