const { getLauncherState, loadManifest } = require("../src/services/launcherService");

const manifest = loadManifest();

if (!manifest.clientName || !manifest.launcherName || !manifest.minecraftVersion || !Array.isArray(manifest.mods)) {
  throw new Error("The manifest is incomplete.");
}

(async () => {
  const state = await getLauncherState({
    manifest,
    userDataPath: process.cwd(),
    fallbackMinecraftDirectory: process.cwd()
  });

  console.log(`Loaded the ${manifest.clientName} manifest for Minecraft ${manifest.minecraftVersion}.`);
  console.log(`Base mods: ${manifest.mods.join(", ")}`);
  console.log(`Default data directory: ${state.settings.dataDirectory}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
