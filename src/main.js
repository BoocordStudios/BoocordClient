const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { pathToFileURL } = require("node:url");
const fs = require("node:fs/promises");
const nodeFs = require("node:fs");
const { constants: fsConstants } = nodeFs;
const { app, BrowserWindow, clipboard, dialog, ipcMain, screen, shell } = require("electron");
const {
  addSelectedProject,
  adoptImportedProjectMatches,
  getLauncherState,
  getModdingState,
  importLocalProjects,
  installRuntime,
  launchClient,
  loadManifest,
  loginWithMicrosoft,
  reinstallManagedJavaRuntime,
  removeLocalImportedProject,
  removeSelectedProject,
  stopClient,
  switchAccount,
  logout,
  saveLauncherSettings,
  searchModrinthProjects,
  getModrinthProjectDetails
} = require("./services/launcherService");
const { createDiscordPresenceService } = require("./services/discordPresenceService");
const { getMinecraftServerStatus } = require("./services/serverStatusService");

const isWindows = process.platform === "win32";
const launcherRootDirectory = path.resolve(__dirname, "..");
const launcherStateFileName = "launcher-state.json";
const profileMetadataFileName = "profile-meta.json";
const profileIconFilePrefix = "profile-icon";
const launcherBackgroundFilePrefix = "launcher-background";
const profileDataOwnershipFileName = ".boocord-profile-data.json";
const profileIconExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".ico"]);
let mainWindow = null;
let launcherWindowDragState = null;
let launcherWindowDragTimer = null;
let lastPresenceLanguage = "de";

function getLocalizedMainText(germanText, englishText, language = lastPresenceLanguage) {
  return language === "en" ? englishText : germanText;
}

function buildLocalProjectImportDialogOptions(projectType = "mod") {
  if (projectType === "resourcepack") {
    return {
      title: getLocalizedMainText("Resource Packs importieren", "Import resource packs"),
      buttonLabel: getLocalizedMainText("Resource Packs importieren", "Import resource packs"),
      properties: ["openFile", "openDirectory", "multiSelections"],
      filters: [
        {
          name: "Resource Packs",
          extensions: ["zip"]
        }
      ]
    };
  }

  if (projectType === "shader") {
    return {
      title: getLocalizedMainText("Shader Packs importieren", "Import shader packs"),
      buttonLabel: getLocalizedMainText("Shader Packs importieren", "Import shader packs"),
      properties: ["openFile", "openDirectory", "multiSelections"],
      filters: [
        {
          name: "Shader Packs",
          extensions: ["zip"]
        }
      ]
    };
  }

  return {
    title: getLocalizedMainText("Mods importieren", "Import mods"),
    buttonLabel: getLocalizedMainText("Mods importieren", "Import mods"),
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Mods",
        extensions: ["jar", "zip"]
      }
    ]
  };
}

function readCliOption(optionName) {
  const exactFlag = `--${optionName}`;
  const prefix = `${exactFlag}=`;

  for (let index = 0; index < process.argv.length; index += 1) {
    const entry = process.argv[index];

    if (entry.startsWith(prefix)) {
      return entry.slice(prefix.length);
    }

    if (entry === exactFlag) {
      return process.argv[index + 1] || "";
    }
  }

  return null;
}

function sanitizeProfileName(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "")
    .toLowerCase();

  return normalized || "default";
}

