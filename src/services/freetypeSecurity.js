// Mitigation for "minecraft2shell" (FreeType TrueType hinting out-of-bounds write,
// reachable through fonts in resource packs).
//
// Mojang fixed 26.3+ by swapping the lwjgl-freetype library in the version JSON.
// Two gaps remain for a third-party launcher:
//   1. A version JSON that was cached before the fix keeps pointing at the old library.
//   2. Versions 1.20.5 - 26.2 still reference an unpatched lwjgl-freetype.
// This module closes both: it keeps the cached version JSON in sync with Mojang and,
// for versions whose JSON still lists an unpatched build, points LWJGL at Mojang's
// patched FreeType 2.15.0 native through -Dorg.lwjgl.freetype.libname.

const fs = require("node:fs/promises");
const crypto = require("node:crypto");
const path = require("node:path");
const zlib = require("node:zlib");

const versionManifestUrl = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
const userAgent = "boocord-client-launcher/1.0";
const freetypeLibraryPrefix = "org.lwjgl:lwjgl-freetype:";
// Highest plain LWJGL build that bundles a FreeType older than 2.15.0.
const lastVulnerableLwjglVersion = [3, 4, 3];
const patchedFreetypeNatives = {
  "win32-x64": {
    url: "https://libraries.minecraft.net/org/lwjgl/lwjgl-freetype/3.4.3-mojang-2.15.0/lwjgl-freetype-3.4.3-mojang-2.15.0-natives-windows.jar",
    jarSha1: "f85d0f5acaa594f9e93d657f8feff85d6a427b6a",
    entryName: "windows/x64/org/lwjgl/freetype/freetype.dll",
    fileName: "freetype.dll",
    fileSha256: "cf79a6c3b6e8466fa9124ac795a6753512f6a715a768dc7d59b1de22ba19345b",
    directoryName: "freetype-2.15.0-windows-x64"
  }
};

function hashBuffer(buffer, algorithm) {
  return crypto.createHash(algorithm).update(buffer).digest("hex");
}

async function readFileOrNull(targetPath) {
  try {
    return await fs.readFile(targetPath);
  } catch {
    return null;
  }
}

async function fetchBuffer(url, timeoutMs) {
  const response = await fetch(url, {
    headers: { "User-Agent": userAgent },
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function writeFileAtomic(targetPath, buffer) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await fs.writeFile(temporaryPath, buffer);
    await fs.rename(temporaryPath, targetPath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}

// Minimal reader for a single entry of a (non-ZIP64) jar. Callers verify the result by hash.
function extractZipEntry(archive, entryName) {
  const endSignature = 0x06054b50;
  let endOffset = -1;

  for (let offset = archive.length - 22; offset >= Math.max(0, archive.length - 22 - 0xffff); offset -= 1) {
    if (archive.readUInt32LE(offset) === endSignature) {
      endOffset = offset;
      break;
    }
  }

  if (endOffset < 0) {
    throw new Error("Archive has no ZIP end record.");
  }

  const entryCount = archive.readUInt16LE(endOffset + 10);
  let offset = archive.readUInt32LE(endOffset + 16);

  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > archive.length || archive.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Archive has a damaged central directory.");
    }

    const method = archive.readUInt16LE(offset + 10);
    const compressedSize = archive.readUInt32LE(offset + 20);
    const nameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const name = archive.toString("utf8", offset + 46, offset + 46 + nameLength);

    if (name === entryName) {
      if (localOffset + 30 > archive.length || archive.readUInt32LE(localOffset) !== 0x04034b50) {
        throw new Error("Archive has a damaged local header.");
      }

      const dataStart =
        localOffset + 30 + archive.readUInt16LE(localOffset + 26) + archive.readUInt16LE(localOffset + 28);
      const data = archive.subarray(dataStart, dataStart + compressedSize);

      if (method === 0) {
        return Buffer.from(data);
      }

      if (method === 8) {
        return zlib.inflateRawSync(data);
      }

      throw new Error(`Unsupported ZIP compression method ${method}.`);
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  throw new Error(`Archive does not contain ${entryName}.`);
}

function findFreetypeLibraryVersion(versionJson) {
  for (const library of Array.isArray(versionJson?.libraries) ? versionJson.libraries : []) {
    const name = String(library?.name || "");

    if (!name.startsWith(freetypeLibraryPrefix)) {
      continue;
    }

    const parts = name.split(":");

    if (parts.length === 3) {
      return parts[2];
    }
  }

  return null;
}

function isVulnerableFreetypeLibraryVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || ""));

  // Suffixed builds such as "3.4.3-mojang-2.15.0" are Mojang's patched releases.
  if (!match) {
    return false;
  }

  for (let index = 0; index < 3; index += 1) {
    const difference = Number(match[index + 1]) - lastVulnerableLwjglVersion[index];

    if (difference !== 0) {
      return difference < 0;
    }
  }

  return true;
}

