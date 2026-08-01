import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';

export function useIsAdmin() {
  const { user, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    // Check admin role from app_metadata (set server-side via DB trigger)
    const role = user?.app_metadata?.role;
    setIsAdmin(role === 'admin');
    setIsLoading(false);
  }, [session, user]);

  return { data: isAdmin, isLoading };
}