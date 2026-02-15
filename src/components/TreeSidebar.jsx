import React from 'react';
import Icon from './Icon';

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
          <span className="tree-icon"><Icon name="file" size={12} /></span>
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
          title={isExpanded ? 'Collapse folder' : 'Expand folder'}
        >
          {isExpanded ? '▾' : '▸'}
        </button>
        <button
          type="button"
          className={`tree-item folder ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelect(node.path)}
          title={node.path}
        >
          <span className="tree-icon"><Icon name="folder" size={12} /></span>
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
      <Icon name={icon} size={13} />
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
  selectedPathDisplay
}) {
  const isRoot = selectedPath === '__root__';

  return (
    <aside className="sidebar">
      <div className="sidebar-header compact-header">
        <div className="sidebar-actions compact-actions">
          <IconButton label="New note" icon="filePlus" onClick={onCreateNote} />
          <IconButton label="New folder" icon="folderPlus" onClick={onCreateFolder} />
          <IconButton label="Rename" icon="rename" onClick={onRename} disabled={isRoot} />
          <IconButton label="Delete" icon="trash" onClick={onDelete} disabled={isRoot} />
          <IconButton label="Refresh" icon="refresh" onClick={onRefresh} />
        </div>
      </div>

      <div className="sidebar-root-row">
        <button
          type="button"
          className={`tree-item folder ${isRoot ? 'selected' : ''}`}
          onClick={() => onSelect('__root__')}
          title="/"
        >
          <span className="tree-icon"><Icon name="home" size={12} /></span>
          <span className="tree-text">/</span>
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

      <div className="sidebar-footer" title={selectedPathDisplay}>{selectedPathDisplay}</div>
    </aside>
  );
}
