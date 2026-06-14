import type {
  PaginatedOperationLog,
} from "../types/operationLog";
import { apiClient } from "./client";

export async function fetchOperationLogList(
  operationType?: "create" | "update" | "delete",
  targetType?: "book" | "marginalia",
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedOperationLog> {
  const params: Record<string, string | number> = {};
  if (operationType) params.operation_type = operationType;
  if (targetType) params.target_type = targetType;
  params.page = page;
  params.page_size = pageSize;
  const { data } = await apiClient.get<PaginatedOperationLog>("/logs", {
    params,
  });
  return data;
}