function defaultProfileLabel(slug) {
  if (!slug || slug === "default") {
    return "Standard";
  }

  return slug
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatProfileLabel(slug, requestedValue) {
  const rawValue = String(requestedValue || "").trim();

  if (!rawValue) {
    return defaultProfileLabel(slug);
  }

  return rawValue;
}

function buildLauncherBackgroundInfo(userDataPath, fileName) {
  const normalizedFileName = String(fileName || "").trim();

  if (!userDataPath || !normalizedFileName) {
    return null;
  }

  const backgroundPath = path.join(userDataPath, normalizedFileName);

  let backgroundStats = null;

  try {
    backgroundStats = nodeFs.statSync(backgroundPath);
  } catch {
    return null;
  }

  if (!backgroundStats.isFile()) {
    return null;
  }

  const backgroundUrl = pathToFileURL(backgroundPath);
  backgroundUrl.searchParams.set(
    "v",
    `${Math.trunc(backgroundStats.mtimeMs)}-${backgroundStats.size}`
  );

  return {
    fileName: normalizedFileName,
    fileUrl: backgroundUrl.href
  };
}

function normalizeLauncherSettings(settings, userDataPath = null) {
  if (!settings || typeof settings !== "object") {
    return settings;
  }

  const launcherBackground = buildLauncherBackgroundInfo(
    userDataPath,
    settings.launcherBackgroundFileName
  );

  return {
    ...settings,
    language: ["de", "en"].includes(String(settings.language || "").trim().toLowerCase())
      ? String(settings.language).trim().toLowerCase()
      : "de",
    languagePromptVersion: Number.isInteger(Number(settings.languagePromptVersion))
      ? Number(settings.languagePromptVersion)
      : 0,
    launcherBackgroundFileName: launcherBackground?.fileName || null,
    launcherBackground,
    openLogsOnLaunch: Boolean(settings.openLogsOnLaunch),
    minimizeOnLaunch: Boolean(settings.minimizeOnLaunch),
    runtime: {
      ...(settings.runtime || {}),
      gcProfile: ["auto", "g1", "zgc"].includes(String(settings?.runtime?.gcProfile || "").trim().toLowerCase())
        ? String(settings.runtime.gcProfile).trim().toLowerCase()
        : "auto"
    }
  };
}

function normalizeSettingsResult(result, userDataPath = getActiveUserDataPath()) {
  if (!result || typeof result !== "object" || !Object.prototype.hasOwnProperty.call(result, "settings")) {
    return result;
  }

  return {
    ...result,
    settings: normalizeLauncherSettings(result.settings, userDataPath)
  };
}

function resolveInstallationContext() {
  const installationSource = path.resolve(app.isPackaged ? path.dirname(process.execPath) : launcherRootDirectory);
  const installationKey = crypto
    .createHash("sha1")
    .update(installationSource.toLowerCase())
    .digest("hex")
    .slice(0, 10);
  const installationDirectory = path.join(
    app.getPath("appData"),
    "Boocord Client",
    "installations",
    installationKey
  );

  return {
    installationKey,
    installationDirectory,
    installationSource,
    authStatePath: path.join(installationDirectory, "account-session.json"),
    launcherStatePath: path.join(installationDirectory, launcherStateFileName),
    profilesRootPath: path.join(installationDirectory, "profiles")
  };
}

function readPersistedActiveProfileSlug(launcherStatePath) {
  try {
    if (!nodeFs.existsSync(launcherStatePath)) {
      return "";
    }

    const rawContent = nodeFs.readFileSync(launcherStatePath, "utf8");
    const savedState = JSON.parse(rawContent);
    return sanitizeProfileName(savedState?.activeProfileSlug || "");
  } catch {
    return "";
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(targetPath, fallbackValue = null) {
  if (!(await pathExists(targetPath))) {
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

async function writeJsonFile(targetPath, payload) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.rename(temporaryPath, targetPath);
}

function normalizeSavedSession(savedSession) {
  if (!savedSession) {
    return {
      activeAccountId: null,
      accounts: []
    };
  }

  if (Array.isArray(savedSession.accounts)) {
    const accounts = savedSession.accounts
      .filter((entry) => entry?.account?.id)
      .map((entry) => ({
        ...entry,
        account: {
          ...entry.account
        }
      }));

    return {
      activeAccountId: savedSession.activeAccountId || accounts[0]?.account?.id || null,
      accounts
    };
  }

  if (savedSession.refreshToken && savedSession.account?.id) {
    return {
      activeAccountId: savedSession.account.id,
      accounts: [
        {
          refreshToken: savedSession.refreshToken,
          account: {
            ...savedSession.account
          },
          savedAt: savedSession.savedAt || new Date().toISOString()
        }
      ]
    };
  }

  return {
    activeAccountId: null,
    accounts: []
  };
}

function mergeSavedSessions(savedSessions) {
  const accountsById = new Map();
  let activeAccountId = null;

  for (const session of savedSessions) {
    const normalized = normalizeSavedSession(session);

    if (
      !activeAccountId &&
      normalized.activeAccountId &&
      normalized.accounts.some((entry) => entry.account.id === normalized.activeAccountId)
    ) {
      activeAccountId = normalized.activeAccountId;
    }

    for (const entry of normalized.accounts) {
      const accountId = entry.account.id;
      const existingEntry = accountsById.get(accountId);

      if (!existingEntry) {
        accountsById.set(accountId, {
          ...entry,
          account: {
            ...entry.account
          }
        });
        continue;
      }

      const existingSavedAt = existingEntry.savedAt ? new Date(existingEntry.savedAt).getTime() : 0;
      const nextSavedAt = entry.savedAt ? new Date(entry.savedAt).getTime() : 0;

      if (nextSavedAt >= existingSavedAt) {
        accountsById.set(accountId, {
          ...existingEntry,
          ...entry,
          account: {
            ...existingEntry.account,
            ...entry.account
          }
        });
      }
    }
  }

  const accounts = [...accountsById.values()];

  return {
    activeAccountId: activeAccountId || accounts[0]?.account?.id || null,
    accounts
  };
}

function resolveProfilePaths(profileSlug) {
  const slug = sanitizeProfileName(profileSlug);
  const userDataPath = path.join(profileContext.profilesRootPath, slug);

  return {
    slug,
    userDataPath,
    metadataPath: path.join(userDataPath, profileMetadataFileName)
  };
}

function normalizeComparablePath(targetPath) {
  const resolvedPath = path.resolve(String(targetPath || "").trim());
  return isWindows ? resolvedPath.toLowerCase() : resolvedPath;
}

function arePathsEquivalent(leftPath, rightPath) {
  return normalizeComparablePath(leftPath) === normalizeComparablePath(rightPath);
}

function isPathInside(parentPath, childPath) {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(childPath));

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

async function readProfileDataOwnership(dataDirectory) {
  if (!dataDirectory) {
    return null;
  }

  return readJsonFile(path.join(dataDirectory, profileDataOwnershipFileName), null);
}

function buildProfileDataOwnership(profileSlug, userDataPath, dataDirectory) {
  return {
    installationKey: profileContext.installationKey,
    profileSlug: sanitizeProfileName(profileSlug),
    userDataPath: path.resolve(userDataPath),
    dataDirectory: path.resolve(dataDirectory),
    updatedAt: new Date().toISOString()
  };
}

function isOwnedByProfile(dataOwnership, profileSlug, userDataPath, dataDirectory) {
  if (!dataOwnership || dataOwnership.installationKey !== profileContext.installationKey) {
    return false;
  }

  return (
    sanitizeProfileName(dataOwnership.profileSlug) === sanitizeProfileName(profileSlug) &&
    arePathsEquivalent(dataOwnership.userDataPath, userDataPath) &&
    arePathsEquivalent(dataOwnership.dataDirectory, dataDirectory)
  );
}

async function shouldWriteProfileDataOwnership(profileSlug, userDataPath, dataDirectory) {
  if (!dataDirectory) {
    return false;
  }

  if (arePathsEquivalent(userDataPath, dataDirectory) || isPathInside(userDataPath, dataDirectory)) {
    return true;
  }

  if (!(await pathExists(dataDirectory))) {
    return true;
  }

  const existingOwnership = await readProfileDataOwnership(dataDirectory);

  if (isOwnedByProfile(existingOwnership, profileSlug, userDataPath, dataDirectory)) {
    return true;
  }

  if (isPathInside(profileContext.installationDirectory, dataDirectory)) {
    return true;
  }

  try {
    const entryNames = (await fs.readdir(dataDirectory)).map((entry) => entry.toLowerCase());

    return (
      entryNames.length === 0 ||
      entryNames.includes("installation-state.json") ||
      entryNames.includes(profileDataOwnershipFileName.toLowerCase())
    );
  } catch {
    return false;
  }
}

async function ensureProfileDataOwnership(profileSlug, dataDirectory = null, userDataPath = null) {
  const profilePaths = resolveProfilePaths(profileSlug);
  const resolvedUserDataPath = userDataPath || profilePaths.userDataPath;
  const resolvedDataDirectory = path.resolve(
    dataDirectory || path.join(resolvedUserDataPath, "game-data")
  );

  if (!(await shouldWriteProfileDataOwnership(profilePaths.slug, resolvedUserDataPath, resolvedDataDirectory))) {
    return false;
  }

  await fs.mkdir(resolvedDataDirectory, { recursive: true });
  await writeJsonFile(
    path.join(resolvedDataDirectory, profileDataOwnershipFileName),
    buildProfileDataOwnership(profilePaths.slug, resolvedUserDataPath, resolvedDataDirectory)
  );

  return true;
}

async function resolveProfileDeletionTargets(profileSlug) {
  const profilePaths = resolveProfilePaths(profileSlug);
  const settingsPath = path.join(profilePaths.userDataPath, "launcher-settings.json");
  const settings = await readJsonFile(settingsPath, null);
  const dataDirectory = path.resolve(
    settings?.dataDirectory || path.join(profilePaths.userDataPath, "game-data")
  );
  const deletionTargets = [profilePaths.userDataPath];

  if (
    !arePathsEquivalent(dataDirectory, profilePaths.userDataPath) &&
    !isPathInside(profilePaths.userDataPath, dataDirectory)
  ) {
    const dataOwnership = await readProfileDataOwnership(dataDirectory);

    if (
      isOwnedByProfile(dataOwnership, profilePaths.slug, profilePaths.userDataPath, dataDirectory) ||
      isPathInside(profileContext.installationDirectory, dataDirectory)
    ) {
      deletionTargets.push(dataDirectory);
    }
  }

  return [...new Set(deletionTargets.map((entry) => path.resolve(entry)))]
    .sort((left, right) => right.length - left.length);
}

async function upsertProfileMetadata(profileSlug, values = {}, { preserveName = true } = {}) {
  const paths = resolveProfilePaths(profileSlug);
  const existingMetadata = (await readJsonFile(paths.metadataPath, {})) || {};
  const now = new Date().toISOString();
  const nextSlug = paths.slug;
  const requestedName = String(values.name || "").trim();
  const hasLastUsedAt = Object.prototype.hasOwnProperty.call(values, "lastUsedAt");
  const nextName = preserveName && existingMetadata.name
    ? existingMetadata.name
    : requestedName || existingMetadata.name || defaultProfileLabel(nextSlug);
  const nextMetadata = {
    ...existingMetadata,
    ...values,
    slug: nextSlug,
    name: nextName,
    createdAt: existingMetadata.createdAt || values.createdAt || now,
    lastUsedAt: hasLastUsedAt ? values.lastUsedAt : existingMetadata.lastUsedAt || now
  };

  await writeJsonFile(paths.metadataPath, nextMetadata);
  return nextMetadata;
}

function isSupportedProfileIconExtension(extension) {
  return profileIconExtensions.has(String(extension || "").trim().toLowerCase());
}

function resolveProfileIconFileName(sourcePath) {
  const extension = path.extname(String(sourcePath || "")).trim().toLowerCase();

  if (!isSupportedProfileIconExtension(extension)) {
    return null;
  }

  return `${profileIconFilePrefix}${extension}`;
}

function resolveLauncherBackgroundFileName(sourcePath) {
  const extension = path.extname(String(sourcePath || "")).trim().toLowerCase();

  if (!isSupportedProfileIconExtension(extension)) {
    return null;
  }

  return `${launcherBackgroundFilePrefix}${extension}`;
}

async function readProfileIconInfo(paths, metadata = null) {
  const iconFileName = String(metadata?.iconFileName || "").trim();

  if (iconFileName) {
    const iconPath = path.join(paths.userDataPath, iconFileName);

    if (await pathExists(iconPath)) {
      return {
        iconFileName,
        iconPath,
        iconUrl: pathToFileURL(iconPath).href
      };
    }
  }

  if (!(await pathExists(paths.userDataPath))) {
    return {
      iconFileName: null,
      iconPath: null,
      iconUrl: null
    };
  }

  const entries = await fs.readdir(paths.userDataPath, {
    withFileTypes: true
  });
  const iconEntry = entries.find((entry) => {
    if (!entry.isFile()) {
      return false;
    }

    const entryName = String(entry.name || "").trim();

    return (
      entryName.startsWith(`${profileIconFilePrefix}.`) &&
      isSupportedProfileIconExtension(path.extname(entryName))
    );
  });

  if (!iconEntry) {
    return {
      iconFileName: null,
      iconPath: null,
      iconUrl: null
    };
  }

  const iconPath = path.join(paths.userDataPath, iconEntry.name);

  return {
    iconFileName: iconEntry.name,
    iconPath,
    iconUrl: pathToFileURL(iconPath).href
  };
}

async function removeOtherProfileIcons(userDataPath, keepFileName = null) {
  if (!(await pathExists(userDataPath))) {
    return;
  }

  const entries = await fs.readdir(userDataPath, {
    withFileTypes: true
  });

  await Promise.all(entries.map(async (entry) => {
    if (!entry.isFile()) {
      return;
    }

    const entryName = String(entry.name || "").trim();

    if (
      entryName === keepFileName ||
      !entryName.startsWith(`${profileIconFilePrefix}.`) ||
      !isSupportedProfileIconExtension(path.extname(entryName))
    ) {
      return;
    }

    await fs.rm(path.join(userDataPath, entryName), {
      force: true
    });
  }));
}

async function removeOtherLauncherBackgrounds(userDataPath, keepFileName = null) {
  if (!(await pathExists(userDataPath))) {
    return;
  }

  const entries = await fs.readdir(userDataPath, {
    withFileTypes: true
  });

  await Promise.all(entries.map(async (entry) => {
    if (!entry.isFile()) {
      return;
    }

    const entryName = String(entry.name || "").trim();

    if (
      entryName === keepFileName ||
      !entryName.startsWith(`${launcherBackgroundFilePrefix}.`) ||
      !isSupportedProfileIconExtension(path.extname(entryName))
    ) {
      return;
    }

    await fs.rm(path.join(userDataPath, entryName), {
      force: true
    });
  }));
}

function summarizeStoredAccounts(savedSession) {
  if (!savedSession) {
    return {
      accountCount: 0,
      activeAccountName: null
    };
  }

  if (Array.isArray(savedSession.accounts)) {
    const activeId = savedSession.activeAccountId || savedSession.accounts[0]?.account?.id || null;
    const activeAccount =
      savedSession.accounts.find((entry) => entry.account?.id === activeId)?.account ||
      savedSession.accounts[0]?.account ||
      null;

    return {
      accountCount: savedSession.accounts.length,
      activeAccountName: activeAccount?.name || null
    };
  }

  if (savedSession.account) {
    return {
      accountCount: 1,
      activeAccountName: savedSession.account.name || null
    };
  }

  return {
    accountCount: 0,
    activeAccountName: null
  };
}

async function buildProfileSummary(profileSlug) {
  const paths = resolveProfilePaths(profileSlug);
  const [metadata, settings] = await Promise.all([
    readJsonFile(paths.metadataPath, null),
    readJsonFile(path.join(paths.userDataPath, "launcher-settings.json"), null)
  ]);
  const resolvedDataDirectory = settings?.dataDirectory || path.join(paths.userDataPath, "game-data");
  await ensureProfileDataOwnership(paths.slug, resolvedDataDirectory, paths.userDataPath);
  const [installState, savedSession, localContent] = await Promise.all([
    readJsonFile(path.join(resolvedDataDirectory, "installation-state.json"), null),
    readJsonFile(profileContext.authStatePath, null),
    inspectProfileLocalContent(resolvedDataDirectory)
  ]);
  const accountSummary = summarizeStoredAccounts(savedSession);
  const managedModsCount = Array.isArray(settings?.modding?.selectedMods)
    ? settings.modding.selectedMods.length
    : 0;
  const managedResourcePacksCount = Array.isArray(settings?.modding?.selectedResourcePacks)
    ? settings.modding.selectedResourcePacks.length
    : 0;
  const managedShaderPacksCount = Array.isArray(settings?.modding?.selectedShaderPacks)
    ? settings.modding.selectedShaderPacks.length
    : 0;
  const selectedModsCount = Math.max(managedModsCount, localContent.localModsCount);
  const selectedResourcePacksCount = Math.max(
    managedResourcePacksCount,
    localContent.localResourcePacksCount
  );
  const selectedShaderPacksCount = Math.max(
    managedShaderPacksCount,
    localContent.localShaderPacksCount
  );
  const derivedName = String(metadata?.name || "").trim() || defaultProfileLabel(paths.slug);
  const iconInfo = await readProfileIconInfo(paths, metadata);

  return {
    slug: paths.slug,
    name: derivedName,
    isDefault: paths.slug === "default",
    isActive: paths.slug === profileContext.slug,
    importedFrom: metadata?.importedFrom || null,
    userDataPath: paths.userDataPath,
    dataDirectory: resolvedDataDirectory,
    instanceDirectory: localContent.instanceDirectory,
    minecraftVersion:
      settings?.modding?.minecraftVersion || installState?.minecraftVersion || null,
    fabricLoaderVersion:
      settings?.modding?.fabricLoaderVersion || installState?.fabricLoaderVersion || null,
    runtimeInstalled: Boolean(installState),
    hasLocalContent: localContent.hasLocalContent,
    selectedModsCount,
    selectedResourcePacksCount,
    selectedShaderPacksCount,
    selectedContentCount:
      selectedModsCount + selectedResourcePacksCount + selectedShaderPacksCount,
    accountCount: accountSummary.accountCount,
    accountName: accountSummary.activeAccountName,
    iconPath: iconInfo.iconPath,
    iconUrl: iconInfo.iconUrl,
    createdAt: metadata?.createdAt || null,
    lastUsedAt: metadata?.lastUsedAt || metadata?.createdAt || null
  };
}

async function listProfiles() {
  await fs.mkdir(profileContext.profilesRootPath, { recursive: true });

  const entries = await fs.readdir(profileContext.profilesRootPath, {
    withFileTypes: true
  });
  const uniqueSlugs = new Set(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => sanitizeProfileName(entry.name))
  );

  uniqueSlugs.add(profileContext.slug);

  const profiles = await Promise.all([...uniqueSlugs].map((slug) => buildProfileSummary(slug)));

  return profiles.sort((left, right) => {
    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? -1 : 1;
    }

    const leftDate = left.lastUsedAt ? new Date(left.lastUsedAt).getTime() : 0;
    const rightDate = right.lastUsedAt ? new Date(right.lastUsedAt).getTime() : 0;

    if (leftDate !== rightDate) {
      return rightDate - leftDate;
    }

    return left.name.localeCompare(right.name, "de-DE");
  });
}

function resolveProfileContext() {
  const legacyUserDataPath = app.getPath("userData");
  const requestedProfile = String(readCliOption("profile") || process.env.BOOCORD_PROFILE || "").trim();
  const hasExplicitProfileSelection = requestedProfile.length > 0;
  const installationContext = resolveInstallationContext();
  const persistedProfileSlug = hasExplicitProfileSelection
    ? ""
    : readPersistedActiveProfileSlug(installationContext.launcherStatePath);
  const profileSlug = sanitizeProfileName(requestedProfile || persistedProfileSlug);
  const userDataPath = path.join(
    installationContext.profilesRootPath,
    profileSlug
  );

  app.setPath("userData", userDataPath);

  return {
    authStatePath: installationContext.authStatePath,
    installationKey: installationContext.installationKey,
    installationDirectory: installationContext.installationDirectory,
    installationSource: installationContext.installationSource,
    isCustom: profileSlug !== "default",
    launcherStatePath: installationContext.launcherStatePath,
    legacyUserDataPath,
    label: formatProfileLabel(profileSlug, requestedProfile),
    metadataPath: path.join(userDataPath, profileMetadataFileName),
    profilesRootPath: installationContext.profilesRootPath,
    slug: profileSlug,
    userDataPath
  };
}

const profileContext = resolveProfileContext();
const discordPresence = createDiscordPresenceService({
  clientId: "1482883311599878307",
  largeImageKey: "boocord",
  largeImageText: "Boocord Client"
});

function getActiveUserDataPath() {
  return profileContext.userDataPath;
}

function resolveRequestedUserDataPath(profileSlug = null) {
  const normalizedSlug = sanitizeProfileName(profileSlug);
  return normalizedSlug ? resolveProfilePaths(normalizedSlug).userDataPath : getActiveUserDataPath();
}

function formatWindowTitle(profileLabel = profileContext.label, isCustom = profileContext.isCustom) {
  return isCustom
    ? `Boocord Client [${profileLabel}]`
    : "Boocord Client";
}

function syncWindowTitles(profileLabel = profileContext.label) {
  const nextTitle = formatWindowTitle(profileLabel, profileContext.isCustom);

  BrowserWindow.getAllWindows().forEach((window) => {
    if (!window.isDestroyed()) {
      window.setTitle(nextTitle);
    }
  });
}

async function ensureProfileStorage() {
  if (await pathExists(profileContext.userDataPath)) {
    await upsertProfileMetadata(profileContext.slug, {
      name: profileContext.label,
      lastUsedAt: new Date().toISOString()
    });
    return;
  }

  if (
    !profileContext.isCustom &&
    profileContext.legacyUserDataPath &&
    profileContext.legacyUserDataPath !== profileContext.userDataPath &&
    (await pathExists(profileContext.legacyUserDataPath))
  ) {
    await fs.mkdir(path.dirname(profileContext.userDataPath), { recursive: true });
    await fs.cp(profileContext.legacyUserDataPath, profileContext.userDataPath, {
      recursive: true,
      errorOnExist: false
    });
    await upsertProfileMetadata(profileContext.slug, {
      name: profileContext.label,
      lastUsedAt: new Date().toISOString()
    });
    return;
  }

  await fs.mkdir(profileContext.userDataPath, { recursive: true });
  await upsertProfileMetadata(profileContext.slug, {
    name: profileContext.label,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString()
  }, {
    preserveName: false
  });
}

async function persistActiveProfileSelection(profileSlug) {
  const existingState = (await readJsonFile(profileContext.launcherStatePath, {})) || {};

  await writeJsonFile(profileContext.launcherStatePath, {
    ...existingState,
    activeProfileSlug: sanitizeProfileName(profileSlug),
    updatedAt: new Date().toISOString()
  });
}

async function resolveProfileDataDirectory(userDataPath) {
  const settings = await readJsonFile(path.join(userDataPath, "launcher-settings.json"), null);
  return settings?.dataDirectory || path.join(userDataPath, "game-data");
}

async function collectLegacyAccountSessionPaths() {
  await fs.mkdir(profileContext.profilesRootPath, { recursive: true });

  const entries = await fs.readdir(profileContext.profilesRootPath, {
    withFileTypes: true
  });
  const profileDirectories = [
    profileContext.userDataPath,
    ...entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(profileContext.profilesRootPath, entry.name))
      .filter((entryPath) => entryPath !== profileContext.userDataPath)
  ];
  const legacyPaths = [];

  for (const profileDirectory of profileDirectories) {
    const dataDirectory = await resolveProfileDataDirectory(profileDirectory);
    const legacySessionPath = path.join(dataDirectory, "account-session.json");

    if (legacySessionPath === profileContext.authStatePath) {
      continue;
    }

    if (await pathExists(legacySessionPath)) {
      legacyPaths.push(legacySessionPath);
    }
  }

  return legacyPaths;
}

async function ensureSharedAccountStorage() {
  const legacyPaths = await collectLegacyAccountSessionPaths();
  const savedSessions = [];

  if (await pathExists(profileContext.authStatePath)) {
    savedSessions.push(await readJsonFile(profileContext.authStatePath, null));
  }

  for (const legacyPath of legacyPaths) {
    savedSessions.push(await readJsonFile(legacyPath, null));
  }

  const mergedSession = mergeSavedSessions(savedSessions);

  if (mergedSession.accounts.length > 0) {
    await writeJsonFile(profileContext.authStatePath, mergedSession);
  }

  for (const legacyPath of legacyPaths) {
    await fs.rm(legacyPath, {
      force: true
    });
  }
}

async function createProfile(profileName) {
  const requestedName = String(profileName || "").trim();

  if (!requestedName) {
    throw new Error("Bitte gib einen Profilnamen ein.");
  }

  const profileSlug = sanitizeProfileName(requestedName);
  const paths = resolveProfilePaths(profileSlug);

  if (await pathExists(paths.userDataPath)) {
    throw new Error("Ein Profil mit diesem Namen existiert bereits.");
  }

  await fs.mkdir(paths.userDataPath, { recursive: true });
  await upsertProfileMetadata(profileSlug, {
    name: requestedName,
    createdAt: new Date().toISOString(),
    lastUsedAt: null
  }, {
    preserveName: false
  });

  return buildProfileSummary(profileSlug);
}

async function renameProfile(profileSlug, nextName) {
  const targetSlug = sanitizeProfileName(profileSlug);
  const requestedName = String(nextName || "").trim();

  if (!requestedName) {
    throw new Error("Bitte gib einen Profilnamen ein.");
  }

  const profiles = await listProfiles();
  const existingProfile = profiles.find((entry) => entry.slug === targetSlug);

  if (!existingProfile) {
    throw new Error("Profil wurde nicht gefunden.");
  }

  const normalizedRequestedName = requestedName.toLocaleLowerCase("de-DE");
  const duplicateProfile = profiles.find((entry) => {
    if (entry.slug === targetSlug) {
      return false;
    }

    return String(entry.name || "").trim().toLocaleLowerCase("de-DE") === normalizedRequestedName;
  });

  if (duplicateProfile) {
    throw new Error("Ein anderes Profil verwendet bereits diesen Namen.");
  }

  await upsertProfileMetadata(targetSlug, {
    name: requestedName
  }, {
    preserveName: false
  });

  return buildProfileSummary(targetSlug);
}

async function setProfileIcon(profileSlug, sourcePath) {
  const targetSlug = sanitizeProfileName(profileSlug);
  const resolvedSourcePath = String(sourcePath || "").trim();

  if (!resolvedSourcePath) {
    throw new Error("Bitte wähle eine Bilddatei für das Profil aus.");
  }

  const paths = resolveProfilePaths(targetSlug);

  if (!(await pathExists(paths.userDataPath))) {
    throw new Error("Profil wurde nicht gefunden.");
  }

  const iconFileName = resolveProfileIconFileName(resolvedSourcePath);

  if (!iconFileName) {
    throw new Error("Nur PNG, JPG, WEBP, GIF, BMP oder ICO können als Profil-Icon verwendet werden.");
  }

  const sourceStats = await fs.stat(resolvedSourcePath).catch(() => null);

  if (!sourceStats?.isFile()) {
    throw new Error("Die ausgewählte Icon-Datei konnte nicht gelesen werden.");
  }

  const iconPath = path.join(paths.userDataPath, iconFileName);

  await fs.mkdir(paths.userDataPath, { recursive: true });
  if (path.resolve(resolvedSourcePath) !== path.resolve(iconPath)) {
    await fs.copyFile(resolvedSourcePath, iconPath);
  }
  await removeOtherProfileIcons(paths.userDataPath, iconFileName);
  await upsertProfileMetadata(targetSlug, {
    iconFileName
  });

  return buildProfileSummary(targetSlug);
}

async function pickLauncherBackgroundImage(parentWindow) {
  const result = await dialog.showOpenDialog(parentWindow, {
    title: getLocalizedMainText("Launcher-Hintergrund auswählen", "Select launcher background"),
    buttonLabel: getLocalizedMainText("Hintergrund übernehmen", "Use background"),
    properties: ["openFile"],
    filters: [
      {
        name: getLocalizedMainText("Bilder", "Images"),
        extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "ico"]
      }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
}

async function setLauncherBackgroundImage(sourcePath) {
  const resolvedSourcePath = String(sourcePath || "").trim();

  if (!resolvedSourcePath) {
    throw new Error("Bitte wähle eine Bilddatei für den Launcher-Hintergrund aus.");
  }

  const backgroundFileName = resolveLauncherBackgroundFileName(resolvedSourcePath);

  if (!backgroundFileName) {
    throw new Error("Das ausgewählte Hintergrundbild wird nicht unterstützt.");
  }

  const sourceStats = await fs.stat(resolvedSourcePath).catch(() => null);

  if (!sourceStats?.isFile()) {
    throw new Error("Die ausgewählte Hintergrunddatei konnte nicht gelesen werden.");
  }

  const userDataPath = getActiveUserDataPath();
  const backgroundPath = path.join(userDataPath, backgroundFileName);

  await fs.mkdir(userDataPath, { recursive: true });
  if (path.resolve(resolvedSourcePath) !== path.resolve(backgroundPath)) {
    await fs.copyFile(resolvedSourcePath, backgroundPath);
  }
  await removeOtherLauncherBackgrounds(userDataPath, backgroundFileName);

  const result = await saveLauncherSettings({
    userDataPath,
    fallbackMinecraftDirectory: defaultMinecraftDirectory(),
    options: {
      launcherBackgroundFileName: backgroundFileName
    }
  });

  return {
    ...result,
    settings: normalizeLauncherSettings(result.settings, userDataPath)
  };
}

async function removeLauncherBackgroundImage() {
  const userDataPath = getActiveUserDataPath();
  const result = await saveLauncherSettings({
    userDataPath,
    fallbackMinecraftDirectory: defaultMinecraftDirectory(),
    options: {
      launcherBackgroundFileName: null
    }
  });

  await removeOtherLauncherBackgrounds(userDataPath);

  return {
    ...result,
    settings: normalizeLauncherSettings(result.settings, userDataPath)
  };
}

async function deleteProfile(profileSlug) {
  const targetSlug = sanitizeProfileName(profileSlug);

  if (targetSlug === profileContext.slug) {
    throw new Error("Das aktive Profil kann nicht gelöscht werden.");
  }

  if (targetSlug === "default") {
    throw new Error("Das Standard-Profil kann nicht gelöscht werden.");
  }

  const paths = resolveProfilePaths(targetSlug);

  if (!(await pathExists(paths.userDataPath))) {
    throw new Error("Profil wurde nicht gefunden.");
  }

  const deletionTargets = await resolveProfileDeletionTargets(targetSlug);

  for (const targetPath of deletionTargets) {
    if (!(await pathExists(targetPath))) {
      continue;
    }

    await fs.rm(targetPath, {
      recursive: true,
      force: false
    });
  }

  return {
    ok: true,
    slug: targetSlug
  };
}

async function copyDirectoryContents(sourceDirectory, destinationDirectory) {
  await fs.mkdir(destinationDirectory, { recursive: true });
  const entries = await fs.readdir(sourceDirectory, {
    withFileTypes: true
  });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const destinationPath = path.join(destinationDirectory, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryContents(sourcePath, destinationPath);
      continue;
    }

    if (entry.isSymbolicLink()) {
      let resolvedSourcePath = null;

      try {
        resolvedSourcePath = await fs.realpath(sourcePath);
      } catch {
        resolvedSourcePath = null;
      }

      if (!resolvedSourcePath) {
        continue;
      }

      let resolvedStats = null;

      try {
        resolvedStats = await fs.stat(resolvedSourcePath);
      } catch {
        resolvedStats = null;
      }

      if (resolvedStats?.isDirectory()) {
        await copyDirectoryContents(resolvedSourcePath, destinationPath);
        continue;
      }

      if (resolvedStats?.isFile()) {
        await fs.mkdir(path.dirname(destinationPath), { recursive: true });
        await fs.copyFile(resolvedSourcePath, destinationPath);
      }

      continue;
    }

    if (entry.isFile()) {
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.copyFile(sourcePath, destinationPath);
    }
  }
}

async function removePathIfExists(targetPath) {
  await fs.rm(targetPath, {
    recursive: true,
    force: true
  });
}

async function copyIfExists(sourcePath, destinationPath) {
  if (!(await pathExists(sourcePath))) {
    return false;
  }

  const sourceStat = await fs.stat(sourcePath);

  if (sourceStat.isDirectory()) {
    await copyDirectoryContents(sourcePath, destinationPath);
    return true;
  }

  if (sourceStat.isFile()) {
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);
    return true;
  }

  return false;
}

async function countDirectoryEntries(
  targetPath,
  { includeDirectories = true, includeFiles = true, fileExtensions = null } = {}
) {
  try {
    const entries = await fs.readdir(targetPath, {
      withFileTypes: true
    });

    return entries.reduce((count, entry) => {
      if (entry.name.startsWith(".")) {
        return count;
      }

      if (entry.isDirectory()) {
        return includeDirectories ? count + 1 : count;
      }

      if (entry.isFile()) {
        if (!includeFiles) {
          return count;
        }

        if (fileExtensions && !fileExtensions.has(path.extname(entry.name).toLowerCase())) {
          return count;
        }

        return count + 1;
      }

      if (entry.isSymbolicLink()) {
        return count + 1;
      }

      return count;
    }, 0);
  } catch {
    return 0;
  }
}

async function inspectProfileLocalContent(dataDirectory) {
  const manifest = loadManifest();
  const instanceDirectory = path.join(dataDirectory, manifest.instanceDirectory);
  const [entryNames, localModsCount, localResourcePacksCount, localShaderPacksCount, localSaveCount] =
    await Promise.all([
      readDirectoryEntryNames(instanceDirectory),
      countDirectoryEntries(path.join(instanceDirectory, "mods"), {
        includeDirectories: true,
        includeFiles: true,
        fileExtensions: new Set([".jar", ".zip"])
      }),
      countDirectoryEntries(path.join(instanceDirectory, "resourcepacks")),
      countDirectoryEntries(path.join(instanceDirectory, "shaderpacks")),
      countDirectoryEntries(path.join(instanceDirectory, "saves"))
    ]);

  return {
    instanceDirectory,
    localModsCount,
    localResourcePacksCount,
    localShaderPacksCount,
    localSaveCount,
    hasLocalContent:
      looksLikeMinecraftInstanceDirectory(entryNames) ||
      localModsCount > 0 ||
      localResourcePacksCount > 0 ||
      localShaderPacksCount > 0 ||
      localSaveCount > 0
  };
}

async function inspectImportedInstanceContent(sourcePath) {
  const [entryNames, localModsCount, localResourcePacksCount, localShaderPacksCount, localSaveCount] =
    await Promise.all([
      readDirectoryEntryNames(sourcePath),
      countDirectoryEntries(path.join(sourcePath, "mods"), {
        includeDirectories: true,
        includeFiles: true,
        fileExtensions: new Set([".jar", ".zip"])
      }),
      countDirectoryEntries(path.join(sourcePath, "resourcepacks")),
      countDirectoryEntries(path.join(sourcePath, "shaderpacks")),
      countDirectoryEntries(path.join(sourcePath, "saves"))
    ]);

  const metadataIndicators = await Promise.all([
    pathExists(path.join(sourcePath, "profile.json")),
    pathExists(path.join(sourcePath, "minecraftinstance.json"))
  ]);

  return {
    localModsCount,
    localResourcePacksCount,
    localShaderPacksCount,
    localSaveCount,
    hasMetadata: metadataIndicators.some(Boolean),
    hasInstanceMarkers: looksLikeMinecraftInstanceDirectory(entryNames),
    contentScore:
      localModsCount +
      localResourcePacksCount +
      localShaderPacksCount +
      localSaveCount
  };
}

function compareImportCandidates(left, right) {
  const leftMetadataScore = left?.hasMetadata ? 1 : 0;
  const rightMetadataScore = right?.hasMetadata ? 1 : 0;

  if (leftMetadataScore !== rightMetadataScore) {
    return leftMetadataScore - rightMetadataScore;
  }

  const leftContentScore = Number(left?.contentScore || 0);
  const rightContentScore = Number(right?.contentScore || 0);

  if (leftContentScore !== rightContentScore) {
    return leftContentScore - rightContentScore;
  }

  const leftMarkerScore = left?.hasInstanceMarkers ? 1 : 0;
  const rightMarkerScore = right?.hasInstanceMarkers ? 1 : 0;

  if (leftMarkerScore !== rightMarkerScore) {
    return leftMarkerScore - rightMarkerScore;
  }

  const leftRootPriority = Number.isFinite(left?.rootPriority) ? left.rootPriority : Number.MAX_SAFE_INTEGER;
  const rightRootPriority = Number.isFinite(right?.rootPriority) ? right.rootPriority : Number.MAX_SAFE_INTEGER;

  if (leftRootPriority !== rightRootPriority) {
    return rightRootPriority - leftRootPriority;
  }

  return 0;
}

async function resolveUniqueProfileIdentity(profileName) {
  const requestedName = String(profileName || "").trim() || "Import";
  let attempt = 0;

  while (true) {
    const candidateName = attempt === 0 ? requestedName : `${requestedName} ${attempt + 1}`;
    const candidateSlug = sanitizeProfileName(candidateName);
    const candidatePaths = resolveProfilePaths(candidateSlug);

    if (!(await pathExists(candidatePaths.userDataPath))) {
      return {
        name: candidateName,
        slug: candidateSlug,
        ...candidatePaths
      };
    }

    attempt += 1;
  }
}

function collectImportStrings(value) {
  const results = [];

  function visit(entry) {
    if (entry === null || entry === undefined) {
      return;
    }

    if (typeof entry === "string" || typeof entry === "number") {
      const text = String(entry).trim();

      if (text) {
        results.push(text);
      }

      return;
    }

    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }

    if (typeof entry === "object") {
      Object.values(entry).forEach(visit);
    }
  }

  visit(value);
  return results;
}

