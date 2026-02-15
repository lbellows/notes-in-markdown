import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

vi.mock('../../src/editors/SourceEditor', () => ({
  default: ({ value, onChange }) => (
    <textarea
      aria-label="source-editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}));

vi.mock('../../src/editors/RenderedEditor', () => ({
  default: ({ markdown, onChange }) => (
    <textarea
      aria-label="rendered-editor"
      value={markdown}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}));

function makeBridge(overrides = {}) {
  return {
    listTree: vi.fn().mockResolvedValue([
      { kind: 'file', name: 'Welcome.md', path: 'Welcome.md' }
    ]),
    readNote: vi.fn().mockResolvedValue({
      path: 'Welcome.md',
      content: '# Welcome',
      mtimeMs: 100
    }),
    writeNote: vi.fn().mockResolvedValue({ conflict: false, mtimeMs: 101 }),
    createNote: vi.fn(),
    createFolder: vi.fn(),
    renamePath: vi.fn(),
    trashPath: vi.fn(),
    listTrash: vi.fn().mockResolvedValue([]),
    restoreFromTrash: vi.fn(),
    getConfig: vi.fn().mockResolvedValue({
      autosaveEnabled: true,
      autosaveDelayMs: 800,
      defaultMode: 'rendered'
    }),
    setConfig: vi.fn(async (patch) => ({
      autosaveEnabled: patch.autosaveEnabled ?? true,
      autosaveDelayMs: patch.autosaveDelayMs ?? 800,
      defaultMode: 'rendered'
    })),
    getSession: vi.fn().mockResolvedValue({
      openTabs: [],
      activeTab: null,
      expandedPaths: []
    }),
    setSession: vi.fn().mockResolvedValue({}),
    onTreeEvent: vi.fn(() => () => {}),
    ...overrides
  };
}

describe('App integration', () => {
  beforeEach(() => {
    window.mdnote = makeBridge();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial shell and hierarchy after bootstrap', async () => {
    render(<App />);

    expect(await screen.findByText('Hierarchy')).toBeTruthy();
    expect(screen.getByText('Notes Root')).toBeTruthy();
    expect(screen.getByText('Autosave: On')).toBeTruthy();
    expect(screen.getByText('Open a markdown note from the sidebar.')).toBeTruthy();
  });

  it('opens a note into a tab and shows editor controls', async () => {
    render(<App />);

    const noteButton = await screen.findByRole('button', { name: 'Welcome.md' });
    fireEvent.doubleClick(noteButton);

    expect(await screen.findByRole('button', { name: /Welcome\.md/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rendered' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Source' })).toBeTruthy();
  });
});
