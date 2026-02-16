import React from 'react';
import Icon from './Icon';

export default function SettingsPanel({ config, onConfigPatch, onOpenDevTools, onClose }) {
  return (
    <div className="settings-popover">
      <div className="settings-title-row">
        <strong>Settings</strong>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label="Close settings"
          title="Close settings"
        >
          <Icon name="close" size={12} />
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
          min={300}
          max={6000}
          step={100}
          value={config.autosaveDelayMs}
          onChange={(event) =>
            onConfigPatch({
              autosaveDelayMs: Number.parseInt(event.target.value, 10) || 1400
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

      <div className="settings-devtools">
        <span>Developer</span>
        <button type="button" className="settings-action-btn" onClick={() => onOpenDevTools?.()}>
          Open DevTools
        </button>
      </div>
    </div>
  );
}
