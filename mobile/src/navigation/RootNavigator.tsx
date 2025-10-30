import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../constants/colors';

// Auth screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';

// Main app navigator
import MainNavigator from './MainNavigator';

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Main: undefined;
  ShareAchievement: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.foreground,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
        {/* Public routes */}
        <Stack.Screen
          name="ShareAchievement"
          component={require('../screens/ShareAchievementScreen').default}
          options={{ headerShown: true, title: 'Shared Achievement' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
