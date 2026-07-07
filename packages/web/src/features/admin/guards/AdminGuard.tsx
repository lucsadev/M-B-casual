/**
 * AdminGuard — Role-based route guard for admin sections.
 *
 * Checks that the current user has an admin role by reading
 * the JWT claims via supabase.auth.getSession(). If not
 * authenticated, redirects to /login. If authenticated but
 * not admin, shows an unauthorized message.
 *
 * The admin role is expected to be set in the user's
 * app_metadata (raw_app_meta_data) by a database trigger
 * or admin action — never from user-supplied metadata.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

type GuardState = 'loading' | 'authorized' | 'unauthorized' | 'unauthenticated';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<GuardState>('loading');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        if (!cancelled) setState('unauthenticated');
        return;
      }

      // Read role from app_metadata (set server-side, not user-editable)
      const role = sessionData.session.user.app_metadata?.role;

      if (role === 'admin') {
        if (!cancelled) setState('authorized');
      } else {
        if (!cancelled) setState('unauthorized');
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (state === 'unauthenticated') {
      const timeout = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [state, navigate]);

  if (state === 'loading') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-[#1A1A1A]/60">Verificando acceso...</div>
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-[#1A1A1A]">
            Sesión requerida
          </h2>
          <p className="text-[#1A1A1A]/60">
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  if (state === 'unauthorized') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-[#1A1A1A]">
            Acceso denegado
          </h2>
          <p className="text-[#1A1A1A]/60">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
