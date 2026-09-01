# Boocord Client Privacy Notice

This notice describes the desktop client contained in this repository.
Websites, community services, and third-party services have their own privacy
notices.

## Data stored locally

The client stores profile settings, installation state, logs, and Minecraft
runtime data locally. Microsoft and Minecraft accounts are stored with account
metadata and a refresh token in a local JSON session file under
`%APPDATA%\Boocord Client\installations\<installation-id>`. This file is
sensitive and must never be shared or committed to a repository.

The reviewed client code contains no first-party telemetry or analytics
feature. Diagnostic information is logged locally, but it may contain user
names, file paths, server information, or launch arguments.

## Services contacted

Depending on the feature being used, the client connects directly to:

- Microsoft, Xbox, and Minecraft services for sign-in and game entitlement;
- Mojang/Minecraft, Fabric, and Adoptium endpoints for game, loader, and Java
  files;
- Modrinth for project metadata and downloads;
- Discord through the locally installed Discord application for Rich Presence;
- `boocord.com` for the displayed server status;
- Google Fonts while loading the interface and `mineskin.eu` for certain
  player-head images.

These providers receive technically necessary connection data such as the IP
address. Microsoft, Xbox, and Minecraft also receive the account and token data
required for authentication. The reviewed client code does not send Microsoft
refresh tokens to a Boocord-operated server.

## Control and deletion

Accounts can be removed from the local session by signing out in the client.
Uninstalling the application does not necessarily delete profiles, logs,
runtimes, or session files. To remove all local data, delete the corresponding
installation directory under
`%APPDATA%\Boocord Client\installations` and any custom game-data directory
after fully closing the client.

Never publish refresh tokens, complete session files, or unredacted logs in a
support or security report. Report security issues through the confidential
process described in [.github/SECURITY.md](.github/SECURITY.md).
