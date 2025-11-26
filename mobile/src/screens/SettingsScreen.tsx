import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(
    user?.enableNotifications === 1
  );
  const [darkMode, setDarkMode] = useState(false);

  const handleNotificationsToggle = (value: boolean) => {
    setNotifications(value);
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    Alert.alert('Coming Soon', 'Dark mode will be available in a future update.');
    setDarkMode(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Get reminders for your daily challenges
            </Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              Use dark theme throughout the app
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Edit Profile</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Change Password</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Privacy Policy</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuLabel}>Terms of Service</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Build</Text>
          <Text style={styles.aboutValue}>2024.1</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  menuArrow: {
    fontSize: 16,
    color: '#94a3b8',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#1e293b',
  },
  aboutValue: {
    fontSize: 16,
    color: '#64748b',
  },
});
