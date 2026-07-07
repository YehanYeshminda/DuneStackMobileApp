import { PlaceRecord } from './placeTypes';

export type PlaceSection = {
  readonly data: PlaceRecord[];
  readonly key: string;
  readonly title: string;
};

/** Groups places into month sections, newest month first. */
export const groupPlacesByMonth = (places: PlaceRecord[]): PlaceSection[] =>
  groupPlaces(places, monthKeyOf, monthTitleOf);

/** Groups places into year sections, newest year first. */
export const groupPlacesByYear = (places: PlaceRecord[]): PlaceSection[] =>
  groupPlaces(places, yearKeyOf, (key: string): string => key);

const groupPlaces = (
  places: PlaceRecord[],
  keyOf: (iso: string) => string,
  titleOf: (key: string) => string,
): PlaceSection[] => {
  const groups = new Map<string, PlaceRecord[]>();

  for (const place of places) {
    const key = keyOf(place.capturedAt);
    const existing = groups.get(key);

    if (existing === undefined) {
      groups.set(key, [place]);
    } else {
      existing.push(place);
    }
  }

  return Array.from(groups.entries())
    .sort((a: [string, PlaceRecord[]], b: [string, PlaceRecord[]]): number =>
      a[0] < b[0] ? 1 : -1,
    )
    .map(([key, data]: [string, PlaceRecord[]]): PlaceSection => ({
      data: [...data].sort((x: PlaceRecord, y: PlaceRecord): number =>
        x.capturedAt < y.capturedAt ? 1 : -1,
      ),
      key,
      title: titleOf(key),
    }));
};

const monthKeyOf = (iso: string): string => {
  const date = new Date(iso);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const monthTitleOf = (key: string): string => {
  const [year, month] = key.split('-');

  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
};

const yearKeyOf = (iso: string): string => `${new Date(iso).getFullYear()}`;
