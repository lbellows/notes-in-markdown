import React from 'react';

export default function ConflictModal({ conflict, onReload, onKeep, onSaveCopy }) {
  if (!conflict) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>File conflict detected</h2>
        <p>
          <code>{conflict.path}</code> changed on disk while you had unsaved edits.
        </p>
        <div className="modal-actions">
          <button type="button" onClick={onReload}>Reload from Disk</button>
          <button type="button" onClick={onKeep}>Keep My Version</button>
          <button type="button" onClick={onSaveCopy}>Save as Copy</button>
        </div>
      </div>
    </div>
  );
}
