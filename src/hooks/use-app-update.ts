import { useEffect } from "react";
import { toast } from "sonner";

// How often an open tab asks whether a newer build has been deployed. An
// installed PWA can stay open for days, so without this a tester keeps running
// the build they installed long after a fix has shipped.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Keeps a running tab honest about the deployed build.
 *
 * A new service worker installs but deliberately waits rather than taking over,
 * so nobody is interrupted mid-entry. The tab checks for one on load, whenever it
 * becomes visible again, and hourly; when one is waiting it offers a reload, and
 * only then does the new version take control.
 */
export function useAppUpdate() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;
    let reloading = false;
    let registration: ServiceWorkerRegistration | undefined;
    let announced = false;

    function activateWaitingWorker() {
      registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
    }

    function announceUpdate() {
      if (cancelled || announced) {
        return;
      }

      announced = true;
      toast("A new version of Monilog is ready.", {
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: activateWaitingWorker
        }
      });
    }

    function handleUpdateFound() {
      const installing = registration?.installing;
      if (!installing) {
        return;
      }

      installing.addEventListener("statechange", () => {
        // Only an update: on a first-ever install there is no controller, so
        // nothing on screen is stale.
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          announceUpdate();
        }
      });
    }

    function handleControllerChange() {
      // Guarded so a worker that claims the page more than once cannot put it in
      // a reload loop.
      if (reloading) {
        return;
      }

      reloading = true;
      window.location.reload();
    }

    function checkForUpdate() {
      if (document.visibilityState === "visible") {
        void registration?.update();
      }
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    document.addEventListener("visibilitychange", checkForUpdate);
    const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);

    void navigator.serviceWorker.ready.then((readyRegistration) => {
      if (cancelled) {
        return;
      }

      registration = readyRegistration;

      if (registration.waiting && navigator.serviceWorker.controller) {
        announceUpdate();
      }

      registration.addEventListener("updatefound", handleUpdateFound);
      checkForUpdate();
    });

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", checkForUpdate);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      registration?.removeEventListener("updatefound", handleUpdateFound);
    };
  }, []);
}
