export { lightTheme } from './light';
export { darkTheme } from './dark';
export * from './types';

import { lightTheme } from './light';
import { darkTheme } from './dark';
import { Theme, ThemeMode } from './types';

export const getTheme = (mode: ThemeMode, systemColorScheme: 'light' | 'dark'): Theme => {
  if (mode === 'system') {
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
};

export const getCategoryColor = (category: string, theme: Theme): string => {
  const categoryColors: Record<string, string> = {
    physical: theme.colors.categoryPhysical,
    mental: theme.colors.categoryMental,
    learning: theme.colors.categoryLearning,
    finance: theme.colors.categoryFinance,
    relationships: theme.colors.categoryRelationships,
  };
  return categoryColors[category.toLowerCase()] || theme.colors.primary;
};

export const getDifficultyColor = (difficulty: string, theme: Theme): string => {
  const difficultyColors: Record<string, string> = {
    easy: theme.colors.success,
    medium: theme.colors.warning,
    hard: theme.colors.error,
  };
  return difficultyColors[difficulty.toLowerCase()] || theme.colors.textMuted;
};
