/**
 * GuestRoute — Route guard for guest-only pages (login, register).
 *
 * Inverse of ProtectedRoute:
 * - Loading: spinner while session resolves
 * - Authenticated: redirect to home (/) — logged-in users shouldn't
 *   see login/register forms
 * - Guest: render children
 *
 * @example
 * <Route element={<GuestRoute />}>
 *   <Route path="login" element={<LoginPage />} />
 * </Route>
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sanitizeRedirectPath } from '../hooks/use-google-auth';

interface GuestRouteProps {
  /** Optional children. When omitted, renders <Outlet /> for nested routes. */
  children?: React.ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-[#E8836B]"
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

  // Already authenticated — redirect away from guest page
  if (user) {
    if (user.app_metadata?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    const redirectTo = new URLSearchParams(location.search).get('redirectTo');
    return <Navigate to={sanitizeRedirectPath(redirectTo)} replace />;
  }

  // Guest — render children or outlet
  return children ? <>{children}</> : <Outlet />;
}
