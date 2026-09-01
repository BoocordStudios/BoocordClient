# Boocord Client

An independent Windows launcher for a Fabric-based Minecraft client.

> **NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH
> MOJANG OR MICROSOFT.**

## What it does

- signs users in with Microsoft directly inside the launcher
- installs Fabric for Minecraft `1.21.11`
- keeps runtime and instance data in an isolated application-data directory
- downloads mods and required dependencies through the Modrinth API
- launches Minecraft through `minecraft-launcher-core`
- packages the launcher as a Windows `.exe` with `electron-builder`

## Requirements

- Windows
- Java 21 or newer
- a Microsoft account that owns Minecraft: Java Edition
- Node.js 22.12 or newer

## Development

```powershell
npm install
npm run check:translations
npm run smoke
npm run start
```

To use an additional isolated profile:

```powershell
npm run start -- --profile=alt
```

## Building the installer

Build the standard English Windows installer:

```powershell
npm run dist:installer
```

The installer is written to
`dist/Boocord-Client-Installer-<version>.exe`.
`dist/SHA256SUMS.txt` contains the corresponding SHA-256 checksums.
`npm run dist` runs the same complete installer build.

The Windows installer uses the regular English NSIS wizard. It defaults to the
current user, allows choosing a destination folder, and can optionally launch
Boocord Client from the finish page.

## Multiple installations and profiles

- every installation automatically receives its own application-data area
- additional profiles from the same installation can be selected with
  `--profile=<name>`
- every profile has separate settings, runtime files, and instance data
- accounts are shared across profiles belonging to the same installation

## Customizing the client

- base mods: `client.manifest.json`
- predefined configuration: `overrides/`
- branding and user interface: `src/renderer/`

## Privacy and external services

[PRIVACY.md](PRIVACY.md) explains local account storage and the external
services contacted by the client. Session files, profiles, logs, and build
outputs must not be committed or attached to bug reports.

## Independent project

Boocord Client is an independent community project. It is not offered,
supported, or reviewed by Microsoft, Mojang, Minecraft, Fabric, Discord, or
Modrinth. Names and trademarks belong to their respective owners. Mods are
downloaded at runtime from the configured third-party sources and remain
subject to the licenses and terms of their respective projects.

## Security status

The source is automatically checked for syntax errors, secrets, and known
vulnerabilities. The dependency tree of
`minecraft-launcher-core@3.18.2` currently contains known audit findings; the
current status is documented in
[.github/OPEN_SOURCE_CHECKLIST.md](.github/OPEN_SOURCE_CHECKLIST.md).

Do not assume that a published Windows binary is signed unless its GitHub
release notes explicitly confirm the signature.
