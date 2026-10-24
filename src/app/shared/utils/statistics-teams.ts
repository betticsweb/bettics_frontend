export interface StatisticsTeam { id: any; descripcion: string; }
const normalizedName = (name: string) => String(name || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
const hasId = (id: any) => id !== null && id !== undefined && id !== '';

export function statisticsTeams(home: StatisticsTeam[], away: StatisticsTeam[]): StatisticsTeam[] {
  const teams = new Map<string, StatisticsTeam>();
  for (const team of [...home, ...away]) {
    if (hasId(team.id) && team.descripcion && !teams.has(String(team.id))) teams.set(String(team.id), team);
  }
  return [...teams.values()].sort((a, b) => a.descripcion.localeCompare(b.descripcion));
}

export function findStatisticsTeam(teams: StatisticsTeam[], id: any, name: string): StatisticsTeam | undefined {
  const identified = hasId(id) ? teams.filter(team => String(team.id) === String(id)) : [];
  if (identified.length === 1) return identified[0];
  const named = name ? teams.filter(team => normalizedName(team.descripcion) === normalizedName(name)) : [];
  // Do not guess nicknames, substrings or ambiguous names, or use an unknown feed ID.
  return named.length === 1 ? named[0] : undefined;
}
