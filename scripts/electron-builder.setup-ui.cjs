const path = require("node:path");
const packageJson = require("../package.json");

const projectRoot = path.resolve(__dirname, "..");

module.exports = {
  appId: "com.boocord.client.installer",
  artifactName: "Boocord Client Installer ${version}.${ext}",
  asar: true,
  directories: {
    buildResources: path.join(projectRoot, "assets"),
    output: path.join(projectRoot, "dist", "setup-ui")
  },
  extraMetadata: {
    boocordInstallerUi: true,
    name: "boocord-client-installer",
    productName: "Boocord Client Installer"
  },
  extraResources: [
    {
      from: path.join(projectRoot, "dist", `Boocord Client Setup ${packageJson.version}.exe`),
      to: path.join("bootstrap", "BoocordClient-InnerSetup.exe")
    }
  ],
  files: [
    "src/**/*",
    "client.manifest.json",
    "boocord_logo.png",
    "LICENSE",
    "PRIVACY.md",
    "README.md",
    "package.json"
  ],
  npmRebuild: false,
  productName: "Boocord Client Installer",
  win: {
    icon: "boocord_logo.png",
    target: [
      {
        target: "portable",
        arch: [
          "x64"
        ]
      }
    ]
  }
};
