export function toggleWrap(text, from, to, marker) {
  const source = text || '';
  const markerLen = marker.length;
  const inner = source.slice(from, to);

  if (
    inner.startsWith(marker) &&
    inner.endsWith(marker) &&
    inner.length >= markerLen * 2
  ) {
    const nextInner = inner.slice(markerLen, inner.length - markerLen);
    return {
      text: source.slice(0, from) + nextInner + source.slice(to),
      from,
      to: from + nextInner.length
    };
  }

  if (
    from >= markerLen &&
    source.slice(from - markerLen, from) === marker &&
    source.slice(to, to + markerLen) === marker
  ) {
    return {
      text: source.slice(0, from - markerLen) + inner + source.slice(to + markerLen),
      from: from - markerLen,
      to: from - markerLen + inner.length
    };
  }

  if (from === to) {
    const insert = marker + marker;
    return {
      text: source.slice(0, from) + insert + source.slice(to),
      from: from + markerLen,
      to: from + markerLen
    };
  }

  const wrapped = marker + inner + marker;
  return {
    text: source.slice(0, from) + wrapped + source.slice(to),
    from,
    to: from + wrapped.length
  };
}

export function applyHeadingToLine(line, level) {
  const content = (line || '')
    .replace(/^\s{0,3}#{1,6}\s+/, '')
    .replace(/\s+#+\s*$/, '');

  if (level <= 0) {
    return content;
  }

  return `${'#'.repeat(Math.min(6, level))} ${content}`;
}

const UL_RE = /^(\s*)([-*+])\s+(?:\[([ xX])\]\s+)?(.*)$/;
const OL_RE = /^(\s*)(\d+)\.\s+(.*)$/;

function indentOf(line) {
  return /^(\s*)/.exec(line || '')[1];
}

export function toggleBulletLine(line) {
  const current = line || '';
  const ul = UL_RE.exec(current);
  if (ul && ul[3] == null) {
    return `${ul[1]}${ul[4]}`;
  }
  if (ul) {
    return `${ul[1]}- ${ul[4]}`;
  }

  const ol = OL_RE.exec(current);
  if (ol) {
    return `${ol[1]}- ${ol[3]}`;
  }

  const indent = indentOf(current);
  return `${indent}- ${current.slice(indent.length)}`;
}

export function toggleOrderedLine(line) {
  const current = line || '';
  const ol = OL_RE.exec(current);
  if (ol) {
    return `${ol[1]}${ol[3]}`;
  }

  const ul = UL_RE.exec(current);
  if (ul) {
    return `${ul[1]}1. ${ul[4]}`;
  }

  const indent = indentOf(current);
  return `${indent}1. ${current.slice(indent.length)}`;
}

export function toggleTaskLine(line) {
  const current = line || '';
  const ul = UL_RE.exec(current);
  if (ul && ul[3] != null) {
    return `${ul[1]}${ul[4]}`;
  }
  if (ul) {
    return `${ul[1]}- [ ] ${ul[4]}`;
  }

  const ol = OL_RE.exec(current);
  if (ol) {
    return `${ol[1]}- [ ] ${ol[3]}`;
  }

  const indent = indentOf(current);
  return `${indent}- [ ] ${current.slice(indent.length)}`;
}

export function toggleQuoteLine(line) {
  const current = line || '';
  if (/^>\s?/.test(current)) {
    return current.replace(/^>\s?/, '');
  }
  return `> ${current}`;
}

export function insertLink(text, from, to) {
  const source = text || '';
  const selected = source.slice(from, to);

  if (!selected) {
    const insert = '[text](url)';
    return {
      text: source.slice(0, from) + insert + source.slice(to),
      from: from + 1,
      to: from + 5
    };
  }

  if (/^https?:\/\//i.test(selected)) {
    const insert = `[title](${selected})`;
    return {
      text: source.slice(0, from) + insert + source.slice(to),
      from: from + 1,
      to: from + 6
    };
  }

  const insert = `[${selected}](url)`;
  const urlFrom = from + selected.length + 3;
  return {
    text: source.slice(0, from) + insert + source.slice(to),
    from: urlFrom,
    to: urlFrom + 3
  };
}
