export const LIBERIA_COUNTIES = [
  'Bomi',
  'Bong',
  'Gbarpolu',
  'Grand Bassa',
  'Grand Cape Mount',
  'Grand Gedeh',
  'Grand Kru',
  'Lofa',
  'Margibi',
  'Maryland',
  'Montserrado',
  'Nimba',
  'River Cess',
  'River Gee',
  'Sinoe',
] as const;

export type LiberiaCounty = (typeof LIBERIA_COUNTIES)[number];

/** Formats a set of selected counties into the free-text convention already used across the catalogue (e.g. "Montserrado, Bong, Nimba counties"). */
export function formatGeographicCoverage(selected: string[]): string {
  if (selected.length === 0 || selected.includes('National')) return 'National';
  if (selected.length === 1) return `${selected[0]} County`;
  return `${selected.join(', ')} counties`;
}

/** Best-effort reverse of formatGeographicCoverage, for pre-filling the picker when editing existing content. */
export function parseGeographicCoverage(value: string): string[] {
  if (!value || value.toLowerCase().startsWith('national')) return ['National'];
  return LIBERIA_COUNTIES.filter((county) => value.includes(county));
}
