const { contextBridge, ipcRenderer } = require('electron');

// Keep IPC channel constants local to preload.
// In sandboxed preload contexts, requiring local files can fail.
const IPC = {
  NOTES_LIST: 'notes:listTree',
  NOTES_READ: 'notes:read',
  NOTES_WRITE: 'notes:write',
  NOTES_CREATE: 'notes:create',
  FOLDERS_CREATE: 'folders:create',
  PATHS_RENAME: 'paths:rename',
  PATHS_TRASH: 'paths:trash',
  TRASH_LIST: 'trash:list',
  TRASH_RESTORE: 'trash:restore',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  SESSION_GET: 'session:get',
  SESSION_SET: 'session:set',
  TREE_EVENT: 'tree:event'
};

contextBridge.exposeInMainWorld('mdnote', {
  listTree: () => ipcRenderer.invoke(IPC.NOTES_LIST),
  readNote: (notePath) => ipcRenderer.invoke(IPC.NOTES_READ, notePath),
  writeNote: (payload) => ipcRenderer.invoke(IPC.NOTES_WRITE, payload),
  createNote: (payload) => ipcRenderer.invoke(IPC.NOTES_CREATE, payload),
  createFolder: (payload) => ipcRenderer.invoke(IPC.FOLDERS_CREATE, payload),
  renamePath: (payload) => ipcRenderer.invoke(IPC.PATHS_RENAME, payload),
  trashPath: (relPath) => ipcRenderer.invoke(IPC.PATHS_TRASH, relPath),
  listTrash: () => ipcRenderer.invoke(IPC.TRASH_LIST),
  restoreFromTrash: (trashRelPath) => ipcRenderer.invoke(IPC.TRASH_RESTORE, trashRelPath),
  getConfig: () => ipcRenderer.invoke(IPC.CONFIG_GET),
  setConfig: (patch) => ipcRenderer.invoke(IPC.CONFIG_SET, patch),
  getSession: () => ipcRenderer.invoke(IPC.SESSION_GET),
  setSession: (patch) => ipcRenderer.invoke(IPC.SESSION_SET, patch),
  onTreeEvent: (cb) => {
    const handler = (_event, payload) => cb(payload);
    ipcRenderer.on(IPC.TREE_EVENT, handler);
    return () => ipcRenderer.removeListener(IPC.TREE_EVENT, handler);
  }
});
