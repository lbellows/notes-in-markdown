import { nextHeadingLevel } from './markdown-commands';

const BLOCK_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, div';

function currentBlock(root) {
  const selection = window.getSelection();
  let node = selection?.anchorNode;
  if (!node || !root.contains(node)) {
    return null;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    node = node.parentElement;
  }
  const block = node?.closest(BLOCK_SELECTOR);
  return block && block !== root && root.contains(block) ? block : null;
}

function headingLevelOfBlock(block) {
  const match = /^H([1-6])$/.exec(block?.tagName || '');
  return match ? Number(match[1]) : 0;
}

function shiftHeading(root, delta) {
  const block = currentBlock(root);
  if (block?.closest('li, pre')) {
    return;
  }
  const level = nextHeadingLevel(headingLevelOfBlock(block), delta);
  document.execCommand('formatBlock', false, level ? `h${level}` : 'p');
}

function toggleQuote(root) {
  const inQuote = currentBlock(root)?.closest('blockquote');
  document.execCommand('formatBlock', false, inQuote ? 'p' : 'blockquote');
}

export const renderedCommands = {
  bold: () => document.execCommand('bold'),
  italic: () => document.execCommand('italic'),
  strike: () => document.execCommand('strikeThrough'),
  bulletList: () => document.execCommand('insertUnorderedList'),
  orderedList: () => document.execCommand('insertOrderedList'),
  quote: toggleQuote,
  headingUp: (root) => shiftHeading(root, 1),
  headingDown: (root) => shiftHeading(root, -1)
};
