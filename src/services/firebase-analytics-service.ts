import { getAnalytics, isSupported, logEvent, setUserId, type Analytics } from "firebase/analytics";
import {
  ANALYTICS_EVENTS,
  type AnalyticsEventName,
  type AnalyticsEventParams
} from "@/lib/analytics-events";
import { firebaseApp } from "@/lib/firebase-client";
import { env } from "@/lib/env";

// Resolved once and reused. Analytics is optional: it needs a measurementId, a
// supporting browser, and a successful load — any of which can be absent without
// the app caring, so every failure resolves to null instead of throwing.
let analyticsPromise: Promise<Analytics | null> | null = null;

// firebase/analytics types logEvent as a set of overloads: reserved GA4 names
// ("login", "page_view", ...) each demand their own parameter shape, and the
// generic custom-event overload explicitly excludes them. We deliberately send
// some reserved names — they unlock GA4's built-in reports — so the call goes
// through this single loosened signature instead.
const logAnalyticsEvent = logEvent as (
  analytics: Analytics,
  eventName: string,
  eventParams?: Record<string, unknown>
) => void;

export async function initializeAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !firebaseApp || !env.firebase.measurementId) {
    return null;
  }

  analyticsPromise ??= isSupported()
    .then((supported) => (supported && firebaseApp ? getAnalytics(firebaseApp) : null))
    .catch(() => null);

  return analyticsPromise;
}

/**
 * Records a product-analytics event. Fire-and-forget by design — analytics must
 * never delay or break a user action, so callers do not await it and errors are
 * swallowed.
 */
export function trackEvent(name: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
  void initializeAnalytics()
    .then((analytics) => {
      if (!analytics) {
        return;
      }

      // Drop undefined values rather than sending them; GA4 stores them as the
      // string "undefined", which pollutes reports.
      const cleaned = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      );

      logAnalyticsEvent(analytics, name, cleaned);
    })
    .catch(() => {
      // Non-fatal by contract.
    });
}

/** Records a client-side route change as a GA4 page_view. */
export function trackPageView(path: string, title?: string): void {
  trackEvent(ANALYTICS_EVENTS.pageView, {
    page_path: path,
    page_location: typeof window === "undefined" ? undefined : window.location.href,
    page_title: title ?? (typeof document === "undefined" ? undefined : document.title)
  });
}

/**
 * Associates subsequent events with a Firebase uid, or clears it on sign-out.
 * Only the opaque uid is sent — never an email address or display name.
 */
export function identifyUser(uid: string | null): void {
  void initializeAnalytics()
    .then((analytics) => {
      if (analytics) {
        setUserId(analytics, uid);
      }
    })
    .catch(() => {
      // Non-fatal by contract.
    });
}
