import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Notification permission states
export type NotificationPermission = 'default' | 'granted' | 'denied';

// Notification options for custom notifications
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Hook return type
interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  isRegistering: boolean;
  subscriptionId: string | null;
  error: string | null;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  showLocalNotification: (options: NotificationOptions) => void;
  updatePreferences: (preferences: {
    pushNotifications?: boolean;
    categories?: {
      job_updates?: boolean;
      messages?: boolean;
      payments?: boolean;
      marketing?: boolean;
    };
  }) => Promise<void>;
}

// API functions
const apiRequest = async (path: string, options?: RequestInit) => {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check browser support
  useEffect(() => {
    const supported = 
      'Notification' in window && 
      'serviceWorker' in navigator && 
      'PushManager' in window;
    
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission as NotificationPermission);
      checkSubscription();
    }
  }, []);

  // Check if already subscribed
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setIsSubscribed(false);
    }
  };

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser',
        variant: 'destructive',
      });
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      setError(null);
      
      if (result === 'granted') {
        toast({
          title: 'Permission Granted',
          description: 'You can now receive push notifications',
        });
      } else if (result === 'denied') {
        toast({
          title: 'Permission Denied',
          description: 'You won\'t receive push notifications',
          variant: 'destructive',
        });
      }
      
      return result as NotificationPermission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return 'default';
    }
  }, [isSupported, toast]);

  // Get VAPID public key
  const { data: vapidKey } = useQuery({
    queryKey: ['/api/push/vapid-key'],
    enabled: isSupported && permission === 'granted',
    retry: 1,
  });

  // Subscribe to push notifications
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isSupported) {
        throw new Error('Push notifications are not supported');
      }

      if (permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      setIsRegistering(true);
      
      try {
        // Register service worker if not already registered
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register('/service-worker.js');
          await navigator.serviceWorker.ready;
        }
        
        // Get VAPID key
        if (!vapidKey?.publicKey) {
          throw new Error('VAPID key not available');
        }
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey.publicKey),
        });
        
        // Send subscription to server
        const response = await apiRequest('/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            deviceType: 'browser',
            browserInfo: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
            },
          }),
        });
        
        setSubscriptionId(response.subscriptionId);
        setIsSubscribed(true);
        
        return response;
      } finally {
        setIsRegistering(false);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Subscribed!',
        description: 'You will now receive push notifications',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      toast({
        title: 'Subscription Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Unsubscribe from push notifications
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify server
        await apiRequest('/api/push/unsubscribe', {
          method: 'DELETE',
          body: JSON.stringify({
            subscriptionId: subscriptionId,
            endpoint: subscription.endpoint,
          }),
        });
      }
      
      setIsSubscribed(false);
      setSubscriptionId(null);
    },
    onSuccess: () => {
      toast({
        title: 'Unsubscribed',
        description: 'You will no longer receive push notifications',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(errorMessage);
      toast({
        title: 'Unsubscribe Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Send test notification
  const testNotificationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/push/test', { method: 'POST' });
    },
    onSuccess: (data) => {
      toast({
        title: 'Test Sent',
        description: `Notification sent to ${data.sent} device(s)`,
      });
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test';
      toast({
        title: 'Test Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Update notification preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: {
      pushNotifications?: boolean;
      categories?: {
        job_updates?: boolean;
        messages?: boolean;
        payments?: boolean;
        marketing?: boolean;
      };
    }) => {
      return apiRequest('/api/notifications/settings', {
        method: 'POST',
        body: JSON.stringify({
          pushNotifications: preferences.pushNotifications,
          notificationCategories: preferences.categories,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Show local notification (fallback for when push is not available)
  const showLocalNotification = useCallback((options: NotificationOptions) => {
    if (!isSupported) {
      // Fallback to toast notification
      toast({
        title: options.title,
        description: options.body,
      });
      return;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      // Fallback to toast
      toast({
        title: options.title,
        description: options.body,
      });
      return;
    }

    // Create local notification
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/icon-96x96.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction,
      actions: options.actions as any,
    });

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      
      // Handle navigation based on data
      if (options.data?.url) {
        window.location.href = options.data.url;
      }
      
      notification.close();
    };
  }, [isSupported, permission, toast]);

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending,
    isRegistering,
    subscriptionId,
    error,
    requestPermission,
    subscribe: subscribeMutation.mutate,
    unsubscribe: unsubscribeMutation.mutate,
    sendTestNotification: testNotificationMutation.mutate,
    showLocalNotification,
    updatePreferences: updatePreferencesMutation.mutate,
  };
}