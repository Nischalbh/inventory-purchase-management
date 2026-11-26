
import { apiGet, apiPatch, getAllPages } from "../../services/api";
import type { Notification } from "../../types/api";

export function listNotifications(): Promise<Notification[]> {
  return getAllPages<Notification>("/api/notifications/");
}

export function getNotification(id: number): Promise<Notification> {
  return apiGet<Notification>(`/api/notifications/${id}/`);
}

/** The backend ignores the PATCH body and always marks the notification read. */
export function markNotificationAsRead(id: number): Promise<Notification> {
  return apiPatch<Notification>(`/api/notifications/${id}/`, { is_read: true });
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiGet<{ unread_count: number }>(
    "/api/notifications/unread-count/",
  );
  return response.unread_count;
}
