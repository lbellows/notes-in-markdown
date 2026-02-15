import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';

test('app boots and renders main chrome', async () => {
  const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), 'mdnoteapp-e2e-'));
  const launchArgs = ['.'];

  if (process.platform === 'linux' && process.env.CI) {
    launchArgs.push('--no-sandbox', '--disable-dev-shm-usage');
  }

  const app = await electron.launch({
    args: launchArgs,
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: '1',
      ELECTRON_ENABLE_STACK_DUMPING: '1',
      HOME: tempHome
    }
  });

  try {
    const page = await app.firstWindow();
    await expect(page.locator('.sidebar-footer')).toContainText('/', { timeout: 15000 });
    await expect(page.getByText('Auto: ON')).toBeVisible({ timeout: 15000 });
  } finally {
    await app.close();
    await fs.rm(tempHome, { recursive: true, force: true });
  }
});
