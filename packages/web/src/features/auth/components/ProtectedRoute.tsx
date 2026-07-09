/**
 * ProtectedRoute — Route guard for authenticated-only pages.
 *
 * - Loading state: renders a centered spinner while session resolves
 * - Unauthenticated: redirects to /login, saving the current location
 *   so the user can be redirected back after login
 * - Authenticated: renders the children (or <Outlet /> for nested routes)
 *
 * @example
 * <Route element={<ProtectedRoute />}>
 *   <Route path="checkout" element={<CheckoutPage />} />
 * </Route>
 *
 * // Or wrap a single element:
 * <Route path="perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  /** Optional children. When omitted, renders <Outlet /> for nested routes. */
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Loading spinner while session resolves
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-[#D4A853]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-[#1A1A1A]/60">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated — render children or outlet
  return children ? <>{children}</> : <Outlet />;
}