function detectImportLoader(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized.includes("neoforge") || normalized.includes("neo forge")) {
    return "neoforge";
  }

  if (normalized.includes("quilt")) {
    return "quilt";
  }

  if (normalized.includes("fabric")) {
    return "fabric";
  }

  if (normalized.includes("forge")) {
    return "forge";
  }

  if (normalized.includes("vanilla")) {
    return "vanilla";
  }

  return normalized;
}

function extractMinecraftVersion(...values) {
  for (const value of values) {
    for (const candidate of collectImportStrings(value)) {
      const directMatch = candidate.match(/^\d+\.\d+(?:\.\d+)?$/);

      if (directMatch) {
        return directMatch[0];
      }

      const embeddedMatch = candidate.match(/\b(\d+\.\d+(?:\.\d+)?)\b/);

      if (embeddedMatch?.[1]) {
        return embeddedMatch[1];
      }
    }
  }

  return null;
}

function extractFabricLoaderVersion(...values) {
  for (const value of values) {
    for (const candidate of collectImportStrings(value)) {
      const directMatch = candidate.match(/^\d+(?:\.\d+)+$/);

      if (directMatch) {
        return directMatch[0];
      }

      const embeddedMatch =
        candidate.match(/fabric(?:mc)?(?:\.fabric-loader)?(?:[-_ ]loader)?[-_ ](\d+(?:\.\d+)+)/i) ||
        candidate.match(/net\.fabricmc\.fabric-loader[-_ ](\d+(?:\.\d+)+)/i);

      if (embeddedMatch?.[1]) {
        return embeddedMatch[1];
      }
    }
  }

  return null;
}

