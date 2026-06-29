export type AppColors = {
  readonly accent: string;
  readonly background: string;
  readonly border: string;
  readonly danger: string;
  readonly muted: string;
  readonly primary: string;
  readonly surface: string;
  readonly text: string;
};

export type AppSpacing = {
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
};

export const colors: AppColors = {
  accent: '#B46A3C',
  background: '#F7F2EA',
  border: '#E1D4C5',
  danger: '#B93232',
  muted: '#756454',
  primary: '#4B3428',
  surface: '#FFFDF8',
  text: '#24170F',
};

export const spacing: AppSpacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
};
