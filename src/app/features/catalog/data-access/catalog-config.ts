import { LookupConfig } from '../../../core/company-context/lookup-api';

export const relations: Record<string, LookupConfig> = {
  userId: {
    endpoint: 'memberships',
    collection: 'memberships',
    id: 'userId',
    labels: ['name', 'lastname', 'email'],
    state: 'membershipStatus',
    supportsDetail: false,
  },
  personPartnerId: {
    endpoint: 'partners',
    collection: 'partners',
    id: 'partnerId',
    labels: ['partnerName', 'partnerDocument'],
    state: 'partnerState',
    kind: { key: 'partnerType', value: 'PERSON' },
  },
  clientId: {
    endpoint: 'clients',
    collection: 'clients',
    id: 'clientId',
    labels: ['clientName', 'clientCi'],
    state: 'clientState',
    requiredState: true,
  },
  contractId: {
    endpoint: 'contracts',
    collection: 'contracts',
    id: 'contractId',
    labels: ['contractDescription', 'contractDate', 'contractState'],
  },
  chargeId: {
    endpoint: 'charges',
    collection: 'charges',
    id: 'chargeId',
    labels: ['chargeDescription', 'chargeType', 'chargeState'],
  },
  truckId: {
    endpoint: 'trucks',
    collection: 'trucks',
    id: 'truckId',
    labels: ['truckBoard', 'truckBrand', 'truckModel'],
    state: 'truckState',
  },
  driverId: {
    endpoint: 'drivers',
    collection: 'drivers',
    id: 'driverId',
    labels: ['driverName', 'driverLicense'],
    state: 'driverState',
  },
  containerId: {
    endpoint: 'containers',
    collection: 'containers',
    id: 'containerId',
    labels: ['containerCode', 'containerType', 'containerState'],
  },
  assignmentId: {
    endpoint: 'assignments',
    collection: 'assignments',
    id: 'assignmentId',
    labels: ['truckId', 'driverId', 'assignedFrom'],
  },
  auxiliaryProviderId: {
    endpoint: 'auxiliary-providers',
    collection: 'auxiliaryProviders',
    id: 'providerId',
    labels: ['providerName', 'providerKind'],
    state: 'providerStatus',
  },
};

export const filterFields: Record<string, { key: string; label: string; options?: string[] }[]> = {
  clientes: [{ key: 'active', label: 'Estado', options: ['true', 'false'] }],
  contratos: [
    { key: 'clientId', label: 'ID del cliente' },
    { key: 'state', label: 'Estado', options: ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] },
  ],
  cargas: [
    { key: 'contractId', label: 'ID del contrato' },
    { key: 'state', label: 'Estado', options: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] },
  ],
  contenedores: [
    { key: 'chargeId', label: 'ID de la carga' },
    { key: 'state', label: 'Estado', options: ['AVAILABLE', 'LOADED', 'IN_TRANSIT', 'DELIVERED'] },
  ],
  asignaciones: [
    { key: 'truckId', label: 'ID del camión' },
    { key: 'driverId', label: 'ID del conductor' },
  ],
  viajes: [
    { key: 'containerId', label: 'ID del contenedor' },
    {
      key: 'state',
      label: 'Estado',
      options: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    },
    { key: 'executionType', label: 'Modalidad', options: ['PARTNER', 'AUXILIARY'] },
  ],
  auxiliares: [
    { key: 'name', label: 'Nombre del proveedor' },
    { key: 'kind', label: 'Tipo', options: ['BUSINESS', 'INDEPENDENT'] },
    { key: 'status', label: 'Estado', options: ['ACTIVE', 'INACTIVE'] },
  ],
};

export interface Field {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'date' | 'datetime-local';
  required?: boolean;
  max?: number;
  options?: string[];
  createOnly?: boolean;
  min?: number;
  step?: string;
  only?: 'PARTNER' | 'AUXILIARY';
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
  statuses?: string[];
  commercial?: boolean;
  noEdit?: boolean;
}
const text = (key: string, label: string, max: number, required = false): Field => ({
  key,
  label,
  max,
  required,
});
const reference = (key: string, label: string, required = true): Field => ({
  key,
  label,
  type: 'number',
  min: 1,
  step: '1',
  required,
  createOnly: true,
});
const status = ['ACTIVE', 'INACTIVE'];

