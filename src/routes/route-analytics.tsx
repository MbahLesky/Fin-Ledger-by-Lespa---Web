import { Outlet } from "react-router-dom";
import { usePageViewTracking } from "@/hooks/use-page-view-tracking";
import { AccountSwitchPage } from "@/pages/account-switch-page";
import { useAuthStore } from "@/store/auth-store";

/**
 * Pathless layout route that reports page views. It has to live inside the router
 * (rather than alongside the other providers) because useLocation only works
 * within a router context.
 *
 * It is also where an unresolved account switch is held: wrapping every route
 * means the previous account's workspace cannot be reached from any URL until the
 * question of what happens to it has been answered.
 */
export function RouteAnalytics() {
  const accountSwitch = useAuthStore((state) => state.accountSwitch);

  usePageViewTracking();

  if (accountSwitch) {
    return <AccountSwitchPage />;
  }

  return <Outlet />;
}
