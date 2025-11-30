import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    emailOrUsername: "",
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.emailOrUsername, formData.password);
      } else {
        await register({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      }
    } catch (error: any) {
      Alert.alert(
        isLogin ? "Login Failed" : "Registration Failed",
        error.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.cardBackground, borderColor: colors.cardBackground, shadowColor: colors.primary }]}>
            <Image
              source={require("../../assets/logo.jpg")}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>2Mins Challenge</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Transform your life, two minutes at a time
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
          <View style={[styles.tabContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <TouchableOpacity
              style={[styles.tab, isLogin && { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, isLogin && { color: colors.textInverse }]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, !isLogin && { color: colors.textInverse }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {isLogin ? (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Email or Username</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholder="Enter your email or username"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={formData.emailOrUsername}
                  onChangeText={(t) => updateField("emailOrUsername", t)}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={formData.password}
                  onChangeText={(t) => updateField("password", t)}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                    placeholder="John"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={formData.firstName}
                    onChangeText={(t) => updateField("firstName", t)}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                    placeholder="Doe"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={formData.lastName}
                    onChangeText={(t) => updateField("lastName", t)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholder="john.doe@example.com"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={formData.email}
                  onChangeText={(t) => updateField("email", t)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Username</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholder="johndoe"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={formData.username}
                  onChangeText={(t) => updateField("username", t)}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={formData.password}
                  onChangeText={(t) => updateField("password", t)}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={[styles.buttonText, { color: colors.textInverse }]}>
                {isLogin ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Text style={[styles.socialButtonText, { color: colors.primary }]}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Text style={[styles.socialButtonText, { color: colors.primary }]}>A</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Text style={[styles.socialButtonText, { color: colors.primary }]}>F</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderWidth: 4,
  },
  logoImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1.5,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  halfInput: {
    flex: 1,
  },
  forgotPassword: {
    alignItems: "flex-end",
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: "500",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  socialButtonText: {
    fontSize: 20,
    fontWeight: "700",
  },
  footer: {
    marginTop: 32,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
