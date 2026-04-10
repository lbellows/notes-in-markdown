import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';

function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  return (
    <ul
      ref={menuRef}
      className="ctx-menu"
      style={{ top: y, left: x }}
      role="menu"
    >
      {items.map((item) => (
        <li key={item.label} role="menuitem">
          <button
            type="button"
            className={item.danger ? 'ctx-danger' : ''}
            onClick={() => { item.action(); onClose(); }}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  expandedPaths,
  selectedPath,
  onToggleExpand,
  onSelect,
  onPreviewNote,
  onOpenNote,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  dragOverPath
}) {
  const isExpanded = expandedPaths.includes(node.path);
  const isSelected = selectedPath === node.path;
  const isDragOver = dragOverPath === node.path;

  const handleDragStart = (e) => {
    e.stopPropagation();
    onDragStart(node.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    // Files drop into their parent folder (the folder node), folders accept drops directly
    const dropTarget = node.kind === 'folder' ? node.path : null;
    if (dropTarget) onDragOver(dropTarget);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.kind === 'folder') {
      onDrop(node.path);
    }
  };

  const handleDragLeave = (e) => {
    e.stopPropagation();
    onDragOver(null);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node);
  };

  if (node.kind === 'file') {
    return (
      <li>
        <button
          type="button"
          className={`tree-item file ${isSelected ? 'selected' : ''}`}
          onClick={() => { onSelect(node.path); onPreviewNote(node.path); }}
          onDoubleClick={() => onOpenNote(node.path)}
          onContextMenu={handleContextMenu}
          draggable
          onDragStart={handleDragStart}
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
      <div
        className={`tree-folder-row ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
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
          onContextMenu={handleContextMenu}
          draggable
          onDragStart={handleDragStart}
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
              onPreviewNote={onPreviewNote}
              onOpenNote={onOpenNote}
              onContextMenu={onContextMenu}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dragOverPath={dragOverPath}
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

function countFiles(node) {
  if (node.kind === 'file') return 1;
  return (node.children || []).reduce((sum, child) => sum + countFiles(child), 0);
}

export default function TreeSidebar({
  tree,
  expandedPaths,
  selectedPath,
  onToggleExpand,
  onSelect,
  onPreviewNote,
  onOpenNote,
  onPopout,
  onCreateNote,
  onCreateFolder,
  onRename,
  onDelete,
  onRefresh,
  onMove,
  selectedPathDisplay
}) {
  const isRoot = selectedPath === '__root__';
  const [dragSrc, setDragSrc] = useState(null);
  const [dragOverPath, setDragOverPath] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null);

  const handleDragStart = useCallback((path) => {
    setDragSrc(path);
  }, []);

  const handleDragOver = useCallback((path) => {
    setDragOverPath(path);
  }, []);

  const handleDrop = useCallback((destDir) => {
    if (dragSrc && destDir && dragSrc !== destDir) {
      onMove(dragSrc, destDir);
    }
    setDragSrc(null);
    setDragOverPath(null);
  }, [dragSrc, onMove]);

  const handleRootDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPath('__root__');
  };

  const handleRootDrop = (e) => {
    e.preventDefault();
    if (dragSrc) {
      onMove(dragSrc, '');
    }
    setDragSrc(null);
    setDragOverPath(null);
  };

  const handleContextMenu = useCallback((e, node) => {
    const fileCount = node.kind === 'folder' ? countFiles(node) : 0;
    const items = [
      { label: 'Rename', action: () => { onSelect(node.path); onRename(node.path); } },
      { label: 'Delete', action: () => { onSelect(node.path); onDelete(node.path, fileCount); }, danger: true }
    ];
    if (node.kind === 'file') {
      items.unshift({ label: 'Pop out', action: () => onPopout(node.path) });
      items.unshift({ label: 'Open', action: () => onOpenNote(node.path) });
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }, [onSelect, onRename, onDelete, onOpenNote, onPopout]);

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

      <div
        className={`sidebar-root-row ${dragOverPath === '__root__' ? 'drag-over' : ''}`}
        onDragOver={handleRootDragOver}
        onDrop={handleRootDrop}
        onDragLeave={() => setDragOverPath(null)}
      >
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
            onPreviewNote={onPreviewNote}
            onOpenNote={onOpenNote}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dragOverPath={dragOverPath}
          />
        ))}
      </ul>

      <div className="sidebar-footer" title={selectedPathDisplay}>{selectedPathDisplay}</div>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </aside>
  );
}
