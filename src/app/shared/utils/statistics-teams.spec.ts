import { findStatisticsTeam, statisticsTeams } from './statistics-teams';

describe('Historical team lookup from recommendation links', () => {
  const teams = [{id: 'h', descripcion: 'Sport Huancayo'}, {id: 'a', descripcion: 'Alianza Atlético'}];
  it('resolves the supplied Peru link without IDs despite the accent difference', () => {
    expect(findStatisticsTeam(teams, undefined, 'Sport Huancayo')?.id).toBe('h');
    expect(findStatisticsTeam(teams, undefined, 'Alianza Atletico')?.id).toBe('a');
  });
  it('accepts case and whitespace differences without changing canonical names', () => {
    expect(findStatisticsTeam(teams, '', '  ALIANZA   atletico ')?.descripcion).toBe('Alianza Atlético');
  });
  it('uses a known historical ID and falls back to the name for an unknown feed ID', () => {
    expect(findStatisticsTeam(teams, 'h', 'Sport Huancayo')?.id).toBe('h');
    expect(findStatisticsTeam(teams, 'feed-999', 'Alianza Atletico')?.id).toBe('a');
  });
  it('does not resolve unknown, partial or ambiguous names', () => {
    expect(findStatisticsTeam(teams, 'feed-999', 'Unknown')).toBeUndefined();
    expect(findStatisticsTeam(teams, '', 'Alianza')).toBeUndefined();
    expect(findStatisticsTeam([...teams, {id: 'other', descripcion: 'Alianza Atletico'}], '', 'Alianza Atletico')).toBeUndefined();
  });
  it('includes a team even if it has only played in the opposite historical venue', () => {
    expect(statisticsTeams([teams[1]], [teams[0], teams[1]])).toEqual([teams[1], teams[0]]);
  });
  it('does not add entries without an identity', () => {
    expect(statisticsTeams([{id: undefined, descripcion: 'Missing'}], [])).toEqual([]);
  });
});
