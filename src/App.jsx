import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TreeSidebar from './components/TreeSidebar';
import TabBar from './components/TabBar';
import SettingsPanel from './components/SettingsPanel';
import TrashPanel from './components/TrashPanel';
import ConflictModal from './components/ConflictModal';
import InputModal from './components/InputModal';
import ConfirmModal from './components/ConfirmModal';
import { createAutosaveScheduler } from './lib/autosave';
import {
  parentDirectoryPath,
  replacePathPrefix,
  normalizeRelativePath
} from './lib/pathing';
import { normalizeMarkdownLineEndings } from './lib/markdown';

const ROOT_SENTINEL = '__root__';
const SourceEditor = React.lazy(() => import('./editors/SourceEditor'));
const RenderedEditor = React.lazy(() => import('./editors/RenderedEditor'));

const DEFAULT_CONFIG = {
  autosaveEnabled: true,
  autosaveDelayMs: 800,
  defaultMode: 'rendered',
  theme: 'dark'
};

function findNodeKind(nodes, targetPath) {
  for (const node of nodes) {
    if (node.path === targetPath) {
      return node.kind;
    }

    if (node.kind === 'folder' && node.children?.length) {
      const match = findNodeKind(node.children, targetPath);
      if (match) {
        return match;
      }
    }
  }

  return null;
}

function isUnderPath(candidatePath, rootPath) {
  const candidate = normalizeRelativePath(candidatePath);
  const root = normalizeRelativePath(rootPath);

  if (candidate === root) {
    return true;
  }

  return candidate.startsWith(`${root}/`);
}

