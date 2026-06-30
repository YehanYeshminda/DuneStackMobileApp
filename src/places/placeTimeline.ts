import { PlaceRecord } from './placeTypes';

export type PlaceSection = {
  readonly data: PlaceRecord[];
  readonly monthKey: string;
  readonly title: string;
};

/**
 * Groups places into month sections, newest month first and newest place first
 * within each month. Grouping is by `capturedAt` (when the place was recorded).
 */
export const groupPlacesByMonth = (places: PlaceRecord[]): PlaceSection[] => {
  const groups = new Map<string, PlaceRecord[]>();

  for (const place of places) {
    const monthKey = toMonthKey(place.capturedAt);
    const existing = groups.get(monthKey);

    if (existing === undefined) {
      groups.set(monthKey, [place]);
    } else {
      existing.push(place);
    }
  }

  return Array.from(groups.entries())
    .sort((a: [string, PlaceRecord[]], b: [string, PlaceRecord[]]): number =>
      a[0] < b[0] ? 1 : -1,
    )
    .map(
      ([monthKey, data]: [string, PlaceRecord[]]): PlaceSection => ({
        data: [...data].sort((a: PlaceRecord, b: PlaceRecord): number =>
          a.capturedAt < b.capturedAt ? 1 : -1,
        ),
        monthKey,
        title: formatMonthTitle(monthKey),
      }),
    );
};

const toMonthKey = (iso: string): string => {
  const date = new Date(iso);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthTitle = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};
