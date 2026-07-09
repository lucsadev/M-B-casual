/**
 * Root layout for the mobile app.
 *
 * Wraps the entire app with TanStack Query's QueryClientProvider
 * (with offline persistence via persistQueryClient), the AuthProvider
 * (for reactive auth state across all screens), and the OfflineBanner
 * for connectivity awareness.
 *
 * Query persistence is configured to cache catalog data (products, categories)
 * for 7 days using AsyncStorage, enabling offline browsing.
 */
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '../lib/query-client';
import { asyncStoragePersister } from '../lib/storage';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { OfflineBanner } from '../components/offline-banner';
import './global.css';

export default function RootLayout() {
  useEffect(() => {
    persistQueryClient({
      queryClient,
      persister: asyncStoragePersister,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      buster: 'mbt-cache-v1',
    });
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OfflineBanner />
          <StatusBar style="dark" />
          <Slot />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
