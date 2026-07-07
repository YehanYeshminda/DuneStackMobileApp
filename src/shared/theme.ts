import { Platform } from 'react-native';

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

export type AppFonts = {
  readonly serif: string;
};

export const colors: AppColors = {
  accent: '#C2703D',
  background: '#F4EFE6',
  border: '#E6DDCE',
  danger: '#B23A3A',
  muted: '#8C8073',
  primary: '#2A2521',
  surface: '#FFFFFF',
  text: '#2A2521',
};

export const spacing: AppSpacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
};

export const fonts: AppFonts = {
  serif: Platform.select({ android: 'serif', default: 'Georgia', ios: 'Georgia' }),
};
