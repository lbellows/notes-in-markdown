import React from 'react';

function TreeNode({
  node,
  expandedPaths,
  selectedPath,
  onToggleExpand,
  onSelect,
  onOpenNote
}) {
  const isExpanded = expandedPaths.includes(node.path);
  const isSelected = selectedPath === node.path;

  if (node.kind === 'file') {
    return (
      <li>
        <button
          type="button"
          className={`tree-item file ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelect(node.path)}
          onDoubleClick={() => onOpenNote(node.path)}
          title={node.path}
        >
          <span className="tree-icon">M</span>
          <span className="tree-text">{node.name}</span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <div className="tree-folder-row">
        <button
          type="button"
          className="tree-expander"
          onClick={() => onToggleExpand(node.path)}
          aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▾' : '▸'}
        </button>
        <button
          type="button"
          className={`tree-item folder ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelect(node.path)}
          title={node.path}
        >
          <span className="tree-icon">{isExpanded ? '▾' : '▸'}</span>
          <span className="tree-text">{node.name}</span>
        </button>
      </div>
      {isExpanded && node.children?.length > 0 && (
        <ul className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              expandedPaths={expandedPaths}
              selectedPath={selectedPath}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onOpenNote={onOpenNote}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function IconButton({ label, icon, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

export default function TreeSidebar({
  tree,
  expandedPaths,
  selectedPath,
  onToggleExpand,
  onSelect,
  onOpenNote,
  onCreateNote,
  onCreateFolder,
  onRename,
  onDelete,
  onRefresh,
  selectedKind
}) {
  const isRoot = selectedPath === '__root__';

  return (
    <aside className="sidebar">
      <div className="sidebar-header compact-header">
        <span>EXPLORER</span>
        <div className="sidebar-actions compact-actions">
          <IconButton label="New Note" icon="＋M" onClick={onCreateNote} />
          <IconButton label="New Folder" icon="＋F" onClick={onCreateFolder} />
          <IconButton label="Rename" icon="✎" onClick={onRename} disabled={isRoot} />
          <IconButton label="Delete" icon="🗑" onClick={onDelete} disabled={isRoot} />
          <IconButton label="Refresh" icon="↻" onClick={onRefresh} />
        </div>
      </div>

      <div className="sidebar-root-row">
        <button
          type="button"
          className={`tree-item folder ${isRoot ? 'selected' : ''}`}
          onClick={() => onSelect('__root__')}
          title="Notes root"
        >
          <span className="tree-icon">⌂</span>
          <span className="tree-text">Notes</span>
        </button>
      </div>

      <ul className="tree-list">
        {tree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            expandedPaths={expandedPaths}
            selectedPath={selectedPath}
            onToggleExpand={onToggleExpand}
            onSelect={onSelect}
            onOpenNote={onOpenNote}
          />
        ))}
      </ul>

      <div className="sidebar-footer">{selectedKind || 'none'}</div>
    </aside>
  );
}
