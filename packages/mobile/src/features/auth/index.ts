/**
 * Auth feature barrel (mobile) — re-exports context, hooks, and screens.
 *
 * Public API for the mobile auth domain:
 * - Context: AuthProvider, useAuth
 * - Hooks: useLogin, useRegister, useProfile, useUpdateProfile
 * - Screens: LoginScreen, RegisterScreen, ProfileScreen
 */

// Context
export { AuthProvider, useAuth } from './context/AuthContext';
export type { AuthContextValue, RegisterInput } from './context/AuthContext';

// Hooks
export { useLogin } from './hooks/use-login';
export type { UseLoginReturn } from './hooks/use-login';
export { useRegister } from './hooks/use-register';
export type { UseRegisterReturn } from './hooks/use-register';
export { useProfile, useUpdateProfile } from './hooks/use-profile';
export type { UseProfileReturn, UseUpdateProfileReturn } from './hooks/use-profile';

// Screens
export { default as LoginScreen } from './screens/LoginScreen';
export { default as RegisterScreen } from './screens/RegisterScreen';
export { default as ProfileScreen } from './screens/ProfileScreen';