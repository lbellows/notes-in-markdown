# Markdown Note App

Desktop markdown note-taking app (Electron + React) with:

- Filesystem-backed hierarchy at `~/.mdnoteapp/notes`
- Folder tree + tabbed documents
- Editable `Rendered` and `Source` modes
- Toggleable autosave
- Local conflict handling for external file edits
- Soft delete to `~/.mdnoteapp/.trash` with restore

## Requirements

- Node.js 20+
- npm 10+

## Run

```bash
npm install
npm run dev
```

## Build renderer

```bash
npm run build
```

Then start Electron (loads built renderer from `dist/`):

```bash
npm start
```

## Storage layout

- `~/.mdnoteapp/notes/` markdown notes and folders
- `~/.mdnoteapp/.trash/` soft-deleted files/folders
- `~/.mdnoteapp/config.json` app settings
- `~/.mdnoteapp/session.json` open tabs/expanded folders

## Tests

```bash
npm test
```

Current tests cover pure logic modules (`pathing`, `autosave`, `markdown`).
