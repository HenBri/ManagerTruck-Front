import { journeyTargets } from './journey-policy';

describe('Journey transition policy', () => {
  it('limits drivers to starting and completing partner journeys', () => {
    expect(journeyTargets('PLANNED', false, 'PARTNER')).toEqual(['IN_PROGRESS']);
    expect(journeyTargets('IN_PROGRESS', false, 'PARTNER')).toEqual(['COMPLETED']);
    expect(journeyTargets('PLANNED', false, 'AUXILIARY')).toEqual([]);
  });
  it('does not reopen terminal journeys and allows administrative cancellation', () => {
    expect(journeyTargets('COMPLETED', true, 'PARTNER')).toEqual([]);
    expect(journeyTargets('CANCELLED', true, 'AUXILIARY')).toEqual([]);
    expect(journeyTargets('IN_PROGRESS', true, 'PARTNER')).toEqual(['COMPLETED', 'CANCELLED']);
  });
});
