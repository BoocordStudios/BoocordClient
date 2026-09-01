const fs = require("node:fs/promises");
const { constants: fsConstants, createReadStream, existsSync, readFileSync, statSync } = require("node:fs");
const crypto = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { Client } = require("minecraft-launcher-core");
const LauncherCoreHandler = require("minecraft-launcher-core/components/handler");
const { Auth } = require("msmc");

const rootDirectory = path.resolve(__dirname, "..", "..");
const manifestPath = path.join(rootDirectory, "client.manifest.json");
const overridesDirectory = path.join(rootDirectory, "overrides");
const modrinthApiRoot = "https://api.modrinth.com/v2";
const mojangVersionManifestUrl = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
const adoptiumApiRoot = "https://api.adoptium.net/v3";
const managedJavaVendor = "Eclipse Temurin";
const isWindows = process.platform === "win32";
const managedJavaArchitecture = process.arch === "x64" ? "x64" : null;
const fabricDistributions = {
  fabric: {
    id: "fabric",
    metaRoot: "https://meta.fabricmc.net/v2",
    installerLabel: "Fabric",
    installerMetadataUrl: "https://maven.fabricmc.net/net/fabricmc/fabric-installer/maven-metadata.xml",
    installerUrl(version) {
      return (
        `https://maven.fabricmc.net/net/fabricmc/fabric-installer/${version}/` +
        `fabric-installer-${version}.jar`
      );
    }
  },
  legacyFabric: {
    id: "legacy-fabric",
    metaRoot: "https://meta.legacyfabric.net/v2",
    installerLabel: "Legacy Fabric",
    installerMetadataUrl: "https://maven.legacyfabric.net/net/legacyfabric/fabric-installer/maven-metadata.xml",
    installerUrl(version) {
      return (
        `https://maven.legacyfabric.net/net/legacyfabric/fabric-installer/${version}/` +
        `fabric-installer-${version}.jar`
      );
    }
  }
};
const minimumLegacyFabricVersion = [1, 8, 0];
const maximumLegacyFabricVersion = [1, 13, 2];
const defaultLauncherDownloadMaxSockets = Math.max(
  12,
  Math.min(32, (os.cpus()?.length || 4) * 2)
);
const defaultManagedContentDownloadConcurrency = Math.max(
  4,
  Math.min(8, Math.ceil(defaultLauncherDownloadMaxSockets / 4))
);
const catalogCacheVersion = 1;
const requestRetryCount = 2;
const requestRetryDelayMs = 300;
const defaultRequestTimeoutMs = 5000;
const runtimeProfileTimeoutMs = 4500;
const moddingCatalogTimeoutMs = 4000;
const modrinthTagTimeoutMs = 2500;
const selectedProjectDetailsTimeoutMs = 3500;
const javaInspectionTimeoutMs = 2500;

let activeLaunch = null;
let activeLaunchSession = null;
let minecraftManifestCache = null;
let minecraftVersionOptionsCache = [];
const minecraftMetadataCache = new Map();
const modrinthProjectCache = new Map();
const modrinthProjectRequestCache = new Map();
const modrinthVersionByHashCache = new Map();
const localFileHashCache = new Map();
const fabricLoaderCache = new Map();
const modrinthCategoryCache = new Map();
const fileMutationLocks = new Map();

const moddingContentConfigs = {
  mod: {
    projectType: "mod",
    selectionKey: "selectedMods",
    defaultManifestKey: "mods",
    loader: "fabric",
    directoryName: "mods",
    managedStateFileName: ".boocord-managed-mods.json",
    fallbackLabel: "Mod"
  },
  resourcepack: {
    projectType: "resourcepack",
    selectionKey: "selectedResourcePacks",
    defaultManifestKey: "resourcePacks",
    loader: null,
    directoryName: "resourcepacks",
    managedStateFileName: ".boocord-managed-resource-packs.json",
    fallbackLabel: "Resource Pack"
  },
  shader: {
    projectType: "shader",
    selectionKey: "selectedShaderPacks",
    defaultManifestKey: "shaderPacks",
    loader: null,
    directoryName: "shaderpacks",
    managedStateFileName: ".boocord-managed-shader-packs.json",
    fallbackLabel: "Shader Pack"
  }
};
function getModdingContentConfig(projectType = "mod") {
  return moddingContentConfigs[projectType] || moddingContentConfigs.mod;
}

function getAccountAvatarUrl(accountName = null, accountId = null) {
  const identifier = String(accountName || accountId || "").trim();

  if (!identifier) {
    return null;
  }

  return `https://mineskin.eu/helm/${encodeURIComponent(identifier)}/100.png`;
}

function loadManifest() {
  delete require.cache[require.resolve(manifestPath)];
  return require(manifestPath);
}

function emit(emitEvent, stage, message, extra = {}) {
  if (typeof emitEvent === "function" && message) {
    emitEvent({
      stage,
      message,
      ...extra
    });
  }
}

function createIdleLaunchState() {
  return {
    phase: "idle",
    isPreparing: false,
    isRunning: false,
    isStopping: false,
    canStop: false,
    pid: null
  };
}

function getLaunchStateSnapshot(session = activeLaunchSession) {
  if (!session) {
    return createIdleLaunchState();
  }

  const phase = session.stopRequested
    ? "stopping"
    : session.child
      ? "running"
      : "preparing";

  return {
    phase,
    isPreparing: phase === "preparing",
    isRunning: phase === "running",
    isStopping: phase === "stopping",
    canStop: phase !== "idle",
    pid: session.child?.pid || null
  };
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

function createLaunchAbortedError() {
  const error = new Error("Start wurde abgebrochen.");
  error.code = "LAUNCH_ABORTED";
  return error;
}

function isLaunchAbortedError(error) {
  return error?.code === "LAUNCH_ABORTED";
}

function createLoginAbortedError() {
  const error = new Error("Login wurde abgebrochen.");
  error.code = "LOGIN_ABORTED";
  return error;
}

function isLoginGuiClosedError(error) {
  const message = String(error?.message || error || "").trim();
  return message === "error.gui.closed";
}

function clearLaunchSession(session) {
  if (activeLaunchSession === session) {
    activeLaunchSession = null;
  }

  if (activeLaunch === session?.child) {
    activeLaunch = null;
  }
}

function shouldSuppressLaunchEvent(session, stage) {
  if (!session?.stopRequested) {
    return false;
  }

  return ["debug", "game", "progress", "download"].includes(stage);
}

function emitLaunchEvent(session, stage, message, extra = {}) {
  if (!session || shouldSuppressLaunchEvent(session, stage)) {
    return;
  }

  const launchState = extra.launchState || getLaunchStateSnapshot(session);
  const shouldSendLaunchState =
    Object.prototype.hasOwnProperty.call(extra, "launchState") ||
    !sameLaunchState(session.lastLaunchState, launchState);

  session.lastLaunchState = launchState;

  emit(session.emitEvent, stage, message, {
    ...extra,
    ...(shouldSendLaunchState
      ? {
          launchState
        }
      : {})
  });
}

function isLiveChildProcess(child) {
  return Boolean(child?.pid) && child.exitCode === null && !child.killed;
}

function getTrackedChildProcessId(child) {
  if (!child) {
    return null;
  }

  const minecraftPid = Number(child.minecraftPid);

  if (Number.isInteger(minecraftPid) && minecraftPid > 0) {
    return minecraftPid;
  }

  const processId = Number(child.pid);
  return Number.isInteger(processId) && processId > 0 ? processId : null;
}

async function terminateLaunchProcess(child) {
  if (!isLiveChildProcess(child)) {
    return false;
  }

  const pid = getTrackedChildProcessId(child);

  if (isWindows && pid) {
    try {
      await runCommand("taskkill", ["/PID", String(pid), "/T", "/F"]);
    } catch (error) {
      if (child.exitCode === null && child.signalCode === null) {
        throw new Error(error.message || "Minecraft konnte nicht beendet werden.");
      }
    }

    return true;
  }

  const signalSent = child.kill("SIGTERM");

  if (!signalSent && child.exitCode === null && child.signalCode === null) {
    throw new Error("Minecraft konnte kein Stop-Signal erhalten.");
  }

  return signalSent;
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

function sleep(timeoutMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
}

async function mapWithConcurrencyLimit(items, concurrency, iteratee) {
  const list = Array.isArray(items) ? items : [];

  if (!list.length) {
    return [];
  }

  const normalizedConcurrency = Math.max(
    1,
    Math.min(list.length, Math.floor(Number(concurrency) || 1))
  );
  const results = new Array(list.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < list.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await iteratee(list[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: normalizedConcurrency }, () => worker())
  );

  return results;
}

function shouldRetryRequest(error) {
  const statusCode = Number(error?.statusCode);

  if (Number.isFinite(statusCode)) {
    return statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
  }

  return true;
}

function isNonFatalManagedSelectionSyncError(error) {
  const statusCode = Number(error?.statusCode);
  const code = String(error?.code || "").trim().toUpperCase();
  const message = String(error?.message || error || "").trim();

  return (
    statusCode === 408 ||
    statusCode === 425 ||
    statusCode === 429 ||
    statusCode >= 500 ||
    code === "REQUEST_TIMEOUT" ||
    /Request fehlgeschlagen|fetch failed|ECONN|ETIMEDOUT|ENOTFOUND|network/i.test(message)
  );
}

async function withRequestRetry(requestFactory, retryCount = requestRetryCount) {
  let lastError = null;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await requestFactory();
    } catch (error) {
      lastError = error;

      if (attempt >= retryCount || !shouldRetryRequest(error)) {
        break;
      }

      await sleep(requestRetryDelayMs * (attempt + 1));
    }
  }

  throw lastError;
}

async function withTimeout(promise, timeoutMs, message) {
  let timeoutHandle = null;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          const error = new Error(message);
          error.code = "REQUEST_TIMEOUT";
          reject(error);
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function getRequestHostLabel(url) {
  try {
    return new URL(url).host || "Der Server";
  } catch {
    return "Der Server";
  }
}

function normalizeJsonErrorMessage(error) {
  const message = error?.message || String(error || "");

  if (
    /Unexpected end of JSON input/i.test(message) ||
    /Unexpected token.+JSON/i.test(message) ||
    /JSON\.parse/i.test(message)
  ) {
    return "JSON-Daten konnten nicht verarbeitet werden.";
  }

  return message;
}

function isUnhelpfulErrorMessage(message) {
  const normalizedMessage = String(message || "").trim();
  return !normalizedMessage || /^\[object .+\]$/i.test(normalizedMessage);
}

function getHttpStatusLabel(response = null) {
  if (!response || typeof response !== "object") {
    return "";
  }

  const status = response.status || response.statusCode || null;
  const statusText = response.statusText || response.statusMessage || "";

  if (!status) {
    return "";
  }

  return statusText ? `HTTP ${status} ${statusText}` : `HTTP ${status}`;
}

function describeMsmcError(code, response = null) {
  const statusLabel = getHttpStatusLabel(response);
  const suffix = statusLabel ? ` (${statusLabel})` : "";

  switch (code) {
    case "error.auth.microsoft":
      return `Microsoft-Anmeldung fehlgeschlagen${suffix}. Bitte melde dich erneut an.`;
    case "error.auth.xboxLive":
      return `Xbox-Live-Anmeldung fehlgeschlagen${suffix}. Bitte prüfe dein Microsoft-Konto und melde dich erneut an.`;
    case "error.auth.xsts.userNotFound":
      return "Dieses Microsoft-Konto hat kein Xbox-Profil.";
    case "error.auth.xsts.bannedCountry":
      return "Xbox Live ist für das Land dieses Microsoft-Kontos nicht verfügbar.";
    case "error.auth.xsts.child":
    case "error.auth.xsts.child.SK":
      return "Dieses Konto ist als Kinderkonto markiert und muss in einer Familiengruppe freigegeben werden.";
    case "error.auth.minecraft.login":
      return `Minecraft-Anmeldung fehlgeschlagen${suffix}. Minecraft Services hat die Xbox-Anmeldung abgelehnt.`;
    case "error.auth.minecraft.profile":
      return `Minecraft-Profil konnte nicht geladen werden${suffix}. Prüfe, ob das Konto Minecraft besitzt.`;
    case "error.auth.minecraft.entitlements":
      return `Minecraft-Besitzrechte konnten nicht geprüft werden${suffix}.`;
    default:
      return "";
  }
}

function stringifyServiceErrorObject(error, seen = new WeakSet()) {
  if (!error || typeof error !== "object") {
    return "";
  }

  if (seen.has(error)) {
    return "";
  }

  seen.add(error);

  const msmcMessage = describeMsmcError(error.ts, error.response);

  if (msmcMessage) {
    return msmcMessage;
  }

  if (typeof error.ts === "string" && error.ts.trim()) {
    return error.ts.trim();
  }

  const preferredKeys = [
    "message",
    "error",
    "reason",
    "detail",
    "details",
    "description",
    "body"
  ];

  for (const key of preferredKeys) {
    const message = normalizeServiceErrorValue(error[key], seen);

    if (!isUnhelpfulErrorMessage(message)) {
      return message;
    }
  }

  const statusLabel = getHttpStatusLabel(error);

  if (statusLabel) {
    return `HTTP-Anfrage fehlgeschlagen (${statusLabel}).`;
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

function normalizeServiceErrorValue(value, seen = new WeakSet()) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  return stringifyServiceErrorObject(value, seen);
}

function normalizeServiceErrorMessage(error, fallbackMessage = "Aktion fehlgeschlagen.") {
  let message = normalizeServiceErrorValue(error?.message);

  if (isUnhelpfulErrorMessage(message)) {
    message = normalizeServiceErrorValue(error);
  }

  message = String(message || "").replace(/\s+/g, " ").trim();
  return isUnhelpfulErrorMessage(message) ? fallbackMessage : message;
}

function asServiceError(error, fallbackMessage = "Aktion fehlgeschlagen.") {
  const message = normalizeServiceErrorMessage(error, fallbackMessage);

  if (error instanceof Error && !isUnhelpfulErrorMessage(error.message)) {
    return error;
  }

  const wrappedError = new Error(message);

  if (error?.code && typeof error.code !== "object") {
    wrappedError.code = error.code;
  }

  wrappedError.cause = error;
  return wrappedError;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = defaultRequestTimeoutMs) {
  const { signal: externalSignal, ...fetchOptions } = options || {};
  const controller = new AbortController();
  let timeoutHandle = null;
  let abortListener = null;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      abortListener = () => {
        controller.abort();
      };
      externalSignal.addEventListener("abort", abortListener, { once: true });
    }
  }

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeoutHandle = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
  }

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`${getRequestHostLabel(url)} hat nicht rechtzeitig geantwortet.`);
      timeoutError.code = "REQUEST_TIMEOUT";
      throw timeoutError;
    }

    throw error;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }

    if (externalSignal && abortListener) {
      externalSignal.removeEventListener("abort", abortListener);
    }
  }
}

