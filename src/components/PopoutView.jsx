import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createAutosaveScheduler } from '../lib/autosave';
import { normalizeMarkdownLineEndings } from '../lib/markdown';

const SourceEditor = React.lazy(() => import('../editors/SourceEditor'));
const RenderedEditor = React.lazy(() => import('../editors/RenderedEditor'));

export default function PopoutView({ notePath }) {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('rendered');
  const [baseMtimeMs, setBaseMtimeMs] = useState(null);
  const [status, setStatus] = useState('Loading…');
  const [wordWrap, setWordWrap] = useState(false);

  const contentRef = useRef(content);
  const baseMtimeMsRef = useRef(baseMtimeMs);
  const autosaveSchedulerRef = useRef(null);
  const statusTimerRef = useRef(null);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { baseMtimeMsRef.current = baseMtimeMs; }, [baseMtimeMs]);

  const showStatus = useCallback((msg) => {
    setStatus(msg);
    clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatus(''), 2500);
  }, []);

  const save = useCallback(async ({ force = false } = {}) => {
    const current = contentRef.current;
    const payload = { path: notePath, content: current };
    if (!force && baseMtimeMsRef.current != null) {
      payload.expectedMtimeMs = baseMtimeMsRef.current;
    }
    const result = await window.mdnote.writeNote(payload);
    if (!result.conflict) {
      setBaseMtimeMs(result.mtimeMs);
      baseMtimeMsRef.current = result.mtimeMs;
      showStatus('Saved');
    } else {
      showStatus('Conflict — file changed on disk');
    }
  }, [notePath, showStatus]);

  // Load note on mount
  useEffect(() => {
    window.mdnote.readNote(notePath).then((loaded) => {
      setContent(loaded.content);
      contentRef.current = loaded.content;
      setBaseMtimeMs(loaded.mtimeMs);
      baseMtimeMsRef.current = loaded.mtimeMs;
      setStatus('');
    }).catch(() => setStatus('Failed to load note'));
  }, [notePath]);

  // Autosave scheduler
  useEffect(() => {
    autosaveSchedulerRef.current = createAutosaveScheduler({
      delayMs: 1400,
      onSave: () => void save()
    });
    return () => autosaveSchedulerRef.current?.cancelAll();
  }, [save]);

  // Apply theme from config
  useEffect(() => {
    window.mdnote.getConfig().then((cfg) => {
      document.documentElement.dataset.theme = cfg.theme || 'dark';
      if (cfg.defaultMode) setMode(cfg.defaultMode);
      setWordWrap(cfg.wordWrap ?? false);
    });
  }, []);

  // Ctrl+P to print, Ctrl+S to save
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); window.print(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); void save({ force: true }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  const handleChange = (next) => {
    const normalized = normalizeMarkdownLineEndings(next);
    setContent(normalized);
    contentRef.current = normalized;
    autosaveSchedulerRef.current?.schedule(notePath);
  };

  const fileName = notePath.split('/').pop() || notePath;

  return (
    <div className="popout-shell">
      <div className="popout-toolbar">
        <span className="popout-title" title={notePath}>{fileName}</span>
        <div className="popout-actions">
          <div className="mode-toggle compact-actions">
            <button
              type="button"
              onClick={() => setMode('rendered')}
              className={mode === 'rendered' ? 'active' : ''}
              title="Markdown view"
            >MD</button>
            <button
              type="button"
              onClick={() => setMode('source')}
              className={mode === 'source' ? 'active' : ''}
              title="Source view"
            >Src</button>
          </div>
          <button type="button" onClick={() => void save({ force: true })} title="Save (Ctrl+S)">Save</button>
          <button type="button" onClick={() => window.print()} title="Print (Ctrl+P)">Print</button>
        </div>
        <span className="autosave-pill popout-status">{status}</span>
      </div>

      <div className="popout-editor">
        <Suspense fallback={<div className="empty-state">Loading…</div>}>
          {mode === 'source' && (
            <SourceEditor value={content} onChange={handleChange} wordWrap={wordWrap} />
          )}
          {mode === 'rendered' && (
            <RenderedEditor markdown={content} onChange={handleChange} wordWrap={wordWrap} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
