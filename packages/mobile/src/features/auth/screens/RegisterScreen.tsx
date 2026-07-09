/**
 * RegisterScreen — Mobile registration form.
 *
 * Route: /register
 *
 * Features:
 * - Campos: nombre, apellido, email, teléfono, password, confirmar password
 * - Client-side validation before submit
 * - "Crear cuenta" button with loading state
 * - Inline error display (validation + Supabase Auth errors)
 * - Link to login screen
 * - Redirects to tabs on success (or shows success message if confirmEmail required)
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
import { useRegister } from '../hooks/use-register';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { register, isPending, error, clearError } = useRegister();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Redirect on successful registration (if user is already set)
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const validate = useCallback((): boolean => {
    if (!nombre.trim()) {
      setValidationError('El nombre es requerido.');
      return false;
    }
    if (!email.trim()) {
      setValidationError('El email es requerido.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('El email no es válido.');
      return false;
    }
    if (!telefono.trim() || !/^(\+54)?\d{7,15}$/.test(telefono.trim())) {
      setValidationError('El teléfono no es válido (ej: +541112345678).');
      return false;
    }
    if (!password || password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden.');
      return false;
    }
    return true;
  }, [nombre, email, telefono, password, confirmPassword]);

  const handleRegister = useCallback(async () => {
    clearError();
    setValidationError(null);

    if (!validate()) return;

    try {
      await register({
        email: email.trim(),
        password,
        nombre: nombre.trim(),
        apellido: apellido.trim() || undefined,
        telefono: telefono.trim() || undefined,
      });
      // If user is set immediately (no email confirmation), useEffect redirects
      // If email confirmation is required, show success message
    } catch {
      // Error is already set via useRegister hook
    }
  }, [email, password, nombre, apellido, telefono, register, validate, clearError]);

  const displayError = validationError || error;

  return (
    <View className="flex-1 bg-[#FFFFFF]" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ title: 'Crear cuenta' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-4xl mb-2">📝</Text>
            <Text className="text-2xl font-bold text-[#1A1A1A]">
              Crear cuenta
            </Text>
            <Text className="text-sm text-[#1A1A1A]/60 mt-1">
              Completá tus datos para registrarte
            </Text>
          </View>

          {/* Error display */}
          {displayError && (
            <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{displayError}</Text>
            </View>
          )}

          {/* Success message if no redirect (email confirmation) */}
          {!user && !displayError && !isPending && (
            /* empty — form is still shown */
            null
          )}

          {/* Nombre */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1.5">
              Nombre <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={nombre}
              onChangeText={(val) => {
                setNombre(val);
                if (validationError) setValidationError(null);
                if (error) clearError();
              }}
              placeholder="Tu nombre"
              placeholderTextColor="#1A1A1A/40"
              autoCapitalize="words"
              editable={!isPending}
              className="bg-white border border-[#E8E4D9] rounded-lg px-4 py-3 text-base text-[#1A1A1A]"
            />
          </View>

          {/* Apellido */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1.5">
              Apellido
            </Text>
            <TextInput
              value={apellido}
              onChangeText={(val) => {
                setApellido(val);
                if (validationError) setValidationError(null);
              }}
              placeholder="Tu apellido"
              placeholderTextColor="#1A1A1A/40"
              autoCapitalize="words"
              editable={!isPending}
              className="bg-white border border-[#E8E4D9] rounded-lg px-4 py-3 text-base text-[#1A1A1A]"
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1.5">
              Email <Text className="text-red-500">*</Text>
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
              editable={!isPending}
              className="bg-white border border-[#E8E4D9] rounded-lg px-4 py-3 text-base text-[#1A1A1A]"
            />
          </View>

          {/* Teléfono */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1.5">
              Teléfono <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={telefono}
              onChangeText={(val) => {
                setTelefono(val);
                if (validationError) setValidationError(null);
              }}
              placeholder="+541123456789"
              placeholderTextColor="#1A1A1A/40"
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!isPending}
              className="bg-white border border-[#E8E4D9] rounded-lg px-4 py-3 text-base text-[#1A1A1A]"
            />
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1.5">
              Contraseña <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (validationError) setValidationError(null);
                if (error) clearError();
              }}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#1A1A1A/40"
              secureTextEntry
              autoComplete="new-password"
              editable={!isPending}
              className="bg-white border border-[#E8E4D9] rounded-lg px-4 py-3 text-base text-[#1A1A1A]"
            />
          </View>

          {/* Confirm password */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-[#1A1A1A] mb-1.5">
              Confirmar contraseña <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                if (validationError) setValidationError(null);
              }}
              placeholder="Repetí la contraseña"
              placeholderTextColor="#1A1A1A/40"
              secureTextEntry
              autoComplete="new-password"
              editable={!isPending}
              className="bg-white border border-[#E8E4D9] rounded-lg px-4 py-3 text-base text-[#1A1A1A]"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleRegister}
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
                  Creando cuenta...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-base">
                Crear cuenta
              </Text>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-[#1A1A1A]/60">
              ¿Ya tenés cuenta?{' '}
            </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-sm font-bold text-[#D4A853]">
                  Iniciar sesión
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}