import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/constants/colors';

interface AvatarProps {
  imageUrl?: string | null;
  fallback: string;
  size?: number;
}

export function Avatar({ imageUrl, fallback, size = 40 }: AvatarProps) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <Text style={[styles.fallback, { fontSize: size / 2.5 }]}>{fallback}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    color: colors.foreground,
    fontFamily: typography.fontFamily.semibold,
  },
});
