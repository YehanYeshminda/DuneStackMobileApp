import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../src/shared/theme';

type TabIconProps = {
  readonly color: string;
  readonly size: number;
};

export default function TabsLayout(): ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }: TabIconProps): ReactElement => (
            <Ionicons color={color} name="albums-outline" size={size} />
          ),
          title: 'Feed',
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          tabBarIcon: ({ color, size }: TabIconProps): ReactElement => (
            <Ionicons color={color} name="time-outline" size={size} />
          ),
          title: 'Timeline',
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          tabBarButton: (): ReactElement => <AddButton />,
          title: '',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ color, size }: TabIconProps): ReactElement => (
            <Ionicons color={color} name="map-outline" size={size} />
          ),
          title: 'Map',
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          tabBarIcon: ({ color, size }: TabIconProps): ReactElement => (
            <Ionicons color={color} name="person-outline" size={size} />
          ),
          title: 'You',
        }}
      />
    </Tabs>
  );
}

const AddButton = (): ReactElement => (
  <View style={styles.addSlot}>
    <Pressable
      accessibilityLabel="Add a place"
      accessibilityRole="button"
      onPress={(): void => router.push('/capture')}
      style={styles.addButton}
    >
      <Ionicons color="#FFFFFF" name="add" size={30} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  addSlot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
