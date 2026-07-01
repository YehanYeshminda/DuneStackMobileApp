import { PlaceRecord } from './placeTypes';

export type OnThisDayMatch = {
  readonly place: PlaceRecord;
  readonly yearsAgo: number;
};

/**
 * Finds a place captured on this same month/day in a previous year, preferring
 * the most recent one. Returns null when nothing was saved on this date before.
 */
export const findOnThisDay = (
  places: PlaceRecord[],
  now: Date = new Date(),
): OnThisDayMatch | null => {
  const matches = places
    .map((place: PlaceRecord): { place: PlaceRecord; date: Date } => ({
      date: new Date(place.capturedAt),
      place,
    }))
    .filter(
      ({ date }: { date: Date }): boolean =>
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate() &&
        date.getFullYear() < now.getFullYear(),
    )
    .map(
      ({ date, place }: { date: Date; place: PlaceRecord }): OnThisDayMatch => ({
        place,
        yearsAgo: now.getFullYear() - date.getFullYear(),
      }),
    )
    .sort((a: OnThisDayMatch, b: OnThisDayMatch): number => a.yearsAgo - b.yearsAgo);

  return matches[0] ?? null;
};
