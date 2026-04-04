import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme, type Theme as NavigationTheme } from '@react-navigation/native';
import {
  StyleSheet,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { darkTheme, getThemeByMode, type AppTheme, type ThemeMode } from '@/src/theme/tokens';

type AppThemeContextValue = {
  appTheme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

type NamedStyles<T> = {
  [P in keyof T]: ImageStyle | TextStyle | ViewStyle;
};

const THEME_STORAGE_KEY = 'konanut-sii.theme-mode';
const AppThemeContext = createContext<AppThemeContextValue | null>(null);

let activeThemeMode: ThemeMode = 'dark';
let activeTheme: AppTheme = darkTheme;

function syncActiveTheme(mode: ThemeMode) {
  activeThemeMode = mode;
  activeTheme = getThemeByMode(mode);
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

function createLiveProxy<T extends object>(getValue: () => T): T {
  return new Proxy({} as T, {
    get(_target, property) {
      const value = getValue()[property as keyof T];

      if (typeof value === 'object' && value !== null) {
        return createLiveProxy(() => getValue()[property as keyof T] as object);
      }

      return value;
    },
    getOwnPropertyDescriptor() {
      return {
        configurable: true,
        enumerable: true,
      };
    },
    ownKeys() {
      return Reflect.ownKeys(getValue());
    },
  });
}

export const theme = createLiveProxy(() => activeTheme);

export function createNavigationTheme(appTheme: AppTheme, mode: ThemeMode): NavigationTheme {
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: appTheme.colors.background,
      border: appTheme.colors.border,
      card: appTheme.colors.tabBarBackground,
      notification: appTheme.colors.warning,
      primary: appTheme.colors.primary,
      text: appTheme.colors.textPrimary,
    },
    dark: mode === 'dark',
  };
}

export function createThemedStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (theme: AppTheme) => T
): T {
  const cache = new Map<ThemeMode, T>();

  const getStyles = () => {
    const cachedStyles = cache.get(activeThemeMode);

    if (cachedStyles) {
      return cachedStyles;
    }

    const nextStyles = StyleSheet.create(factory(activeTheme)) as T;
    cache.set(activeThemeMode, nextStyles);

    return nextStyles;
  };

  return new Proxy({} as T, {
    get(_target, property) {
      return getStyles()[property as keyof T];
    },
    getOwnPropertyDescriptor() {
      return {
        configurable: true,
        enumerable: true,
      };
    },
    ownKeys() {
      return Reflect.ownKeys(getStyles());
    },
  });
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    let isMounted = true;

    void AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedMode) => {
        if (!isMounted) {
          return;
        }

        const nextMode = isThemeMode(storedMode) ? storedMode : 'dark';

        syncActiveTheme(nextMode);
        setMode(nextMode);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsHydrated(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    syncActiveTheme(mode);

    if (!isHydrated) {
      return;
    }

    void AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [isHydrated, mode]);

  if (!isHydrated) {
    return null;
  }

  const appTheme = getThemeByMode(mode);

  syncActiveTheme(mode);

  return (
    <AppThemeContext.Provider
      value={{
        appTheme,
        mode,
        setMode,
      }}
    >
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);

  if (!value) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return value.appTheme;
}

export function useThemeMode() {
  const value = useContext(AppThemeContext);

  if (!value) {
    throw new Error('useThemeMode must be used within AppThemeProvider');
  }

  return value.mode;
}

export function useThemeController() {
  const value = useContext(AppThemeContext);

  if (!value) {
    throw new Error('useThemeController must be used within AppThemeProvider');
  }

  return {
    mode: value.mode,
    setMode: value.setMode,
  };
}

export function useNavigationTheme() {
  const { appTheme, mode } = useContext(AppThemeContext) ?? {};

  if (!appTheme || !mode) {
    throw new Error('useNavigationTheme must be used within AppThemeProvider');
  }

  return createNavigationTheme(appTheme, mode);
}
