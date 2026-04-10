import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';

export default function SourceEditor({ value, onChange, wordWrap = false }) {
  const extensions = [markdown()];
  if (wordWrap) extensions.push(EditorView.lineWrapping);

  return (
    <div className="editor-panel">
      <CodeMirror
        value={value}
        height="100%"
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          highlightActiveLine: true
        }}
        onChange={(nextValue) => onChange(nextValue)}
      />
    </div>
  );
}
