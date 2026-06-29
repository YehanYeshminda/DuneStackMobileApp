export const parsePlaceRating = (value: string): number | null => {
  if (value.trim().length === 0) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 5) {
    throw new Error('Rating must be a whole number from 1 to 5.');
  }

  return parsedValue;
};