function uniquePaths(paths) {
  return [...new Set((paths || []).filter(Boolean).map((entry) => path.resolve(entry)))];
}

function normalizeImportProfileKey(sourceType, profileName) {
  return `${String(sourceType || "").trim().toLowerCase()}:${sanitizeProfileName(profileName)}`;
}

function normalizeImportDirectoryKey(sourceType, sourcePath) {
  return `${String(sourceType || "").trim().toLowerCase()}:${sanitizeProfileName(path.basename(sourcePath || ""))}`;
}

function sameImportIdentity(left, right) {
  const keys = new Set([
    normalizeImportProfileKey(left?.sourceType, left?.profileName),
    normalizeImportDirectoryKey(left?.sourceType, left?.sourcePath)
  ]);

  return [
    normalizeImportProfileKey(right?.sourceType, right?.profileName),
    normalizeImportDirectoryKey(right?.sourceType, right?.sourcePath)
  ].some((entry) => keys.has(entry));
}

function getImportSourceDefinitions() {
  const appDataDirectory = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  const localAppDataDirectory = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");

  if (isWindows) {
    return [
      {
        sourceType: "modrinth",
        sourceLabel: "Modrinth",
        candidateRoots: uniquePaths([
          path.join(appDataDirectory, "ModrinthApp", "profiles"),
          path.join(appDataDirectory, "com.modrinth.theseus", "profiles")
        ])
      },
      {
        sourceType: "curseforge",
        sourceLabel: "CurseForge",
        candidateRoots: uniquePaths([
          path.join(os.homedir(), "curseforge", "minecraft", "Instances"),
          path.join(os.homedir(), "Documents", "curseforge", "minecraft", "Instances"),
          path.join(appDataDirectory, "CurseForge", "Minecraft", "Instances"),
          path.join(localAppDataDirectory, "CurseForge", "Minecraft", "Instances")
        ])
      }
    ];
  }

  return [
    {
      sourceType: "modrinth",
      sourceLabel: "Modrinth",
      candidateRoots: uniquePaths([
        path.join(os.homedir(), ".config", "com.modrinth.theseus", "profiles"),
        path.join(os.homedir(), ".local", "share", "com.modrinth.theseus", "profiles"),
        path.join(os.homedir(), ".config", "ModrinthApp", "profiles")
      ])
    },
    {
      sourceType: "curseforge",
      sourceLabel: "CurseForge",
      candidateRoots: uniquePaths([
        path.join(os.homedir(), "curseforge", "minecraft", "Instances"),
        path.join(os.homedir(), ".config", "CurseForge", "Minecraft", "Instances")
      ])
    }
  ];
}

