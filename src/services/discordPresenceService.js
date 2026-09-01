const DiscordRPC = require("discord-rpc");

const activityTextLimit = 128;
const reconnectDelayMs = 15000;

const presenceText = {
  de: {
    unknownError: "Unbekannter Fehler",
    defaultDetails: "Boocord Client",
    asAccount: "Angemeldet als",
    profile: "Profil",
    inLauncher: "Im Launcher",
    authenticating: "Meldet sich an",
    installing: "Installiert Client",
    readyFallback: "Client ist bereit",
    readyFor: (version) => `Bereit für ${version}`,
    launching: "Startet Minecraft",
    stopping: "Beendet Minecraft",
    playing: "Spielt Boocord Client"
  },
  en: {
    unknownError: "Unknown error",
    defaultDetails: "Boocord Client",
    asAccount: "Signed in as",
    profile: "Profile",
    inLauncher: "In Launcher",
    authenticating: "Signing in",
    installing: "Installing client",
    readyFallback: "Client is ready",
    readyFor: (version) => `Ready for ${version}`,
    launching: "Starting Minecraft",
    stopping: "Stopping Minecraft",
    playing: "Playing Boocord Client"
  }
};

function normalizeLanguage(language) {
  const normalized = String(language || "").trim().toLowerCase();
  return normalized === "en" ? "en" : "de";
}

function getPresenceText(language, key, ...args) {
  const bundle = presenceText[normalizeLanguage(language)] || presenceText.de;
  const value = bundle[key] ?? presenceText.de[key] ?? "";
  return typeof value === "function" ? value(...args) : value;
}

function translateStatusMessage(message, language = "de") {
  const rawMessage = String(message || "").trim();

  if (normalizeLanguage(language) !== "en" || !rawMessage) {
    return rawMessage;
  }

  const exactMessages = {
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
    "Start wurde abgebrochen.": "Launch was canceled.",
    "Start wird abgebrochen. Aktuelle Downloads werden noch abgeschlossen...": "Canceling launch. Current downloads are still being completed...",
    "Account wurde nicht gefunden.": "Account was not found.",
    "Minecraft konnte kein Stop-Signal erhalten.": "Minecraft could not receive a stop signal.",
    "Minecraft konnte nicht gestartet werden. Prüfe die Log-Ausgabe im Launcher.": "Minecraft could not be started. Check the log output in the launcher.",
    "Minecraft läuft bereits.": "Minecraft is already running.",
    "Minecraft startet oder läuft bereits.": "Minecraft is starting or already running.",
    "Die heruntergeladene Java-Runtime hat eine ungültige Prüfsumme.": "The downloaded Java runtime has an invalid checksum.",
    "Fabric-Installer-Version konnte nicht bestimmt werden.": "Fabric installer version could not be determined."
  };

  return (exactMessages[rawMessage] || rawMessage)
    .replace(/^Optimiere Minecraft-Downloads mit (.+) parallelen Verbindungen\.\.\.$/, "Optimizing Minecraft downloads with $1 parallel connections...")
    .replace(/^Verwaltete Java-Runtime (.+) wird eingerichtet\.\.\.$/, "Setting up managed Java runtime $1...")
    .replace(/^Lade (.+) herunter\.\.\.$/, "Downloading $1...")
    .replace(/^(.+) wird eingerichtet\.\.\.$/, "Setting up $1...")
    .replace(/^Lade (.+) Installer (.+)\.\.\.$/, "Downloading $1 installer $2...")
    .replace(/^Lade (.+) (.+)\.\.\.$/, "Downloading $1 $2...")
    .replace(/^Java (.+) wird aus der verwalteten Runtime verwendet\.$/, "Java $1 is used from the managed runtime.")
    .replace(/^Java (.+) konnte nicht korrekt installiert werden\.$/, "Java $1 could not be installed correctly.")
    .replace(/^Keine verwaltete Java-Runtime für Java (.+) gefunden\.$/, "No managed Java runtime found for Java $1.")
    .replace(/^Keine Fabric-Loader für Minecraft (.+) gefunden\.$/, "No Fabric loader found for Minecraft $1.")
    .replace(/^Keine herunterladbare Datei für (.+) gefunden\.$/, "No downloadable file found for $1.")
    .replace(/^Minecraft-Version (.+) wurde nicht gefunden\.$/, "Minecraft version $1 was not found.")
    .replace(/^Importquelle wurde nicht gefunden: (.+)$/, "Import source was not found: $1")
    .replace(/^Download fehlgeschlagen: (.+)$/, "Download failed: $1")
    .replace(/^Request fehlgeschlagen: (.+)$/, "Request failed: $1")
    .replace(/^Java (.+) wurde neu installiert\.$/, "Java $1 was reinstalled.")
    .replace(/^Minecraft wurde beendet \(Code (.+)\)\.$/, "Minecraft closed (code $1).")
    .replace(/^Starte Minecraft als (.+)\.\.\.$/, "Starting Minecraft as $1...")
    .replace(/^Minecraft gestartet \(PID (.+)\)\.$/, "Minecraft started (PID $1).");
}

