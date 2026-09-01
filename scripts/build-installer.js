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
const installerPath = path.join(
  projectRoot,
  "dist",
  `Boocord-Client-Installer-${packageJson.version}.exe`
);
const blockmapPath = `${installerPath}.blockmap`;

function runBuilder() {
  console.log("[build] Building the standard English NSIS installer");
  const result = spawnSync(
    process.execPath,
    [electronBuilderCliPath, "--win", "nsis"],
    {
      cwd: projectRoot,
      stdio: "inherit"
    }
  );

  if (result.error) {
    console.error(`[build] electron-builder could not be started: ${result.error.message}`);
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
  console.log(`[build] SHA-256 checksums: ${checksumPath}`);
}

if (!fs.existsSync(electronBuilderCliPath)) {
  console.error("[build] electron-builder is not installed locally. Run `npm ci` first.");
  process.exit(1);
}

runBuilder();

if (!fs.existsSync(installerPath)) {
  console.error(`[build] Installer was not created: ${installerPath}`);
  process.exit(1);
}

console.log(`[build] Installer: ${installerPath}`);
writeChecksums([installerPath, blockmapPath]);
