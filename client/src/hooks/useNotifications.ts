import { useState, useEffect } from 'react';
import { NotificationService } from '@/lib/notifications';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    NotificationService.permission
  );
  const [isSupported] = useState(NotificationService.isSupported());

  useEffect(() => {
    if (!isSupported) return;

    const handlePermissionChange = () => {
      setPermission(NotificationService.permission);
    };

    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((permissionStatus) => {
          permissionStatus.addEventListener('change', handlePermissionChange);
        })
        .catch((error) => {
          console.error('Error querying notification permission:', error);
        });
    }
  }, [isSupported]);

  const requestPermission = async () => {
    const newPermission = await NotificationService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  };

  return {
    permission,
    isSupported,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
    showNotification: NotificationService.show,
    showChallengeNotification: NotificationService.showChallengeNotification,
    showChallengeStartNotification: NotificationService.showChallengeStartNotification,
  };
}
