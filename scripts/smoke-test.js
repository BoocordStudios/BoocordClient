const { getLauncherState, loadManifest } = require("../src/services/launcherService");

const manifest = loadManifest();

if (!manifest.clientName || !manifest.launcherName || !manifest.minecraftVersion || !Array.isArray(manifest.mods)) {
  throw new Error("Manifest ist unvollständig.");
}

(async () => {
  const state = await getLauncherState({
    manifest,
    userDataPath: process.cwd(),
    fallbackMinecraftDirectory: process.cwd()
  });

  console.log(`Manifest für ${manifest.clientName} auf Minecraft ${manifest.minecraftVersion} geladen.`);
  console.log(`Basis-Mods: ${manifest.mods.join(", ")}`);
  console.log(`Standard-Datenordner: ${state.settings.dataDirectory}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
