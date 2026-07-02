import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ReactElement, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categories, Category } from '../src/categories/categories';
import { saveCapturedImage } from '../src/files/localImages';
import { CapturedLocation, getCurrentPlaceLocation } from '../src/location/currentLocation';
import { createPlace } from '../src/places/placeRepository';
import { colors, spacing } from '../src/shared/theme';

export default function CaptureScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const isMountedRef = useRef<boolean>(false);
  const isTakingPhotoRef = useRef<boolean>(false);
  const hasRequestedLocationRef = useRef<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<CapturedLocation | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('memory');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [rating, setRating] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect((): (() => void) => {
    isMountedRef.current = true;

    return (): void => {
      isMountedRef.current = false;
      isTakingPhotoRef.current = false;
    };
  }, []);

  const fetchCurrentLocation = async (): Promise<void> => {
    setIsLocating(true);

    try {
      const location = await getCurrentPlaceLocation();

      if (isMountedRef.current) {
        setCapturedLocation(location);
      }
    } catch {
      if (isMountedRef.current) {
        setCapturedLocation(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLocating(false);
      }
    }
  };

  const handleCameraReady = (): void => {
    setIsCameraReady(true);

    // Start locating while the user frames the shot, so the fix is usually
    // ready by the time they reach the details sheet.
    if (!hasRequestedLocationRef.current) {
      hasRequestedLocationRef.current = true;
      void fetchCurrentLocation();
    }
  };

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

    if (!isCameraReady || cameraRef.current === null) {
      Alert.alert('Camera is still loading', 'Wait until the preview is ready, then try again.');
      return;
    }

    isTakingPhotoRef.current = true;
    setIsTakingPhoto(true);

    try {
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      if (!isMountedRef.current) {
        return;
      }

      setCapturedAt(new Date().toISOString());
      setCapturedPhotoUri(photo.uri);
    } catch (error: unknown) {
      if (!isMountedRef.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'An unknown error occurred while taking the photo.';
      Alert.alert('Could not take photo', message);
    } finally {
      isTakingPhotoRef.current = false;

      if (isMountedRef.current) {
        setIsTakingPhoto(false);
      }
    }
  };

  const savePlace = async (): Promise<void> => {
    if (capturedPhotoUri === null || capturedAt === null) {
      Alert.alert('Photo required', 'Take a photo before saving this place.');
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
        addressLabel: '',
        capturedAt,
        categoryId,
        isFavorite,
        latitude: capturedLocation?.latitude ?? null,
        locationAccuracyMeters: capturedLocation?.accuracyMeters ?? null,
        longitude: capturedLocation?.longitude ?? null,
        notes,
        photoUri: savedPhotoUri,
        rating,
        tags,
        title,
        visitDate: '',
      });

      router.replace(`/place/${savedPlace.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unknown error occurred while saving the place.';
      Alert.alert('Could not save place', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (capturedPhotoUri === null) {
    return (
      <View style={styles.cameraScreen}>
        <CameraView
          facing="back"
          onCameraReady={handleCameraReady}
          onMountError={(): void => setIsCameraReady(false)}
          ref={cameraRef}
          style={styles.camera}
        />
        <View style={[styles.cameraTop, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            accessibilityLabel="Close camera"
            accessibilityRole="button"
            onPress={(): void => router.back()}
            style={styles.closeButton}
          >
            <Ionicons color="#FFFFFF" name="close" size={22} />
          </Pressable>
          <LocationPill dark hasLocation={capturedLocation !== null} isLocating={isLocating} onRetry={fetchCurrentLocation} />
        </View>
        <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Pressable
            accessibilityLabel="Take photo"
            accessibilityRole="button"
            disabled={isTakingPhoto || !isCameraReady}
            onPress={takePhoto}
            style={styles.shutter}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.formScreen}>
      <View style={[styles.formHeader, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={(): void => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.formTitle}>New Place</Text>
        <Pressable disabled={isSaving} onPress={savePlace}>
          <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={{ uri: capturedPhotoUri }} style={styles.photo} />

        <View style={styles.pillRow}>
          <LocationPill hasLocation={capturedLocation !== null} isLocating={isLocating} onRetry={fetchCurrentLocation} />
        </View>

        <Text style={styles.label}>TITLE</Text>
        <TextInput
          onChangeText={setTitle}
          placeholder="e.g. Blue Bottle, Hayes"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={title}
        />

        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category: Category): ReactElement => {
            const isActive = categoryId === category.id;

            return (
              <Pressable
                key={category.id}
                onPress={(): void => setCategoryId(category.id)}
                style={[styles.pill, isActive ? styles.pillActive : styles.pillIdle]}
              >
                <Text style={isActive ? styles.pillTextActive : styles.pillTextIdle}>
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>RATING</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((value: number): ReactElement => {
            const isFilled = rating !== null && value <= rating;

            return (
              <Pressable
                hitSlop={6}
                key={value}
                onPress={(): void => setRating(rating === value ? null : value)}
              >
                <Ionicons
                  color={isFilled ? colors.accent : colors.border}
                  name={isFilled ? 'star' : 'star-outline'}
                  size={30}
                />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>NOTES</Text>
        <TextInput
          multiline
          onChangeText={setNotes}
          placeholder="What should future-you remember?"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.notesInput]}
          value={notes}
        />

        <Text style={styles.label}>TAGS</Text>
        <TextInput
          onChangeText={setTags}
          placeholder="#pourover #morning"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={tags}
        />

        <View style={styles.favoriteRow}>
          <View style={styles.favoriteLabel}>
            <Ionicons color={colors.accent} name="heart" size={18} />
            <Text style={styles.favoriteText}>Mark as favorite</Text>
          </View>
          <Switch
            onValueChange={setIsFavorite}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.border, true: colors.accent }}
            value={isFavorite}
          />
        </View>
      </ScrollView>
    </View>
  );
}

type LocationPillProps = {
  readonly dark?: boolean;
  readonly hasLocation: boolean;
  readonly isLocating: boolean;
  readonly onRetry: () => void;
};

const LocationPill = ({ dark, hasLocation, isLocating, onRetry }: LocationPillProps): ReactElement => {
  const label = isLocating ? 'Locating…' : hasLocation ? 'Location added' : 'Add location';
  const tint = dark === true ? '#FFFFFF' : colors.accent;

  return (
    <Pressable
      disabled={isLocating || hasLocation}
      onPress={(): void => {
        void onRetry();
      }}
      style={[styles.locationPill, dark === true ? styles.locationPillDark : styles.locationPillLight]}
    >
      {isLocating ? (
        <ActivityIndicator color={tint} size="small" />
      ) : (
        <Ionicons color={tint} name="location" size={14} />
      )}
      <Text style={[styles.locationPillText, { color: tint }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  cameraBottom: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  cameraScreen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  cameraTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  favoriteLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  favoriteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  favoriteText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  formContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  formHeader: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  formScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  formTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    padding: spacing.md,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  locationPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  locationPillDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  locationPillLight: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  locationPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  photo: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    width: '100%',
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  pillRow: {
    marginTop: spacing.md,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillTextIdle: {
    color: colors.text,
    fontWeight: '700',
  },
  saveText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
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
  stars: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
