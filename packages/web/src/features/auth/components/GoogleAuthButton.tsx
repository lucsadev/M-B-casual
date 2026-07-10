import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGoogleAuth, parseOAuthError } from '../hooks/use-google-auth';

interface GoogleAuthButtonProps {
  redirectPath?: string | null;
  label: string;
  loadingLabel: string;
  onError: (message: string) => void;
}

export function GoogleAuthButton({
  redirectPath,
  label,
  loadingLabel,
  onError,
}: GoogleAuthButtonProps) {
  const { mutate: signInWithGoogle, isPending, error } = useGoogleAuth();

  useEffect(() => {
    if (error) {
      onError(parseOAuthError(error));
    }
  }, [error, onError]);

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={isPending}
      onClick={() => signInWithGoogle({ redirectPath })}
      className="w-full border-[#E2E2DC] bg-white text-[#1A1A1A] hover:bg-[#F7F1EC]"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#E2E2DC] text-sm font-semibold text-[#4285F4]">
        G
      </span>
      {isPending ? loadingLabel : label}
    </Button>
  );
}
