/**
 * Auth feature barrel — re-exports context, guards, hooks, and pages.
 *
 * Public API for the auth domain:
 * - Context: AuthProvider, useAuth
 * - Guards: ProtectedRoute, GuestRoute
 * - Hooks: useLogin, useRegister
 * - Pages: LoginPage, RegisterPage
 */

// Context
export { AuthProvider, useAuth } from './context/AuthContext';
export type { AuthContextValue, RegisterInput } from './context/AuthContext';

// Guards
export { ProtectedRoute } from './components/ProtectedRoute';
export { GuestRoute } from './components/GuestRoute';

// Hooks
export { useLogin } from './hooks/use-login';
export { useRegister } from './hooks/use-register';

// Pages
export { LoginPage } from './pages/LoginPage';
export { RegisterPage } from './pages/RegisterPage';
