import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  TextInput,
  Image,
  Modal,
  Animated,
  Vibration,
  Dimensions,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import * as ImagePicker from "expo-image-picker";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface SettingsData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profileImageUrl: string | null;
  theme: "system" | "light" | "dark";
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklySummary: boolean;
  profileVisibility: "public" | "friends" | "private";
  dataSharing: boolean;
  enableScheduledNotifications: boolean;
  challengeScheduleTimes: TimeSlot[];
}

const DEFAULTS: SettingsData = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  profileImageUrl: null,
  theme: "system",
  language: "en",
  emailNotifications: true,
  pushNotifications: true,
  weeklySummary: true,
  profileVisibility: "friends",
  dataSharing: false,
  enableScheduledNotifications: false,
  challengeScheduleTimes: [],
};

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SettingsData>({
    ...DEFAULTS,
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    email: user?.email || "",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await apiService.getSettings();
        if (settings) {
          setForm((prev) => ({
            ...prev,
            firstName: settings.firstName || prev.firstName,
            lastName: settings.lastName || prev.lastName,
            username: settings.username || prev.username,
            email: settings.email || prev.email,
            profileImageUrl: settings.profileImageUrl || null,
            theme: settings.theme || "system",
            language: settings.language || "en",
            emailNotifications: settings.emailNotifications ?? true,
            pushNotifications: settings.pushNotifications ?? true,
            weeklySummary: settings.weeklySummary ?? true,
            profileVisibility: settings.profileVisibility || "friends",
            dataSharing: settings.dataSharing ?? false,
            enableScheduledNotifications: settings.enableNotifications === 1 || settings.enableNotifications === true,
            challengeScheduleTimes: (settings.challengeScheduleTimes || []).map((slot: any) => ({
              id: slot.id || Date.now().toString(),
              start: slot.start || "09:00",
              end: slot.end || "17:00",
            })),
          }));
        }
      } catch (error) {
        console.log("Failed to load settings:", error);
        Alert.alert("Error", "Failed to load settings. Some data may be stale.");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [showAlarm, setShowAlarm] = useState(false);
  const [alarmChallenge, setAlarmChallenge] = useState<any>(null);
  const countdownScale = useRef(new Animated.Value(1)).current;

  const getInitials = () => {
    const first = form.firstName?.[0] || "";
    const last = form.lastName?.[0] || form.username?.[0] || "U";
    return (first + last).toUpperCase();
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setForm((f) => ({ ...f, profileImageUrl: result.assets[0].uri }));
    }
  };

  const showSuccessAlert = (section: string) => {
    Alert.alert("Success", `${section} saved successfully!`);
  };

  const getFullFormData = () => ({
    firstName: form.firstName,
    lastName: form.lastName,
    username: form.username,
    email: form.email,
    profileImageUrl: form.profileImageUrl,
    theme: form.theme,
    language: form.language,
    emailNotifications: form.emailNotifications,
    pushNotifications: form.pushNotifications,
    weeklySummary: form.weeklySummary,
    profileVisibility: form.profileVisibility,
    dataSharing: form.dataSharing,
    enableNotifications: form.enableScheduledNotifications ? 1 : 0,
    challengeScheduleTimes: form.challengeScheduleTimes.map((slot) => ({
      id: slot.id,
      start: slot.start,
      end: slot.end,
    })),
  });

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await apiService.saveSettings(getFullFormData());
      showSuccessAlert("Profile");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      await apiService.saveSettings(getFullFormData());
      showSuccessAlert("Preferences");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save preferences");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      await apiService.saveSettings(getFullFormData());
      showSuccessAlert("Notifications");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save notifications");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      await apiService.saveSettings(getFullFormData());
      showSuccessAlert("Privacy settings");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save privacy settings");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await apiService.saveScheduleSettings({
        enableNotifications: form.enableScheduledNotifications ? 1 : 0,
        challengeScheduleTimes: form.challengeScheduleTimes.map((slot) => ({
          id: slot.id,
          start: slot.start,
          end: slot.end,
        })),
      });
      showSuccessAlert("Schedule settings");
      
      try {
        const challenge = await apiService.getRandomChallenge();
        setAlarmChallenge(challenge);
        setShowCountdown(true);
        setCountdownValue(3);
      } catch {
        setSavingSchedule(false);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save schedule settings");
      setSavingSchedule(false);
    }
  };

  useEffect(() => {
    if (!showCountdown) return;

    if (countdownValue === 0) {
      setShowCountdown(false);
      setSavingSchedule(false);
      Vibration.vibrate([0, 200, 100, 200]);
      setShowAlarm(true);
      return;
    }

    Animated.sequence([
      Animated.timing(countdownScale, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(countdownScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      setCountdownValue(countdownValue - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownValue, showCountdown]);

  const handleAddTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      start: "09:00",
      end: "17:00",
    };
    setForm((f) => ({
      ...f,
      challengeScheduleTimes: [...f.challengeScheduleTimes, newSlot],
    }));
  };

  const handleRemoveTimeSlot = (id: string) => {
    setForm((f) => ({
      ...f,
      challengeScheduleTimes: f.challengeScheduleTimes.filter((s) => s.id !== id),
    }));
  };

  const handleUpdateTimeSlot = (id: string, field: "start" | "end", value: string) => {
    setForm((f) => ({
      ...f,
      challengeScheduleTimes: f.challengeScheduleTimes.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteModal(false);
    try {
      await apiService.deleteAccount();
      Alert.alert(
        "Account Deleted",
        "Your account has been successfully deleted.",
        [{ text: "OK", onPress: () => logout() }]
      );
    } catch (error: any) {
      Alert.alert(
        "Account Deletion Requested",
        "Your account deletion request has been submitted. You will receive an email confirmation shortly."
      );
    }
  };

  const handleStartChallenge = () => {
    setShowAlarm(false);
    if (alarmChallenge?.id) {
      navigation.navigate("ChallengeDetail", { id: alarmChallenge.id });
    }
  };

  const handleSnoozeChallenge = () => {
    setShowAlarm(false);
    Alert.alert("Snoozed", "Challenge snoozed for 2 minutes");
  };

  const themeLabels = { system: "System", light: "Light", dark: "Dark" };
  const languageLabels = { en: "English", tr: "Türkçe", de: "Deutsch", es: "Español" };
  const visibilityLabels = { public: "Public", friends: "Friends", private: "Private" };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <View>
              <Text style={styles.sectionTitle}>Profile</Text>
              <Text style={styles.sectionDescription}>
                Update your basic information and profile photo.
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.avatarRow}>
              {form.profileImageUrl ? (
                <Image source={{ uri: form.profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials()}</Text>
                </View>
              )}
              <View style={styles.avatarButtons}>
                <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
                  <Text style={styles.changePhotoText}>📷 Change Photo</Text>
                </TouchableOpacity>
                {form.profileImageUrl && (
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => setForm((f) => ({ ...f, profileImageUrl: null }))}
                  >
                    <Text style={styles.removePhotoText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>First name</Text>
                <TextInput
                  style={styles.input}
                  value={form.firstName}
                  onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
                  placeholder="Jane"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Last name</Text>
                <TextInput
                  style={styles.input}
                  value={form.lastName}
                  onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
                  placeholder="Doe"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={form.username}
                  onChangeText={(v) => setForm((f) => ({ ...f, username: v }))}
                  placeholder="janedoe"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                  placeholder="jane@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, savingProfile && styles.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            <Text style={styles.saveButtonText}>
              {savingProfile ? "Saving..." : "💾 Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎨</Text>
            <View>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <Text style={styles.sectionDescription}>
                Appearance and language settings.
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.selectRow}>
              <View style={styles.selectHalf}>
                <Text style={styles.inputLabel}>Theme</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowThemePicker(true)}
                >
                  <Text style={styles.selectButtonText}>{themeLabels[form.theme]}</Text>
                  <Text style={styles.selectArrow}>▼</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.selectHalf}>
                <Text style={styles.inputLabel}>Language</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowLanguagePicker(true)}
                >
                  <Text style={styles.selectButtonText}>
                    🌐 {languageLabels[form.language as keyof typeof languageLabels]}
                  </Text>
                  <Text style={styles.selectArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, savingPreferences && styles.buttonDisabled]}
            onPress={handleSavePreferences}
            disabled={savingPreferences}
          >
            <Text style={styles.saveButtonText}>
              {savingPreferences ? "Saving..." : "💾 Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <View>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <Text style={styles.sectionDescription}>
                Choose how you want to be notified about activity and progress.
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Email notifications</Text>
                <Text style={styles.toggleDescription}>
                  Updates about challenges and weekly summaries.
                </Text>
              </View>
              <Switch
                value={form.emailNotifications}
                onValueChange={(v) => setForm((f) => ({ ...f, emailNotifications: v }))}
                trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Push notifications</Text>
                <Text style={styles.toggleDescription}>
                  Get notified instantly on new activity.
                </Text>
              </View>
              <Switch
                value={form.pushNotifications}
                onValueChange={(v) => setForm((f) => ({ ...f, pushNotifications: v }))}
                trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Weekly summary</Text>
                <Text style={styles.toggleDescription}>
                  A recap of your progress every week.
                </Text>
              </View>
              <Switch
                value={form.weeklySummary}
                onValueChange={(v) => setForm((f) => ({ ...f, weeklySummary: v }))}
                trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
                thumbColor="#fff"
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, savingNotifications && styles.buttonDisabled]}
            onPress={handleSaveNotifications}
            disabled={savingNotifications}
          >
            <Text style={styles.saveButtonText}>
              {savingNotifications ? "Saving..." : "💾 Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🛡️</Text>
            <View>
              <Text style={styles.sectionTitle}>Privacy</Text>
              <Text style={styles.sectionDescription}>
                Control who can see your activity and how your data is used.
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.selectItemFull}>
              <Text style={styles.inputLabel}>Profile visibility</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowVisibilityPicker(true)}
              >
                <Text style={styles.selectButtonText}>
                  {visibilityLabels[form.profileVisibility]}
                </Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.separator} />
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Allow anonymized data sharing</Text>
                <Text style={styles.toggleDescription}>
                  Help us improve by sharing usage metrics.
                </Text>
              </View>
              <Switch
                value={form.dataSharing}
                onValueChange={(v) => setForm((f) => ({ ...f, dataSharing: v }))}
                trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
                thumbColor="#fff"
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, savingPrivacy && styles.buttonDisabled]}
            onPress={handleSavePrivacy}
            disabled={savingPrivacy}
          >
            <Text style={styles.saveButtonText}>
              {savingPrivacy ? "Saving..." : "💾 Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Challenge Scheduling Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⏰</Text>
            <View>
              <Text style={styles.sectionTitle}>Challenge Scheduling</Text>
              <Text style={styles.sectionDescription}>
                Set up when you want to receive challenge notifications.
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Enable scheduled notifications</Text>
                <Text style={styles.toggleDescription}>
                  Receive automatic challenge notifications during your selected time slots.
                </Text>
              </View>
              <Switch
                value={form.enableScheduledNotifications}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, enableScheduledNotifications: v }))
                }
                trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
                thumbColor="#fff"
              />
            </View>

            {form.enableScheduledNotifications && (
              <>
                <View style={styles.separator} />
                <View style={styles.timeSlotSection}>
                  <Text style={styles.timeSlotLabel}>Active Time Slots</Text>
                  <Text style={styles.timeSlotDescription}>
                    Add time ranges when you want to receive challenges.
                  </Text>

                  {form.challengeScheduleTimes.map((slot) => (
                    <View key={slot.id} style={styles.timeSlotRow}>
                      <View style={styles.timeInputContainer}>
                        <TextInput
                          style={styles.timeInput}
                          value={slot.start}
                          onChangeText={(v) => handleUpdateTimeSlot(slot.id, "start", v)}
                          placeholder="09:00"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                      <Text style={styles.toText}>to</Text>
                      <View style={styles.timeInputContainer}>
                        <TextInput
                          style={styles.timeInput}
                          value={slot.end}
                          onChangeText={(v) => handleUpdateTimeSlot(slot.id, "end", v)}
                          placeholder="17:00"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.removeSlotButton}
                        onPress={() => handleRemoveTimeSlot(slot.id)}
                      >
                        <Text style={styles.removeSlotText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity style={styles.addSlotButton} onPress={handleAddTimeSlot}>
                    <Text style={styles.addSlotText}>+ Add Time Slot</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
          <TouchableOpacity
            style={[styles.saveButton, savingSchedule && styles.buttonDisabled]}
            onPress={handleSaveSchedule}
            disabled={savingSchedule}
          >
            <Text style={styles.saveButtonText}>
              {savingSchedule ? "Saving..." : "💾 Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚠️</Text>
            <View>
              <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
              <Text style={styles.sectionDescription}>
                Irreversible and destructive actions.
              </Text>
            </View>
          </View>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerDescription}>
              Once you delete your account, there is no going back. Please be certain.
            </Text>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Text style={styles.deleteButtonText}>🗑️ Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Theme Picker Modal */}
      <Modal visible={showThemePicker} transparent animationType="slide">
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Theme</Text>
              <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            {(["system", "light", "dark"] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.pickerOption,
                  form.theme === option && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setForm((f) => ({ ...f, theme: option }));
                  setShowThemePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    form.theme === option && styles.pickerOptionTextSelected,
                  ]}
                >
                  {themeLabels[option]}
                </Text>
                {form.theme === option && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Language Picker Modal */}
      <Modal visible={showLanguagePicker} transparent animationType="slide">
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            {(["en", "tr", "de", "es"] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.pickerOption,
                  form.language === option && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setForm((f) => ({ ...f, language: option }));
                  setShowLanguagePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    form.language === option && styles.pickerOptionTextSelected,
                  ]}
                >
                  {languageLabels[option]}
                </Text>
                {form.language === option && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Visibility Picker Modal */}
      <Modal visible={showVisibilityPicker} transparent animationType="slide">
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Profile Visibility</Text>
              <TouchableOpacity onPress={() => setShowVisibilityPicker(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            {(["public", "friends", "private"] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.pickerOption,
                  form.profileVisibility === option && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setForm((f) => ({ ...f, profileVisibility: option }));
                  setShowVisibilityPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    form.profileVisibility === option && styles.pickerOptionTextSelected,
                  ]}
                >
                  {visibilityLabels[option]}
                </Text>
                {form.profileVisibility === option && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteModalIcon}>
              <Text style={styles.deleteModalIconText}>⚠️</Text>
            </View>
            <Text style={styles.deleteModalTitle}>Delete Account</Text>
            <Text style={styles.deleteModalDescription}>
              Are you sure you want to delete your account? This action cannot be undone and all
              your data will be permanently removed.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancel}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirm} onPress={confirmDeleteAccount}>
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Countdown Modal */}
      <Modal visible={showCountdown} transparent animationType="fade">
        <View style={styles.countdownOverlay}>
          <Animated.View
            style={[styles.countdownContainer, { transform: [{ scale: countdownScale }] }]}
          >
            <Text style={styles.countdownNumber}>{countdownValue}</Text>
            <Text style={styles.countdownText}>Get ready...</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Challenge Alarm Modal */}
      <Modal visible={showAlarm} transparent animationType="slide">
        <View style={styles.alarmOverlay}>
          <View style={styles.alarmModal}>
            <View style={styles.alarmIconContainer}>
              <Text style={styles.alarmIcon}>🔔</Text>
            </View>
            <Text style={styles.alarmTitle}>Challenge Time!</Text>
            <Text style={styles.alarmSubtitle}>It's time for your 2-minute challenge</Text>

            <View style={styles.alarmChallengeCard}>
              <Text style={styles.alarmChallengeTitle}>
                {alarmChallenge?.title || "Quick Stretch Break"}
              </Text>
              <Text style={styles.alarmChallengeDescription}>
                {alarmChallenge?.description || "Take 2 minutes to complete this challenge."}
              </Text>
              <View style={styles.alarmChallengeTags}>
                <View style={[styles.alarmTag, styles.alarmTagCategory]}>
                  <Text style={styles.alarmTagText}>
                    {alarmChallenge?.category || "physical"}
                  </Text>
                </View>
                <View style={styles.alarmTag}>
                  <Text style={styles.alarmTagText}>
                    {alarmChallenge?.difficulty || "easy"}
                  </Text>
                </View>
                <View style={styles.alarmTag}>
                  <Text style={styles.alarmTagText}>⏱️ 2 min</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.alarmStartButton} onPress={handleStartChallenge}>
              <Text style={styles.alarmStartButtonText}>Start Challenge Now</Text>
            </TouchableOpacity>

            <View style={styles.alarmSecondaryButtons}>
              <TouchableOpacity style={styles.alarmSecondaryButton} onPress={handleSnoozeChallenge}>
                <Text style={styles.alarmSecondaryButtonText}>⏰ Snooze (2 min)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alarmSecondaryButton}
                onPress={() => setShowAlarm(false)}
              >
                <Text style={styles.alarmSecondaryButtonText}>✕ Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  sectionIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  dangerTitle: {
    color: "#dc2626",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  avatarButtons: {
    flexDirection: "row",
    gap: 12,
  },
  changePhotoButton: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  removePhotoButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  removePhotoText: {
    fontSize: 14,
    color: "#64748b",
  },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#1e293b",
  },
  selectRow: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  selectHalf: {
    flex: 1,
  },
  selectItemFull: {
    padding: 16,
  },
  selectButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#1e293b",
  },
  selectArrow: {
    fontSize: 12,
    color: "#64748b",
  },
  separator: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 16,
  },
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  timeSlotSection: {
    padding: 16,
  },
  timeSlotLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  timeSlotDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  timeSlotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  timeInputContainer: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timeInput: {
    padding: 12,
    fontSize: 16,
    color: "#1e293b",
    textAlign: "center",
  },
  toText: {
    fontSize: 14,
    color: "#64748b",
  },
  removeSlotButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  removeSlotText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 16,
  },
  addSlotButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  addSlotText: {
    color: "#3b82f6",
    fontWeight: "600",
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dangerCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  dangerDescription: {
    fontSize: 14,
    color: "#991b1b",
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  pickerOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#1e293b",
  },
  pickerOptionTextSelected: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 18,
    color: "#3b82f6",
    fontWeight: "bold",
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  deleteModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  deleteModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  deleteModalIconText: {
    fontSize: 32,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  deleteModalDescription: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteModalCancel: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  deleteModalConfirm: {
    flex: 1,
    backgroundColor: "#dc2626",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  countdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  countdownContainer: {
    alignItems: "center",
  },
  countdownNumber: {
    fontSize: 160,
    fontWeight: "800",
    color: "#3b82f6",
  },
  countdownText: {
    fontSize: 24,
    color: "#94a3b8",
    marginTop: 16,
  },
  alarmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alarmModal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  alarmIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  alarmIcon: {
    fontSize: 40,
  },
  alarmTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  alarmSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 20,
  },
  alarmChallengeCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  alarmChallengeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  alarmChallengeDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 12,
  },
  alarmChallengeTags: {
    flexDirection: "row",
    gap: 8,
  },
  alarmTag: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alarmTagCategory: {
    backgroundColor: "#dbeafe",
  },
  alarmTagText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  alarmStartButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    padding: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  alarmStartButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
  alarmSecondaryButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  alarmSecondaryButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  alarmSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
});
