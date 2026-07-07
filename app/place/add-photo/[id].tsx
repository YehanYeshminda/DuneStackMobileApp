import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture, CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { ReactElement, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { saveCapturedImage } from '../../../src/files/localImages';
import { addPlacePhotos, listPlacePhotos } from '../../../src/places/placePhotoRepository';

type RouteParams = {
  readonly id?: string;
};

export default function AddPhotoScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<RouteParams>();
  const cameraRef = useRef<CameraView>(null);
  const isBusyRef = useRef<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const placeId = typeof params.id === 'string' ? params.id : null;

  const takePhoto = async (): Promise<void> => {
    if (isBusyRef.current || placeId === null) {
      return;
    }

    if (permission?.granted !== true) {
      const response = await requestPermission();

      if (!response.granted) {
        Alert.alert('Camera permission needed', 'Enable camera access to add a photo.');
        return;
      }
    }

    if (!isCameraReady || cameraRef.current === null) {
      return;
    }

    isBusyRef.current = true;
    setIsSaving(true);

    try {
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });
      const savedUri = await saveCapturedImage(photo.uri);
      const position = listPlacePhotos(placeId).length;

      addPlacePhotos(placeId, [savedUri], position);
      router.back();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while adding the photo.';
      Alert.alert('Could not add photo', message);
    } finally {
      isBusyRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <CameraView
        facing="back"
        onCameraReady={(): void => setIsCameraReady(true)}
        onMountError={(): void => setIsCameraReady(false)}
        ref={cameraRef}
        style={styles.camera}
      />
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable
          accessibilityLabel="Cancel"
          accessibilityRole="button"
          onPress={(): void => router.back()}
          style={styles.closeButton}
        >
          <Ionicons color="#FFFFFF" name="close" size={22} />
        </Pressable>
        <Text style={styles.title}>Add photo</Text>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          accessibilityLabel="Take photo"
          accessibilityRole="button"
          disabled={isSaving || !isCameraReady}
          onPress={takePhoto}
          style={styles.shutter}
        >
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  screen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  shutter: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 4,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  shutterInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  top: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    left: 0,
    paddingHorizontal: 24,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
