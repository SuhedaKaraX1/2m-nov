import { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
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
        isLogin ? 'Login Failed' : 'Registration Failed',
        error.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={styles.title}>2Mins Challenge</Text>
          <Text style={styles.subtitle}>
            Build better habits, one 2-minute challenge at a time
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {isLogin
              ? 'Sign in to continue your wellness journey'
              : 'Start your 2-minute challenge journey'}
          </Text>

          {isLogin ? (
            <>
              <Text style={styles.label}>Email or Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or username"
                placeholderTextColor="#666"
                value={formData.emailOrUsername}
                onChangeText={(text) => updateField('emailOrUsername', text)}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                secureTextEntry
              />
            </>
          ) : (
            <>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    placeholderTextColor="#666"
                    value={formData.firstName}
                    onChangeText={(text) => updateField('firstName', text)}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    placeholderTextColor="#666"
                    value={formData.lastName}
                    onChangeText={(text) => updateField('lastName', text)}
                  />
                </View>
              </View>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#666"
                value={formData.username}
                onChangeText={(text) => updateField('username', text)}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#666"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                secureTextEntry
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#3b82f6',
    fontSize: 14,
  },
});