function clampActivityText(value, fallback = null) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return fallback;
  }

  return normalized.slice(0, activityTextLimit);
}

function isDefaultProfileLabel(profileLabel) {
  const normalized = String(profileLabel || "").trim().toLowerCase();
  return !normalized || normalized === "standard" || normalized === "default";
}

function buildStateText({ accountName = null, profileLabel = null, language = "de" } = {}) {
  const activeLanguage = normalizeLanguage(language);
  const segments = [];

  if (accountName) {
    segments.push(`${getPresenceText(activeLanguage, "asAccount")} ${accountName}`);
  }

  if (profileLabel && !isDefaultProfileLabel(profileLabel)) {
    segments.push(`${getPresenceText(activeLanguage, "profile")} ${profileLabel}`);
  }

  return clampActivityText(segments.join(" | "), getPresenceText(activeLanguage, "defaultDetails"));
}

function formatErrorMessage(error) {
  if (!error) {
    return getPresenceText("de", "unknownError");
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return error.code ? `${error.message} [${error.code}]` : error.message;
  }

  return String(error);
}

class DiscordPresenceService {
  constructor({
    clientId,
    largeImageKey,
    largeImageText = "Boocord Client"
  }) {
    this.clientId = String(clientId || "").trim();
    this.largeImageKey = clampActivityText(largeImageKey);
    this.largeImageText = clampActivityText(largeImageText, "Boocord Client");
    this.client = null;
    this.connected = false;
    this.connectPromise = null;
    this.lastActivity = null;
    this.launcherStartedAt = new Date();
    this.gameStartedAt = null;
    this.reconnectTimer = null;
    this.shuttingDown = false;

    if (this.clientId) {
      DiscordRPC.register(this.clientId);
    }
  }

  log(message, error = null) {
    if (error) {
      console.warn(`[discord-presence] ${message}: ${formatErrorMessage(error)}`);
      return;
    }

    console.warn(`[discord-presence] ${message}`);
  }

  async initialize() {
    if (!this.clientId) {
      return false;
    }

    this.shuttingDown = false;
    return this.ensureConnected();
  }

