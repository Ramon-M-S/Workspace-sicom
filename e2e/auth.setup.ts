import { mkdir } from 'node:fs/promises';
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('autenticar', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('inicial@sicom.local');
  await page.getByLabel('Senha').fill('123456');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);
  await mkdir('playwright/.auth', { recursive: true });
  await page.context().storageState({ path: authFile });
});
