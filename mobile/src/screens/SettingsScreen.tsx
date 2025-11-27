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
  useColorScheme,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import * as ImagePicker from "expo-image-picker";
import ConfettiCannon from "react-native-confetti-cannon";
import Svg, { Circle } from "react-native-svg";

// ICONS
import profileIcon from "../../assets/profile.png";
import preferencesIcon from "../../assets/preferences.png";
import notificationsIcon from "../../assets/notifications.png";
import privacyIcon from "../../assets/privacy.png";
import alarmIcon from "../../assets/alarm.png";
import dangerIcon from "../../assets/danger.png";
import cameraIcon from "../../assets/camera.png";
import trashIcon from "../../assets/bin.png";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type TimerPhase = "initial" | "running" | "finished";
type ResultStatus = "success" | "failed" | null;

const ENCOURAGING_MESSAGES = [
  "Olsun! Bir dahakine yaparsın 💪",
  "Sorun değil! Her deneme bir ilerleme 🌟",
  "Pes etme! Başarı yakın 🚀",
  "Bir dahaki sefere odaklan! Sen yaparsın 💫",
];

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

  // THEME
  const deviceColorScheme = useColorScheme();
  const effectiveTheme =
    form.theme === "system" ? deviceColorScheme || "light" : form.theme;
  const isDarkMode = effectiveTheme === "dark";

  const themed = {
    container: {
      backgroundColor: isDarkMode ? "#020617" : "#f8fafc",
    },
    card: {
      backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
      borderColor: isDarkMode ? "#1f2937" : "#ffffff",
    },
    primaryText: {
      color: isDarkMode ? "#e5e7eb" : "#1e293b",
    },
    secondaryText: {
      color: isDarkMode ? "#9ca3af" : "#64748b",
    },
    input: {
      backgroundColor: isDarkMode ? "#020617" : "#f8fafc",
      borderColor: isDarkMode ? "#1f2937" : "#e2e8f0",
      color: isDarkMode ? "#e5e7eb" : "#1e293b",
    },
    cardShadow: isDarkMode
      ? {}
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
  };

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
            enableScheduledNotifications:
              settings.enableNotifications === 1 ||
              settings.enableNotifications === true,
            challengeScheduleTimes: (settings.challengeScheduleTimes || []).map(
              (slot: any) => ({
                id: slot.id || Date.now().toString(),
                start: slot.start || "09:00",
                end: slot.end || "17:00",
              }),
            ),
          }));
        }
      } catch (error) {
        console.log("Failed to load settings:", error);
        Alert.alert(
          "Error",
          "Failed to load settings. Some data may be stale.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [showAlarm, setShowAlarm] = useState(false);
  const [alarmChallenge, setAlarmChallenge] = useState<any>(null);
  const countdownScale = useRef(new Animated.Value(1)).current;

  const [timerPhase, setTimerPhase] = useState<TimerPhase>("initial");
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [challengeStartTime, setChallengeStartTime] = useState<Date | null>(
    null,
  );
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultStatus, setResultStatus] = useState<ResultStatus>(null);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [randomMessageIndex, setRandomMessageIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // single global save state
  const [savingAll, setSavingAll] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

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

  // GLOBAL SAVE HANDLER
  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      await apiService.saveSettings(getFullFormData());

      await apiService.saveScheduleSettings({
        enableNotifications: form.enableScheduledNotifications ? 1 : 0,
        challengeScheduleTimes: form.challengeScheduleTimes.map((slot) => ({
          id: slot.id,
          start: slot.start,
          end: slot.end,
        })),
      });

      showSuccessAlert("All settings");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to save settings. Please try again.",
      );
    } finally {
      setSavingAll(false);
    }
  };

  // SADECE Challenge Scheduling için kaydet + alarmı başlat
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
      } catch (error) {
        console.log("Failed to fetch challenge after schedule save:", error);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to save schedule settings",
      );
    } finally {
      setSavingSchedule(false);
    }
  };

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
      challengeScheduleTimes: f.challengeScheduleTimes.filter(
        (s) => s.id !== id,
      ),
    }));
  };

  const handleUpdateTimeSlot = (
    id: string,
    field: "start" | "end",
    value: string,
  ) => {
    setForm((f) => ({
      ...f,
      challengeScheduleTimes: f.challengeScheduleTimes.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));
  };

  useEffect(() => {
    if (!showCountdown) return;

    if (countdownValue === 0) {
      setShowCountdown(false);
      Vibration.vibrate([0, 200, 100, 200]);

      setShowAlarm(true);
      setTimerPhase("running");
      setTimeRemaining(120);
      setChallengeStartTime(new Date());

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            setTimerPhase("finished");
            Vibration.vibrate([0, 200, 100, 200, 100, 200]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

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
      setCountdownValue((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownValue, showCountdown, countdownScale]);

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
        [{ text: "OK", onPress: () => logout() }],
      );
    } catch (error: any) {
      Alert.alert(
        "Account Deletion Requested",
        "Your account deletion request has been submitted. You will receive an email confirmation shortly.",
      );
    }
  };

  const handleStartChallenge = () => {
    setShowAlarm(true);
    setTimerPhase("running");
    setTimeRemaining(120);
    setChallengeStartTime(new Date());

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          setTimerPhase("finished");
          Vibration.vibrate([0, 200, 100, 200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelChallenge = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setShowAlarm(false);
    setTimerPhase("initial");
    setTimeRemaining(120);
    Alert.alert("İptal Edildi", "Challenge iptal edildi.");
  };

  const handleSnoozeChallenge = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setShowAlarm(false);
    setTimerPhase("initial");
    setTimeRemaining(120);
    Alert.alert("Ertelendi", "Challenge 2 dakika ertelendi.");

    setTimeout(async () => {
      try {
        const challenge = await apiService.getRandomChallenge();
        setAlarmChallenge(challenge);
        setShowCountdown(true);
        setCountdownValue(3);
      } catch (error) {
        console.log("Failed to fetch challenge for snooze:", error);
      }
    }, 120000);
  };

  const handleCompleteChallenge = async (status: "success" | "failed") => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    const timeSpent = challengeStartTime
      ? Math.floor((Date.now() - challengeStartTime.getTime()) / 1000)
      : 120;

    setShowAlarm(false);

    if (status === "failed") {
      setRandomMessageIndex(
        Math.floor(Math.random() * ENCOURAGING_MESSAGES.length),
      );
    }

    setResultStatus(status);
    setEarnedPoints(status === "success" ? alarmChallenge?.points || 20 : 0);
    setShowResultModal(true);

    if (status === "success") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    try {
      if (alarmChallenge?.id) {
        await apiService.completeChallenge(
          alarmChallenge.id,
          timeSpent,
          status,
        );
      }
    } catch (error) {
      console.log("Error completing challenge:", error);
    }

    setTimerPhase("initial");
    setTimeRemaining(120);
    setChallengeStartTime(null);
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    setResultStatus(null);
    setShowConfetti(false);
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const themeLabels = { system: "System", light: "Light", dark: "Dark" };
  const languageLabels = {
    en: "English",
    tr: "Türkçe",
    de: "Deutsch",
    es: "Español",
  };
  const visibilityLabels = {
    public: "Public",
    friends: "Friends",
    private: "Private",
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, themed.container]}>
        <Text style={[styles.loadingText, themed.secondaryText]}>
          Loading settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, themed.container]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image source={profileIcon} style={styles.sectionIconImage} />
            <View>
              <Text style={[styles.sectionTitle, themed.primaryText]}>
                Profile
              </Text>
              <Text style={[styles.sectionDescription, themed.secondaryText]}>
                Update your basic information and profile photo.
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.card,
              themed.card,
              // @ts-ignore
              themed.cardShadow,
            ]}
          >
            <View style={styles.avatarRow}>
              {form.profileImageUrl ? (
                <Image
                  source={{ uri: form.profileImageUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials()}</Text>
                </View>
              )}
              <View style={styles.avatarButtons}>
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={handlePickImage}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Image
                      source={cameraIcon}
                      style={{ width: 18, height: 18, resizeMode: "contain" }}
                    />
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </View>
                </TouchableOpacity>
                {form.profileImageUrl && (
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() =>
                      setForm((f) => ({ ...f, profileImageUrl: null }))
                    }
                  >
                    <Text style={styles.removePhotoText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* First & Last name */}
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={[styles.inputLabel, themed.primaryText]}>
                  First name
                </Text>
                <TextInput
                  style={[styles.input, themed.input]}
                  value={form.firstName}
                  onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
                  placeholder="Jane"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={[styles.inputLabel, themed.primaryText]}>
                  Last name
                </Text>
                <TextInput
                  style={[styles.input, themed.input]}
                  value={form.lastName}
                  onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
                  placeholder="Doe"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Username & Email - vertical */}
            <View style={styles.inputRowColumn}>
              <View style={styles.inputFull}>
                <Text style={[styles.inputLabel, themed.primaryText]}>
                  Username
                </Text>
                <TextInput
                  style={[styles.input, themed.input]}
                  value={form.username}
                  onChangeText={(v) => setForm((f) => ({ ...f, username: v }))}
                  placeholder="janedoe"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputFull}>
                <Text style={[styles.inputLabel, themed.primaryText]}>
                  Email
                </Text>
                <TextInput
                  style={[styles.input, themed.input]}
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
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image source={preferencesIcon} style={styles.sectionIconImage} />
            <View>
              <Text style={[styles.sectionTitle, themed.primaryText]}>
                Preferences
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.card,
              themed.card,
              // @ts-ignore
              themed.cardShadow,
            ]}
          >
            <View style={styles.selectRow}>
              <View style={styles.selectHalf}>
                <Text style={[styles.inputLabel, themed.primaryText]}>
                  Theme
                </Text>
                <TouchableOpacity
                  style={[styles.selectButton, themed.input]}
                  onPress={() => setShowThemePicker(true)}
                >
                  <Text style={[styles.selectButtonText, themed.primaryText]}>
                    {themeLabels[form.theme]}
                  </Text>
                  <Text style={[styles.selectArrow, themed.secondaryText]}>
                    ▼
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.selectHalf}>
                <Text style={[styles.inputLabel, themed.primaryText]}>
                  Language
                </Text>
                <TouchableOpacity
                  style={[styles.selectButton, themed.input]}
                  onPress={() => setShowLanguagePicker(true)}
                >
                  <Text style={[styles.selectButtonText, themed.primaryText]}>
                    🌐{" "}
                    {
                      languageLabels[
                        form.language as keyof typeof languageLabels
                      ]
                    }
                  </Text>
                  <Text style={[styles.selectArrow, themed.secondaryText]}>
                    ▼
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image source={notificationsIcon} style={styles.sectionIconImage} />
            <View>
              <Text style={[styles.sectionTitle, themed.primaryText]}>
                Notifications
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.card,
              themed.card,
              // @ts-ignore
              themed.cardShadow,
            ]}
          >
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, themed.primaryText]}>
                  Email notifications
                </Text>
                <Text style={[styles.toggleDescription, themed.secondaryText]}>
                  Updates about challenges and weekly summaries.
                </Text>
              </View>
              <Switch
                value={form.emailNotifications}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, emailNotifications: v }))
                }
                trackColor={{
                  false: "#e2e8f0",
                  true: "#000000",
                }}
                thumbColor="#ffffff"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, themed.primaryText]}>
                  Push notifications
                </Text>
                <Text style={[styles.toggleDescription, themed.secondaryText]}>
                  Get notified instantly on new activity.
                </Text>
              </View>
              <Switch
                value={form.pushNotifications}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, pushNotifications: v }))
                }
                trackColor={{
                  false: "#e2e8f0",
                  true: "#000000",
                }}
                thumbColor="#ffffff"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, themed.primaryText]}>
                  Weekly summary
                </Text>
                <Text style={[styles.toggleDescription, themed.secondaryText]}>
                  A recap of your progress every week.
                </Text>
              </View>
              <Switch
                value={form.weeklySummary}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, weeklySummary: v }))
                }
                trackColor={{
                  false: "#e2e8f0",
                  true: "#000000",
                }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image source={privacyIcon} style={styles.sectionIconImage} />
            <View>
              <Text style={[styles.sectionTitle, themed.primaryText]}>
                Privacy
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.card,
              themed.card,
              // @ts-ignore
              themed.cardShadow,
            ]}
          >
            <View style={styles.selectItemFull}>
              <Text style={[styles.inputLabel, themed.primaryText]}>
                Profile visibility
              </Text>
              <TouchableOpacity
                style={[styles.selectButton, themed.input]}
                onPress={() => setShowVisibilityPicker(true)}
              >
                <Text style={[styles.selectButtonText, themed.primaryText]}>
                  {visibilityLabels[form.profileVisibility]}
                </Text>
                <Text style={[styles.selectArrow, themed.secondaryText]}>
                  ▼
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.separator} />
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, themed.primaryText]}>
                  Allow anonymized data sharing
                </Text>
                <Text style={[styles.toggleDescription, themed.secondaryText]}>
                  Help us improve by sharing usage metrics.
                </Text>
              </View>
              <Switch
                value={form.dataSharing}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, dataSharing: v }))
                }
                trackColor={{
                  false: "#e2e8f0",
                  true: "#000000",
                }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Challenge Scheduling Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image source={alarmIcon} style={styles.sectionIconImage} />
            <View>
              <Text style={[styles.sectionTitle, themed.primaryText]}>
                Challenge Scheduling
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.card,
              themed.card,
              // @ts-ignore
              themed.cardShadow,
            ]}
          >
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, themed.primaryText]}>
                  Enable scheduled notifications
                </Text>
                <Text style={[styles.toggleDescription, themed.secondaryText]}>
                  Receive automatic challenge notifications during your selected
                  time slots.
                </Text>
              </View>
              <Switch
                value={form.enableScheduledNotifications}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, enableScheduledNotifications: v }))
                }
                trackColor={{
                  false: "#e2e8f0",
                  true: "#000000",
                }}
                thumbColor="#ffffff"
              />
            </View>

            {form.enableScheduledNotifications && (
              <>
                <View style={styles.separator} />
                <View style={styles.timeSlotSection}>
                  <Text style={[styles.timeSlotLabel, themed.primaryText]}>
                    Active Time Slots
                  </Text>
                  <Text
                    style={[styles.timeSlotDescription, themed.secondaryText]}
                  >
                    Add time ranges when you want to receive challenges.
                  </Text>

                  {form.challengeScheduleTimes.map((slot) => (
                    <View key={slot.id} style={styles.timeSlotRow}>
                      <View style={styles.timeInputContainer}>
                        <TextInput
                          style={[styles.timeInput, themed.input]}
                          value={slot.start}
                          onChangeText={(v) =>
                            handleUpdateTimeSlot(slot.id, "start", v)
                          }
                          placeholder="09:00"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                      <Text style={[styles.toText, themed.secondaryText]}>
                        to
                      </Text>
                      <View style={styles.timeInputContainer}>
                        <TextInput
                          style={[styles.timeInput, themed.input]}
                          value={slot.end}
                          onChangeText={(v) =>
                            handleUpdateTimeSlot(slot.id, "end", v)
                          }
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

                  {/* Add + Save yan yana aynı tasarım */}
                  <View style={styles.timeSlotActionsRow}>
                    <TouchableOpacity
                      style={styles.addSlotButton}
                      onPress={handleAddTimeSlot}
                    >
                      <Text style={styles.addSlotText}>+ Add Time Slot</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.addSlotButton}
                      onPress={handleSaveSchedule}
                      disabled={savingSchedule}
                    >
                      <Text style={styles.addSlotText}>
                        {savingSchedule ? "Saving..." : "Save"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.globalSaveContainer}>
            <TouchableOpacity
              style={[styles.saveButton, savingAll && styles.buttonDisabled]}
              onPress={handleSaveAll}
              disabled={savingAll}
            >
              <Text style={styles.saveButtonText}>
                {savingAll ? "Saving..." : "Save All Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image source={dangerIcon} style={styles.sectionIconImage} />
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  styles.dangerTitle,
                  { color: "#dc2626" },
                ]}
              >
                Danger Zone
              </Text>
            </View>
          </View>

          <View style={styles.dangerCard}>
            <Text style={styles.dangerDescription}>
              Once you delete your account, there is no going back. Please be
              certain.
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
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
                {form.theme === option && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
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
                {form.language === option && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
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
                  form.profileVisibility === option &&
                    styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setForm((f) => ({ ...f, profileVisibility: option }));
                  setShowVisibilityPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    form.profileVisibility === option &&
                      styles.pickerOptionTextSelected,
                  ]}
                >
                  {visibilityLabels[option]}
                </Text>
                {form.profileVisibility === option && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
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
              Are you sure you want to delete your account? This action cannot
              be undone and all your data will be permanently removed.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancel}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirm}
                onPress={confirmDeleteAccount}
              >
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Countdown Modal */}
      <Modal visible={showCountdown} transparent animationType="fade">
        <View style={styles.countdownOverlay}>
          <View style={styles.countdownModal}>
            <Text style={styles.countdownTitle}>
              Challenge Yakında Başlıyor!
            </Text>
            <Text style={styles.countdownSubtitle}>Hazır ol...</Text>
            <Animated.View style={{ transform: [{ scale: countdownScale }] }}>
              <Text style={styles.countdownNumber}>{countdownValue}</Text>
            </Animated.View>
          </View>
        </View>
      </Modal>

      {/* Challenge Timer Modal */}
      <Modal visible={showAlarm} transparent animationType="slide">
        <View style={styles.alarmOverlay}>
          <View style={styles.timerModal}>
            <Text style={styles.timerChallengeTitle}>
              {alarmChallenge?.title || "2 Dakikalık Challenge"}
            </Text>

            <View style={styles.circularTimerContainer}>
              <Svg width={200} height={200} style={styles.circularTimerSvg}>
                <Circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                <Circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke={`hsl(${(timeRemaining / 120) * 120}, 70%, 50%)`}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 85}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 85 * (1 - timeRemaining / 120)
                  }`}
                  transform="rotate(-90, 100, 100)"
                />
              </Svg>
              <View style={styles.timerTextContainer}>
                <Text
                  style={[
                    styles.timerText,
                    {
                      color: `hsl(${(timeRemaining / 120) * 120}, 70%, 45%)`,
                    },
                  ]}
                >
                  {Math.floor(timeRemaining / 60)}:
                  {(timeRemaining % 60).toString().padStart(2, "0")}
                </Text>
                <Text style={styles.timerPoints}>
                  ⏱️ {alarmChallenge?.points || 20} puan
                </Text>
              </View>
            </View>

            <Text style={styles.timerDescription}>
              {alarmChallenge?.description ||
                "Bu challenge'ı tamamlamak için 2 dakikan var."}
            </Text>

            {alarmChallenge?.instructions && (
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>Talimatlar:</Text>
                <Text style={styles.instructionsText}>
                  {alarmChallenge.instructions}
                </Text>
              </View>
            )}

            {timerPhase === "running" && (
              <View style={styles.timerButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelChallenge}
                >
                  <Text style={styles.cancelButtonText}>✕ İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.snoozeButton}
                  onPress={handleSnoozeChallenge}
                >
                  <Text style={styles.snoozeButtonText}>▷| 2dk Ertele</Text>
                </TouchableOpacity>
              </View>
            )}

            {timerPhase === "finished" && (
              <View style={styles.timerButtonsRow}>
                <TouchableOpacity
                  style={styles.failedButton}
                  onPress={() => handleCompleteChallenge("failed")}
                >
                  <Text style={styles.failedButtonText}>✕ Yapmadım</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={() => handleCompleteChallenge("success")}
                >
                  <Text style={styles.successButtonText}>✓ Yaptım!</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Result Modal - Success */}
      <Modal
        visible={showResultModal && resultStatus === "success"}
        transparent
        animationType="fade"
      >
        <View style={styles.resultOverlay}>
          {showConfetti && (
            <ConfettiCannon
              ref={confettiRef}
              count={200}
              origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
              autoStart
              fadeOut
              colors={["#22c55e", "#10b981", "#86efac", "#34d399", "#6ee7b7"]}
            />
          )}
          <View style={styles.resultModal}>
            <TouchableOpacity
              style={styles.resultCloseButton}
              onPress={handleCloseResultModal}
            >
              <Text style={styles.resultCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={styles.resultTitleSuccess}>Tebrikler!</Text>
            <Text style={styles.resultMessage}>
              Challenge'ı başarıyla tamamladın!
            </Text>
            <Text style={styles.resultPoints}>
              {earnedPoints} puan kazandın!
            </Text>
            <TouchableOpacity
              style={styles.resultOkButton}
              onPress={handleCloseResultModal}
            >
              <Text style={styles.resultOkButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Result Modal - Failed */}
      <Modal
        visible={showResultModal && resultStatus === "failed"}
        transparent
        animationType="fade"
      >
        <View style={styles.resultOverlay}>
          <View style={styles.resultModal}>
            <TouchableOpacity
              style={styles.resultCloseButton}
              onPress={handleCloseResultModal}
            >
              <Text style={styles.resultCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.resultEmoji}>💪</Text>
            <Text style={styles.resultTitleFailed}>Olsun!</Text>
            <Text style={styles.resultMessage}>
              {ENCOURAGING_MESSAGES[randomMessageIndex]}
            </Text>
            <TouchableOpacity
              style={styles.resultOkButton}
              onPress={handleCloseResultModal}
            >
              <Text style={styles.resultOkButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  sectionIconImage: {
    width: 24,
    height: 24,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  dangerTitle: {
    color: "#dc2626",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 18,
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
    paddingBottom: 8,
    gap: 12,
  },
  inputRowColumn: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputFull: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
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
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectButtonText: {
    fontSize: 16,
  },
  selectArrow: {
    fontSize: 12,
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
    marginBottom: 4,
    color: "#1e293b",
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
    borderRadius: 8,
    borderWidth: 1,
  },
  timeInput: {
    padding: 12,
    fontSize: 16,
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
  timeSlotActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  addSlotButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  addSlotText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 14,
  },

  // GLOBAL SAVE
  globalSaveContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
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
    padding: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 15,
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
  countdownModal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    minWidth: 280,
  },
  countdownTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 12,
  },
  countdownSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 24,
  },
  countdownNumber: {
    fontSize: 160,
    fontWeight: "800",
    color: "#3b82f6",
  },
  alarmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  timerModal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  timerChallengeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 20,
  },
  circularTimerContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  circularTimerSvg: {
    position: "absolute",
  },
  timerTextContainer: {
    alignItems: "center",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
  },
  timerPoints: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  timerDescription: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  instructionsBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  timerButtonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  snoozeButton: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  snoozeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  failedButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ef4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  failedButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ef4444",
  },
  successButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  successButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultModal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  resultCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
  },
  resultCloseText: {
    fontSize: 20,
    color: "#94a3b8",
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitleSuccess: {
    fontSize: 32,
    fontWeight: "700",
    color: "#22c55e",
    marginBottom: 12,
  },
  resultTitleFailed: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  resultMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 8,
  },
  resultPoints: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: 24,
  },
  resultOkButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    width: "100%",
  },
  resultOkButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
});
