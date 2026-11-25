const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { getLauncherState, loadManifest } = require("../src/services/launcherService");

const manifest = loadManifest();

async function readProfileVersion(t, prepare = async () => {}) {
  const userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), "boocord-default-version-"));
  t.after(() => fs.rm(userDataPath, { recursive: true, force: true }));
  await prepare(userDataPath);

  const state = await getLauncherState({
    manifest,
    userDataPath,
    fallbackMinecraftDirectory: userDataPath,
    fast: true
  });

  return state.settings.modding.minecraftVersion;
}

test("new profiles start on the manifest default Minecraft version", async (t) => {
  assert.equal(manifest.minecraftVersion, "26.2");
  assert.equal(await readProfileVersion(t), "26.2");
});

test("profiles with a saved Minecraft version keep it", async (t) => {
  const version = await readProfileVersion(t, (userDataPath) =>
    fs.writeFile(
      path.join(userDataPath, "launcher-settings.json"),
      JSON.stringify({ modding: { minecraftVersion: "1.21.11", selectedMods: [] } })
    )
  );

  assert.equal(version, "1.21.11");
});

test("installed profiles without a saved Minecraft version keep the installed one", async (t) => {
  const version = await readProfileVersion(t, async (userDataPath) => {
    const dataDirectory = path.join(userDataPath, "game-data");
    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(
      path.join(dataDirectory, "installation-state.json"),
      JSON.stringify({ minecraftVersion: "1.21.11" })
    );
  });

  assert.equal(version, "1.21.11");
});
