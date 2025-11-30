import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from "react-native";

import LoginScreen from "../screens/LoginScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import ChallengesScreen from "../screens/ChallengesScreen";
import ChallengeDetailScreen from "../screens/ChallengeDetailScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import FriendsScreen from "../screens/FriendsScreen";
import MyChallengesScreen from "../screens/MyChallengesScreen";
import CreateChallengeScreen from "../screens/CreateChallengeScreen";
import JournalScreen from "../screens/JournalScreen";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Logo kaynağını tanımla
const Logo: ImageSourcePropType = require("../../assets/logo.jpg");

// Drawer’da kullanılacak navigation item’ları
const navigationItems = [
  { name: "Home", label: "Home" },
  { name: "AllChallenges", label: "All Challenges" },
  { name: "Progress", label: "Progress" },
  { name: "Journal", label: "Journal" },
  { name: "Friends", label: "Friends" },
  { name: "Profile", label: "Profile" },
  { name: "Settings", label: "Settings" },
];

// Drawer’da Create altında kullanılacak item’lar
const createItems = [
  { name: "NewChallenge", label: "New Challenge" },
  { name: "MyCustomChallenges", label: "My Custom Challenges" },
];

function HamburgerButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity onPress={onPress} style={styles.hamburgerButton}>
      <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
      <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
      <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
    </TouchableOpacity>
  );
}

function CustomDrawerContent(props: any) {
  const { navigation, state } = props;
  const { colors, isDark } = useTheme();
  const currentRoute = state?.routes?.[state.index]?.name || "Home";

  const getNavigationIconSource = (name: string) => {
    switch (name) {
      case "Home":
        return require("../../assets/home.png");
      case "AllChallenges":
        return require("../../assets/nocolorbullseye.png");
      case "Progress":
        return require("../../assets/progress.png");
      case "Journal":
        return require("../../assets/journal.png");
      case "Friends":
        return require("../../assets/friends.png");
      case "Profile":
        return require("../../assets/profile.png");
      case "Settings":
        return require("../../assets/settings.png");
      default:
        return require("../../assets/home.png");
    }
  };

  const getCreateIconSource = (name: string) => {
    switch (name) {
      case "NewChallenge":
        return require("../../assets/plus.png");
      case "MyCustomChallenges":
        return require("../../assets/nocolorbullseye.png");
      default:
        return require("../../assets/plus.png");
    }
  };

  return (
    <DrawerContentScrollView {...props} style={[styles.drawerContent, { backgroundColor: colors.background }]}>
      <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoIcon} />
        </View>
        <Text style={[styles.drawerTitle, { color: colors.text }]}>2Mins Challenge</Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>NAVIGATION</Text>
        {navigationItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.drawerItem,
              currentRoute === item.name && [styles.drawerItemActive, { backgroundColor: colors.primaryLight }],
            ]}
            onPress={() => navigation.navigate(item.name)}
          >
            <Image
              source={getNavigationIconSource(item.name)}
              style={[styles.drawerItemImage, { tintColor: currentRoute === item.name ? colors.primary : colors.textSecondary }]}
            />
            <Text
              style={[
                styles.drawerItemLabel,
                { color: colors.textSecondary },
                currentRoute === item.name && [styles.drawerItemLabelActive, { color: colors.primary }],
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Create</Text>
        {createItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.drawerItem,
              currentRoute === item.name && [styles.drawerItemActive, { backgroundColor: colors.primaryLight }],
            ]}
            onPress={() => navigation.navigate(item.name)}
          >
            <Image
              source={getCreateIconSource(item.name)}
              style={[styles.drawerItemImage, { tintColor: currentRoute === item.name ? colors.primary : colors.textSecondary }]}
            />
            <Text
              style={[
                styles.drawerItemLabel,
                { color: colors.textSecondary },
                currentRoute === item.name && [styles.drawerItemLabelActive, { color: colors.primary }],
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
  const { colors, isDark } = useTheme();
  
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: colors.headerBackground,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          color: colors.headerText,
          fontWeight: "600",
          fontSize: 18,
        },
        headerTintColor: colors.text,
        headerLeft: () => (
          <HamburgerButton onPress={() => navigation.openDrawer()} />
        ),
        drawerStyle: {
          backgroundColor: colors.background,
          width: 280,
        },
      })}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "2Mins Challenge" }}
      />
      <Drawer.Screen
        name="AllChallenges"
        component={ChallengesScreen}
        options={{ title: "All Challenges" }}
      />
      <Drawer.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: "Progress" }}
      />
      <Drawer.Screen
        name="Journal"
        component={JournalScreen}
        options={{ title: "Journal" }}
      />
      <Drawer.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: "Friends" }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Drawer.Screen
        name="NewChallenge"
        component={CreateChallengeScreen}
        options={{ title: "New Challenge" }}
      />
      <Drawer.Screen
        name="MyCustomChallenges"
        component={MyChallengesScreen}
        options={{ title: "My Custom Challenges" }}
      />
    </Drawer.Navigator>
  );
}

function MainStack() {
  const { colors } = useTheme();
  
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
          title: "Challenge",
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTitleStyle: {
            color: colors.headerText,
            fontWeight: "600",
          },
          headerTintColor: colors.text,
          headerBackTitle: "Back",
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
  const { colors, isDark } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.cardBackground,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  hamburgerButton: {
    marginLeft: 16,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  hamburgerLine: {
    width: 22,
    height: 2.5,
    backgroundColor: "#1e293b",
    marginVertical: 2,
    borderRadius: 1,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    marginRight: 12,
  },
  logoIcon: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  sectionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 12,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  drawerItemActive: {
    backgroundColor: "#f2f6fa",
  },
  drawerItemImage: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginRight: 12,
  },
  drawerItemLabel: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  drawerItemLabelActive: {
    color: "#000000",
    fontWeight: "600",
  },
});
