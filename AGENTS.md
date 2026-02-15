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
- Tests: `npm test`

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
- Remaining non-blocking warning:
  - Electron CSP warning in unpackaged/dev context (`Insecure Content-Security-Policy`).

## Debug Checklist
1. Build renderer: `npm run build`
2. Confirm `dist/index.html` uses `./assets/...`
3. Launch with logs: `ELECTRON_ENABLE_LOGGING=1 npm start`
4. Look for preload failures first (`Unable to load preload script`)
5. Then look for renderer TypeErrors around `window.mdnote`

## Test Status
- Unit tests currently cover:
  - path helpers (`tests/pathing.test.js`)
  - autosave scheduler (`tests/autosave.test.js`)
  - markdown conversion/sanitization helpers (`tests/markdown.test.js`)
- Current expected result: all tests passing (`8 passed`).

## Suggested Next Engineering Tasks
- Add end-to-end smoke test for Electron boot + preload bridge availability.
- Add explicit CSP policy suitable for packaged app.
- Split large renderer chunk (`manualChunks`) to reduce startup bundle size.
