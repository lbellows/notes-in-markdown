import React from 'react';
import Icon from './Icon';

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
  activePath,
  docs,
  onSelect,
  onClose,
  onSave,
  onSaveAll,
  autosaveEnabled,
  onToggleTrash,
  onToggleSettings,
  settingsOpen,
  activeMode,
  onModeChange
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

      <div className="tab-actions compact-actions">
        <IconButton label="Save" icon="save" onClick={onSave} disabled={!activePath} />
        <IconButton label="Save all" icon="saveAll" onClick={onSaveAll} disabled={tabs.length === 0} />
        <IconButton label="Trash" icon="folder" onClick={onToggleTrash} />
        <IconButton
          label="Settings"
          icon="settings"
          onClick={onToggleSettings}
          active={settingsOpen}
        />

        {activePath && (
          <div className="mode-toggle compact-actions inline-modes">
            <button
              type="button"
              onClick={() => onModeChange('rendered')}
              className={activeMode === 'rendered' ? 'active' : ''}
              title="Markdown view"
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={() => onModeChange('source')}
              className={activeMode === 'source' ? 'active' : ''}
              title="Source view"
            >
              Source
            </button>
          </div>
        )}

        <span
          className="autosave-pill"
          title={autosaveEnabled ? 'Autosave is enabled' : 'Autosave is disabled'}
        >
          Auto: {autosaveEnabled ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
}
