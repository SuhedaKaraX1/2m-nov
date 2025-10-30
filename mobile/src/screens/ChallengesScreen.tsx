import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../constants/colors';

export default function ChallengesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Challenges</Text>
      <Text style={styles.subtitle}>Browse all available challenges</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { fontSize: typography.fontSize['3xl'], fontFamily: typography.fontFamily.heading, color: colors.foreground },
  subtitle: { fontSize: typography.fontSize.base, color: colors.mutedForeground, marginTop: 8 },
});
