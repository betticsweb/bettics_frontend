import { availableSeasons, latestSeason } from './statistics-seasons';

describe('Statistics seasons', () => {
  it('selects the current annual Peru season as a string', () => {
    expect(latestSeason(['2024', '2026', '2025'])).toBe('2026');
  });
  it('accepts an annual year returned as a number without calling string methods on it', () => {
    expect(latestSeason(availableSeasons([2024, 2026, 2025]))).toBe(2026);
  });
  it('preserves slash and hyphen identifiers for other leagues', () => {
    expect(latestSeason(['2025/2026', '2026/2027'])).toBe('2026/2027');
    expect(latestSeason(['2026-2027', '2025-2026'])).toBe('2026-2027');
  });
  it('compares start years when end years match instead of selecting the first substring match', () => {
    expect(latestSeason(['2025/2026', '2026'])).toBe('2026');
    expect(latestSeason(['2024-2026', '2025-2026'])).toBe('2025-2026');
  });
  it('handles empty, absent and malformed API data without inventing a year', () => {
    expect(availableSeasons(null)).toEqual([]);
    expect(availableSeasons([null, undefined, '', {}, false, NaN, 2026])).toEqual([2026]);
    expect(latestSeason([])).toBeNull();
    expect(latestSeason(['unknown', '2027/2026'])).toBeNull();
  });
});
