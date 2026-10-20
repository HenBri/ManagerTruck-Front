import { expect, test, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function mockApi(page: Page, role = 'SECRETARY') {
  let truck = {
    truckId: 7,
    companyId: 1,
    ownerPartnerId: 3,
    truckBoard: 'TEST-123',
    truckBrand: 'Volvo',
    truckModel: 'FH',
    truckYear: 2024,
    truckCapacity: 25,
    truckState: 'ACTIVE',
    truckChassis: null,
    truckColor: 'Blanco',
  };
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    expect(request.headers()['authorization']).toContain('Basic ');
    let body: unknown = {};
    if (path === '/api/users/me')
      body = {
        userId: 1,
        name: 'Ana',
        lastname: 'Pérez',
        email: 'ana@example.com',
        ci: '',
        phone: '',
        status: 'ACTIVE',
      };
    else if (/^\/api\/companies\/\d+$/.test(path))
      body = {
        companyId: Number(path.split('/').pop()),
        name: `Empresa #${path.split('/').pop()}`,
        status: 'ACTIVE',
      };
    else if (path === '/api/users/me/memberships')
      body = {
        memberships: [
          { companyId: 1, membershipStatus: 'ACTIVE', roleNames: [role] },
          { companyId: 2, membershipStatus: 'ACTIVE', roleNames: ['PARTNER'] },
        ],
      };
    else if (path === '/api/platform/user-roles') {
      await route.fulfill({ status: 403, json: { message: 'FORBIDDEN' } });
      return;
    } else if (/\/trucks\/7\/status$/.test(path)) {
      expect(request.postDataJSON()).toHaveProperty('status');
      truck = { ...truck, truckState: request.postDataJSON().status };
      body = truck;
    } else if (/\/trucks\/7$/.test(path)) {
      if (request.method() === 'PUT') {
        expect(request.postDataJSON()).not.toHaveProperty('ownerPartnerId');
        truck = { ...truck, ...request.postDataJSON() };
      }
      body = truck;
    } else if (path.endsWith('/trucks') && request.method() === 'POST') {
      expect(request.postDataJSON()).toHaveProperty('ownerPartnerId', 3);
      truck = { ...truck, ...request.postDataJSON() };
      body = truck;
    } else {
      const collection = path.split('/').pop()!;
      const records =
        collection === 'trucks' && path.includes('/1/')
          ? [truck]
          : collection === 'partners'
            ? [
                {
                  partnerId: 3,
                  partnerName: 'Socio de prueba',
                  partnerState: 'ACTIVE',
                  partnerType: 'PERSON',
                },
              ]
            : collection === 'containers'
              ? [{ containerId: 1, containerCode: 'CONT-001', containerState: 'AVAILABLE' }]
              : [];
      body = {
        [collection === 'auxiliary-providers' ? 'auxiliaryProviders' : collection]: records,
        page: Number(url.searchParams.get('page') || 0),
        size: 10,
        totalElements: records.length,
        totalPages: records.length ? 1 : 0,
      };
    }
    await route.fulfill({ json: body });
  });
}
async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('ana@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
  await expect(page).toHaveURL(/\/inicio$/);
}
async function navigate(page: Page, name: string, mobile: boolean) {
  if (mobile) await page.getByRole('button', { name: 'Alternar menú lateral' }).click();
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name, exact: true })
    .click();
}

