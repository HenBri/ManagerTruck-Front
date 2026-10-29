import { expect, test } from '@playwright/test';
import { fixture, login, navigate, save, selectFirst, status } from './truckv3-fixture';

test('commercial chain: client → contract → container → freight → journey', async ({
  page,
  isMobile,
}) => {
  const { data, writes } = await fixture(page);
  await login(page);
  await navigate(page, 'Clientes', isMobile);
  await page.getByRole('button', { name: 'Registrar cliente' }).click();
  await page.getByLabel('Nombre *', { exact: true }).fill('Cliente Demo');
  await page.getByLabel('NIT', { exact: true }).fill('1028374021');
  await save(page);
  await navigate(page, 'Contratos', isMobile);
  await page.getByRole('button', { name: 'Registrar contrato' }).click();
  await selectFirst(page, 'Cliente *');
  await page.getByLabel('Código *', { exact: true }).fill('CTR-2026-001');
  await page.getByLabel('Importe *', { exact: true }).fill('2500.50');
  await page.getByLabel('Fecha del contrato').fill('2026-11-01');
  await page.getByLabel('Operación', { exact: true }).selectOption('IMPORTACION');
  await page.getByLabel('Origen', { exact: true }).fill('Arica');
  await page.getByLabel('Destino', { exact: true }).fill('La Paz');
  await page.getByLabel('Referencia de carga *', { exact: true }).fill('CARGO-2026-001');
  await save(page);
  expect(data.contracts[0]).toMatchObject({
    contractCode: 'CTR-2026-001',
    contractDate: '2026-11-01',
    contractAmount: 2500.5,
  });
  await navigate(page, 'Contenedores', isMobile);
  await page.getByRole('button', { name: 'Registrar contenedor' }).click();
  await selectFirst(page, 'Carga *');
  await page.getByLabel('Código *', { exact: true }).fill('CONT-DEMO');
  await page.getByLabel('Tara (kg)').fill('3900.125');
  await page.getByLabel('Temperatura').fill('-18.5');
  await save(page);
  expect(data.containers[0]).toMatchObject({ tareWeightKg: 3900.125, temperatureC: -18.5 });
  await navigate(page, 'Asignaciones', isMobile);
  await page.getByRole('button', { name: 'Registrar asignación' }).click();
  await selectFirst(page, 'Camión *');
  await selectFirst(page, 'Conductor *');
  await page.getByLabel('Inicio *', { exact: true }).fill('2026-11-05T07:00');
  await save(page);
  expect(data.assignments[0].assignedFrom).toMatch(/Z$/);
  await navigate(page, 'Fletes', isMobile);
  await page.getByRole('button', { name: 'Registrar flete' }).click();
  await selectFirst(page, 'Contrato *');
  await selectFirst(page, 'Contenedor *');
  await page.getByLabel('Código *', { exact: true }).fill('FLT-2026-001');
  await selectFirst(page, 'Camión *');
  await page.getByLabel('Salida prevista').fill('2026-11-05T08:00');
  await save(page);
  expect(data.freights[0]).toMatchObject({
    contractId: 1,
    containerId: 1,
    truckId: 1,
    auxiliaryProviderId: null,
  });
  await page.getByRole('link', { name: 'Ver viaje asociado' }).click();
  await expect(page).toHaveURL(/freightId=1/);
  await page.getByRole('button', { name: 'Ver detalle de viaje 1' }).click();
  expect(data.journeys[0]).toMatchObject({ freightId: 1, journeyOrigin: 'Arica' });
  expect(data.journeys[0]).not.toHaveProperty('containerId');
  await status(page, 'EN_PROCESO');
  await expect(page.getByRole('button', { name: 'Editar datos' })).toHaveCount(0);
  await status(page, 'COMPLETADO');
  expect(writes.at(-1)?.body).toEqual({ status: 'COMPLETADO' });
  await expect(page.getByRole('button', { name: 'Cambiar estado', exact: true })).toHaveCount(0);
  await navigate(page, 'Fletes', isMobile);
  await page.getByRole('button', { name: 'Ver detalle de flete 1' }).click();
  await status(page, 'EN_PROCESO');
  expect(writes.at(-1)?.body).toEqual({ state: 'EN_PROCESO' });
  await expect(page.getByRole('button', { name: 'Editar datos' })).toHaveCount(0);
});

