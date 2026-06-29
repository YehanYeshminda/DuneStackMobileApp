import * as Location from 'expo-location';

export type CapturedLocation = {
  readonly accuracyMeters: number | null;
  readonly latitude: number;
  readonly longitude: number;
};

const LOCATION_TIMEOUT_MS = 15000;
const LAST_KNOWN_MAX_AGE_MS = 60000;

export const getCurrentPlaceLocation = async (): Promise<CapturedLocation> => {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Location permission was denied. Enable location while using the app to save coordinates with a place.');
  }

  // Fast path: a recent cached fix returns almost instantly.
  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS });

  if (lastKnown !== null) {
    return toCapturedLocation(lastKnown);
  }

  // Slow path: a fresh fix can hang (especially on emulators), so cap the wait.
  const location = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    LOCATION_TIMEOUT_MS,
  );

  return toCapturedLocation(location);
};

const toCapturedLocation = (location: Location.LocationObject): CapturedLocation => ({
  accuracyMeters: location.coords.accuracy,
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
});

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject): void => {
    timeoutHandle = setTimeout((): void => {
      reject(new Error('Could not get a location fix in time. Make sure location is on, then tap Retry location.'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  }
};
