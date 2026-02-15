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
        >
          {node.name}
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
        >
          {isExpanded ? '▾' : '▸'}
        </button>
        <button
          type="button"
          className={`tree-item folder ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelect(node.path)}
        >
          {node.name}
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
  return (
    <aside className="sidebar">
      <div className="sidebar-header">Hierarchy</div>
      <div className="sidebar-actions">
        <button type="button" onClick={onCreateNote}>New Note</button>
        <button type="button" onClick={onCreateFolder}>New Folder</button>
        <button
          type="button"
          onClick={onRename}
          disabled={!selectedPath || selectedPath === '__root__'}
        >
          Rename
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!selectedPath || selectedPath === '__root__'}
        >
          Delete
        </button>
        <button type="button" onClick={onRefresh}>Refresh</button>
      </div>

      <div className="sidebar-root-row">
        <button
          type="button"
          className={`tree-item folder ${selectedPath === '__root__' ? 'selected' : ''}`}
          onClick={() => onSelect('__root__')}
        >
          Notes Root
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

      <div className="sidebar-footer">Selected: {selectedKind || 'none'}</div>
    </aside>
  );
}