async function readJson(targetPath, fallbackValue = null) {
  if (!(await exists(targetPath))) {
    return fallbackValue;
  }

  try {
    const content = await fs.readFile(targetPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Konnte JSON-Datei nicht lesen: ${targetPath}`, error);
    return fallbackValue;
  }
}

async function writeJson(targetPath, payload) {
  await ensureDirectory(path.dirname(targetPath));
  const temporaryPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.rename(temporaryPath, targetPath);
}

async function withFileMutationLock(lockKey, operation) {
  const normalizedLockKey = String(lockKey || "");
  const previousLock = fileMutationLocks.get(normalizedLockKey) || Promise.resolve();
  let releaseLock = null;
  const currentLock = new Promise((resolve) => {
    releaseLock = resolve;
  });

  fileMutationLocks.set(normalizedLockKey, currentLock);
  await previousLock.catch(() => {});

  try {
    return await operation();
  } finally {
    releaseLock();

    if (fileMutationLocks.get(normalizedLockKey) === currentLock) {
      fileMutationLocks.delete(normalizedLockKey);
    }
  }
}

function isRecoverableJsonParseError(error) {
  const message = error?.message || String(error || "");

  return (
    error instanceof SyntaxError ||
    /Unexpected end of JSON input/i.test(message) ||
    /Unexpected token/i.test(message) ||
    /Unexpected non-whitespace character after JSON/i.test(message) ||
    /Unexpected string in JSON/i.test(message)
  );
}

function extractLeadingStructuredJson(content) {
  const rawContent = String(content || "").replace(/^\uFEFF/, "");
  const startIndex = rawContent.search(/\S/);

  if (startIndex < 0) {
    return null;
  }

  const firstCharacter = rawContent[startIndex];

  if (firstCharacter !== "{" && firstCharacter !== "[") {
    return null;
  }

  const closingCharacters = [];
  let inString = false;
  let isEscaped = false;

  closingCharacters.push(firstCharacter === "{" ? "}" : "]");

  for (let index = startIndex + 1; index < rawContent.length; index += 1) {
    const character = rawContent[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (character === "\\") {
        isEscaped = true;
        continue;
      }

      if (character === "\"") {
        inString = false;
      }

      continue;
    }

    if (character === "\"") {
      inString = true;
      continue;
    }

    if (character === "{") {
      closingCharacters.push("}");
      continue;
    }

    if (character === "[") {
      closingCharacters.push("]");
      continue;
    }

    if (character === "}" || character === "]") {
      if (character !== closingCharacters[closingCharacters.length - 1]) {
        return null;
      }

      closingCharacters.pop();

      if (!closingCharacters.length) {
        return rawContent.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function normalizeCatalogMinecraftVersionOptions(entries) {
  return mergeMinecraftVersionOptions(
    (Array.isArray(entries) ? entries : []).map((entry) => ({
      version: String(entry?.version || "").trim(),
      date: entry?.date || null,
      major: Boolean(entry?.major)
    }))
  );
}

function normalizeCatalogFabricLoaderOptions(entries) {
  const normalized = [];
  const seen = new Set();

  for (const entry of Array.isArray(entries) ? entries : []) {
    const version = String(entry?.version || "").trim();

    if (!version || seen.has(version)) {
      continue;
    }

    seen.add(version);
    normalized.push({
      version,
      stable: Boolean(entry?.stable)
    });
  }

  return normalized;
}

function normalizeCatalogCache(payload = null) {
  const nextMinecraftVersions = normalizeCatalogMinecraftVersionOptions(payload?.minecraftVersions);
  const nextFabricLoadersByVersion = {};
  const rawFabricLoadersByVersion =
    payload?.fabricLoadersByVersion && typeof payload.fabricLoadersByVersion === "object"
      ? payload.fabricLoadersByVersion
      : {};

  for (const [minecraftVersion, cachedEntry] of Object.entries(rawFabricLoadersByVersion)) {
    const normalizedVersion = String(minecraftVersion || "").trim();
    const loaders = normalizeCatalogFabricLoaderOptions(cachedEntry?.loaders);

    if (!normalizedVersion || !loaders.length) {
      continue;
    }

    nextFabricLoadersByVersion[normalizedVersion] = {
      distributionId:
        cachedEntry?.distributionId === fabricDistributions.legacyFabric.id
          ? fabricDistributions.legacyFabric.id
          : resolveFabricDistribution(normalizedVersion).id,
      loaders,
      updatedAt: cachedEntry?.updatedAt || null
    };
  }

  return {
    version: catalogCacheVersion,
    updatedAt: payload?.updatedAt || null,
    minecraftVersions: nextMinecraftVersions,
    fabricLoadersByVersion: nextFabricLoadersByVersion
  };
}

async function readCatalogCache(cachePath) {
  if (!cachePath) {
    return normalizeCatalogCache(null);
  }

  try {
    return normalizeCatalogCache(await readJson(cachePath, null));
  } catch {
    return normalizeCatalogCache(null);
  }
}

async function updateCatalogCache(cachePath, patch = {}) {
  if (!cachePath) {
    return normalizeCatalogCache(null);
  }

  return withFileMutationLock(cachePath, async () => {
    const currentCache = await readCatalogCache(cachePath);
    const nextCache = normalizeCatalogCache({
      ...currentCache,
      ...patch,
      updatedAt: new Date().toISOString(),
      fabricLoadersByVersion: {
        ...(currentCache.fabricLoadersByVersion || {}),
        ...((patch && patch.fabricLoadersByVersion) || {})
      }
    });

    await writeJson(cachePath, nextCache);
    return nextCache;
  });
}

function isLegacyFabricRuntimeProfile(runtimeProfile) {
  return runtimeProfile?.fabricDistribution === fabricDistributions.legacyFabric.id;
}

function parseMavenCoordinate(coordinate) {
  const [group, artifact, version, classifier = null] = String(coordinate || "").split(":");

  if (!group || !artifact || !version) {
    return null;
  }

  return {
    group,
    artifact,
    version,
    classifier
  };
}

function buildMavenLibraryDescriptor(library, baseUrl, classifier = null) {
  const parsed = parseMavenCoordinate(library?.name);

  if (!parsed || !baseUrl) {
    return null;
  }

  const fileName = `${parsed.artifact}-${parsed.version}${classifier ? `-${classifier}` : ""}.jar`;
  const pathSegments = [
    ...parsed.group.split("."),
    parsed.artifact,
    parsed.version,
    fileName
  ];
  const artifactPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");

  return {
    path: artifactPath,
    url: `${baseUrl}${artifactPath}`
  };
}

async function removeInvalidZipFile(targetPath) {
  if (!(await exists(targetPath))) {
    return;
  }

  const handle = await fs.open(targetPath, "r");

  try {
    const buffer = Buffer.alloc(4);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const isZipFile = bytesRead >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;

    if (!isZipFile) {
      await fs.rm(targetPath, { force: true });
    }
  } finally {
    await handle.close();
  }
}

function normalizeAuthState(rawState) {
  if (!rawState) {
    return {
      activeAccountId: null,
      accounts: []
    };
  }

  if (Array.isArray(rawState.accounts)) {
    const accounts = rawState.accounts.map((entry) => ({
      ...entry,
      account: {
        ...entry.account,
          avatarUrl: getAccountAvatarUrl(entry.account.name, entry.account.id)
      }
    }));

    return {
      activeAccountId: rawState.activeAccountId || accounts[0]?.account?.id || null,
      accounts
    };
  }

  if (rawState.refreshToken && rawState.account) {
    return {
      activeAccountId: rawState.account.id,
      accounts: [
        {
          refreshToken: rawState.refreshToken,
          account: {
            ...rawState.account,
            avatarUrl: getAccountAvatarUrl(rawState.account.name, rawState.account.id)
          },
          savedAt: rawState.savedAt || new Date().toISOString()
        }
      ]
    };
  }

  return {
    activeAccountId: null,
    accounts: []
  };
}

function sanitizeAuthState(authState) {
  return {
    activeAccountId: authState.activeAccountId,
    accounts: authState.accounts.map((entry) => ({
      account: entry.account,
      savedAt: entry.savedAt
    }))
  };
}

function buildStoredAccount(minecraftAccount, refreshToken) {
  return {
    refreshToken,
    account: {
      id: minecraftAccount.profile.id,
      name: minecraftAccount.profile.name,
      skinUrl: minecraftAccount.profile.skins?.[0]?.url || null
    },
    savedAt: new Date().toISOString()
  };
}

function withAccountAvatar(account) {
  if (!account) {
    return null;
  }

  return {
    ...account,
    avatarUrl: getAccountAvatarUrl(account.name, account.id)
  };
}

function normalizeMemory(memoryValue, fallbackValue) {
  const rawValue = String(memoryValue || fallbackValue || "").trim().toUpperCase();

  if (!rawValue) {
    return "2G";
  }

  if (/[MG]$/.test(rawValue)) {
    return rawValue;
  }

  return `${rawValue}G`;
}

function normalizeJavaGcProfile(gcProfile, fallbackValue = "auto") {
  const normalizedFallback = String(fallbackValue || "auto").trim().toLowerCase();
  const rawValue = String(gcProfile || normalizedFallback || "auto").trim().toLowerCase();

  if (rawValue === "g1" || rawValue === "zgc") {
    return rawValue;
  }

  return "auto";
}

function isJavaGcArg(argument) {
  const normalizedArgument = String(argument || "").trim();

  return [
    "-XX:+UnlockExperimentalVMOptions",
    "-XX:+UseG1GC",
    "-XX:+UseParallelGC",
    "-XX:+UseSerialGC",
    "-XX:+UseShenandoahGC",
    "-XX:+UseZGC",
    "-XX:+ZGenerational"
  ].includes(normalizedArgument);
}

function resolveJavaGcArgs(gcProfile) {
  switch (normalizeJavaGcProfile(gcProfile)) {
    case "g1":
      return ["-XX:+UseG1GC"];
    case "zgc":
      return ["-XX:+UseZGC", "-XX:+ZGenerational"];
    default:
      return [];
  }
}

function resolveBaseJavaArgs(manifest = null) {
  return (Array.isArray(manifest?.extraJavaArgs) ? manifest.extraJavaArgs : [])
    .map((argument) => String(argument || "").trim())
    .filter((argument) => argument && !isJavaGcArg(argument));
}

function resolveLauncherDownloadMaxSockets(manifest = null) {
  const requestedValue = Number(
    manifest?.launcherDownloadMaxSockets ||
      manifest?.launcher?.downloadMaxSockets ||
      manifest?.downloadMaxSockets
  );

  if (Number.isFinite(requestedValue) && requestedValue >= 2) {
    return Math.max(2, Math.min(48, Math.round(requestedValue)));
  }

  return defaultLauncherDownloadMaxSockets;
}

function resolveManagedContentDownloadConcurrency(manifest = null) {
  const requestedValue = Number(
    manifest?.managedContentDownloadConcurrency ||
      manifest?.launcher?.managedContentDownloadConcurrency
  );

  if (Number.isFinite(requestedValue) && requestedValue >= 1) {
    return Math.max(1, Math.min(12, Math.round(requestedValue)));
  }

  return defaultManagedContentDownloadConcurrency;
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

function toModrinthProjectUrl(project) {
  const projectType = project?.project_type || "mod";
  const projectReference = project?.slug || project?.id;

  if (!projectReference) {
    return null;
  }

  return `https://modrinth.com/${projectType}/${projectReference}`;
}

function asPercent(current, total) {
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  return Math.round((current / total) * 100);
}

function resolveMetaPaths(userDataPath) {
  return {
    settingsPath: path.join(userDataPath, "launcher-settings.json")
  };
}

function getManagedJavaSupportError() {
  if (!isWindows) {
    return "Die verwaltete Java-Runtime wird aktuell nur unter Windows unterstützt.";
  }

  if (!managedJavaArchitecture) {
    return `Die verwaltete Java-Runtime unterstützt aktuell keine ${process.arch}-Builds.`;
  }

  return null;
}

function resolveManagedJavaPaths(dataDirectory, majorVersion) {
  const javaBaseDirectory = path.join(dataDirectory, "java");
  const runtimeDirectory = path.join(javaBaseDirectory, `temurin-${majorVersion}`);
  const javaCommand = path.join(runtimeDirectory, "bin", isWindows ? "java.exe" : "java");
  const javawCommand = path.join(runtimeDirectory, "bin", isWindows ? "javaw.exe" : "java");

  return {
    baseDirectory: javaBaseDirectory,
    runtimeDirectory,
    metadataPath: path.join(runtimeDirectory, ".boocord-java.json"),
    javaCommand,
    launchCommand: isWindows ? javawCommand : javaCommand
  };
}

function normalizeComparablePath(targetPath) {
  const normalizedPath = path.resolve(String(targetPath || "").trim());
  return isWindows ? normalizedPath.toLowerCase() : normalizedPath;
}

function isFilePathCommand(command) {
  const normalizedCommand = String(command || "").trim();

  return (
    Boolean(normalizedCommand) &&
    (path.isAbsolute(normalizedCommand) || normalizedCommand.includes("\\") || normalizedCommand.includes("/"))
  );
}

function appendJavaCandidate(candidates, seenCandidates, command, source) {
  const normalizedCommand = String(command || "").trim();

  if (!normalizedCommand) {
    return;
  }

  const dedupeKey = isFilePathCommand(normalizedCommand)
    ? normalizeComparablePath(normalizedCommand)
    : normalizedCommand.toLowerCase();

  if (seenCandidates.has(dedupeKey)) {
    return;
  }

  seenCandidates.add(dedupeKey);
  candidates.push({
    command: normalizedCommand,
    source
  });
}

function toPowerShellLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function normalizeProjectReferenceValue(value) {
  return String(value || "").trim().toLowerCase();
}

function toLocalProjectReference(localFileName, projectType = "mod") {
  const normalizedFileName = path.basename(String(localFileName || "").trim()).toLowerCase();
  return `local:${projectType}:${normalizedFileName}`;
}

function getSelectedProjectReferenceKeys(entry, fallbackProjectType = null) {
  const normalized = sanitizeSelectedProjectEntry(entry, fallbackProjectType);

  if (!normalized) {
    return new Set();
  }

  const keys = new Set();

  for (const value of [normalized.projectId, normalized.slug]) {
    const normalizedValue = normalizeProjectReferenceValue(value);

    if (normalizedValue) {
      keys.add(normalizedValue);
    }
  }

  return keys;
}

function projectEntriesShareIdentity(leftEntry, rightEntry, fallbackProjectType = null) {
  const leftKeys = getSelectedProjectReferenceKeys(leftEntry, fallbackProjectType);
  const rightKeys = getSelectedProjectReferenceKeys(rightEntry, fallbackProjectType);

  for (const key of leftKeys) {
    if (rightKeys.has(key)) {
      return true;
    }
  }

  return false;
}

function projectEntryMatchesReference(entry, projectReference, fallbackProjectType = null) {
  const entryKeys = getSelectedProjectReferenceKeys(entry, fallbackProjectType);
  const referenceKeys = getSelectedProjectReferenceKeys(projectReference, fallbackProjectType);

  if (!referenceKeys.size && typeof projectReference !== "object") {
    const fallbackReference = normalizeProjectReferenceValue(projectReference);

    return fallbackReference ? entryKeys.has(fallbackReference) : false;
  }

  for (const key of referenceKeys) {
    if (entryKeys.has(key)) {
      return true;
    }
  }

  return false;
}

function defaultSelectedProjects(manifest, projectType = "mod") {
  const config = getModdingContentConfig(projectType);
  const manifestEntries = [...(manifest[config.defaultManifestKey] || [])];

  if (projectType === "mod") {
    manifestEntries.push(...(manifest.optionalDefaultMods || []));
  }

  return [...new Set(manifestEntries.map((projectReference) => String(projectReference).trim()).filter(Boolean))]
    .map((projectId) => ({
      projectId,
      manualSelection: true
    }));
}

function normalizeSelectedProjectLocalImportFileNames(fileNames = []) {
  const normalizedEntries = new Map();

  for (const entry of fileNames || []) {
    const normalizedEntry = path.basename(String(entry || "").trim());

    if (!normalizedEntry) {
      continue;
    }

    normalizedEntries.set(normalizedEntry.toLowerCase(), normalizedEntry);
  }

  return [...normalizedEntries.values()].sort((left, right) =>
    left.localeCompare(right, "de", { sensitivity: "base" })
  );
}

function removeSelectedProjectLocalImportFileNames(entry, removedFileNames = [], fallbackProjectType = null) {
  const normalized = sanitizeSelectedProjectEntry(entry, fallbackProjectType);

  if (!normalized) {
    return null;
  }

  const removedFileNameKeys = new Set(
    (removedFileNames || [])
      .map((value) => path.basename(String(value || "").trim()).toLowerCase())
      .filter(Boolean)
  );

  if (!removedFileNameKeys.size) {
    return normalized;
  }

  const remainingTrackedFileNames = normalizeSelectedProjectLocalImportFileNames([
    normalized.localFileName,
    ...(normalized.localImportFileNames || [])
  ].filter((value) => !removedFileNameKeys.has(path.basename(String(value || "").trim()).toLowerCase())));

  if ((normalized.isLocalOnly || isLocalProjectReference(normalized.projectId)) && !remainingTrackedFileNames.length) {
    return null;
  }

  return {
    ...normalized,
    localFileName: remainingTrackedFileNames[0] || null,
    localImportFileNames: remainingTrackedFileNames
  };
}

function sanitizeSelectedProjectEntry(entry, fallbackProjectType = null) {
  if (!entry) {
    return null;
  }

  if (typeof entry === "string") {
    return {
      projectId: entry
    };
  }

  const projectId = String(entry.projectId || entry.id || entry.slug || "").trim();

  if (!projectId) {
    return null;
  }

  const localImportFileNames = normalizeSelectedProjectLocalImportFileNames(
    entry.localImportFileNames ||
      (entry.localImportFileName ? [entry.localImportFileName] : [])
  );
  const localFileName = path.basename(String(entry.localFileName || localImportFileNames[0] || "").trim()) || null;

  return {
    projectId,
    slug: entry.slug || null,
    title: entry.title || entry.name || null,
    description: entry.description || null,
    iconUrl: entry.iconUrl || entry.icon_url || null,
    projectType: entry.projectType || entry.project_type || fallbackProjectType || null,
    clientSide: entry.clientSide || entry.client_side || null,
    serverSide: entry.serverSide || entry.server_side || null,
    versionId: entry.versionId || entry.version_id || null,
    versionNumber: entry.versionNumber || entry.version_number || null,
    versionName: entry.versionName || entry.version_name || null,
    versionType: entry.versionType || entry.version_type || null,
    versionLocked: entry.versionLocked === true || entry.version_locked === true,
    manualSelection: entry.manualSelection === true,
    isLocalOnly: Boolean(entry.isLocalOnly || isLocalProjectReference(projectId)),
    localFileName,
    localImportFileNames,
    linkedProjectId: entry.linkedProjectId || null,
    linkedProjectSlug: entry.linkedProjectSlug || null,
    linkedProjectUrl: entry.linkedProjectUrl || null
  };
}

function mergeSelectedProjectEntries(previousEntry, nextEntry, fallbackProjectType = null) {
  const normalizedPrevious = sanitizeSelectedProjectEntry(previousEntry, fallbackProjectType);
  const normalizedNext = sanitizeSelectedProjectEntry(nextEntry, fallbackProjectType);

  if (!normalizedPrevious) {
    return normalizedNext;
  }

  if (!normalizedNext) {
    return normalizedPrevious;
  }

  return {
    ...normalizedPrevious,
    ...normalizedNext,
    manualSelection: Boolean(normalizedPrevious.manualSelection || normalizedNext.manualSelection),
    versionLocked: normalizedNext.versionLocked === true,
    isLocalOnly: Boolean(normalizedPrevious.isLocalOnly || normalizedNext.isLocalOnly),
    localFileName: normalizedNext.localFileName || normalizedPrevious.localFileName || null,
    linkedProjectId: normalizedNext.linkedProjectId || normalizedPrevious.linkedProjectId || null,
    linkedProjectSlug: normalizedNext.linkedProjectSlug || normalizedPrevious.linkedProjectSlug || null,
    linkedProjectUrl: normalizedNext.linkedProjectUrl || normalizedPrevious.linkedProjectUrl || null,
    localImportFileNames: normalizeSelectedProjectLocalImportFileNames([
      ...(normalizedPrevious.localImportFileNames || []),
      ...(normalizedNext.localImportFileNames || [])
    ])
  };
}

function dedupeSelectedProjects(selectedProjects, fallbackProjectType = null) {
  const unique = [];

  for (const entry of selectedProjects || []) {
    const normalized = sanitizeSelectedProjectEntry(entry, fallbackProjectType);

    if (!normalized) {
      continue;
    }

    let matchedIndex = -1;

    for (let index = 0; index < unique.length; index += 1) {
      if (projectEntriesShareIdentity(unique[index], normalized, fallbackProjectType)) {
        matchedIndex = index;
        break;
      }
    }

    if (matchedIndex === -1) {
      unique.push(normalized);
      continue;
    }

    unique[matchedIndex] = mergeSelectedProjectEntries(unique[matchedIndex], normalized, fallbackProjectType);

    for (let index = unique.length - 1; index >= 0; index -= 1) {
      if (index === matchedIndex) {
        continue;
      }

      if (projectEntriesShareIdentity(unique[matchedIndex], unique[index], fallbackProjectType)) {
        unique[matchedIndex] = mergeSelectedProjectEntries(
          unique[matchedIndex],
          unique[index],
          fallbackProjectType
        );
        unique.splice(index, 1);
      }
    }
  }

  return unique;
}

function applyPersistentSelectionMetadata(selectedProjects, manifest, projectType = "mod") {
  const persistentProjectKeys = new Set();

  for (const entry of defaultSelectedProjects(manifest, projectType)) {
    for (const key of getSelectedProjectReferenceKeys(entry, projectType)) {
      persistentProjectKeys.add(key);
    }
  }

  return dedupeSelectedProjects(
    (selectedProjects || []).map((entry) => {
      const normalized = sanitizeSelectedProjectEntry(entry, projectType);

      if (!normalized) {
        return null;
      }

      const selectionKeys = getSelectedProjectReferenceKeys(normalized, projectType);
      let isPersistent = false;

      for (const key of selectionKeys) {
        if (persistentProjectKeys.has(key)) {
          isPersistent = true;
          break;
        }
      }

      if (!isPersistent) {
        return normalized;
      }

      return {
        ...normalized,
        manualSelection: true
      };
    }).filter(Boolean),
    projectType
  );
}

function normalizeProjectIds(selectedProjects) {
  return dedupeSelectedProjects(selectedProjects)
    .map((entry) => `${entry.slug || entry.projectId}@${entry.versionId || ""}`)
    .sort((left, right) => left.localeCompare(right));
}

function sameSelectedProjects(left, right) {
  const leftIds = normalizeProjectIds(left);
  const rightIds = normalizeProjectIds(right);

  if (leftIds.length !== rightIds.length) {
    return false;
  }

  return leftIds.every((projectId, index) => projectId === rightIds[index]);
}

function applyVersionMetadataToSelectedProject(entry, version) {
  const normalized = sanitizeSelectedProjectEntry(entry, entry?.projectType || null);

  if (!normalized || !version) {
    return normalized;
  }

  return {
    ...normalized,
    versionId: version.id || normalized.versionId || null,
    versionNumber: version.version_number || version.versionNumber || normalized.versionNumber || null,
    versionName: version.name || normalized.versionName || null,
    versionType: version.version_type || version.versionType || normalized.versionType || null,
    versionLocked: normalized.versionLocked === true
  };
}

function isDefaultSelectedProjectEntry(entry, manifest, projectType = "mod") {
  const entryKeys = getSelectedProjectReferenceKeys(entry, projectType);

  if (!entryKeys.size) {
    return false;
  }

  for (const defaultEntry of defaultSelectedProjects(manifest, projectType)) {
    const defaultKeys = getSelectedProjectReferenceKeys(defaultEntry, projectType);

    for (const key of entryKeys) {
      if (defaultKeys.has(key)) {
        return true;
      }
    }
  }

  return false;
}

function getResolvedProjectVersionCompatibilityError(version, projectType, minecraftVersion, loader = null) {
  if (!version) {
    return null;
  }

  const versionLabel = version.name || version.version_number || version.id || "Unbekannte Version";
  const gameVersions = Array.isArray(version.game_versions) ? version.game_versions : [];
  const loaders = Array.isArray(version.loaders) ? version.loaders : [];

  if (minecraftVersion && gameVersions.length && !gameVersions.includes(minecraftVersion)) {
    return `${versionLabel} ist nicht mit Minecraft ${minecraftVersion} kompatibel. Bitte wähle eine passende Version aus.`;
  }

  if (projectType === "mod" && loader && loaders.length && !loaders.includes(loader)) {
    return `${versionLabel} ist nicht mit ${loader} kompatibel. Bitte wähle eine passende Version aus.`;
  }

  return null;
}

function validateResolvedProjectVersion(version, projectType, minecraftVersion, loader = null) {
  const errorMessage = getResolvedProjectVersionCompatibilityError(version, projectType, minecraftVersion, loader);

  if (errorMessage) {
    throw new Error(errorMessage);
  }
}

async function resolveCompatibleProjectVersion(
  entry,
  projectType,
  minecraftVersion,
  { resolveExistingPins = false, refreshCompatiblePins = false } = {}
) {
  const config = getModdingContentConfig(projectType);
  const versionId = String(entry?.versionId || "").trim();
  const loader = projectType === "mod" ? config.loader : null;

  if (versionId && !resolveExistingPins) {
    return null;
  }

  if (versionId && !refreshCompatiblePins) {
    const pinnedVersion = await getVersionById(versionId);

    if (!getResolvedProjectVersionCompatibilityError(pinnedVersion, projectType, minecraftVersion, loader)) {
      return pinnedVersion;
    }
  }

  const compatibleVersion = await getLatestProjectVersion(entry.projectId, {
    loader,
    minecraftVersion,
    projectLabel: entry.title || entry.slug || entry.projectId
  });

  validateResolvedProjectVersion(compatibleVersion, projectType, minecraftVersion, loader);
  return compatibleVersion;
}

async function resolvePinnedProjectEntries(
  selectedProjects,
  projectType,
  minecraftVersion,
  { resolveExistingPins = false, refreshDefaultPins = false, manifest = null } = {}
) {
  const selectedEntries = await resolveLaunchableProjectReferences(selectedProjects, projectType);
  const pinnedEntries = [];

  for (const entry of selectedEntries) {
    const versionId = String(entry?.versionId || "").trim();
    const shouldRefreshCompatiblePin =
      refreshDefaultPins &&
      projectType === "mod" &&
      entry?.versionLocked !== true &&
      manifest &&
      isDefaultSelectedProjectEntry(entry, manifest, projectType);

    if (versionId && !resolveExistingPins) {
      pinnedEntries.push(sanitizeSelectedProjectEntry(entry, projectType));
      continue;
    }

    const version = await resolveCompatibleProjectVersion(entry, projectType, minecraftVersion, {
      resolveExistingPins,
      refreshCompatiblePins: shouldRefreshCompatiblePin
    });

    pinnedEntries.push(applyVersionMetadataToSelectedProject(entry, version));
  }

  return pinnedEntries;
}

async function pinManagedProjectSelections(settings, manifest, runtimeProfile) {
  const nextSettings = mergeSettings(settings, {}, manifest, settings?.dataDirectory || "");
  const selectedMods = await resolvePinnedProjectEntries(
    nextSettings.modding.selectedMods,
    "mod",
    runtimeProfile.minecraftVersion,
    {
      resolveExistingPins: true,
      refreshDefaultPins: true,
      manifest
    }
  );

  return mergeSettings(
    nextSettings,
    {
      modding: {
        selectedMods: mergeProjectCollections(
          selectedMods,
          dedupeSelectedProjects(nextSettings.modding.selectedMods || [], "mod").filter((entry) =>
            entry?.isLocalOnly || isLocalProjectReference(entry?.projectId)
          )
        ),
        selectedResourcePacks: dedupeSelectedProjects(
          nextSettings.modding.selectedResourcePacks || [],
          "resourcepack"
        ),
        selectedShaderPacks: dedupeSelectedProjects(nextSettings.modding.selectedShaderPacks || [], "shader")
      }
    },
    manifest,
    settings?.dataDirectory || ""
  );
}

function normalizeModSelectionsForMinecraftVersion(settings, manifest) {
  const minecraftVersion = settings?.modding?.minecraftVersion || manifest.minecraftVersion;

  if (!isLegacyFabricMinecraftVersion(minecraftVersion)) {
    return settings;
  }

  const defaultMods = defaultSelectedProjects(manifest, "mod");

  if (!sameSelectedProjects(settings?.modding?.selectedMods || [], defaultMods)) {
    return settings;
  }

  return {
    ...settings,
    modding: {
      ...settings.modding,
      selectedMods: []
    }
  };
}

function buildDefaultSettings(userDataPath, manifest) {
  return {
    dataDirectory: path.join(userDataPath, "game-data"),
    javaPath: null,
    launcherBackgroundFileName: null,
    language: "de",
    languagePromptVersion: 0,
    openLogsOnLaunch: false,
    minimizeOnLaunch: false,
    memory: {
      min: manifest.memory.min,
      max: manifest.memory.max
    },
    runtime: {
      gcProfile: "auto"
    },
    modding: {
      minecraftVersion: manifest.minecraftVersion,
      loader: "fabric",
      fabricLoaderVersion: null,
      selectedMods: defaultSelectedProjects(manifest, "mod"),
      selectedResourcePacks: defaultSelectedProjects(manifest, "resourcepack"),
      selectedShaderPacks: defaultSelectedProjects(manifest, "shader")
    }
  };
}

function normalizeLanguage(value, fallback = "de") {
  const normalized = String(value || "").trim().toLowerCase();
  return ["de", "en"].includes(normalized) ? normalized : fallback;
}

function resolveStoredSelectedProjects(baseSettings, defaults, manifest, selectionKey, projectType) {
  if (
    baseSettings?.modding &&
    Object.prototype.hasOwnProperty.call(baseSettings.modding, selectionKey)
  ) {
    return applyPersistentSelectionMetadata(baseSettings.modding[selectionKey] || [], manifest, projectType);
  }

  return applyPersistentSelectionMetadata(defaults.modding[selectionKey] || [], manifest, projectType);
}

function mergeSettings(baseSettings, options = {}, manifest, userDataPath) {
  const defaults = buildDefaultSettings(userDataPath, manifest);
  const nextSelectedMods =
    options.modding && Object.prototype.hasOwnProperty.call(options.modding, "selectedMods")
      ? applyPersistentSelectionMetadata(options.modding.selectedMods || [], manifest, "mod")
      : resolveStoredSelectedProjects(baseSettings, defaults, manifest, "selectedMods", "mod");
  const nextSelectedResourcePacks =
    options.modding && Object.prototype.hasOwnProperty.call(options.modding, "selectedResourcePacks")
      ? applyPersistentSelectionMetadata(options.modding.selectedResourcePacks || [], manifest, "resourcepack")
      : resolveStoredSelectedProjects(
          baseSettings,
          defaults,
          manifest,
          "selectedResourcePacks",
          "resourcepack"
        );
  const nextSelectedShaderPacks =
    options.modding && Object.prototype.hasOwnProperty.call(options.modding, "selectedShaderPacks")
      ? applyPersistentSelectionMetadata(options.modding.selectedShaderPacks || [], manifest, "shader")
      : resolveStoredSelectedProjects(baseSettings, defaults, manifest, "selectedShaderPacks", "shader");

  return normalizeModSelectionsForMinecraftVersion({
    ...defaults,
    ...(baseSettings || {}),
    ...(options || {}),
    language: normalizeLanguage(options.language, normalizeLanguage(baseSettings?.language, defaults.language)),
    languagePromptVersion: Number.isInteger(Number(options.languagePromptVersion))
      ? Number(options.languagePromptVersion)
      : Number.isInteger(Number(baseSettings?.languagePromptVersion))
        ? Number(baseSettings.languagePromptVersion)
        : defaults.languagePromptVersion,
    memory: {
      ...defaults.memory,
      ...(baseSettings?.memory || {}),
      ...(options.memory || {})
    },
    runtime: {
      ...defaults.runtime,
      ...(baseSettings?.runtime || {}),
      ...(options.runtime || {}),
      gcProfile: normalizeJavaGcProfile(
        options?.runtime?.gcProfile,
        baseSettings?.runtime?.gcProfile || defaults.runtime.gcProfile
      )
    },
    modding: {
      ...defaults.modding,
      ...(baseSettings?.modding || {}),
      ...(options.modding || {}),
      loader: "fabric",
      selectedMods: nextSelectedMods,
      selectedResourcePacks: nextSelectedResourcePacks,
      selectedShaderPacks: nextSelectedShaderPacks
    }
  }, manifest);
}

async function readSettings(userDataPath, _fallbackMinecraftDirectory, manifest) {
  const metaPaths = resolveMetaPaths(userDataPath);
  const stored = (await readJson(metaPaths.settingsPath, {})) || {};
  const storedModding = stored?.modding || {};
  const hasStoredSelections = ["selectedMods", "selectedResourcePacks", "selectedShaderPacks"].some((key) =>
    Object.prototype.hasOwnProperty.call(storedModding, key)
  );

  if (hasStoredSelections) {
    return mergeSettings({}, stored, manifest, userDataPath);
  }

  return mergeSettings(
    {},
    {
      ...stored,
      modding: {
        ...storedModding,
        selectedMods: defaultSelectedProjects(manifest, "mod"),
        selectedResourcePacks: defaultSelectedProjects(manifest, "resourcepack"),
        selectedShaderPacks: defaultSelectedProjects(manifest, "shader")
      }
    },
    manifest,
    userDataPath
  );
}

async function writeSettings(userDataPath, settings) {
  const metaPaths = resolveMetaPaths(userDataPath);
  const payload = {
    ...settings,
    modding: {
      ...settings.modding,
      loader: "fabric",
      selectedMods: dedupeSelectedProjects(settings.modding?.selectedMods || [], "mod"),
      selectedResourcePacks: dedupeSelectedProjects(
        settings.modding?.selectedResourcePacks || [],
        "resourcepack"
      ),
      selectedShaderPacks: dedupeSelectedProjects(settings.modding?.selectedShaderPacks || [], "shader")
    }
  };
  await writeJson(metaPaths.settingsPath, payload);
}

function resolvePaths(dataDirectory, manifest, authStatePath = null) {
  return {
    dataDirectory,
    javaDirectory: path.join(dataDirectory, "java"),
    runtimeDirectory: path.join(dataDirectory, manifest.runtimeDirectory),
    instanceDirectory: path.join(dataDirectory, manifest.instanceDirectory),
    authStatePath: authStatePath || path.join(dataDirectory, "account-session.json"),
    installStatePath: path.join(dataDirectory, "installation-state.json"),
    managedModsStatePath: path.join(
      dataDirectory,
      manifest.instanceDirectory,
      ".boocord-managed-mods.json"
    ),
    managedResourcePacksStatePath: path.join(
      dataDirectory,
      manifest.instanceDirectory,
      ".boocord-managed-resource-packs.json"
    ),
    managedShaderPacksStatePath: path.join(
      dataDirectory,
      manifest.instanceDirectory,
      ".boocord-managed-shader-packs.json"
    ),
    managedModsOwnershipStatePath: path.join(
      dataDirectory,
      manifest.instanceDirectory,
      ".boocord-managed-mod-ownership.json"
    ),
    managedResourcePacksOwnershipStatePath: path.join(
      dataDirectory,
      manifest.instanceDirectory,
      ".boocord-managed-resource-pack-ownership.json"
    ),
    managedShaderPacksOwnershipStatePath: path.join(
      dataDirectory,
      manifest.instanceDirectory,
      ".boocord-managed-shader-pack-ownership.json"
    ),
    importedProjectMetadataCachePath: path.join(
      dataDirectory,
      manifest.instanceDirectory,
      ".boocord-imported-project-metadata.json"
    ),
    catalogCachePath: path.join(dataDirectory, ".boocord-catalog-cache.json"),
    launcherProfilesPath: path.join(dataDirectory, manifest.runtimeDirectory, "launcher_profiles.json")
  };
}

async function checksumFile(targetPath, algorithm = "sha256") {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = createReadStream(targetPath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function extractZipArchive(archivePath, destinationPath, emitEvent) {
  await ensureDirectory(destinationPath);
  emit(emitEvent, "status", "Java wird entpackt...");
  await runCommand(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `Expand-Archive -LiteralPath ${toPowerShellLiteral(archivePath)} -DestinationPath ${toPowerShellLiteral(destinationPath)} -Force`
    ],
    emitEvent
  );
}

async function moveDirectoryContents(sourceDirectory, destinationDirectory) {
  await ensureDirectory(destinationDirectory);
  const entries = await fs.readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const destinationPath = path.join(destinationDirectory, entry.name);
    await fs.rename(sourcePath, destinationPath);
  }
}

async function applyManagedJavaSettings(settings, runtimeProfile) {
  if (!runtimeProfile?.requiredJavaVersion) {
    return settings;
  }

  const managedJavaPaths = resolveManagedJavaPaths(
    settings.dataDirectory,
    runtimeProfile.requiredJavaVersion
  );

  return {
    ...settings,
    javaPath: managedJavaPaths.launchCommand
  };
}

async function ensureFabricProfileFile(runtimeDirectory) {
  const profilesPath = path.join(runtimeDirectory, "launcher_profiles.json");

  if (!(await exists(profilesPath))) {
    await writeJson(profilesPath, {
      profiles: {},
      settings: {},
      version: 3
    });
  }

  return profilesPath;
}

function safeDirectoryExists(targetPath) {
  try {
    return Boolean(targetPath) && statSync(targetPath).isDirectory();
  } catch {
    return false;
  }
}

function resolveSharedMinecraftCacheRoot(dataDirectory, fallbackMinecraftDirectory) {
  const normalizedFallbackDirectory = String(fallbackMinecraftDirectory || "").trim();

  if (normalizedFallbackDirectory) {
    const resolvedFallbackDirectory = path.resolve(normalizedFallbackDirectory);

    if (safeDirectoryExists(resolvedFallbackDirectory)) {
      return resolvedFallbackDirectory;
    }
  }

  return path.join(dataDirectory, ".minecraft-cache");
}

function resolveSharedMinecraftCachePaths(dataDirectory, fallbackMinecraftDirectory) {
  const root = resolveSharedMinecraftCacheRoot(dataDirectory, fallbackMinecraftDirectory);

  return {
    root,
    assets: path.join(root, "assets"),
    libraries: path.join(root, "libraries"),
    cache: path.join(root, "cache")
  };
}

function finalizeLauncherOptions(options) {
  const overrides = options?.overrides || {};

  return {
    ...options,
    root: path.resolve(options.root),
    overrides: {
      detached: true,
      ...overrides,
      url: {
        meta: "https://launchermeta.mojang.com",
        resource: "https://resources.download.minecraft.net",
        mavenForge: "https://files.minecraftforge.net/maven/",
        defaultRepoForge: "https://libraries.minecraft.net/",
        fallbackMaven: "https://search.maven.org/remotecontent?filepath=",
        ...(overrides.url || {})
      },
      fw: {
        baseUrl: "https://github.com/ZekerZhayard/ForgeWrapper/releases/download/",
        version: "1.6.0",
        sh1: "035a51fe6439792a61507630d89382f621da0f1f",
        size: 28679,
        ...(overrides.fw || {})
      }
    }
  };
}

function buildLaunchOptions({
  authorization,
  fallbackMinecraftDirectory = null,
  installState,
  javaRuntime,
  launchTarget = null,
  manifest,
  paths,
  runtimeProfile,
  settings,
  detached = false
}) {
  const quickPlayTarget = normalizeLaunchTarget(launchTarget);
  const sharedMinecraftCache = resolveSharedMinecraftCachePaths(
    settings.dataDirectory,
    fallbackMinecraftDirectory
  );
  const baseJavaArgs = resolveBaseJavaArgs(manifest);
  const gcArgs = resolveJavaGcArgs(settings?.runtime?.gcProfile);

  return finalizeLauncherOptions({
    authorization,
    root: paths.runtimeDirectory,
    cache: sharedMinecraftCache.cache,
    javaPath: javaRuntime.launchCommand,
    memory: {
      min: normalizeMemory(settings.memory.min, manifest.memory.min),
      max: normalizeMemory(settings.memory.max, manifest.memory.max)
    },
    version: {
      number: runtimeProfile.minecraftVersion,
      type: "release",
      custom: installState.fabricVersionId
    },
    customArgs: [...baseJavaArgs, ...gcArgs],
    ...(quickPlayTarget
      ? {
          quickPlay: quickPlayTarget
        }
      : {}),
    overrides: {
      assetRoot: sharedMinecraftCache.assets,
      gameDirectory: paths.instanceDirectory,
      detached,
      libraryRoot: sharedMinecraftCache.libraries,
      maxSockets: resolveLauncherDownloadMaxSockets(manifest)
    }
  });
}

function normalizeLaunchTarget(rawTarget) {
  if (!rawTarget || typeof rawTarget !== "object") {
    return null;
  }

  const type = String(rawTarget.type || "").trim().toLowerCase();
  const identifier = String(rawTarget.identifier || "").trim();
  const pathValue = String(rawTarget.path || "").trim();

  if (!identifier || !["singleplayer", "multiplayer", "realms", "legacy"].includes(type)) {
    return null;
  }

  return {
    type,
    identifier,
    ...(pathValue ? { path: pathValue } : {})
  };
}

function createPrewarmAuthorizationStub() {
  return {
    access_token: "boocord-prewarm",
    client_token: "boocord-prewarm",
    uuid: "00000000000000000000000000000000",
    name: "Boocord",
    user_properties: "{}",
    meta: {
      type: "msa"
    }
  };
}

async function readCustomVersionJson(runtimeDirectory, customVersionId) {
  if (!customVersionId) {
    return null;
  }

  return readJson(
    path.join(runtimeDirectory, "versions", customVersionId, `${customVersionId}.json`),
    null
  );
}

async function normalizeLegacyFabricVersionJson(runtimeDirectory, runtimeProfile) {
  if (!isLegacyFabricRuntimeProfile(runtimeProfile)) {
    return null;
  }

  const versionId = `fabric-loader-${runtimeProfile.fabricLoaderVersion}-${runtimeProfile.minecraftVersion}`;
  const versionJsonPath = path.join(runtimeDirectory, "versions", versionId, `${versionId}.json`);
  const versionJson = await readJson(versionJsonPath, null);

  if (!versionJson || !Array.isArray(versionJson.libraries)) {
    return null;
  }

  let changed = false;
  const normalizedLibraries = versionJson.libraries.map((library) => {
    const baseUrl = String(library?.url || "").trim();

    if (!baseUrl || !/^https:\/\/maven\.legacyfabric\.net\/?$/i.test(baseUrl)) {
      return library;
    }

    const downloads = {
      ...(library.downloads || {})
    };

    if (!library.natives) {
      if (!downloads.artifact) {
        const artifact = buildMavenLibraryDescriptor(library, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

        if (artifact) {
          downloads.artifact = artifact;
          changed = true;
        }
      }

      return downloads.artifact
        ? {
            ...library,
            downloads
          }
        : library;
    }

    const classifiers = {
      ...(downloads.classifiers || {})
    };

    for (const [osKey, classifier] of Object.entries(library.natives || {})) {
      if (!classifiers[classifier]) {
        const descriptor = buildMavenLibraryDescriptor(
          library,
          baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
          classifier
        );

        if (descriptor) {
          classifiers[classifier] = descriptor;
          changed = true;
        }
      }
    }

    const preferredClassifier =
      process.platform === "win32"
        ? library.natives.windows
        : process.platform === "darwin"
          ? library.natives.osx
          : library.natives.linux;

    if (preferredClassifier && !downloads.artifact && classifiers[preferredClassifier]) {
      downloads.artifact = classifiers[preferredClassifier];
      changed = true;
    }

    return {
      ...library,
      downloads: {
        ...downloads,
        classifiers
      }
    };
  });

  if (!changed) {
    return versionJson;
  }

  const normalizedVersionJson = {
    ...versionJson,
    libraries: normalizedLibraries
  };

  await writeJson(versionJsonPath, normalizedVersionJson);

  for (const library of normalizedLibraries) {
    const artifactPath = library?.downloads?.artifact?.path;

    if (!artifactPath) {
      continue;
    }

    await removeInvalidZipFile(path.join(runtimeDirectory, "libraries", artifactPath));
  }

  return normalizedVersionJson;
}

async function prewarmMinecraftRuntime({
  emit: emitEvent,
  fallbackMinecraftDirectory = null,
  installState,
  javaRuntime,
  manifest,
  paths,
  runtimeProfile,
  settings
}) {
  await normalizeLegacyFabricVersionJson(paths.runtimeDirectory, runtimeProfile);

  const launchOptions = buildLaunchOptions({
    authorization: createPrewarmAuthorizationStub(),
    fallbackMinecraftDirectory,
    installState,
    javaRuntime,
    manifest,
    paths,
    runtimeProfile,
    settings,
    detached: false
  });
  const launcher = new Client();

  launcher.options = launchOptions;
  launcher.handler = new LauncherCoreHandler(launcher);
  const javaCheck = await launcher.handler.checkJava(launchOptions.javaPath || "java");

  if (!javaCheck?.run) {
    throw new Error("Minecraft-Dateien konnten nicht vorbereitet werden, weil Java nicht gestartet werden konnte.");
  }

  emit(
    emitEvent,
    "status",
    `Optimiere Minecraft-Downloads mit ${launchOptions.overrides.maxSockets} parallelen Verbindungen...`
  );

  await ensureDirectory(launchOptions.root);
  await ensureDirectory(launchOptions.cache);
  await ensureDirectory(launchOptions.overrides.assetRoot);
  await ensureDirectory(launchOptions.overrides.libraryRoot);
  await ensureDirectory(paths.instanceDirectory);

  const customVersionId = installState.fabricVersionId;
  const versionDirectory = path.join(
    launchOptions.root,
    "versions",
    customVersionId || runtimeProfile.minecraftVersion
  );
  const versionJsonPath = path.join(versionDirectory, `${runtimeProfile.minecraftVersion}.json`);

  launchOptions.directory = versionDirectory;
  await ensureDirectory(versionDirectory);

  const versionFile = await launcher.handler.getVersion();
  const mcPath = customVersionId
    ? path.join(versionDirectory, `${customVersionId}.jar`)
    : path.join(versionDirectory, `${runtimeProfile.minecraftVersion}.jar`);

  launchOptions.mcPath = mcPath;
  await launcher.handler.getNatives();

  if (!(await exists(mcPath))) {
    emit(emitEvent, "status", "Lade die Minecraft-Basisdateien vorab...");
    await launcher.handler.getJar();
  }

  if (!(await exists(versionJsonPath))) {
    await writeJson(versionJsonPath, versionFile);
  }

  const customVersionJson = await readCustomVersionJson(launchOptions.root, customVersionId);

  emit(emitEvent, "status", "Lade Libraries und Assets vorab...");
  await launcher.handler.getClasses(customVersionJson);
  await launcher.handler.getAssets();
}

async function requestJson(url, requestOptions = {}) {
  return withRequestRetry(async () => {
    const { headers = {}, timeoutMs = defaultRequestTimeoutMs, ...fetchOptions } = requestOptions || {};
    const response = await fetchWithTimeout(url, {
      ...fetchOptions,
      headers: {
        "User-Agent": "boocord-client-launcher/1.0",
        ...headers
      }
    }, timeoutMs);

    if (!response.ok) {
      const error = new Error(`Request fehlgeschlagen: ${response.status} ${response.statusText}`);
      error.statusCode = response.status;
      throw error;
    }

    const payload = await response.text();

    if (!payload.trim()) {
      const error = new Error(`${getRequestHostLabel(url)} hat eine leere JSON-Antwort geliefert.`);
      error.statusCode = response.status;
      throw error;
    }

    try {
      return JSON.parse(payload);
    } catch (parseError) {
      const error = new Error(`${getRequestHostLabel(url)} hat ungültige JSON-Daten geliefert.`);
      error.statusCode = response.status;
      error.cause = parseError;
      throw error;
    }
  });
}

async function requestText(url) {
  return withRequestRetry(async () => {
    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "boocord-client-launcher/1.0"
      }
    });

    if (!response.ok) {
      const error = new Error(`Request fehlgeschlagen: ${response.status} ${response.statusText}`);
      error.statusCode = response.status;
      throw error;
    }

    return response.text();
  });
}