// Keeps <versionDirectory>/<versionId>.json identical to what Mojang currently publishes.
// Never throws: on any failure the existing file stays in place.
async function refreshMinecraftVersionJson({
  versionDirectory,
  versionId,
  manifestUrl = versionManifestUrl,
  timeoutMs = 8000
}) {
  const versionJsonPath = path.join(versionDirectory, `${versionId}.json`);
  const markerPath = `${versionJsonPath}.mojang-sha1`;

  try {
    const manifest = JSON.parse((await fetchBuffer(manifestUrl, timeoutMs)).toString("utf8"));
    const entry = (manifest.versions || []).find((candidate) => candidate.id === versionId);

    if (!entry?.url || !/^[0-9a-f]{40}$/i.test(String(entry.sha1 || ""))) {
      return { status: "unknown-version", versionJsonPath };
    }

    const expectedSha1 = entry.sha1.toLowerCase();
    const existing = await readFileOrNull(versionJsonPath);
    const marker = ((await readFileOrNull(markerPath)) || "").toString("utf8").trim().toLowerCase();

    if (existing && (marker === expectedSha1 || hashBuffer(existing, "sha1") === expectedSha1)) {
      if (marker !== expectedSha1) {
        await fs.writeFile(markerPath, expectedSha1);
      }

      return { status: "current", versionJsonPath };
    }

    const body = await fetchBuffer(entry.url, timeoutMs);

    if (hashBuffer(body, "sha1") !== expectedSha1) {
      throw new Error("Version JSON checksum mismatch.");
    }

    JSON.parse(body.toString("utf8"));
    await writeFileAtomic(versionJsonPath, body);
    await fs.writeFile(markerPath, expectedSha1);

    return { status: existing ? "updated" : "downloaded", versionJsonPath };
  } catch (error) {
    return { status: "failed", versionJsonPath, error };
  }
}

async function ensurePatchedFreetypeNative({ securityDirectory, platformKey, timeoutMs = 30000 }) {
  const native = patchedFreetypeNatives[platformKey];
  const targetPath = path.join(securityDirectory, native.directoryName, native.fileName);
  const existing = await readFileOrNull(targetPath);

  if (existing && hashBuffer(existing, "sha256") === native.fileSha256) {
    return targetPath;
  }

  const archive = await fetchBuffer(native.url, timeoutMs);

  if (hashBuffer(archive, "sha1") !== native.jarSha1) {
    throw new Error("Patched FreeType archive checksum mismatch.");
  }

  const library = extractZipEntry(archive, native.entryName);

  if (hashBuffer(library, "sha256") !== native.fileSha256) {
    throw new Error("Patched FreeType library checksum mismatch.");
  }

  await writeFileAtomic(targetPath, library);
  return targetPath;
}

// Returns the JVM arguments needed so the game loads a patched FreeType.
// Never throws: "status" tells the caller what happened.
async function resolveFreetypeMitigation({
  versionJson,
  securityDirectory,
  platform = process.platform,
  arch = process.arch
}) {
  const libraryVersion = findFreetypeLibraryVersion(versionJson);

  if (!libraryVersion) {
    return { status: "not-affected", javaArgs: [], libraryVersion };
  }

  if (!isVulnerableFreetypeLibraryVersion(libraryVersion)) {
    return { status: "patched-by-mojang", javaArgs: [], libraryVersion };
  }

  const platformKey = `${platform}-${arch}`;

  if (!patchedFreetypeNatives[platformKey]) {
    return { status: "unsupported-platform", javaArgs: [], libraryVersion };
  }

  try {
    const libraryPath = await ensurePatchedFreetypeNative({ securityDirectory, platformKey });

    return {
      status: "overridden",
      javaArgs: [`-Dorg.lwjgl.freetype.libname=${libraryPath}`],
      libraryPath,
      libraryVersion
    };
  } catch (error) {
    return { status: "failed", javaArgs: [], libraryVersion, error };
  }
}

module.exports = {
  extractZipEntry,
  findFreetypeLibraryVersion,
  isVulnerableFreetypeLibraryVersion,
  patchedFreetypeNatives,
  refreshMinecraftVersionJson,
  resolveFreetypeMitigation
};
