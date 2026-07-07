export type Category = {
  readonly color: string;
  readonly id: string;
  readonly label: string;
};

export const categories: readonly Category[] = [
  { color: '#C65F3E', id: 'food', label: 'Food & Cafés' },
  { color: '#3F7D58', id: 'nature', label: 'Nature' },
  { color: '#516A95', id: 'work', label: 'Work Sites' },
  { color: '#9B5E8D', id: 'memory', label: 'Personal Memories' },
  { color: '#C49A3A', id: 'parking', label: 'Parking Spots' },
  { color: '#6E5AA8', id: 'travel', label: 'Travel' },
  { color: '#6D6A62', id: 'important', label: 'Important Locations' },
];

export const getCategoryLabel = (categoryId: string): string => {
  const category = categories.find((item: Category): boolean => item.id === categoryId);

  if (category === undefined) {
    return 'Uncategorized';
  }

  return category.label;
};

export const getCategoryColor = (categoryId: string): string => {
  const category = categories.find((item: Category): boolean => item.id === categoryId);

  return category?.color ?? '#8C8073';
};
