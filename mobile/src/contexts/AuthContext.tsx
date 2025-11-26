import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateOnboarding: (preferences: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await apiService.init();
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    const userData = await apiService.login(emailOrUsername, password);
    setUser(userData);
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const userData = await apiService.register(data);
    setUser(userData);
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
  };

  const updateOnboarding = async (preferences: any) => {
    const updatedUser = await apiService.updateOnboarding(preferences);
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateOnboarding,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
