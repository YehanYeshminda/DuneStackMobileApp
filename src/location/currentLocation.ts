import * as Location from 'expo-location';

export type CapturedLocation = {
  readonly accuracyMeters: number | null;
  readonly latitude: number;
  readonly longitude: number;
};

export const getCurrentPlaceLocation = async (): Promise<CapturedLocation> => {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Location permission was denied. Enable location while using the app to save coordinates with a place.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    accuracyMeters: location.coords.accuracy,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};