async function listDirectories(targetPath) {
  try {
    const entries = await fs.readdir(targetPath, {
      withFileTypes: true
    });

    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(targetPath, entry.name));
  } catch {
    return [];
  }
}

async function readDirectoryEntryNames(targetPath) {
  try {
    const entries = await fs.readdir(targetPath, {
      withFileTypes: true
    });

    return new Set(entries.map((entry) => entry.name.toLowerCase()));
  } catch {
    return new Set();
  }
}

function countMatchingEntries(entryNames, names) {
  let matches = 0;

  for (const name of names) {
    if (entryNames.has(name)) {
      matches += 1;
    }
  }

  return matches;
}

function looksLikeMinecraftInstanceDirectory(entryNames) {
  const markerCount = countMatchingEntries(entryNames, [
    ".fabric",
    "config",
    "downloads",
    "mods",
    "options.txt",
    "resourcepacks",
    "saves",
    "servers.dat",
    "shaderpacks"
  ]);

  return markerCount >= 2 && (entryNames.has("mods") || entryNames.has("saves") || entryNames.has("options.txt"));
}

function inferImportLoaderFromEntries(entryNames) {
  if (entryNames.has(".fabric")) {
    return "fabric";
  }

  return null;
}

function isPathInsideRoot(targetPath, rootPath) {
  const relativePath = path.relative(path.resolve(rootPath), path.resolve(targetPath));
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function inferImportSourceFromPath(sourcePath) {
  for (const definition of getImportSourceDefinitions()) {
    for (const candidateRoot of definition.candidateRoots) {
      if (isPathInsideRoot(sourcePath, candidateRoot)) {
        return {
          sourceType: definition.sourceType,
          sourceLabel: definition.sourceLabel
        };
      }
    }
  }

  return null;
}

async function listImportableInstances() {
  const definitions = getImportSourceDefinitions();

  return Promise.all(
    definitions.map(async ({ sourceType, sourceLabel, candidateRoots }) => {
      const availableRoots = [];
      const profiles = [];
      const profilesByKey = new Map();
      const seenProfilePaths = new Set();

      for (const [rootIndex, candidateRoot] of candidateRoots.entries()) {
        if (!(await pathExists(candidateRoot))) {
          continue;
        }

        availableRoots.push(candidateRoot);

        const instanceDirectories = await listDirectories(candidateRoot);

        for (const instanceDirectory of instanceDirectories) {
          const normalizedInstanceDirectory = path.resolve(instanceDirectory);

          if (seenProfilePaths.has(normalizedInstanceDirectory)) {
            continue;
          }

          seenProfilePaths.add(normalizedInstanceDirectory);

          try {
            const detectedInstance = await detectImportedInstance(normalizedInstanceDirectory, {
              sourceTypeHint: sourceType,
              sourceLabelHint: sourceLabel
            });

            if (detectedInstance.sourceType !== sourceType) {
              continue;
            }

            const contentInfo = await inspectImportedInstanceContent(normalizedInstanceDirectory);
            const supported =
              !detectedInstance.loaderType ||
              ["fabric", "vanilla"].includes(detectedInstance.loaderType);
            const profileEntry = {
              name: detectedInstance.profileName,
              sourcePath: normalizedInstanceDirectory,
              sourceType,
              sourceLabel,
              loaderType: detectedInstance.loaderType || null,
              minecraftVersion: detectedInstance.minecraftVersion || null,
              fabricLoaderVersion: detectedInstance.fabricLoaderVersion || null,
              hasMetadata: contentInfo.hasMetadata,
              hasInstanceMarkers: contentInfo.hasInstanceMarkers,
              contentScore: contentInfo.contentScore,
              rootPriority: rootIndex,
              supported
            };
            const profileKey = normalizeImportDirectoryKey(sourceType, normalizedInstanceDirectory);
            const existingEntry = profilesByKey.get(profileKey);

            if (!existingEntry || compareImportCandidates(existingEntry, profileEntry) < 0) {
              profilesByKey.set(profileKey, profileEntry);
            }
          } catch {
            // Ignore unrelated folders in launcher instance directories.
          }
        }
      }

      profiles.push(...profilesByKey.values());

      profiles.sort((left, right) => {
        if (left.supported !== right.supported) {
          return left.supported ? -1 : 1;
        }

        return left.name.localeCompare(right.name, "de", {
          sensitivity: "base"
        });
      });

      return {
        sourceType,
        sourceLabel,
        availableRoots,
        candidateRoots,
        detected: availableRoots.length > 0,
        profiles
      };
    })
  );
}

async function detectImportedInstance(sourcePath, { sourceTypeHint = null, sourceLabelHint = null } = {}) {
  const modrinthMetadataPath = path.join(sourcePath, "profile.json");

  if (await pathExists(modrinthMetadataPath)) {
    const profileData = (await readJsonFile(modrinthMetadataPath, {})) || {};
    const metadata = profileData.metadata || {};

    return {
      sourceType: "modrinth",
      sourceLabel: "Modrinth",
      profileName:
        String(metadata.name || profileData.name || path.basename(sourcePath)).trim() ||
        path.basename(sourcePath),
      loaderType: detectImportLoader(
        metadata.loader || profileData.loader || metadata.modLoader || profileData.modLoader
      ),
      minecraftVersion: extractMinecraftVersion(
        metadata.game_version,
        metadata.gameVersion,
        metadata.minecraft_version,
        metadata.minecraftVersion,
        profileData.game_version,
        profileData.gameVersion
      ),
      fabricLoaderVersion: extractFabricLoaderVersion(
        metadata.loader_version,
        metadata.loaderVersion,
        profileData.loader_version,
        profileData.loaderVersion
      )
    };
  }

  const curseForgeMetadataPath = path.join(sourcePath, "minecraftinstance.json");

  if (await pathExists(curseForgeMetadataPath)) {
    const instanceData = (await readJsonFile(curseForgeMetadataPath, {})) || {};
    const baseModLoader = instanceData.baseModLoader || {};

    return {
      sourceType: "curseforge",
      sourceLabel: "CurseForge",
      profileName:
        String(instanceData.name || instanceData.displayName || path.basename(sourcePath)).trim() ||
        path.basename(sourcePath),
      loaderType: detectImportLoader(
        baseModLoader.name ||
        baseModLoader.id ||
        baseModLoader.type ||
        instanceData.modLoader ||
        instanceData.modloader
      ),
      minecraftVersion: extractMinecraftVersion(
        instanceData.gameVersion,
        instanceData.minecraftVersion,
        baseModLoader.minecraftVersion,
        baseModLoader.gameVersion
      ),
      fabricLoaderVersion: extractFabricLoaderVersion(
        baseModLoader.version,
        baseModLoader.name,
        baseModLoader.id
      )
    };
  }

  const entryNames = await readDirectoryEntryNames(sourcePath);
  const inferredSource =
    (sourceTypeHint && {
      sourceType: sourceTypeHint,
      sourceLabel: sourceLabelHint || (sourceTypeHint === "curseforge" ? "CurseForge" : "Modrinth")
    }) ||
    inferImportSourceFromPath(sourcePath);

  if (inferredSource?.sourceType === "modrinth" && looksLikeMinecraftInstanceDirectory(entryNames)) {
    return {
      sourceType: "modrinth",
      sourceLabel: "Modrinth",
      profileName: path.basename(sourcePath),
      loaderType: inferImportLoaderFromEntries(entryNames),
      minecraftVersion: extractMinecraftVersion(path.basename(sourcePath)),
      fabricLoaderVersion: null
    };
  }

  if (inferredSource?.sourceType === "curseforge" && looksLikeMinecraftInstanceDirectory(entryNames)) {
    return {
      sourceType: "curseforge",
      sourceLabel: "CurseForge",
      profileName: path.basename(sourcePath),
      loaderType: inferImportLoaderFromEntries(entryNames),
      minecraftVersion: extractMinecraftVersion(path.basename(sourcePath)),
      fabricLoaderVersion: null
    };
  }

  throw new Error("Im gewählten Ordner wurde keine Modrinth- oder CurseForge-Instanz gefunden.");
}

async function resolvePreferredImportSource(sourcePath, detectedInstance) {
  const normalizedSourcePath = path.resolve(sourcePath);
  const importDefinition = getImportSourceDefinitions().find(
    (entry) => entry.sourceType === detectedInstance?.sourceType
  );

  if (!importDefinition) {
    return {
      ...detectedInstance,
      sourcePath: normalizedSourcePath
    };
  }

  const currentContent = await inspectImportedInstanceContent(normalizedSourcePath);
  let preferredCandidate = {
    ...detectedInstance,
    sourcePath: normalizedSourcePath,
    hasMetadata: currentContent.hasMetadata,
    hasInstanceMarkers: currentContent.hasInstanceMarkers,
    contentScore: currentContent.contentScore,
    rootPriority: importDefinition.candidateRoots.findIndex((rootPath) =>
      isPathInsideRoot(normalizedSourcePath, rootPath)
    )
  };

  for (const [rootIndex, candidateRoot] of importDefinition.candidateRoots.entries()) {
    if (!(await pathExists(candidateRoot))) {
      continue;
    }

    const candidateDirectories = await listDirectories(candidateRoot);

    for (const candidateDirectory of candidateDirectories) {
      const normalizedCandidateDirectory = path.resolve(candidateDirectory);

      if (normalizedCandidateDirectory === normalizedSourcePath) {
        continue;
      }

      try {
        const candidateInstance = await detectImportedInstance(normalizedCandidateDirectory, {
          sourceTypeHint: importDefinition.sourceType,
          sourceLabelHint: importDefinition.sourceLabel
        });

        if (!sameImportIdentity(
          {
            ...detectedInstance,
            sourcePath: normalizedSourcePath
          },
          {
            ...candidateInstance,
            sourcePath: normalizedCandidateDirectory
          }
        )) {
          continue;
        }

        const candidateContent = await inspectImportedInstanceContent(normalizedCandidateDirectory);
        const candidateEntry = {
          ...candidateInstance,
          sourcePath: normalizedCandidateDirectory,
          hasMetadata: candidateContent.hasMetadata,
          hasInstanceMarkers: candidateContent.hasInstanceMarkers,
          contentScore: candidateContent.contentScore,
          rootPriority: rootIndex
        };

        if (compareImportCandidates(preferredCandidate, candidateEntry) < 0) {
          preferredCandidate = candidateEntry;
        }
      } catch {
        // Ignore unrelated instance folders while resolving duplicate launcher profiles.
      }
    }
  }

  return preferredCandidate;
}

async function importProfileInstance(sourcePath) {
  const normalizedSourcePath = path.resolve(String(sourcePath || "").trim());

  if (!normalizedSourcePath) {
    throw new Error("Kein Instanzordner ausgewählt.");
  }

  if (!(await pathExists(normalizedSourcePath))) {
    throw new Error("Der gewählte Instanzordner wurde nicht gefunden.");
  }

  const detectedInstance = await detectImportedInstance(normalizedSourcePath);
  const preferredSource = await resolvePreferredImportSource(normalizedSourcePath, detectedInstance);

  if (
    preferredSource.loaderType &&
    !["fabric", "vanilla"].includes(preferredSource.loaderType)
  ) {
    throw new Error(
      `${preferredSource.sourceLabel}-Instanzen mit ${preferredSource.loaderType} werden aktuell nicht unterstützt. Importiert werden nur Fabric-Instanzen.`
    );
  }

  const targetProfile = await resolveUniqueProfileIdentity(preferredSource.profileName);
  const manifest = loadManifest();
  const targetDataDirectory = path.join(targetProfile.userDataPath, "game-data");
  const targetInstanceDirectory = path.join(targetDataDirectory, manifest.instanceDirectory);

  await fs.mkdir(targetProfile.userDataPath, { recursive: true });
  await copyDirectoryContents(preferredSource.sourcePath, targetInstanceDirectory);
  await upsertProfileMetadata(targetProfile.slug, {
    name: targetProfile.name,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    importedFrom: {
      label: preferredSource.sourceLabel,
      sourcePath: preferredSource.sourcePath,
      sourceType: preferredSource.sourceType
    }
  }, {
    preserveName: false
  });

  await saveLauncherSettings({
    userDataPath: targetProfile.userDataPath,
    fallbackMinecraftDirectory: defaultMinecraftDirectory(),
    options: {
      dataDirectory: targetDataDirectory,
      modding: {
        minecraftVersion: preferredSource.minecraftVersion || manifest.minecraftVersion,
        fabricLoaderVersion:
          preferredSource.loaderType === "fabric" ? preferredSource.fabricLoaderVersion || null : null,
        selectedMods: []
      }
    }
  });
  await adoptImportedProjectMatches({
    userDataPath: targetProfile.userDataPath,
    fallbackMinecraftDirectory: defaultMinecraftDirectory(),
    projectType: "mod"
  });

  const profileSummary = await buildProfileSummary(targetProfile.slug);

  return {
    ...profileSummary,
    sourceLabel: preferredSource.sourceLabel,
    sourceType: preferredSource.sourceType
  };
}

function defaultMinecraftDirectory() {
  if (isWindows) {
    return path.join(os.homedir(), "AppData", "Roaming", ".minecraft");
  }

  return path.join(os.homedir(), ".minecraft");
}

function buildPresenceContext({
  manifest = null,
  settings = null,
  installState = null,
  account = null,
  launchState = null,
  profileLabel = profileContext.label
} = {}) {
  const settingsLanguage = String(settings?.language || "").trim().toLowerCase();
  const language = ["de", "en"].includes(settingsLanguage)
    ? settingsLanguage
    : lastPresenceLanguage;
  lastPresenceLanguage = language;

  return {
    accountName: account?.name || null,
    language,
    minecraftVersion:
      settings?.modding?.minecraftVersion ||
      installState?.minecraftVersion ||
      manifest?.minecraftVersion ||
      null,
    launchPhase: launchState?.phase || null,
    profileLabel
  };
}

function dispatchLauncherEvent(webContents, payload, context = {}) {
  webContents.send("launcher:event", payload);
  void discordPresence.updateFromLauncherEvent(payload, buildPresenceContext({
    ...context,
    launchState: payload?.launchState || context.launchState || null
  }));
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function getLauncherWindowState(targetWindow = mainWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) {
    return {
      isFullScreen: false,
      isMaximized: false,
      isRestorable: false
    };
  }

  const isFullScreen = targetWindow.isFullScreen();
  const isMaximized = targetWindow.isMaximized();

  return {
    isFullScreen,
    isMaximized,
    isRestorable: isFullScreen || isMaximized
  };
}

function emitLauncherWindowState(targetWindow = mainWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) {
    return;
  }

  targetWindow.webContents.send("launcher:window-state", getLauncherWindowState(targetWindow));
}

