/** 操作日志类型定义 */

export interface OperationLog {
  id: number;
  operation_type: "create" | "update" | "delete";
  target_type: "book" | "marginalia";
  target_id: number;
  summary: string;
  created_at: string;
}

export interface PaginatedOperationLog {
  items: OperationLog[];
  total: number;
  page: number;
  page_size: number;
}

export type OperationTypeFilter = "all" | "create" | "update" | "delete";

export type TargetTypeFilter = "all" | "book" | "marginalia";