async function downloadFile(url, destinationPath) {
  await withRequestRetry(async () => {
    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "boocord-client-launcher/1.0"
      }
    }, 30000);

    if (!response.ok) {
      const error = new Error(`Download fehlgeschlagen: ${response.status} ${response.statusText}`);
      error.statusCode = response.status;
      throw error;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await ensureDirectory(path.dirname(destinationPath));
    await fs.writeFile(destinationPath, buffer);
  });
}

function runCommand(command, args, emitEvent) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString().trim();
      stdout += text ? `${text}\n` : "";

      if (text) {
        emit(emitEvent, "fabric", text);
      }
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString().trim();
      stderr += text ? `${text}\n` : "";

      if (text) {
        emit(emitEvent, "fabric", text);
      }
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
        return;
      }

      reject(
        new Error(
          `Befehl fehlgeschlagen (${command} ${args.join(" ")}): ${
            stderr.trim() || stdout.trim() || code
          }`
        )
      );
    });
  });
}

async function getMinecraftVersionManifest() {
  if (!minecraftManifestCache) {
    minecraftManifestCache = await requestJson(mojangVersionManifestUrl, {
      timeoutMs: moddingCatalogTimeoutMs
    });
  }

  return minecraftManifestCache;
}

async function getMinecraftVersionMetadata(versionId) {
  if (minecraftMetadataCache.has(versionId)) {
    return minecraftMetadataCache.get(versionId);
  }

  const manifest = await getMinecraftVersionManifest();
  const versionEntry = manifest.versions.find((entry) => entry.id === versionId);

  if (!versionEntry) {
    throw new Error(`Minecraft-Version ${versionId} wurde nicht gefunden.`);
  }

  const metadata = await requestJson(versionEntry.url);
  minecraftMetadataCache.set(versionId, metadata);
  return metadata;
}

async function getRequiredJavaVersion(versionId) {
  try {
    const metadata = await getMinecraftVersionMetadata(versionId);
    return metadata.javaVersion?.majorVersion || inferRequiredJavaVersion(versionId);
  } catch {
    return inferRequiredJavaVersion(versionId);
  }
}

function isMajorMinecraftRelease(versionId) {
  return /^\d+\.\d+$/.test(String(versionId || "").trim());
}

function compareMinecraftVersionsByDate(left, right) {
  const leftTime = left.date ? new Date(left.date).getTime() : 0;
  const rightTime = right.date ? new Date(right.date).getTime() : 0;
  return rightTime - leftTime;
}

function parseMinecraftReleaseVersion(versionId) {
  const match = String(versionId || "").trim().match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);

  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3] || 0)];
}

function compareMinecraftReleaseVersions(leftVersion, rightVersion) {
  const left = Array.isArray(leftVersion) ? leftVersion : parseMinecraftReleaseVersion(leftVersion);
  const right = Array.isArray(rightVersion) ? rightVersion : parseMinecraftReleaseVersion(rightVersion);

  if (!left || !right) {
    return 0;
  }

  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const leftPart = left[index] || 0;
    const rightPart = right[index] || 0;

    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return 0;
}

function inferRequiredJavaVersion(versionId) {
  const parsedVersion = parseMinecraftReleaseVersion(versionId);

  if (!parsedVersion) {
    return 8;
  }

  if (compareMinecraftReleaseVersions(parsedVersion, [1, 20, 5]) >= 0) {
    return 21;
  }

  if (compareMinecraftReleaseVersions(parsedVersion, [1, 18, 0]) >= 0) {
    return 17;
  }

  if (compareMinecraftReleaseVersions(parsedVersion, [1, 17, 0]) >= 0) {
    return 16;
  }

  return 8;
}

function isLegacyFabricMinecraftVersion(versionId) {
  const parsedVersion = parseMinecraftReleaseVersion(versionId);

  if (!parsedVersion) {
    return false;
  }

  return (
    compareMinecraftReleaseVersions(parsedVersion, minimumLegacyFabricVersion) >= 0 &&
    compareMinecraftReleaseVersions(parsedVersion, maximumLegacyFabricVersion) <= 0
  );
}

function resolveFabricDistribution(versionId) {
  return isLegacyFabricMinecraftVersion(versionId)
    ? fabricDistributions.legacyFabric
    : fabricDistributions.fabric;
}

function mergeMinecraftVersionOptions(versions, currentVersion = null, metadataByVersion = new Map()) {
  const merged = [];
  const seen = new Set();

  for (const entry of versions) {
    if (!entry?.version || seen.has(entry.version)) {
      continue;
    }

    seen.add(entry.version);
    merged.push(entry);
  }

  const normalizedCurrentVersion = String(currentVersion || "").trim();

  if (normalizedCurrentVersion && !seen.has(normalizedCurrentVersion)) {
    const metadata = metadataByVersion.get(normalizedCurrentVersion);
    merged.push({
      version: normalizedCurrentVersion,
      date: metadata?.releaseTime || metadata?.time || null,
      major: isMajorMinecraftRelease(normalizedCurrentVersion)
    });
  }

  return merged.sort(compareMinecraftVersionsByDate);
}

function buildFallbackFabricLoaderOptions(preferredVersion = null) {
  const version = String(preferredVersion || "").trim();

  return version
    ? [
        {
          version,
          stable: true
        }
      ]
    : [];
}

function buildPendingJavaRuntimeState(settings, requiredJavaVersion, error = null) {
  return {
    mode: "managed",
    installed: false,
    source: managedJavaVendor,
    requiredMajorVersion: requiredJavaVersion,
    command:
      requiredJavaVersion !== null
        ? resolveManagedJavaPaths(settings.dataDirectory, requiredJavaVersion).javaCommand
        : settings.javaPath || null,
    detected: null,
    error: error || null
  };
}

function getSettledValue(result, fallbackValue) {
  return result.status === "fulfilled" ? result.value : fallbackValue;
}

function getSettledErrorMessage(result) {
  if (result.status !== "rejected") {
    return null;
  }

  return normalizeJsonErrorMessage(result.reason);
}

