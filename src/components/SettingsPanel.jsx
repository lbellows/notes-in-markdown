import React from 'react';

export default function SettingsPanel({ config, onConfigPatch, onClose }) {
  return (
    <div className="settings-popover">
      <div className="settings-title-row">
        <strong>Settings</strong>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings" title="Close">
          ×
        </button>
      </div>

      <label className="settings-label">
        <input
          type="checkbox"
          checked={config.autosaveEnabled}
          onChange={(event) => onConfigPatch({ autosaveEnabled: event.target.checked })}
        />
        Autosave
      </label>

      <label className="settings-label settings-delay">
        <span>Delay (ms)</span>
        <input
          type="number"
          min={200}
          max={5000}
          step={100}
          value={config.autosaveDelayMs}
          onChange={(event) =>
            onConfigPatch({
              autosaveDelayMs: Number.parseInt(event.target.value, 10) || 800
            })
          }
          disabled={!config.autosaveEnabled}
        />
      </label>

      <div className="theme-toggle">
        <span>Theme</span>
        <div className="theme-toggle-buttons">
          <button
            type="button"
            className={config.theme === 'dark' ? 'active' : ''}
            onClick={() => onConfigPatch({ theme: 'dark' })}
          >
            Dark
          </button>
          <button
            type="button"
            className={config.theme === 'light' ? 'active' : ''}
            onClick={() => onConfigPatch({ theme: 'light' })}
          >
            Light
          </button>
        </div>
      </div>
    </div>
  );
}
