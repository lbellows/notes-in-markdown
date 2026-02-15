import {
  normalizeMarkdownLineEndings,
  markdownToSanitizedHtml,
  htmlToMarkdown
} from '../src/lib/markdown';

describe('markdown helpers', () => {
  it('normalizes CRLF to LF', () => {
    expect(normalizeMarkdownLineEndings('a\r\nb\r\n')).toBe('a\nb\n');
  });

  it('sanitizes rendered html output', () => {
    const html = markdownToSanitizedHtml('Hi<script>alert(1)</script>');
    expect(html).toContain('<p>Hi</p>');
    expect(html).not.toContain('script');
  });

  it('converts editable html back to markdown', () => {
    const md = htmlToMarkdown('<h1>Title</h1><p>Body</p>');
    expect(md).toContain('# Title');
    expect(md).toContain('Body');
  });
});
