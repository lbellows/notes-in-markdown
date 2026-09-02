import React, { useMemo } from 'react';

export default function OutlinePanel({ headings, activeLine, onJump }) {
  const activeHeadingLine = useMemo(() => {
    if (activeLine == null) {
      return 0;
    }
    let best = 0;
    for (const heading of headings) {
      if (heading.line <= activeLine) {
        best = heading.line;
      }
    }
    return best;
  }, [headings, activeLine]);

  return (
    <aside className="outline-panel" aria-label="Document outline">
      <div className="outline-title">Outline</div>
      {headings.length === 0 ? (
        <div className="outline-empty">No headings</div>
      ) : (
        <ul className="outline-list">
          {headings.map((heading) => (
            <li key={`${heading.line}-${heading.id}`}>
              <button
                type="button"
                className={`outline-item level-${heading.level}${heading.line === activeHeadingLine ? ' active' : ''}`}
                onClick={() => onJump(heading)}
                title={heading.text}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
