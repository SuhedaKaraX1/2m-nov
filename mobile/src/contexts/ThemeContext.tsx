import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode, ThemeColors } from '../theme/types';
import { lightTheme } from '../theme/light';
import { darkTheme } from '../theme/dark';
import { getTheme } from '../theme';

const THEME_STORAGE_KEY = '@2mins_theme_mode';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme() || 'light';
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.log('Error loading theme mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.log('Error saving theme mode:', error);
    }
  };

  const toggleTheme = async () => {
    const currentTheme = getTheme(themeMode, systemColorScheme);
    const newMode: ThemeMode = currentTheme.name === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  const theme = getTheme(themeMode, systemColorScheme);
  const isDark = theme.name === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        colors: theme.colors,
        isDark,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}