export const catalogs: Record<string, CatalogConfig> = {
  socios: {
    title: 'Socios',
    singular: 'socio',
    endpoint: 'partners',
    collection: 'partners',
    id: 'partnerId',
    description: 'Personas y empresas propietarias de los camiones de tu operación.',
    columns: [
      { key: 'partnerName', label: 'Nombre' },
      { key: 'partnerType', label: 'Tipo' },
      { key: 'partnerDocument', label: 'Documento' },
      { key: 'partnerPhone', label: 'Teléfono' },
    ],
    fields: [
      {
        key: 'partnerType',
        label: 'Tipo de socio',
        required: true,
        options: ['PERSON', 'BUSINESS'],
        createOnly: true,
      },
      text('partnerName', 'Nombre', 150, true),
      text('partnerDocument', 'Documento', 30),
      text('partnerPhone', 'Teléfono', 25),
      reference('userId', 'ID de cuenta vinculada (opcional)', false),
    ],
    state: 'partnerState',
    statuses: status,
  },
  conductores: {
    title: 'Conductores',
    singular: 'conductor',
    endpoint: 'drivers',
    collection: 'drivers',
    id: 'driverId',
    description: 'Conductores, licencias y datos de contacto de la empresa.',
    columns: [
      { key: 'driverName', label: 'Nombre' },
      { key: 'driverLicense', label: 'Licencia' },
      { key: 'licenseCategory', label: 'Categoría' },
      { key: 'licenseExpiration', label: 'Vencimiento' },
    ],
    fields: [
      text('driverName', 'Nombre completo', 150, true),
      text('driverCi', 'Documento', 30),
      text('driverPhone', 'Teléfono', 25),
      text('driverLicense', 'Licencia', 40, true),
      text('licenseCategory', 'Categoría', 20),
      { key: 'licenseExpiration', label: 'Vencimiento de licencia', type: 'date' },
      reference('userId', 'ID de cuenta vinculada (opcional)', false),
      reference('personPartnerId', 'ID de socio persona (opcional)', false),
    ],
    state: 'driverState',
    statuses: status,
  },
  clientes: {
    title: 'Clientes',
    singular: 'cliente',
    endpoint: 'clients',
    collection: 'clients',
    id: 'clientId',
    commercial: true,
    description: 'Información comercial y contacto de tus clientes.',
    columns: [
      { key: 'clientName', label: 'Nombre' },
      { key: 'clientCi', label: 'Documento' },
      { key: 'clientEmail', label: 'Correo' },
      { key: 'clientPhone', label: 'Teléfono' },
    ],
    fields: [
      text('clientName', 'Nombre', 150, true),
      text('clientCi', 'Documento', 30),
      { ...text('clientEmail', 'Correo', 255), type: 'email' },
      text('clientPhone', 'Teléfono', 25),
      text('clientAddress', 'Dirección', 255),
    ],
    state: 'clientState',
    statuses: ['true', 'false'],
  },
  contratos: {
    title: 'Contratos',
    singular: 'contrato',
    endpoint: 'contracts',
    collection: 'contracts',
    id: 'contractId',
    commercial: true,
    description: 'Acuerdos comerciales vinculados a los clientes de tu empresa.',
    columns: [
      { key: 'clientId', label: 'ID cliente' },
      { key: 'contractDescription', label: 'Descripción' },
      { key: 'contractAmount', label: 'Importe' },
      { key: 'contractDate', label: 'Fecha' },
    ],
    fields: [
      reference('clientId', 'ID del cliente'),
      {
        key: 'contractAmount',
        label: 'Importe acordado',
        type: 'number',
        min: 0,
        step: '0.01',
        required: true,
      },
      { key: 'contractDate', label: 'Fecha', type: 'date', required: true },
      text('contractDescription', 'Descripción', 255),
      text('contractType', 'Tipo', 50),
    ],
    state: 'contractState',
    statuses: ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
  },
  cargas: {
    title: 'Cargas',
    singular: 'carga',
    endpoint: 'charges',
    collection: 'charges',
    id: 'chargeId',
    commercial: true,
    description: 'Cargas asociadas a contratos, desde su registro hasta la entrega.',
    columns: [
      { key: 'contractId', label: 'ID contrato' },
      { key: 'chargeDescription', label: 'Descripción' },
      { key: 'chargeType', label: 'Tipo' },
      { key: 'chargeDate', label: 'Fecha de registro' },
    ],
    fields: [
      reference('contractId', 'ID del contrato'),
      text('chargeDescription', 'Descripción', 255),
      text('chargeType', 'Tipo', 100),
    ],
    state: 'chargeState',
    statuses: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
  },
  contenedores: {
    title: 'Contenedores',
    singular: 'contenedor',
    endpoint: 'containers',
    collection: 'containers',
    id: 'containerId',
    commercial: true,
    description: 'Contenedores y su vinculación con las cargas de la empresa.',
    columns: [
      { key: 'containerCode', label: 'Código' },
      { key: 'chargeId', label: 'ID carga' },
      { key: 'containerWeight', label: 'Peso' },
      { key: 'containerType', label: 'Tipo' },
    ],
    fields: [
      reference('chargeId', 'ID de la carga'),
      text('containerCode', 'Código', 30, true),
      { key: 'containerWeight', label: 'Peso', type: 'number', min: 0, step: '0.001' },
      text('containerDescription', 'Descripción', 255),
      text('containerType', 'Tipo', 50),
    ],
    state: 'containerState',
    statuses: ['AVAILABLE', 'LOADED', 'IN_TRANSIT', 'DELIVERED'],
  },
  auxiliares: {
    title: 'Auxilio externo',
    singular: 'proveedor',
    endpoint: 'auxiliary-providers',
    collection: 'auxiliaryProviders',
    id: 'providerId',
    commercial: true,
    description: 'Proveedores externos para apoyar los viajes de tu operación.',
    columns: [
      { key: 'providerName', label: 'Nombre' },
      { key: 'providerKind', label: 'Tipo' },
      { key: 'providerPhone', label: 'Teléfono' },
      { key: 'providerEmail', label: 'Correo' },
    ],
    fields: [
      { key: 'providerKind', label: 'Tipo', required: true, options: ['BUSINESS', 'INDEPENDENT'] },
      text('providerName', 'Nombre', 150, true),
      text('providerDocument', 'Documento', 30),
      text('providerPhone', 'Teléfono', 25),
      text('providerEmail', 'Correo', 255),
    ],
    state: 'providerStatus',
    statuses: status,
  },
  asignaciones: {
    title: 'Asignaciones',
    singular: 'asignación',
    endpoint: 'assignments',
    collection: 'assignments',
    id: 'assignmentId',
    noEdit: true,
    description: 'Vincula camiones y conductores en períodos de operación.',
    columns: [
      { key: 'truckId', label: 'ID camión' },
      { key: 'driverId', label: 'ID conductor' },
      { key: 'assignedFrom', label: 'Desde' },
      { key: 'assignedUntil', label: 'Hasta' },
    ],
    fields: [
      reference('truckId', 'ID del camión'),
      reference('driverId', 'ID del conductor'),
      { key: 'assignedFrom', label: 'Inicio', type: 'datetime-local', required: true },
      { key: 'assignedUntil', label: 'Fin (opcional)', type: 'datetime-local' },
    ],
  },
  viajes: {
    title: 'Viajes',
    singular: 'viaje',
    endpoint: 'journeys',
    collection: 'journeys',
    id: 'journeyId',
    description: 'Planifica viajes propios o de auxilio externo y sigue su ejecución.',
    columns: [
      { key: 'journeyOrigin', label: 'Origen' },
      { key: 'journeyDestination', label: 'Destino' },
      { key: 'executionType', label: 'Ejecución' },
      { key: 'containerId', label: 'ID contenedor' },
    ],
    fields: [
      reference('containerId', 'ID del contenedor'),
      text('journeyOrigin', 'Origen', 255, true),
      text('journeyDestination', 'Destino', 255, true),
      text('journeyDescription', 'Descripción', 255),
      text('journeyType', 'Tipo', 50),
      {
        key: 'executionType',
        label: 'Modalidad',
        options: ['PARTNER', 'AUXILIARY'],
        required: true,
        createOnly: true,
      },
      { ...reference('assignmentId', 'ID de la asignación'), only: 'PARTNER' },
      { ...reference('auxiliaryProviderId', 'ID del proveedor externo'), only: 'AUXILIARY' },
      {
        ...text('auxiliaryTruckPlate', 'Placa del camión externo', 20, true),
        only: 'AUXILIARY',
        createOnly: true,
      },
      {
        ...text('auxiliaryDriverName', 'Nombre del conductor externo', 150, true),
        only: 'AUXILIARY',
        createOnly: true,
      },
      {
        ...text('auxiliaryDriverLicense', 'Licencia externa', 40, true),
        only: 'AUXILIARY',
        createOnly: true,
      },
      {
        key: 'auxiliaryReason',
        label: 'Motivo del auxilio',
        options: ['TRUCK_SHORTAGE', 'DRIVER_SHORTAGE', 'OTHER'],
        required: true,
        only: 'AUXILIARY',
        createOnly: true,
      },
      {
        key: 'agreedAmount',
        label: 'Importe acordado',
        type: 'number',
        min: 0,
        step: '0.01',
        only: 'AUXILIARY',
        createOnly: true,
      },
    ],
    state: 'journeyState',
    statuses: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  },
};

export const labels: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  PERSON: 'Persona',
  BUSINESS: 'Empresa',
  INDEPENDENT: 'Independiente',
  PARTNER: 'Socio',
  AUXILIARY: 'Auxilio externo',
  PLANNED: 'Planificado',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  AVAILABLE: 'Disponible',
  LOADED: 'Cargado',
  TRUCK_SHORTAGE: 'Falta de camión',
  DRIVER_SHORTAGE: 'Falta de conductor',
  OTHER: 'Otro',
  true: 'Activo',
  false: 'Inactivo',
};
