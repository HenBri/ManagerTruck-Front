import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fixture, login, navigate } from './truckv3-fixture';

test('protects private routes and validates login', async ({ page }) => {
  await page.goto('/camiones');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('Introduce un correo electrónico válido.')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('navigation, responsive layout and logout', async ({ page, isMobile }) => {
  const { requests } = await fixture(page);
  await login(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await navigate(page, 'Fletes', isMobile);
  await expect(page.getByRole('heading', { name: 'Fletes', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Abrir menú de usuario/ }).click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  expect(requests.some((path) => /companies|memberships|platform/.test(path))).toBe(false);
});

test('truck creation, new weight/date fields, editing and status', async ({ page, isMobile }) => {
  const { writes } = await fixture(page);
  await login(page);
  await navigate(page, 'Camiones', isMobile);
  await page.getByRole('button', { name: 'Registrar camión' }).click();
  await page.getByLabel('Socio propietario').selectOption({ label: 'Socio Demo · #1' });
  await page.getByLabel('Placa *', { exact: true }).fill('NEW-456');
  await page.getByLabel('Peso vacío del camión').fill('8450.125');
  await page.getByLabel('Vencimiento del seguro').fill('2027-12-31');
  await page.getByRole('button', { name: 'Guardar camión' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes.at(-1)?.body).toMatchObject({
    ownerPartnerId: 1,
    truckEmptyWeightKg: 8450.125,
    insuranceExpiration: '2027-12-31',
  });
  await page.getByRole('button', { name: 'Editar datos' }).click();
  await page.getByLabel('Marca', { exact: true }).fill('Scania');
  await page.getByRole('button', { name: 'Guardar camión' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes.at(-1)?.body).not.toHaveProperty('ownerPartnerId');
  await page.getByRole('button', { name: 'Cambiar estado', exact: true }).click();
  await page.getByRole('dialog').getByRole('combobox').selectOption('MANTENIMIENTO');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Aplicar estado' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes.at(-1)?.body).toEqual({ state: 'MANTENIMIENTO' });
});

test('partner sees read-only resources and no commercial navigation', async ({
  page,
  isMobile,
}) => {
  await fixture(page, 'PARTNER');
  await login(page);
  await navigate(page, 'Camiones', isMobile);
  await expect(page.getByRole('button', { name: 'Registrar camión' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver detalle del camión DEMO-101' }).click();
  await expect(page.getByRole('button', { name: 'Editar datos' })).toHaveCount(0);
  if (isMobile) await page.getByRole('button', { name: 'Alternar menú lateral' }).click();
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Clientes', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Administración', exact: true }),
  ).toHaveCount(0);
});

test('unsaved modal state is protected and conflicts retain input', async ({ page, isMobile }) => {
  await fixture(page);
  await login(page);
  await navigate(page, 'Camiones', isMobile);
  await page.getByRole('button', { name: 'Registrar camión' }).click();
  await page.getByLabel('Placa *', { exact: true }).fill('DUPLICATE');
  page.once('dialog', (d) => d.dismiss());
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Placa *', { exact: true })).toHaveValue('DUPLICATE');
  await page.getByLabel('Socio propietario').selectOption({ index: 1 });
  await page.route('**/api/trucks', (route) =>
    route.fulfill({ status: 409, json: { message: 'Placa duplicada' } }),
  );
  await page.getByRole('button', { name: 'Guardar camión' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Placa duplicada');
  await expect(page.getByLabel('Placa *', { exact: true })).toHaveValue('DUPLICATE');
});

test('profile uses person fields and changing password closes session', async ({ page }) => {
  const { writes } = await fixture(page);
  await login(page);
  await page.getByRole('button', { name: /Abrir menú de usuario/ }).click();
  await page.getByRole('menuitem', { name: 'Mi perfil' }).click();
  await page.getByRole('button', { name: 'Editar perfil' }).click();
  await page.getByLabel('Nombres').fill('Ana actualizada');
  await page.getByLabel('Apellido materno').fill('Mamani');
  await page.getByRole('button', { name: 'Guardar perfil' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes.at(-1)?.body).toMatchObject({
    firstName: 'Ana actualizada',
    maternalLastName: 'Mamani',
  });
  expect(writes.at(-1)?.body).not.toHaveProperty('name');
  await page.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click();
  await page.getByLabel('Contraseña actual', { exact: true }).fill('old-password');
  await page.getByLabel(/^Nueva contraseña/).fill('new-password');
  await page.getByLabel('Confirmar nueva contraseña').fill('new-password');
  await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('public registration sends the new user contract without credentials', async ({ page }) => {
  const { writes } = await fixture(page);
  await page.goto('/registro');
  await page.getByLabel('Nombres').fill('Nueva');
  await page.getByLabel('Apellido paterno').fill('Cuenta');
  await page.getByLabel('Correo').fill('new@example.com');
  await page.getByLabel('Contraseña').fill('Password123!');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('status')).toContainText('Cuenta creada');
  expect(writes[0].path).toBe('/api/users');
  expect(writes[0].body).toMatchObject({
    firstName: 'Nueva',
    lastName: 'Cuenta',
    email: 'new@example.com',
  });
});

test('server pagination and reload preserve the selected page', async ({ page, isMobile }) => {
  await fixture(page);
  await login(page);
  await page.route('**/api/clients?*', (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get('page'));
    return route.fulfill({
      json: {
        clients: [
          {
            clientId: pageNumber + 1,
            clientName: `Cliente página ${pageNumber + 1}`,
            state: 'ACTIVE',
          },
        ],
        page: pageNumber,
        size: 10,
        totalElements: 11,
        totalPages: 2,
      },
    });
  });
  await navigate(page, 'Clientes', isMobile);
  await expect(page.getByText('Cliente página 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.getByText('Cliente página 2', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/page=1/);
  await page.getByRole('button', { name: 'Actualizar', exact: false }).click();
  await expect(page.getByText('Cliente página 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toBeDisabled();
});
