import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/context/AuthContext';
import { useNetworkStatus } from '../../../hooks/use-network';

const NEW_ORDER_CHANNEL_ID = 'admin-new-orders';
const ADMIN_ORDERS_QUERY_KEY = ['admin', 'orders'];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
  }),
});

async function ensureNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NEW_ORDER_CHANNEL_ID, {
      name: 'Nuevos pedidos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4A853',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function formatOrderTotal(total: unknown) {
  const amount = typeof total === 'number' ? total : Number(total ?? 0);

  return amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
}

export function useAdminNewOrderNotifications() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const { isConnected } = useNetworkStatus();
  const [retryAttempt, setRetryAttempt] = useState(0);
  const isAdmin = user?.app_metadata?.role === 'admin';

  useEffect(() => {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url as never);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!session || !isAdmin || !isConnected || !user?.id) return;

    let isActive = true;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    void ensureNotificationPermissions();

    const channel = supabase
      .channel(`admin-new-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          const order = payload.new as { id?: string; total?: unknown };
          if (!order.id) return;

          queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_QUERY_KEY });

          const hasPermission = await ensureNotificationPermissions();
          if (!hasPermission || !isActive) return;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Nuevo pedido recibido',
              body: `Pedido #${order.id.slice(0, 8)} por ${formatOrderTotal(order.total)}`,
              data: { url: `/(admin)/ordenes/${order.id}` },
            },
            trigger: null,
          });
        },
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (!isActive) return;

          // Realtime is best-effort on mobile networks. Transport failures can
          // happen when the app resumes, the device changes networks, or the
          // websocket drops. Do not surface this as a redbox/error to users.
          const delayMs = Math.min(30_000, 2_000 * (retryAttempt + 1));
          retryTimeout = setTimeout(() => {
            if (isActive) {
              setRetryAttempt((attempt) => attempt + 1);
            }
          }, delayMs);

          void supabase.removeChannel(channel);
        }
      });

    return () => {
      isActive = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      supabase.removeChannel(channel);
    };
  }, [isAdmin, isConnected, queryClient, retryAttempt, session, user?.id]);
}


