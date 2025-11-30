export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  
  secondary: string;
  secondaryHover: string;
  
  accent: string;
  accentLight: string;
  
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  border: string;
  borderLight: string;
  borderDark: string;
  
  success: string;
  successLight: string;
  successDark: string;
  
  error: string;
  errorLight: string;
  errorDark: string;
  
  warning: string;
  warningLight: string;
  
  info: string;
  infoLight: string;
  
  categoryPhysical: string;
  categoryMental: string;
  categoryLearning: string;
  categoryFinance: string;
  categoryRelationships: string;
  
  chartColors: string[];
  
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  
  headerBackground: string;
  headerText: string;
  
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  
  progressBackground: string;
  progressFill: string;
  
  badgeBackground: string;
  badgeText: string;
  
  modalBackground: string;
  modalOverlay: string;
  
  divider: string;
  
  skeleton: string;
  skeletonHighlight: string;
}

export interface Theme {
  name: 'light' | 'dark';
  colors: ThemeColors;
}

export type ThemeMode = 'light' | 'dark' | 'system';
