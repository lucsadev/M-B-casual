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
import { Slot, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { Montserrat_300Light } from '@expo-google-fonts/montserrat';
import { Allura_400Regular } from '@expo-google-fonts/allura';
import { queryClient } from '../lib/query-client';
import { asyncStoragePersister } from '../lib/storage';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { OfflineBanner } from '../components/offline-banner';
import { View, Text } from 'react-native';
import './global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'CormorantGaramond': CormorantGaramond_700Bold,
    'Montserrat': Montserrat_300Light,
    'Allura': Allura_400Regular,
  });

  useEffect(() => {
    persistQueryClient({
      queryClient,
      persister: asyncStoragePersister,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      buster: 'mbt-cache-v1',
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

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
