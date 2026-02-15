import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import chokidar from 'chokidar';
import { fileURLToPath } from 'node:url';
import { IPC } from '../shared/ipc.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.join(os.homedir(), '.mdnoteapp');
const NOTES_ROOT = path.join(APP_ROOT, 'notes');
const TRASH_ROOT = path.join(APP_ROOT, '.trash');
const CONFIG_PATH = path.join(APP_ROOT, 'config.json');
const SESSION_PATH = path.join(APP_ROOT, 'session.json');

const DEFAULT_CONFIG = {
  autosaveEnabled: true,
  autosaveDelayMs: 800,
  defaultMode: 'rendered'
};

const DEFAULT_SESSION = {
  openTabs: [],
  activeTab: null,
  expandedPaths: []
};

let mainWindow;
let notesWatcher;

function normalizeRel(input = '') {
  return input.replaceAll('\\', '/').replace(/^\/+/, '');
}

function assertInside(base, full) {
  if (full !== base && !full.startsWith(`${base}${path.sep}`)) {
    throw new Error('Path escapes storage root.');
  }
}

function resolveInNotes(relPath = '') {
  if (path.isAbsolute(relPath)) {
    throw new Error('Absolute paths are not allowed.');
  }

  const normalized = normalizeRel(relPath);
  const full = path.resolve(NOTES_ROOT, normalized || '.');
  assertInside(NOTES_ROOT, full);
  return full;
}

function resolveInTrash(relPath = '') {
  if (path.isAbsolute(relPath)) {
    throw new Error('Absolute paths are not allowed.');
  }

  const normalized = normalizeRel(relPath);
  const full = path.resolve(TRASH_ROOT, normalized || '.');
  assertInside(TRASH_ROOT, full);
  return full;
}

function toNoteRel(fullPath) {
  return normalizeRel(path.relative(NOTES_ROOT, fullPath));
}

function toTrashRel(fullPath) {
  return normalizeRel(path.relative(TRASH_ROOT, fullPath));
}

function ensureMdExtension(fileName) {
  if (fileName.endsWith('.md')) {
    return fileName;
  }
  return `${fileName}.md`;
}

function sanitizeName(input, fallback = 'untitled') {
  const cleaned = (input || fallback)
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '');

  return cleaned || fallback;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function uniqueSiblingPath(parentDir, desiredName) {
  const ext = path.extname(desiredName);
  const stem = path.basename(desiredName, ext);
  let candidate = path.join(parentDir, desiredName);
  let index = 1;

  while (await pathExists(candidate)) {
    candidate = path.join(parentDir, `${stem} (${index})${ext}`);
    index += 1;
  }

  return candidate;
}

function trashMetaPath(itemPath) {
  return `${itemPath}.trashmeta.json`;
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

async function ensureAppStorage() {
  await fs.mkdir(NOTES_ROOT, { recursive: true });
  await fs.mkdir(TRASH_ROOT, { recursive: true });

  if (!(await pathExists(CONFIG_PATH))) {
    await writeJson(CONFIG_PATH, DEFAULT_CONFIG);
  }

  if (!(await pathExists(SESSION_PATH))) {
    await writeJson(SESSION_PATH, DEFAULT_SESSION);
  }

  const entries = await fs.readdir(NOTES_ROOT);
  if (entries.length === 0) {
    await fs.writeFile(
      path.join(NOTES_ROOT, 'Welcome.md'),
      '# Welcome\n\nStart writing your notes here.',
      'utf8'
    );
  }
}

async function buildTree(relDir = '') {
  const fullDir = resolveInNotes(relDir);
  const entries = await fs.readdir(fullDir, { withFileTypes: true });

  const folders = [];
  const files = [];

  for (const entry of entries) {
    const relPath = normalizeRel(path.join(relDir, entry.name));
    if (entry.isDirectory()) {
      folders.push({
        kind: 'folder',
        name: entry.name,
        path: relPath,
        children: await buildTree(relPath)
      });
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push({
        kind: 'file',
        name: entry.name,
        path: relPath
      });
    }
  }

  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return [...folders, ...files];
}

async function listTrashItems() {
  const entries = await fs.readdir(TRASH_ROOT, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    if (entry.name.endsWith('.trashmeta.json')) {
      continue;
    }

    const fullPath = path.join(TRASH_ROOT, entry.name);
    const meta = await readJson(trashMetaPath(fullPath), {
      originalPath: null,
      deletedAt: null
    });

    items.push({
      trashPath: toTrashRel(fullPath),
      name: entry.name,
      kind: entry.isDirectory() ? 'folder' : 'file',
      originalPath: meta.originalPath,
      deletedAt: meta.deletedAt
    });
  }

  items.sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || ''));
  return items;
}