async function detectJavaVersion(javaCommand = "java") {
  try {
    const result = await runCommand(javaCommand, ["-version"]);
    const output = `${result.stdout}\n${result.stderr}`;
    const match = output.match(/version "(?:1\.)?(\d+)/i);

    return {
      command: javaCommand,
      run: true,
      detected: match ? Number(match[1]) : null
    };
  } catch (error) {
    return {
      command: javaCommand,
      run: false,
      detected: null,
      error: error.message
    };
  }
}

function buildSystemJavaCandidates(settings, requiredJavaVersion) {
  const candidates = [];
  const seenCandidates = new Set();
  const managedJavaPaths =
    requiredJavaVersion !== null && requiredJavaVersion !== undefined
      ? resolveManagedJavaPaths(settings.dataDirectory, requiredJavaVersion)
      : null;
  const managedCommands = new Set(
    managedJavaPaths
      ? [managedJavaPaths.javaCommand, managedJavaPaths.launchCommand].map((entry) => normalizeComparablePath(entry))
      : []
  );

  if (settings?.javaPath) {
    const normalizedSettingsJavaPath = isFilePathCommand(settings.javaPath)
      ? normalizeComparablePath(settings.javaPath)
      : null;

    if (!normalizedSettingsJavaPath || !managedCommands.has(normalizedSettingsJavaPath)) {
      appendJavaCandidate(candidates, seenCandidates, settings.javaPath, "Konfiguriertes Java");
    }
  }

  if (process.env.JAVA_HOME) {
    appendJavaCandidate(
      candidates,
      seenCandidates,
      path.join(process.env.JAVA_HOME, "bin", isWindows ? "java.exe" : "java"),
      "JAVA_HOME"
    );
  }

  appendJavaCandidate(candidates, seenCandidates, "java", "System-Java");

  return candidates;
}

async function inspectSystemJavaRuntime(settings, requiredJavaVersion) {
  const candidates = buildSystemJavaCandidates(settings, requiredJavaVersion);
  let lastError = null;

  for (const candidate of candidates) {
    const detectedRuntime = await detectJavaVersion(candidate.command);

    if (detectedRuntime.run) {
      return {
        mode: "system",
        installed: true,
        source: candidate.source,
        requiredMajorVersion: requiredJavaVersion,
        path: isFilePathCommand(candidate.command) ? path.dirname(candidate.command) : null,
        command: candidate.command,
        launchCommand: candidate.command,
        detected: detectedRuntime.detected,
        releaseName: null,
        openjdkVersion: null,
        installedAt: null,
        error: null
      };
    }

    if (!lastError && detectedRuntime.error) {
      lastError = detectedRuntime.error;
    }
  }

  return {
    mode: "system",
    installed: false,
    source: "System-Java",
    requiredMajorVersion: requiredJavaVersion,
    path: null,
    command: candidates[0]?.command || "java",
    launchCommand: candidates[0]?.command || "java",
    detected: null,
    releaseName: null,
    openjdkVersion: null,
    installedAt: null,
    error: lastError
  };
}

async function inspectPreferredJavaRuntime(settings, requiredJavaVersion) {
  if (requiredJavaVersion !== null && requiredJavaVersion !== undefined) {
    const managedRuntime = await inspectManagedJavaRuntime(settings.dataDirectory, requiredJavaVersion);

    if (managedRuntime.installed) {
      return managedRuntime;
    }

    const systemRuntime = await inspectSystemJavaRuntime(settings, requiredJavaVersion);

    if (systemRuntime.installed) {
      return systemRuntime;
    }

    return managedRuntime;
  }

  return inspectSystemJavaRuntime(settings, requiredJavaVersion);
}

async function getManagedJavaAsset(majorVersion) {
  const supportError = getManagedJavaSupportError();

  if (supportError) {
    throw new Error(supportError);
  }

  const assets = await requestJson(
    `${adoptiumApiRoot}/assets/latest/${majorVersion}/hotspot?os=windows&architecture=${managedJavaArchitecture}&image_type=jre`
  );
  const asset = assets.find((entry) => entry?.binary?.package?.link);

  if (!asset?.binary?.package?.link) {
    throw new Error(`Keine verwaltete Java-Runtime für Java ${majorVersion} gefunden.`);
  }

  return {
    majorVersion,
    releaseName: asset.release_name || null,
    openjdkVersion: asset.version?.openjdk_version || null,
    packageName: asset.binary.package.name,
    packageUrl: asset.binary.package.link,
    checksum: asset.binary.package.checksum || null,
    size: asset.binary.package.size || null,
    updatedAt: asset.binary.updated_at || null,
    source: managedJavaVendor
  };
}

async function inspectManagedJavaRuntime(dataDirectory, majorVersion) {
  const managedJavaPaths = resolveManagedJavaPaths(dataDirectory, majorVersion);
  const metadata = await readJson(managedJavaPaths.metadataPath, null);
  const javaExists = await exists(managedJavaPaths.javaCommand);
  const launchCommand = (await exists(managedJavaPaths.launchCommand))
    ? managedJavaPaths.launchCommand
    : managedJavaPaths.javaCommand;

  if (!javaExists) {
    return {
      mode: "managed",
      installed: false,
      source: managedJavaVendor,
      requiredMajorVersion: majorVersion,
      path: managedJavaPaths.runtimeDirectory,
      command: managedJavaPaths.javaCommand,
      launchCommand,
      detected: null,
      releaseName: metadata?.releaseName || null,
      openjdkVersion: metadata?.openjdkVersion || null,
      installedAt: metadata?.installedAt || null,
      error: metadata?.error || null
    };
  }

  const detectedRuntime = await detectJavaVersion(managedJavaPaths.javaCommand);

  return {
    mode: "managed",
    installed: true,
    source: managedJavaVendor,
    requiredMajorVersion: majorVersion,
    path: managedJavaPaths.runtimeDirectory,
    command: managedJavaPaths.javaCommand,
    launchCommand,
    detected: detectedRuntime.detected,
    releaseName: metadata?.releaseName || null,
    openjdkVersion: metadata?.openjdkVersion || null,
    installedAt: metadata?.installedAt || null,
    error: detectedRuntime.error || null
  };
}

async function ensureManagedJavaRuntime(
  dataDirectory,
  majorVersion,
  emitEvent,
  { force = false } = {}
) {
  const currentRuntime = await inspectManagedJavaRuntime(dataDirectory, majorVersion);

  if (
    !force &&
    currentRuntime.installed &&
    currentRuntime.detected !== null &&
    currentRuntime.detected >= majorVersion
  ) {
    emit(
      emitEvent,
      "status",
      `Java ${currentRuntime.detected} wird aus der verwalteten Runtime verwendet.`
    );
    return currentRuntime;
  }

  const asset = await getManagedJavaAsset(majorVersion);
  const managedJavaPaths = resolveManagedJavaPaths(dataDirectory, majorVersion);
  const stagingDirectory = path.join(
    managedJavaPaths.baseDirectory,
    `.staging-temurin-${majorVersion}-${Date.now()}`
  );
  const archivePath = path.join(os.tmpdir(), asset.packageName);

  await ensureDirectory(managedJavaPaths.baseDirectory);
  emit(emitEvent, "status", `Verwaltete Java-Runtime ${majorVersion} wird eingerichtet...`);
  emit(emitEvent, "download", `Lade ${asset.packageName} herunter...`);

  try {
    await downloadFile(asset.packageUrl, archivePath);

    if (asset.checksum) {
      emit(emitEvent, "status", "Prüfe Java-Download...");
      const actualChecksum = await checksumFile(archivePath);

      if (actualChecksum.toLowerCase() !== String(asset.checksum).toLowerCase()) {
        throw new Error("Die heruntergeladene Java-Runtime hat eine ungültige Prüfsumme.");
      }
    }

    await fs.rm(managedJavaPaths.runtimeDirectory, { recursive: true, force: true });
    await fs.rm(stagingDirectory, { recursive: true, force: true });
    await extractZipArchive(archivePath, stagingDirectory, emitEvent);

    const stagingEntries = await fs.readdir(stagingDirectory, { withFileTypes: true });
    const extractedDirectory =
      stagingEntries.length === 1 && stagingEntries[0].isDirectory()
        ? path.join(stagingDirectory, stagingEntries[0].name)
        : stagingDirectory;

    if (extractedDirectory === stagingDirectory) {
      await ensureDirectory(managedJavaPaths.runtimeDirectory);
      await moveDirectoryContents(stagingDirectory, managedJavaPaths.runtimeDirectory);
    } else {
      await fs.rename(extractedDirectory, managedJavaPaths.runtimeDirectory);
    }

    const installedRuntime = await inspectManagedJavaRuntime(dataDirectory, majorVersion);

    if (
      installedRuntime.detected === null ||
      installedRuntime.detected < majorVersion ||
      !(await exists(installedRuntime.command))
    ) {
      throw new Error(`Java ${majorVersion} konnte nicht korrekt installiert werden.`);
    }

    await writeJson(managedJavaPaths.metadataPath, {
      installedAt: new Date().toISOString(),
      majorVersion,
      releaseName: asset.releaseName,
      openjdkVersion: asset.openjdkVersion,
      packageName: asset.packageName,
      packageUrl: asset.packageUrl,
      checksum: asset.checksum,
      source: asset.source,
      updatedAt: asset.updatedAt
    });

    return {
      ...installedRuntime,
      releaseName: asset.releaseName,
      openjdkVersion: asset.openjdkVersion,
      installedAt: new Date().toISOString()
    };
  } finally {
    await fs.rm(stagingDirectory, { recursive: true, force: true }).catch(() => {});
    await fs.rm(archivePath, { force: true }).catch(() => {});
  }
}

async function getAvailableMinecraftVersions(currentVersion = null, cachePath = null) {
  try {
    const [officialFabricVersions, legacyFabricVersions, minecraftManifest] = await Promise.all([
      requestJson(`${fabricDistributions.fabric.metaRoot}/versions/game`).catch(() => []),
      requestJson(`${fabricDistributions.legacyFabric.metaRoot}/versions/game`).catch(() => []),
      getMinecraftVersionManifest()
    ]);
    const metadataByVersion = new Map(
      (minecraftManifest.versions || [])
        .filter((entry) => entry.type === "release")
        .map((entry) => [entry.id, entry])
    );
    const stableVersions = [
      ...officialFabricVersions.map((entry) => ({
        ...entry,
        distributionId: fabricDistributions.fabric.id
      })),
      ...legacyFabricVersions.map((entry) => ({
        ...entry,
        distributionId: fabricDistributions.legacyFabric.id
      }))
    ]
      .filter((entry) => Boolean(entry?.stable) && metadataByVersion.has(entry.version))
      .filter((entry) =>
        entry.distributionId !== fabricDistributions.legacyFabric.id ||
        isLegacyFabricMinecraftVersion(entry.version)
      )
      .map((entry) => {
        const metadata = metadataByVersion.get(entry.version);

        return {
          version: entry.version,
          date: metadata?.releaseTime || metadata?.time || null,
          major: isMajorMinecraftRelease(entry.version)
        };
      });
    const mergedVersions = mergeMinecraftVersionOptions(
      stableVersions,
      currentVersion,
      metadataByVersion
    );

    minecraftVersionOptionsCache = mergedVersions;
    await updateCatalogCache(cachePath, {
      minecraftVersions: mergedVersions
    }).catch(() => {});
    return mergedVersions;
  } catch {
    if (minecraftVersionOptionsCache.length) {
      return mergeMinecraftVersionOptions(minecraftVersionOptionsCache, currentVersion);
    }

    const cachedCatalog = await readCatalogCache(cachePath);

    if (cachedCatalog.minecraftVersions.length) {
      minecraftVersionOptionsCache = cachedCatalog.minecraftVersions;
      return mergeMinecraftVersionOptions(cachedCatalog.minecraftVersions, currentVersion);
    }

    return mergeMinecraftVersionOptions(
      currentVersion
        ? [
            {
              version: currentVersion,
              date: null,
              major: isMajorMinecraftRelease(currentVersion)
            }
          ]
        : [],
      currentVersion
    );
  }
}

async function getCompatibleFabricLoaders(minecraftVersion, cachePath = null) {
  if (fabricLoaderCache.has(minecraftVersion)) {
    return fabricLoaderCache.get(minecraftVersion);
  }

  try {
    const distribution = resolveFabricDistribution(minecraftVersion);
    const response = await requestJson(`${distribution.metaRoot}/versions/loader/${minecraftVersion}`, {
      timeoutMs: runtimeProfileTimeoutMs
    });
    const loaders = response.map((entry) => ({
      version: entry.loader.version,
      stable: Boolean(entry.loader.stable)
    }));
    const resolvedLoaders = {
      distribution,
      loaders
    };

    fabricLoaderCache.set(minecraftVersion, resolvedLoaders);
    await updateCatalogCache(cachePath, {
      fabricLoadersByVersion: {
        [minecraftVersion]: {
          distributionId: distribution.id,
          loaders,
          updatedAt: new Date().toISOString()
        }
      }
    }).catch(() => {});
    return resolvedLoaders;
  } catch (error) {
    const cachedCatalog = await readCatalogCache(cachePath);
    const cachedEntry = cachedCatalog.fabricLoadersByVersion?.[minecraftVersion];
    const cachedLoaders = normalizeCatalogFabricLoaderOptions(cachedEntry?.loaders);

    if (cachedLoaders.length) {
      const resolvedLoaders = {
        distribution:
          cachedEntry?.distributionId === fabricDistributions.legacyFabric.id
            ? fabricDistributions.legacyFabric
            : resolveFabricDistribution(minecraftVersion),
        loaders: cachedLoaders
      };

      fabricLoaderCache.set(minecraftVersion, resolvedLoaders);
      return resolvedLoaders;
    }

    throw error;
  }
}

function formatCategoryLabel(categoryName) {
  return String(categoryName || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getModrinthCategories(projectType = "mod") {
  if (modrinthCategoryCache.has(projectType)) {
    return modrinthCategoryCache.get(projectType);
  }

  const categories = await requestJson(`${modrinthApiRoot}/tag/category`, {
    timeoutMs: modrinthTagTimeoutMs
  });
  const filteredCategories = categories
    .filter((entry) => entry.project_type === projectType)
    .map((entry) => ({
      value: entry.name,
      label: formatCategoryLabel(entry.name),
      icon: entry.icon || null
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  modrinthCategoryCache.set(projectType, filteredCategories);
  return filteredCategories;
}

async function resolvePreferredFabricLoaderVersion(minecraftVersion, preferredVersion = null, cachePath = null) {
  const { loaders } = await getCompatibleFabricLoaders(minecraftVersion, cachePath);

  if (!loaders.length) {
    throw new Error(`Keine Fabric-Loader für Minecraft ${minecraftVersion} gefunden.`);
  }

  const explicitMatch = loaders.find((entry) => entry.version === preferredVersion);

  if (explicitMatch) {
    return explicitMatch.version;
  }

  return loaders.find((entry) => entry.stable)?.version || loaders[0].version;
}

async function getLatestFabricInstallerVersion(distribution) {
  const metadata = await requestText(distribution.installerMetadataUrl);
  const releaseMatch = metadata.match(/<release>([^<]+)<\/release>/);

  if (!releaseMatch) {
    throw new Error("Fabric-Installer-Version konnte nicht bestimmt werden.");
  }

  return releaseMatch[1];
}

async function getProject(projectReference) {
  const key = String(projectReference);

  if (modrinthProjectCache.has(key)) {
    return modrinthProjectCache.get(key);
  }

  if (modrinthProjectRequestCache.has(key)) {
    return modrinthProjectRequestCache.get(key);
  }

  const request = requestJson(`${modrinthApiRoot}/project/${encodeURIComponent(key)}`)
    .then((project) => {
      modrinthProjectCache.set(key, project);

      if (project.id) {
        modrinthProjectCache.set(project.id, project);
      }

      if (project.slug) {
        modrinthProjectCache.set(project.slug, project);
      }

      return project;
    })
    .finally(() => {
      modrinthProjectRequestCache.delete(key);
    });

  modrinthProjectRequestCache.set(key, request);
  return request;
}

async function getProjects(projectReferences = []) {
  const uniqueReferences = [...new Set(
    (projectReferences || [])
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
  )];
  const unresolvedReferences = uniqueReferences.filter((entry) => !modrinthProjectCache.has(entry));

  if (unresolvedReferences.length) {
    const response = await requestJson(
      `${modrinthApiRoot}/projects?ids=${encodeURIComponent(JSON.stringify(unresolvedReferences))}`
    );
    const projects = Array.isArray(response) ? response : Array.isArray(response?.value) ? response.value : [];

    for (const project of projects) {
      if (!project || !project.id) {
        continue;
      }

      modrinthProjectCache.set(project.id, project);

      if (project.slug) {
        modrinthProjectCache.set(project.slug, project);
      }
    }
  }

  return uniqueReferences
    .map((entry) => modrinthProjectCache.get(entry) || null)
    .filter(Boolean);
}

function toSelectedProject(project) {
  return {
    projectId: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description,
    iconUrl: project.icon_url || null,
    projectType: project.project_type || "mod",
    author: null,
    clientSide: project.client_side || null,
    serverSide: project.server_side || null,
    projectUrl: toModrinthProjectUrl(project),
    versionId: null,
    versionNumber: null,
    versionName: null,
    versionType: null
  };
}

async function checksumFileCached(targetPath, algorithm = "sha512") {
  const stat = await fs.stat(targetPath);
  const cacheKey = `${algorithm}:${targetPath}:${stat.size}:${stat.mtimeMs}`;

  if (localFileHashCache.has(cacheKey)) {
    return localFileHashCache.get(cacheKey);
  }

  const hash = await checksumFile(targetPath, algorithm);
  localFileHashCache.set(cacheKey, hash);
  return hash;
}

async function getVersionFilesByHashes(hashes, algorithm = "sha512") {
  const uniqueHashes = [...new Set(
    (hashes || [])
      .map((entry) => String(entry || "").trim().toLowerCase())
      .filter(Boolean)
  )];
  const unresolvedHashes = uniqueHashes.filter((entry) => !modrinthVersionByHashCache.has(entry));

  if (unresolvedHashes.length) {
    const response = await requestJson(
      `${modrinthApiRoot}/version_files?algorithm=${encodeURIComponent(algorithm)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          hashes: unresolvedHashes
        })
      }
    );

    for (const hash of unresolvedHashes) {
      modrinthVersionByHashCache.set(hash, response?.[hash] || null);
    }
  }

  return new Map(uniqueHashes.map((hash) => [hash, modrinthVersionByHashCache.get(hash) || null]));
}

async function getProjectMembers(projectReference) {
  return requestJson(`${modrinthApiRoot}/project/${encodeURIComponent(projectReference)}/members`);
}

async function listProjectVersions(projectReference, { loader = null, minecraftVersion = null } = {}) {
  const searchParams = new URLSearchParams();

  if (loader) {
    searchParams.set("loaders", JSON.stringify([loader]));
  }

  if (minecraftVersion) {
    searchParams.set("game_versions", JSON.stringify([minecraftVersion]));
  }

  const suffix = searchParams.toString();
  const targetUrl = suffix
    ? `${modrinthApiRoot}/project/${encodeURIComponent(projectReference)}/version?${suffix}`
    : `${modrinthApiRoot}/project/${encodeURIComponent(projectReference)}/version`;

  return requestJson(targetUrl);
}

function toMemberSummary(member) {
  return {
    id: member?.user?.id || null,
    username: member?.user?.username || "Unbekannt",
    role: member?.role || member?.user?.role || "Mitglied",
    avatarUrl: member?.user?.avatar_url || null
  };
}

function toVersionSummary(version) {
  return {
    id: version.id,
    name: version.name,
    versionNumber: version.version_number,
    changelog: version.changelog || null,
    changelogUrl: version.changelog_url || null,
    datePublished: version.date_published,
    downloads: version.downloads || 0,
    versionType: version.version_type || null,
    featured: Boolean(version.featured),
    status: version.status || null,
    gameVersions: version.game_versions || [],
    loaders: version.loaders || [],
    files: (version.files || []).map((file) => ({
      id: file.id,
      filename: file.filename,
      url: file.url,
      primary: Boolean(file.primary),
      size: file.size || 0,
      fileType: file.file_type || null
    })),
    dependencies: (version.dependencies || []).map((dependency) => ({
      projectId: dependency.project_id || null,
      versionId: dependency.version_id || null,
      dependencyType: dependency.dependency_type || null
    }))
  };
}

async function resolveSelectedProjectsDetails(selectedProjects, projectType = null) {
  const config = projectType ? getModdingContentConfig(projectType) : null;
  const resolved = await Promise.all(dedupeSelectedProjects(selectedProjects, projectType).map(async (entry) => {
    if (entry?.isLocalOnly || isLocalProjectReference(entry?.projectId)) {
      return {
        projectId: entry.projectId,
        slug: entry.slug || null,
        title: entry.title || entry.localFileName || entry.projectId,
        description: entry.description || "Lokal importierte Datei.",
        iconUrl: entry.iconUrl || null,
        projectType: entry.projectType || projectType || "mod",
        clientSide: entry.clientSide || null,
        serverSide: entry.serverSide || null,
        projectUrl: null,
        versionId: entry.versionId || null,
        versionNumber: entry.versionNumber || null,
        versionName: entry.versionName || null,
        versionType: entry.versionType || null,
        isLocalOnly: true,
        localFileName: entry.localFileName || entry.localImportFileNames?.[0] || null,
        linkedProjectId: entry.linkedProjectId || null,
        linkedProjectSlug: entry.linkedProjectSlug || null,
        linkedProjectUrl: entry.linkedProjectUrl || null
      };
    }

    try {
      const project = await getProject(entry.projectId || entry.slug);
      return {
        ...toSelectedProject(project),
        versionId: entry.versionId || null,
        versionNumber: entry.versionNumber || null,
        versionName: entry.versionName || null,
        versionType: entry.versionType || null
      };
    } catch {
      return {
        projectId: entry.projectId,
        slug: entry.slug || null,
        title: entry.title || entry.projectId,
        description: entry.description || "Projekt konnte aktuell nicht geladen werden.",
        iconUrl: entry.iconUrl || null,
        projectType: entry.projectType || projectType || "mod",
        clientSide: entry.clientSide || null,
        serverSide: entry.serverSide || null,
        projectUrl: null,
        versionId: entry.versionId || null,
        versionNumber: entry.versionNumber || null,
        versionName: entry.versionName || null,
        versionType: entry.versionType || null
      };
    }
  }));

  return resolved
    .map((entry) => ({
      ...entry,
      projectType: entry.projectType || projectType || "mod",
      fallbackLabel: config?.fallbackLabel || null
    }))
    .sort((left, right) => (left.title || "").localeCompare(right.title || ""));
}

async function readManagedFileList(managedStatePath) {
  const stored = await readJson(managedStatePath, []);

  if (!Array.isArray(stored)) {
    return [];
  }

  return stored
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
}

function resolveManagedOwnershipStatePathForProjectType(paths, projectType) {
  if (projectType === "resourcepack") {
    return paths.managedResourcePacksOwnershipStatePath;
  }

  if (projectType === "shader") {
    return paths.managedShaderPacksOwnershipStatePath;
  }

  return paths.managedModsOwnershipStatePath;
}

function normalizeManagedSelectionOwnerEntry(entry, fallbackProjectType = "mod") {
  const normalizedProject = sanitizeSelectedProjectEntry(entry, fallbackProjectType);

  if (!normalizedProject || normalizedProject.isLocalOnly || isLocalProjectReference(normalizedProject.projectId)) {
    return null;
  }

  const files = [...new Set(
    (entry?.files || entry?.fileNames || [])
      .map((fileName) => path.basename(String(fileName || "").trim()))
      .filter(Boolean)
  )].sort((left, right) => left.localeCompare(right, "de", { sensitivity: "base" }));

  return {
    projectId: normalizedProject.projectId,
    slug: normalizedProject.slug || null,
    title: normalizedProject.title || null,
    projectType: normalizedProject.projectType || fallbackProjectType,
    versionId: normalizedProject.versionId || null,
    versionNumber: normalizedProject.versionNumber || null,
    versionName: normalizedProject.versionName || null,
    versionType: normalizedProject.versionType || null,
    files
  };
}

function mergeManagedSelectionOwnerEntries(entries = [], fallbackProjectType = "mod") {
  const merged = [];

  for (const entry of entries || []) {
    const normalizedEntry = normalizeManagedSelectionOwnerEntry(entry, fallbackProjectType);

    if (!normalizedEntry) {
      continue;
    }

    const existingIndex = merged.findIndex((candidate) =>
      projectEntryMatchesReference(candidate, normalizedEntry, fallbackProjectType)
    );

    if (existingIndex === -1) {
      merged.push(normalizedEntry);
      continue;
    }

    merged[existingIndex] = {
      ...merged[existingIndex],
      ...normalizedEntry,
      files: [...new Set([
        ...(merged[existingIndex].files || []),
        ...(normalizedEntry.files || [])
      ])].sort((left, right) => left.localeCompare(right, "de", { sensitivity: "base" }))
    };
  }

  return merged;
}

async function readManagedSelectionOwnerEntries(statePath, fallbackProjectType = "mod") {
  const stored = await readJson(statePath, []);
  const ownerEntries = Array.isArray(stored) ? stored : Array.isArray(stored?.owners) ? stored.owners : [];
  return mergeManagedSelectionOwnerEntries(ownerEntries, fallbackProjectType);
}

async function writeManagedSelectionOwnerEntries(statePath, entries, fallbackProjectType = "mod") {
  await ensureDirectory(path.dirname(statePath));
  await writeJson(
    statePath,
    mergeManagedSelectionOwnerEntries(entries, fallbackProjectType)
  );
}

function findManagedSelectionOwnerIndex(entries, projectReference, fallbackProjectType = "mod") {
  return (entries || []).findIndex((entry) =>
    projectEntryMatchesReference(entry, projectReference, fallbackProjectType)
  );
}

function extractManagedVersionFileNames(resolvedVersions = []) {
  const fileNames = [];

  for (const version of resolvedVersions || []) {
    const primaryFile = pickPrimaryFile(version);

    if (!primaryFile?.filename) {
      continue;
    }

    fileNames.push(primaryFile.filename);
  }

  return [...new Set(fileNames)];
}

function buildManagedSelectionOwnerEntry(projectEntry, projectType, resolvedVersions = []) {
  return normalizeManagedSelectionOwnerEntry(
    {
      ...sanitizeSelectedProjectEntry(projectEntry, projectType),
      files: extractManagedVersionFileNames(resolvedVersions)
    },
    projectType
  );
}

function collectManagedSelectionOwnedFileNames(ownerEntries = []) {
  const fileNames = new Set();

  for (const entry of ownerEntries || []) {
    for (const fileName of entry?.files || []) {
      const normalizedFileName = String(fileName || "").trim().toLowerCase();

      if (normalizedFileName) {
        fileNames.add(normalizedFileName);
      }
    }
  }

  return fileNames;
}

async function populateMissingManagedSelectionOwnerEntries(
  ownerEntries,
  selectedProjects,
  projectType = "mod",
  minecraftVersion = null
) {
  const nextOwners = mergeManagedSelectionOwnerEntries(ownerEntries, projectType);
  const normalizedSelections = dedupeSelectedProjects(selectedProjects, projectType);

  for (const entry of normalizedSelections) {
    if (!entry || entry.isLocalOnly || isLocalProjectReference(entry.projectId)) {
      continue;
    }

    if (findManagedSelectionOwnerIndex(nextOwners, entry, projectType) !== -1) {
      continue;
    }

    const resolvedVersions = await resolveProjectSelections([entry], projectType, minecraftVersion);
    const ownerEntry = buildManagedSelectionOwnerEntry(entry, projectType, resolvedVersions);

    if (ownerEntry) {
      nextOwners.push(ownerEntry);
    }
  }

  return mergeManagedSelectionOwnerEntries(
    nextOwners.filter((entry) =>
      normalizedSelections.some((selection) => projectEntryMatchesReference(entry, selection, projectType))
    ),
    projectType
  );
}

async function syncManagedSelectionOwnerEntriesForProjectTypes({
  settings,
  paths,
  projectTypes = ["mod", "resourcepack", "shader"],
  minecraftVersion = null
}) {
  const nextProjectTypes = [...new Set(
    (projectTypes || []).map((entry) => String(entry || "").trim()).filter(Boolean)
  )];

  for (const projectType of nextProjectTypes) {
    const config = getModdingContentConfig(projectType);
    const ownershipStatePath = resolveManagedOwnershipStatePathForProjectType(paths, projectType);

    await withFileMutationLock(ownershipStatePath, async () => {
      const ownerEntries = await readManagedSelectionOwnerEntries(ownershipStatePath, projectType);
      const nextOwnerEntries = await populateMissingManagedSelectionOwnerEntries(
        ownerEntries,
        settings?.modding?.[config.selectionKey] || [],
        projectType,
        minecraftVersion
      );

      await writeManagedSelectionOwnerEntries(ownershipStatePath, nextOwnerEntries, projectType);
    });
  }
}

async function readManagedFileNames(managedStatePath) {
  return new Set(
    (await readManagedFileList(managedStatePath))
      .map((entry) => entry.toLowerCase())
  );
}

async function getMissingManagedFileNames(directoryPath, statePath) {
  const managedFileNames = await readManagedFileNames(statePath);

  if (!managedFileNames.size) {
    return [];
  }

  const missingFileNames = [];

  for (const fileName of managedFileNames) {
    if (!(await exists(path.join(directoryPath, fileName)))) {
      missingFileNames.push(fileName);
    }
  }

  return missingFileNames;
}

function resolveManagedStatePathForProjectType(paths, projectType) {
  if (projectType === "resourcepack") {
    return paths.managedResourcePacksStatePath;
  }

  if (projectType === "shader") {
    return paths.managedShaderPacksStatePath;
  }

  return paths.managedModsStatePath;
}

function isSupportedLocalImport(projectType, entryName, isDirectory = false) {
  if (isDirectory) {
    return projectType !== "mod";
  }

  const normalizedExtension = path.extname(String(entryName || "")).toLowerCase();

  if (projectType === "mod") {
    return normalizedExtension === ".jar" || normalizedExtension === ".zip";
  }

  return normalizedExtension === ".zip";
}

function getLocalImportErrorMessage(projectType = "mod") {
  if (projectType === "resourcepack") {
    return "Resource Packs können nur als .zip-Datei oder Ordner importiert werden.";
  }

  if (projectType === "shader") {
    return "Shader Packs können nur als .zip-Datei oder Ordner importiert werden.";
  }

  return "Mods können nur als .jar- oder .zip-Datei importiert werden.";
}

function normalizeImportedRelativePath(relativePath) {
  return String(relativePath || "")
    .replace(/[\\/]+/g, "/")
    .replace(/^\/+|\/+$/g, "");
}

function resolveProjectTypeFromImportedPath(relativePath) {
  const [rootSegment] = normalizeImportedRelativePath(relativePath).split("/");
  const normalizedRoot = String(rootSegment || "").trim().toLowerCase();

  if (normalizedRoot === "resourcepacks") {
    return "resourcepack";
  }

  if (normalizedRoot === "shaderpacks") {
    return "shader";
  }

  if (normalizedRoot === "mods") {
    return "mod";
  }

  return null;
}

async function readImportedProjectMetadata(paths, projectType = "mod") {
  const profileStatePath = path.join(paths.instanceDirectory, "profile.json");
  const profileState = await readJson(profileStatePath, null);
  const projectEntries = profileState?.projects;

  if (!projectEntries || typeof projectEntries !== "object") {
    return new Map();
  }

  const metadataByFileName = new Map();

  for (const [relativePath, projectEntry] of Object.entries(projectEntries)) {
    if (resolveProjectTypeFromImportedPath(relativePath) !== projectType) {
      continue;
    }

    const metadata = projectEntry?.metadata;
    const project = metadata?.project;

    if (metadata?.type !== "modrinth" || !project?.id) {
      continue;
    }

    const fileName =
      String(projectEntry?.file_name || "").trim() ||
      path.basename(normalizeImportedRelativePath(relativePath));

    if (!fileName) {
      continue;
    }

    metadataByFileName.set(fileName.toLowerCase(), {
      ...toSelectedProject(project),
      importSourceType: metadata.type,
      linkedVersionId: metadata?.version?.id || null,
      linkedVersionNumber: metadata?.version?.version_number || null
    });
  }

  return metadataByFileName;
}

function createEmptyImportedProjectMetadataCacheState() {
  return {
    mod: {},
    resourcepack: {},
    shader: {}
  };
}

function normalizeImportedProjectMetadataCacheState(stored) {
  const emptyState = createEmptyImportedProjectMetadataCacheState();

  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return emptyState;
  }

  return {
    mod: stored.mod && typeof stored.mod === "object" && !Array.isArray(stored.mod) ? stored.mod : {},
    resourcepack:
      stored.resourcepack && typeof stored.resourcepack === "object" && !Array.isArray(stored.resourcepack)
        ? stored.resourcepack
        : {},
    shader: stored.shader && typeof stored.shader === "object" && !Array.isArray(stored.shader) ? stored.shader : {}
  };
}

async function repairImportedProjectMetadataCache(cachePath) {
  const emptyState = createEmptyImportedProjectMetadataCacheState();
  const content = await fs.readFile(cachePath, "utf8");
  const recoveredJson = extractLeadingStructuredJson(content);
  let recoveredState = emptyState;

  if (recoveredJson) {
    try {
      recoveredState = normalizeImportedProjectMetadataCacheState(JSON.parse(recoveredJson));
    } catch {
      recoveredState = emptyState;
    }
  }

  await writeJson(cachePath, recoveredState);
  return recoveredState;
}

async function readImportedProjectMetadataCache(cachePath, { lockOnRepair = true } = {}) {
  try {
    return normalizeImportedProjectMetadataCacheState(await readJson(cachePath, null));
  } catch (error) {
    if (!isRecoverableJsonParseError(error) || !(await exists(cachePath))) {
      throw error;
    }

    if (lockOnRepair) {
      return withFileMutationLock(cachePath, () =>
        readImportedProjectMetadataCache(cachePath, {
          lockOnRepair: false
        })
      );
    }

    return repairImportedProjectMetadataCache(cachePath);
  }
}

async function resolveCachedImportedProjectMetadata(cachePath, targetDirectory, entries, projectType = "mod") {
  const cacheState = await readImportedProjectMetadataCache(cachePath);
  const projectTypeCache = cacheState[projectType] || {};
  const metadataByFileName = new Map();
  const unresolvedEntries = [];

  for (const entry of entries || []) {
    if (!entry?.isFile?.()) {
      unresolvedEntries.push(entry);
      continue;
    }

    const fileNameKey = entry.name.toLowerCase();
    const targetPath = path.join(targetDirectory, entry.name);
    const stat = await fs.stat(targetPath);
    const cachedEntry = projectTypeCache[fileNameKey];

    if (cachedEntry && cachedEntry.size === stat.size && cachedEntry.mtimeMs === stat.mtimeMs) {
      if (cachedEntry.metadata) {
        metadataByFileName.set(fileNameKey, cachedEntry.metadata);
      }
      continue;
    }

    unresolvedEntries.push(entry);
  }

  return {
    cacheState,
    metadataByFileName,
    unresolvedEntries
  };
}

async function updateImportedProjectMetadataCache(cachePath, projectType, targetDirectory, metadataByFileName) {
  await withFileMutationLock(cachePath, async () => {
    const cacheState = await readImportedProjectMetadataCache(cachePath, {
      lockOnRepair: false
    });
    const nextProjectTypeCache = {};

    for (const [fileNameKey, metadata] of metadataByFileName.entries()) {
      const targetPath = path.join(targetDirectory, fileNameKey);

      if (!(await exists(targetPath))) {
        continue;
      }

      const stat = await fs.stat(targetPath);
      nextProjectTypeCache[fileNameKey] = {
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        metadata: metadata || null
      };
    }

    cacheState[projectType] = nextProjectTypeCache;
    await writeJson(cachePath, cacheState);
  });
}

async function resolveHashedImportedProjectMetadata(targetDirectory, entries, projectType = "mod") {
  const fileEntries = (entries || []).filter((entry) => entry?.isFile?.());

  if (!fileEntries.length) {
    return new Map();
  }

  const hashEntries = await Promise.all(fileEntries.map(async (entry) => ({
    entry,
    hash: await checksumFileCached(path.join(targetDirectory, entry.name), "sha512")
  })));
  const versionByHash = await getVersionFilesByHashes(
    hashEntries.map((entry) => entry.hash),
    "sha512"
  );
  const projectIds = [...new Set(
    hashEntries
      .map((entry) => versionByHash.get(entry.hash)?.project_id || null)
      .filter(Boolean)
  )];
  const projects = await getProjects(projectIds);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const metadataByFileName = new Map();

  for (const { entry, hash } of hashEntries) {
    const version = versionByHash.get(hash);
    const project = version?.project_id ? projectById.get(version.project_id) : null;

    if (!version || !project) {
      continue;
    }

    metadataByFileName.set(entry.name.toLowerCase(), {
      ...toSelectedProject(project),
      importSourceType: "modrinth",
      linkedVersionId: version.id || null,
      linkedVersionNumber: version.version_number || null
    });
  }

  return metadataByFileName;
}

async function resolveLocalImportedProjects(
  paths,
  projectType = "mod",
  { includeManaged = false, metadataMode = "full" } = {}
) {
  const config = getModdingContentConfig(projectType);
  const targetDirectory = path.join(paths.instanceDirectory, config.directoryName);
  const shouldReadMetadata = metadataMode !== "none";
  const shouldResolveCachedMetadata = metadataMode === "cached" || metadataMode === "full";
  const shouldResolveHashedMetadata = metadataMode === "full";

  if (!(await exists(targetDirectory))) {
    return [];
  }

  const managedFileNames = await readManagedFileNames(
    resolveManagedStatePathForProjectType(paths, projectType)
  );
  const importedMetadataByFileName = shouldReadMetadata
    ? await readImportedProjectMetadata(paths, projectType)
    : new Map();
  const entries = await fs.readdir(targetDirectory, {
    withFileTypes: true
  });
  const filteredEntries = entries
    .filter((entry) => !entry.name.startsWith("."))
    .filter((entry) => entry.isDirectory() || entry.isFile())
    .filter((entry) => {
      if (!includeManaged && managedFileNames.has(entry.name.toLowerCase())) {
        return false;
      }

      if (projectType === "mod" && entry.isFile()) {
        const extension = path.extname(entry.name).toLowerCase();
        return extension === ".jar" || extension === ".zip";
      }

      return true;
    });
  const initialMissingMetadataEntries = shouldResolveCachedMetadata
    ? filteredEntries.filter(
        (entry) => entry.isFile() && !importedMetadataByFileName.has(entry.name.toLowerCase())
      )
    : [];
  const cachedMetadataResult = shouldResolveCachedMetadata
    ? await resolveCachedImportedProjectMetadata(
        paths.importedProjectMetadataCachePath,
        targetDirectory,
        initialMissingMetadataEntries,
        projectType
      )
    : {
        metadataByFileName: new Map(),
        unresolvedEntries: []
      };
  const cachedMetadataByFileName = cachedMetadataResult.metadataByFileName;
  const missingMetadataEntries = cachedMetadataResult.unresolvedEntries;
  const hashedMetadataByFileName = shouldResolveHashedMetadata
    ? await resolveHashedImportedProjectMetadata(targetDirectory, missingMetadataEntries, projectType)
    : new Map();
  const persistentMetadataByFileName = shouldResolveHashedMetadata
    ? new Map(
        initialMissingMetadataEntries.map((entry) => [
          entry.name.toLowerCase(),
          cachedMetadataByFileName.get(entry.name.toLowerCase()) ||
            hashedMetadataByFileName.get(entry.name.toLowerCase()) ||
            null
        ])
      )
    : new Map();

  if (shouldResolveHashedMetadata && initialMissingMetadataEntries.length) {
    await updateImportedProjectMetadataCache(
      paths.importedProjectMetadataCachePath,
      projectType,
      targetDirectory,
      persistentMetadataByFileName
    );
  }

  return filteredEntries
    .map((entry) => {
      const importedMetadata =
        importedMetadataByFileName.get(entry.name.toLowerCase()) ||
        cachedMetadataByFileName.get(entry.name.toLowerCase()) ||
        hashedMetadataByFileName.get(entry.name.toLowerCase()) ||
        null;

      return {
        projectId: `local:${projectType}:${entry.name.toLowerCase()}`,
        slug: importedMetadata?.slug || null,
        title: importedMetadata?.title || entry.name,
        description: importedMetadata?.description ||
          (entry.isDirectory() ? "Lokal importierter Ordner." : "Lokal importierte Datei."),
        iconUrl: importedMetadata?.iconUrl || null,
        projectType,
        clientSide: importedMetadata?.clientSide || null,
        serverSide: importedMetadata?.serverSide || null,
        projectUrl: importedMetadata?.projectUrl || null,
        fallbackLabel: config.fallbackLabel,
        isLocalOnly: true,
        localFileName: entry.name,
        localDirectoryPath: targetDirectory,
        localPath: path.join(targetDirectory, entry.name),
        linkedProjectId: importedMetadata?.projectId || null,
        linkedProjectSlug: importedMetadata?.slug || null,
        linkedProjectUrl: importedMetadata?.projectUrl || null,
        importSourceType: importedMetadata?.importSourceType || null,
        linkedVersionId: importedMetadata?.linkedVersionId || null,
        linkedVersionNumber: importedMetadata?.linkedVersionNumber || null
      };
    })
    .sort((left, right) => (left.title || "").localeCompare(right.title || ""));
}

function mergeProjectCollections(selectedProjects, localProjects) {
  const merged = [];

  const getIdentityKeys = (entry) => {
    const keys = new Set();

    for (const value of [
      entry?.projectId,
      entry?.slug,
      entry?.linkedProjectId,
      entry?.linkedProjectSlug
    ]) {
      const normalizedValue = String(value || "").trim().toLowerCase();

      if (normalizedValue) {
        keys.add(normalizedValue);
      }
    }

    return keys;
  };
  const findMatchIndex = (entry) => {
    const entryKeys = getIdentityKeys(entry);

    if (!entryKeys.size) {
      return -1;
    }

    for (let index = 0; index < merged.length; index += 1) {
      const mergedKeys = getIdentityKeys(merged[index]);

      for (const key of entryKeys) {
        if (mergedKeys.has(key)) {
          return index;
        }
      }
    }

    return -1;
  };
  const mergeEntries = (previousEntry, nextEntry) => {
    const preferNext = Boolean(nextEntry && !nextEntry.isLocalOnly && previousEntry?.isLocalOnly);
    const primaryEntry = preferNext ? nextEntry : previousEntry;
    const secondaryEntry = preferNext ? previousEntry : nextEntry;

    return {
      ...secondaryEntry,
      ...primaryEntry,
      isLocalOnly: Boolean(primaryEntry?.isLocalOnly && secondaryEntry?.isLocalOnly)
    };
  };

  for (const entry of selectedProjects || []) {
    const matchIndex = findMatchIndex(entry);

    if (matchIndex === -1) {
      merged.push(entry);
      continue;
    }

    merged[matchIndex] = mergeEntries(merged[matchIndex], entry);
  }

  for (const entry of localProjects || []) {
    const matchIndex = findMatchIndex(entry);

    if (matchIndex === -1) {
      merged.push(entry);
      continue;
    }

    merged[matchIndex] = mergeEntries(merged[matchIndex], entry);
  }

  return merged;
}

async function buildInstalledSelectionSnapshot(paths, selectedProjects, projectType = "mod") {
  const [resolvedSelectedProjects, localImportedProjects] = await Promise.all([
    resolveSelectedProjectsDetails(selectedProjects, projectType),
    resolveLocalImportedProjects(paths, projectType)
  ]);

  return mergeProjectCollections(resolvedSelectedProjects, localImportedProjects);
}

function getInstallStatePropertyNames(projectType = "mod") {
  if (projectType === "resourcepack") {
    return {
      selectedKey: "selectedResourcePacks",
      displayKey: "displaySelectedResourcePacks",
      installedKey: "installedResourcePacks"
    };
  }

  if (projectType === "shader") {
    return {
      selectedKey: "selectedShaderPacks",
      displayKey: "displaySelectedShaderPacks",
      installedKey: "installedShaderPacks"
    };
  }

  return {
    selectedKey: "selectedMods",
    displayKey: "displaySelectedMods",
    installedKey: "installedMods"
  };
}

async function syncManagedSelectionInstallState({
  settings,
  manifest,
  paths,
  runtimeProfile,
  installState = null,
  projectTypes = ["mod", "resourcepack", "shader"],
  emitEvent = null
}) {
  const nextInstallState = {
    ...(buildLaunchableInstallState(installState, runtimeProfile) || {})
  };

  await ensureDirectory(paths.instanceDirectory);

  for (const projectType of projectTypes) {
    const config = getModdingContentConfig(projectType);
    const { selectedKey, displayKey, installedKey } = getInstallStatePropertyNames(projectType);
    const selectedProjects = settings.modding?.[config.selectionKey] || [];
    const resolvedVersions = await resolveProjectSelections(
      selectedProjects,
      projectType,
      runtimeProfile.minecraftVersion
    );
    const targetDirectory = path.join(paths.instanceDirectory, config.directoryName);
    const managedStatePath = resolveManagedStatePathForProjectType(paths, projectType);
    const itemLabel = config.fallbackLabel;

    if (projectType === "mod") {
      await downloadMods(resolvedVersions, targetDirectory, managedStatePath, emitEvent, manifest);
    } else {
      await downloadProjectFiles(
        resolvedVersions,
        targetDirectory,
        managedStatePath,
        emitEvent,
        itemLabel,
        manifest
      );
    }

    nextInstallState[selectedKey] = await resolveSelectedProjectsDetails(selectedProjects, projectType);
    nextInstallState[displayKey] = await buildInstalledSelectionSnapshot(paths, selectedProjects, projectType);
    nextInstallState[installedKey] = resolvedVersions
      .map((version) => version.name || version.id)
      .sort((left, right) => left.localeCompare(right));
  }

  await syncManagedSelectionOwnerEntriesForProjectTypes({
    settings,
    paths,
    projectTypes,
    minecraftVersion: runtimeProfile.minecraftVersion
  });
  await writeJson(paths.installStatePath, nextInstallState);
  return nextInstallState;
}

async function searchModrinthProjects({
  query,
  projectType = "mod",
  minecraftVersion,
  category = "all",
  sortIndex = "downloads",
  limit = 12,
  offset = 0
}) {
  const allowedSortIndexes = new Set(["relevance", "downloads", "follows", "newest", "updated"]);
  const facets = [
    [`project_type:${projectType}`],
    [`versions:${minecraftVersion}`]
  ];

  if (projectType === "mod") {
    facets.push(
      isLegacyFabricMinecraftVersion(minecraftVersion)
        ? ["categories:fabric", "categories:legacy-fabric"]
        : ["categories:fabric"]
    );
  }

  if (category && category !== "all") {
    facets.push([`categories:${category}`]);
  }

  const searchParams = new URLSearchParams({
    query: query || "",
    limit: String(limit),
    offset: String(Math.max(0, Number(offset) || 0)),
    facets: JSON.stringify(facets)
  });

  if (allowedSortIndexes.has(sortIndex)) {
    searchParams.set("index", sortIndex);
  }

  const payload = await requestJson(`${modrinthApiRoot}/search?${searchParams.toString()}`);

  return {
    totalHits: payload.total_hits || 0,
    offset: payload.offset || 0,
    limit: payload.limit || limit,
    hits: (payload.hits || []).map((hit) => ({
      projectId: hit.project_id,
      slug: hit.slug,
      projectType: hit.project_type || projectType,
      author: hit.author || null,
      title: hit.title,
      description: hit.description,
      iconUrl: hit.icon_url || null,
      downloads: hit.downloads || 0,
      follows: hit.follows || 0,
      categories: hit.display_categories || hit.categories || [],
      versions: hit.versions || [],
      latestVersion: hit.latest_version || null,
      clientSide: hit.client_side || null,
      serverSide: hit.server_side || null,
      dateCreated: hit.date_created || null,
      dateModified: hit.date_modified || null,
      license: hit.license || null,
      gallery: hit.gallery || [],
      color: hit.color || null,
      projectUrl: hit.slug
        ? `https://modrinth.com/${encodeURIComponent(hit.project_type || projectType)}/${encodeURIComponent(hit.slug)}`
        : null
    }))
  };
}

async function getModrinthProjectDetails({
  projectId,
  projectType = "mod",
  minecraftVersion = null,
  loader = projectType === "mod" ? "fabric" : null,
  versionLimit = 6
} = {}) {
  if (!projectId) {
    throw new Error("Keine Mod-ID für die Detailansicht übergeben.");
  }

  const project = await getProject(projectId);
  const versionsPromise = listProjectVersions(project.id, {
    loader,
    minecraftVersion
  }).catch(async () => {
    if (!loader && !minecraftVersion) {
      return [];
    }

    return listProjectVersions(project.id);
  });
  const membersPromise = getProjectMembers(project.id).catch(() => []);
  const [versions, members] = await Promise.all([versionsPromise, membersPromise]);

  const compatibleVersions = Array.isArray(versions) ? versions : [];

  return {
    projectId: project.id,
    slug: project.slug,
    projectType: project.project_type || "mod",
    title: project.title,
    description: project.description,
    body: project.body || null,
    bodyUrl: project.body_url || null,
    iconUrl: project.icon_url || null,
    color: project.color || null,
    projectUrl: toModrinthProjectUrl(project),
    published: project.published || null,
    updated: project.updated || null,
    approved: project.approved || null,
    status: project.status || null,
    downloads: project.downloads || 0,
    followers: project.followers || 0,
    categories: project.categories || [],
    additionalCategories: project.additional_categories || [],
    gameVersions: project.game_versions || [],
    loaders: project.loaders || [],
    clientSide: project.client_side || null,
    serverSide: project.server_side || null,
    license: project.license || null,
    issuesUrl: project.issues_url || null,
    sourceUrl: project.source_url || null,
    wikiUrl: project.wiki_url || null,
    discordUrl: project.discord_url || null,
    donationUrls: project.donation_urls || [],
    gallery: project.gallery || [],
    members: members.map(toMemberSummary),
    versions: compatibleVersions.slice(0, Math.max(1, versionLimit)).map(toVersionSummary)
  };
}

async function getProjectReferenceLabel(projectReference, fallbackLabel = null) {
  const normalizedFallback = String(fallbackLabel || projectReference || "").trim();

  try {
    const project = await getProject(projectReference);
    return String(project?.title || project?.slug || normalizedFallback).trim() || normalizedFallback;
  } catch {
    return normalizedFallback;
  }
}

async function getLatestProjectVersion(
  projectReference,
  { loader = null, minecraftVersion = null, projectLabel = null } = {}
) {
  const searchParams = new URLSearchParams();

  if (loader) {
    searchParams.set("loaders", JSON.stringify([loader]));
  }

  if (minecraftVersion) {
    searchParams.set("game_versions", JSON.stringify([minecraftVersion]));
  }

  const versions = await requestJson(
    `${modrinthApiRoot}/project/${encodeURIComponent(projectReference)}/version?${searchParams.toString()}`
  );

  if (!Array.isArray(versions) || versions.length === 0) {
    const displayName = await getProjectReferenceLabel(projectReference, projectLabel);
    throw new Error(
      `Keine kompatible Modrinth-Version für ${displayName} auf Minecraft ${minecraftVersion} gefunden.`
    );
  }

  return [...versions].sort(
    (left, right) => new Date(right.date_published).getTime() - new Date(left.date_published).getTime()
  )[0];
}

async function getVersionById(versionId) {
  return requestJson(`${modrinthApiRoot}/version/${versionId}`);
}

function pickPrimaryFile(version) {
  return version.files.find((file) => file.primary) || version.files[0];
}

async function resolveMod(
  versionReference,
  loader,
  minecraftVersion,
  resolvedVersions,
  visitingProjects,
  {
    selectedProjectIds = new Set(),
    resolvedProjectIds = new Map(),
    isDependency = false
  } = {}
) {
  const key = String(versionReference);

  if (visitingProjects.has(key)) {
    return;
  }

  visitingProjects.add(key);

  const version = key.startsWith("version:")
    ? await getVersionById(key.replace("version:", ""))
    : await getLatestProjectVersion(key, {
      loader,
      minecraftVersion
    });

  const versionProjectId = String(version.project_id || "").trim();

  if (versionProjectId) {
    if (isDependency && selectedProjectIds.has(versionProjectId)) {
      visitingProjects.delete(key);
      return;
    }

    const existingVersionId = resolvedProjectIds.get(versionProjectId);

    if (existingVersionId && existingVersionId !== version.id) {
      visitingProjects.delete(key);
      return;
    }

    resolvedProjectIds.set(versionProjectId, version.id);
  }

  resolvedVersions.set(version.id, version);

  for (const dependency of version.dependencies || []) {
    if (dependency.dependency_type !== "required") {
      continue;
    }

    const dependencyProjectId = String(dependency.project_id || "").trim();

    if (dependencyProjectId && selectedProjectIds.has(dependencyProjectId)) {
      continue;
    }

    if (dependency.version_id) {
      await resolveMod(
        `version:${dependency.version_id}`,
        loader,
        minecraftVersion,
        resolvedVersions,
        visitingProjects,
        {
          selectedProjectIds,
          resolvedProjectIds,
          isDependency: true
        }
      );
      continue;
    }

    if (dependency.project_id) {
      await resolveMod(
        dependency.project_id,
        loader,
        minecraftVersion,
        resolvedVersions,
        visitingProjects,
        {
          selectedProjectIds,
          resolvedProjectIds,
          isDependency: true
        }
      );
    }
  }

  visitingProjects.delete(key);
}

async function resolveModpack(mods, loader, minecraftVersion) {
  const resolvedVersions = new Map();
  const visitingProjects = new Set();
  const selectedEntries = dedupeSelectedProjects(mods, "mod");
  const selectedProjectIds = new Set(
    selectedEntries
      .map((entry) => String(entry?.projectId || "").trim())
      .filter(Boolean)
  );
  const resolvedProjectIds = new Map();

  for (const entry of selectedEntries) {
    await resolveMod(
      getSelectedProjectVersionReference(entry),
      loader,
      minecraftVersion,
      resolvedVersions,
      visitingProjects,
      {
        selectedProjectIds,
        resolvedProjectIds
      }
    );
  }

  return [...resolvedVersions.values()];
}

function isLocalProjectReference(projectReference) {
  return String(projectReference || "").trim().toLowerCase().startsWith("local:");
}

function getSelectedProjectVersionReference(entry) {
  const versionId = String(entry?.versionId || "").trim();

  if (versionId) {
    return `version:${versionId}`;
  }

  return String(entry?.projectId || "").trim();
}

function shouldIgnoreSelectedProjectLookupError(error) {
  return Number(error?.statusCode) === 404;
}

async function resolveLaunchableProjectReferences(selectedProjects, projectType) {
  const selectedEntries = dedupeSelectedProjects(selectedProjects, projectType);
  const launchableProjectReferences = [];

  for (const entry of selectedEntries) {
    const projectReference = String(entry?.projectId || "").trim();

    if (!projectReference || isLocalProjectReference(projectReference)) {
      continue;
    }

    try {
      await getProject(projectReference);
      launchableProjectReferences.push(entry);
    } catch (error) {
      // Skip stale local/non-Modrinth references that ended up in the saved selection.
      if (shouldIgnoreSelectedProjectLookupError(error)) {
        continue;
      }

      throw error;
    }
  }

  return launchableProjectReferences;
}

async function resolveProjectSelections(selectedProjects, projectType, minecraftVersion) {
  const config = getModdingContentConfig(projectType);
  const selectedEntries = projectType === "mod"
    ? await resolvePinnedProjectEntries(selectedProjects, projectType, minecraftVersion, {
        resolveExistingPins: true
      })
    : await resolveLaunchableProjectReferences(selectedProjects, projectType);

  if (!selectedEntries.length) {
    return [];
  }

  if (projectType === "mod") {
    return resolveModpack(
      selectedEntries,
      config.loader,
      minecraftVersion
    );
  }

  return Promise.all(
    selectedEntries.map((entry) => {
      const versionId = String(entry?.versionId || "").trim();

      if (versionId) {
        return getVersionById(versionId);
      }

      return getLatestProjectVersion(entry.projectId, {
        minecraftVersion,
        projectLabel: entry.title || entry.slug || entry.projectId
      });
    })
  );
}

async function copyDirectory(sourceDirectory, destinationDirectory) {
  if (!(await exists(sourceDirectory))) {
    return;
  }

  await ensureDirectory(destinationDirectory);
  const entries = await fs.readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const destinationPath = path.join(destinationDirectory, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await ensureDirectory(path.dirname(destinationPath));
      await fs.copyFile(sourcePath, destinationPath);
    }
  }
}

async function installFabric(runtimeDirectory, runtimeProfile, javaCommand, emitEvent) {
  const distribution =
    fabricDistributions[runtimeProfile.fabricDistribution] ||
    resolveFabricDistribution(runtimeProfile.minecraftVersion);

  emit(emitEvent, "status", `${distribution.installerLabel} wird eingerichtet...`);
  await ensureDirectory(runtimeDirectory);
  await ensureFabricProfileFile(runtimeDirectory);

  const installerVersion = await getLatestFabricInstallerVersion(distribution);
  const tempInstallerPath = path.join(os.tmpdir(), `${distribution.id}-installer-${installerVersion}.jar`);
  const installerUrl = distribution.installerUrl(installerVersion);

  if (!(await exists(tempInstallerPath))) {
    emit(emitEvent, "download", `Lade ${distribution.installerLabel} Installer ${installerVersion}...`);
    await downloadFile(installerUrl, tempInstallerPath);
  }

  await runCommand(
    javaCommand || "java",
    [
      "-jar",
      tempInstallerPath,
      "client",
      "-dir",
      runtimeDirectory,
      "-mcversion",
      runtimeProfile.minecraftVersion,
      "-loader",
      runtimeProfile.fabricLoaderVersion,
      "-launcher",
      "win32"
    ],
    emitEvent
  );

  return {
    installerVersion,
    loaderVersion: runtimeProfile.fabricLoaderVersion,
    distribution: distribution.id,
    fabricVersionId: `fabric-loader-${runtimeProfile.fabricLoaderVersion}-${runtimeProfile.minecraftVersion}`
  };
}

async function downloadManagedContentFiles(
  projectVersions,
  targetDirectory,
  managedStatePath,
  emitEvent,
  itemLabel,
  manifest = null
) {
  await ensureDirectory(targetDirectory);

  const previousManagedFiles = await readManagedFileList(managedStatePath);
  const previousManagedFileNames = new Set(
    previousManagedFiles.map((entry) => entry.toLowerCase())
  );
  const installedFilenames = [];
  const downloadQueue = [];

  for (const version of projectVersions) {
    const primaryFile = pickPrimaryFile(version);

    if (!primaryFile?.url || !primaryFile.filename) {
      throw new Error(`Keine herunterladbare Datei für ${version.name || version.id} gefunden.`);
    }

    const destinationPath = path.join(targetDirectory, primaryFile.filename);
    installedFilenames.push(primaryFile.filename);

    if (
      previousManagedFileNames.has(primaryFile.filename.toLowerCase()) &&
      (await exists(destinationPath))
    ) {
      continue;
    }

    downloadQueue.push({
      destinationPath,
      fileName: primaryFile.filename,
      url: primaryFile.url
    });
  }

  await mapWithConcurrencyLimit(
    downloadQueue,
    resolveManagedContentDownloadConcurrency(manifest),
    async ({ destinationPath, fileName, url }) => {
      emit(emitEvent, "download", `Lade ${itemLabel} ${fileName}...`);
      await downloadFile(url, destinationPath);
    }
  );

  const retainedFileNames = new Set(
    installedFilenames.map((entry) => entry.toLowerCase())
  );

  await Promise.all(
    previousManagedFiles
      .filter((entry) => !retainedFileNames.has(entry.toLowerCase()))
      .map((entry) =>
        fs.rm(path.join(targetDirectory, entry), {
          recursive: true,
          force: true
        })
      )
  );

  await writeJson(managedStatePath, installedFilenames);
}

async function downloadTargetedManagedContentFiles(
  projectVersions,
  targetDirectory,
  emitEvent,
  itemLabel,
  manifest = null
) {
  await ensureDirectory(targetDirectory);

  const installedFilenames = [];
  const downloadQueue = [];
  const seenFileNames = new Set();

  for (const version of projectVersions || []) {
    const primaryFile = pickPrimaryFile(version);

    if (!primaryFile?.url || !primaryFile.filename) {
      throw new Error(`Keine herunterladbare Datei für ${version.name || version.id} gefunden.`);
    }

    const fileNameKey = primaryFile.filename.toLowerCase();

    if (seenFileNames.has(fileNameKey)) {
      continue;
    }

    seenFileNames.add(fileNameKey);
    installedFilenames.push(primaryFile.filename);

    const destinationPath = path.join(targetDirectory, primaryFile.filename);

    if (await exists(destinationPath)) {
      continue;
    }

    downloadQueue.push({
      destinationPath,
      fileName: primaryFile.filename,
      url: primaryFile.url
    });
  }

  await mapWithConcurrencyLimit(
    downloadQueue,
    resolveManagedContentDownloadConcurrency(manifest),
    async ({ destinationPath, fileName, url }) => {
      emit(emitEvent, "download", `Lade ${itemLabel} ${fileName}...`);
      await downloadFile(url, destinationPath);
    }
  );

  return installedFilenames;
}

async function downloadMods(modVersions, modsDirectory, managedModsStatePath, emitEvent, manifest = null) {
  await downloadManagedContentFiles(
    modVersions,
    modsDirectory,
    managedModsStatePath,
    emitEvent,
    "Mod",
    manifest
  );
}

async function downloadProjectFiles(
  projectVersions,
  targetDirectory,
  managedStatePath,
  emitEvent,
  itemLabel,
  manifest = null
) {
  await downloadManagedContentFiles(
    projectVersions,
    targetDirectory,
    managedStatePath,
    emitEvent,
    itemLabel,
    manifest
  );
}

async function readSavedSession(authStatePath) {
  const rawState = await readJson(authStatePath, null);
  return normalizeAuthState(rawState);
}

async function writeSavedSession(authStatePath, session) {
  await writeJson(authStatePath, session);
}

function getActiveStoredAccount(authState) {
  if (!authState.activeAccountId) {
    return null;
  }

  return authState.accounts.find((entry) => entry.account.id === authState.activeAccountId) || null;
}

async function updateAuthState(authStatePath, updater) {
  const currentState = await readSavedSession(authStatePath);
  const nextState = normalizeAuthState(await updater(currentState));
  await writeSavedSession(authStatePath, nextState);
  return nextState;
}

function resolveAuthStatePath(paths, authStatePath = null) {
  return authStatePath || paths.authStatePath;
}

async function resolveMinecraftAuthorization(authStatePath, emitEvent) {
  const savedSession = await readSavedSession(authStatePath);
  const activeEntry = getActiveStoredAccount(savedSession);

  if (!activeEntry?.refreshToken) {
    throw new Error("Bitte zuerst mit einem Microsoft-Konto anmelden.");
  }

  emit(emitEvent, "auth", "Microsoft-Sitzung wird aktualisiert...");
  const authManager = new Auth("select_account");
  authManager.on("load", (_code, message) => emit(emitEvent, "auth", message));

  try {
    const xboxManager = await authManager.refresh(activeEntry.refreshToken);
    const minecraftAccount = await xboxManager.getMinecraft();
    const refreshedEntry = buildStoredAccount(minecraftAccount, xboxManager.save());

    const nextState = await updateAuthState(authStatePath, (currentState) => ({
      activeAccountId: refreshedEntry.account.id,
      accounts: [
        refreshedEntry,
        ...currentState.accounts.filter((entry) => entry.account.id !== refreshedEntry.account.id)
      ]
    }));

    return {
      account: minecraftAccount.profile,
      authorization: minecraftAccount.mclc(),
      accounts: sanitizeAuthState(nextState).accounts
    };
  } catch (error) {
    throw asServiceError(
      error,
      "Microsoft- oder Minecraft-Anmeldung konnte nicht aktualisiert werden."
    );
  }
}

async function resolveRuntimeProfile(settings, manifest, { allowPartial = false } = {}) {
  const minecraftVersion = settings.modding.minecraftVersion || manifest.minecraftVersion;
  const paths = resolvePaths(settings.dataDirectory, manifest);
  const [fabricLoadersResult, requiredJavaVersionResult] = await Promise.allSettled([
    withTimeout(
      getCompatibleFabricLoaders(minecraftVersion, paths.catalogCachePath),
      runtimeProfileTimeoutMs,
      `Fabric-Loader für Minecraft ${minecraftVersion} konnten nicht rechtzeitig geladen werden.`
    ),
    withTimeout(
      getRequiredJavaVersion(minecraftVersion),
      runtimeProfileTimeoutMs,
      `Die Java-Anforderung für Minecraft ${minecraftVersion} konnte nicht rechtzeitig bestimmt werden.`
    )
  ]);
  const fabricLoaders =
    fabricLoadersResult.status === "fulfilled"
      ? fabricLoadersResult.value
      : {
          distribution: resolveFabricDistribution(minecraftVersion),
          loaders: buildFallbackFabricLoaderOptions(settings.modding.fabricLoaderVersion)
        };
  const compatibleFabricLoaders = fabricLoaders.loaders;

  if (!compatibleFabricLoaders.length && !allowPartial) {
    throw (
      fabricLoadersResult.status === "rejected"
        ? fabricLoadersResult.reason
        : new Error(`Keine Fabric-Loader für Minecraft ${minecraftVersion} gefunden.`)
    );
  }

  const explicitMatch = compatibleFabricLoaders.find(
    (entry) => entry.version === settings.modding.fabricLoaderVersion
  );
  const fabricLoaderVersion =
    explicitMatch?.version ||
    compatibleFabricLoaders.find((entry) => entry.stable)?.version ||
    compatibleFabricLoaders[0]?.version ||
    settings.modding.fabricLoaderVersion ||
    null;
  const requiredJavaVersion =
    requiredJavaVersionResult.status === "fulfilled"
      ? requiredJavaVersionResult.value
      : inferRequiredJavaVersion(minecraftVersion);

  return {
    minecraftVersion,
    fabricLoaderVersion,
    fabricDistribution: fabricLoaders.distribution.id,
    requiredJavaVersion,
    availableFabricLoaders: compatibleFabricLoaders,
    error: fabricLoadersResult.status === "rejected" ? getSettledErrorMessage(fabricLoadersResult) : null
  };
}

async function isInstallStateUsable(paths, installState, runtimeProfile, selections = {}) {
  if (!installState) {
    return false;
  }

  const expectedFabricVersionId = buildExpectedFabricVersionId(runtimeProfile);

  if (
    installState.minecraftVersion !== runtimeProfile.minecraftVersion ||
    installState.fabricLoaderVersion !== runtimeProfile.fabricLoaderVersion ||
    installState.fabricVersionId !== expectedFabricVersionId
  ) {
    return false;
  }

  if (!sameSelectedProjects(installState.selectedMods || [], selections.selectedMods || [])) {
    return false;
  }

  if (
    !sameSelectedProjects(
      installState.selectedResourcePacks || [],
      selections.selectedResourcePacks || []
    )
  ) {
    return false;
  }

  if (!sameSelectedProjects(installState.selectedShaderPacks || [], selections.selectedShaderPacks || [])) {
    return false;
  }

  const versionDirectory = path.join(paths.runtimeDirectory, "versions", installState.fabricVersionId);
  const versionJsonPath = path.join(versionDirectory, `${installState.fabricVersionId}.json`);
  const modsDirectory = path.join(paths.instanceDirectory, "mods");
  const resourcePacksDirectory = path.join(paths.instanceDirectory, "resourcepacks");
  const shaderPacksDirectory = path.join(paths.instanceDirectory, "shaderpacks");

  return (
    (await exists(versionJsonPath)) &&
    (await exists(paths.installStatePath)) &&
    (
      await isManagedContentStateUsable(
        modsDirectory,
        paths.managedModsStatePath,
        selections.selectedMods || [],
        paths.managedModsOwnershipStatePath,
        "mod"
      )
    ) &&
    (
      await isManagedContentStateUsable(
        resourcePacksDirectory,
        paths.managedResourcePacksStatePath,
        selections.selectedResourcePacks || [],
        paths.managedResourcePacksOwnershipStatePath,
        "resourcepack"
      )
    ) &&
    (
      await isManagedContentStateUsable(
        shaderPacksDirectory,
        paths.managedShaderPacksStatePath,
        selections.selectedShaderPacks || [],
        paths.managedShaderPacksOwnershipStatePath,
        "shader"
      )
    )
  );
}

function buildExpectedFabricVersionId(runtimeProfile) {
  return `fabric-loader-${runtimeProfile.fabricLoaderVersion}-${runtimeProfile.minecraftVersion}`;
}

function buildLaunchableInstallState(installState, runtimeProfile, javaRuntime = null) {
  return {
    ...(installState || {}),
    minecraftVersion: runtimeProfile.minecraftVersion,
    requiredJavaVersion: runtimeProfile.requiredJavaVersion,
    fabricLoaderVersion: runtimeProfile.fabricLoaderVersion,
    fabricDistribution: runtimeProfile.fabricDistribution,
    fabricVersionId: buildExpectedFabricVersionId(runtimeProfile),
    javaRuntime: installState?.javaRuntime || javaRuntime || null,
    selectedMods: Array.isArray(installState?.selectedMods) ? installState.selectedMods : [],
    selectedResourcePacks: Array.isArray(installState?.selectedResourcePacks)
      ? installState.selectedResourcePacks
      : [],
    selectedShaderPacks: Array.isArray(installState?.selectedShaderPacks)
      ? installState.selectedShaderPacks
      : [],
    installedMods: Array.isArray(installState?.installedMods) ? installState.installedMods : [],
    installedResourcePacks: Array.isArray(installState?.installedResourcePacks)
      ? installState.installedResourcePacks
      : [],
    installedShaderPacks: Array.isArray(installState?.installedShaderPacks)
      ? installState.installedShaderPacks
      : []
  };
}

async function canLaunchExistingInstallation(paths, installState, runtimeProfile) {
  const launchableInstallState = buildLaunchableInstallState(installState, runtimeProfile);
  const versionDirectory = path.join(paths.runtimeDirectory, "versions", launchableInstallState.fabricVersionId);
  const versionJsonPath = path.join(versionDirectory, `${launchableInstallState.fabricVersionId}.json`);

  return (
    (await exists(paths.runtimeDirectory)) &&
    (await exists(paths.instanceDirectory)) &&
    (await exists(versionJsonPath))
  );
}

async function isManagedContentStateUsable(
  directoryPath,
  statePath,
  selectedProjects = [],
  ownershipStatePath = null,
  projectType = "mod"
) {
  if (normalizeProjectIds(selectedProjects).length === 0) {
    return true;
  }

  const [hasDirectory, hasStateFile] = await Promise.all([
    exists(directoryPath),
    exists(statePath)
  ]);

  if (!hasDirectory || !hasStateFile) {
    return false;
  }

  const managedFileNames = await readManagedFileNames(statePath);

  if (!managedFileNames.size) {
    return false;
  }

  if (ownershipStatePath && await exists(ownershipStatePath)) {
    const ownerEntries = await readManagedSelectionOwnerEntries(ownershipStatePath, projectType);
    const ownedFileNames = collectManagedSelectionOwnedFileNames(ownerEntries);

    if (!ownedFileNames.size) {
      return false;
    }

    for (const managedFileName of managedFileNames) {
      if (!ownedFileNames.has(managedFileName)) {
        return false;
      }
    }
  }

  return (await getMissingManagedFileNames(directoryPath, statePath)).length === 0;
}

async function ensureManagedContentState(directoryPath, statePath, selectedProjects = []) {
  if (normalizeProjectIds(selectedProjects).length > 0) {
    return;
  }

  await ensureDirectory(directoryPath);

  if (!(await exists(statePath))) {
    await writeJson(statePath, []);
  }
}

async function ensureReusableInstallationState(paths, selections = {}) {
  await Promise.all([
    ensureManagedContentState(
      path.join(paths.instanceDirectory, "mods"),
      paths.managedModsStatePath,
      selections.selectedMods || []
    ),
    ensureManagedContentState(
      path.join(paths.instanceDirectory, "resourcepacks"),
      paths.managedResourcePacksStatePath,
      selections.selectedResourcePacks || []
    ),
    ensureManagedContentState(
      path.join(paths.instanceDirectory, "shaderpacks"),
      paths.managedShaderPacksStatePath,
      selections.selectedShaderPacks || []
    )
  ]);
}

function describeProgress(payload) {
  const percent = asPercent(payload.task, payload.total);
  const kind = String(payload.type || "download").replace(/-/g, " ");
  const message =
    percent !== null
      ? `${kind}: ${payload.task}/${payload.total} (${percent}%)`
      : `${kind}: ${payload.task}/${payload.total}`;

  return {
    kind,
    percent,
    message
  };
}

function shouldEmitProgressUpdate(progressState, payload, description) {
  const type = String(payload?.type || "download").trim().toLowerCase();
  const task = Number(payload?.task);
  const total = Number(payload?.total);

  if (!Number.isFinite(task) || !Number.isFinite(total) || total <= 0) {
    return true;
  }

  const previousState = progressState.get(type);
  const percentStep = type.startsWith("assets") ? 2 : 1;
  const minimumTaskStep = type.startsWith("assets")
    ? Math.max(24, Math.ceil(total / 80))
    : Math.max(4, Math.ceil(total / 40));
  const shouldEmit =
    task === 0 ||
    task >= total ||
    !previousState ||
    description.percent === null ||
    previousState.percent === null ||
    description.percent >= previousState.percent + percentStep ||
    task >= previousState.task + minimumTaskStep;

  if (shouldEmit) {
    progressState.set(type, {
      percent: description.percent,
      task
    });
  }

  return shouldEmit;
}

function describeDownloadStatus(payload) {
  const percent = asPercent(payload.current, payload.total);
  const currentText = formatBytes(payload.current);
  const totalText = formatBytes(payload.total);
  const sizeText = currentText && totalText ? ` (${currentText} / ${totalText})` : "";
  const message =
    percent !== null
      ? `${payload.name}: ${percent}%${sizeText}`
      : `${payload.name || "Download"}${sizeText}`;

  return {
    percent,
    message
  };
}

function shouldEmitDownloadStatusUpdate(downloadState, payload, description) {
  const name = String(payload?.name || "download").trim().toLowerCase();
  const current = Number(payload?.current);
  const total = Number(payload?.total);

  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return true;
  }

  const previousState = downloadState.get(name);
  const minimumByteStep = Math.max(256 * 1024, Math.ceil(total / 20));
  const shouldEmit =
    current >= total ||
    !previousState ||
    description.percent === null ||
    previousState.percent === null ||
    description.percent >= previousState.percent + 5 ||
    current >= previousState.current + minimumByteStep;

  if (shouldEmit) {
    downloadState.set(name, {
      current,
      percent: description.percent
    });
  }

  return shouldEmit;
}

function resolveLaunchAssetCacheInfo(launchOptions) {
  const assetRoot = path.resolve(
    launchOptions?.overrides?.assetRoot || path.join(launchOptions.root, "assets")
  );
  const assetId = launchOptions?.version?.custom || launchOptions?.version?.number;

  return {
    assetId,
    assetIndexPath: path.join(assetRoot, "indexes", `${assetId}.json`),
    assetObjectsPath: path.join(assetRoot, "objects"),
    assetRoot
  };
}

function hasTrustedAssetCache(launchOptions) {
  const { assetId, assetIndexPath, assetObjectsPath, assetRoot } = resolveLaunchAssetCacheInfo(launchOptions);

  if (!assetId || !existsSync(assetIndexPath) || !safeDirectoryExists(assetObjectsPath)) {
    return false;
  }

  try {
    const index = JSON.parse(readFileSync(assetIndexPath, "utf8"));
    const objects = Object.values(index?.objects || {});

    if (!objects.length) {
      return false;
    }

    const sampleSize = Math.min(24, objects.length);
    const sampleStep = Math.max(1, Math.floor(objects.length / sampleSize));

    for (let indexPosition = 0, checked = 0; indexPosition < objects.length && checked < sampleSize; indexPosition += sampleStep, checked += 1) {
      const hash = String(objects[indexPosition]?.hash || "").trim();

      if (!hash) {
        return false;
      }

      const assetPath = path.join(assetRoot, "objects", hash.slice(0, 2), hash);

      if (!existsSync(assetPath)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function launchClientWithOptimizedAssetCache(launcher, launchOptions, installState) {
  const originalGetAssets = LauncherCoreHandler.prototype.getAssets;
  const canSkipFullAssetScan = hasTrustedAssetCache(launchOptions);

  if (!canSkipFullAssetScan) {
    return launcher.launch(launchOptions);
  }

  LauncherCoreHandler.prototype.getAssets = async function patchedGetAssets(...args) {
    if (!hasTrustedAssetCache(this.options || launchOptions)) {
      return originalGetAssets.apply(this, args);
    }

    this.client.emit(
      "debug",
      "[Boocord]: Vorhandener Asset-Cache erkannt, vollständiger Asset-Scan wird übersprungen."
    );
    this.client.emit("progress", {
      type: "assets",
      task: 1,
      total: 1
    });
    return null;
  };

  try {
    return await launcher.launch(launchOptions);
  } finally {
    LauncherCoreHandler.prototype.getAssets = originalGetAssets;
  }
}

async function buildModdingState(settings, manifest) {
  const runtimeProfile = await resolveRuntimeProfile(settings, manifest, {
    allowPartial: true
  });
  const paths = resolvePaths(settings.dataDirectory, manifest);
  const [
    availableMinecraftVersionsResult,
    modCategoriesResult,
    resourcePackCategoriesResult,
    shaderCategoriesResult,
    selectedModsResult,
    selectedResourcePacksResult,
    selectedShaderPacksResult,
    localModsResult,
    localResourcePacksResult,
    localShaderPacksResult,
    javaRuntimeResult
  ] = await Promise.allSettled([
    withTimeout(
      getAvailableMinecraftVersions(runtimeProfile.minecraftVersion, paths.catalogCachePath),
      moddingCatalogTimeoutMs,
      "Minecraft-Versionen konnten nicht rechtzeitig geladen werden."
    ),
    withTimeout(
      getModrinthCategories("mod"),
      modrinthTagTimeoutMs,
      "Mod-Kategorien konnten nicht rechtzeitig geladen werden."
    ),
    withTimeout(
      getModrinthCategories("resourcepack"),
      modrinthTagTimeoutMs,
      "Resource-Pack-Kategorien konnten nicht rechtzeitig geladen werden."
    ),
    withTimeout(
      getModrinthCategories("shader"),
      modrinthTagTimeoutMs,
      "Shader-Kategorien konnten nicht rechtzeitig geladen werden."
    ),
    withTimeout(
      resolveSelectedProjectsDetails(settings.modding.selectedMods, "mod"),
      selectedProjectDetailsTimeoutMs,
      "Ausgewählte Mods konnten nicht rechtzeitig aufgelöst werden."
    ),
    withTimeout(
      resolveSelectedProjectsDetails(settings.modding.selectedResourcePacks, "resourcepack"),
      selectedProjectDetailsTimeoutMs,
      "Ausgewählte Resource Packs konnten nicht rechtzeitig aufgelöst werden."
    ),
    withTimeout(
      resolveSelectedProjectsDetails(settings.modding.selectedShaderPacks, "shader"),
      selectedProjectDetailsTimeoutMs,
      "Ausgewählte Shader Packs konnten nicht rechtzeitig aufgelöst werden."
    ),
    resolveLocalImportedProjects(paths, "mod"),
    resolveLocalImportedProjects(paths, "resourcepack"),
    resolveLocalImportedProjects(paths, "shader"),
    withTimeout(
      inspectPreferredJavaRuntime(settings, runtimeProfile.requiredJavaVersion),
      javaInspectionTimeoutMs,
      "Die Java-Installation konnte nicht rechtzeitig geprüft werden."
    )
  ]);
  const availableMinecraftVersions = getSettledValue(
    availableMinecraftVersionsResult,
    mergeMinecraftVersionOptions(
      [
        {
          version: runtimeProfile.minecraftVersion,
          date: null,
          major: isMajorMinecraftRelease(runtimeProfile.minecraftVersion)
        }
      ],
      runtimeProfile.minecraftVersion
    )
  );
  const modCategories = getSettledValue(modCategoriesResult, []);
  const resourcePackCategories = getSettledValue(resourcePackCategoriesResult, []);
  const shaderCategories = getSettledValue(shaderCategoriesResult, []);
  const selectedMods = mergeProjectCollections(
    getSettledValue(selectedModsResult, dedupeSelectedProjects(settings.modding.selectedMods || [], "mod")),
    getSettledValue(localModsResult, [])
  );
  const selectedResourcePacks = mergeProjectCollections(
    getSettledValue(
      selectedResourcePacksResult,
      dedupeSelectedProjects(settings.modding.selectedResourcePacks || [], "resourcepack")
    ),
    getSettledValue(localResourcePacksResult, [])
  );
  const selectedShaderPacks = mergeProjectCollections(
    getSettledValue(selectedShaderPacksResult, dedupeSelectedProjects(settings.modding.selectedShaderPacks || [], "shader")),
    getSettledValue(localShaderPacksResult, [])
  );
  const javaRuntime = getSettledValue(
    javaRuntimeResult,
    buildPendingJavaRuntimeState(
      settings,
      runtimeProfile.requiredJavaVersion,
      getSettledErrorMessage(javaRuntimeResult)
    )
  );

  return {
    loading: false,
    minecraftVersion: runtimeProfile.minecraftVersion,
    fabricLoaderVersion: runtimeProfile.fabricLoaderVersion,
    minecraftVersionsLoaded: true,
    fabricLoadersLoaded: true,
    requiredJavaVersion: runtimeProfile.requiredJavaVersion,
    javaRuntime,
    availableMinecraftVersions,
    availableFabricLoaders: runtimeProfile.availableFabricLoaders,
    availableCategoriesByType: {
      mod: modCategories,
      resourcepack: resourcePackCategories,
      shader: shaderCategories
    },
    selectedMods,
    selectedResourcePacks,
    selectedShaderPacks,
    error: runtimeProfile.error || null
  };
}

function buildFastModdingState(
  settings,
  manifest,
  installState = null,
  error = null,
  catalogCache = null,
  localSelections = {}
) {
  const minecraftVersion = settings.modding.minecraftVersion || manifest.minecraftVersion;
  const cachedMinecraftVersions = normalizeCatalogMinecraftVersionOptions(catalogCache?.minecraftVersions);
  const cachedFabricLoaders = normalizeCatalogFabricLoaderOptions(
    catalogCache?.fabricLoadersByVersion?.[minecraftVersion]?.loaders
  );
  const persistedFabricLoaderVersion =
    settings.modding.fabricLoaderVersion || installState?.fabricLoaderVersion || null;
  const fabricLoaderVersion =
    cachedFabricLoaders.find((entry) => entry.version === persistedFabricLoaderVersion)?.version ||
    cachedFabricLoaders.find((entry) => entry.stable)?.version ||
    cachedFabricLoaders[0]?.version ||
    persistedFabricLoaderVersion;
  const requiredJavaVersion =
    installState?.requiredJavaVersion || inferRequiredJavaVersion(minecraftVersion);

  return {
    loading: true,
    minecraftVersion,
    fabricLoaderVersion,
    minecraftVersionsLoaded: false,
    fabricLoadersLoaded: false,
    requiredJavaVersion,
    javaRuntime: buildPendingJavaRuntimeState(settings, requiredJavaVersion, error),
    availableMinecraftVersions: cachedMinecraftVersions.length
      ? mergeMinecraftVersionOptions(cachedMinecraftVersions, minecraftVersion)
      : [
          {
            version: minecraftVersion,
            date: null,
            major: true
          }
        ],
    availableFabricLoaders: cachedFabricLoaders.length
      ? cachedFabricLoaders
      : fabricLoaderVersion
        ? [
            {
              version: fabricLoaderVersion,
              stable: true
            }
          ]
        : [],
    availableCategoriesByType: {
      mod: [],
      resourcepack: [],
      shader: []
    },
    selectedMods: mergeProjectCollections(
      dedupeSelectedProjects(settings.modding.selectedMods || [], "mod"),
      localSelections.mod || []
    ),
    selectedResourcePacks: mergeProjectCollections(
      dedupeSelectedProjects(settings.modding.selectedResourcePacks || [], "resourcepack"),
      localSelections.resourcepack || []
    ),
    selectedShaderPacks: mergeProjectCollections(
      dedupeSelectedProjects(settings.modding.selectedShaderPacks || [], "shader"),
      localSelections.shader || []
    ),
    error: error || null
  };
}

async function saveLauncherSettings({ userDataPath, fallbackMinecraftDirectory, options = {} }) {
  const manifest = loadManifest();
  const currentSettings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  let nextSettings = mergeSettings(currentSettings, options, manifest, userDataPath);

  delete nextSettings.minimizeGameOnLaunch;

  if (nextSettings.modding.fabricLoaderVersion === "") {
    nextSettings.modding.fabricLoaderVersion = null;
  }

  if (options.modding?.minecraftVersion || options.modding?.fabricLoaderVersion === null) {
    const paths = resolvePaths(nextSettings.dataDirectory, manifest);
    nextSettings.modding.fabricLoaderVersion = await resolvePreferredFabricLoaderVersion(
      nextSettings.modding.minecraftVersion,
      nextSettings.modding.fabricLoaderVersion,
      paths.catalogCachePath
    );
  }

  const runtimeProfile = await resolveRuntimeProfile(nextSettings, manifest);
  nextSettings = await applyManagedJavaSettings(nextSettings, runtimeProfile);

  await writeSettings(userDataPath, nextSettings);
  return {
    ok: true,
    settings: nextSettings
  };
}

async function appendManagedImportedFileNames(managedStatePath, fileNames) {
  const storedEntries = await readJson(managedStatePath, []);
  const fileNamesByKey = new Map();

  for (const entry of Array.isArray(storedEntries) ? storedEntries : []) {
    const normalizedEntry = String(entry || "").trim();

    if (!normalizedEntry) {
      continue;
    }

    fileNamesByKey.set(normalizedEntry.toLowerCase(), normalizedEntry);
  }

  for (const entry of fileNames || []) {
    const normalizedEntry = String(entry || "").trim();

    if (!normalizedEntry) {
      continue;
    }

    fileNamesByKey.set(normalizedEntry.toLowerCase(), normalizedEntry);
  }

  await ensureDirectory(path.dirname(managedStatePath));
  await writeJson(
    managedStatePath,
    [...fileNamesByKey.values()].sort((left, right) => left.localeCompare(right, "de", { sensitivity: "base" }))
  );
}

async function removeManagedFileNames(managedStatePath, fileNames) {
  const removedFileNames = new Set(
    (fileNames || [])
      .map((entry) => String(entry || "").trim().toLowerCase())
      .filter(Boolean)
  );

  if (!removedFileNames.size) {
    return;
  }

  const storedEntries = await readJson(managedStatePath, []);
  const nextEntries = [];

  for (const entry of Array.isArray(storedEntries) ? storedEntries : []) {
    const normalizedEntry = String(entry || "").trim();

    if (!normalizedEntry || removedFileNames.has(normalizedEntry.toLowerCase())) {
      continue;
    }

    nextEntries.push(normalizedEntry);
  }

  await ensureDirectory(path.dirname(managedStatePath));
  await writeJson(
    managedStatePath,
    nextEntries.sort((left, right) => left.localeCompare(right, "de", { sensitivity: "base" }))
  );
}

async function removeManagedContentFiles(targetDirectory, fileNames) {
  const normalizedFileNames = [...new Set(
    (fileNames || [])
      .map((entry) => path.basename(String(entry || "").trim()))
      .filter(Boolean)
  )];

  await Promise.all(
    normalizedFileNames.map((fileName) =>
      fs.rm(path.join(targetDirectory, fileName), {
        recursive: true,
        force: true
      })
    )
  );
}

async function updateStoredInstallStateForProjectType(paths, settings, projectType = "mod") {
  if (!(await exists(paths.installStatePath))) {
    return null;
  }

  const installState = await readJson(paths.installStatePath, null);

  if (!installState || typeof installState !== "object") {
    return null;
  }

  const config = getModdingContentConfig(projectType);
  const { selectedKey, displayKey, installedKey } = getInstallStatePropertyNames(projectType);
  const nextSelection = dedupeSelectedProjects(settings?.modding?.[config.selectionKey] || [], projectType);
  const nextManagedFiles = await readManagedFileList(resolveManagedStatePathForProjectType(paths, projectType));
  const nextInstallState = {
    ...installState,
    [selectedKey]: nextSelection,
    [displayKey]: nextSelection,
    [installedKey]: nextManagedFiles
  };

  await writeJson(paths.installStatePath, nextInstallState);
  return nextInstallState;
}

function getSelectedProjectMutationLockKey(userDataPath, projectType = "mod") {
  return `modding-selection:${path.resolve(String(userDataPath || ""))}:${String(projectType || "mod")}`;
}

function toSelectedProjectFromImportedMatch(project, fallbackProjectType = "mod") {
  return sanitizeSelectedProjectEntry(
    {
      projectId: project.linkedProjectId || project.projectId,
      slug: project.linkedProjectSlug || project.slug || null,
      title: project.title || null,
      description: project.description || null,
      iconUrl: project.iconUrl || null,
      projectType: project.projectType || fallbackProjectType,
      clientSide: project.clientSide || null,
      serverSide: project.serverSide || null,
      versionId: project.linkedVersionId || null,
      versionNumber: project.linkedVersionNumber || null,
      manualSelection: false,
      localImportFileNames: project.localFileName ? [project.localFileName] : []
    },
    fallbackProjectType
  );
}

function toSelectedProjectFromLocalImport(project, fallbackProjectType = "mod") {
  const projectType = project?.projectType || fallbackProjectType;
  const localFileName = path.basename(String(project?.localFileName || "").trim());

  if (!localFileName) {
    return null;
  }

  return sanitizeSelectedProjectEntry(
    {
      projectId: toLocalProjectReference(localFileName, projectType),
      slug: null,
      title: project?.title || localFileName,
      description:
        project?.description ||
        (project?.localPath && path.extname(localFileName)
          ? "Lokal importierte Datei."
          : "Lokal importierter Ordner."),
      iconUrl: project?.iconUrl || null,
      projectType,
      manualSelection: false,
      isLocalOnly: true,
      localFileName,
      localImportFileNames: [localFileName]
    },
    fallbackProjectType
  );
}

function reconcileSelectedProjectImports(selectedProjects, importedProjects, projectType = "mod") {
  const importedFileNamesByProjectId = new Map();
  const importedProjectFileNames = new Set();

  for (const project of importedProjects || []) {
    const projectId = String(project?.linkedProjectId || "").trim();
    const localFileName = path.basename(String(project?.localFileName || "").trim());

    if (localFileName) {
      importedProjectFileNames.add(localFileName.toLowerCase());
    }

    if (!projectId || !localFileName) {
      continue;
    }

    const existingEntries = importedFileNamesByProjectId.get(projectId) || [];
    existingEntries.push(localFileName);
    importedFileNamesByProjectId.set(projectId, existingEntries);
  }

  return dedupeSelectedProjects(
    (selectedProjects || []).map((entry) => {
      const normalized = sanitizeSelectedProjectEntry(entry, projectType);

      if (!normalized) {
        return null;
      }

      if (normalized.isLocalOnly || isLocalProjectReference(normalized.projectId)) {
        const remainingTrackedFileNames = normalizeSelectedProjectLocalImportFileNames(
          (normalized.localImportFileNames || []).filter((entryName) =>
            importedProjectFileNames.has(String(entryName || "").trim().toLowerCase())
          )
        );

        if (!remainingTrackedFileNames.length) {
          return null;
        }

        return {
          ...normalized,
          localFileName: remainingTrackedFileNames[0] || normalized.localFileName || null,
          localImportFileNames: remainingTrackedFileNames
        };
      }

      const hadTrackedLocalImports = normalized.localImportFileNames.length > 0;
      const nextLocalImportFileNames = normalizeSelectedProjectLocalImportFileNames(
        importedFileNamesByProjectId.get(normalized.projectId) || []
      );

      if (!normalized.manualSelection && hadTrackedLocalImports && !nextLocalImportFileNames.length) {
        return null;
      }

      return {
        ...normalized,
        localImportFileNames: nextLocalImportFileNames
      };
    }).filter(Boolean),
    projectType
  );
}

async function adoptImportedProjectMatches({
  userDataPath,
  fallbackMinecraftDirectory,
  projectType = "mod"
}) {
  const config = getModdingContentConfig(projectType);
  const manifest = loadManifest();
  const currentSettings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  const paths = resolvePaths(currentSettings.dataDirectory, manifest);
  const managedStatePath = resolveManagedStatePathForProjectType(paths, projectType);
  const importedProjects = await resolveLocalImportedProjects(paths, projectType, {
    includeManaged: true
  });
  const matchedImportedProjects = importedProjects.filter(
    (entry) =>
      entry.linkedProjectId &&
      entry.localFileName
  );
  const matchedImportedFileNames = matchedImportedProjects.map((entry) => entry.localFileName);

  if (!matchedImportedProjects.length) {
    return {
      ok: true,
      adoptedCount: 0,
      settings: currentSettings
    };
  }

  const nextSelections = dedupeSelectedProjects(
    [
      ...(currentSettings.modding?.[config.selectionKey] || [])
        .map((entry) => removeSelectedProjectLocalImportFileNames(entry, matchedImportedFileNames, projectType))
        .filter(Boolean),
      ...matchedImportedProjects
        .map((project) => toSelectedProjectFromImportedMatch(project, projectType))
        .filter(Boolean)
    ],
    projectType
  );
  let nextSettings = currentSettings;

  if (!sameSelectedProjects(currentSettings.modding?.[config.selectionKey] || [], nextSelections)) {
    nextSettings = mergeSettings(
      currentSettings,
      {
        modding: {
          [config.selectionKey]: nextSelections
        }
      },
      manifest,
      userDataPath
    );

    await writeSettings(userDataPath, nextSettings);
  }

  await appendManagedImportedFileNames(
    managedStatePath,
    matchedImportedProjects.map((entry) => entry.localFileName)
  );

  return {
    ok: true,
    adoptedCount: matchedImportedProjects.length,
    settings: nextSettings
  };
}

async function reconcileImportedProjectMatchesForType({
  userDataPath,
  fallbackMinecraftDirectory,
  projectType = "mod",
  currentSettings = null
}) {
  const config = getModdingContentConfig(projectType);
  const manifest = loadManifest();
  const settings = currentSettings || await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  const paths = resolvePaths(settings.dataDirectory, manifest);
  const importedProjects = await resolveLocalImportedProjects(paths, projectType, {
    includeManaged: true
  });
  const nextSelections = reconcileSelectedProjectImports(
    settings.modding?.[config.selectionKey] || [],
    importedProjects,
    projectType
  );
  const currentSelection = dedupeSelectedProjects(settings.modding?.[config.selectionKey] || [], projectType);
  const nextSelectionWithMetadata = dedupeSelectedProjects(nextSelections, projectType);

  if (JSON.stringify(currentSelection) === JSON.stringify(nextSelectionWithMetadata)) {
    return settings;
  }

  const nextSettings = mergeSettings(
    settings,
    {
      modding: {
        [config.selectionKey]: nextSelections
      }
    },
    manifest,
    userDataPath
  );

  await writeSettings(userDataPath, nextSettings);
  return nextSettings;
}

async function syncImportedProjectMatchesForProfile({
  userDataPath,
  fallbackMinecraftDirectory,
  projectTypes = ["mod", "resourcepack", "shader"]
}) {
  let nextSettings = null;

  for (const projectType of projectTypes) {
    nextSettings = await reconcileImportedProjectMatchesForType({
      userDataPath,
      fallbackMinecraftDirectory,
      projectType,
      currentSettings: nextSettings
    });
  }

  if (nextSettings) {
    return nextSettings;
  }

  const manifest = loadManifest();
  return readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
}

async function syncManagedSelectionForProjectTypes({
  settings,
  manifest,
  paths,
  projectTypes = []
}) {
  const nextProjectTypes = [...new Set(
    (projectTypes || []).map((entry) => String(entry || "").trim()).filter(Boolean)
  )];

  if (!nextProjectTypes.length) {
    return null;
  }

  const currentInstallState = await readJson(paths.installStatePath, null);

  if (!currentInstallState && !(await exists(paths.instanceDirectory))) {
    return null;
  }

  const runtimeProfile = await resolveRuntimeProfile(settings, manifest);

  return syncManagedSelectionInstallState({
    settings,
    manifest,
    paths,
    runtimeProfile,
    installState: currentInstallState,
    projectTypes: nextProjectTypes
  });
}

async function addSelectedProject({
  userDataPath,
  fallbackMinecraftDirectory,
  projectId,
  projectType = "mod",
  projectSnapshot = null,
  versionId = null,
  versionNumber = null,
  versionName = null,
  versionType = null
}) {
  const config = getModdingContentConfig(projectType);
  const manifest = loadManifest();
  return withFileMutationLock(getSelectedProjectMutationLockKey(userDataPath, projectType), async () => {
    const currentSettings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
    const project = projectSnapshot
      ? {
          id: projectSnapshot.projectId || projectId,
          slug: projectSnapshot.slug || null,
          title: projectSnapshot.title || projectSnapshot.slug || projectId,
          description: projectSnapshot.description || null,
          icon_url: projectSnapshot.iconUrl || null,
          project_type: projectSnapshot.projectType || projectType,
          client_side: projectSnapshot.clientSide || null,
          server_side: projectSnapshot.serverSide || null,
          project_url: projectSnapshot.projectUrl || null
        }
      : await getProject(projectId);
    const paths = resolvePaths(currentSettings.dataDirectory, manifest);
    const targetDirectory = path.join(paths.instanceDirectory, config.directoryName);
    const managedStatePath = resolveManagedStatePathForProjectType(paths, projectType);
    const ownershipStatePath = resolveManagedOwnershipStatePathForProjectType(paths, projectType);
    const minecraftVersion = currentSettings.modding.minecraftVersion || manifest.minecraftVersion;
    const currentSelections = currentSettings.modding[config.selectionKey] || [];
    const existingEntry = currentSelections.find((entry) =>
      projectEntryMatchesReference(entry, project, projectType)
    );
    let ownerEntries = await readManagedSelectionOwnerEntries(ownershipStatePath, projectType);

    if (existingEntry && findManagedSelectionOwnerIndex(ownerEntries, existingEntry, projectType) === -1) {
      ownerEntries = await populateMissingManagedSelectionOwnerEntries(
        ownerEntries,
        currentSelections,
        projectType,
        minecraftVersion
      );
    }

    const nextProjectEntry =
      mergeSelectedProjectEntries(
        existingEntry,
        {
          ...toSelectedProject(project),
          manualSelection: true,
          versionId: versionId || null,
          versionNumber: versionNumber || null,
          versionName: versionName || null,
          versionType: versionType || null,
          versionLocked: Boolean(versionId)
        },
        projectType
      ) ||
      {
        ...toSelectedProject(project),
        manualSelection: true,
        versionId: versionId || null,
        versionNumber: versionNumber || null,
        versionName: versionName || null,
        versionType: versionType || null,
        versionLocked: Boolean(versionId)
      };
    const resolvedVersions = await resolveProjectSelections([nextProjectEntry], projectType, minecraftVersion);
    const nextOwnedFileNames = await downloadTargetedManagedContentFiles(
      resolvedVersions,
      targetDirectory,
      null,
      config.fallbackLabel,
      manifest
    );
    const existingOwnerIndex = findManagedSelectionOwnerIndex(ownerEntries, existingEntry || project, projectType);
    const existingOwner = existingOwnerIndex === -1 ? null : ownerEntries[existingOwnerIndex];
    const nextSelections = dedupeSelectedProjects(
      [
        ...currentSelections.filter((entry) => !projectEntryMatchesReference(entry, project, projectType)),
        nextProjectEntry
      ],
      projectType
    );
    const nextSettings = mergeSettings(
      currentSettings,
      {
        modding: {
          [config.selectionKey]: nextSelections
        }
      },
      manifest,
      userDataPath
    );
    const nextOwnerEntry = buildManagedSelectionOwnerEntry(nextProjectEntry, projectType, resolvedVersions);
    const nextOwnerEntries = mergeManagedSelectionOwnerEntries(
      [
        ...ownerEntries.filter((_, index) => index !== existingOwnerIndex),
        nextOwnerEntry
      ].filter(Boolean),
      projectType
    );
    const retainedManagedFileNames = collectManagedSelectionOwnedFileNames(nextOwnerEntries);
    const previousTrackedFileNames = normalizeSelectedProjectLocalImportFileNames([
      ...(existingOwner?.files || []),
      existingEntry?.localFileName,
      ...(existingEntry?.localImportFileNames || [])
    ]);
    const obsoleteManagedFileNames = previousTrackedFileNames.filter((fileName) => {
      const fileNameKey = String(fileName || "").trim().toLowerCase();
      return fileNameKey && !retainedManagedFileNames.has(fileNameKey);
    });

    await appendManagedImportedFileNames(managedStatePath, nextOwnedFileNames);

    if (obsoleteManagedFileNames.length) {
      await removeManagedContentFiles(targetDirectory, obsoleteManagedFileNames);
      await removeManagedFileNames(managedStatePath, obsoleteManagedFileNames);
    }

    await writeManagedSelectionOwnerEntries(ownershipStatePath, nextOwnerEntries, projectType);
    await writeSettings(userDataPath, nextSettings);
    await updateStoredInstallStateForProjectType(paths, nextSettings, projectType);

    return {
      ok: true,
      settings: nextSettings,
      selectedProjects: nextSettings.modding[config.selectionKey] || []
    };
  });
}

async function removeSelectedProject({
  userDataPath,
  fallbackMinecraftDirectory,
  projectId,
  projectType = "mod",
  projectSnapshot = null
}) {
  const config = getModdingContentConfig(projectType);
  const manifest = loadManifest();
  return withFileMutationLock(getSelectedProjectMutationLockKey(userDataPath, projectType), async () => {
    const currentSettings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
    const paths = resolvePaths(currentSettings.dataDirectory, manifest);
    const managedStatePath = resolveManagedStatePathForProjectType(paths, projectType);
    const ownershipStatePath = resolveManagedOwnershipStatePathForProjectType(paths, projectType);
    const targetDirectory = path.join(paths.instanceDirectory, config.directoryName);
    const minecraftVersion = currentSettings.modding.minecraftVersion || manifest.minecraftVersion;
    const project = projectSnapshot
      ? {
          id: projectSnapshot.projectId || projectId,
          slug: projectSnapshot.slug || null,
          title: projectSnapshot.title || projectSnapshot.slug || projectId,
          description: projectSnapshot.description || null,
          icon_url: projectSnapshot.iconUrl || null,
          project_type: projectSnapshot.projectType || projectType,
          client_side: projectSnapshot.clientSide || null,
          server_side: projectSnapshot.serverSide || null
        }
      : await getProject(projectId).catch(() => null);
    const requestedLocalFileNames = normalizeSelectedProjectLocalImportFileNames([
      projectSnapshot?.localFileName,
      ...(projectSnapshot?.localImportFileNames || [])
    ]);
    const requestedLocalFileNameKeys = new Set(
      requestedLocalFileNames.map((entry) => entry.toLowerCase())
    );
    const currentSelections = currentSettings.modding[config.selectionKey] || [];
    let ownerEntries = await readManagedSelectionOwnerEntries(ownershipStatePath, projectType);
    ownerEntries = await populateMissingManagedSelectionOwnerEntries(
      ownerEntries,
      currentSelections,
      projectType,
      minecraftVersion
    );

    const matchingImportedProjects = (await resolveLocalImportedProjects(paths, projectType, {
      includeManaged: true
    })).filter((entry) =>
      requestedLocalFileNameKeys.has(path.basename(String(entry?.localFileName || "").trim()).toLowerCase()) ||
      projectEntryMatchesReference(
        {
          projectId: entry.linkedProjectId || null,
          slug: entry.linkedProjectSlug || null
        },
        project || projectId,
        projectType
      )
    );
    const matchingImportedFileNames = normalizeSelectedProjectLocalImportFileNames([
      ...requestedLocalFileNames,
      ...matchingImportedProjects.map((entry) => entry.localFileName)
    ]);
    const nextSelections = dedupeSelectedProjects(
      currentSelections
        .map((entry) => {
          if (projectEntryMatchesReference(entry, project || projectId, projectType)) {
            return null;
          }

          return removeSelectedProjectLocalImportFileNames(entry, matchingImportedFileNames, projectType);
        })
        .filter(Boolean),
      projectType
    );
    const nextSettings = mergeSettings(
      currentSettings,
      {
        modding: {
          [config.selectionKey]: nextSelections
        }
      },
      manifest,
      userDataPath
    );
    const removedOwners = ownerEntries.filter((entry) =>
      projectEntryMatchesReference(entry, project || projectId, projectType)
    );
    const nextOwnerEntries = mergeManagedSelectionOwnerEntries(
      ownerEntries.filter((entry) =>
        nextSelections.some((selection) => projectEntryMatchesReference(entry, selection, projectType))
      ),
      projectType
    );
    const retainedManagedFileNames = collectManagedSelectionOwnedFileNames(nextOwnerEntries);
    const removedManagedFileNames = [...new Set(
      removedOwners.flatMap((entry) => entry?.files || [])
    )];
    const obsoleteManagedFileNames = removedManagedFileNames.filter(
      (fileName) => !retainedManagedFileNames.has(String(fileName || "").trim().toLowerCase())
    );

    await removeManagedContentFiles(targetDirectory, [
      ...obsoleteManagedFileNames,
      ...matchingImportedFileNames
    ]);
    await removeManagedFileNames(managedStatePath, [
      ...obsoleteManagedFileNames,
      ...matchingImportedFileNames
    ]);
    await writeManagedSelectionOwnerEntries(ownershipStatePath, nextOwnerEntries, projectType);
    await writeSettings(userDataPath, nextSettings);
    await updateStoredInstallStateForProjectType(paths, nextSettings, projectType);

    return {
      ok: true,
      settings: nextSettings,
      selectedProjects: nextSettings.modding[config.selectionKey] || []
    };
  });
}

async function importLocalProjects({
  userDataPath,
  fallbackMinecraftDirectory,
  projectType = "mod",
  sourcePaths = []
}) {
  const config = getModdingContentConfig(projectType);
  const manifest = loadManifest();
  const currentSettings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  const paths = resolvePaths(currentSettings.dataDirectory, manifest);
  const targetDirectory = path.join(paths.instanceDirectory, config.directoryName);
  const managedStatePath = resolveManagedStatePathForProjectType(paths, projectType);
  const normalizedSourcePaths = [...new Set(
    (sourcePaths || []).map((entry) => path.resolve(String(entry || "").trim())).filter(Boolean)
  )];

  if (!normalizedSourcePaths.length) {
    throw new Error("Keine Dateien oder Ordner zum Importieren ausgewählt.");
  }

  await ensureDirectory(targetDirectory);
  const importedFileNames = [];

  for (const sourcePath of normalizedSourcePaths) {
    if (!(await exists(sourcePath))) {
      throw new Error(`Importquelle wurde nicht gefunden: ${sourcePath}`);
    }

    const sourceStat = await fs.stat(sourcePath);

    if (!sourceStat.isDirectory() && !sourceStat.isFile()) {
      throw new Error(`Nicht unterstützte Importquelle: ${sourcePath}`);
    }

    const entryName = path.basename(sourcePath);

    if (!entryName || entryName.startsWith(".")) {
      throw new Error(`Ungültiger Importname: ${sourcePath}`);
    }

    if (!isSupportedLocalImport(projectType, entryName, sourceStat.isDirectory())) {
      throw new Error(getLocalImportErrorMessage(projectType));
    }

    const targetPath = path.join(targetDirectory, entryName);
    const resolvedTargetDirectory = path.resolve(targetDirectory);
    const resolvedTargetPath = path.resolve(targetPath);

    if (
      resolvedTargetPath !== resolvedTargetDirectory &&
      !resolvedTargetPath.startsWith(`${resolvedTargetDirectory}${path.sep}`)
    ) {
      throw new Error("Ungültiger Pfad für lokalen Inhalt.");
    }

    if (path.resolve(sourcePath) !== resolvedTargetPath) {
      await fs.rm(resolvedTargetPath, {
        recursive: true,
        force: true
      });

      if (sourceStat.isDirectory()) {
        await copyDirectory(sourcePath, resolvedTargetPath);
      } else {
        await ensureDirectory(path.dirname(resolvedTargetPath));
        await fs.copyFile(sourcePath, resolvedTargetPath);
      }
    }

    importedFileNames.push(entryName);
  }

  await removeManagedFileNames(managedStatePath, importedFileNames);
  const adoptionResult = await adoptImportedProjectMatches({
    userDataPath,
    fallbackMinecraftDirectory,
    projectType
  });
  const importedProjectByFileName = new Map(
    (await resolveLocalImportedProjects(paths, projectType, { includeManaged: true }))
      .filter((entry) => importedFileNames.includes(entry.localFileName))
      .map((entry) => [String(entry.localFileName || "").trim().toLowerCase(), entry])
  );
  const explicitLocalSelections = importedFileNames
    .map((fileName) => importedProjectByFileName.get(String(fileName || "").trim().toLowerCase()) || null)
    .filter((entry) => entry && !entry.linkedProjectId)
    .map((entry) => toSelectedProjectFromLocalImport(entry, projectType))
    .filter(Boolean);
  let nextSettings = adoptionResult.settings || currentSettings;

  if (explicitLocalSelections.length) {
    nextSettings = mergeSettings(
      nextSettings,
      {
        modding: {
          [config.selectionKey]: dedupeSelectedProjects(
            [
              ...(nextSettings.modding?.[config.selectionKey] || []),
              ...explicitLocalSelections
            ],
            projectType
          )
        }
      },
      manifest,
      userDataPath
    );
    await writeSettings(userDataPath, nextSettings);
  }

  return {
    ok: true,
    importedCount: importedFileNames.length,
    importedFileNames: importedFileNames.sort((left, right) => left.localeCompare(right, "de", { sensitivity: "base" })),
    adoptedCount: adoptionResult.adoptedCount || 0,
    settings: nextSettings
  };
}

async function removeLocalImportedProject({
  userDataPath,
  fallbackMinecraftDirectory,
  projectType = "mod",
  localFileName
}) {
  const config = getModdingContentConfig(projectType);
  const manifest = loadManifest();
  return withFileMutationLock(getSelectedProjectMutationLockKey(userDataPath, projectType), async () => {
    const currentSettings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  const paths = resolvePaths(currentSettings.dataDirectory, manifest);
  const targetDirectory = path.join(paths.instanceDirectory, config.directoryName);
  const normalizedFileName = path.basename(String(localFileName || "").trim());

  if (!normalizedFileName) {
    throw new Error("Lokaler Inhalt konnte nicht entfernt werden.");
  }

  const targetPath = path.join(targetDirectory, normalizedFileName);
  const resolvedTargetDirectory = path.resolve(targetDirectory);
  const resolvedTargetPath = path.resolve(targetPath);

  if (
    resolvedTargetPath !== resolvedTargetDirectory &&
    !resolvedTargetPath.startsWith(`${resolvedTargetDirectory}${path.sep}`)
  ) {
    throw new Error("Ungültiger Pfad für lokalen Inhalt.");
  }

  const importedProjects = await resolveLocalImportedProjects(paths, projectType, {
    includeManaged: true
  });
  const removedImportedProject = importedProjects.find(
    (entry) => path.basename(String(entry?.localFileName || "").trim()).toLowerCase() === normalizedFileName.toLowerCase()
  );

  await fs.rm(resolvedTargetPath, {
    recursive: true,
    force: true
  });
  await removeManagedFileNames(
    resolveManagedStatePathForProjectType(paths, projectType),
    [normalizedFileName]
  );

  const localProjectReference = toLocalProjectReference(normalizedFileName, projectType);
  const nextSelections = dedupeSelectedProjects(
    (currentSettings.modding?.[config.selectionKey] || []).map((entry) => {
      const normalizedEntry = sanitizeSelectedProjectEntry(entry, projectType);

      if (!normalizedEntry) {
        return null;
      }

      const isMatchingLocalEntry =
        (normalizedEntry.isLocalOnly || isLocalProjectReference(normalizedEntry.projectId)) &&
        (
          String(normalizedEntry.localFileName || "").trim().toLowerCase() === normalizedFileName.toLowerCase() ||
          String(normalizedEntry.projectId || "").trim().toLowerCase() === localProjectReference
        );

      if (isMatchingLocalEntry) {
        return null;
      }

      if (
        removedImportedProject?.linkedProjectId &&
        normalizedEntry.projectId === removedImportedProject.linkedProjectId
      ) {
        const remainingLinkedFileNames = normalizeSelectedProjectLocalImportFileNames(
          importedProjects
            .filter((entry) =>
              entry !== removedImportedProject &&
              String(entry?.linkedProjectId || "").trim() === String(removedImportedProject.linkedProjectId || "").trim()
            )
            .map((entry) => entry.localFileName)
        );
        const remainingTrackedFileNames = normalizeSelectedProjectLocalImportFileNames([
          ...(normalizedEntry.localImportFileNames || []).filter(
            (entryName) => entryName.toLowerCase() !== normalizedFileName.toLowerCase()
          ),
          ...remainingLinkedFileNames
        ]);

        if (!normalizedEntry.manualSelection && !remainingTrackedFileNames.length) {
          return null;
        }

        return {
          ...normalizedEntry,
          localImportFileNames: remainingTrackedFileNames
        };
      }

      return normalizedEntry;
    }).filter(Boolean),
    projectType
  );
  const nextSettings = mergeSettings(
    currentSettings,
    {
      modding: {
        [config.selectionKey]: nextSelections
      }
    },
    manifest,
    userDataPath
  );
  await writeSettings(userDataPath, nextSettings);
  await updateStoredInstallStateForProjectType(paths, nextSettings, projectType);

  return {
    ok: true,
    removedPath: resolvedTargetPath,
    settings: nextSettings,
    selectedProjects: nextSettings.modding[config.selectionKey] || []
  };
  });
}

async function addSelectedMod(options) {
  return addSelectedProject({
    ...options,
    projectType: "mod"
  });
}

async function removeSelectedMod(options) {
  return removeSelectedProject({
    ...options,
    projectType: "mod"
  });
}

async function loginWithMicrosoft({
  parentWindow,
  userDataPath,
  fallbackMinecraftDirectory,
  authStatePath = null,
  options = {},
  emit: emitEvent
}) {
  const manifest = loadManifest();
  const settings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  const nextSettings = mergeSettings(settings, options, manifest, userDataPath);
  await writeSettings(userDataPath, nextSettings);

  const paths = resolvePaths(nextSettings.dataDirectory, manifest, authStatePath);
  await ensureDirectory(paths.dataDirectory);

  emit(emitEvent, "auth", "Microsoft-Login wird gestartet...");
  const authManager = new Auth("select_account");
  authManager.on("load", (_code, message) => emit(emitEvent, "auth", message));
  let xboxManager;

  try {
    xboxManager = await authManager.launch("electron", {
      width: 520,
      height: 740,
      parent: parentWindow,
      modal: true,
      resizable: false,
      title: nextSettings.language === "en" ? "Microsoft Login" : "Microsoft-Login"
    });
  } catch (error) {
    if (isLoginGuiClosedError(error)) {
      throw createLoginAbortedError();
    }

    throw error;
  }

  const minecraftAccount = await xboxManager.getMinecraft();
  const session = buildStoredAccount(minecraftAccount, xboxManager.save());
  const nextAuthState = await updateAuthState(paths.authStatePath, (currentState) => ({
    activeAccountId: session.account.id,
    accounts: [
      session,
      ...currentState.accounts.filter((entry) => entry.account.id !== session.account.id)
    ]
  }));
  emit(emitEvent, "auth", `Angemeldet als ${minecraftAccount.profile.name}.`);

  return {
    ok: true,
    account: withAccountAvatar(session.account),
    accounts: sanitizeAuthState(nextAuthState).accounts,
    settings: nextSettings
  };
}

async function switchAccount({
  userDataPath,
  fallbackMinecraftDirectory,
  authStatePath = null,
  options = {}
}) {
  const manifest = loadManifest();
  const settings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  const nextSettings = mergeSettings(settings, options, manifest, userDataPath);
  await writeSettings(userDataPath, nextSettings);

  const paths = resolvePaths(nextSettings.dataDirectory, manifest, authStatePath);
  const nextAuthState = await updateAuthState(resolveAuthStatePath(paths, authStatePath), (currentState) => {
    const targetId = options.accountId;
    const targetAccount = currentState.accounts.find((entry) => entry.account.id === targetId);

    if (!targetAccount) {
      throw new Error("Account wurde nicht gefunden.");
    }

    return {
      activeAccountId: targetId,
      accounts: currentState.accounts
    };
  });

  return {
    ok: true,
    account: withAccountAvatar(getActiveStoredAccount(nextAuthState)?.account || null),
    accounts: sanitizeAuthState(nextAuthState).accounts,
    settings: nextSettings
  };
}

async function logout({
  userDataPath,
  fallbackMinecraftDirectory,
  authStatePath = null,
  options = {}
}) {
  const manifest = loadManifest();
  const settings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  const nextSettings = mergeSettings(settings, options, manifest, userDataPath);
  await writeSettings(userDataPath, nextSettings);

  const paths = resolvePaths(nextSettings.dataDirectory, manifest, authStatePath);
  const nextAuthState = await updateAuthState(resolveAuthStatePath(paths, authStatePath), (currentState) => {
    const targetId = options.accountId || currentState.activeAccountId;
    const remainingAccounts = currentState.accounts.filter((entry) => entry.account.id !== targetId);

    return {
      activeAccountId: remainingAccounts[0]?.account.id || null,
      accounts: remainingAccounts
    };
  });

  return {
    ok: true,
    account: withAccountAvatar(getActiveStoredAccount(nextAuthState)?.account || null),
    accounts: sanitizeAuthState(nextAuthState).accounts,
    settings: nextSettings
  };
}

async function getModdingState({ manifest, userDataPath, fallbackMinecraftDirectory }) {
  const settings = await syncImportedProjectMatchesForProfile({
    userDataPath,
    fallbackMinecraftDirectory
  });

  return buildModdingState(settings, manifest);
}

async function getLauncherState({
  manifest,
  userDataPath,
  fallbackMinecraftDirectory,
  authStatePath = null,
  fast = false
}) {
  const settings = fast
    ? await readSettings(userDataPath, fallbackMinecraftDirectory, manifest)
    : await syncImportedProjectMatchesForProfile({
        userDataPath,
        fallbackMinecraftDirectory
      });
  const paths = resolvePaths(settings.dataDirectory, manifest, authStatePath);
  const [installState, savedSession, catalogCache] = await Promise.all([
    readJson(paths.installStatePath, null),
    readSavedSession(resolveAuthStatePath(paths, authStatePath)),
    readCatalogCache(paths.catalogCachePath)
  ]);
  const localSelections = fast
    ? Object.fromEntries(
        await Promise.all(
          ["mod", "resourcepack", "shader"].map(async (projectType) => [
            projectType,
            await resolveLocalImportedProjects(paths, projectType, {
              metadataMode: "cached"
            })
          ])
        )
      )
    : null;
  let modding = null;

  if (fast) {
    modding = buildFastModdingState(
      settings,
      manifest,
      installState,
      null,
      catalogCache,
      localSelections
    );
  } else {
    try {
      modding = await buildModdingState(settings, manifest);
    } catch (error) {
      modding = buildFastModdingState(
        settings,
        manifest,
        installState,
        error.message,
        catalogCache,
        localSelections || {}
      );
    }
  }

  const launchState = getLaunchStateSnapshot();

  return {
    manifest,
    settings,
    paths,
    installState,
    modding,
    account: withAccountAvatar(getActiveStoredAccount(savedSession)?.account || null),
    accounts: sanitizeAuthState(savedSession).accounts,
    isRunning: launchState.isRunning,
    launchState
  };
}

async function reinstallManagedJavaRuntime({
  userDataPath,
  fallbackMinecraftDirectory,
  options = {},
  emit: emitEvent
}) {
  const manifest = loadManifest();
  const settings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  let nextSettings = mergeSettings(settings, options, manifest, userDataPath);
  const runtimeProfile = await resolveRuntimeProfile(nextSettings, manifest);

  nextSettings.modding.fabricLoaderVersion = runtimeProfile.fabricLoaderVersion;
  nextSettings = await applyManagedJavaSettings(nextSettings, runtimeProfile);
  await writeSettings(userDataPath, nextSettings);

  const javaRuntime = await ensureManagedJavaRuntime(
    nextSettings.dataDirectory,
    runtimeProfile.requiredJavaVersion,
    emitEvent,
    { force: true }
  );

  nextSettings.javaPath = javaRuntime.launchCommand;
  await writeSettings(userDataPath, nextSettings);
  emit(emitEvent, "ready", `Java ${runtimeProfile.requiredJavaVersion} wurde neu installiert.`);

  return {
    ok: true,
    settings: nextSettings,
    javaRuntime
  };
}

async function installRuntime({ userDataPath, fallbackMinecraftDirectory, options = {}, emit: emitEvent }) {
  const manifest = loadManifest();
  const settings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  let nextSettings = mergeSettings(settings, options, manifest, userDataPath);
  const runtimeProfile = await resolveRuntimeProfile(nextSettings, manifest);
  const sharedMinecraftCache = resolveSharedMinecraftCachePaths(
    nextSettings.dataDirectory,
    fallbackMinecraftDirectory
  );

  nextSettings.modding.fabricLoaderVersion = runtimeProfile.fabricLoaderVersion;
  nextSettings = await pinManagedProjectSelections(nextSettings, manifest, runtimeProfile);
  nextSettings = await applyManagedJavaSettings(nextSettings, runtimeProfile);
  await writeSettings(userDataPath, nextSettings);

  const paths = resolvePaths(nextSettings.dataDirectory, manifest);
  emit(emitEvent, "status", "Bereite Laufzeitverzeichnis vor...");
  await ensureDirectory(paths.javaDirectory);
  await ensureDirectory(paths.runtimeDirectory);
  await ensureDirectory(paths.instanceDirectory);
  await ensureDirectory(sharedMinecraftCache.assets);
  await ensureDirectory(sharedMinecraftCache.libraries);
  await ensureDirectory(sharedMinecraftCache.cache);

  const javaRuntime = await ensureManagedJavaRuntime(
    nextSettings.dataDirectory,
    runtimeProfile.requiredJavaVersion,
    emitEvent,
    { force: Boolean(options.forceJavaReinstall) }
  );

  nextSettings.javaPath = javaRuntime.launchCommand;
  await writeSettings(userDataPath, nextSettings);

  const fabricInstall = await installFabric(
    paths.runtimeDirectory,
    runtimeProfile,
    javaRuntime.command,
    emitEvent
  );

  emit(emitEvent, "status", "Löse Mod-Abhängigkeiten auf...");
  const [resolvedMods, resolvedResourcePacks, resolvedShaderPacks] = await Promise.all([
    resolveProjectSelections(
      nextSettings.modding.selectedMods,
      "mod",
      runtimeProfile.minecraftVersion
    ),
    resolveProjectSelections(
      nextSettings.modding.selectedResourcePacks,
      "resourcepack",
      runtimeProfile.minecraftVersion
    ),
    resolveProjectSelections(
      nextSettings.modding.selectedShaderPacks,
      "shader",
      runtimeProfile.minecraftVersion
    )
  ]);

  await Promise.all([
    downloadMods(
      resolvedMods,
      path.join(paths.instanceDirectory, "mods"),
      paths.managedModsStatePath,
      emitEvent,
      manifest
    ),
    downloadProjectFiles(
      resolvedResourcePacks,
      path.join(paths.instanceDirectory, "resourcepacks"),
      paths.managedResourcePacksStatePath,
      emitEvent,
      "Resource Pack",
      manifest
    ),
    downloadProjectFiles(
      resolvedShaderPacks,
      path.join(paths.instanceDirectory, "shaderpacks"),
      paths.managedShaderPacksStatePath,
      emitEvent,
      "Shader Pack",
      manifest
    )
  ]);

  emit(emitEvent, "status", "Kopiere Client-Dateien...");
  await copyDirectory(overridesDirectory, paths.instanceDirectory);
  const [
    displaySelectedMods,
    displaySelectedResourcePacks,
    displaySelectedShaderPacks
  ] = await Promise.all([
    buildInstalledSelectionSnapshot(paths, nextSettings.modding.selectedMods, "mod"),
    buildInstalledSelectionSnapshot(
      paths,
      nextSettings.modding.selectedResourcePacks,
      "resourcepack"
    ),
    buildInstalledSelectionSnapshot(paths, nextSettings.modding.selectedShaderPacks, "shader")
  ]);

  const [selectedMods, selectedResourcePacks, selectedShaderPacks] = await Promise.all([
    resolveSelectedProjectsDetails(nextSettings.modding.selectedMods, "mod"),
    resolveSelectedProjectsDetails(nextSettings.modding.selectedResourcePacks, "resourcepack"),
    resolveSelectedProjectsDetails(nextSettings.modding.selectedShaderPacks, "shader")
  ]);

  const installState = {
    installedAt: new Date().toISOString(),
    minecraftVersion: runtimeProfile.minecraftVersion,
    requiredJavaVersion: runtimeProfile.requiredJavaVersion,
    javaRuntime: {
      source: javaRuntime.source,
      path: javaRuntime.path,
      command: javaRuntime.command,
      launchCommand: javaRuntime.launchCommand,
      detected: javaRuntime.detected,
      releaseName: javaRuntime.releaseName,
      openjdkVersion: javaRuntime.openjdkVersion,
      installedAt: javaRuntime.installedAt || new Date().toISOString()
    },
    fabricInstallerVersion: fabricInstall.installerVersion,
    fabricLoaderVersion: fabricInstall.loaderVersion,
    fabricDistribution: fabricInstall.distribution,
    fabricVersionId: fabricInstall.fabricVersionId,
    selectedMods,
    selectedResourcePacks,
    selectedShaderPacks,
    displaySelectedMods,
    displaySelectedResourcePacks,
    displaySelectedShaderPacks,
    installedMods: resolvedMods
      .map((version) => version.name || version.id)
      .sort((left, right) => left.localeCompare(right)),
    installedResourcePacks: resolvedResourcePacks
      .map((version) => version.name || version.id)
      .sort((left, right) => left.localeCompare(right)),
    installedShaderPacks: resolvedShaderPacks
      .map((version) => version.name || version.id)
      .sort((left, right) => left.localeCompare(right))
  };

  await writeJson(paths.installStatePath, installState);

  try {
    await prewarmMinecraftRuntime({
      emit: emitEvent,
      fallbackMinecraftDirectory,
      installState,
      javaRuntime,
      manifest,
      paths,
      runtimeProfile,
      settings: nextSettings
    });

    installState.performance = {
      ...(installState.performance || {}),
      assetCacheRoot: sharedMinecraftCache.root,
      downloadMaxSockets: resolveLauncherDownloadMaxSockets(manifest),
      prewarmedAt: new Date().toISOString()
    };
    await writeJson(paths.installStatePath, installState);
  } catch (error) {
    installState.performance = {
      ...(installState.performance || {}),
      assetCacheRoot: sharedMinecraftCache.root,
      downloadMaxSockets: resolveLauncherDownloadMaxSockets(manifest),
      prewarmError: error.message || String(error)
    };
    await writeJson(paths.installStatePath, installState);
    emit(
      emitEvent,
      "debug",
      `Minecraft-Dateien konnten nicht komplett vorab geladen werden: ${error.message || error}`
    );
  }

  emit(emitEvent, "ready", "Launcher-Dateien sind aktuell.");

  return {
    ok: true,
    settings: nextSettings,
    paths,
    installState,
    javaRuntime
  };
}

async function launchClient({
  userDataPath,
  fallbackMinecraftDirectory,
  authStatePath = null,
  options = {},
  emit: emitEvent
}) {
  return launchClientManaged({
    userDataPath,
    fallbackMinecraftDirectory,
    authStatePath,
    options,
    emit: emitEvent
  });

  if (activeLaunch) {
    throw new Error("Minecraft läuft bereits.");
  }

  const manifest = loadManifest();
  const settings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
  let nextSettings = mergeSettings(settings, options, manifest, userDataPath);
  const runtimeProfile = await resolveRuntimeProfile(nextSettings, manifest);
  nextSettings.modding.fabricLoaderVersion = runtimeProfile.fabricLoaderVersion;
  nextSettings = await applyManagedJavaSettings(nextSettings, runtimeProfile);
  await writeSettings(userDataPath, nextSettings);
  const paths = resolvePaths(nextSettings.dataDirectory, manifest, authStatePath);
  const javaRuntime = await ensureManagedJavaRuntime(
    nextSettings.dataDirectory,
    runtimeProfile.requiredJavaVersion,
    emitEvent
  );

  nextSettings.javaPath = javaRuntime.launchCommand;
  await writeSettings(userDataPath, nextSettings);

  if (
    javaRuntime.detected !== null &&
    runtimeProfile.requiredJavaVersion !== null &&
    javaRuntime.detected < runtimeProfile.requiredJavaVersion
  ) {
    throw new Error(
      `Für Minecraft ${runtimeProfile.minecraftVersion} wird Java ${runtimeProfile.requiredJavaVersion}+ benötigt, erkannt wurde aber Java ${javaRuntime.detected}.`
    );
  }

  const savedInstallState = await readJson(paths.installStatePath, null);
  let installResult = null;

  if (
    await isInstallStateUsable(
      paths,
      savedInstallState,
      runtimeProfile,
      {
        selectedMods: nextSettings.modding.selectedMods,
        selectedResourcePacks: nextSettings.modding.selectedResourcePacks,
        selectedShaderPacks: nextSettings.modding.selectedShaderPacks
      }
    )
  ) {
    emit(emitEvent, "status", "Vorhandene Installation wird verwendet...");
    await ensureDirectory(paths.runtimeDirectory);
    await ensureDirectory(paths.instanceDirectory);
    await ensureReusableInstallationState(paths, {
      selectedMods: nextSettings.modding.selectedMods,
      selectedResourcePacks: nextSettings.modding.selectedResourcePacks,
      selectedShaderPacks: nextSettings.modding.selectedShaderPacks
    });
    await copyDirectory(overridesDirectory, paths.instanceDirectory);

    installResult = {
      ok: true,
      settings: nextSettings,
      paths,
      installState: savedInstallState
    };
  } else if (await canLaunchExistingInstallation(paths, savedInstallState, runtimeProfile)) {
    emit(emitEvent, "status", "Vorhandene Installation wird ohne Update gestartet...");
    await ensureDirectory(paths.runtimeDirectory);
    await ensureDirectory(paths.instanceDirectory);
    await copyDirectory(overridesDirectory, paths.instanceDirectory);

    installResult = {
      ok: true,
      settings: nextSettings,
      paths,
      installState: buildLaunchableInstallState(savedInstallState, runtimeProfile, javaRuntime)
    };
  } else {
    emit(emitEvent, "status", "Runtime wird aktualisiert...");
    installResult = await installRuntime({
      userDataPath,
      fallbackMinecraftDirectory,
      options: nextSettings,
      emit: emitEvent
    });
  }

  const authorization = await resolveMinecraftAuthorization(
    resolveAuthStatePath(installResult.paths, authStatePath),
    emitEvent
  );

  const launcher = new Client();
  launcher.on("debug", (message) => emit(emitEvent, "debug", String(message)));
  launcher.on("data", (message) => emit(emitEvent, "game", String(message).trim()));
  launcher.on("progress", (payload) => {
    const description = describeProgress(payload);
    emit(emitEvent, "progress", description.message, {
      ...payload,
      kind: description.kind,
      percent: description.percent
    });
  });
  launcher.on("download-status", (payload) => {
    const description = describeDownloadStatus(payload);
    emit(emitEvent, "download", description.message, {
      ...payload,
      percent: description.percent
    });
  });
  launcher.on("close", (code) => {
    activeLaunch = null;
    emit(emitEvent, "close", `Minecraft wurde beendet (Code ${code}).`, { code });
  });

  emit(emitEvent, "status", `Starte Minecraft als ${authorization.account.name}...`);

  const child = await launcher.launch(
    buildLaunchOptions({
      authorization: authorization.authorization,
      installState: installResult.installState,
      javaRuntime,
      manifest,
      paths: installResult.paths,
      runtimeProfile,
      settings: nextSettings,
      detached: false
    })
  );

  if (!child) {
    throw new Error("Minecraft konnte nicht gestartet werden. Prüfe die Log-Ausgabe im Launcher.");
  }

  activeLaunch = child;
  emit(emitEvent, "launch", `Minecraft gestartet (PID ${child.pid}).`, {
    pid: child.pid
  });

  return {
    ok: true,
    pid: child.pid,
    account: withAccountAvatar({
      id: authorization.account.id,
      name: authorization.account.name,
      skinUrl: authorization.account.skins?.[0]?.url || null
    }),
    accounts: authorization.accounts,
    settings: nextSettings,
    installState: installResult.installState,
    paths: installResult.paths
  };
}

async function launchClientManaged({
  userDataPath,
  fallbackMinecraftDirectory,
  authStatePath = null,
  options = {},
  emit: emitEvent
}) {
  if (activeLaunchSession) {
      throw new Error("Minecraft startet oder läuft bereits.");
  }

  const rawOptions = options && typeof options === "object" ? options : {};
  const normalizedLaunchTarget = normalizeLaunchTarget(rawOptions.launchTarget);
  const { launchTarget: _ignoredLaunchTarget, ...settingsOptions } = rawOptions;

  const launchSession = {
    emitEvent,
    launcher: null,
    child: null,
    stopRequested: false,
    lastLaunchState: null
  };
  activeLaunchSession = launchSession;

  try {
    const manifest = loadManifest();
    const settings = await readSettings(userDataPath, fallbackMinecraftDirectory, manifest);
    let nextSettings = mergeSettings(settings, settingsOptions, manifest, userDataPath);
    const runtimeProfile = await resolveRuntimeProfile(nextSettings, manifest);
    const sharedMinecraftCache = resolveSharedMinecraftCachePaths(
      nextSettings.dataDirectory,
      fallbackMinecraftDirectory
    );
    nextSettings.modding.fabricLoaderVersion = runtimeProfile.fabricLoaderVersion;
    nextSettings = await pinManagedProjectSelections(nextSettings, manifest, runtimeProfile);
    nextSettings = await applyManagedJavaSettings(nextSettings, runtimeProfile);
    await writeSettings(userDataPath, nextSettings);

    const paths = resolvePaths(nextSettings.dataDirectory, manifest, authStatePath);
    await ensureDirectory(sharedMinecraftCache.assets);
    await ensureDirectory(sharedMinecraftCache.libraries);
    await ensureDirectory(sharedMinecraftCache.cache);
    const javaRuntime = await ensureManagedJavaRuntime(
      nextSettings.dataDirectory,
      runtimeProfile.requiredJavaVersion,
      emitEvent
    );

    nextSettings.javaPath = javaRuntime.launchCommand;
    await writeSettings(userDataPath, nextSettings);

    if (
      javaRuntime.detected !== null &&
      runtimeProfile.requiredJavaVersion !== null &&
      javaRuntime.detected < runtimeProfile.requiredJavaVersion
    ) {
      throw new Error(
      `Für Minecraft ${runtimeProfile.minecraftVersion} wird Java ${runtimeProfile.requiredJavaVersion}+ benötigt, erkannt wurde aber Java ${javaRuntime.detected}.`
      );
    }

    const savedInstallState = await readJson(paths.installStatePath, null);
    let installResult = null;

    if (
      await isInstallStateUsable(
        paths,
        savedInstallState,
        runtimeProfile,
        {
          selectedMods: nextSettings.modding.selectedMods,
          selectedResourcePacks: nextSettings.modding.selectedResourcePacks,
          selectedShaderPacks: nextSettings.modding.selectedShaderPacks
        }
      )
    ) {
      emitLaunchEvent(launchSession, "status", "Vorhandene Installation wird verwendet...");
      await ensureDirectory(paths.runtimeDirectory);
      await ensureDirectory(paths.instanceDirectory);
      await ensureReusableInstallationState(paths, {
        selectedMods: nextSettings.modding.selectedMods,
        selectedResourcePacks: nextSettings.modding.selectedResourcePacks,
        selectedShaderPacks: nextSettings.modding.selectedShaderPacks
      });
      await copyDirectory(overridesDirectory, paths.instanceDirectory);

      installResult = {
        ok: true,
        settings: nextSettings,
        paths,
        installState: savedInstallState
      };
    } else if (await canLaunchExistingInstallation(paths, savedInstallState, runtimeProfile)) {
      // Wenn nur die Auswahl geaendert wurde, reicht ein Content-Sync ohne komplette Runtime-Neuinstallation.
      emitLaunchEvent(launchSession, "status", "Vorhandene Installation wird mit aktueller Auswahl synchronisiert...");
      await ensureDirectory(paths.runtimeDirectory);
      await ensureDirectory(paths.instanceDirectory);
      await copyDirectory(overridesDirectory, paths.instanceDirectory);

      installResult = {
        ok: true,
        settings: nextSettings,
        paths,
        installState: await syncManagedSelectionInstallState({
          settings: nextSettings,
          manifest,
          paths,
          runtimeProfile,
          installState: buildLaunchableInstallState(savedInstallState, runtimeProfile, javaRuntime),
          emitEvent: (payload) => emitLaunchEvent(launchSession, payload.stage, payload.message, payload)
        })
      };
    } else {
      emitLaunchEvent(launchSession, "status", "Runtime wird aktualisiert...");
      installResult = await installRuntime({
        userDataPath,
        fallbackMinecraftDirectory,
        options: nextSettings,
        emit(payload) {
          emitLaunchEvent(launchSession, payload.stage, payload.message, payload);
        }
      });
    }

    await normalizeLegacyFabricVersionJson(installResult.paths.runtimeDirectory, runtimeProfile);

    const authorization = await resolveMinecraftAuthorization(
      resolveAuthStatePath(installResult.paths, authStatePath),
      (payload) => emitLaunchEvent(launchSession, payload.stage, payload.message, payload)
    );

    const launcher = new Client();
    const progressState = new Map();
    const downloadState = new Map();
    launchSession.launcher = launcher;
    launcher.on("debug", (message) => emitLaunchEvent(launchSession, "debug", String(message)));
    launcher.on("data", (message) => emitLaunchEvent(launchSession, "game", String(message).trim()));
    launcher.on("progress", (payload) => {
      const description = describeProgress(payload);

      if (!shouldEmitProgressUpdate(progressState, payload, description)) {
        return;
      }

      emitLaunchEvent(launchSession, "progress", description.message, {
        ...payload,
        kind: description.kind,
        percent: description.percent
      });
    });
    launcher.on("download-status", (payload) => {
      const description = describeDownloadStatus(payload);

      if (!shouldEmitDownloadStatusUpdate(downloadState, payload, description)) {
        return;
      }

      emitLaunchEvent(launchSession, "download", description.message, {
        ...payload,
        percent: description.percent
      });
    });
    launcher.on("close", (code) => {
      const stopRequested = launchSession.stopRequested;
      clearLaunchSession(launchSession);
      emit(emitEvent, "close", stopRequested
        ? "Minecraft wurde beendet."
        : `Minecraft wurde beendet (Code ${code}).`, {
        code,
        launchState: createIdleLaunchState()
      });
    });

    emitLaunchEvent(launchSession, "status", `Starte Minecraft als ${authorization.account.name}...`);

    const launchOptions = buildLaunchOptions({
      authorization: authorization.authorization,
      fallbackMinecraftDirectory,
      installState: installResult.installState,
      javaRuntime,
      launchTarget: normalizedLaunchTarget,
      manifest,
      paths: installResult.paths,
      runtimeProfile,
      settings: nextSettings,
      detached: false
    });

    const child = await launchClientWithOptimizedAssetCache(
      launcher,
      launchOptions,
      installResult.installState
    );

    if (child) {
      launchSession.child = child;
      activeLaunch = child;
    }

    if (launchSession.stopRequested) {
      if (child) {
        await terminateLaunchProcess(child);
      } else {
        clearLaunchSession(launchSession);
        emit(emitEvent, "close", "Start wurde abgebrochen.", {
          launchState: createIdleLaunchState()
        });
      }

      throw createLaunchAbortedError();
    }

    if (!child) {
      clearLaunchSession(launchSession);
    throw new Error("Minecraft konnte nicht gestartet werden. Prüfe die Log-Ausgabe im Launcher.");
    }

    const trackedProcessId = getTrackedChildProcessId(child);

    emitLaunchEvent(launchSession, "launch", `Minecraft gestartet (PID ${trackedProcessId}).`, {
      pid: trackedProcessId
    });

    return {
      ok: true,
      pid: trackedProcessId,
      account: withAccountAvatar({
        id: authorization.account.id,
        name: authorization.account.name,
        skinUrl: authorization.account.skins?.[0]?.url || null
      }),
      accounts: authorization.accounts,
      settings: nextSettings,
      installState: installResult.installState,
      paths: installResult.paths,
      launchState: getLaunchStateSnapshot(launchSession)
    };
  } catch (error) {
    const launchError = asServiceError(error, "Start fehlgeschlagen.");

    if (!isLaunchAbortedError(launchError) && activeLaunchSession === launchSession && !launchSession.child) {
      emitLaunchEvent(launchSession, "error", normalizeServiceErrorMessage(launchError));
      clearLaunchSession(launchSession);
      emit(emitEvent, "close", "Startprozess wurde beendet.", {
        failed: true,
        launchState: createIdleLaunchState()
      });
    }

    throw launchError;
  }
}

async function stopClient({ emit: emitEvent } = {}) {
  if (!activeLaunchSession) {
    return {
      ok: true,
      alreadyStopped: true,
      pid: null,
      message: "Minecraft läuft gerade nicht.",
      launchState: createIdleLaunchState()
    };
  }

  const session = activeLaunchSession;
  const child = session.child;
  const pid = child?.pid || null;
  session.stopRequested = true;

  emitLaunchEvent(
    session,
    "status",
    child
      ? "Minecraft wird beendet..."
      : "Start wird abgebrochen. Aktuelle Downloads werden noch abgeschlossen..."
  );

  if (emitEvent && emitEvent !== session.emitEvent) {
    emit(emitEvent, "status", child
      ? "Minecraft wird beendet..."
      : "Start wird abgebrochen. Aktuelle Downloads werden noch abgeschlossen...", {
      launchState: getLaunchStateSnapshot(session)
    });
  }

  const stopped = await terminateLaunchProcess(child);

  return {
    ok: true,
    alreadyStopped: false,
    pid,
    stopped,
    message: child
      ? pid
      ? `Stop-Signal an Minecraft gesendet (PID ${pid}).`
      : "Stop-Signal an Minecraft gesendet."
      : "Startabbruch angefordert.",
    launchState: getLaunchStateSnapshot(session)
  };
}

module.exports = {
  addSelectedProject,
  addSelectedMod,
  getLauncherState,
  getModdingState,
  importLocalProjects,
  installRuntime,
  launchClient,
  loadManifest,
  loginWithMicrosoft,
  logout,
  removeLocalImportedProject,
  removeSelectedProject,
  removeSelectedMod,
  reinstallManagedJavaRuntime,
  adoptImportedProjectMatches,
  saveLauncherSettings,
  stopClient,
  getModrinthProjectDetails,
  searchModrinthProjects,
  switchAccount
};
