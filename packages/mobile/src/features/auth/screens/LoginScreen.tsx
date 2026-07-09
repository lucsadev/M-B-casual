/**
 * LoginScreen — Mobile login form.
 *
 * Route: /login
 *
 * Features:
 * - Email + password inputs with NativeWind styling
 * - "Ingresar" submit button with loading state
 * - Inline error display (Zod validation + Supabase Auth errors)
 * - Link to register screen
 * - Redirects to tabs on success via auth guard in layout
 * - Session-aware: if already authenticated, redirect is handled by auth guard
 */
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLogin } from '../hooks/use-login';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { login, isPending, error, clearError } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Redirect on successful login
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleLogin = useCallback(async () => {
    clearError();
    setValidationError(null);

    // Client-side validation
    if (!email.trim()) {
      setValidationError('El email es requerido.');
      return;
    }
    if (!password) {
      setValidationError('La contraseña es requerida.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('El email no es válido.');
      return;
    }

    try {
      await login(email.trim(), password);
      // Navigation handled by useEffect watching user state
    } catch {
      // Error is already set via useLogin hook
    }
  }, [email, password, login, clearError]);

  const displayError = validationError || error;

  return (
    <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ title: 'Iniciar sesión' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-10">
            <Text className="text-4xl mb-2">👤</Text>
            <Text className="text-2xl font-bold text-[#1A1A1A]">
              Iniciar sesión
            </Text>
            <Text className="text-sm text-[#1A1A1A]/60 mt-1">
              Ingresá tu email y contraseña
            </Text>
          </View>

          {/* Error display */}
          {displayError && (
            <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{displayError}</Text>
            </View>
          )}

          {/* Email */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1.5">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (validationError) setValidationError(null);
                if (error) clearError();
              }}
              placeholder="tu@email.com"
              placeholderTextColor="#1A1A1A/40"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isPending}
              className="bg-white border border-[#E8E4D9] rounded-lg px-4 py-3 text-base text-[#1A1A1A]"
            />
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1.5">
              Contraseña
            </Text>
            <TextInput
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (validationError) setValidationError(null);
                if (error) clearError();
              }}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              editable={!isPending}
              className="bg-white border border-[#E8E4D9] rounded-lg px-4 py-3 text-base text-[#1A1A1A]"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isPending}
            className={`w-full py-3.5 rounded-md items-center mb-4 ${
              isPending
                ? 'bg-neutral-300'
                : 'bg-[#D4A853] active:bg-[#D4A853]/80'
            }`}
          >
            {isPending ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white font-semibold text-base">
                  Ingresando...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-base">
                Ingresar
              </Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-[#1A1A1A]/60">
              ¿No tenés cuenta?{' '}
            </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text className="text-sm font-bold text-[#D4A853]">
                  Crear cuenta
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}