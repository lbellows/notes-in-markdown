import React, { useEffect, useMemo, useRef } from 'react';
import {
  markdownToSanitizedHtml,
  resolveNoteLink
} from '../lib/markdown';

export default function PreviewPane({
  markdown,
  notePath,
  onToggleTask,
  onOpenNote,
  onScroll
}) {
  const containerRef = useRef(null);
  const html = useMemo(
    () => markdownToSanitizedHtml(markdown, { interactiveTasks: true }),
    [markdown]
  );

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = html;
    }
  }, [html]);

  const handleClick = (event) => {
    const checkbox = event.target.closest?.('input[type="checkbox"]');
    if (checkbox && containerRef.current?.contains(checkbox)) {
      event.preventDefault();
      const boxes = [...containerRef.current.querySelectorAll('input[type="checkbox"]')];
      const index = boxes.indexOf(checkbox);
      if (index >= 0) {
        onToggleTask?.(index);
      }
      return;
    }

    const anchor = event.target.closest?.('a');
    if (!anchor || !containerRef.current?.contains(anchor)) {
      return;
    }

    const href = anchor.getAttribute('href') || '';
    const resolved = resolveNoteLink(notePath, href);

    if (resolved.kind === 'hash') {
      event.preventDefault();
      const target = containerRef.current.querySelector(resolved.href);
      target?.scrollIntoView({ block: 'start' });
      return;
    }

    if (resolved.kind === 'note') {
      event.preventDefault();
      onOpenNote?.(resolved.path);
      return;
    }

    if (resolved.kind === 'external') {
      event.preventDefault();
      if (/^https?:\/\//i.test(resolved.href)) {
        void window.mdnote?.openExternal?.(resolved.href);
      }
    }
  };

  return (
    <div className="editor-panel preview-shell" onScroll={onScroll}>
      <div
        ref={containerRef}
        className="preview-pane md-content"
        onClick={handleClick}
      />
    </div>
  );
}
