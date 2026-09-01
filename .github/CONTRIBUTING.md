# Contributing to Boocord Client

Thank you for your interest. Small, focused changes are the easiest to review
and release safely.

## Before you begin

1. Search existing issues and pull requests for similar work.
2. Open a proposal before starting a large or incompatible change.
3. Never report a security issue publicly. Follow
   [SECURITY.md](SECURITY.md) instead.

## Development environment

Development requires Windows, Node.js 22.12 or newer, and npm. Full launcher
testing also requires Java 21 or newer.

```powershell
npm ci
npm run check:translations
npm run smoke
npm run start
```

The smoke test does not require Microsoft sign-in or a Minecraft account. Use
only accounts you own when performing manual tests.

## Submitting changes

- Create a focused branch for one topic.
- Update the lockfile together with `package.json` when dependencies change.
- Do not commit generated installers, runtime data, account sessions, or logs.
- Add tests or clear manual verification steps.
- Describe the security impact of changes to downloads, authentication, IPC, or
  file-system access.
- Make sure you may publish new material under the MIT License and identify any
  third-party content.

At minimum, run the following commands before opening a pull request:

```powershell
npm ci
npm run check:translations
npm run smoke
npm audit --package-lock-only --audit-level=high
```

Do not hide an existing audit finding through exceptions or by disabling the
check. Document unavoidable remaining findings, including their cause, impact,
and planned remediation.

## Review

A pull request may require changes before it can be merged. Maintainers may
decline a contribution that is outside the project scope, cannot be reviewed
reliably, or introduces an unacceptable security or maintenance risk.
