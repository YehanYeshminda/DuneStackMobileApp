import { useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppPermissions,
  AppPermissionState,
  readAppPermissions,
  requestCameraPermission,
  requestLocationPermission,
} from '../../src/privacy/permissionStatus';
import { colors, spacing } from '../../src/shared/theme';

export default function SettingsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
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

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
      style={styles.screen}
    >
      <Text style={styles.eyebrow}>App</Text>
      <Text style={styles.heading}>Settings</Text>
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
          Manual export and import are planned next, keeping control in the user&apos;s hands.
        </Text>
      </View>
    </ScrollView>
  );
}

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
    backgroundColor: '#FBE7E4',
  },
  badgeDeniedText: {
    color: colors.danger,
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: spacing.sm,
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
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
