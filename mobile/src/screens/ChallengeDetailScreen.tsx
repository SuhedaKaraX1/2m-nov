import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { HomeStackParamList } from '../navigation/MainNavigator';
import { colors, typography } from '../constants/colors';

type ChallengeDetailRouteProp = RouteProp<HomeStackParamList, 'ChallengeDetail'>;

export default function ChallengeDetailScreen() {
  const route = useRoute<ChallengeDetailRouteProp>();
  const { id } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Challenge Detail</Text>
      <Text style={styles.subtitle}>ID: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { fontSize: typography.fontSize['3xl'], fontFamily: typography.fontFamily.heading, color: colors.foreground },
  subtitle: { fontSize: typography.fontSize.base, color: colors.mutedForeground, marginTop: 8 },
});
