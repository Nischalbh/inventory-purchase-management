
import { getAllPages } from "../../services/api";
import type { AuditLog } from "../../types/api";

/** The backend only supports `action` and `model_name` query filters. */
export function listAuditLogs(filters?: {
  action?: string;
  model_name?: string;
}): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (filters?.action) params.set("action", filters.action);
  if (filters?.model_name) params.set("model_name", filters.model_name);

  const query = params.toString();
  return getAllPages<AuditLog>(`/api/audit-logs/${query ? `?${query}` : ""}`);
}
