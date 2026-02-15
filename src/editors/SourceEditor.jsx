import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

export default function SourceEditor({ value, onChange }) {
  return (
    <div className="editor-panel">
      <CodeMirror
        value={value}
        height="100%"
        extensions={[markdown()]}
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
