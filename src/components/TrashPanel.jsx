import React from 'react';

export default function TrashPanel({ items, onRestore, onRefresh, visible }) {
  if (!visible) {
    return null;
  }

  return (
    <aside className="trash-panel">
      <div className="trash-header">
        <span>Trash</span>
        <button type="button" onClick={onRefresh}>Refresh</button>
      </div>

      <ul className="trash-list">
        {items.map((item) => (
          <li key={item.trashPath} className="trash-item">
            <div className="trash-label">{item.name}</div>
            <div className="trash-meta">{item.originalPath || 'Unknown origin'}</div>
            <button type="button" onClick={() => onRestore(item.trashPath)}>
              Restore
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
