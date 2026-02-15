import React from 'react';

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
      {icon}
    </button>
  );
}

export default function TabBar({
  tabs,
  activePath,
  docs,
  onSelect,
  onClose,
  onSave,
  onSaveAll,
  autosaveEnabled,
  onToggleTrash,
  onToggleSettings,
  settingsOpen
}) {
  return (
    <div className="tab-shell">
      <div className="tab-row">
        {tabs.map((tabPath) => {
          const isActive = tabPath === activePath;
          const doc = docs[tabPath];
          const isDirty = doc?.dirty;
          const name = tabPath.split('/').pop() || tabPath;

          return (
            <div key={tabPath} className={`tab ${isActive ? 'active' : ''}`}>
              <button type="button" className="tab-select" onClick={() => onSelect(tabPath)} title={tabPath}>
                {name}
                {isDirty ? ' ●' : ''}
              </button>
              <button type="button" className="tab-close" onClick={() => onClose(tabPath)} aria-label={`Close ${name}`} title="Close tab">
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className="tab-actions compact-actions">
        <IconButton label="Save" icon="💾" onClick={onSave} disabled={!activePath} />
        <IconButton label="Save All" icon="⟲" onClick={onSaveAll} disabled={tabs.length === 0} />
        <IconButton label="Trash" icon="🗁" onClick={onToggleTrash} />
        <IconButton
          label="Settings"
          icon="⚙"
          onClick={onToggleSettings}
          active={settingsOpen}
        />
        <span className="autosave-pill">A:{autosaveEnabled ? 'ON' : 'OFF'}</span>
      </div>
    </div>
  );
}
