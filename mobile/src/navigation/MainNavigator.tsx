import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../constants/colors';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import ProgressScreen from '../screens/ProgressScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import FriendsScreen from '../screens/FriendsScreen';
import MyChallengesScreen from '../screens/MyChallengesScreen';
import CreateChallengeScreen from '../screens/CreateChallengeScreen';

export type MainTabParamList = {
  HomeTab: undefined;
  ChallengesTab: undefined;
  ProgressTab: undefined;
  FriendsTab: undefined;
  MoreTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ChallengeDetail: { id: string };
};

export type ChallengesStackParamList = {
  Challenges: undefined;
  ChallengeDetail: { id: string };
  MyChallenges: undefined;
  CreateChallenge: { editId?: string };
};

export type MoreStackParamList = {
  More: undefined;
  Achievements: undefined;
  Analytics: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ChallengesStack = createNativeStackNavigator<ChallengesStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

// Stack Navigators
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen 
        name="ChallengeDetail" 
        component={ChallengeDetailScreen}
        options={{ headerShown: true, title: 'Challenge' }}
      />
    </HomeStack.Navigator>
  );
}

function ChallengesStackNavigator() {
  return (
    <ChallengesStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <ChallengesStack.Screen name="Challenges" component={ChallengesScreen} />
      <ChallengesStack.Screen 
        name="ChallengeDetail" 
        component={ChallengeDetailScreen}
        options={{ headerShown: true, title: 'Challenge' }}
      />
      <ChallengesStack.Screen 
        name="MyChallenges" 
        component={MyChallengesScreen}
        options={{ headerShown: true, title: 'My Challenges' }}
      />
      <ChallengesStack.Screen 
        name="CreateChallenge" 
        component={CreateChallengeScreen}
        options={{ headerShown: true, title: 'Create Challenge' }}
      />
    </ChallengesStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <MoreStack.Screen name="More" component={require('../screens/MoreScreen').default} />
      <MoreStack.Screen 
        name="Achievements" 
        component={AchievementsScreen}
        options={{ headerShown: true, title: 'Achievements' }}
      />
      <MoreStack.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ headerShown: true, title: 'Analytics' }}
      />
      <MoreStack.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ headerShown: true, title: 'History' }}
      />
    </MoreStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: typography.fontSize.xs,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChallengesTab"
        component={ChallengesStackNavigator}
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressScreen}
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FriendsTab"
        component={FriendsScreen}
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
