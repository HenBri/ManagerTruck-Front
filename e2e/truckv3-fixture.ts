import { expect, Page } from '@playwright/test';

export type Row = Record<string, any>;
export const user = {
  userId: 1,
  personId: 1,
  firstName: 'Ana',
  lastName: 'Pérez',
  maternalLastName: null,
  documentNumber: '123',
  email: 'ana@example.com',
  phone: null,
  status: 'ACTIVE',
};
export async function fixture(page: Page, role = 'SECRETARY') {
  const ids: Record<string, string> = {
    users: 'userId',
    roles: 'roleId',
    partners: 'partnerId',
    drivers: 'driverId',
    trucks: 'truckId',
    clients: 'clientId',
    contracts: 'contractId',
    charges: 'chargeId',
    containers: 'containerId',
    assignments: 'assignmentId',
    freights: 'freightId',
    journeys: 'journeyId',
    'auxiliary-providers': 'providerId',
  };
  const data: Record<string, Row[]> = {
    users: [{ ...user }],
    roles: [{ roleId: 1, name: 'ADMIN', description: 'Administrador' }],
    partners: [
      {
        partnerId: 1,
        firstName: 'Socio',
        lastName: 'Demo',
        state: 'ACTIVO',
        partnerType: 'PERSON',
      },
    ],
    drivers: [
      {
        driverId: 1,
        firstName: 'Ana',
        lastName: 'Pérez',
        driverLicense: 'LIC-101',
        state: 'ACTIVO',
      },
    ],
    trucks: [
      {
        truckId: 1,
        ownerPartnerId: 1,
        truckBoard: 'DEMO-101',
        truckBrand: 'Volvo',
        state: 'ACTIVO',
      },
    ],
    clients: [],
    contracts: [],
    charges: [{ chargeId: 1, contractId: 1, cargoReference: 'CARGO-DEMO', state: 'PENDING' }],
    containers: [],
    assignments: [],
    freights: [],
    journeys: [],
    'auxiliary-providers': [],
  };
  const writes: { path: string; body: Row }[] = [];
  const requests: string[] = [];
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    requests.push(path);
    expect(path).not.toContain('/companies');
    expect(path).not.toContain('/platform');
    const publicRegister = path === '/api/users' && req.method() === 'POST';
    if (!publicRegister) expect(req.headers()['authorization']).toContain('Basic ');
    if (path === '/api/users/me') return route.fulfill({ json: user });
    const match = path.match(/^\/api\/([^/]+)(?:\/(\d+|admin))?(?:\/(status|end|password))?$/);
    if (!match || !data[match[1]])
      return route.fulfill({ status: 404, json: { message: `Endpoint inesperado: ${path}` } });
    const [, entity, id, action] = match;
    const denied =
      !publicRegister &&
      ((entity === 'users' && !id && role !== 'ADMIN') ||
        (['clients', 'contracts', 'charges', 'containers', 'auxiliary-providers'].includes(
          entity,
        ) &&
          !['ADMIN', 'SECRETARY'].includes(role)) ||
        (['trucks', 'freights'].includes(entity) && role === 'DRIVER'));
    if (denied) return route.fulfill({ status: 403, json: { message: 'FORBIDDEN' } });
    let body: unknown;
    const payload: Row = req.method() === 'GET' ? {} : req.postDataJSON();
    if (req.method() !== 'GET') {
      writes.push({ path, body: payload });
      expect(payload).not.toHaveProperty('companyId');
      if (action === 'status')
        expect(Object.keys(payload)).toEqual([
          ['users', 'journeys'].includes(entity) ? 'status' : 'state',
        ]);
    }
    if (req.method() === 'POST') {
      const state = ['contracts', 'freights', 'journeys'].includes(entity)
        ? 'PENDIENTE'
        : entity === 'containers'
          ? 'AVAILABLE'
          : entity === 'charges'
            ? 'PENDING'
            : 'ACTIVE';
      const row: Row = {
        ...payload,
        [ids[entity]]: data[entity].length + 1,
        [entity === 'users' ? 'status' : 'state']: state,
      };
      if (entity === 'freights') {
        expect(payload).toHaveProperty('contractId');
        expect(payload).toHaveProperty('containerId');
        expect(payload).toHaveProperty('freightCode');
        expect(Boolean(payload.truckId) !== Boolean(payload.auxiliaryProviderId)).toBe(true);
      }
      if (entity === 'journeys') {
        expect(payload).toHaveProperty('freightId');
        expect(payload).not.toHaveProperty('containerId');
        expect(payload).not.toHaveProperty('executionType');
        if (data[entity].some((r) => r.freightId === payload.freightId))
          return route.fulfill({
            status: 409,
            json: { message: 'El flete ya tiene un viaje asociado' },
          });
      }
      data[entity].push(row);
      if (entity === 'freights') {
        data.journeys.push({
          journeyId: data.journeys.length + 1,
          freightId: row.freightId,
          journeyOrigin: 'Arica',
          journeyDestination: 'La Paz',
          state: 'PENDIENTE',
        });
      }
      body = row;
    } else if (id) {
      const row = data[entity].find((r) => r[ids[entity]] === Number(id));
      if (!row) return route.fulfill({ status: 404, json: { message: 'No encontrado' } });
      if (req.method() === 'PUT') {
        if (action === 'status')
          row[entity === 'users' ? 'status' : 'state'] = payload.status ?? payload.state;
        else Object.assign(row, payload);
        if (entity === 'journeys' && action === 'status')
          row[payload.status === 'EN_PROCESO' ? 'journeyStartDate' : 'journeyEndDate'] =
            '2026-11-05T07:00:00Z';
      }
      body = row;
    } else {
      let rows = data[entity];
      if (entity === 'drivers' && role === 'PARTNER') rows = [];
      for (const filter of [
        'contractId',
        'chargeId',
        'freightId',
        'assignmentId',
        'truckId',
        'driverId',
        'state',
      ]) {
        if (url.searchParams.has(filter))
          rows = rows.filter((r) => String(r[filter]) === url.searchParams.get(filter));
      }
      body = {
        [entity === 'auxiliary-providers' ? 'auxiliaryProviders' : entity]: rows,
        page: 0,
        size: 20,
        totalElements: rows.length,
        totalPages: rows.length ? 1 : 0,
      };
    }
    return route.fulfill({ status: req.method() === 'POST' ? 201 : 200, json: body });
  });
  return { data, writes, requests };
}

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
}
export async function navigate(page: Page, name: string, mobile: boolean) {
  if (mobile) await page.getByRole('button', { name: 'Alternar menú lateral' }).click();
  await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
}
export async function save(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('status').filter({ hasText: 'Operación completada correctamente.' }),
  ).toBeVisible();
}
export async function selectFirst(page: Page, label: string) {
  await expect(page.getByLabel(label, { exact: true }).locator('option')).not.toHaveCount(1);
  await page.getByLabel(label, { exact: true }).selectOption({ index: 1 });
}
export async function status(page: Page, value: string) {
  await page.getByRole('button', { name: 'Cambiar estado', exact: true }).click();
  await page.getByRole('dialog').getByRole('combobox').selectOption(value);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Aplicar estado', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
