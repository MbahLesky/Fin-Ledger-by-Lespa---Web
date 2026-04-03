import { Navigate } from "react-router-dom";
import { ROUTES } from "@/routes/route-constants";
import { isProfileComplete, useAuthStore } from "@/store/auth-store";
import { SessionRestorePage } from "@/pages/session-restore-page";

export function RootRedirect() {
  const status = useAuthStore((state) => state.status);
  const profile = useAuthStore((state) => state.profile);

  if (status === "checking") {
    return <SessionRestorePage />;
  }

  if (status !== "signed_in") {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (!isProfileComplete(profile)) {
    return <Navigate to={ROUTES.profileCompletion} replace />;
  }

  if (!profile?.onboardingCompleted) {
    return <Navigate to={ROUTES.onboardingCurrency} replace />;
  }

  return <Navigate to={ROUTES.dashboard} replace />;
}

