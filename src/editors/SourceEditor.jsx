import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { createMarkdownExtensions, sourceCommands } from '../lib/source-extensions';

const SourceEditor = forwardRef(function SourceEditor(
  { value, onChange, wordWrap = false, theme = 'dark', onCursorChange, onEditorReady },
  ref
) {
  const cmRef = useRef(null);
  const extensions = useMemo(
    () => createMarkdownExtensions({ wordWrap }),
    [wordWrap]
  );

  useImperativeHandle(ref, () => ({
    revealLine(lineNumber) {
      const view = cmRef.current?.view;
      if (!view) {
        return;
      }

      const clamped = Math.min(Math.max(lineNumber, 1), view.state.doc.lines);
      const line = view.state.doc.line(clamped);
      view.dispatch({
        selection: { anchor: line.from },
        effects: EditorView.scrollIntoView(line.from, { y: 'start', yMargin: 48 })
      });
      view.focus();
    },
    getScroller() {
      return cmRef.current?.view?.scrollDOM || null;
    },
    getView() {
      return cmRef.current?.view || null;
    },
    runCommand(name) {
      const view = cmRef.current?.view;
      if (!view || !sourceCommands[name]) {
        return;
      }
      sourceCommands[name](view);
      view.focus();
    }
  }));

  return (
    <div className="editor-panel">
      <CodeMirror
        ref={cmRef}
        className="source-cm"
        value={value}
        height="100%"
        theme={theme === 'light' ? 'light' : 'dark'}
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          highlightSelectionMatches: true,
          searchKeymap: true,
          indentOnInput: true,
          syntaxHighlighting: true
        }}
        indentWithTab
        onCreateEditor={(view) => {
          onEditorReady?.(view);
        }}
        onChange={(nextValue) => onChange(nextValue)}
        onStatistics={(stats) => {
          if (!onCursorChange || !stats?.line || !stats.selectionAsSingle) {
            return;
          }
          const head = stats.selectionAsSingle.head;
          onCursorChange({
            line: stats.line.number,
            col: head - stats.line.from + 1
          });
        }}
      />
    </div>
  );
});

export default SourceEditor;
