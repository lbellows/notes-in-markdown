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
});
