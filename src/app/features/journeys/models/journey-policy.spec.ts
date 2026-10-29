import { journeyTargets } from './journey-policy';

describe('Journey transition policy', () => {
  it('limits assigned drivers to starting and completing their journeys', () => {
    expect(journeyTargets('PENDIENTE', false, true)).toEqual(['EN_PROCESO']);
    expect(journeyTargets('EN_PROCESO', false, true)).toEqual(['COMPLETADO']);
    expect(journeyTargets('PENDIENTE', false, false)).toEqual([]);
  });
  it('does not reopen terminal journeys and allows administrative cancellation', () => {
    expect(journeyTargets('COMPLETADO', true, false)).toEqual([]);
    expect(journeyTargets('CANCELADO', true, false)).toEqual([]);
    expect(journeyTargets('EN_PROCESO', true, false)).toEqual(['COMPLETADO', 'CANCELADO']);
  });
});
