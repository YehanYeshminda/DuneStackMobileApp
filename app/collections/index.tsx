import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createCollection,
  listCollectionSummaries,
} from '../../src/collections/collectionRepository';
import { CollectionSummary } from '../../src/collections/collectionTypes';
import { colors, fonts, spacing } from '../../src/shared/theme';

export default function CollectionsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [name, setName] = useState<string>('');

  const load = useCallback((): void => {
    setCollections(listCollectionSummaries());
  }, []);

  useFocusEffect(load);

  const submit = (): void => {
    if (name.trim().length === 0) {
      return;
    }

    createCollection(name);
    setName('');
    setIsCreating(false);
    load();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={(): void => router.back()}
        style={styles.backButton}
      >
        <Ionicons color={colors.text} name="chevron-back" size={20} />
      </Pressable>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Collections</Text>
        <Pressable
          accessibilityLabel="New collection"
          accessibilityRole="button"
          onPress={(): void => setIsCreating(true)}
          style={styles.addButton}
        >
          <Ionicons color="#FFFFFF" name="add" size={22} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {collections.length === 0 ? (
          <Text style={styles.empty}>No collections yet. Group places into a trip or a theme.</Text>
        ) : null}
        {collections.map((collection: CollectionSummary): ReactElement => (
          <Pressable
            key={collection.id}
            onPress={(): void => router.push(`/collections/${collection.id}`)}
            style={styles.card}
          >
            <View style={styles.cover}>
              {collection.coverPhotoUri !== null ? (
                <Image source={{ uri: collection.coverPhotoUri }} style={styles.coverImage} />
              ) : (
                <Text style={styles.coverPlaceholder}>No photos yet</Text>
              )}
              <View style={styles.coverOverlay}>
                <Text style={styles.coverName}>{collection.name}</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {collection.placeCount} {collection.placeCount === 1 ? 'place' : 'places'}
              {collection.dateSpan !== null ? ` · ${collection.dateSpan}` : ''}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={(): void => setIsCreating(false)}
        transparent
        visible={isCreating}
      >
        <Pressable onPress={(): void => setIsCreating(false)} style={styles.modalBackdrop}>
          <Pressable onPress={(): void => undefined} style={styles.modalCard}>
            <Text style={styles.modalTitle}>New collection</Text>
            <TextInput
              autoFocus
              onChangeText={setName}
              placeholder="e.g. Portugal, 2025"
              placeholderTextColor={colors.muted}
              style={styles.modalInput}
              value={name}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={(): void => setIsCreating(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submit} style={styles.modalCreate}>
                <Text style={styles.modalCreateText}>Create</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    width: 36,
  },
  card: {
    marginBottom: spacing.lg,
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  cover: {
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 18,
    height: 150,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  coverName: {
    color: '#FFFFFF',
    fontFamily: fonts.serif,
    fontSize: 22,
  },
  coverOverlay: {
    backgroundColor: 'rgba(42, 37, 33, 0.32)',
    bottom: 0,
    left: 0,
    padding: spacing.md,
    position: 'absolute',
    right: 0,
  },
  coverPlaceholder: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(42, 37, 33, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCancel: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalCancelText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    width: '100%',
  },
  modalCreate: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  modalCreateText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 30,
    fontWeight: '800',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
