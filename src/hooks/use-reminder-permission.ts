import { useCallback, useEffect, useState } from "react";
import { notificationService } from "@/services/notification-service";

export function useReminderPermission() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    notificationService.getPermissionState()
  );

  useEffect(() => {
    setPermission(notificationService.getPermissionState());
  }, []);

  const requestPermission = useCallback(async () => {
    const nextPermission = await notificationService.requestPermission();
    setPermission(nextPermission);
    return nextPermission;
  }, []);

  return {
    permission,
    requestPermission
  };
}

