import { catalogs } from './catalog-config';

describe('catalog auto-populated fields', () => {
  it('marks container values derived from the selected charge', () => {
    const fields = catalogs['contenedores'].fields;

    expect(fields.find((field) => field.key === 'containerDescription')?.autoPopulated).toBe(true);
    expect(fields.find((field) => field.key === 'containerType')?.autoPopulated).toBe(true);
    expect(fields.find((field) => field.key === 'customsReference')?.autoPopulated).toBe(true);
  });

  it('marks freight values derived from the selected contract or container', () => {
    const fields = catalogs['fletes'].fields;
    const autoPopulated = fields.filter((field) => field.autoPopulated).map((field) => field.key);

    expect(autoPopulated).toEqual([
      'freightCode',
      'freightDescription',
      'scheduledDeparture',
      'scheduledArrival',
      'freightAmount',
    ]);
  });
});
