import React, { useEffect, useState } from 'react';

export default function InputModal({ dialog, onCancel, onConfirm }) {
  const [value, setValue] = useState(dialog?.initialValue || '');

  useEffect(() => {
    setValue(dialog?.initialValue || '');
  }, [dialog]);

  if (!dialog) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal compact-modal">
        <h2>{dialog.title}</h2>
        <label className="modal-label" htmlFor="dialog-input">
          {dialog.label}
        </label>
        <input
          id="dialog-input"
          className="modal-input"
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onConfirm(value);
            }
          }}
        />
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            onClick={() => onConfirm(value)}
            disabled={!value.trim()}
          >
            {dialog.confirmLabel || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
