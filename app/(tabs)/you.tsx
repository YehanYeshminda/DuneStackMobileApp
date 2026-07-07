import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listPlaces } from '../../src/places/placeRepository';
import { colors, fonts, spacing } from '../../src/shared/theme';

type HubRow = {
  readonly href: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly subtitle: string;
  readonly title: string;
};

const ROWS: readonly HubRow[] = [
  {
    href: '/collections',
    icon: 'albums-outline',
    subtitle: 'Group places into trips or themes',
    title: 'Collections',
  },
  {
    href: '/gallery',
    icon: 'images-outline',
    subtitle: 'Every photo as a contact sheet',
    title: 'Gallery',
  },
  {
    href: '/settings',
    icon: 'settings-outline',
    subtitle: 'Permissions, export, and backups',
    title: 'Settings',
  },
];

export default function YouScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const [placeCount, setPlaceCount] = useState<number>(0);

  useFocusEffect(
    useCallback((): void => {
      setPlaceCount(listPlaces('').length);
    }, []),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.title}>You</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {ROWS.map((row: HubRow): ReactElement => (
          <Pressable key={row.href} onPress={(): void => router.push(row.href)} style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons color={colors.primary} name={row.icon} size={22} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
            </View>
            <Ionicons color={colors.muted} name="chevron-forward" size={18} />
          </Pressable>
        ))}

        <Text style={styles.footer}>
          {placeCount} {placeCount === 1 ? 'place' : 'places'} · stored only on this device
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  footer: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBody: {
    flex: 1,
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
});
