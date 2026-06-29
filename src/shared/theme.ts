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
  accent: '#2C7A7B',
  background: '#F4F7FA',
  border: '#DCE4EC',
  danger: '#C0392B',
  muted: '#5C6B7A',
  primary: '#1F3A5F',
  surface: '#FFFFFF',
  text: '#16202B',
};

export const spacing: AppSpacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
};
