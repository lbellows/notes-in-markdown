import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { standardSQL } from '@codemirror/legacy-modes/mode/sql';
import { rust } from '@codemirror/legacy-modes/mode/rust';
import { go } from '@codemirror/legacy-modes/mode/go';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { toml } from '@codemirror/legacy-modes/mode/toml';
import { EditorView, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import {
  applyHeadingToLine,
  insertLink,
  shiftHeadingLine,
  toggleBulletLine,
  toggleOrderedLine,
  toggleQuoteLine,
  toggleTaskLine,
  toggleWrap
} from './markdown-commands';

function toLanguage(result) {
  if (!result) {
    return null;
  }
  return result.language ?? result;
}

function languageByInfo(info) {
  const name = (info || '').trim().split(/\s+/)[0].toLowerCase();

  switch (name) {
    case 'js':
    case 'javascript':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return toLanguage(javascript({ jsx: true }));
    case 'ts':
    case 'typescript':
      return toLanguage(javascript({ typescript: true }));
    case 'tsx':
      return toLanguage(javascript({ typescript: true, jsx: true }));
    case 'json':
      return toLanguage(json());
    case 'py':
    case 'python':
      return toLanguage(python());
    case 'css':
    case 'scss':
      return toLanguage(css());
    case 'html':
    case 'xml':
    case 'svg':
      return toLanguage(html());
    case 'sh':
    case 'bash':
    case 'shell':
    case 'zsh':
      return StreamLanguage.define(shell);
    case 'yml':
    case 'yaml':
      return StreamLanguage.define(yaml);
    case 'sql':
      return StreamLanguage.define(standardSQL);
    case 'rs':
    case 'rust':
      return StreamLanguage.define(rust);
    case 'go':
    case 'golang':
      return StreamLanguage.define(go);
    case 'dockerfile':
    case 'docker':
      return StreamLanguage.define(dockerFile);
    case 'toml':
      return StreamLanguage.define(toml);
    case 'md':
    case 'markdown':
      return markdownLanguage;
    default:
      return null;
  }
}

function dispatchReplacement(view, nextText, nextFrom, nextTo) {
  const current = view.state.doc.toString();
  if (current === nextText) {
    return false;
  }

  let start = 0;
  const minLen = Math.min(current.length, nextText.length);
  while (start < minLen && current[start] === nextText[start]) {
    start += 1;
  }

  let endCur = current.length;
  let endNext = nextText.length;
  while (
    endCur > start &&
    endNext > start &&
    current[endCur - 1] === nextText[endNext - 1]
  ) {
    endCur -= 1;
    endNext -= 1;
  }

  view.dispatch({
    changes: { from: start, to: endCur, insert: nextText.slice(start, endNext) },
    selection: { anchor: nextFrom, head: nextTo }
  });
  return true;
}

function wrapCommand(marker) {
  return (view) => {
    if (view.state.readOnly) {
      return false;
    }
    const { from, to } = view.state.selection.main;
    const result = toggleWrap(view.state.doc.toString(), from, to, marker);
    return dispatchReplacement(view, result.text, result.from, result.to);
  };
}

function mapSelectedLines(view, transform) {
  if (view.state.readOnly) {
    return false;
  }

  const changes = [];
  for (const range of view.state.selection.ranges) {
    const fromLine = view.state.doc.lineAt(range.from);
    const toLine = view.state.doc.lineAt(range.to > range.from ? range.to - 1 : range.to);
    for (let number = fromLine.number; number <= toLine.number; number += 1) {
      const line = view.state.doc.line(number);
      const next = transform(line.text);
      if (next !== line.text) {
        changes.push({ from: line.from, to: line.to, insert: next });
      }
    }
  }

  if (!changes.length) {
    return false;
  }

  view.dispatch({ changes });
  return true;
}

function headingCommand(level) {
  return (view) => mapSelectedLines(view, (line) => applyHeadingToLine(line, level));
}

function insertLinkCommand(view) {
  if (view.state.readOnly) {
    return false;
  }
  const { from, to } = view.state.selection.main;
  const result = insertLink(view.state.doc.toString(), from, to);
  return dispatchReplacement(view, result.text, result.from, result.to);
}

// Shared by the keymap and the formatting toolbar.
export const sourceCommands = {
  bold: wrapCommand('**'),
  italic: wrapCommand('_'),
  code: wrapCommand('`'),
  strike: wrapCommand('~~'),
  link: insertLinkCommand,
  bulletList: (view) => mapSelectedLines(view, toggleBulletLine),
  orderedList: (view) => mapSelectedLines(view, toggleOrderedLine),
  taskList: (view) => mapSelectedLines(view, toggleTaskLine),
  quote: (view) => mapSelectedLines(view, toggleQuoteLine),
  headingUp: (view) => mapSelectedLines(view, (line) => shiftHeadingLine(line, 1)),
  headingDown: (view) => mapSelectedLines(view, (line) => shiftHeadingLine(line, -1))
};

const markdownFormatKeymap = [
  { key: 'Mod-b', run: sourceCommands.bold },
  { key: 'Mod-i', run: sourceCommands.italic },
  { key: 'Mod-e', run: sourceCommands.code },
  { key: 'Mod-Shift-s', run: sourceCommands.strike },
  { key: 'Mod-k', run: sourceCommands.link },
  { key: 'Mod-Shift-8', run: sourceCommands.bulletList },
  { key: 'Mod-Shift-7', run: sourceCommands.orderedList },
  { key: 'Mod-Shift-9', run: sourceCommands.taskList },
  { key: 'Mod-Shift-.', run: sourceCommands.quote },
  { key: 'Mod-Alt-=', run: sourceCommands.headingUp },
  { key: 'Mod-Alt--', run: sourceCommands.headingDown },
  { key: 'Mod-Alt-0', run: headingCommand(0) },
  { key: 'Mod-Alt-1', run: headingCommand(1) },
  { key: 'Mod-Alt-2', run: headingCommand(2) },
  { key: 'Mod-Alt-3', run: headingCommand(3) },
  { key: 'Mod-Alt-4', run: headingCommand(4) },
  { key: 'Mod-Alt-5', run: headingCommand(5) },
  { key: 'Mod-Alt-6', run: headingCommand(6) }
];

const editorChrome = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  '.cm-content': { fontSize: '13.5px', lineHeight: '1.55' },
  '.cm-gutters': { fontSize: '12px' }
});

export function createMarkdownExtensions({ wordWrap = false } = {}) {
  const extensions = [
    markdown({
      base: markdownLanguage,
      codeLanguages: languageByInfo,
      addKeymap: true
    }),
    Prec.high(keymap.of(markdownFormatKeymap)),
    editorChrome
  ];

  if (wordWrap) {
    extensions.push(EditorView.lineWrapping);
  }

  return extensions;
}
