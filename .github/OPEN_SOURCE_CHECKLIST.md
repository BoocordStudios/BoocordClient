# Open-source release checklist

This file documents the reviewed release status, but it is not a guarantee.
Open code-signing and runtime-dependency items must be disclosed prominently
with every binary release. They do not prevent publishing the source, but users
must be able to make an informed decision before running an unsigned build.

## Local preparation

- [x] Build, dependency, test, runtime, and profile directories are excluded by
      `.gitignore`.
- [x] Known session files, logs, environment files, and signing keys are
      excluded by `.gitignore`.
- [x] The MIT License, contribution guide, code of conduct, support policy, and
      security policy are present.
- [x] CI, CodeQL, dependency-review, and secret-scanning workflows use minimum
      permissions and pin actions to commit SHAs.
- [ ] `npm audit --package-lock-only --omit=dev` reports no unresolved high or
      critical runtime risks. Status on 2026-09-01: **not met** because of two
      high and two critical findings in the
      `minecraft-launcher-core` dependency path.
- [ ] `npm audit --package-lock-only --audit-level=high` reports no unresolved
      high or critical findings in the packaged Electron runtime or build
      tooling. Status on 2026-09-01: **not met**.
- [x] Unused root duplicates (`main.js` and `preload.js`) were reviewed and
      removed from the publication scope. Production entry points exist only
      under `src/`.
- [x] Every file selected for the initial commit was reviewed. No content from
      `tmp*`, `game-data`, `dist*`, `node_modules`, or application
      profiles is included.
- [x] The local candidate scan, GitHub Push Protection, and the full TruffleHog
      scan of the published Git history completed without unresolved findings.
- [ ] Rights to the source, logo, installer graphics, configuration, and other
      assets have been confirmed. Third-party material is attributed with its
      source and license.
- [x] The README, repository description, and trademark notices accurately
      describe the relationship with Minecraft, Microsoft, Fabric, Discord, and
      Modrinth without suggesting official affiliation.

## GitHub settings

- [x] Private Vulnerability Reporting is enabled.
- [x] Secret Scanning and Push Protection are enabled.
- [x] The Dependency Graph, Dependabot Alerts, and security updates are enabled.
- [x] The default Actions token has read-only permissions; write access is
      granted only per job.
- [x] An active ruleset protects the default branch from deletion and
      non-fast-forward force pushes without blocking normal maintainer pushes.
- [ ] The default-branch ruleset requires pull requests, at least one
      independent review, dismissal of stale approvals, resolution of
      discussions, required checks, and protection from force pushes and
      deletion.
- [ ] Required checks include at least CI, CodeQL, Dependency Review, and Secret
      Scan after each has completed successfully at least once.
- [x] CODEOWNERS assigns `@BoocordStudios` to the repository and
      security-sensitive areas.
- [ ] Unneeded Actions, apps, deploy keys, webhooks, and repository secrets have
      been removed; remaining access follows the principle of least privilege.

## Release and operations

- [ ] Windows builds are reproduced from a protected tag.
- [ ] Installers and updates are signed with a protected code-signing
      certificate whose private key is never stored in the repository.
- [x] The complete installer build generates SHA-256 checksums.
- [x] A validated CycloneDX 1.6 SBOM with reproducible output was generated for
      the current 1.0.3 build and included in the checksum file.
- [ ] Update and download sources use HTTPS, verify the expected origin, and
      validate hashes or signatures before execution.
- [x] The privacy notice explains Microsoft sign-in, Discord Rich Presence,
      external APIs, locally stored account data, and deletion options.
- [x] `@BoocordStudios` is named as maintainer, and security reports can be
      submitted confidentially through GitHub Private Vulnerability Reporting.

## Immediately before a release

```powershell
git status --short
git check-ignore -v node_modules tmp-launch.log game-data dist
npm ci
npm run check:translations
npm run smoke
npm audit --package-lock-only --audit-level=high
```

Verify all GitHub checks and settings after pushing. Release notes must clearly
identify unresolved signing, dependency, and third-party-service limitations.
