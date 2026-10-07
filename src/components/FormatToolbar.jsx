import React from 'react';

const GROUPS = [
  [
    { name: 'headingUp', label: 'H+', title: 'Larger heading (Ctrl+Alt+=)' },
    { name: 'headingDown', label: 'H−', title: 'Smaller heading (Ctrl+Alt+-)' }
  ],
  [
    { name: 'bold', label: 'B', title: 'Bold (Ctrl+B)', className: 'format-bold' },
    { name: 'italic', label: 'I', title: 'Italic (Ctrl+I)', className: 'format-italic' },
    { name: 'strike', label: 'S', title: 'Strikethrough (Ctrl+Shift+S)', className: 'format-strike' },
    { name: 'code', label: '</>', title: 'Inline code (Ctrl+E)', sourceOnly: true }
  ],
  [
    { name: 'bulletList', label: '• List', title: 'Bulleted list (Ctrl+Shift+8)' },
    { name: 'orderedList', label: '1. List', title: 'Numbered list (Ctrl+Shift+7)' },
    { name: 'taskList', label: '☐ Task', title: 'Task list (Ctrl+Shift+9)', sourceOnly: true },
    { name: 'quote', label: '❝', title: 'Quote (Ctrl+Shift+.)' },
    { name: 'link', label: 'Link', title: 'Link (Ctrl+K)', sourceOnly: true }
  ]
];

export default function FormatToolbar({ target, onCommand }) {
  return (
    <div className="format-toolbar" role="toolbar" aria-label="Formatting">
      {GROUPS.map((group, index) => (
        <div className="format-group" key={index}>
          {group
            .filter((item) => target === 'source' || !item.sourceOnly)
            .map((item) => (
              <button
                key={item.name}
                type="button"
                className={`format-btn${item.className ? ` ${item.className}` : ''}`}
                title={item.title}
                aria-label={item.title}
                // Keep focus and selection in the editor.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onCommand(item.name)}
              >
                {item.label}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
