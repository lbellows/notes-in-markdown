import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import OutlinePanel from '../components/OutlinePanel';
import FormatToolbar from '../components/FormatToolbar';
import {
  extractHeadings,
  toggleTaskAtIndex
} from '../lib/markdown';

const SourceEditor = React.lazy(() => import('./SourceEditor'));
const RenderedEditor = React.lazy(() => import('./RenderedEditor'));
const PreviewPane = React.lazy(() => import('./PreviewPane'));

export default function NoteWorkspace({
  content,
  mode,
  wordWrap,
  theme,
  showOutline,
  notePath,
  onChange,
  onOpenNote,
  onCursorChange
}) {
  const sourceRef = useRef(null);
  const previewRef = useRef(null);
  const renderedRef = useRef(null);
  const renderedEditorRef = useRef(null);
  const syncingRef = useRef(null);
  const sourceScrollerRef = useRef(null);
  const headings = useMemo(() => extractHeadings(content), [content]);
  const [activeLine, setActiveLine] = useState(1);
  const [scrollerEpoch, setScrollerEpoch] = useState(0);

  const handleCursorChange = useCallback(
    (cursor) => {
      setActiveLine((prev) => (prev === cursor.line ? prev : cursor.line));
      onCursorChange?.(cursor);
    },
    [onCursorChange]
  );

  const revealHeading = useCallback((heading) => {
    if (mode !== 'rendered') {
      sourceRef.current?.revealLine(heading.line);
    }

    const previewRoot = previewRef.current;
    if (previewRoot) {
      previewRoot.querySelector(`#${CSS.escape(heading.id)}`)?.scrollIntoView({
        block: 'start'
      });
    }

    const renderedRoot = renderedRef.current;
    if (renderedRoot) {
      renderedRoot.querySelector(`#${CSS.escape(heading.id)}`)?.scrollIntoView({
        block: 'start'
      });
    }
  }, [mode]);

  const handleToggleTask = useCallback(
    (index) => {
      onChange(toggleTaskAtIndex(content, index));
    },
    [content, onChange]
  );

  const syncPreviewFromSource = useCallback(() => {
    if (syncingRef.current === 'preview') {
      return;
    }
    const scroller = sourceScrollerRef.current || sourceRef.current?.getScroller();
    const preview = previewRef.current?.querySelector('.preview-shell');
    if (!scroller || !preview) {
      return;
    }
    const max = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    const ratio = scroller.scrollTop / max;
    syncingRef.current = 'source';
    preview.scrollTop = ratio * Math.max(0, preview.scrollHeight - preview.clientHeight);
    requestAnimationFrame(() => {
      syncingRef.current = null;
    });
  }, []);

  const handlePreviewScroll = useCallback((event) => {
    if (syncingRef.current === 'source') {
      return;
    }
    const scroller = sourceRef.current?.getScroller();
    const preview = event.currentTarget;
    if (!scroller) {
      return;
    }
    const max = Math.max(1, preview.scrollHeight - preview.clientHeight);
    const ratio = preview.scrollTop / max;
    syncingRef.current = 'preview';
    scroller.scrollTop = ratio * Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    requestAnimationFrame(() => {
      syncingRef.current = null;
    });
  }, []);

  const handleEditorReady = useCallback((view) => {
    if (sourceScrollerRef.current === view.scrollDOM) {
      return;
    }
    sourceScrollerRef.current = view.scrollDOM;
    setScrollerEpoch((value) => value + 1);
  }, []);

  useEffect(() => {
    if (mode !== 'split') {
      return undefined;
    }

    const scroller = sourceScrollerRef.current || sourceRef.current?.getScroller();
    if (!scroller) {
      return undefined;
    }

    scroller.addEventListener('scroll', syncPreviewFromSource, { passive: true });
    return () => scroller.removeEventListener('scroll', syncPreviewFromSource);
  }, [mode, syncPreviewFromSource, scrollerEpoch]);

  const showSource = mode === 'source' || mode === 'split';
  const showPreview = mode === 'split';
  const showRendered = mode === 'rendered' || !showSource;
  const commandTarget = showSource ? 'source' : 'rendered';

  const handleFormatCommand = useCallback(
    (name) => {
      const target = commandTarget === 'source' ? sourceRef.current : renderedEditorRef.current;
      target?.runCommand(name);
    },
    [commandTarget]
  );

  return (
    <div className={`note-workspace${showOutline ? ' has-outline' : ''}${mode === 'split' ? ' is-split' : ''}`}>
      {showOutline && (
        <OutlinePanel
          headings={headings}
          activeLine={activeLine}
          onJump={revealHeading}
        />
      )}

      <div className="note-main-column">
        <FormatToolbar target={commandTarget} onCommand={handleFormatCommand} />
        <div className={`note-editor-main${mode === 'split' ? ' split' : ''}`}>
          {showSource && (
            <Suspense fallback={<div className="empty-state">Loading editor...</div>}>
              <SourceEditor
                ref={sourceRef}
                value={content}
                onChange={onChange}
                wordWrap={wordWrap}
                theme={theme}
                onCursorChange={handleCursorChange}
                onEditorReady={handleEditorReady}
              />
            </Suspense>
          )}
          {showPreview && (
            <Suspense fallback={<div className="empty-state">Loading preview...</div>}>
              <div ref={previewRef} className="preview-host">
                <PreviewPane
                  markdown={content}
                  notePath={notePath}
                  onToggleTask={handleToggleTask}
                  onOpenNote={onOpenNote}
                  onScroll={handlePreviewScroll}
                />
              </div>
            </Suspense>
          )}
          {showRendered && (
            <Suspense fallback={<div className="empty-state">Loading editor...</div>}>
              <div ref={renderedRef} className="rendered-host">
                <RenderedEditor ref={renderedEditorRef} markdown={content} onChange={onChange} />
              </div>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