function validateNotePath(relPath) {
  if (!relPath || !relPath.endsWith('.md')) {
    throw new Error('Note path must end with .md');
  }
}

async function readNote(relPath) {
  validateNotePath(relPath);
  const fullPath = resolveInNotes(relPath);
  const [content, stat] = await Promise.all([
    fs.readFile(fullPath, 'utf8'),
    fs.stat(fullPath)
  ]);

  return {
    path: normalizeRel(relPath),
    content,
    mtimeMs: stat.mtimeMs
  };
}

async function writeNote(relPath, content, expectedMtimeMs) {
  validateNotePath(relPath);
  const fullPath = resolveInNotes(relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  if (await pathExists(fullPath)) {
    const stat = await fs.stat(fullPath);
    if (
      typeof expectedMtimeMs === 'number' &&
      Math.abs(stat.mtimeMs - expectedMtimeMs) > 1
    ) {
      const diskContent = await fs.readFile(fullPath, 'utf8');
      return {
        conflict: true,
        mtimeMs: stat.mtimeMs,
        diskContent
      };
    }
  }

  await fs.writeFile(fullPath, content, 'utf8');
  const stat = await fs.stat(fullPath);
  return {
    conflict: false,
    mtimeMs: stat.mtimeMs
  };
}

async function createNote(parentDir, title) {
  const cleanParent = normalizeRel(parentDir || '');
  const parentFull = resolveInNotes(cleanParent);
  await fs.mkdir(parentFull, { recursive: true });

  const cleanTitle = ensureMdExtension(sanitizeName(title, 'Untitled'));
  const fullPath = await uniqueSiblingPath(parentFull, cleanTitle);

  await fs.writeFile(fullPath, `# ${path.basename(fullPath, '.md')}\n\n`, 'utf8');
  return { path: toNoteRel(fullPath) };
}

async function createFolder(parentDir, name) {
  const cleanParent = normalizeRel(parentDir || '');
  const parentFull = resolveInNotes(cleanParent);
  await fs.mkdir(parentFull, { recursive: true });

  const cleanName = sanitizeName(name, 'Folder');
  const fullPath = await uniqueSiblingPath(parentFull, cleanName);
  await fs.mkdir(fullPath, { recursive: true });
  return { path: toNoteRel(fullPath) };
}

async function renamePath(oldRelPath, newName) {
  const oldFullPath = resolveInNotes(oldRelPath);
  const stat = await fs.stat(oldFullPath);
  const parent = path.dirname(oldFullPath);

  let nextName = sanitizeName(newName, stat.isDirectory() ? 'Folder' : 'Untitled');
  if (stat.isFile()) {
    nextName = ensureMdExtension(nextName);
  }

  const nextFullPath = await uniqueSiblingPath(parent, nextName);
  await fs.rename(oldFullPath, nextFullPath);
  return { path: toNoteRel(nextFullPath) };
}

async function trashPath(relPath) {
  const fullPath = resolveInNotes(relPath);
  const stat = await fs.stat(fullPath);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = path.basename(fullPath);
  const destination = await uniqueSiblingPath(TRASH_ROOT, `${stamp}-${baseName}`);

  await fs.rename(fullPath, destination);
  await writeJson(trashMetaPath(destination), {
    originalPath: normalizeRel(relPath),
    deletedAt: new Date().toISOString(),
    kind: stat.isDirectory() ? 'folder' : 'file'
  });

  return { trashPath: toTrashRel(destination) };
}

async function restoreFromTrash(trashRelPath) {
  const trashFullPath = resolveInTrash(trashRelPath);
  const meta = await readJson(trashMetaPath(trashFullPath), {
    originalPath: null
  });

  const preferredRel = normalizeRel(
    meta.originalPath || path.basename(trashFullPath)
  );
  const preferredFull = resolveInNotes(preferredRel);

  await fs.mkdir(path.dirname(preferredFull), { recursive: true });
  const destination = await uniqueSiblingPath(
    path.dirname(preferredFull),
    path.basename(preferredFull)
  );

  await fs.rename(trashFullPath, destination);

  const metaPath = trashMetaPath(trashFullPath);
  if (await pathExists(metaPath)) {
    await fs.rm(metaPath, { force: true });
  }

  return { restoredPath: toNoteRel(destination) };
}

function isWatchedPath(filePath) {
  const rel = toNoteRel(filePath);
  return rel !== '' && !rel.startsWith('..');
}

function startWatcher() {
  if (notesWatcher) {
    return;
  }

  notesWatcher = chokidar.watch(NOTES_ROOT, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100
    }
  });

  notesWatcher.on('all', (eventName, changedPath) => {
    if (!isWatchedPath(changedPath)) {
      return;
    }

    const relPath = toNoteRel(changedPath);
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC.TREE_EVENT, {
          event: eventName,
          path: relPath
        });
      }
    });
  });
}