test('auxiliary freight uses provider and plate, and validates chronological dates', async ({
  page,
  isMobile,
}) => {
  const { data } = await fixture(page);
  data.contracts.push({ contractId: 1, contractCode: 'CTR-1', state: 'PENDIENTE' });
  data.containers.push({ containerId: 1, containerCode: 'CONT-1', state: 'AVAILABLE' });
  data['auxiliary-providers'].push({
    providerId: 1,
    providerKind: 'COMPANY',
    providerName: 'TransSur',
    state: 'ACTIVO',
  });
  await login(page);
  await navigate(page, 'Fletes', isMobile);
  await page.getByRole('button', { name: 'Registrar flete' }).click();
  await selectFirst(page, 'Contrato *');
  await selectFirst(page, 'Contenedor *');
  await page.getByLabel('Código *', { exact: true }).fill('EXT-1');
  await page.getByLabel('Transporte', { exact: true }).selectOption('AUXILIARY');
  await expect(page.getByLabel('Camión *', { exact: true })).toHaveCount(0);
  await selectFirst(page, 'Proveedor auxiliar *');
  await page.getByLabel('Placa auxiliar').fill('EXT-101');
  await page.getByLabel('Salida prevista').fill('2026-11-05T08:00');
  await page.getByLabel('Llegada prevista').fill('2026-11-04T08:00');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('fecha final');
  await page.getByLabel('Llegada prevista').fill('2026-11-06T08:00');
  await save(page);
  expect(data.freights[0]).toMatchObject({
    truckId: null,
    auxiliaryProviderId: 1,
    auxiliaryTruckPlate: 'EXT-101',
  });
});

test('driver may only start and complete an assigned journey', async ({ page, isMobile }) => {
  const { data, writes, requests } = await fixture(page, 'DRIVER');
  data.assignments.push({ assignmentId: 1, driverId: 1, truckId: 1, state: 'ACTIVE' });
  data.journeys.push({
    journeyId: 1,
    freightId: 1,
    assignmentId: 1,
    journeyOrigin: 'Arica',
    journeyDestination: 'La Paz',
    state: 'PENDIENTE',
  });
  await login(page);
  await navigate(page, 'Viajes', isMobile);
  await page.getByRole('button', { name: 'Ver detalle de viaje 1' }).click();
  await expect(page.getByRole('button', { name: 'Registrar viaje' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cambiar estado', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('option', { name: 'Cancelado' })).toHaveCount(0);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Aplicar estado' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await status(page, 'COMPLETADO');
  expect(writes.at(-1)?.body).toEqual({ status: 'COMPLETADO' });
  expect(requests).not.toContain('/api/freights/1');
  expect(requests).not.toContain('/api/trucks/1');
});

test('admin manages users and role definitions without self-deactivation', async ({
  page,
  isMobile,
}) => {
  const { writes } = await fixture(page, 'ADMIN');
  await login(page);
  await navigate(page, 'Administración', isMobile);
  await page.getByRole('link', { name: 'Usuarios', exact: true }).click();
  await page.getByRole('button', { name: 'Ver detalle de usuario 1' }).click();
  await expect(page.getByRole('button', { name: 'Cambiar estado', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Registrar usuario' }).click();
  await page.getByLabel('Nombres *', { exact: true }).fill('Carlos');
  await page.getByLabel('Apellido paterno *').fill('Pérez');
  await page.getByLabel('Correo *').fill('carlos@example.com');
  await page.getByLabel('Contraseña *').fill('Password123!');
  await save(page);
  expect(writes.at(-1)?.path).toBe('/api/users/admin');
  await status(page, 'INACTIVE');
  expect(writes.at(-1)?.body).toEqual({ status: 'INACTIVE' });
  await navigate(page, 'Administración', isMobile);
  await page.getByRole('link', { name: 'Roles', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar rol' }).click();
  await page.getByLabel('Nombre *', { exact: true }).fill('OPERADOR');
  await save(page);
  expect(writes.at(-1)?.path).toBe('/api/roles');
});

test('driver cannot operate a journey belonging to another assignment', async ({
  page,
  isMobile,
}) => {
  const { data } = await fixture(page, 'DRIVER');
  data.assignments.push({ assignmentId: 2, driverId: 99, truckId: 1, state: 'ACTIVE' });
  data.journeys.push({
    journeyId: 2,
    freightId: 2,
    assignmentId: 2,
    journeyOrigin: 'Arica',
    journeyDestination: 'La Paz',
    state: 'PENDIENTE',
  });
  await login(page);
  await navigate(page, 'Viajes', isMobile);
  await page.getByRole('button', { name: 'Ver detalle de viaje 2' }).click();
  await expect(page.getByRole('heading', { name: 'Detalle de viaje #2' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cambiar estado', exact: true })).toHaveCount(0);
});
