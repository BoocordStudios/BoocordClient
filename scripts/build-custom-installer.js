const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const packageJson = require(path.join(projectRoot, "package.json"));
const electronBuilderCliPath = path.join(
  projectRoot,
  "node_modules",
  "electron-builder",
  "cli.js"
);
const innerInstallerPath = path.join(projectRoot, "dist", `Boocord Client Setup ${packageJson.version}.exe`);
const wrapperArtifactPath = path.join(projectRoot, "dist", "setup-ui", `Boocord Client Installer ${packageJson.version}.exe`);
const finalArtifactPath = path.join(projectRoot, "dist", `Boocord Client Installer ${packageJson.version}.exe`);

function runStep(label, args) {
  console.log(`[build] ${label}`);
  const result = spawnSync(process.execPath, [electronBuilderCliPath, ...args], {
    cwd: projectRoot,
    stdio: "inherit"
  });

  if (result.error) {
    console.error(`[build] ${label} konnte nicht gestartet werden: ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function sha256File(targetPath) {
  const hash = crypto.createHash("sha256");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  const descriptor = fs.openSync(targetPath, "r");

  try {
    let bytesRead = 0;

    do {
      bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, null);

      if (bytesRead > 0) {
        hash.update(buffer.subarray(0, bytesRead));
      }
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(descriptor);
  }

  return hash.digest("hex");
}

function writeChecksums(targetPaths) {
  const checksumPath = path.join(projectRoot, "dist", "SHA256SUMS.txt");
  const content = targetPaths
    .filter((targetPath) => fs.existsSync(targetPath))
    .map((targetPath) => `${sha256File(targetPath)}  ${path.basename(targetPath)}`)
    .join("\n");

  fs.writeFileSync(checksumPath, `${content}\n`, "utf8");
  console.log(`[build] SHA-256-Prüfsummen: ${checksumPath}`);
}

if (!fs.existsSync(electronBuilderCliPath)) {
  console.error("[build] electron-builder ist nicht lokal installiert. Bitte zuerst `npm ci` ausführen.");
  process.exit(1);
}

runStep("Baue internen NSIS-Installer", ["--win", "nsis"]);

if (!fs.existsSync(innerInstallerPath)) {
  console.error(`[build] Innerer Installer fehlt: ${innerInstallerPath}`);
  process.exit(1);
}

runStep("Baue Boocord-Setup-Wrapper", [
  "--win",
  "portable",
  "--config",
  "scripts/electron-builder.setup-ui.cjs"
]);

if (!fs.existsSync(wrapperArtifactPath)) {
  console.error(`[build] Setup-Wrapper fehlt: ${wrapperArtifactPath}`);
  process.exit(1);
}

fs.copyFileSync(wrapperArtifactPath, finalArtifactPath);
console.log(`[build] Finales Setup-Artefakt: ${finalArtifactPath}`);
writeChecksums([
  finalArtifactPath,
  innerInstallerPath,
  `${innerInstallerPath}.blockmap`
]);
