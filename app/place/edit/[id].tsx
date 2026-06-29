import { CameraCapturedPicture, CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { categories, Category } from '../../../src/categories/categories';
import { deleteLocalImage, saveCapturedImage } from '../../../src/files/localImages';
import { CapturedLocation, getCurrentPlaceLocation } from '../../../src/location/currentLocation';
import { getPlaceById, updatePlace } from '../../../src/places/placeRepository';
import { PlaceRecord } from '../../../src/places/placeTypes';
import { parsePlaceRating } from '../../../src/places/placeValidation';
import { colors, spacing } from '../../../src/shared/theme';

type RouteParams = {
  readonly id?: string;
};

export default function EditPlaceScreen(): ReactElement {
  const cameraRef = useRef<CameraView>(null);
  const isMountedRef = useRef<boolean>(false);
  const isTakingPhotoRef = useRef<boolean>(false);
  const params = useLocalSearchParams<RouteParams>();
  const [permission, requestPermission] = useCameraPermissions();
  const [originalPlace, setOriginalPlace] = useState<PlaceRecord | null>(null);
  const [draftCapturedAt, setDraftCapturedAt] = useState<string | null>(null);
  const [draftLocation, setDraftLocation] = useState<CapturedLocation | null>(null);
  const [draftPhotoUri, setDraftPhotoUri] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isRetakingPhoto, setIsRetakingPhoto] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('memory');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [addressLabel, setAddressLabel] = useState<string>('');
  const [ratingText, setRatingText] = useState<string>('');

  useEffect((): (() => void) => {
    isMountedRef.current = true;

    return (): void => {
      isMountedRef.current = false;
      isTakingPhotoRef.current = false;
    };
  }, []);

  useEffect((): void => {
    if (typeof params.id !== 'string') {
      throw new Error('Edit place screen requires a place id route parameter.');
    }

    const place = getPlaceById(params.id);

    setOriginalPlace(place);
    setTitle(place.title);
    setCategoryId(place.categoryId);
    setNotes(place.notes);
    setTags(place.tags);
    setAddressLabel(place.addressLabel);
    setRatingText(place.rating === null ? '' : String(place.rating));
  }, [params.id]);

  const takePhoto = async (): Promise<void> => {
    if (isTakingPhotoRef.current) {
      return;
    }

    if (permission?.granted !== true) {
      const permissionResponse = await requestPermission();

      if (!permissionResponse.granted) {
        Alert.alert('Camera permission needed', 'Enable camera access to retake the place photo.');
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

      setDraftCapturedAt(new Date().toISOString());
      setDraftLocation(location);
      setDraftPhotoUri(photo.uri);
      setIsRetakingPhoto(false);
    } catch (error: unknown) {
      if (!isMountedRef.current) {
        return;
      }

      const message = error instanceof Error ? error.message : 'An unknown error occurred while retaking the photo.';
      Alert.alert('Could not retake photo', message);
    } finally {
      isTakingPhotoRef.current = false;

      if (isMountedRef.current) {
        setIsTakingPhoto(false);
      }
    }
  };

  const savePlace = async (): Promise<void> => {
    if (originalPlace === null) {
      return;
    }

    if (title.trim().length === 0) {
      Alert.alert('Title required', 'Add a title so this place is easy to find later.');
      return;
    }

    if ((draftPhotoUri !== null || draftLocation !== null || draftCapturedAt !== null) && !isCompleteRetake(draftPhotoUri, draftLocation, draftCapturedAt)) {
      Alert.alert('Retake incomplete', 'Retake the photo again so the image, capture time, and current geotag are saved together.');
      return;
    }

    setIsSaving(true);

    try {
      const savedPhotoUri = draftPhotoUri === null ? originalPlace.photoUri : await saveCapturedImage(draftPhotoUri);
      const savedCapturedAt = draftCapturedAt === null ? originalPlace.capturedAt : draftCapturedAt;
      const savedLatitude = draftLocation === null ? originalPlace.latitude : draftLocation.latitude;
      const savedLongitude = draftLocation === null ? originalPlace.longitude : draftLocation.longitude;
      const savedAccuracy = draftLocation === null ? originalPlace.locationAccuracyMeters : draftLocation.accuracyMeters;
      const updatedPlace = updatePlace(originalPlace.id, {
        addressLabel,
        capturedAt: savedCapturedAt,
        categoryId,
        latitude: savedLatitude,
        locationAccuracyMeters: savedAccuracy,
        longitude: savedLongitude,
        notes,
        photoUri: savedPhotoUri,
        rating: parsePlaceRating(ratingText),
        tags,
        title,
        visitDate: originalPlace.visitDate,
      });

      if (draftPhotoUri !== null) {
        await deleteLocalImage(originalPlace.photoUri);
      }

      router.replace(`/place/${updatedPlace.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred while updating the place.';
      Alert.alert('Could not update place', message);
    } finally {
      setIsSaving(false);
    }
  };

  const startPhotoRetake = (): void => {
    setIsCameraReady(false);
    setIsRetakingPhoto(true);
  };

  if (isRetakingPhoto) {
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
          <Text style={styles.cameraTitle}>Retake place photo</Text>
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

  if (originalPlace === null) {
    return (
      <View style={styles.formScreen}>
        <Text style={styles.body}>Loading place...</Text>
      </View>
    );
  }

  const photoUri = draftPhotoUri === null ? originalPlace.photoUri : draftPhotoUri;
  const locationLabel = draftLocation === null ? 'Saved geotag' : 'New geotag captured';

  return (
    <ScrollView contentContainerStyle={styles.formContent} style={styles.formScreen}>
      <Image source={{ uri: photoUri }} style={styles.previewImage} />
      <View style={styles.photoActions}>
        <Text style={styles.locationText}>{locationLabel}</Text>
        <Pressable onPress={startPhotoRetake} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Retake Photo</Text>
        </Pressable>
      </View>

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
      <TextInput multiline onChangeText={setNotes} placeholder="Notes" style={[styles.input, styles.notesInput]} value={notes} />

      <Text style={styles.label}>Tags</Text>
      <TextInput onChangeText={setTags} placeholder="Tags" style={styles.input} value={tags} />

      <Text style={styles.label}>Address Label</Text>
      <TextInput onChangeText={setAddressLabel} placeholder="Manual label" style={styles.input} value={addressLabel} />

      <Text style={styles.label}>Rating</Text>
      <TextInput keyboardType="number-pad" onChangeText={setRatingText} placeholder="1 to 5" style={styles.input} value={ratingText} />

      <View style={styles.formActions}>
        <Pressable onPress={(): void => router.back()} style={styles.secondaryActionButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable disabled={isSaving} onPress={savePlace} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const isCompleteRetake = (photoUri: string | null, location: CapturedLocation | null, capturedAt: string | null): boolean =>
  photoUri !== null && location !== null && capturedAt !== null;

const styles = StyleSheet.create({
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    padding: spacing.lg,
  },
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
  locationText: {
    color: colors.muted,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  photoActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  previewImage: {
    backgroundColor: colors.border,
    borderRadius: 24,
    height: 260,
    marginBottom: spacing.sm,
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
  secondaryActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
    width: 110,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