function stopLauncherWindowDrag(targetWindow = null) {
  if (
    !launcherWindowDragState ||
    (targetWindow && launcherWindowDragState.windowId !== targetWindow.id)
  ) {
    return;
  }

  launcherWindowDragState = null;

  if (launcherWindowDragTimer) {
    clearInterval(launcherWindowDragTimer);
    launcherWindowDragTimer = null;
  }
}

function updateLauncherWindowDragPosition() {
  if (!launcherWindowDragState) {
    if (launcherWindowDragTimer) {
      clearInterval(launcherWindowDragTimer);
      launcherWindowDragTimer = null;
    }
    return;
  }

  const targetWindow = BrowserWindow.fromId(launcherWindowDragState.windowId);

  if (!targetWindow || targetWindow.isDestroyed()) {
    stopLauncherWindowDrag(null);
    return;
  }

  const cursorPoint = screen.getCursorScreenPoint();

  targetWindow.setPosition(
    Math.round(cursorPoint.x - launcherWindowDragState.offsetX),
    Math.round(cursorPoint.y - launcherWindowDragState.offsetY)
  );
}

function ensureLauncherWindowDragLoop() {
  if (launcherWindowDragTimer) {
    return;
  }

  launcherWindowDragTimer = setInterval(() => {
    updateLauncherWindowDragPosition();
  }, 1000 / 60);
}

