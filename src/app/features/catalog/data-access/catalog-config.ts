import { LookupConfig } from '../../../core/company-context/lookup-api';

export interface Field {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'checkbox';
  required?: boolean;
  max?: number;
  minLength?: number;
  options?: string[];
  createOnly?: boolean;
  editOnly?: boolean;
  readOnly?: boolean;
  autoPopulated?: boolean;
  min?: number;
  maximum?: number;
  step?: string;
  only?: 'PARTNER' | 'AUXILIARY';
  lookup?: string;
}
export interface CatalogConfig {
  title: string;
  singular: string;
  endpoint: string;
  collection: string;
  id: string;
  description: string;
  columns: { key: string; label: string }[];
  fields: Field[];
  state?: string;
  statusKey?: string;
  statuses?: string[];
  noEdit?: boolean;
  noCreate?: boolean;
  adminOnly?: boolean;
  unpaged?: boolean;
  createEndpoint?: string;
}
const text = (key: string, label: string, max: number, required = false): Field => ({
  key,
  label,
  max,
  required,
});
const reference = (key: string, label: string, required = true, createOnly = true): Field => ({
  key,
  label,
  type: 'number',
  min: 1,
  step: '1',
  required,
  createOnly,
});
const decimal = (key: string, label: string, step = '0.001', required = false): Field => ({
  key,
  label,
  type: 'number',
  min: 0,
  maximum: step === '0.01' ? 9999999999999.99 : 999999999.999,
  step,
  required,
});
const date = (
  key: string,
  label: string,
  type: 'date' | 'datetime-local' = 'date',
  required = false,
): Field => ({ key, label, type, required });
const person: Field[] = [
  text('firstName', 'Nombres', 100),
  text('lastName', 'Apellido paterno', 100),
  text('maternalLastName', 'Apellido materno', 100),
  text('documentNumber', 'Documento', 30),
  text('phone', 'Teléfono', 25),
  { ...text('email', 'Correo', 255), type: 'email' },
];
const accountCreation: Field[] = [
  reference('personId', 'ID de persona existente (opcional)', false),
  {
    key: 'password',
    label: 'Contraseña de la nueva cuenta (opcional)',
    type: 'password',
    minLength: 8,
    max: 72,
    createOnly: true,
  },
];
const active = ['ACTIVE', 'INACTIVE'];
const execution = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO'];

export const relations: Record<string, LookupConfig> = {
  ownerPartnerId: {
    endpoint: 'partners',
    collection: 'partners',
    id: 'partnerId',
    labels: ['firstName', 'lastName', 'documentNumber'],
    state: 'state',
    requiredState: 'ACTIVE',
  },
  clientId: {
    endpoint: 'clients',
    collection: 'clients',
    id: 'clientId',
    labels: ['clientName', 'taxId'],
    state: 'state',
    requiredState: 'ACTIVE',
  },
  contractId: {
    endpoint: 'contracts',
    collection: 'contracts',
    id: 'contractId',
    labels: ['contractCode', 'contractDescription', 'state'],
    excludedStates: ['CANCELADO'],
  },
  availableContractId: {
    endpoint: 'contracts',
    collection: 'contracts',
    id: 'contractId',
    labels: ['contractCode', 'contractDescription', 'state'],
    excludedStates: ['CANCELADO'],
    query: '&availableForContainers=true',
  },
  chargeId: {
    endpoint: 'charges',
    collection: 'charges',
    id: 'chargeId',
    labels: ['cargoReference', 'chargeDescription', 'state'],
  },
  truckId: {
    endpoint: 'trucks',
    collection: 'trucks',
    id: 'truckId',
    labels: ['truckBoard', 'truckBrand'],
    state: 'state',
    requiredState: 'ACTIVE',
  },
  availableTruckId: {
    endpoint: 'trucks',
    collection: 'trucks',
    id: 'truckId',
    labels: ['truckBoard', 'truckBrand'],
    state: 'state',
    requiredState: 'ACTIVE',
    query: '&availableForFreight=true',
  },
  driverId: {
    endpoint: 'drivers',
    collection: 'drivers',
    id: 'driverId',
    labels: ['firstName', 'lastName', 'driverLicense'],
    state: 'state',
    requiredState: 'ACTIVE',
  },
  containerId: {
    endpoint: 'containers',
    collection: 'containers',
    id: 'containerId',
    labels: ['containerCode', 'containerType', 'state'],
  },
  availableContainerId: {
    endpoint: 'containers',
    collection: 'containers',
    id: 'containerId',
    labels: ['containerCode', 'containerType', 'state'],
    query: '&availableForFreight=true',
  },
  assignmentId: {
    endpoint: 'assignments',
    collection: 'assignments',
    id: 'assignmentId',
    labels: ['truckId', 'driverId', 'assignedFrom'],
    state: 'state',
    requiredState: 'ACTIVE',
    validUntil: 'assignedUntil',
  },
  auxiliaryProviderId: {
    endpoint: 'auxiliary-providers',
    collection: 'auxiliaryProviders',
    id: 'providerId',
    labels: ['providerName', 'providerKind'],
    state: 'state',
    requiredState: 'ACTIVE',
  },
  freightId: {
    endpoint: 'freights',
    collection: 'freights',
    id: 'freightId',
    labels: ['freightCode', 'freightDescription', 'state'],
    excludedStates: ['CANCELADO'],
  },
};

