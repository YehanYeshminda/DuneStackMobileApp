import { Platform } from 'react-native';

import { PlaceRecord } from '../places/placeTypes';

export type MapPlatform = 'android' | 'ios' | 'web' | 'windows' | 'macos';

export const createExternalMapsUrl = (place: PlaceRecord, platform: MapPlatform): string => {
  const coordinates = `${place.latitude},${place.longitude}`;
  const label = encodeURIComponent(place.title);

  if (platform === 'android') {
    return `geo:0,0?q=${coordinates}(${label})`;
  }

  if (platform === 'ios') {
    return `maps://?ll=${coordinates}&q=${label}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${coordinates}`;
};

export const getCurrentMapsUrl = (place: PlaceRecord): string =>
  createExternalMapsUrl(place, Platform.OS);
