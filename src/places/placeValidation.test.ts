import { parsePlaceRating } from './placeValidation';

describe('parsePlaceRating', () => {
  it('returns null for an empty string', () => {
    expect(parsePlaceRating('')).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    expect(parsePlaceRating('   ')).toBeNull();
  });

  it.each([1, 2, 3, 4, 5])('parses the valid rating %i', (rating) => {
    expect(parsePlaceRating(String(rating))).toBe(rating);
  });

  it.each(['0', '6', '3.5', 'abc'])('throws for the invalid rating %p', (value) => {
    expect(() => parsePlaceRating(value)).toThrow('Rating must be a whole number from 1 to 5.');
  });
});
