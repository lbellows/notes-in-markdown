import React, { useEffect, useMemo, useRef } from 'react';
import {
  htmlToMarkdown,
  markdownToSanitizedHtml,
  normalizeMarkdownLineEndings
} from '../lib/markdown';

export default function RenderedEditor({ markdown, onChange }) {
  const editorRef = useRef(null);
  const html = useMemo(() => markdownToSanitizedHtml(markdown), [markdown]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = html;
    }
  }, [html]);

  const handleInput = () => {
    if (!editorRef.current) {
      return;
    }

    const nextMarkdown = normalizeMarkdownLineEndings(
      htmlToMarkdown(editorRef.current.innerHTML)
    );

    onChange(nextMarkdown);
  };

  return (
    <div className="editor-panel rendered-shell">
      <div
        className="rendered-editor"
        contentEditable
        ref={editorRef}
        suppressContentEditableWarning
        onInput={handleInput}
      />
    </div>
  );
}
