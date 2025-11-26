import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FriendsScreen from '../screens/FriendsScreen';
import MyChallengesScreen from '../screens/MyChallengesScreen';
import CreateChallengeScreen from '../screens/CreateChallengeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Challenges: '🎯',
    Progress: '📊',
    Profile: '👤',
  };
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>
      {icons[name] || '📱'}
    </Text>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
        options={{ headerShown: true, title: 'Challenge' }}
      />
    </Stack.Navigator>
  );
}

function ChallengesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
      <Stack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
        options={{ headerShown: true, title: 'Challenge' }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Settings' }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ headerShown: true, title: 'Friends' }}
      />
      <Stack.Screen
        name="MyChallenges"
        component={MyChallengesScreen}
        options={{ headerShown: true, title: 'My Challenges' }}
      />
      <Stack.Screen
        name="CreateChallenge"
        component={CreateChallengeScreen}
        options={{ headerShown: true, title: 'Create Challenge' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen
        name="ChallengesTab"
        component={ChallengesStack}
        options={{ title: 'Challenges' }}
      />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : user?.onboardingCompleted === 0 ? (
        <OnboardingStack />
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
});
