import { marked } from 'marked';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';

marked.setOptions({
  gfm: true,
  breaks: true
});

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '_'
});

export function markdownToSanitizedHtml(markdown) {
  const rawHtml = marked.parse(markdown || '');
  return DOMPurify.sanitize(rawHtml);
}

export function htmlToMarkdown(html) {
  return turndown.turndown(html || '');
}

export function normalizeMarkdownLineEndings(input) {
  return (input || '').replace(/\r\n/g, '\n');
}
