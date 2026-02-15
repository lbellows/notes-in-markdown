import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';

test('app boots and renders main chrome', async () => {
  const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), 'mdnoteapp-e2e-'));
  const app = await electron.launch({
    args: ['.'],
    env: {
      ...process.env,
      HOME: tempHome
    }
  });

  try {
    const page = await app.firstWindow();
    await expect(page.getByText('Hierarchy')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Notes Root')).toBeVisible({ timeout: 15000 });
  } finally {
    await app.close();
    await fs.rm(tempHome, { recursive: true, force: true });
  }
});
