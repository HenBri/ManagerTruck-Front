import { expect, test, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.skip(
  true,
  'El backend Truckv3 local no expone endpoints del asistente multiempresa; se conserva este prototipo pendiente de integración.',
);

async function mockAndLogin(page: Page, payloads: { context: unknown[] }[]) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown;
    if (path === '/api/users/me')
      body = {
        userId: 1,
        name: 'Ana',
        lastname: 'Pérez',
        email: 'ana@example.test',
        status: 'ACTIVE',
      };
    else if (path === '/api/users/me/memberships')
      body = { memberships: [{ companyId: 1, membershipStatus: 'ACTIVE', roleNames: ['DRIVER'] }] };
    else if (path === '/api/platform/user-roles') {
      await route.fulfill({ status: 403, json: { message: 'Forbidden' } });
      return;
    } else if (path === '/api/companies/1')
      body = { companyId: 1, name: 'Empresa de prueba', status: 'ACTIVE' };
    else if (path.endsWith('/assistant/capabilities'))
      body = { enabled: true, generation: true, generationStatus: 'AVAILABLE' };
    else if (path.endsWith('/assistant/messages')) {
      payloads.push(route.request().postDataJSON());
      body = {
        text: 'Consulta de prueba autorizada',
        sources: [
          { id: 'manual', title: 'Guía de viajes', version: 1, excerpt: 'Consulta tus viajes.' },
        ],
        consultedAt: '2026-10-21T12:00:00Z',
        generated: true,
      };
    } else body = { [path.split('/').pop()!]: [], totalElements: 0, totalPages: 0 };
    await route.fulfill({ json: body });
  });
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('ana@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

test('floating assistant resets on close and keeps no persistent conversation', async ({
  page,
}) => {
  const payloads: { context: unknown[] }[] = [];
  await mockAndLogin(page, payloads);
  const launcher = page.getByRole('button', { name: 'Abrir asistente de ayuda' });
  await expect(launcher).toBeVisible();
  const bounds = await launcher.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds!.x + bounds!.width).toBeGreaterThan(viewport.width - 50);
  expect(bounds!.y + bounds!.height).toBeGreaterThan(viewport.height - 50);
  await launcher.click();
  const panel = page.getByRole('dialog', { name: 'Asistente ManagerTruck' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Conocimiento', exact: true })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Hablar' })).toHaveCount(0);
  await page.getByLabel('Pregunta al asistente').fill('¿Cómo consulto mis viajes?');
  await panel.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(panel.getByText('Consulta de prueba autorizada')).toBeVisible();
  expect(payloads[0].context).toEqual([]);
  const accessibility = await new AxeBuilder({ page }).include('#assistant-panel').analyze();
  expect(accessibility.violations).toEqual([]);
  await panel.getByRole('button', { name: 'Cerrar y borrar conversación' }).click();
  await launcher.click();
  await expect(panel.getByText('Consulta de prueba autorizada')).toHaveCount(0);
  await page.getByLabel('Pregunta al asistente').fill('Una nueva conversación');
  await panel.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(panel.getByText('Consulta de prueba autorizada')).toBeVisible();
  expect(payloads[1].context).toEqual([]);
  const persisted = await page.evaluate(() =>
    JSON.stringify({ ...localStorage, ...sessionStorage }),
  );
  expect(persisted).not.toContain('Consulta de prueba');
  expect(persisted).not.toContain('Una nueva conversación');
});

test('announces a provider the backend reports as unavailable', async ({ page }) => {
  const payloads: { context: unknown[] }[] = [];
  await mockAndLogin(page, payloads);
  await page.route('**/assistant/capabilities', (route) =>
    route.fulfill({ json: { enabled: true, generation: true, generationStatus: 'UNAVAILABLE' } }),
  );
  await page.getByRole('button', { name: 'Abrir asistente de ayuda' }).click();
  const panel = page.getByRole('dialog', { name: 'Asistente ManagerTruck' });
  await expect(panel.getByText(/Groq está temporalmente no disponible/)).toBeVisible();
});
