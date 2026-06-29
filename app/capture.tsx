import { CameraCapturedPicture, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { categories, Category } from '../src/categories/categories';
import { saveCapturedImage } from '../src/files/localImages';
import { CapturedLocation, getCurrentPlaceLocation } from '../src/location/currentLocation';
import { createPlace } from '../src/places/placeRepository';
import { parsePlaceRating } from '../src/places/placeValidation';
import { colors, spacing } from '../src/shared/theme';

export default function CaptureScreen(): ReactElement {
  const cameraRef = useRef<CameraView>(null);
  const isMountedRef = useRef<boolean>(false);
  const isTakingPhotoRef = useRef<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<CapturedLocation | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('memory');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [addressLabel, setAddressLabel] = useState<string>('');
  const [ratingText, setRatingText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect((): (() => void) => {
    isMountedRef.current = true;

    return (): void => {
      isMountedRef.current = false;
      isTakingPhotoRef.current = false;
    };
  }, []);

  const takePhoto = async (): Promise<void> => {
    if (isTakingPhotoRef.current) {
      return;
    }

    if (permission?.granted !== true) {
      const permissionResponse = await requestPermission();

      if (!permissionResponse.granted) {
        Alert.alert('Camera permission needed', 'Enable camera access to take a place photo.');
        return;
      }
    }

    if (!isCameraReady) {
      Alert.alert('Camera is still loading', 'Wait until the camera preview is ready, then take the photo.');
      return;
    }

    if (cameraRef.current === null) {
      Alert.alert('Camera unavailable', 'The camera preview is not available. Reopen this screen and try again.');
      return;
    }

    isTakingPhotoRef.current = true;
    setIsTakingPhoto(true);

    try {
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });
      const location = await getCurrentPlaceLocation();

      if (!isMountedRef.current) {
        return;
      }

      setCapturedAt(new Date().toISOString());
      setCapturedLocation(location);
      setCapturedPhotoUri(photo.uri);
    } catch (error: unknown) {
      if (!isMountedRef.current) {
        return;
      }

      const message = error instanceof Error ? error.message : 'An unknown error occurred while taking the photo.';
      Alert.alert('Could not take photo', message);
    } finally {
      isTakingPhotoRef.current = false;

      if (isMountedRef.current) {
        setIsTakingPhoto(false);
      }
    }
  };

  const savePlace = async (): Promise<void> => {
    if (capturedPhotoUri === null) {
      Alert.alert('Photo required', 'Take a photo before saving this place.');
      return;
    }

    if (capturedLocation === null) {
      Alert.alert('Location required', 'Retake the photo so the app can save the current geotag with it.');
      return;
    }

    if (capturedAt === null) {
      Alert.alert('Capture time required', 'Retake the photo so the app can save the capture time with it.');
      return;
    }

    if (title.trim().length === 0) {
      Alert.alert('Title required', 'Add a title so this place is easy to find later.');
      return;
    }

    setIsSaving(true);

    try {
      const savedPhotoUri = await saveCapturedImage(capturedPhotoUri);
      const savedPlace = createPlace({
        addressLabel,
        capturedAt,
        categoryId,
        latitude: capturedLocation.latitude,
        locationAccuracyMeters: capturedLocation.accuracyMeters,
        longitude: capturedLocation.longitude,
        notes,
        photoUri: savedPhotoUri,
        rating: parsePlaceRating(ratingText),
        tags,
        title,
        visitDate: '',
      });

      router.replace(`/place/${savedPlace.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred while saving the place.';
      Alert.alert('Could not save place', message);
    } finally {
      setIsSaving(false);
    }
  };

  const clearCapturedPhoto = (): void => {
    setCapturedAt(null);
    setCapturedPhotoUri(null);
    setCapturedLocation(null);
  };

  if (capturedPhotoUri === null) {
    return (
      <View style={styles.cameraScreen}>
        <CameraView
          facing="back"
          onCameraReady={(): void => setIsCameraReady(true)}
          onMountError={(): void => setIsCameraReady(false)}
          ref={cameraRef}
          style={styles.camera}
        />
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraTitle}>Frame the place</Text>
          <Pressable
            disabled={isTakingPhoto || !isCameraReady}
            onPress={takePhoto}
            style={[styles.captureButton, isTakingPhoto || !isCameraReady ? styles.captureButtonDisabled : styles.captureButtonReady]}
          >
            <Text style={styles.captureButtonText}>{isTakingPhoto ? 'Taking Photo...' : 'Take Photo'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.formContent} style={styles.formScreen}>
      <Image source={{ uri: capturedPhotoUri }} style={styles.previewImage} />

      <Text style={styles.label}>Title</Text>
      <TextInput onChangeText={setTitle} placeholder="e.g. Sunset coffee stop" style={styles.input} value={title} />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map((category: Category): ReactElement => (
          <Pressable
            key={category.id}
            onPress={(): void => setCategoryId(category.id)}
            style={[styles.categoryPill, categoryId === category.id ? styles.categoryPillActive : styles.categoryPillIdle]}
          >
            <Text style={categoryId === category.id ? styles.categoryTextActive : styles.categoryTextIdle}>{category.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        multiline
        onChangeText={setNotes}
        placeholder="What should future-you remember?"
        style={[styles.input, styles.notesInput]}
        value={notes}
      />

      <Text style={styles.label}>Tags</Text>
      <TextInput onChangeText={setTags} placeholder="quiet, client, family..." style={styles.input} value={tags} />

      <Text style={styles.label}>Address Label</Text>
      <TextInput onChangeText={setAddressLabel} placeholder="Manual label, no online lookup" style={styles.input} value={addressLabel} />

      <Text style={styles.label}>Rating</Text>
      <TextInput keyboardType="number-pad" onChangeText={setRatingText} placeholder="1 to 5" style={styles.input} value={ratingText} />

      <View style={styles.formActions}>
        <Pressable onPress={(): void => clearCapturedPhoto()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Retake</Text>
        </Pressable>
        <Pressable disabled={isSaving} onPress={savePlace} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Place'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    bottom: spacing.xl,
    gap: spacing.md,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  cameraScreen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  cameraTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  captureButton: {
    alignItems: 'center',
    borderRadius: 22,
    padding: spacing.md,
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.64)',
  },
  captureButtonReady: {
    backgroundColor: '#FFFFFF',
  },
  captureButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryTextIdle: {
    color: colors.text,
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  formContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  formScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  previewImage: {
    backgroundColor: colors.border,
    borderRadius: 24,
    height: 260,
    marginBottom: spacing.lg,
    width: '100%',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flex: 1,
    padding: spacing.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
    width: 110,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
