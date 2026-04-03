export const notificationService = {
  getPermissionState(): NotificationPermission | "unsupported" {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    return Notification.permission;
  },

  async requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    return Notification.requestPermission();
  }
};

