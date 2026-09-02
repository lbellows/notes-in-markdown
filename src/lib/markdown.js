import { marked } from 'marked';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { highlightCode } from './code-highlight';
import { joinRelativePath, parentDirectoryPath } from './pathing';

marked.setOptions({
  gfm: true,
  breaks: true
});

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '_'
});

turndown.use(gfm);

const FENCE_RE = /^(`{3,}|~{3,})(.*)$/;

export function normalizeMarkdownLineEndings(input) {
  return (input || '').replace(/\r\n/g, '\n');
}

export function escapeHtml(input = '') {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function slugifyHeading(text) {
  const slug = (text || '')
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'heading';
}

export function createSlugger() {
  const seen = new Map();
  return {
    slug(text) {
      const base = slugifyHeading(text);
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      return count === 1 ? base : `${base}-${count}`;
    }
  };
}

function forEachMarkdownLine(markdown, onLine) {
  const lines = normalizeMarkdownLineEndings(markdown || '').split('\n');
  let fence = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fenceMatch = FENCE_RE.exec(line.trim());
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      const len = fenceMatch[1].length;
      const info = fenceMatch[2];
      if (!fence) {
        fence = { marker, len };
        onLine({ line, index: i, inFence: true });
        continue;
      }
      if (marker === fence.marker && len >= fence.len && !info) {
        fence = null;
        onLine({ line, index: i, inFence: true });
        continue;
      }
    }

    onLine({ line, index: i, inFence: Boolean(fence) });
  }

  return lines;
}

export function extractHeadings(markdown) {
  const slugger = createSlugger();
  const headings = [];

  forEachMarkdownLine(markdown, ({ line, index, inFence }) => {
    if (inFence) {
      return;
    }

    const match = /^(#{1,6})\s+(\S.*)$/.exec(line);
    if (!match) {
      return;
    }

    const text = match[2].trim().replace(/\s+#+\s*$/, '');
    headings.push({
      level: match[1].length,
      text,
      line: index + 1,
      id: slugger.slug(text)
    });
  });

  return headings;
}

export function countMarkdownStats(markdown) {
  const text = normalizeMarkdownLineEndings(markdown || '');
  const lines = text ? text.split('\n').length : 0;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { lines, chars, words };
}

const TASK_RE = /^(\s*[-*+]\s+)\[([ xX])\]/;

export function toggleTaskAtIndex(markdown, index) {
  if (!Number.isInteger(index) || index < 0) {
    return markdown || '';
  }

  const lines = normalizeMarkdownLineEndings(markdown || '').split('\n');
  let seen = 0;
  let changed = false;

  forEachMarkdownLine(lines.join('\n'), ({ line, index: lineIndex, inFence }) => {
    if (changed || inFence) {
      return;
    }

    const match = TASK_RE.exec(line);
    if (!match) {
      return;
    }

    if (seen === index) {
      const next = match[2] === ' ' ? 'x' : ' ';
      lines[lineIndex] = line.replace(TASK_RE, `$1[${next}]`);
      changed = true;
      return;
    }

    seen += 1;
  });

  return lines.join('\n');
}

export function resolveNoteLink(fromNotePath, href) {
  if (!href) {
    return { kind: 'empty', href: '' };
  }

  if (href.startsWith('#')) {
    return { kind: 'hash', href };
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return { kind: 'external', href };
  }

  const hashIndex = href.indexOf('#');
  const pathPart = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  let decoded = pathPart;
  try {
    decoded = decodeURIComponent(pathPart);
  } catch {
    // keep raw path
  }

  const fromDir = parentDirectoryPath(fromNotePath);
  return {
    kind: 'note',
    path: joinRelativePath(fromDir, decoded),
    hash,
    href
  };
}

let parseOptions = { interactiveTasks: false };
const sluggerRef = { current: createSlugger() };

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const plain = text.replace(/<[^>]+>/g, '');
      const id = sluggerRef.current.slug(plain);
      return `<h${depth} id="${escapeHtml(id)}">${text}</h${depth}>\n`;
    },
    code({ text, lang }) {
      const info = (lang || '').trim();
      const langName = info.split(/\s+/)[0] || '';
      const highlighted = highlightCode(text, langName);
      const className = langName
        ? `hljs language-${escapeHtml(langName.toLowerCase())}`
        : 'hljs';
      return `<pre><code class="${className}">${highlighted}</code></pre>\n`;
    },
    checkbox({ checked }) {
      const disabled = parseOptions.interactiveTasks ? '' : ' disabled=""';
      return `<input ${checked ? 'checked="" ' : ''}type="checkbox"${disabled}>`;
    }
  }
});

export function markdownToSanitizedHtml(markdown, options = {}) {
  parseOptions = {
    interactiveTasks: Boolean(options.interactiveTasks)
  };
  sluggerRef.current = createSlugger();
  const rawHtml = marked.parse(markdown || '');
  return DOMPurify.sanitize(rawHtml);
}

export function htmlToMarkdown(html) {
  return turndown.turndown(html || '');
}