  async ensureConnected() {
    if (!this.clientId || this.shuttingDown) {
      return false;
    }

    if (this.connected && this.client) {
      return true;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.client) {
      this.releaseClient(this.client);
      this.client = null;
    }

    const client = new DiscordRPC.Client({
      transport: "ipc"
    });

    this.client = client;

    client.on("ready", () => {
      this.connected = true;

      if (this.lastActivity) {
        void this.applyActivity(this.lastActivity);
      }
    });

    client.on("disconnected", () => {
      this.handleDisconnect(client);
    });

    client.on("error", (error) => {
      this.log("Discord RPC client error", error);
    });

    this.connectPromise = client.login({
      clientId: this.clientId
    }).then(() => {
      this.connected = true;
      return true;
    }).catch((error) => {
      this.log("Discord RPC login failed", error);
      this.handleDisconnect(client);
      return false;
    }).finally(() => {
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  handleDisconnect(client) {
    if (this.client === client) {
      this.client = null;
    }

    this.connected = false;
    this.releaseClient(client);

    if (!this.shuttingDown) {
      this.scheduleReconnect();
    }
  }

  releaseClient(client) {
    if (!client) {
      return;
    }

    client.removeAllListeners();

    try {
      const destroyResult = client.destroy();

      if (destroyResult && typeof destroyResult.catch === "function") {
        destroyResult.catch(() => {
          // Ignore cleanup failures for stale RPC clients.
        });
      }
    } catch {
      // Ignore cleanup failures for stale RPC clients.
    }
  }

  scheduleReconnect() {
    if (!this.clientId || this.reconnectTimer || this.shuttingDown) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      if (this.lastActivity) {
        void this.applyActivity(this.lastActivity);
        return;
      }

      void this.ensureConnected();
    }, reconnectDelayMs);

    if (typeof this.reconnectTimer.unref === "function") {
      this.reconnectTimer.unref();
    }
  }

  normalizeActivity(activity = {}) {
    const normalizedButtons = Array.isArray(activity.buttons)
      ? activity.buttons
        .filter((entry) => entry?.label && entry?.url)
        .slice(0, 2)
        .map((entry) => ({
          label: clampActivityText(entry.label, "Open"),
          url: String(entry.url)
        }))
      : undefined;

    return {
      details: clampActivityText(activity.details, "Boocord Client"),
      state: clampActivityText(activity.state, buildStateText(activity)),
      startTimestamp: activity.startTimestamp || undefined,
      endTimestamp: activity.endTimestamp || undefined,
      largeImageKey: clampActivityText(activity.largeImageKey, this.largeImageKey),
      largeImageText: clampActivityText(activity.largeImageText, this.largeImageText),
      smallImageKey: clampActivityText(activity.smallImageKey),
      smallImageText: clampActivityText(activity.smallImageText),
      buttons: normalizedButtons,
      instance: false
    };
  }

  createFallbackActivity(activity = {}) {
    return {
      details: activity.details,
      state: activity.state,
      startTimestamp: activity.startTimestamp,
      endTimestamp: activity.endTimestamp,
      instance: false
    };
  }

  hasOptionalActivityFields(activity = {}) {
    return Boolean(
      activity.largeImageKey ||
      activity.largeImageText ||
      activity.smallImageKey ||
      activity.smallImageText ||
      (Array.isArray(activity.buttons) && activity.buttons.length > 0)
    );
  }

  async applyActivity(activity) {
    const normalizedActivity = this.normalizeActivity(activity);
    this.lastActivity = normalizedActivity;

    const isConnected = await this.ensureConnected();

    if (!isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setActivity(normalizedActivity);
      return true;
    } catch (error) {
      if (this.hasOptionalActivityFields(normalizedActivity)) {
        this.log("Discord activity update failed, retrying without optional assets", error);
        const fallbackActivity = this.createFallbackActivity(normalizedActivity);

        try {
          await this.client.setActivity(fallbackActivity);
          this.lastActivity = fallbackActivity;
          this.log("Discord activity applied without optional assets");
          return true;
        } catch (fallbackError) {
          this.log("Discord fallback activity failed", fallbackError);
        }
      } else {
        this.log("Discord activity update failed", error);
      }

      this.handleDisconnect(this.client);
      return false;
    }
  }

  setLauncherPresence(context = {}) {
    this.gameStartedAt = null;
    const language = normalizeLanguage(context.language);

    return this.applyActivity({
      details: getPresenceText(language, "inLauncher"),
      state: buildStateText({ ...context, language }),
      startTimestamp: this.launcherStartedAt
    });
  }

  setAuthenticatingPresence(context = {}) {
    const language = normalizeLanguage(context.language);

    return this.applyActivity({
      details: getPresenceText(language, "authenticating"),
      state: buildStateText({ ...context, language }),
      startTimestamp: this.launcherStartedAt
    });
  }

  setInstallingPresence(context = {}) {
    const language = normalizeLanguage(context.language);
    const versionText = context.minecraftVersion
      ? `Minecraft ${context.minecraftVersion}`
      : getPresenceText(language, "defaultDetails");

    return this.applyActivity({
      details: getPresenceText(language, "installing"),
      state: clampActivityText(versionText, getPresenceText(language, "defaultDetails")),
      startTimestamp: this.launcherStartedAt
    });
  }

  setReadyPresence(context = {}) {
    const language = normalizeLanguage(context.language);
    const versionText = context.minecraftVersion
      ? getPresenceText(language, "readyFor", context.minecraftVersion)
      : getPresenceText(language, "readyFallback");

    return this.applyActivity({
      details: versionText,
      state: buildStateText({ ...context, language }),
      startTimestamp: this.launcherStartedAt
    });
  }

  setLaunchingPresence(context = {}) {
    const language = normalizeLanguage(context.language);
    const versionText = context.minecraftVersion
      ? `Minecraft ${context.minecraftVersion}`
      : getPresenceText(language, "defaultDetails");

    return this.applyActivity({
      details: getPresenceText(language, "launching"),
      state: clampActivityText(versionText, getPresenceText(language, "defaultDetails")),
      startTimestamp: this.launcherStartedAt
    });
  }

  setStoppingPresence(context = {}) {
    const language = normalizeLanguage(context.language);

    return this.applyActivity({
      details: getPresenceText(language, "stopping"),
      state: buildStateText({ ...context, language }),
      startTimestamp: this.launcherStartedAt
    });
  }

  setRunningPresence(context = {}) {
    const language = normalizeLanguage(context.language);

    if (!this.gameStartedAt) {
      this.gameStartedAt = new Date();
    }

    const versionText = context.minecraftVersion
      ? `Minecraft ${context.minecraftVersion}`
      : getPresenceText(language, "defaultDetails");

    return this.applyActivity({
      details: getPresenceText(language, "playing"),
      state: clampActivityText(`${versionText}${context.accountName ? ` | ${context.accountName}` : ""}`, versionText),
      startTimestamp: this.gameStartedAt
    });
  }

  async syncLauncherState({ isRunning = false, launchState = null, ...context } = {}) {
    if (launchState?.phase === "stopping") {
      return this.setStoppingPresence(context);
    }

    if (launchState?.phase === "preparing") {
      return this.setLaunchingPresence(context);
    }

    if (isRunning || launchState?.phase === "running") {
      return this.setRunningPresence(context);
    }

    return this.setLauncherPresence(context);
  }

  async updateFromLauncherEvent(payload = {}, context = {}) {
    switch (payload.stage) {
      case "auth":
        return this.setAuthenticatingPresence(context);
      case "ready":
        return this.setReadyPresence(context);
      case "launch":
        return this.setRunningPresence(context);
      case "close":
        return this.setLauncherPresence(context);
      case "status":
        return this.updateStatusPresence(payload.message, context);
      default:
        return false;
    }
  }

  async updateStatusPresence(message, context = {}) {
    const normalizedMessage = String(message || "").toLowerCase();

    if (context.launchPhase === "stopping") {
      return this.setStoppingPresence(context);
    }

    if (context.launchPhase === "preparing" && !normalizedMessage) {
      return this.setLaunchingPresence(context);
    }

    if (!normalizedMessage) {
      return this.setLauncherPresence(context);
    }

    if (normalizedMessage.includes("starte minecraft")) {
      return this.setLaunchingPresence(context);
    }

    if (
      normalizedMessage.includes("laufzeitverzeichnis") ||
      normalizedMessage.includes("runtime") ||
      normalizedMessage.includes("mod") ||
      normalizedMessage.includes("java") ||
      normalizedMessage.includes("kopiere client-dateien")
    ) {
      return this.setInstallingPresence(context);
    }

    return this.applyActivity({
      details: translateStatusMessage(message, context.language),
      state: buildStateText(context),
      startTimestamp: this.launcherStartedAt
    });
  }

  async dispose() {
    this.shuttingDown = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const client = this.client;
    this.client = null;
    this.connected = false;
    this.connectPromise = null;

    if (!client) {
      return;
    }

    try {
      await client.clearActivity();
    } catch {
      // Ignore shutdown errors so app quit remains clean.
    }

    try {
      await client.destroy();
    } catch {
      // Ignore shutdown errors so app quit remains clean.
    }
  }
}

function createDiscordPresenceService(options) {
  return new DiscordPresenceService(options);
}

module.exports = {
  createDiscordPresenceService
};
