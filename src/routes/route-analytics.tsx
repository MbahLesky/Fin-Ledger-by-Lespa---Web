import { Outlet } from "react-router-dom";
import { usePageViewTracking } from "@/hooks/use-page-view-tracking";

/**
 * Pathless layout route that reports page views. It has to live inside the router
 * (rather than alongside the other providers) because useLocation only works
 * within a router context.
 */
export function RouteAnalytics() {
  usePageViewTracking();

  return <Outlet />;
}