export default function App() {
  const [tree, setTree] = useState([]);
  const [expandedPaths, setExpandedPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(ROOT_SENTINEL);
  const [tabs, setTabs] = useState([]);
  const [activePath, setActivePath] = useState(null);
  const [docs, setDocs] = useState({});
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [trashItems, setTrashItems] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [conflict, setConflict] = useState(null);
  const [inputDialog, setInputDialog] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const docsRef = useRef(docs);
  const tabsRef = useRef(tabs);
  const activePathRef = useRef(activePath);
  const configRef = useRef(config);
  const statusTimerRef = useRef(null);
  const autosaveSchedulerRef = useRef(null);

  useEffect(() => {
    docsRef.current = docs;
  }, [docs]);

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  useEffect(() => {
    activePathRef.current = activePath;
  }, [activePath]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    document.documentElement.dataset.theme = config.theme || 'dark';
  }, [config.theme]);

  const showStatus = useCallback((message) => {
    setStatus(message);
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    statusTimerRef.current = setTimeout(() => setStatus('Ready'), 2500);
  }, []);

  const refreshTree = useCallback(async () => {
    const nextTree = await window.mdnote.listTree();
    setTree(nextTree);
  }, []);

  const refreshTrash = useCallback(async () => {
    const nextTrash = await window.mdnote.listTrash();
    setTrashItems(nextTrash);
  }, []);

  const saveNote = useCallback(
    async (notePath, options = {}) => {
      const { force = false, ignoreExpectedMtime = false } = options;
      const doc = docsRef.current[notePath];
      if (!doc) {
        return true;
      }

      if (!doc.dirty && !force) {
        return true;
      }

      const payload = {
        path: notePath,
        content: doc.content
      };

      if (!ignoreExpectedMtime) {
        payload.expectedMtimeMs = doc.baseMtimeMs;
      }

      const result = await window.mdnote.writeNote(payload);
      if (result.conflict) {
        setConflict({
          path: notePath,
          diskContent: result.diskContent,
          diskMtimeMs: result.mtimeMs,
          currentContent: doc.content
        });
        showStatus(`Conflict detected for ${notePath}`);
        return false;
      }

      setDocs((prev) => ({
        ...prev,
        [notePath]: {
          ...prev[notePath],
          dirty: false,
          baseMtimeMs: result.mtimeMs,
          lastSavedAt: Date.now()
        }
      }));

      showStatus(`Saved ${notePath}`);
      return true;
    },
    [showStatus]
  );

  const saveAllDirty = useCallback(async () => {
    const saveTargets = Object.entries(docsRef.current)
      .filter(([, doc]) => doc.dirty)
      .map(([path]) => path);

    for (const notePath of saveTargets) {
      await saveNote(notePath);
    }
  }, [saveNote]);

  useEffect(() => {
    if (autosaveSchedulerRef.current) {
      autosaveSchedulerRef.current.cancelAll();
    }

    autosaveSchedulerRef.current = createAutosaveScheduler({
      delayMs: config.autosaveDelayMs,
      onSave: (notePath) => {
        void saveNote(notePath);
      }
    });

    return () => autosaveSchedulerRef.current?.cancelAll();
  }, [config.autosaveDelayMs, saveNote]);

  const openNote = useCallback(async (notePath) => {
    const normalizedPath = normalizeRelativePath(notePath);
    setSelectedPath(normalizedPath);

    if (tabsRef.current.includes(normalizedPath)) {
      const previousActive = activePathRef.current;
      if (previousActive && previousActive !== normalizedPath && configRef.current.autosaveEnabled) {
        await saveNote(previousActive);
      }
      setActivePath(normalizedPath);
      return;
    }

    const loaded = await window.mdnote.readNote(normalizedPath);

    setDocs((prev) => ({
      ...prev,
      [normalizedPath]: {
        path: normalizedPath,
        content: loaded.content,
        mode: configRef.current.defaultMode,
        dirty: false,
        baseMtimeMs: loaded.mtimeMs,
        lastSavedAt: loaded.mtimeMs
      }
    }));

    setTabs((prev) => [...prev, normalizedPath]);

    const previousActive = activePathRef.current;
    if (previousActive && previousActive !== normalizedPath && configRef.current.autosaveEnabled) {
      await saveNote(previousActive);
    }

    setActivePath(normalizedPath);
  }, [saveNote]);

  const closePathFromState = useCallback((targetPath) => {
    setTabs((prev) => {
      const filtered = prev.filter((tabPath) => !isUnderPath(tabPath, targetPath));

      if (filtered.length === 0) {
        setActivePath(null);
      } else if (!filtered.includes(activePathRef.current)) {
        setActivePath(filtered[0]);
      }

      return filtered;
    });

    setDocs((prev) => {
      const next = {};
      for (const [path, doc] of Object.entries(prev)) {
        if (!isUnderPath(path, targetPath)) {
          next[path] = doc;
        }
      }
      return next;
    });

    setExpandedPaths((prev) => prev.filter((item) => !isUnderPath(item, targetPath)));
    if (isUnderPath(selectedPath, targetPath)) {
      setSelectedPath(ROOT_SENTINEL);
    }
  }, [selectedPath]);

  const remapPathInState = useCallback((oldPath, newPath) => {
    setTabs((prev) => prev.map((tabPath) => replacePathPrefix(tabPath, oldPath, newPath)));

    setDocs((prev) => {
      const next = {};
      for (const [path, doc] of Object.entries(prev)) {
        const mapped = replacePathPrefix(path, oldPath, newPath);
        next[mapped] = { ...doc, path: mapped };
      }
      return next;
    });

    if (activePathRef.current && isUnderPath(activePathRef.current, oldPath)) {
      setActivePath(replacePathPrefix(activePathRef.current, oldPath, newPath));
    }

    if (selectedPath && selectedPath !== ROOT_SENTINEL && isUnderPath(selectedPath, oldPath)) {
      setSelectedPath(replacePathPrefix(selectedPath, oldPath, newPath));
    }

    setExpandedPaths((prev) =>
      prev.map((item) => replacePathPrefix(item, oldPath, newPath))
    );
  }, [selectedPath]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const [initialTree, initialConfig, initialSession, initialTrash] = await Promise.all([
        window.mdnote.listTree(),
        window.mdnote.getConfig(),
        window.mdnote.getSession(),
        window.mdnote.listTrash()
      ]);

      if (!mounted) {
        return;
      }

      setTree(initialTree);
      setConfig({ ...DEFAULT_CONFIG, ...initialConfig });
      setTrashItems(initialTrash);
      setExpandedPaths(initialSession.expandedPaths || []);

      const loadedDocs = {};
      const loadedTabs = [];

      for (const tabPath of initialSession.openTabs || []) {
        try {
          const loaded = await window.mdnote.readNote(tabPath);
          loadedDocs[tabPath] = {
            path: tabPath,
            content: loaded.content,
            mode: initialConfig.defaultMode,
            dirty: false,
            baseMtimeMs: loaded.mtimeMs,
            lastSavedAt: loaded.mtimeMs
          };
          loadedTabs.push(tabPath);
        } catch {
          // Note may no longer exist.
        }
      }

      if (mounted) {
        setDocs(loadedDocs);
        setTabs(loadedTabs);
        setActivePath(
          loadedTabs.includes(initialSession.activeTab)
            ? initialSession.activeTab
            : loadedTabs[0] || null
        );
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const saveSession = setTimeout(() => {
      void window.mdnote.setSession({
        openTabs: tabs,
        activeTab: activePath,
        expandedPaths
      });
    }, 300);

    return () => clearTimeout(saveSession);
  }, [tabs, activePath, expandedPaths]);

  useEffect(() => {
    const off = window.mdnote.onTreeEvent(async (event) => {
      await refreshTree();

      if (!event.path || !event.path.endsWith('.md')) {
        return;
      }

      const openDoc = docsRef.current[event.path];
      if (!openDoc) {
        return;
      }

      try {
        const disk = await window.mdnote.readNote(event.path);
        const current = docsRef.current[event.path];
        if (!current) {
          return;
        }

        if (!current.dirty) {
          setDocs((prev) => ({
            ...prev,
            [event.path]: {
              ...prev[event.path],
              content: disk.content,
              baseMtimeMs: disk.mtimeMs,
              lastSavedAt: Date.now()
            }
          }));
          return;
        }

        const diskChanged =
          normalizeMarkdownLineEndings(disk.content) !==
            normalizeMarkdownLineEndings(current.content) &&
          Math.abs(disk.mtimeMs - current.baseMtimeMs) > 1;

        if (diskChanged) {
          setConflict({
            path: event.path,
            diskContent: disk.content,
            diskMtimeMs: disk.mtimeMs,
            currentContent: current.content
          });
          showStatus(`External changes detected for ${event.path}`);
        }
      } catch {
        closePathFromState(event.path);
      }
    });

    return () => off();
  }, [closePathFromState, refreshTree, showStatus]);

  useEffect(() => {
    const onBlur = () => {
      if (configRef.current.autosaveEnabled) {
        void saveAllDirty();
      }
    };

    const onBeforeUnload = () => {
      if (configRef.current.autosaveEnabled) {
        void saveAllDirty();
      }
    };

    window.addEventListener('blur', onBlur);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [saveAllDirty]);

  const activeDoc = activePath ? docs[activePath] : null;

  const selectedKind = useMemo(() => {
    if (selectedPath === ROOT_SENTINEL) {
      return 'root';
    }
    return findNodeKind(tree, selectedPath);
  }, [tree, selectedPath]);

  const handleToggleExpand = (targetPath) => {
    setExpandedPaths((prev) =>
      prev.includes(targetPath)
        ? prev.filter((item) => item !== targetPath)
        : [...prev, targetPath]
    );
  };

  const parentForCreation =
    selectedPath === ROOT_SENTINEL
      ? ''
      : selectedKind === 'file'
        ? parentDirectoryPath(selectedPath)
        : selectedPath;

  const closeTabNow = (targetPath) => {
    autosaveSchedulerRef.current?.cancel(targetPath);

    setTabs((prev) => {
      const idx = prev.indexOf(targetPath);
      const next = prev.filter((tabPath) => tabPath !== targetPath);
      if (targetPath === activePathRef.current) {
        setActivePath(next[idx] || next[idx - 1] || null);
      }
      return next;
    });

    setDocs((prev) => {
      const next = { ...prev };
      delete next[targetPath];
      return next;
    });
  };

  const handleCreateNote = () => {
    setInputDialog({
      type: 'create-note',
      title: 'Create Note',
      label: 'Note name',
      confirmLabel: 'Create',
      initialValue: 'Untitled',
      parentDir: parentForCreation
    });
  };

  const handleCreateFolder = () => {
    setInputDialog({
      type: 'create-folder',
      title: 'Create Folder',
      label: 'Folder name',
      confirmLabel: 'Create',
      initialValue: 'Folder',
      parentDir: parentForCreation
    });
  };

  const handleRename = () => {
    if (!selectedPath || selectedPath === ROOT_SENTINEL) {
      return;
    }

    const currentName = selectedPath.split('/').pop() || selectedPath;
    setInputDialog({
      type: 'rename',
      title: 'Rename Item',
      label: 'New name',
      confirmLabel: 'Rename',
      initialValue: currentName,
      oldPath: selectedPath
    });
  };

  const handleInputConfirm = async (rawValue) => {
    if (!inputDialog) {
      return;
    }

    const value = rawValue.trim();
    if (!value) {
      return;
    }

    const dialog = inputDialog;
    setInputDialog(null);

    if (dialog.type === 'create-note') {
      const result = await window.mdnote.createNote({
        parentDir: dialog.parentDir,
        title: value
      });

      if (dialog.parentDir && !expandedPaths.includes(dialog.parentDir)) {
        setExpandedPaths((prev) => [...prev, dialog.parentDir]);
      }

      await refreshTree();
      await openNote(result.path);
      return;
    }

    if (dialog.type === 'create-folder') {
      const result = await window.mdnote.createFolder({
        parentDir: dialog.parentDir,
        name: value
      });

      if (dialog.parentDir && !expandedPaths.includes(dialog.parentDir)) {
        setExpandedPaths((prev) => [...prev, dialog.parentDir]);
      }

      setExpandedPaths((prev) => [...new Set([...prev, result.path])]);
      setSelectedPath(result.path);
      await refreshTree();
      return;
    }

    if (dialog.type === 'rename') {
      const result = await window.mdnote.renamePath({
        oldPath: dialog.oldPath,
        newName: value
      });

      remapPathInState(dialog.oldPath, result.path);
      setSelectedPath(result.path);
      await refreshTree();
      showStatus(`Renamed to ${result.path}`);
    }
  };

  const handleDelete = () => {
    if (!selectedPath || selectedPath === ROOT_SENTINEL) {
      return;
    }

    setConfirmDialog({
      title: 'Move to Trash',
      message: `Move ${selectedPath} to trash?`,
      confirmLabel: 'Move',
      onConfirm: async () => {
        await window.mdnote.trashPath(selectedPath);
        closePathFromState(selectedPath);
        await Promise.all([refreshTree(), refreshTrash()]);
        showStatus(`Moved ${selectedPath} to trash`);
      }
    });
  };

  const handleRestore = async (trashPath) => {
    const result = await window.mdnote.restoreFromTrash(trashPath);
    await Promise.all([refreshTree(), refreshTrash()]);
    showStatus(`Restored ${result.restoredPath}`);

    if (result.restoredPath.endsWith('.md')) {
      await openNote(result.restoredPath);
    }
  };

  const handleTabSelect = async (nextPath) => {
    const previousActive = activePathRef.current;
    if (previousActive && previousActive !== nextPath && configRef.current.autosaveEnabled) {
      await saveNote(previousActive);
    }
    setActivePath(nextPath);
  };

  const handleTabClose = (targetPath) => {
    const doc = docsRef.current[targetPath];
    if (doc?.dirty) {
      setConfirmDialog({
        title: 'Unsaved Changes',
        message: `Close ${targetPath.split('/').pop()} without saving?`,
        confirmLabel: 'Close Tab',
        onConfirm: async () => {
          closeTabNow(targetPath);
        }
      });
      return;
    }

    closeTabNow(targetPath);
  };

  const handleDocChange = (notePath, content) => {
    setDocs((prev) => ({
      ...prev,
      [notePath]: {
        ...prev[notePath],
        content,
        dirty: true
      }
    }));

    if (configRef.current.autosaveEnabled) {
      autosaveSchedulerRef.current?.schedule(notePath);
    }
  };

  const handleModeToggle = (mode) => {
    if (!activePath) {
      return;
    }

    setDocs((prev) => ({
      ...prev,
      [activePath]: {
        ...prev[activePath],
        mode
      }
    }));
  };

  const handleConfigPatch = async (patch) => {
    const nextConfig = await window.mdnote.setConfig(patch);
    setConfig(nextConfig);

    if (!nextConfig.autosaveEnabled) {
      autosaveSchedulerRef.current?.cancelAll();
    }
  };

  const handleConflictReload = () => {
    if (!conflict) {
      return;
    }

    setDocs((prev) => ({
      ...prev,
      [conflict.path]: {
        ...prev[conflict.path],
        content: conflict.diskContent,
        dirty: false,
        baseMtimeMs: conflict.diskMtimeMs,
        lastSavedAt: Date.now()
      }
    }));

    setConflict(null);
    showStatus(`Reloaded ${conflict.path} from disk`);
  };

  const handleConflictKeep = async () => {
    if (!conflict) {
      return;
    }

    const targetPath = conflict.path;
    setConflict(null);
    await saveNote(targetPath, { force: true, ignoreExpectedMtime: true });
  };

  const handleConflictSaveCopy = async () => {
    if (!conflict) {
      return;
    }

    const noteName = conflict.path.split('/').pop()?.replace(/\.md$/i, '') || 'Copy';
    const parentDir = parentDirectoryPath(conflict.path);

    const created = await window.mdnote.createNote({
      parentDir,
      title: `${noteName} copy`
    });

    await window.mdnote.writeNote({
      path: created.path,
      content: conflict.currentContent
    });

    setConflict(null);
    await Promise.all([refreshTree(), openNote(created.path)]);
    showStatus(`Saved a copy to ${created.path}`);
  };

  const handleConfirmAccept = async () => {
    if (!confirmDialog?.onConfirm) {
      return;
    }

    const action = confirmDialog.onConfirm;
    setConfirmDialog(null);
    await action();
  };

  return (
    <div className="app-shell">
      <TreeSidebar
        tree={tree}
        expandedPaths={expandedPaths}
        selectedPath={selectedPath}
        onToggleExpand={handleToggleExpand}
        onSelect={setSelectedPath}
        onOpenNote={(path) => {
          void openNote(path);
        }}
        onCreateNote={handleCreateNote}
        onCreateFolder={handleCreateFolder}
        onRename={handleRename}
        onDelete={handleDelete}
        onRefresh={() => {
          void refreshTree();
        }}
        selectedKind={selectedKind}
      />

      <main className="main-pane">
        <TabBar
          tabs={tabs}
          activePath={activePath}
          docs={docs}
          onSelect={(path) => {
            void handleTabSelect(path);
          }}
          onClose={handleTabClose}
          onSave={() => {
            if (activePath) {
              void saveNote(activePath, { force: true });
            }
          }}
          onSaveAll={() => {
            void saveAllDirty();
          }}
          autosaveEnabled={config.autosaveEnabled}
          onToggleTrash={() => setShowTrash((prev) => !prev)}
          settingsOpen={showSettings}
          onToggleSettings={() => setShowSettings((prev) => !prev)}
        />

        <div className="toolbar-row">
          {activeDoc && (
            <div className="mode-toggle compact-actions">
              <button
                type="button"
                onClick={() => handleModeToggle('rendered')}
                className={activeDoc.mode === 'rendered' ? 'active' : ''}
              >
                Rendered
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle('source')}
                className={activeDoc.mode === 'source' ? 'active' : ''}
              >
                Source
              </button>
            </div>
          )}
          {showSettings && (
            <SettingsPanel
              config={config}
              onConfigPatch={(patch) => {
                void handleConfigPatch(patch);
              }}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>

        <section className="editor-area">
          {!activeDoc && <div className="empty-state">Open a markdown note from the sidebar.</div>}
          {activeDoc && (
            <Suspense fallback={<div className="empty-state">Loading editor...</div>}>
              {activeDoc.mode === 'source' && (
                <SourceEditor
                  value={activeDoc.content}
                  onChange={(content) => handleDocChange(activePath, content)}
                />
              )}
              {activeDoc.mode === 'rendered' && (
                <RenderedEditor
                  markdown={activeDoc.content}
                  onChange={(content) => handleDocChange(activePath, content)}
                />
              )}
            </Suspense>
          )}
        </section>

        <footer className="status-bar">{status}</footer>
      </main>

      <TrashPanel
        items={trashItems}
        visible={showTrash}
        onRefresh={() => {
          void refreshTrash();
        }}
        onRestore={(trashPath) => {
          void handleRestore(trashPath);
        }}
      />

      <ConflictModal
        conflict={conflict}
        onReload={handleConflictReload}
        onKeep={() => {
          void handleConflictKeep();
        }}
        onSaveCopy={() => {
          void handleConflictSaveCopy();
        }}
      />

      <InputModal
        dialog={inputDialog}
        onCancel={() => setInputDialog(null)}
        onConfirm={(value) => {
          void handleInputConfirm(value);
        }}
      />

      <ConfirmModal
        dialog={confirmDialog}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => {
          void handleConfirmAccept();
        }}
      />
    </div>
  );
}
