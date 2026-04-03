import { DarkTheme, type Theme } from '@react-navigation/native';

export const theme = {
  colors: {
    accent: '#8FAF54',
    accentStrong: '#C7F36B',
    background: '#070B0D',
    border: '#233039',
    danger: '#FF7257',
    glowMuted: 'rgba(108, 143, 255, 0.10)',
    glowStrong: 'rgba(199, 243, 107, 0.16)',
    gridLine: 'rgba(143, 175, 84, 0.12)',
    overlay: 'rgba(199, 243, 107, 0.08)',
    surface: '#10161B',
    surfaceAccent: '#131D17',
    surfaceStrong: '#161E24',
    surfaceWarning: '#211A11',
    textMuted: '#73828A',
    textPrimary: '#F4F7EF',
    textSecondary: '#A8B2AC',
    warning: '#F5B24B',
  },
  radius: {
    lg: 18,
    md: 14,
    sm: 10,
    xl: 24,
  },
  spacing: {
    lg: 24,
    md: 16,
    sm: 10,
    xl: 32,
    xs: 6,
    xxl: 48,
  },
} as const;

export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    border: theme.colors.border,
    card: theme.colors.surfaceStrong,
    notification: theme.colors.warning,
    primary: theme.colors.accentStrong,
    text: theme.colors.textPrimary,
  },
  dark: true,
};
