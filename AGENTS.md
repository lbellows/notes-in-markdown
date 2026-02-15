# AGENTS.md

## Project Snapshot
- App type: Electron + React markdown notes desktop app.
- Renderer build: Vite (`vite.config.mjs`).
- Main process: `electron/main.mjs`.
- Preload bridge: `electron/preload.js` (CommonJS by design for sandbox compatibility).
- IPC channel constants (main/shared): `shared/ipc.mjs`.

## Runbook
- Install deps: `npm install`
- Dev mode (renderer dev server + electron): `npm run dev`
- Production start (always rebuilds renderer): `npm start`
- Faster production start (skip rebuild): `npm run start:fast`
- Unit + integration tests: `npm test`
- E2E smoke tests: `npm run test:e2e` (uses `npx @playwright/test`, no local install required)
- Full test suite: `npm run test:all`
- Package artifacts:
  - Linux: `npm run package:linux`
  - Windows: `npm run package:win`
  - macOS: `npm run package:mac`

## Storage and Data
- Root storage: `~/.mdnoteapp/`
- Notes tree: `~/.mdnoteapp/notes/`
- Trash: `~/.mdnoteapp/.trash/`
- Config: `~/.mdnoteapp/config.json`
- Session: `~/.mdnoteapp/session.json`

## Critical Gotchas
- Vite must use relative asset paths for Electron `file://` runtime.
  - This is fixed by `base: './'` in `vite.config.mjs`.
  - If you see a blank off-white window with only native menu, check built `dist/index.html` for `./assets/...` (not `/assets/...`).
- CSP is defined in `index.html` via a meta tag and should remain strict in production.
- Sandbox + preload compatibility:
  - Renderer sandbox is intentionally enabled (`sandbox: true`).
  - Preload stays CommonJS (`electron/preload.js`) because sandboxed preload does not support ESM `import` in this app setup.
  - If preload fails, symptoms include `Unable to load preload script`, `Cannot use import statement outside a module`, and `window.mdnote` undefined errors.
- `npm start` intentionally runs `npm run build` first to avoid stale/broken `dist`.

## Current Runtime Findings (validated)
- Reproduced blank-window issue and fixed root causes:
  - Root cause #1: Vite asset base path incompatible with `file://` runtime.
  - Root cause #2: preload load failure from incompatible module setup.
  - Fixes: `base: './'` in Vite config and CJS preload with renderer sandbox enabled.
- Verified after fix:
  - Electron starts without preload module errors.
  - No renderer crash from missing `window.mdnote` methods.
- Added hardening/completeness items:
  - CSP policy meta tag in `index.html`.
  - Vite `manualChunks` split for improved startup payload characteristics.
  - Integration tests (`tests/integration/app.integration.test.jsx`).
  - Playwright Electron e2e smoke test (`tests/e2e/smoke.spec.mjs`).
  - GitHub Actions CI and release workflows in `.github/workflows/`.

## Debug Checklist
1. Build renderer: `npm run build`
2. Confirm `dist/index.html` uses `./assets/...`
3. Launch with logs: `ELECTRON_ENABLE_LOGGING=1 npm start`
4. Look for preload failures first (`Unable to load preload script`)
5. Then look for renderer TypeErrors around `window.mdnote`

## Test Status
- Unit tests cover:
  - path helpers (`tests/pathing.test.js`)
  - autosave scheduler (`tests/autosave.test.js`)
  - markdown conversion/sanitization helpers (`tests/markdown.test.js`)
- Integration tests cover app bootstrap and note open flow (`tests/integration/app.integration.test.jsx`).
- E2E smoke covers Electron boot and visible shell (`tests/e2e/smoke.spec.mjs`).
