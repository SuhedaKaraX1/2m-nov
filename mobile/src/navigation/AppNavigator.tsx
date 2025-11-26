import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

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
import JournalScreen from '../screens/JournalScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function HamburgerButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.hamburgerButton}>
      <View style={styles.hamburgerLine} />
      <View style={styles.hamburgerLine} />
      <View style={styles.hamburgerLine} />
    </TouchableOpacity>
  );
}

function CustomDrawerContent(props: any) {
  const { navigation, state } = props;
  const currentRoute = state?.routes?.[state.index]?.name || 'Home';

  const navigationItems = [
    { name: 'Home', label: 'Home', icon: '🏠' },
    { name: 'AllChallenges', label: 'All Challenges', icon: '🎯' },
    { name: 'Progress', label: 'Progress', icon: '📊' },
    { name: 'Journal', label: 'Journal', icon: '📓' },
    { name: 'Friends', label: 'Friends', icon: '👥' },
    { name: 'Profile', label: 'Profile', icon: '👤' },
    { name: 'Settings', label: 'Settings', icon: '⚙️' },
  ];

  const createItems = [
    { name: 'NewChallenge', label: 'New Challenge', icon: '➕' },
    { name: 'MyCustomChallenges', label: 'My Custom Challenges', icon: '✨' },
  ];

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>
        <Text style={styles.drawerTitle}>2Mins Challenge</Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>Navigation</Text>
        {navigationItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.drawerItem,
              currentRoute === item.name && styles.drawerItemActive,
            ]}
            onPress={() => navigation.navigate(item.name)}
          >
            <Text style={styles.drawerItemIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.drawerItemLabel,
                currentRoute === item.name && styles.drawerItemLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>Create</Text>
        {createItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.drawerItem,
              currentRoute === item.name && styles.drawerItemActive,
            ]}
            onPress={() => navigation.navigate(item.name)}
          >
            <Text style={styles.drawerItemIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.drawerItemLabel,
                currentRoute === item.name && styles.drawerItemLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </DrawerContentScrollView>
  );
}

function DrawerScreens() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
        },
        headerTitleStyle: {
          color: '#1e293b',
          fontWeight: '600',
          fontSize: 18,
        },
        headerLeft: () => (
          <HamburgerButton onPress={() => navigation.openDrawer()} />
        ),
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
      })}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '2Mins Challenge' }}
      />
      <Drawer.Screen
        name="AllChallenges"
        component={ChallengesScreen}
        options={{ title: 'All Challenges' }}
      />
      <Drawer.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: 'Progress' }}
      />
      <Drawer.Screen
        name="Journal"
        component={JournalScreen}
        options={{ title: 'Journal' }}
      />
      <Drawer.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: 'Friends' }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Drawer.Screen
        name="NewChallenge"
        component={CreateChallengeScreen}
        options={{ title: 'New Challenge' }}
      />
      <Drawer.Screen
        name="MyCustomChallenges"
        component={MyChallengesScreen}
        options={{ title: 'My Custom Challenges' }}
      />
    </Drawer.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DrawerScreens"
        component={DrawerScreens}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
        options={{
          title: 'Challenge',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            color: '#1e293b',
            fontWeight: '600',
          },
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
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
        <MainStack />
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
  hamburgerButton: {
    marginLeft: 16,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 22,
    height: 2.5,
    backgroundColor: '#1e293b',
    marginVertical: 2,
    borderRadius: 1,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoIcon: {
    fontSize: 20,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  sectionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  drawerItemActive: {
    backgroundColor: '#eff6ff',
  },
  drawerItemIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  drawerItemLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  drawerItemLabelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
