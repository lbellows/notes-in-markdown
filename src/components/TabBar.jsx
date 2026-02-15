import React from 'react';

export default function TabBar({
  tabs,
  activePath,
  docs,
  onSelect,
  onClose,
  onSave,
  onSaveAll,
  autosaveEnabled,
  onToggleTrash
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
              <button type="button" className="tab-select" onClick={() => onSelect(tabPath)}>
                {name}
                {isDirty ? ' *' : ''}
              </button>
              <button type="button" className="tab-close" onClick={() => onClose(tabPath)}>
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className="tab-actions">
        <button type="button" onClick={onSave} disabled={!activePath}>
          Save
        </button>
        <button type="button" onClick={onSaveAll} disabled={tabs.length === 0}>
          Save All
        </button>
        <button type="button" onClick={onToggleTrash}>Trash</button>
        <span className="autosave-pill">Autosave: {autosaveEnabled ? 'On' : 'Off'}</span>
      </div>
    </div>
  );
}
