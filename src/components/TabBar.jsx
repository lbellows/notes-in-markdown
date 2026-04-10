import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

function TabContextMenu({ x, y, tabPath, allTabs, onClose, onCloseOthers, onCloseAll, onPopout, onDismiss }) {
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onDismiss();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onDismiss]);

  const hasOthers = allTabs.length > 1;

  return (
    <ul ref={ref} className="ctx-menu" style={{ top: y, left: x }} role="menu">
      <li role="menuitem">
        <button type="button" onClick={() => { onPopout(tabPath); onDismiss(); }}>Pop out</button>
      </li>
      <li role="menuitem">
        <button type="button" onClick={() => { onClose(tabPath); onDismiss(); }}>Close</button>
      </li>
      <li role="menuitem">
        <button type="button" disabled={!hasOthers} onClick={() => { onCloseOthers(tabPath); onDismiss(); }}>
          Close Others
        </button>
      </li>
      <li role="menuitem">
        <button type="button" onClick={() => { onCloseAll(); onDismiss(); }}>Close All</button>
      </li>
    </ul>
  );
}

function MoreMenu({ onSaveAll, onToggleTrash, hasTabs, onDismiss }) {
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onDismiss();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onDismiss]);

  return (
    <ul ref={ref} className="ctx-menu ctx-menu-up" role="menu">
      <li role="menuitem">
        <button type="button" disabled={!hasTabs} onClick={() => { onSaveAll(); onDismiss(); }}>
          Save All
        </button>
      </li>
      <li role="menuitem">
        <button type="button" onClick={() => { onToggleTrash(); onDismiss(); }}>
          View Deleted
        </button>
      </li>
    </ul>
  );
}

function IconButton({ label, icon, onClick, disabled = false, active = false }) {
  return (
    <button
      type="button"
      className={`icon-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} size={13} />
    </button>
  );
}

export default function TabBar({
  tabs,
  previewPath,
  activePath,
  docs,
  onSelect,
  onClose,
  onCloseOthers,
  onCloseAll,
  onPopout,
  onSave,
  onSaveAll,
  autosaveEnabled,
  onToggleTrash,
  onToggleSettings,
  settingsOpen,
  activeMode,
  onModeChange,
  onPrint
}) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef(null);

  // Preview tab occupies slot 0; permanent tabs follow
  const allTabs = previewPath
    ? [previewPath, ...tabs.filter((t) => t !== previewPath)]
    : tabs;

  const handleTabContextMenu = (e, tabPath) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, tabPath });
  };

  return (
    <div className="tab-shell">
      <div className="tab-row">
        {allTabs.map((tabPath) => {
          const isActive = tabPath === activePath;
          const isPreview = tabPath === previewPath;
          const doc = docs[tabPath];
          const isDirty = doc?.dirty;
          const name = tabPath.split('/').pop() || tabPath;

          return (
            <div
              key={tabPath}
              className={`tab ${isActive ? 'active' : ''} ${isPreview ? 'preview' : ''}`}
              onContextMenu={(e) => handleTabContextMenu(e, tabPath)}
            >
              <button type="button" className="tab-select" onClick={() => onSelect(tabPath)} title={tabPath}>
                {name}
                {isDirty ? ' ●' : ''}
              </button>
              <button
                type="button"
                className="tab-close"
                onClick={() => onClose(tabPath)}
                aria-label={`Close ${name}`}
                title="Close tab"
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {ctxMenu && (
        <TabContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          tabPath={ctxMenu.tabPath}
          allTabs={allTabs}
          onClose={onClose}
          onCloseOthers={onCloseOthers}
          onCloseAll={onCloseAll}
          onPopout={onPopout}
          onDismiss={() => setCtxMenu(null)}
        />
      )}

      <div className="tab-actions compact-actions">
        {activePath && (
          <div className="mode-toggle compact-actions">
            <button
              type="button"
              onClick={() => onModeChange('rendered')}
              className={activeMode === 'rendered' ? 'active' : ''}
              title="Markdown view"
            >
              md
            </button>
            <button
              type="button"
              onClick={() => onModeChange('source')}
              className={activeMode === 'source' ? 'active' : ''}
              title="Source view"
            >
              src
            </button>
          </div>
        )}

        <div className="tab-actions-right compact-actions">
          <IconButton label="Save" icon="save" onClick={onSave} disabled={!activePath} />
          <IconButton label="Print" icon="print" onClick={onPrint} disabled={!activePath} />
          <IconButton
            label="Settings"
            icon="settings"
            onClick={onToggleSettings}
            active={settingsOpen}
          />
          <div className="more-menu-wrap" ref={moreRef}>
            <button
              type="button"
              className={`icon-btn ${showMore ? 'active' : ''}`}
              onClick={() => setShowMore((v) => !v)}
              aria-label="More options"
              title="More options"
            >
              <Icon name="more" size={13} />
            </button>
            {showMore && (
              <MoreMenu
                onSaveAll={onSaveAll}
                onToggleTrash={onToggleTrash}
                hasTabs={tabs.length > 0}
                onDismiss={() => setShowMore(false)}
              />
            )}
          </div>
          <span
            className="autosave-pill"
            title={autosaveEnabled ? 'Autosave is enabled' : 'Autosave is disabled'}
          >
            Auto: {autosaveEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </div>
  );
}
