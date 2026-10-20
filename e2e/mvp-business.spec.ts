import { expect, Page, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Row = Record<string, unknown>;
async function fixture(page: Page, superAdmin = false) {
  const ids: Record<string, string> = {
    partners: 'partnerId',
    trucks: 'truckId',
    drivers: 'driverId',
    clients: 'clientId',
    contracts: 'contractId',
    charges: 'chargeId',
    containers: 'containerId',
    assignments: 'assignmentId',
    journeys: 'journeyId',
    memberships: 'userId',
    'auxiliary-providers': 'providerId',
  };
  const states: Record<string, [string, unknown]> = {
    clients: ['clientState', true],
    contracts: ['contractState', 'DRAFT'],
    charges: ['chargeState', 'PENDING'],
    containers: ['containerState', 'AVAILABLE'],
    journeys: ['journeyState', 'PLANNED'],
  };
  const data: Record<string, Row[]> = {
    partners: [{ partnerId: 1, partnerName: 'Socio Demo', partnerState: 'ACTIVE' }],
    trucks: [{ truckId: 1, truckBoard: 'DEMO-101', truckBrand: 'Volvo', truckState: 'ACTIVE' }],
    drivers: [
      {
        driverId: 1,
        driverName: 'Conductor Demo',
        driverLicense: 'LIC-101',
        driverState: 'ACTIVE',
      },
    ],
    clients: [],
    contracts: [],
    charges: [],
    containers: [],
    assignments: [],
    journeys: [],
    'auxiliary-providers': [],
    memberships: [
      {
        userId: 2,
        companyId: 1,
        name: 'Equipo',
        lastname: 'Demo',
        email: 'equipo@example.com',
        membershipStatus: 'ACTIVE',
        roleNames: ['DRIVER'],
      },
    ],
  };
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    let body: unknown;
    if (path === '/api/users/me')
      body = {
        userId: 1,
        name: 'Ana',
        lastname: 'Pérez',
        email: 'ana@example.com',
        status: 'ACTIVE',
      };
    else if (path === '/api/users/me/memberships')
      body = {
        memberships: superAdmin
          ? []
          : [{ companyId: 1, membershipStatus: 'ACTIVE', roleNames: ['SECRETARY'] }],
      };
    else if (path === '/api/platform/user-roles') {
      await route.fulfill({
        status: superAdmin ? 200 : 403,
        json: superAdmin
          ? { platformRoles: [{ userId: 1, roleName: 'SUPER_ADMIN' }] }
          : { message: 'FORBIDDEN' },
      });
      return;
    } else if (path === '/api/companies')
      body = {
        companies: [{ companyId: 1, name: 'Transportes Demo', nit: '123', status: 'ACTIVE' }],
        totalPages: 1,
        totalElements: 1,
      };
    else if (path === '/api/companies/1')
      body = { companyId: 1, name: 'Transportes Demo', status: 'ACTIVE' };
    else {
      const match = path.match(
        /^\/api\/companies\/1\/([^/]+)(?:\/(\d+))?(?:\/(status|roles|end))?$/,
      );
      if (!match || !data[match[1]]) {
        await route.fulfill({ status: 404, json: { message: `Unmocked: ${path}` } });
        return;
      }
      const [, collection, id, action] = match;
      const rows = data[collection];
      const key = ids[collection];
      if (request.method() === 'POST' && !id) {
        const payload = request.postDataJSON();
        expect(payload).not.toHaveProperty('companyId');
        const row: Row = { ...payload, [key]: rows.length + 1, companyId: 1 };
        if (states[collection]) row[states[collection][0]] = states[collection][1];
        if (collection === 'auxiliary-providers') row['providerStatus'] = 'ACTIVE';
        if (collection === 'memberships')
          Object.assign(row, {
            email: payload.userEmail,
            name: 'Nuevo',
            lastname: 'Miembro',
            membershipStatus: 'ACTIVE',
            roleNames: [],
          });
        rows.push(row);
        body = row;
      } else if (id) {
        const row = rows.find((item) => item[key] === Number(id));
        if (!row) {
          await route.fulfill({ status: 404, json: { message: 'No encontrado' } });
          return;
        }
        if (action === 'status') {
          const payload = request.postDataJSON();
          row[collection === 'memberships' ? 'membershipStatus' : states[collection][0]] =
            payload.status ?? payload.clientState;
        }
        if (action === 'roles') {
          expect(request.postDataJSON()).toEqual({ roleNames: ['PARTNER'] });
          row['roleNames'] = [...(row['roleNames'] as string[]), 'PARTNER'];
        }
        if (action === 'end') row['assignedUntil'] = request.postDataJSON().assignedUntil;
        body = row;
      } else
        body = {
          [collection === 'auxiliary-providers' ? 'auxiliaryProviders' : collection]: rows,
          page: 0,
          size: 10,
          totalPages: rows.length ? 1 : 0,
          totalElements: rows.length,
        };
    }
    await route.fulfill({ json: body });
  });
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('ana@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
  await expect(page).toHaveURL(/\/inicio$/);
  return data;
}
async function navigate(page: Page, name: string, mobile: boolean) {
  if (mobile) await page.getByRole('button', { name: 'Alternar menú lateral' }).click();
  await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
}
async function save(page: Page) {
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Operación completada correctamente.' }),
  ).toBeVisible();
}

