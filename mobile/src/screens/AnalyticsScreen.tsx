import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../constants/colors';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: typography.fontSize['3xl'], fontFamily: typography.fontFamily.heading, color: colors.foreground },
});
