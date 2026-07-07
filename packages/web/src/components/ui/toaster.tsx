import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toaster component using sonner.
 * Place at the root of the app (inside the router provider).
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        },
      }}
    />
  );
}