for (const catalog of [
  { title: 'Socios', singular: 'socio', endpoint: 'partners', name: 'Nombre *', key: 'partnerId' },
  {
    title: 'Conductores',
    singular: 'conductor',
    endpoint: 'drivers',
    name: 'Nombre completo *',
    key: 'driverId',
  },
]) {
  for (const role of ['SECRETARY', 'SUPER_ADMIN']) {
    test(`${catalog.title}: membership lookup and optional links (${role})`, async ({
      page,
      isMobile,
    }) => {
      await mockApi(page);
      if (role === 'SUPER_ADMIN') {
        await page.route('**/api/platform/user-roles', (route) =>
          route.fulfill({
            json: { platformRoles: [{ userId: 1, roleName: 'SUPER_ADMIN' }] },
          }),
        );
      }
      const invalidRequests: string[] = [];
      page.on('request', (request) => {
        if (/\/api\/companies\/\d+\/(users|memberships\/\d+)/.test(request.url()))
          invalidRequests.push(request.url());
      });
      await page.route('**/api/companies/*/memberships?*', (route) =>
        route.fulfill({
          json: {
            memberships: [
              {
                userId: 8,
                name: 'Cuenta activa',
                email: 'active@example.com',
                membershipStatus: 'ACTIVE',
              },
              { userId: 9, name: 'Cuenta inactiva', membershipStatus: 'INACTIVE' },
            ],
            totalPages: 1,
            totalElements: 2,
          },
        }),
      );
      const saved: Record<string, unknown>[] = [];
      await page.route(`**/api/companies/1/${catalog.endpoint}`, async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        const body = route.request().postDataJSON();
        saved.push(body);
        await route.fulfill({ status: 201, json: { ...body, [catalog.key]: 20 } });
      });
      await login(page);
      await navigate(page, catalog.title, isMobile);
      for (const linked of [true, false]) {
        await page.getByRole('button', { name: `Registrar ${catalog.singular}` }).click();
        const dialog = page.getByRole('dialog');
        const account = dialog.getByLabel('Cuenta vinculada (opcional)');
        await expect(account.getByRole('option', { name: /Cuenta activa/ })).toHaveCount(1);
        await expect(account.getByRole('option', { name: /Cuenta inactiva/ })).toBeDisabled();
        await expect(dialog.getByRole('alert')).toHaveCount(0);
        await dialog.getByLabel(catalog.name, { exact: true }).fill('Registro de prueba');
        if (catalog.endpoint === 'partners')
          await dialog.getByLabel('Tipo de socio *', { exact: true }).selectOption('PERSON');
        else {
          await dialog.getByLabel('Licencia *', { exact: true }).fill('LIC-123');
          await expect(
            dialog
              .getByLabel('Socio persona (opcional)')
              .getByRole('option', { name: /Socio de prueba/ }),
          ).toHaveCount(1);
        }
        if (linked)
          await account.selectOption({ label: 'Cuenta activa · active@example.com · #8' });
        await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
        await expect(dialog).toHaveCount(0);
        expect(saved.at(-1)?.['userId']).toBe(linked ? 8 : null);
      }
      if (role === 'SUPER_ADMIN') {
        await page.route('**/api/companies/2/memberships?*', (route) =>
          route.fulfill({
            json: {
              memberships: [{ userId: 10, name: 'Otra empresa', membershipStatus: 'ACTIVE' }],
              totalPages: 1,
              totalElements: 1,
            },
          }),
        );
        await page.getByLabel('Empresa activa').selectOption('2');
        await page.getByRole('button', { name: `Registrar ${catalog.singular}` }).click();
        const account = page.getByRole('dialog').getByLabel('Cuenta vinculada (opcional)');
        await expect(account.getByRole('option', { name: /Otra empresa/ })).toHaveCount(1);
        await expect(account.getByRole('option', { name: /Cuenta activa/ })).toHaveCount(0);
      }
      expect(invalidRequests).toEqual([]);
    });
  }

  test(`${catalog.title}: lookup failure retries without losing data and shows empty results`, async ({
    page,
    isMobile,
  }) => {
    await mockApi(page);
    let attempts = 0;
    await page.route('**/api/companies/1/memberships?*', (route) => {
      attempts++;
      return attempts === 1
        ? route.fulfill({ status: 500, json: { message: 'Error de prueba' } })
        : route.fulfill({ json: { memberships: [], totalPages: 0, totalElements: 0 } });
    });
    await login(page);
    await navigate(page, catalog.title, isMobile);
    await page.getByRole('button', { name: `Registrar ${catalog.singular}` }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('alert')).toContainText(
      'No se pudieron cargar las opciones de Cuenta vinculada',
    );
    await dialog.getByLabel(catalog.name, { exact: true }).fill('Datos conservados');
    await dialog.getByRole('button', { name: 'Reintentar opciones' }).click();
    await expect(dialog.getByRole('alert')).toHaveCount(0);
    await expect(
      dialog.getByText('No hay registros en esta página.', { exact: false }),
    ).toBeVisible();
    await expect(dialog.getByLabel(catalog.name, { exact: true })).toHaveValue('Datos conservados');
    expect(attempts).toBe(2);
  });
}

