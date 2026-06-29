import { useNetworkState } from 'expo-network';

/**
 * True when the device has an active connection with internet access.
 *
 * Reachability is treated as online while it is still being determined
 * (`undefined`) to avoid a flicker on launch, but the feature is hidden as
 * soon as there is no connection or reachability is known to be false.
 */
export const useIsOnline = (): boolean => {
  const networkState = useNetworkState();

  return networkState.isConnected === true && networkState.isInternetReachable !== false;
};
