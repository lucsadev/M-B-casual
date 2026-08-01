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
import { Stack, SplashScreen } from 'expo-router';
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
import { useAdminNewOrderNotifications } from '../features/admin/notifications/use-admin-new-order-notifications';
import { BrandHeader } from '../components/BrandHeader';
import { View, Text } from 'react-native';
import './global.css';

SplashScreen.preventAutoHideAsync();
function AdminNewOrderNotifications() {
  useAdminNewOrderNotifications();

  return null;
}

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
          <AdminNewOrderNotifications />
          <OfflineBanner />
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#FFFFFF', height: 140 } as any,
              headerTintColor: '#1A1A1A',
              headerTitleAlign: 'center',
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(admin)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="login"
              options={{ headerTitle: () => <BrandHeader subtitle="Iniciar sesión" /> }}
            />
            <Stack.Screen
              name="register"
              options={{ headerTitle: () => <BrandHeader subtitle="Crear cuenta" /> }}
            />
            <Stack.Screen
              name="checkout"
              options={{ headerTitle: () => <BrandHeader subtitle="Finalizar compra" /> }}
            />
            <Stack.Screen
              name="producto/[slug]"
              options={{ headerTitle: () => <BrandHeader subtitle="Detalle de producto" /> }}
            />
            <Stack.Screen
              name="orden/[id]"
              options={{ headerTitle: () => <BrandHeader subtitle="Pedido confirmado" /> }}
            />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