function stopWatcher() {
  if (notesWatcher) {
    notesWatcher.close();
    notesWatcher = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

ipcMain.handle(IPC.NOTES_LIST, async () => buildTree(''));
ipcMain.handle(IPC.NOTES_READ, async (_event, relPath) => readNote(relPath));
ipcMain.handle(IPC.NOTES_WRITE, async (_event, payload) => {
  const { path: relPath, content, expectedMtimeMs } = payload;
  return writeNote(relPath, content, expectedMtimeMs);
});
ipcMain.handle(IPC.NOTES_CREATE, async (_event, payload) => {
  const { parentDir, title } = payload;
  return createNote(parentDir, title);
});
ipcMain.handle(IPC.FOLDERS_CREATE, async (_event, payload) => {
  const { parentDir, name } = payload;
  return createFolder(parentDir, name);
});
ipcMain.handle(IPC.PATHS_RENAME, async (_event, payload) => {
  const { oldPath, newName } = payload;
  return renamePath(oldPath, newName);
});
ipcMain.handle(IPC.PATHS_TRASH, async (_event, relPath) => trashPath(relPath));
ipcMain.handle(IPC.TRASH_LIST, async () => listTrashItems());
ipcMain.handle(IPC.TRASH_RESTORE, async (_event, trashRelPath) =>
  restoreFromTrash(trashRelPath)
);
ipcMain.handle(IPC.CONFIG_GET, async () => readJson(CONFIG_PATH, DEFAULT_CONFIG));
ipcMain.handle(IPC.CONFIG_SET, async (_event, patch) => {
  const config = await readJson(CONFIG_PATH, DEFAULT_CONFIG);
  const nextConfig = { ...config, ...patch };
  await writeJson(CONFIG_PATH, nextConfig);
  return nextConfig;
});
ipcMain.handle(IPC.SESSION_GET, async () => readJson(SESSION_PATH, DEFAULT_SESSION));
ipcMain.handle(IPC.SESSION_SET, async (_event, patch) => {
  const session = await readJson(SESSION_PATH, DEFAULT_SESSION);
  const nextSession = { ...session, ...patch };
  await writeJson(SESSION_PATH, nextSession);
  return nextSession;
});

app.whenReady().then(async () => {
  await ensureAppStorage();
  createWindow();
  startWatcher();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopWatcher();
});

process.on('uncaughtException', (error) => {
  if (fsSync.existsSync(APP_ROOT)) {
    const logPath = path.join(APP_ROOT, 'crash.log');
    fsSync.appendFileSync(logPath, `${new Date().toISOString()} ${error.stack}\n`);
  }
});
