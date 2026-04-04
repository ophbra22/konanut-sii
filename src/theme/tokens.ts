export type ThemeMode = 'dark' | 'light';

export type AppTheme = {
  colors: {
    accent: string;
    accentBorder: string;
    accentStrong: string;
    background: string;
    backgroundDeep: string;
    border: string;
    borderSoft: string;
    borderStrong: string;
    card: string;
    cardOutline: string;
    cardOutlineStrong: string;
    chipBackground: string;
    danger: string;
    dangerBorder: string;
    dangerSurface: string;
    focusRing: string;
    glassSurface: string;
    glassSurfaceStrong: string;
    glowMuted: string;
    glowStrong: string;
    gridLine: string;
    heroOverlay: string;
    highlightOverlay: string;
    info: string;
    infoBorder: string;
    infoSurface: string;
    inputBackground: string;
    inverseText: string;
    mediaGlow: string;
    mutedBlue: string;
    overlay: string;
    primary: string;
    primaryStrong: string;
    separator: string;
    separatorStrong: string;
    shadow: string;
    shadowStrong: string;
    statusOpenSurface: string;
    statusResolvedSurface: string;
    success: string;
    successSurface: string;
    surface: string;
    surfaceAccent: string;
    surfaceDanger: string;
    surfaceElevated: string;
    surfaceInfo: string;
    surfaceMuted: string;
    surfaceStrong: string;
    surfaceTeal: string;
    surfaceWarning: string;
    tabBarActive: string;
    tabBarBackground: string;
    tabBarBorder: string;
    tabBarInactive: string;
    teal: string;
    tealBorder: string;
    textBadge: string;
    textDim: string;
    textMuted: string;
    textOnMediaSecondary: string;
    textPrimary: string;
    textSecondary: string;
    warning: string;
    warningBorder: string;
    warningSurface: string;
  };
  elevation: {
    card: {
      elevation: number;
      shadowColor: string;
      shadowOffset: { height: number; width: number };
      shadowOpacity: number;
      shadowRadius: number;
    };
    focus: {
      elevation: number;
      shadowColor: string;
      shadowOffset: { height: number; width: number };
      shadowOpacity: number;
      shadowRadius: number;
    };
    hero: {
      elevation: number;
      shadowColor: string;
      shadowOffset: { height: number; width: number };
      shadowOpacity: number;
      shadowRadius: number;
    };
  };
  radius: {
    lg: number;
    md: number;
    pill: number;
    sm: number;
    xl: number;
  };
  spacing: {
    lg: number;
    md: number;
    page: number;
    section: number;
    sm: number;
    xl: number;
    xs: number;
    xxs: number;
    xxl: number;
  };
  typography: {
    badge: {
      fontSize: number;
      fontWeight: '800';
      lineHeight: number;
    };
    body: {
      fontSize: number;
      fontWeight: '500';
      lineHeight: number;
    };
    caption: {
      fontSize: number;
      fontWeight: '600';
      lineHeight: number;
    };
    cardTitle: {
      fontSize: number;
      fontWeight: '800';
      lineHeight: number;
    };
    display: {
      fontSize: number;
      fontWeight: '900';
      lineHeight: number;
    };
    eyebrow: {
      fontSize: number;
      fontWeight: '700';
      letterSpacing: number;
      lineHeight: number;
    };
    meta: {
      fontSize: number;
      fontWeight: '700';
      lineHeight: number;
    };
    metric: {
      fontSize: number;
      fontWeight: '900';
      lineHeight: number;
    };
    screenTitle: {
      fontSize: number;
      fontWeight: '900';
      lineHeight: number;
    };
    sectionTitle: {
      fontSize: number;
      fontWeight: '800';
      lineHeight: number;
    };
  };
};

