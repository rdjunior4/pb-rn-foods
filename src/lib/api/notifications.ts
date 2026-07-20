import { supabase } from "@/lib/supabase";
import type { Notification, NotificationType } from "@/lib/types";

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as NotificationType,
    title: row.title as string,
    message: (row.message as string) || "",
    link: (row.link as string) || undefined,
    read: (row.read as boolean) ?? false,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

export async function apiGetNotifications(userId: string): Promise<Notification[]> {
  const sb = supabase!;
  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function apiGetUnreadCount(userId: string): Promise<number> {
  const sb = supabase!;
  const { count, error } = await sb
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function apiMarkAsRead(notificationId: string): Promise<void> {
  const sb = supabase!;
  const { error } = await sb
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
  if (error) throw error;
}

export async function apiMarkAllAsRead(userId: string): Promise<void> {
  const sb = supabase!;
  const { error } = await sb
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}

export async function apiDeleteNotification(notificationId: string): Promise<void> {
  const sb = supabase!;
  const { error } = await sb
    .from("notifications")
    .delete()
    .eq("id", notificationId);
  if (error) throw error;
}
