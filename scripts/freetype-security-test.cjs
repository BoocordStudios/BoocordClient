const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const zlib = require("node:zlib");
const {
  extractZipEntry,
  findFreetypeLibraryVersion,
  isVulnerableFreetypeLibraryVersion,
  refreshMinecraftVersionJson,
  resolveFreetypeMitigation
} = require("../src/services/freetypeSecurity");

function sha1(value) {
  return crypto.createHash("sha1").update(value).digest("hex");
}

function buildZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const { name, data, deflate } of entries) {
    const nameBuffer = Buffer.from(name, "utf8");
    const body = deflate ? zlib.deflateRawSync(data) : data;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(offset, 42);
    localParts.push(local, nameBuffer, body);
    centralParts.push(central, nameBuffer);
    offset += local.length + nameBuffer.length + body.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

async function withServer(routes, run) {
  const server = http.createServer((request, response) => {
    const body = routes[request.url];

    if (body === undefined) {
      response.writeHead(404);
      response.end();
      return;
    }

    response.writeHead(200);
    response.end(typeof body === "function" ? body() : body);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("detects which lwjgl-freetype builds still need the patched native", () => {
  assert.equal(isVulnerableFreetypeLibraryVersion("3.3.3"), true);
  assert.equal(isVulnerableFreetypeLibraryVersion("3.4.1"), true);
  assert.equal(isVulnerableFreetypeLibraryVersion("3.4.3"), true);
  assert.equal(isVulnerableFreetypeLibraryVersion("3.4.3-mojang-2.15.0"), false);
  assert.equal(isVulnerableFreetypeLibraryVersion("3.4.4"), false);
  assert.equal(isVulnerableFreetypeLibraryVersion("4.0.0"), false);
  assert.equal(isVulnerableFreetypeLibraryVersion(null), false);

  assert.equal(
    findFreetypeLibraryVersion({
      libraries: [
        { name: "org.lwjgl:lwjgl:3.3.3" },
        { name: "org.lwjgl:lwjgl-freetype:3.3.3:natives-windows" },
        { name: "org.lwjgl:lwjgl-freetype:3.3.3" }
      ]
    }),
    "3.3.3"
  );
  assert.equal(findFreetypeLibraryVersion({ libraries: [{ name: "org.lwjgl:lwjgl-stb:3.2.2" }] }), null);
});

test("reads stored and deflated entries from a jar", () => {
  const payload = crypto.randomBytes(4096);
  const text = Buffer.from("freetype ".repeat(500));
  const archive = buildZip([
    { name: "META-INF/MANIFEST.MF", data: Buffer.from("Manifest-Version: 1.0\n"), deflate: true },
    { name: "windows/x64/stored.bin", data: payload, deflate: false },
    { name: "windows/x64/deflated.bin", data: text, deflate: true }
  ]);

  assert.deepEqual(extractZipEntry(archive, "windows/x64/stored.bin"), payload);
  assert.deepEqual(extractZipEntry(archive, "windows/x64/deflated.bin"), text);
  assert.throws(() => extractZipEntry(archive, "missing.bin"), /does not contain/);
  assert.throws(() => extractZipEntry(Buffer.alloc(64), "missing.bin"), /end record/);
});

test("does not override versions without FreeType or with Mojang's patched build", async () => {
  const securityDirectory = path.join(os.tmpdir(), "boocord-freetype-unused");

  assert.deepEqual(
    await resolveFreetypeMitigation({ versionJson: { libraries: [] }, securityDirectory }),
    { status: "not-affected", javaArgs: [], libraryVersion: null }
  );
  assert.equal(
    (
      await resolveFreetypeMitigation({
        versionJson: { libraries: [{ name: "org.lwjgl:lwjgl-freetype:3.4.3-mojang-2.15.0" }] },
        securityDirectory
      })
    ).status,
    "patched-by-mojang"
  );
  assert.deepEqual(
    await resolveFreetypeMitigation({
      versionJson: { libraries: [{ name: "org.lwjgl:lwjgl-freetype:3.3.3" }] },
      securityDirectory,
      platform: "linux",
      arch: "x64"
    }),
    { status: "unsupported-platform", javaArgs: [], libraryVersion: "3.3.3" }
  );
});

test("replaces a stale cached version JSON and keeps it on bad data", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "boocord-freetype-test-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const versionJsonPath = path.join(directory, "26.3.json");
  const stale = JSON.stringify({ id: "26.3", libraries: [{ name: "org.lwjgl:lwjgl-freetype:3.4.3" }] }, null, 2);
  const fresh = JSON.stringify({
    id: "26.3",
    libraries: [{ name: "org.lwjgl:lwjgl-freetype:3.4.3-mojang-2.15.0" }]
  });
  let versionRequests = 0;

  await withServer({}, async (baseUrl) => {
    const routes = {
      manifest: JSON.stringify({ versions: [{ id: "26.3", url: `${baseUrl}/v/26.3.json`, sha1: sha1(fresh) }] }),
      badManifest: JSON.stringify({ versions: [{ id: "26.3", url: `${baseUrl}/v/26.3.json`, sha1: "0".repeat(40) }] })
    };

    await withServer(
      {
        "/manifest.json": () => routes.manifest,
        "/bad-manifest.json": () => routes.badManifest,
        "/v/26.3.json": () => {
          versionRequests += 1;
          return fresh;
        }
      },
      async (serverUrl) => {
        routes.manifest = routes.manifest.replaceAll(baseUrl, serverUrl);
        routes.badManifest = routes.badManifest.replaceAll(baseUrl, serverUrl);
        const refresh = (manifestName) =>
          refreshMinecraftVersionJson({
            versionDirectory: directory,
            versionId: "26.3",
            manifestUrl: `${serverUrl}/${manifestName}`
          });

        await fs.writeFile(versionJsonPath, stale);
        const mismatch = await refresh("bad-manifest.json");
        assert.equal(mismatch.status, "failed");
        assert.equal(await fs.readFile(versionJsonPath, "utf8"), stale);

        assert.equal((await refresh("manifest.json")).status, "updated");
        assert.equal(await fs.readFile(versionJsonPath, "utf8"), fresh);

        const requestsAfterUpdate = versionRequests;
        assert.equal((await refresh("manifest.json")).status, "current");
        assert.equal(versionRequests, requestsAfterUpdate);

        assert.equal((await refresh("missing.json")).status, "failed");
        assert.equal(await fs.readFile(versionJsonPath, "utf8"), fresh);

        await fs.rm(versionJsonPath);
        await fs.rm(`${versionJsonPath}.mojang-sha1`);
        assert.equal((await refresh("manifest.json")).status, "downloaded");
        assert.equal(await fs.readFile(versionJsonPath, "utf8"), fresh);
      }
    );
  });
});
