import { Camera } from 'expo-camera';
import * as Location from 'expo-location';

export type AppPermissionState = {
  readonly canAskAgain: boolean;
  readonly granted: boolean;
  readonly label: string;
  readonly status: string;
};

export type AppPermissions = {
  readonly camera: AppPermissionState;
  readonly location: AppPermissionState;
};

export const readAppPermissions = async (): Promise<AppPermissions> => {
  const [cameraPermission, locationPermission] = await Promise.all([
    Camera.getCameraPermissionsAsync(),
    Location.getForegroundPermissionsAsync(),
  ]);

  return {
    camera: {
      canAskAgain: cameraPermission.canAskAgain,
      granted: cameraPermission.granted,
      label: toPermissionLabel(cameraPermission.granted, cameraPermission.status),
      status: cameraPermission.status,
    },
    location: {
      canAskAgain: locationPermission.canAskAgain,
      granted: locationPermission.granted,
      label: toPermissionLabel(locationPermission.granted, locationPermission.status),
      status: locationPermission.status,
    },
  };
};

export const requestCameraPermission = async (): Promise<AppPermissionState> => {
  const permission = await Camera.requestCameraPermissionsAsync();

  return {
    canAskAgain: permission.canAskAgain,
    granted: permission.granted,
    label: toPermissionLabel(permission.granted, permission.status),
    status: permission.status,
  };
};

export const requestLocationPermission = async (): Promise<AppPermissionState> => {
  const permission = await Location.requestForegroundPermissionsAsync();

  return {
    canAskAgain: permission.canAskAgain,
    granted: permission.granted,
    label: toPermissionLabel(permission.granted, permission.status),
    status: permission.status,
  };
};

const toPermissionLabel = (granted: boolean, status: string): string => {
  if (granted) {
    return 'Allowed';
  }

  if (status === 'denied') {
    return 'Denied';
  }

  return 'Not requested';
};