test('protects private routes and validates login without API requests', async ({ page }) => {
  await page.goto('/camiones');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('Introduce un correo electrónico válido.')).toBeVisible();
  await expect(page.getByText('Introduce tu contraseña.')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('dashboard, navigation, user menu and logout', async ({ page, isMobile }, testInfo) => {
  await mockApi(page);
  await login(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
  if (isMobile) {
    await page.getByRole('button', { name: 'Alternar menú lateral' }).click();
    await expect(page.getByRole('dialog', { name: 'Menú principal' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Alternar menú lateral' })).toBeFocused();
  }
  await page.getByRole('button', { name: /Abrir menú de usuario/ }).click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
});

test('truck creation, detail, editing and status use real contract shapes', async ({
  page,
  isMobile,
}) => {
  await mockApi(page);
  await login(page);
  await navigate(page, 'Camiones', isMobile);
  await page.getByRole('button', { name: 'Registrar camión' }).click();
  await expect(page.getByRole('dialog', { name: 'Registrar camión' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel('Socio propietario').selectOption({ label: 'Socio de prueba · #3' });
  await page.getByLabel('Placa').fill('NEW-456');
  await page.getByRole('button', { name: 'Guardar camión' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Camión guardado correctamente.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Editar datos' }).click();
  await page.getByLabel('Marca', { exact: true }).fill('Scania');
  await page.getByRole('button', { name: 'Guardar camión' }).click();
  await expect(page.getByText('Scania /')).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar estado', exact: true }).click();
  await page.getByRole('dialog').getByRole('combobox').selectOption('MAINTENANCE');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Aplicar estado' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Estado actualizado.' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar detalle' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar detalle' })).toHaveCount(0);
  await expect(
    page
      .getByRole('region', {
        name: 'Camiones, desplaza horizontalmente para ver todas las columnas',
      })
      .getByText('Mantenimiento', { exact: true }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('tenant switch clears records and removes write actions', async ({ page, isMobile }) => {
  await mockApi(page);
  await login(page);
  await navigate(page, 'Camiones', isMobile);
  await expect(page.getByText('TEST-123')).toBeVisible();
  await page.getByLabel('Empresa activa').selectOption('2');
  await expect(page.getByText('TEST-123')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Registrar camión' })).toHaveCount(0);
  await expect(page.getByText('Aún no hay camiones en esta página')).toBeVisible();
});

test('partner cannot access commercial data or mutate trucks', async ({ page, isMobile }) => {
  await mockApi(page, 'PARTNER');
  await login(page);
  await navigate(page, 'Camiones', isMobile);
  await expect(page.getByRole('button', { name: 'Registrar camión' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver detalle del camión TEST-123' }).click();
  await expect(page.getByRole('button', { name: 'Editar datos' })).toHaveCount(0);
});

test('catalog navigation loads the selected module and supports empty states', async ({
  page,
  isMobile,
}) => {
  await mockApi(page);
  await login(page);
  await navigate(page, 'Clientes', isMobile);
  await expect(page.getByRole('heading', { name: 'Clientes', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'No hay registros en esta página' }),
  ).toBeVisible();
  await navigate(page, 'Viajes', isMobile);
  await page.getByRole('button', { name: 'Registrar viaje' }).click();
  await page
    .getByLabel('Contenedor *', { exact: true })
    .selectOption({ label: 'CONT-001 · AVAILABLE · #1' });
  await page.getByLabel('Origen', { exact: false }).fill('Origen de prueba');
  await page.getByLabel('Destino', { exact: false }).fill('Destino de prueba');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByLabel('Modalidad *', { exact: true }).selectOption('AUXILIARY');
  await expect(page.getByLabel('Placa del camión externo')).toBeVisible();
  await expect(page.getByLabel('Asignación', { exact: false })).toHaveCount(0);
});

test('modal protects unsaved edits, restores focus and resets discarded data', async ({
  page,
  isMobile,
}) => {
  await mockApi(page);
  await login(page);
  await navigate(page, 'Camiones', isMobile);
  await page.getByRole('button', { name: 'Registrar camión' }).click();
  await page.getByLabel('Placa').fill('UNSAVED');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.goBack();
  await expect(page).toHaveURL(/\/camiones$/);
  await expect(page.getByRole('dialog', { name: 'Registrar camión' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Placa')).toHaveValue('UNSAVED');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Cerrar formulario' }).click();
  await expect(page.getByRole('dialog', { name: 'Registrar camión' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Registrar camión' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Registrar camión' })).toBeFocused();
  await page.getByRole('button', { name: 'Registrar camión' }).click();
  await expect(page.getByLabel('Placa')).toHaveValue('');
  await page.keyboard.press('Escape');
  await navigate(page, 'Inicio', isMobile);
  await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
});

test('save errors stay in the modal and pending requests prevent closing', async ({
  page,
  isMobile,
}) => {
  await mockApi(page);
  await login(page);
  await navigate(page, 'Camiones', isMobile);
  await page.getByRole('button', { name: 'Registrar camión' }).click();
  await page.getByLabel('Socio propietario').selectOption({ label: 'Socio de prueba · #3' });
  await page.getByLabel('Placa').fill('ERROR-123');
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/companies/1/trucks', async (route) => {
    await pending;
    await route.fulfill({ status: 500, json: { message: 'Error de prueba' } });
  });
  await page.getByRole('button', { name: 'Guardar camión' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar formulario' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Registrar camión' })).toBeVisible();
  release();
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('Placa')).toHaveValue('ERROR-123');
  await expect(page.getByRole('button', { name: 'Guardar camión' })).toBeEnabled();
});

test('profile and password forms open in separate dialogs', async ({ page }) => {
  await mockApi(page);
  await login(page);
  await page.getByRole('button', { name: /Abrir menú de usuario/ }).click();
  await page.getByRole('menuitem', { name: 'Mi perfil' }).click();
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Editar perfil' })).toBeVisible();
  await page.getByLabel('Nombres').fill('Ana actualizada');
  await page.route('**/api/users/1', async (route) => {
    await route.fulfill({
      json: { userId: 1, email: 'ana@example.com', ...route.request().postDataJSON() },
    });
  });
  await page.getByRole('button', { name: 'Guardar perfil' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Perfil actualizado.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).click();
  await expect(page.getByLabel('Nombres')).toHaveValue('Ana actualizada');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Cambiar contraseña' });
  await expect(dialog).toBeVisible();
  await page.getByLabel('Contraseña actual', { exact: true }).fill('old-password');
  await page.getByLabel(/^Nueva contraseña/).fill('new-password');
  await page.getByLabel('Confirmar nueva contraseña', { exact: true }).fill('different-password');
  await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
  await expect(dialog.getByRole('alert')).toContainText('La confirmación debe coincidir');
  await page.getByLabel('Confirmar nueva contraseña', { exact: true }).fill('new-password');
  await page.route('**/api/users/1/password', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
    await route.fulfill({ json: {} });
  });
  await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
