import {
  applyHeadingToLine,
  insertLink,
  toggleBulletLine,
  toggleOrderedLine,
  toggleQuoteLine,
  toggleTaskLine,
  toggleWrap
} from '../src/lib/markdown-commands';

describe('markdown commands', () => {
  it('wraps and unwraps a selection', () => {
    expect(toggleWrap('hello', 0, 5, '**')).toEqual({
      text: '**hello**',
      from: 0,
      to: 9
    });
    expect(toggleWrap('**hello**', 0, 9, '**')).toEqual({
      text: 'hello',
      from: 0,
      to: 5
    });
    expect(toggleWrap('**hello**', 2, 7, '**')).toEqual({
      text: 'hello',
      from: 0,
      to: 5
    });
  });

  it('inserts wrap markers at the cursor', () => {
    expect(toggleWrap('hi', 2, 2, '`')).toEqual({
      text: 'hi``',
      from: 3,
      to: 3
    });
  });

  it('applies heading levels and list prefixes', () => {
    expect(applyHeadingToLine('Title', 2)).toBe('## Title');
    expect(applyHeadingToLine('## Title', 0)).toBe('Title');
    expect(toggleBulletLine('item')).toBe('- item');
    expect(toggleBulletLine('- item')).toBe('item');
    expect(toggleOrderedLine('item')).toBe('1. item');
    expect(toggleOrderedLine('1. item')).toBe('item');
    expect(toggleTaskLine('item')).toBe('- [ ] item');
    expect(toggleTaskLine('- [ ] item')).toBe('item');
    expect(toggleQuoteLine('said')).toBe('> said');
    expect(toggleQuoteLine('> said')).toBe('said');
  });

  it('inserts markdown links around text or urls', () => {
    expect(insertLink('docs', 0, 4)).toEqual({
      text: '[docs](url)',
      from: 7,
      to: 10
    });
    expect(insertLink('https://a.test', 0, 14)).toEqual({
      text: '[title](https://a.test)',
      from: 1,
      to: 6
    });
    expect(insertLink('', 0, 0)).toEqual({
      text: '[text](url)',
      from: 1,
      to: 5
    });
  });
});
