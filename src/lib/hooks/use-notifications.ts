import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  apiGetNotifications,
  apiGetUnreadCount,
  apiMarkAsRead,
  apiMarkAllAsRead,
  apiDeleteNotification,
} from "@/lib/api/notifications";
import { toast } from "sonner";

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications.byUser(userId || ""),
    queryFn: () => apiGetNotifications(userId!),
    enabled: !!userId,
  });
}

export function useUnreadNotificationCount(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(userId || ""),
    queryFn: () => apiGetUnreadCount(userId!),
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => apiMarkAsRead(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiMarkAllAsRead(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.success("Todas marcadas como lidas");
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => apiDeleteNotification(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.success("Notificacao removida");
    },
  });
}
