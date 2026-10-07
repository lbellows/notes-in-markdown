import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import {
  htmlToMarkdown,
  markdownToSanitizedHtml,
  normalizeMarkdownLineEndings
} from '../lib/markdown';
import { renderedCommands } from '../lib/rendered-commands';

const RenderedEditor = forwardRef(function RenderedEditor({ markdown, onChange }, ref) {
  const editorRef = useRef(null);
  const html = useMemo(() => markdownToSanitizedHtml(markdown), [markdown]);

  useImperativeHandle(ref, () => ({
    runCommand(name) {
      const root = editorRef.current;
      if (!root || !renderedCommands[name]) {
        return;
      }
      if (document.activeElement !== root) {
        root.focus();
      }
      // execCommand fires an input event, which syncs the markdown via handleInput.
      renderedCommands[name](root);
    }
  }));

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
        className="rendered-editor md-content"
        contentEditable
        ref={editorRef}
        suppressContentEditableWarning
        spellCheck={false}
        onInput={handleInput}
      />
    </div>
  );
});

export default RenderedEditor;
