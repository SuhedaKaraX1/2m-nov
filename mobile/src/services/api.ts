import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiService {
  private sessionCookie: string | null = null;

  async init() {
    this.sessionCookie = await AsyncStorage.getItem('session_cookie');
  }

  async setSessionCookie(cookie: string) {
    this.sessionCookie = cookie;
    await AsyncStorage.setItem('session_cookie', cookie);
  }

  async clearSession() {
    this.sessionCookie = null;
    await AsyncStorage.removeItem('session_cookie');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.sessionCookie) {
      requestHeaders['Cookie'] = this.sessionCookie;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      await this.setSessionCookie(setCookie);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async login(emailOrUsername: string, password: string) {
    return this.request<any>('/api/auth/local/login', {
      method: 'POST',
      body: { emailOrUsername, password },
    });
  }

  async register(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.request<any>('/api/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  async logout() {
    await this.request('/api/logout', { method: 'POST' });
    await this.clearSession();
  }

  async getCurrentUser() {
    return this.request<any>('/api/auth/user');
  }

  async updateOnboarding(preferences: {
    preferredCategories: string[];
    hasMentalHealthConcerns: string;
    mentalHealthDetails: string;
    preferredDays: number[];
  }) {
    return this.request<any>('/api/auth/onboarding', {
      method: 'POST',
      body: preferences,
    });
  }

  async getProgress() {
    return this.request<any>('/api/progress');
  }

  async getChallenges(category?: string) {
    const url = category ? `/api/challenges?category=${category}` : '/api/challenges';
    return this.request<any[]>(url);
  }

  async getChallenge(id: string) {
    return this.request<any>(`/api/challenges/${id}`);
  }

  async getRandomChallenge() {
    return this.request<any>('/api/challenges/random');
  }

  async completeChallenge(id: string, timeSpent: number) {
    return this.request<any>(`/api/challenges/${id}/complete`, {
      method: 'POST',
      body: { timeSpent },
    });
  }

  async getHistory() {
    return this.request<any[]>('/api/history');
  }

  async getAchievements() {
    return this.request<any[]>('/api/achievements/user');
  }

  async getDailyStats(days: number = 30) {
    return this.request<any[]>(`/api/analytics/daily?days=${days}`);
  }

  async getCategoryDistribution() {
    return this.request<any[]>('/api/analytics/category');
  }
}

export const apiService = new ApiService();
