import { toApiDateTime, toLocalDateTime } from './form-values';

describe('API date conversion', () => {
  it('preserves the instant when editing a UTC timestamp in local time', () => {
    const iso = '2026-11-05T07:00:00.000Z';
    expect(toApiDateTime(toLocalDateTime(iso)!)).toBe(iso);
  });
  it('respects explicit offsets and rejects malformed timestamps', () => {
    expect(toApiDateTime('2026-11-05T07:00:00-04:00')).toBe('2026-11-05T11:00:00.000Z');
    expect(() => toApiDateTime('invalid')).toThrow();
    expect(toLocalDateTime(null)).toBeNull();
  });
});
