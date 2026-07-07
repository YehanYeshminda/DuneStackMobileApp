import { requireOptionalNativeModule } from 'expo';

/**
 * True only when the expo-maps native module is present in the running build.
 *
 * expo-maps ships with development and production builds but not Expo Go, so
 * this lets us hide the map feature gracefully instead of crashing when the
 * native module is missing. `requireOptionalNativeModule` returns `null`
 * (rather than throwing) when the module is absent.
 */
export const isMapsSupported = (): boolean => requireOptionalNativeModule('ExpoMaps') !== null;
