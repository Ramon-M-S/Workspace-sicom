import { expect, test } from '@playwright/test';

test.describe('Smoke Test - SICOM', () => {
  test('Dashboard deve carregar com dados do banco', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toContainText('Dashboard');
    await expect(page.getByText('Progresso geral')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'SICOM', exact: true })).toBeVisible();
  });

  test('Página de Etapas deve listar as etapas', async ({ page }) => {
    await page.goto('/etapas');

    await expect(page.getByRole('heading', { name: 'Etapas do TCC' })).toBeVisible();
    await expect(page.getByPlaceholder('Buscar por título...')).toBeVisible();
    await expect(page.getByText('P01 Revisão bibliográfica')).toBeVisible();
  });

  test('Roadmap deve renderizar o Gantt', async ({ page }) => {
    await page.goto('/roadmap');

    await expect(page.getByRole('heading', { name: 'Roadmap do TCC' })).toBeVisible();
    await expect(page.getByText('Planejamento').first()).toBeVisible();
    await expect(page.getByText('Atenção Imediata')).toBeVisible();
  });

  test('Navegação pela sidebar funciona', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByRole('link', { name: 'Etapas' }).click();
    await page.waitForURL('/etapas');
    await expect(page.getByRole('heading', { name: 'Etapas do TCC' })).toBeVisible();
  });
});
