import { QueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';

// Get API URL from environment or use default
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

async function customFetch(url: string, options?: RequestInit) {
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Important for cookie-based auth
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        return customFetch(url);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Helper function for mutations
export async function apiRequest(url: string, options?: RequestInit) {
  return customFetch(url, options);
}
