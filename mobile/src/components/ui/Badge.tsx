import { type ReactNode } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, typography } from '@/constants/colors';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  style?: StyleProp<ViewStyle>;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  // Variants
  default: {
    backgroundColor: colors.secondary,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  success: {
    backgroundColor: colors.categories.finance, // green
  },
  warning: {
    backgroundColor: colors.categories.learning, // yellow
  },
  destructive: {
    backgroundColor: colors.destructive,
  },
  // Text styles
  text: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  text_default: {
    color: colors.foreground,
  },
  text_primary: {
    color: colors.primaryForeground,
  },
  text_secondary: {
    color: colors.foreground,
  },
  text_success: {
    color: colors.foreground,
  },
  text_warning: {
    color: colors.background,
  },
  text_destructive: {
    color: colors.destructiveForeground,
  },
});
