import React from 'react';

export default function SettingsPanel({ config, onConfigPatch }) {
  return (
    <div className="settings-panel">
      <label>
        <input
          type="checkbox"
          checked={config.autosaveEnabled}
          onChange={(event) => onConfigPatch({ autosaveEnabled: event.target.checked })}
        />
        Enable autosave
      </label>

      <label>
        Autosave delay (ms)
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
    </div>
  );
}
