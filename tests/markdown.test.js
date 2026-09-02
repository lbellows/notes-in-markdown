import {
  normalizeMarkdownLineEndings,
  markdownToSanitizedHtml,
  htmlToMarkdown,
  extractHeadings,
  toggleTaskAtIndex,
  countMarkdownStats,
  resolveNoteLink,
  slugifyHeading
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

  it('renders GFM tables to html', () => {
    const html = markdownToSanitizedHtml(
      '| Layer | Updated by |\n| --- | --- |\n| asdf | yay -Syu |'
    );
    expect(html).toContain('<table>');
    expect(html).toContain('<th>Layer</th>');
    expect(html).toContain('<td>asdf</td>');
  });

  it('preserves tables through the html-to-markdown round trip', () => {
    const source = '| Layer | Updated by |\n| --- | --- |\n| asdf | yay -Syu |';
    const roundTripped = htmlToMarkdown(markdownToSanitizedHtml(source));
    expect(roundTripped).toContain('| Layer | Updated by |');
    expect(roundTripped).toContain('| --- | --- |');
    expect(roundTripped).toContain('| asdf | yay -Syu |');
  });

  it('adds stable heading ids and skips fenced code headings', () => {
    const source = '# Hello World\n\n```js\n# not a heading\n```\n\n## Hello World\n';
    const headings = extractHeadings(source);
    expect(headings).toEqual([
      { level: 1, text: 'Hello World', line: 1, id: 'hello-world' },
      { level: 2, text: 'Hello World', line: 7, id: 'hello-world-2' }
    ]);

    const html = markdownToSanitizedHtml(source);
    expect(html).toContain('id="hello-world"');
    expect(html).toContain('id="hello-world-2"');
    expect(html).toContain('language-js');
    expect(html).toContain('hljs');
  });

  it('toggles task list items outside fenced code', () => {
    const source = '- [ ] one\n\n```\n- [ ] ignored\n```\n\n- [x] two\n';
    expect(toggleTaskAtIndex(source, 0)).toContain('- [x] one');
    expect(toggleTaskAtIndex(source, 1)).toContain('- [ ] two');
    expect(toggleTaskAtIndex(source, 1)).toContain('- [ ] ignored');
  });

  it('counts words and resolves relative note links', () => {
    expect(countMarkdownStats('hello brave world')).toEqual({
      lines: 1,
      chars: 17,
      words: 3
    });
    expect(slugifyHeading('Hello, World!')).toBe('hello-world');
    expect(resolveNoteLink('projects/alpha.md', '../inbox/todo.md')).toEqual({
      kind: 'note',
      path: 'inbox/todo.md',
      hash: '',
      href: '../inbox/todo.md'
    });
    expect(resolveNoteLink('a.md', 'https://example.com')).toEqual({
      kind: 'external',
      href: 'https://example.com'
    });
    expect(resolveNoteLink('a.md', '#heading')).toEqual({
      kind: 'hash',
      href: '#heading'
    });
  });
});
