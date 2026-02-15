import {
  normalizeRelativePath,
  parentDirectoryPath,
  replacePathPrefix
} from '../src/lib/pathing';

describe('pathing helpers', () => {
  it('normalizes separators and leading slashes', () => {
    expect(normalizeRelativePath('/foo/bar')).toBe('foo/bar');
    expect(normalizeRelativePath('foo\\bar\\baz')).toBe('foo/bar/baz');
  });

  it('gets parent directory path', () => {
    expect(parentDirectoryPath('alpha/beta/note.md')).toBe('alpha/beta');
    expect(parentDirectoryPath('root.md')).toBe('');
  });

  it('replaces exact path prefix and descendants', () => {
    expect(replacePathPrefix('old/path.md', 'old/path.md', 'new/path.md')).toBe('new/path.md');
    expect(replacePathPrefix('old/folder/a.md', 'old/folder', 'new/folder')).toBe('new/folder/a.md');
    expect(replacePathPrefix('other/file.md', 'old/folder', 'new/folder')).toBe('other/file.md');
  });
});
