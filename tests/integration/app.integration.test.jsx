import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
      autosaveDelayMs: 1400,
      defaultMode: 'rendered',
      theme: 'dark'
    }),
    setConfig: vi.fn(async (patch) => ({
      autosaveEnabled: patch.autosaveEnabled ?? true,
      autosaveDelayMs: patch.autosaveDelayMs ?? 1400,
      defaultMode: 'rendered',
      theme: patch.theme ?? 'dark'
    })),
    getSession: vi.fn().mockResolvedValue({
      openTabs: [],
      activeTab: null,
      expandedPaths: []
    }),
    setSession: vi.fn().mockResolvedValue({}),
    openDevTools: vi.fn().mockResolvedValue({ opened: true, alreadyOpen: false }),
    onTreeEvent: vi.fn(() => () => {}),
    ...overrides
  };
}

describe('App integration', () => {
  let bridge;

  beforeEach(() => {
    bridge = makeBridge({
      createNote: vi.fn().mockResolvedValue({ path: 'Untitled.md' }),
      readNote: vi
        .fn()
        .mockResolvedValueOnce({
          path: 'Welcome.md',
          content: '# Welcome',
          mtimeMs: 100
        })
        .mockResolvedValueOnce({
          path: 'Untitled.md',
          content: '# Untitled',
          mtimeMs: 200
        })
    });
    window.mdnote = bridge;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial shell and hierarchy after bootstrap', async () => {
    render(<App />);

    expect(await screen.findAllByText('/')).toHaveLength(2);
    expect(screen.getByText('Auto: ON')).toBeTruthy();
    expect(screen.getByText('Open a markdown note from the sidebar.')).toBeTruthy();
  });

  it('opens a note into a tab and shows editor controls', async () => {
    render(<App />);

    const noteButton = await screen.findByRole('button', { name: /Welcome\.md/ });
    fireEvent.doubleClick(noteButton);

    expect(await screen.findByRole('button', { name: /Welcome\.md/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Markdown' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Source' })).toBeTruthy();
  });

  it('creates a note using the input modal workflow', async () => {
    render(<App />);

    const openCreate = await screen.findByRole('button', { name: 'New note' });
    fireEvent.click(openCreate);

    const nameInput = await screen.findByLabelText('Note name');
    fireEvent.change(nameInput, { target: { value: 'Meeting Notes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(bridge.createNote).toHaveBeenCalledWith({
        parentDir: '',
        title: 'Meeting Notes'
      });
    });
  });
});