test('commercial chain and assigned journey from creation to completion', async ({
  page,
  isMobile,
}) => {
  const data = await fixture(page);
  await navigate(page, 'Clientes', isMobile);
  await page.getByRole('button', { name: 'Registrar cliente' }).click();
  await page.getByLabel('Nombre', { exact: false }).fill('Cliente Demo');
  await save(page);
  await navigate(page, 'Contratos', isMobile);
  await page.getByRole('button', { name: 'Registrar contrato' }).click();
  await page.getByLabel('Cliente *', { exact: true }).selectOption({ label: 'Cliente Demo · #1' });
  await page.getByLabel('Importe acordado').fill('2500.50');
  await page.getByLabel('Fecha', { exact: false }).fill('2026-10-19');
  await page.getByLabel('Descripción', { exact: true }).fill('Contrato Demo');
  await save(page);
  await navigate(page, 'Cargas', isMobile);
  await page.getByRole('button', { name: 'Registrar carga' }).click();
  await page
    .getByLabel('Contrato *', { exact: true })
    .selectOption({ label: 'Contrato Demo · 2026-10-19 · DRAFT · #1' });
  await page.getByLabel('Descripción', { exact: true }).fill('Carga Demo');
  await save(page);
  await navigate(page, 'Contenedores', isMobile);
  await page.getByRole('button', { name: 'Registrar contenedor' }).click();
  await page
    .getByLabel('Carga *', { exact: true })
    .selectOption({ label: 'Carga Demo · PENDING · #1' });
  await page.getByLabel('Código').fill('CONT-DEMO');
  await save(page);
  await navigate(page, 'Asignaciones', isMobile);
  await page.getByRole('button', { name: 'Registrar asignación' }).click();
  await page
    .getByLabel('Camión *', { exact: true })
    .selectOption({ label: 'DEMO-101 · Volvo · #1' });
  await page
    .getByLabel('Conductor *', { exact: true })
    .selectOption({ label: 'Conductor Demo · LIC-101 · #1' });
  await page.getByLabel('Inicio', { exact: false }).fill('2026-10-19T08:00');
  await save(page);
  await navigate(page, 'Viajes', isMobile);
  await page.getByRole('button', { name: 'Registrar viaje' }).click();
  await page
    .getByLabel('Contenedor *', { exact: true })
    .selectOption({ label: 'CONT-DEMO · AVAILABLE · #1' });
  await page.getByLabel('Origen', { exact: false }).fill('La Paz');
  await page.getByLabel('Destino', { exact: false }).fill('Cochabamba');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page
    .getByLabel('Asignación *', { exact: true })
    .selectOption({ label: '1 · 1 · 2026-10-19T08:00 · #1' });
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Revisa el viaje antes de registrarlo' }),
  ).toBeVisible();
  await save(page);
  expect(data['journeys'][0]).toMatchObject({
    containerId: 1,
    assignmentId: 1,
    executionType: 'PARTNER',
    journeyOrigin: 'La Paz',
  });
  expect(data['journeys'][0]).not.toHaveProperty('auxiliaryProviderId');
  await page.getByRole('button', { name: 'Cambiar estado', exact: true }).click();
  await page.getByRole('dialog').getByRole('combobox').selectOption('IN_PROGRESS');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Aplicar estado' }).click();
  await expect(page.getByRole('heading', { name: 'Detalle de viaje #1' })).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar estado', exact: true }).click();
  await page.getByRole('dialog').getByRole('combobox').selectOption('COMPLETED');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Aplicar estado' }).click();
  await expect(page.getByRole('button', { name: 'Aplicar estado' })).toHaveCount(0);
  expect(data['journeys'][0]['journeyState']).toBe('COMPLETED');
  await navigate(page, 'Auxilio externo', isMobile);
  await page.getByRole('button', { name: 'Registrar proveedor' }).click();
  await page.getByLabel('Tipo *', { exact: true }).selectOption('BUSINESS');
  await page.getByLabel('Nombre *', { exact: true }).fill('Proveedor Demo');
  await save(page);
  await navigate(page, 'Viajes', isMobile);
  await page.getByRole('button', { name: 'Registrar viaje' }).click();
  await page
    .getByLabel('Contenedor *', { exact: true })
    .selectOption({ label: 'CONT-DEMO · AVAILABLE · #1' });
  await page.getByLabel('Origen', { exact: false }).fill('Santa Cruz');
  await page.getByLabel('Destino', { exact: false }).fill('Oruro');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByLabel('Modalidad *', { exact: true }).selectOption('AUXILIARY');
  await page
    .getByLabel('Proveedor externo *', { exact: true })
    .selectOption({ label: 'Proveedor Demo · BUSINESS · #1' });
  await page.getByLabel('Placa del camión externo').fill('EXT-101');
  await page.getByLabel('Nombre del conductor externo').fill('Conductor externo');
  await page.getByLabel('Licencia externa').fill('EXT-LIC');
  await page.getByLabel('Motivo del auxilio').selectOption('TRUCK_SHORTAGE');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await save(page);
  expect(data['journeys'][1]).toMatchObject({
    executionType: 'AUXILIARY',
    auxiliaryProviderId: 1,
    auxiliaryTruckPlate: 'EXT-101',
  });
  expect(data['journeys'][1]).not.toHaveProperty('assignmentId');
  await navigate(page, 'Asignaciones', isMobile);
  await page.getByRole('button', { name: 'Ver detalle de asignación 1' }).click();
  await page.getByRole('button', { name: 'Finalizar asignación', exact: true }).click();
  const endDialog = page.getByRole('dialog', { name: 'Finalizar asignación' });
  await endDialog.getByLabel('Fecha de finalización', { exact: false }).fill('2026-10-18T08:00');
  await endDialog.getByRole('button', { name: 'Finalizar asignación' }).click();
  await expect(endDialog.getByRole('alert')).toContainText('El fin debe ser posterior al inicio.');
  await endDialog.getByLabel('Fecha de finalización', { exact: false }).fill('2026-10-20T08:00');
  page.once('dialog', (dialog) => dialog.accept());
  await endDialog.getByRole('button', { name: 'Finalizar asignación' }).click();
  await expect(endDialog).toHaveCount(0);
  expect(data['assignments'][0]['assignedUntil']).toBe('2026-10-20T08:00');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('dashboard reflows across presentation viewport widths', async ({ page }) => {
  await fixture(page);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test('super admin selects a company without membership and assigns company roles', async ({
  page,
  isMobile,
}) => {
  await fixture(page, true);
  await navigate(page, 'Administración', isMobile);
  await page.getByRole('button', { name: 'Abrir empresa' }).click();
  await expect(page.getByLabel('Empresa activa')).toHaveValue('1');
  await page.getByRole('button', { name: 'Roles', exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Asignar rol', exact: true }).click();
  await expect(page.getByText('DRIVER, PARTNER', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Incorporar miembro', exact: true }).click();
  const memberDialog = page.getByRole('dialog', { name: 'Incorporar miembro' });
  await memberDialog.getByLabel('Correo de la cuenta').fill('nuevo@example.com');
  await memberDialog.getByRole('button', { name: 'Incorporar miembro' }).click();
  await expect(memberDialog).toHaveCount(0);
  await expect(page.getByText('nuevo@example.com', { exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
