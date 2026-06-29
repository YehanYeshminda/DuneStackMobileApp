import { useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { exportBackup, importBackup } from '../src/backup/backupService';
import {
  AppPermissions,
  AppPermissionState,
  readAppPermissions,
  requestCameraPermission,
  requestLocationPermission,
} from '../src/privacy/permissionStatus';
import { colors, spacing } from '../src/shared/theme';

export default function SettingsScreen(): ReactElement {
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);

  const loadPermissions = useCallback((): void => {
    readAppPermissions()
      .then(setPermissions)
      .catch((error: unknown): void => {
        const message =
          error instanceof Error ? error.message : 'Could not read permission status.';
        Alert.alert('Permission check failed', message);
      });
  }, []);

  useFocusEffect(loadPermissions);

  const requestCamera = async (): Promise<void> => {
    const camera = await requestCameraPermission();
    setPermissions((currentPermissions: AppPermissions | null): AppPermissions | null => {
      if (currentPermissions === null) {
        return currentPermissions;
      }

      return { ...currentPermissions, camera };
    });
  };

  const requestLocation = async (): Promise<void> => {
    const location = await requestLocationPermission();
    setPermissions((currentPermissions: AppPermissions | null): AppPermissions | null => {
      if (currentPermissions === null) {
        return currentPermissions;
      }

      return { ...currentPermissions, location };
    });
  };

  const openDeviceSettings = async (): Promise<void> => {
    await Linking.openSettings();
  };

  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  const handleExport = async (): Promise<void> => {
    setIsBackingUp(true);

    try {
      const result = await exportBackup();

      if (result.placeCount === 0) {
        Alert.alert('Nothing to export', 'Save a place first, then export a backup.');
        return;
      }

      if (!result.shared) {
        Alert.alert(
          'Sharing unavailable',
          'The backup was created but sharing is not available on this device.',
        );
      }
    } catch (error: unknown) {
      Alert.alert('Export failed', describeBackupError(error));
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImport = async (): Promise<void> => {
    setIsBackingUp(true);

    try {
      const result = await importBackup();

      if (result.canceled) {
        return;
      }

      const noun = result.importedCount === 1 ? 'place' : 'places';
      Alert.alert('Import complete', `Restored ${result.importedCount} ${noun}.`);
    } catch (error: unknown) {
      Alert.alert('Import failed', describeBackupError(error));
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Local-only by design</Text>
      <Text style={styles.body}>
        DuneStack Places does not use login, cloud sync, analytics, or remote uploads in this MVP.
      </Text>

      <PermissionCard
        body="Used only when you take a place photo."
        onOpenSettings={openDeviceSettings}
        onRequest={requestCamera}
        permission={permissions?.camera ?? null}
        title="Camera"
      />

      <PermissionCard
        body="Requested while saving a place. No background tracking is implemented."
        onOpenSettings={openDeviceSettings}
        onRequest={requestLocation}
        permission={permissions?.location ?? null}
        title="Location"
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backups</Text>
        <Text style={styles.cardBody}>
          Export all your places to a single file you control, or import one to restore them on this
          device. Imports are additive and never overwrite existing places.
        </Text>
        <View style={styles.backupActions}>
          <Pressable
            disabled={isBackingUp}
            onPress={(): void => {
              void handleExport();
            }}
            style={[styles.permissionButton, styles.backupButton]}
          >
            <Text style={styles.permissionButtonText}>Export backup</Text>
          </Pressable>
          <Pressable
            disabled={isBackingUp}
            onPress={(): void => {
              void handleImport();
            }}
            style={[styles.secondaryButton, styles.backupButton]}
          >
            <Text style={styles.secondaryButtonText}>Import backup</Text>
          </Pressable>
        </View>
        {isBackingUp ? (
          <View style={styles.backupBusy}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.permissionMeta}>Working...</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const describeBackupError = (error: unknown): string => {
  if (error instanceof Error && error.name === 'ZodError') {
    return 'This backup file is not in the expected format.';
  }

  return error instanceof Error ? error.message : 'Something went wrong.';
};

type PermissionCardProps = {
  readonly body: string;
  readonly onOpenSettings: () => Promise<void>;
  readonly onRequest: () => Promise<void>;
  readonly permission: AppPermissionState | null;
  readonly title: string;
};

const PermissionCard = ({
  body,
  onOpenSettings,
  onRequest,
  permission,
  title,
}: PermissionCardProps): ReactElement => {
  const buttonLabel =
    permission?.canAskAgain === false && permission.granted === false
      ? 'Open Settings'
      : 'Request Access';
  const buttonAction =
    permission?.canAskAgain === false && permission.granted === false ? onOpenSettings : onRequest;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View
          style={[
            styles.badge,
            permission?.granted === true ? styles.badgeAllowed : styles.badgeDenied,
          ]}
        >
          <Text
            style={permission?.granted === true ? styles.badgeAllowedText : styles.badgeDeniedText}
          >
            {permission?.label ?? 'Checking'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardBody}>{body}</Text>
      <Text style={styles.permissionMeta}>System status: {permission?.status ?? 'loading'}</Text>
      {permission?.granted !== true ? (
        <Pressable onPress={buttonAction} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>{buttonLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  backupActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  backupBusy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  backupButton: {
    flex: 1,
    marginTop: 0,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeAllowed: {
    backgroundColor: '#E5F4EA',
  },
  badgeAllowedText: {
    color: '#246B3D',
    fontSize: 12,
    fontWeight: '800',
  },
  badgeDenied: {
    backgroundColor: '#F7E8DF',
  },
  badgeDeniedText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  permissionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  permissionMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
});