function waitForLauncherWindowToRestore(targetWindow, timeoutMs = 400) {
  return new Promise((resolve) => {
    if (
      !targetWindow ||
      targetWindow.isDestroyed() ||
      (!targetWindow.isMaximized() && !targetWindow.isFullScreen())
    ) {
      resolve();
      return;
    }

    let settled = false;
    let timeoutId = null;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      targetWindow.removeListener("unmaximize", finish);
      targetWindow.removeListener("leave-full-screen", finish);
      resolve();
    };

    timeoutId = setTimeout(finish, timeoutMs);
    targetWindow.once("unmaximize", finish);
    targetWindow.once("leave-full-screen", finish);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0c1117",
    title: formatWindowTitle(),
    icon: path.join(__dirname, "..", "boocord_logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on("closed", () => {
    stopLauncherWindowDrag(mainWindow);
    if (mainWindow && mainWindow.isDestroyed()) {
      mainWindow = null;
    }
  });

  ["blur", "minimize"].forEach((eventName) => {
    mainWindow.on(eventName, () => {
      stopLauncherWindowDrag(mainWindow);
    });
  });

  ["maximize", "unmaximize", "enter-full-screen", "leave-full-screen"].forEach((eventName) => {
    mainWindow.on(eventName, () => {
      if (eventName === "maximize" || eventName === "enter-full-screen") {
        stopLauncherWindowDrag(mainWindow);
      }
      emitLauncherWindowState(mainWindow);
    });
  });

  mainWindow.webContents.on("did-finish-load", () => {
    emitLauncherWindowState(mainWindow);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { action: "deny" };
    }

    return { action: "allow" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (/^https?:\/\//i.test(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function registerSharedIpcHandlers() {
  ipcMain.handle("clipboard:write-text", (_event, value = "") => {
    clipboard.writeText(String(value ?? ""));
    return { ok: true };
  });
}

async function startLauncherApp() {
  await ensureProfileStorage();
  await persistActiveProfileSelection(profileContext.slug);
  await ensureSharedAccountStorage();
  const manifest = loadManifest();
  void discordPresence.initialize();

  ipcMain.handle("launcher:window-state", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    return getLauncherWindowState(window);
  });

  ipcMain.handle("launcher:window-minimize", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
    return { ok: true };
  });

  ipcMain.handle("launcher:window-toggle-maximize", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window || window.isDestroyed()) {
      return {
        isFullScreen: false,
        isMaximized: false,
        isRestorable: false,
        ok: false
      };
    }

    if (window.isFullScreen()) {
      stopLauncherWindowDrag(window);
      window.setFullScreen(false);
      await waitForLauncherWindowToRestore(window);
    } else if (window.isMaximized()) {
      stopLauncherWindowDrag(window);
      window.unmaximize();
    } else {
      window.maximize();
    }

    const nextState = {
      ...getLauncherWindowState(window),
      ok: true
    };

    emitLauncherWindowState(window);
    return nextState;
  });

  ipcMain.handle("launcher:window-begin-drag", (event, payload = {}) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window || window.isDestroyed()) {
      return {
        isFullScreen: false,
        isMaximized: false,
        isRestorable: false,
        ok: false
      };
    }

    if (!window.isMaximized() && !window.isFullScreen()) {
      stopLauncherWindowDrag(window);
      return {
        ...getLauncherWindowState(window),
        isMaximized: false,
        ok: true
      };
    }

    const windowWidth = Math.max(1, Number(payload.windowWidth) || window.getBounds().width);
    const pointerX = Math.max(0, Number(payload.pointerX) || 0);
    const pointerY = Math.max(8, Math.min(Number(payload.pointerY) || 16, 24));
    const pointerRatio = Math.max(0, Math.min(pointerX / windowWidth, 1));
    const normalBounds = window.getNormalBounds();
    const initialCursorPoint = {
      x: Number.isFinite(Number(payload.screenX))
        ? Math.round(Number(payload.screenX))
        : screen.getCursorScreenPoint().x,
      y: Number.isFinite(Number(payload.screenY))
        ? Math.round(Number(payload.screenY))
        : screen.getCursorScreenPoint().y
    };

    return (async () => {
      if (window.isFullScreen()) {
        window.setFullScreen(false);
      } else {
        window.restore();
      }

      await waitForLauncherWindowToRestore(window);

      if (window.isDestroyed()) {
        return {
          isFullScreen: false,
          isMaximized: false,
          isRestorable: false,
          ok: false
        };
      }

      const restoredBounds = {
        ...window.getBounds(),
        width: normalBounds.width,
        height: normalBounds.height
      };
      const targetDisplay = screen.getDisplayNearestPoint(initialCursorPoint);
      const workArea = targetDisplay.workArea;
      const dragRestoreTopInset = 32;
      const unclampedX = Math.round(initialCursorPoint.x - (restoredBounds.width * pointerRatio));
      const nextX = Math.max(
        workArea.x,
        Math.min(unclampedX, workArea.x + Math.max(0, workArea.width - restoredBounds.width))
      );
      const nextY = Math.round(
        Math.max(workArea.y + dragRestoreTopInset, initialCursorPoint.y - pointerY)
      );

      window.setBounds({
        ...restoredBounds,
        x: nextX,
        y: nextY
      });

      const currentCursorPoint = screen.getCursorScreenPoint();
      launcherWindowDragState = {
        offsetX: currentCursorPoint.x - nextX,
        offsetY: currentCursorPoint.y - nextY,
        windowId: window.id
      };

      updateLauncherWindowDragPosition();
      ensureLauncherWindowDragLoop();

      emitLauncherWindowState(window);

      return {
        ...getLauncherWindowState(window),
        isMaximized: false,
        ok: true
      };
    })();
  });

  ipcMain.handle("launcher:window-update-drag", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (
      !window ||
      window.isDestroyed() ||
      !launcherWindowDragState ||
      launcherWindowDragState.windowId !== window.id
    ) {
      return { ok: false };
    }

    const cursorPoint = screen.getCursorScreenPoint();

    window.setPosition(
      Math.round(cursorPoint.x - launcherWindowDragState.offsetX),
      Math.round(cursorPoint.y - launcherWindowDragState.offsetY)
    );

    return { ok: true };
  });

  ipcMain.handle("launcher:window-end-drag", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    stopLauncherWindowDrag(window || null);
    return { ok: true };
  });

  ipcMain.handle("launcher:window-close", (event) => {
    stopLauncherWindowDrag(BrowserWindow.fromWebContents(event.sender) || null);
    BrowserWindow.fromWebContents(event.sender)?.close();
    return { ok: true };
  });

  async function buildLauncherUiState({ fast = false } = {}) {
    const launcherState = await getLauncherState({
      manifest,
      userDataPath: getActiveUserDataPath(),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      authStatePath: profileContext.authStatePath,
      fast
    });
    const profiles = await listProfiles();
    const activeProfile = profiles.find((entry) => entry.isActive);
    const activeProfileLabel = activeProfile?.name || profileContext.label;

    profileContext.label = activeProfileLabel;
    syncWindowTitles(activeProfileLabel);

    void discordPresence.syncLauncherState({
      ...buildPresenceContext({
        manifest,
        settings: normalizeLauncherSettings(launcherState.settings, getActiveUserDataPath()),
        installState: launcherState.installState,
        account: launcherState.account,
        launchState: launcherState.launchState,
        profileLabel: activeProfileLabel
      }),
      isRunning: launcherState.isRunning,
      launchState: launcherState.launchState
    });

    return {
      ...launcherState,
      settings: normalizeLauncherSettings(launcherState.settings, getActiveUserDataPath()),
      profile: {
        ...profileContext,
        label: activeProfileLabel
      },
      profiles
    };
  }

  async function switchActiveProfile(profileSlug) {
    const currentState = await getLauncherState({
      manifest,
      userDataPath: getActiveUserDataPath(),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      authStatePath: profileContext.authStatePath,
      fast: true
    });

    if (currentState.launchState?.canStop) {
      throw new Error("Profilwechsel ist nicht möglich, solange Minecraft startet oder läuft.");
    }

    const targetSlug = sanitizeProfileName(profileSlug);

    if (targetSlug === profileContext.slug) {
      return buildLauncherUiState({
        fast: true
      });
    }

    const targetPaths = resolveProfilePaths(targetSlug);

    if (!(await pathExists(targetPaths.userDataPath))) {
      throw new Error("Profil wurde nicht gefunden.");
    }

    const metadata = await upsertProfileMetadata(targetSlug, {
      lastUsedAt: new Date().toISOString()
    });

    profileContext.slug = targetSlug;
    profileContext.isCustom = targetSlug !== "default";
    profileContext.userDataPath = targetPaths.userDataPath;
    profileContext.metadataPath = targetPaths.metadataPath;
    profileContext.label = formatProfileLabel(targetSlug, metadata?.name);
    app.setPath("userData", targetPaths.userDataPath);

    await ensureProfileStorage();
    await persistActiveProfileSelection(targetSlug);

    return buildLauncherUiState({
      fast: false
    });
  }

  ipcMain.handle("launcher:get-state", async (_event, options = {}) => {
    return buildLauncherUiState({
      fast: Boolean(options.fast)
    });
  });

  ipcMain.handle("launcher:get-modding-state", async () =>
    getModdingState({
      manifest,
      userDataPath: getActiveUserDataPath(),
      fallbackMinecraftDirectory: defaultMinecraftDirectory()
    })
  );

  ipcMain.handle("dialog:select-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle("dialog:select-profile-import-source", async () => {
    const result = await dialog.showOpenDialog({
      title: getLocalizedMainText(
        "Modrinth- oder CurseForge-Instanz auswählen",
        "Select a Modrinth or CurseForge instance"
      ),
      buttonLabel: getLocalizedMainText("Instanz importieren", "Import instance"),
      properties: ["openDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle("profiles:get-import-sources", async () =>
    listImportableInstances()
  );

  ipcMain.handle("dialog:select-profile-icon", async (event) => {
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
      title: getLocalizedMainText("Profil-Icon auswählen", "Select profile icon"),
      buttonLabel: getLocalizedMainText("Icon übernehmen", "Use icon"),
      properties: ["openFile"],
      filters: [
        {
          name: getLocalizedMainText("Bilder", "Images"),
          extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "ico"]
        }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle("launcher:pick-background-image", async (event) => {
    const sourcePath = await pickLauncherBackgroundImage(BrowserWindow.fromWebContents(event.sender));

    if (!sourcePath) {
      return null;
    }

    return setLauncherBackgroundImage(sourcePath);
  });

  ipcMain.handle("launcher:remove-background-image", async () =>
    removeLauncherBackgroundImage()
  );

  ipcMain.handle("dialog:select-local-projects", async (event, payload = {}) => {
    const result = await dialog.showOpenDialog(
      BrowserWindow.fromWebContents(event.sender),
      buildLocalProjectImportDialogOptions(payload.projectType)
    );

    if (result.canceled || result.filePaths.length === 0) {
      return [];
    }

    return result.filePaths;
  });

  ipcMain.handle("launcher:login", async (event, options) => {
    const result = await loginWithMicrosoft({
      parentWindow: BrowserWindow.fromWebContents(event.sender),
      userDataPath: getActiveUserDataPath(),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      authStatePath: profileContext.authStatePath,
      options,
      emit(payload) {
        dispatchLauncherEvent(event.sender, payload, {
          manifest
        });
      }
    });

    void discordPresence.setLauncherPresence(buildPresenceContext({
      manifest,
      settings: result.settings,
      account: result.account
    }));

    return normalizeSettingsResult(result);
  });

  ipcMain.handle("launcher:logout", async (_event, options) => {
    const result = await logout({
      userDataPath: getActiveUserDataPath(),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      authStatePath: profileContext.authStatePath,
      options
    });

    void discordPresence.setLauncherPresence(buildPresenceContext({
      manifest,
      settings: result.settings,
      account: result.account
    }));

    return normalizeSettingsResult(result);
  });

  ipcMain.handle("launcher:switch-account", async (_event, options) => {
    const result = await switchAccount({
      userDataPath: getActiveUserDataPath(),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      authStatePath: profileContext.authStatePath,
      options
    });

    void discordPresence.setLauncherPresence(buildPresenceContext({
      manifest,
      settings: result.settings,
      account: result.account
    }));

    return normalizeSettingsResult(result);
  });

  ipcMain.handle("launcher:install", async (event, options) => {
    const result = await installRuntime({
      userDataPath: getActiveUserDataPath(),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      options,
      emit(payload) {
        dispatchLauncherEvent(event.sender, payload, {
          manifest
        });
      }
    });

    void discordPresence.setReadyPresence(buildPresenceContext({
      manifest,
      settings: result.settings,
      installState: result.installState
    }));

    return normalizeSettingsResult(result);
  });

  ipcMain.handle("launcher:reinstall-java", async (event, options) => {
    const result = await reinstallManagedJavaRuntime({
      userDataPath: getActiveUserDataPath(),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      options,
      emit(payload) {
        dispatchLauncherEvent(event.sender, payload, {
          manifest
        });
      }
    });

    void discordPresence.setReadyPresence(buildPresenceContext({
      manifest,
      settings: result.settings
    }));

    return normalizeSettingsResult(result);
  });

  ipcMain.handle("launcher:save-settings", async (_event, options) => {
    const result = await saveLauncherSettings({
      userDataPath: getActiveUserDataPath(),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      options
    });
    const normalizedResult = {
      ...result,
      settings: normalizeLauncherSettings(result.settings, getActiveUserDataPath())
    };

    void discordPresence.setLauncherPresence(buildPresenceContext({
      manifest,
      settings: normalizedResult.settings
    }));

    return normalizedResult;
  });

  ipcMain.handle("modding:search", async (_event, payload) =>
    searchModrinthProjects(payload || {})
  );

  ipcMain.handle("modding:details", async (_event, payload) =>
    getModrinthProjectDetails(payload || {})
  );

  ipcMain.handle("modding:add-project", async (_event, payload = {}) =>
    normalizeSettingsResult(await addSelectedProject({
      userDataPath: resolveRequestedUserDataPath(payload.profileSlug),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      projectId: payload.projectId,
      projectType: payload.projectType,
      projectSnapshot: payload.projectSnapshot,
      versionId: payload.versionId,
      versionNumber: payload.versionNumber,
      versionName: payload.versionName,
      versionType: payload.versionType
    }), resolveRequestedUserDataPath(payload.profileSlug))
  );

  ipcMain.handle("modding:remove-project", async (_event, payload = {}) =>
    normalizeSettingsResult(await removeSelectedProject({
      userDataPath: resolveRequestedUserDataPath(payload.profileSlug),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      projectId: payload.projectId,
      projectType: payload.projectType,
      projectSnapshot: payload.projectSnapshot
    }), resolveRequestedUserDataPath(payload.profileSlug))
  );

  ipcMain.handle("modding:remove-local-project", async (_event, payload = {}) =>
    normalizeSettingsResult(await removeLocalImportedProject({
      userDataPath: resolveRequestedUserDataPath(payload.profileSlug),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      localFileName: payload.localFileName,
      projectType: payload.projectType
    }), resolveRequestedUserDataPath(payload.profileSlug))
  );

  ipcMain.handle("modding:import-local-projects", async (_event, payload = {}) =>
    normalizeSettingsResult(await importLocalProjects({
      userDataPath: resolveRequestedUserDataPath(payload.profileSlug),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      sourcePaths: payload.sourcePaths,
      projectType: payload.projectType
    }), resolveRequestedUserDataPath(payload.profileSlug))
  );

  ipcMain.handle("server:get-status", async () =>
    getMinecraftServerStatus({
      host: "boocord.com"
    })
  );

  ipcMain.handle("launcher:launch", async (event, options) => {
    const launcherWindow = BrowserWindow.fromWebContents(event.sender);
    const result = await launchClient({
      userDataPath: getActiveUserDataPath(),
      fallbackMinecraftDirectory: defaultMinecraftDirectory(),
      authStatePath: profileContext.authStatePath,
      options,
      emit(payload) {
        dispatchLauncherEvent(event.sender, payload, {
          manifest
        });
      }
    });
    const normalizedResult = {
      ...result,
      settings: normalizeLauncherSettings(result.settings, getActiveUserDataPath())
    };

    if (normalizedResult.settings.minimizeOnLaunch) {
      launcherWindow?.minimize();
    }

    void discordPresence.setRunningPresence(buildPresenceContext({
      manifest,
      settings: normalizedResult.settings,
      installState: normalizedResult.installState,
      account: normalizedResult.account,
      launchState: normalizedResult.launchState
    }));

    return normalizedResult;
  });

  ipcMain.handle("launcher:stop", async (event) =>
    stopClient({
      emit(payload) {
        dispatchLauncherEvent(event.sender, payload, {
          manifest
        });
      }
    })
  );

  ipcMain.handle("shell:open-path", async (_event, targetPath) => {
    if (!targetPath) {
      return { ok: false, message: "Kein Pfad übergeben." };
    }

    const errorMessage = await shell.openPath(targetPath);
    return {
      ok: errorMessage.length === 0,
      message: errorMessage
    };
  });

  ipcMain.handle("profiles:create", async (_event, payload = {}) =>
    createProfile(payload.name)
  );

  ipcMain.handle("profiles:rename", async (_event, payload = {}) =>
    renameProfile(payload.slug, payload.name)
  );

  ipcMain.handle("profiles:set-icon", async (_event, payload = {}) =>
    setProfileIcon(payload.slug, payload.sourcePath)
  );

  ipcMain.handle("profiles:import", async (_event, payload = {}) =>
    importProfileInstance(payload.sourcePath)
  );

  ipcMain.handle("profiles:delete", async (_event, payload = {}) =>
    deleteProfile(payload.slug)
  );

  ipcMain.handle("profiles:switch", async (_event, payload = {}) => {
    const nextState = await switchActiveProfile(payload.slug);

    return {
      ok: true,
      restarted: false,
      ...nextState
    };
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    focusMainWindow();
  });
}

app.whenReady().then(async () => {
  if (!hasSingleInstanceLock) {
    return;
  }

  registerSharedIpcHandlers();
  await startLauncherApp();
});

app.once("before-quit", () => {
  void discordPresence.dispose();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