const sharedTheme = {
  radius: {
    pill: 999,
    lg: 18,
    md: 14,
    sm: 10,
    xl: 24,
  },
  spacing: {
    lg: 18,
    md: 14,
    page: 16,
    section: 12,
    sm: 10,
    xl: 24,
    xs: 6,
    xxs: 4,
    xxl: 32,
  },
  typography: {
    badge: {
      fontSize: 10,
      fontWeight: '800' as const,
      lineHeight: 12,
    },
    body: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800' as const,
      lineHeight: 19,
    },
    display: {
      fontSize: 34,
      fontWeight: '900' as const,
      lineHeight: 38,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.8,
      lineHeight: 14,
    },
    metric: {
      fontSize: 34,
      fontWeight: '900' as const,
      lineHeight: 36,
    },
    meta: {
      fontSize: 11,
      fontWeight: '700' as const,
      lineHeight: 14,
    },
    screenTitle: {
      fontSize: 30,
      fontWeight: '900' as const,
      lineHeight: 34,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800' as const,
      lineHeight: 18,
    },
  },
} satisfies Pick<AppTheme, 'radius' | 'spacing' | 'typography'>;

export const darkTheme: AppTheme = {
  ...sharedTheme,
  colors: {
    accent: '#8FAF54',
    accentBorder: 'rgba(199, 243, 107, 0.20)',
    accentStrong: '#C7F36B',
    background: '#070B0D',
    backgroundDeep: '#04070A',
    border: '#22303A',
    borderSoft: 'rgba(56, 73, 84, 0.72)',
    borderStrong: '#30414D',
    card: '#0D1318',
    cardOutline: 'rgba(56, 73, 84, 0.42)',
    cardOutlineStrong: 'rgba(56, 73, 84, 0.54)',
    chipBackground: '#0E1419',
    danger: '#FF7257',
    dangerBorder: 'rgba(255, 114, 87, 0.26)',
    dangerSurface: 'rgba(255, 114, 87, 0.14)',
    focusRing: 'rgba(108, 143, 255, 0.18)',
    glassSurface: 'rgba(7, 11, 13, 0.72)',
    glassSurfaceStrong: 'rgba(13, 19, 24, 0.94)',
    glowMuted: 'rgba(108, 143, 255, 0.10)',
    glowStrong: 'rgba(199, 243, 107, 0.16)',
    gridLine: 'rgba(143, 175, 84, 0.12)',
    heroOverlay: 'rgba(7, 11, 13, 0.24)',
    highlightOverlay: 'rgba(255, 255, 255, 0.14)',
    info: '#6C8FFF',
    infoBorder: 'rgba(108, 143, 255, 0.34)',
    infoSurface: 'rgba(108, 143, 255, 0.16)',
    inputBackground: '#0A1014',
    inverseText: '#070B0D',
    mediaGlow: 'rgba(108, 143, 255, 0.08)',
    mutedBlue: '#7A8A95',
    overlay: 'rgba(199, 243, 107, 0.08)',
    primary: '#6C8FFF',
    primaryStrong: '#8DA8FF',
    separator: 'rgba(56, 73, 84, 0.34)',
    separatorStrong: 'rgba(56, 73, 84, 0.42)',
    shadow: '#000000',
    shadowStrong: '#000000',
    statusOpenSurface: 'rgba(245, 178, 75, 0.12)',
    statusResolvedSurface: 'rgba(199, 243, 107, 0.10)',
    success: '#C7F36B',
    successSurface: 'rgba(199, 243, 107, 0.12)',
    surface: '#0E1419',
    surfaceAccent: '#131D17',
    surfaceDanger: 'rgba(255, 114, 87, 0.10)',
    surfaceElevated: '#0D1318',
    surfaceInfo: 'rgba(108, 143, 255, 0.16)',
    surfaceMuted: '#0A1014',
    surfaceStrong: '#141C23',
    surfaceTeal: 'rgba(77, 195, 178, 0.16)',
    surfaceWarning: '#211A11',
    tabBarActive: '#C7F36B',
    tabBarBackground: '#141C23',
    tabBarBorder: '#22303A',
    tabBarInactive: '#73828A',
    teal: '#4DC3B2',
    tealBorder: 'rgba(77, 195, 178, 0.26)',
    textBadge: '#F4F7EF',
    textDim: '#8B98A1',
    textMuted: '#73828A',
    textOnMediaSecondary: 'rgba(244, 247, 239, 0.8)',
    textPrimary: '#F4F7EF',
    textSecondary: '#A8B2AC',
    warning: '#F5B24B',
    warningBorder: 'rgba(245, 178, 75, 0.24)',
    warningSurface: 'rgba(245, 178, 75, 0.14)',
  },
  elevation: {
    card: {
      elevation: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    focus: {
      elevation: 5,
      shadowColor: '#6C8FFF',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
    },
    hero: {
      elevation: 6,
      shadowColor: '#6C8FFF',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.14,
      shadowRadius: 22,
    },
  },
};

export const lightTheme: AppTheme = {
  ...sharedTheme,
  colors: {
    accent: '#8FAF54',
    accentBorder: 'rgba(111, 140, 59, 0.20)',
    accentStrong: '#6F8C3B',
    background: '#F4F7FA',
    backgroundDeep: '#E9EFF3',
    border: '#D8E0E7',
    borderSoft: 'rgba(116, 132, 145, 0.18)',
    borderStrong: '#C5D0DB',
    card: '#FFFFFF',
    cardOutline: 'rgba(116, 132, 145, 0.18)',
    cardOutlineStrong: 'rgba(116, 132, 145, 0.28)',
    chipBackground: '#EEF3F7',
    danger: '#D9604A',
    dangerBorder: 'rgba(217, 96, 74, 0.22)',
    dangerSurface: 'rgba(217, 96, 74, 0.12)',
    focusRing: 'rgba(71, 109, 222, 0.14)',
    glassSurface: 'rgba(255, 255, 255, 0.84)',
    glassSurfaceStrong: 'rgba(255, 255, 255, 0.92)',
    glowMuted: 'rgba(71, 109, 222, 0.06)',
    glowStrong: 'rgba(111, 140, 59, 0.08)',
    gridLine: 'rgba(111, 140, 59, 0.08)',
    heroOverlay: 'rgba(8, 12, 16, 0.18)',
    highlightOverlay: 'rgba(255, 255, 255, 0.42)',
    info: '#476DDE',
    infoBorder: 'rgba(71, 109, 222, 0.20)',
    infoSurface: 'rgba(71, 109, 222, 0.10)',
    inputBackground: '#EEF3F7',
    inverseText: '#FFFFFF',
    mediaGlow: 'rgba(71, 109, 222, 0.08)',
    mutedBlue: '#81909C',
    overlay: 'rgba(111, 140, 59, 0.10)',
    primary: '#476DDE',
    primaryStrong: '#6C8FFF',
    separator: 'rgba(116, 132, 145, 0.18)',
    separatorStrong: 'rgba(116, 132, 145, 0.28)',
    shadow: '#111827',
    shadowStrong: '#0F1720',
    statusOpenSurface: 'rgba(211, 140, 34, 0.12)',
    statusResolvedSurface: 'rgba(111, 140, 59, 0.10)',
    success: '#6F8C3B',
    successSurface: 'rgba(111, 140, 59, 0.12)',
    surface: '#FFFFFF',
    surfaceAccent: '#F4F8EE',
    surfaceDanger: 'rgba(217, 96, 74, 0.08)',
    surfaceElevated: '#FFFFFF',
    surfaceInfo: 'rgba(71, 109, 222, 0.10)',
    surfaceMuted: '#EEF3F7',
    surfaceStrong: '#FBFCFD',
    surfaceTeal: 'rgba(35, 140, 127, 0.10)',
    surfaceWarning: '#FFF7EA',
    tabBarActive: '#476DDE',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#D5DEE7',
    tabBarInactive: '#73808A',
    teal: '#238C7F',
    tealBorder: 'rgba(35, 140, 127, 0.22)',
    textBadge: '#0F1720',
    textDim: '#8896A1',
    textMuted: '#73808A',
    textOnMediaSecondary: 'rgba(255, 255, 255, 0.82)',
    textPrimary: '#111A22',
    textSecondary: '#455561',
    warning: '#D38C22',
    warningBorder: 'rgba(211, 140, 34, 0.24)',
    warningSurface: 'rgba(211, 140, 34, 0.12)',
  },
  elevation: {
    card: {
      elevation: 2,
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    focus: {
      elevation: 3,
      shadowColor: '#476DDE',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
    },
    hero: {
      elevation: 4,
      shadowColor: '#476DDE',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
  },
};

export function getThemeByMode(mode: ThemeMode) {
  return mode === 'dark' ? darkTheme : lightTheme;
}
