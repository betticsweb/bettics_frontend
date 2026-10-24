export type StatisticsSeason = string | number;

export function availableSeasons(values: unknown): StatisticsSeason[] {
  if (!Array.isArray(values)) return [];
  return values.filter((value): value is StatisticsSeason =>
    (typeof value === 'string' && value.trim() !== '') ||
    (typeof value === 'number' && Number.isSafeInteger(value) && value >= 1000 && value <= 9999));
}

// Compare complete season identifiers, never substring matches against an ending year.
// Keep the original value for the API, including annual seasons returned as numbers.
export function latestSeason(values: StatisticsSeason[]): StatisticsSeason | null {
  let selected: StatisticsSeason | null = null;
  let bestEnd = -1, bestStart = -1;
  for (const value of values) {
    const years = String(value).trim().match(/^(\d{4})(?:\s*[-/]\s*(\d{4}))?$/);
    if (!years) continue;
    const start = Number(years[1]), end = Number(years[2] || years[1]);
    if (end < start) continue;
    if (end > bestEnd || (end === bestEnd && start > bestStart)) {
      selected = value;
      bestEnd = end;
      bestStart = start;
    }
  }
  return selected;
}
