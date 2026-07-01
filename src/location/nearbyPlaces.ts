import * as Location from 'expo-location';

import { hasCoordinates, LocatedPlace, PlaceRecord } from '../places/placeTypes';

export type NearbyMatch = {
  readonly distanceMeters: number;
  readonly place: LocatedPlace;
};

const NEARBY_THRESHOLD_METERS = 200;
const EARTH_RADIUS_METERS = 6371000;

/**
 * Returns the closest saved place within ~200m of the device's last known
 * position, or null. Never prompts: it only reads location when permission was
 * already granted, and uses the cached fix so opening the app stays instant.
 */
export const findNearbyPlace = async (places: PlaceRecord[]): Promise<NearbyMatch | null> => {
  const permission = await Location.getForegroundPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const current = await Location.getLastKnownPositionAsync();

  if (current === null) {
    return null;
  }

  let best: NearbyMatch | null = null;

  for (const place of places.filter(hasCoordinates)) {
    const distanceMeters = distanceBetween(
      current.coords.latitude,
      current.coords.longitude,
      place.latitude,
      place.longitude,
    );

    if (distanceMeters <= NEARBY_THRESHOLD_METERS && (best === null || distanceMeters < best.distanceMeters)) {
      best = { distanceMeters, place };
    }
  }

  return best;
};

const distanceBetween = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
