import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/features/auth/google-icon";

interface GoogleAuthButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function GoogleAuthButton({ label, onClick, disabled, isLoading }: GoogleAuthButtonProps) {
  return (
    <Button type="button" variant="outline" disabled={disabled} isLoading={isLoading} onClick={onClick}>
      {isLoading ? null : <GoogleIcon className="size-4" />}
      {label}
    </Button>
  );
}
