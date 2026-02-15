import React from 'react';

export default function ConfirmModal({ dialog, onCancel, onConfirm }) {
  if (!dialog) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal compact-modal">
        <h2>{dialog.title}</h2>
        <p>{dialog.message}</p>
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" onClick={onConfirm}>{dialog.confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}
