import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { exportPlacesToFile } from '../src/data/exportPlaces';
import { deleteLocalImage } from '../src/files/localImages';
import {
  AppPermissions,
  readAppPermissions,
  requestCameraPermission,
  requestLocationPermission,
} from '../src/privacy/permissionStatus';
import { deleteAllPlaces, listPlaces } from '../src/places/placeRepository';
import { colors, fonts, spacing } from '../src/shared/theme';

export default function SettingsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);
  const [placeCount, setPlaceCount] = useState<number>(0);
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const load = useCallback((): void => {
    readAppPermissions()
      .then(setPermissions)
      .catch((): void => setPermissions(null));
    setPlaceCount(listPlaces('').length);
  }, []);

  useFocusEffect(load);

  const cameraGranted = permissions?.camera?.granted === true;
  const cameraBlocked =
    permissions?.camera?.granted === false && permissions?.camera?.canAskAgain === false;
  const locationGranted = permissions?.location?.granted === true;

  const handleCamera = (): void => {
    if (cameraGranted) {
      return;
    }

    if (cameraBlocked) {
      void Linking.openSettings();
      return;
    }

    void requestCameraPermission().then((camera): void => {
      setPermissions((current: AppPermissions | null): AppPermissions | null =>
        current === null ? current : { ...current, camera },
      );
    });
  };

  const handleLocationToggle = (next: boolean): void => {
    if (!next) {
      void Linking.openSettings();
      return;
    }

    void requestLocationPermission().then((location): void => {
      setPermissions((current: AppPermissions | null): AppPermissions | null =>
        current === null ? current : { ...current, location },
      );
    });
  };

  const handleExport = async (): Promise<void> => {
    setIsBusy(true);

    try {
      const result = await exportPlacesToFile();

      if (result.count === 0) {
        Alert.alert('Nothing to export', 'Save a place first, then export your data.');
      } else if (!result.shared) {
        Alert.alert(
          'Sharing unavailable',
          'The file was created but sharing is not available here.',
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not export your data.';
      Alert.alert('Export failed', message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleImport = (): void => {
    Alert.alert(
      'Import coming soon',
      'Restoring from a backup file is not available on this build yet.',
    );
  };

  const confirmErase = (): void => {
    Alert.alert(
      'Erase all places?',
      'This permanently deletes every place and photo on this device.',
      [
        { style: 'cancel', text: 'Cancel' },
        { onPress: eraseAll, style: 'destructive', text: 'Erase all' },
      ],
    );
  };

  const eraseAll = async (): Promise<void> => {
    setIsBusy(true);

    try {
      const places = listPlaces('');

      for (const place of places) {
        await deleteLocalImage(place.photoUri);
      }

      deleteAllPlaces();
      setPlaceCount(0);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not erase places.';
      Alert.alert('Erase failed', message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}
    >
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={(): void => router.back()}
        style={styles.backButton}
      >
        <Ionicons color={colors.text} name="chevron-back" size={20} />
      </Pressable>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionLabel}>PERMISSIONS</Text>

      <View style={styles.row}>
        <Ionicons color={colors.text} name="camera-outline" size={22} />
        <Text style={styles.rowLabel}>Camera</Text>
        <Pressable disabled={cameraGranted} onPress={handleCamera} style={styles.statusPill}>
          <Text style={styles.statusPillText}>
            {cameraGranted ? 'Allowed' : cameraBlocked ? 'Open Settings' : 'Enable'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.row, styles.rowDivider]}>
        <Ionicons color={colors.accent} name="location-outline" size={22} />
        <Text style={styles.rowLabel}>Location</Text>
        <Switch
          onValueChange={handleLocationToggle}
          thumbColor="#FFFFFF"
          trackColor={{ false: colors.border, true: colors.accent }}
          value={locationGranted}
        />
      </View>
      <Text style={styles.rowSubtext}>
        Used only when capturing a place. Off means places save without GPS.
      </Text>

      <Text style={styles.sectionLabel}>YOUR DATA</Text>

      <DataRow
        onPress={(): void => {
          void handleExport();
        }}
        subtitle="Save everything as a file you control"
        title="Export data"
      />
      <DataRow
        onPress={handleImport}
        subtitle="Restore from a previously exported file"
        title="Import data"
      />
      <DataRow danger onPress={confirmErase} title="Erase all places" />

      <Text style={styles.footer}>
        {placeCount} {placeCount === 1 ? 'place' : 'places'} · stored only on this device
      </Text>

      {isBusy ? <Text style={styles.busy}>Working…</Text> : null}
    </ScrollView>
  );
}

type DataRowProps = {
  readonly danger?: boolean;
  readonly onPress: () => void;
  readonly subtitle?: string;
  readonly title: string;
};

const DataRow = ({ danger, onPress, subtitle, title }: DataRowProps): ReactElement => (
  <Pressable onPress={onPress} style={[styles.row, styles.rowDivider]}>
    <View style={styles.dataRowBody}>
      <Text style={danger === true ? styles.dataRowTitleDanger : styles.dataRowTitle}>{title}</Text>
      {subtitle !== undefined ? <Text style={styles.rowSubtext}>{subtitle}</Text> : null}
    </View>
    <Ionicons color={colors.muted} name="chevron-forward" size={18} />
  </Pressable>
);

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 36,
  },
  busy: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  dataRowBody: {
    flex: 1,
  },
  dataRowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  dataRowTitleDanger: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  rowLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  rowSubtext: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    paddingBottom: spacing.sm,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  statusPill: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusPillText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
});