export const filterFields: Record<string, { key: string; label: string; options?: string[] }[]> = {
  contratos: [{ key: 'clientId', label: 'ID del cliente' }],
  contenedores: [{ key: 'chargeId', label: 'ID de la carga' }],
  asignaciones: [
    { key: 'truckId', label: 'ID del camión' },
    { key: 'driverId', label: 'ID del conductor' },
  ],
  fletes: [
    { key: 'contractId', label: 'ID del contrato' },
    { key: 'truckId', label: 'ID del camión' },
    { key: 'state', label: 'Estado', options: execution },
  ],
  viajes: [
    { key: 'freightId', label: 'ID del flete' },
    { key: 'assignmentId', label: 'ID de la asignación' },
    { key: 'state', label: 'Estado', options: execution },
  ],
  auxiliares: [
    { key: 'name', label: 'Nombre del proveedor' },
    { key: 'kind', label: 'Tipo', options: ['COMPANY', 'INDEPENDENT'] },
  ],
};

export const catalogs: Record<string, CatalogConfig> = {
  socios: {
    title: 'Socios',
    singular: 'socio',
    endpoint: 'partners',
    collection: 'partners',
    id: 'partnerId',
    description: 'Personas y empresas propietarias de los camiones.',
    columns: [
      text('firstName', 'Nombre', 100),
      text('lastName', 'Apellido', 100),
      text('partnerType', 'Tipo', 20),
      text('documentNumber', 'Documento', 30),
    ],
    fields: [
      {
        key: 'partnerType',
        label: 'Tipo de socio',
        required: true,
        options: ['PERSON', 'COMPANY'],
      },
      ...accountCreation,
      ...person,
    ],
    state: 'state',
    statuses: active,
  },
  conductores: {
    title: 'Conductores',
    singular: 'conductor',
    endpoint: 'drivers',
    collection: 'drivers',
    id: 'driverId',
    description: 'Datos personales, licencias y contacto de los conductores.',
    columns: [
      text('firstName', 'Nombre', 100),
      text('lastName', 'Apellido', 100),
      text('driverLicense', 'Licencia', 40),
      date('licenseExpiration', 'Vencimiento'),
    ],
    fields: [
      ...accountCreation,
      ...person,
      text('driverLicense', 'Licencia', 40, true),
      text('licenseCategory', 'Categoría', 20, true),
      date('licenseExpiration', 'Vencimiento de licencia'),
    ],
    state: 'state',
    statuses: active,
  },
  clientes: {
    title: 'Clientes',
    singular: 'cliente',
    endpoint: 'clients',
    collection: 'clients',
    id: 'clientId',
    description: 'Información comercial y contactos de los clientes.',
    columns: [
      text('clientName', 'Nombre', 150),
      text('taxId', 'NIT', 30),
      text('clientEmail', 'Correo', 255),
      text('clientPhone', 'Teléfono', 25),
    ],
    fields: [
      text('clientName', 'Nombre', 150, true),
      text('clientCi', 'Documento', 30),
      text('taxId', 'NIT', 30),
      { ...text('clientEmail', 'Correo', 255), type: 'email' },
      text('clientPhone', 'Teléfono', 25),
      text('clientAddress', 'Dirección', 255),
      text('contactPerson', 'Persona de contacto', 150),
      text('contactPhone', 'Teléfono de contacto', 25),
    ],
    state: 'state',
    statuses: ['ACTIVE', 'INACTIVE'],
  },
  contratos: {
    title: 'Contratos',
    singular: 'contrato',
    endpoint: 'contracts',
    collection: 'contracts',
    id: 'contractId',
    description: 'Acuerdos comerciales, programación y referencias del transporte.',
    columns: [
      text('contractCode', 'Código', 40),
      reference('clientId', 'Cliente'),
      decimal('contractAmount', 'Importe', '0.01'),
      date('contractDate', 'Fecha'),
    ],
    fields: [
      reference('clientId', 'Cliente'),
      { ...text('contractCode', 'Código', 40, true), createOnly: true },
      decimal('contractAmount', 'Importe', '0.01', true),
      date('contractDate', 'Fecha del contrato', 'date', true),
      text('contractDescription', 'Descripción', 255),
      text('contractType', 'Tipo', 50),
      {
        key: 'operationType',
        label: 'Operación',
        options: ['IMPORTACION', 'EXPORTACION', 'NACIONAL'],
      },
      text('originLocation', 'Origen', 255),
      text('destinationLocation', 'Destino', 255),
      date('expectedStartDate', 'Inicio previsto'),
      date('expectedDeliveryDate', 'Entrega prevista'),
      { ...date('actualDeliveryDate', 'Entrega real', 'datetime-local'), editOnly: true },
      text('referenceDocument', 'Documento de referencia', 80),
      decimal('declaredTotalWeightKg', 'Peso declarado (kg)'),
      {
        key: 'expectedContainerCount',
        label: 'Cantidad de contenedores',
        type: 'number',
        step: '1',
        min: 0,
      },
      text('observations', 'Observaciones', 65535),
      { ...text('cargoReference', 'Referencia de carga', 80, true), createOnly: true },
      { ...text('chargeType', 'Tipo de carga', 100), createOnly: true },
      { ...text('chargeDescription', 'Descripción de carga', 255), createOnly: true },
      { ...text('goodsDescription', 'Mercancía', 65535), createOnly: true },
      { key: 'hazardousGoods', label: 'Mercancía peligrosa', type: 'checkbox', createOnly: true },
      { ...text('handlingInstructions', 'Instrucciones de manejo', 65535), createOnly: true },
    ],
    state: 'state',
    statuses: ['PENDIENTE', 'EN_PROCESO', 'ENTREGADO', 'CANCELADO'],
  },
  contenedores: {
    title: 'Contenedores',
    singular: 'contenedor',
    endpoint: 'containers',
    collection: 'containers',
    id: 'containerId',
    description: 'Identificación, pesos y referencias aduaneras de los contenedores.',
    columns: [
      text('containerCode', 'Código', 30),
      reference('chargeId', 'Carga'),
      decimal('containerWeight', 'Peso'),
      text('containerType', 'Tipo', 50),
    ],
    fields: [
      reference('chargeId', 'Carga'),
      text('containerCode', 'Código', 30, true),
      decimal('containerWeight', 'Peso'),
      { ...text('containerDescription', 'Descripción', 255), autoPopulated: true },
      { ...text('containerType', 'Tipo', 50), autoPopulated: true },
      text('isoSize', 'Tamaño ISO', 10),
      text('containerFormat', 'Formato', 25),
      text('sealNumber', 'Número de sello', 50),
      decimal('grossWeightKg', 'Peso bruto (kg)'),
      decimal('tareWeightKg', 'Tara (kg)'),
      decimal('cargoWeightKg', 'Peso de carga (kg)'),
      text('shippingLine', 'Naviera', 120),
      { ...text('customsReference', 'Referencia aduanera', 80), autoPopulated: true },
      {
        key: 'temperatureC',
        label: 'Temperatura (°C)',
        type: 'number',
        step: '0.01',
        min: -273.15,
      },
    ],
    state: 'state',
    statuses: ['AVAILABLE', 'LOADED', 'IN_TRANSIT', 'DELIVERED'],
  },
  auxiliares: {
    title: 'Auxilio externo',
    singular: 'proveedor',
    endpoint: 'auxiliary-providers',
    collection: 'auxiliaryProviders',
    id: 'providerId',
    description: 'Transportistas externos de apoyo a la operación.',
    columns: [
      text('providerName', 'Nombre', 150),
      text('providerKind', 'Tipo', 20),
      text('providerPhone', 'Teléfono', 25),
      text('providerEmail', 'Correo', 255),
    ],
    fields: [
      { key: 'providerKind', label: 'Tipo', required: true, options: ['COMPANY', 'INDEPENDENT'] },
      text('providerName', 'Nombre', 150, true),
      text('providerDocument', 'Documento', 30),
      text('providerPhone', 'Teléfono', 25),
      { ...text('providerEmail', 'Correo', 255), type: 'email' },
    ],
    state: 'state',
    statuses: active,
  },
  asignaciones: {
    title: 'Asignaciones',
    singular: 'asignación',
    endpoint: 'assignments',
    collection: 'assignments',
    id: 'assignmentId',
    noEdit: true,
    description: 'Vincula camiones y conductores activos por período.',
    columns: [
      reference('truckId', 'Camión'),
      reference('driverId', 'Conductor'),
      date('assignedFrom', 'Desde'),
      date('assignedUntil', 'Hasta'),
    ],
    fields: [
      reference('truckId', 'Camión'),
      reference('driverId', 'Conductor'),
      date('assignedFrom', 'Inicio', 'datetime-local', true),
      date('assignedUntil', 'Fin (opcional)', 'datetime-local'),
    ],
    state: 'state',
  },
  fletes: {
    title: 'Fletes',
    singular: 'flete',
    endpoint: 'freights',
    collection: 'freights',
    id: 'freightId',
    description:
      'Planifica el transporte de un contenedor por camión de socio o proveedor externo.',
    columns: [
      text('freightCode', 'Código', 40),
      { ...reference('contractId', 'Contrato'), lookup: 'availableContractId' },
      { ...reference('containerId', 'Contenedor'), lookup: 'availableContainerId' },
      decimal('freightAmount', 'Importe', '0.01'),
    ],
    fields: [
      reference('contractId', 'Contrato'),
      reference('containerId', 'Contenedor'),
      { ...text('freightCode', 'Código', 40, true), createOnly: true, autoPopulated: true },
      {
        ...reference('truckId', 'Camión', true, false),
        only: 'PARTNER',
        lookup: 'availableTruckId',
      },
      { ...reference('auxiliaryProviderId', 'Proveedor auxiliar', true, false), only: 'AUXILIARY' },
      { ...text('auxiliaryTruckPlate', 'Placa auxiliar', 20), only: 'AUXILIARY' },
      { ...text('freightDescription', 'Descripción', 255), autoPopulated: true },
      { ...date('scheduledDeparture', 'Salida prevista', 'datetime-local'), autoPopulated: true },
      { ...date('scheduledArrival', 'Llegada prevista', 'datetime-local'), autoPopulated: true },
      { ...decimal('freightAmount', 'Importe', '0.01'), autoPopulated: true },
      { ...text('deliveryNotes', 'Notas de entrega', 65535), editOnly: true },
      { ...date('actualDeparture', 'Salida real', 'datetime-local'), editOnly: true },
      { ...date('actualArrival', 'Llegada real', 'datetime-local'), editOnly: true },
    ],
    state: 'state',
    statuses: execution,
  },
  viajes: {
    title: 'Viajes',
    singular: 'viaje',
    endpoint: 'journeys',
    collection: 'journeys',
    id: 'journeyId',
    description: 'Ejecución en carretera: un viaje por flete.',
    noCreate: true,
    columns: [
      reference('freightId', 'Flete'),
      text('journeyOrigin', 'Origen', 255),
      text('journeyDestination', 'Destino', 255),
      reference('assignmentId', 'Asignación'),
    ],
    fields: [
      reference('freightId', 'Flete'),
      text('journeyOrigin', 'Origen', 255, true),
      text('journeyDestination', 'Destino', 255, true),
      text('journeyDescription', 'Descripción', 255),
      text('journeyType', 'Tipo', 50),
      date('plannedStartDate', 'Inicio previsto', 'datetime-local'),
      date('plannedEndDate', 'Fin previsto', 'datetime-local'),
      reference('assignmentId', 'Asignación (opcional)', false, false),
      text('auxiliaryDriverName', 'Conductor auxiliar', 150),
      text('auxiliaryDriverLicense', 'Licencia auxiliar', 40),
      {
        key: 'auxiliaryReason',
        label: 'Motivo del auxilio',
        options: ['CAPACIDAD', 'FALLA_MECANICA', 'URGENCIA', 'OTRO'],
      },
      decimal('agreedAmount', 'Importe acordado', '0.01'),
      text('observations', 'Observaciones', 65535),
      date('deliveryConfirmedAt', 'Confirmación de entrega', 'datetime-local'),
      text('recipientName', 'Destinatario', 150),
      text('proofOfDeliveryReference', 'Comprobante de entrega', 255),
      { ...date('journeyStartDate', 'Inicio real', 'datetime-local'), readOnly: true },
      { ...date('journeyEndDate', 'Fin real', 'datetime-local'), readOnly: true },
    ],
    state: 'state',
    statusKey: 'status',
    statuses: execution,
  },
  usuarios: {
    title: 'Usuarios',
    singular: 'usuario',
    endpoint: 'users',
    collection: 'users',
    id: 'userId',
    adminOnly: true,
    createEndpoint: '/api/users/admin',
    description: 'Cuentas personales y estado de acceso al sistema.',
    columns: [
      text('firstName', 'Nombre', 100),
      text('lastName', 'Apellido', 100),
      text('email', 'Correo', 255),
    ],
    fields: [
      ...person.map((f) => ({
        ...f,
        required: ['firstName', 'lastName', 'email'].includes(f.key),
        createOnly: f.key === 'email',
      })),
      {
        key: 'password',
        label: 'Contraseña',
        type: 'password',
        required: true,
        minLength: 8,
        max: 72,
        createOnly: true,
      },
    ],
    state: 'status',
    statusKey: 'status',
    statuses: ['ACTIVE', 'INACTIVE'],
  },
  roles: {
    title: 'Roles',
    singular: 'rol',
    endpoint: 'roles',
    collection: 'roles',
    id: 'roleId',
    adminOnly: true,
    unpaged: true,
    description: 'Catálogo de roles. La API actual no ofrece asignación de roles a usuarios.',
    columns: [text('name', 'Nombre', 50), text('description', 'Descripción', 255)],
    fields: [text('name', 'Nombre', 50, true), text('description', 'Descripción', 255)],
  },
};

export const labels: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  MANTENIMIENTO: 'Mantenimiento',
  PERSON: 'Persona',
  COMPANY: 'Empresa',
  INDEPENDENT: 'Independiente',
  PARTNER: 'Socio',
  AUXILIARY: 'Auxilio externo',
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
  ENTREGADO: 'Entregado',
  PENDING: 'Pendiente',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  AVAILABLE: 'Disponible',
  LOADED: 'Cargado',
  CAPACIDAD: 'Capacidad',
  FALLA_MECANICA: 'Falla mecánica',
  URGENCIA: 'Urgencia',
  OTRO: 'Otro',
  true: 'Sí',
  false: 'No',
};
