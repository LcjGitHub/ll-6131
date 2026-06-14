import type {
  Marginalia,
  MarginaliaFormData,
  PaginatedMarginalia,
} from "../types/marginalia";
import { apiClient } from "./client";

export type SortBy = "default" | "page_asc" | "page_desc";

export async function fetchMarginaliaList(
  bookTitle?: string,
  contentKeyword?: string,
  isFavorite?: boolean,
  sortBy?: SortBy,
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedMarginalia> {
  const params: Record<string, string | boolean | number> = {};
  if (bookTitle) params.book_title = bookTitle;
  if (contentKeyword) params.content_keyword = contentKeyword;
  if (isFavorite !== undefined) params.is_favorite = isFavorite;
  if (sortBy && sortBy !== "default") params.sort_by = sortBy;
  params.page = page;
  params.page_size = pageSize;
  const { data } = await apiClient.get<PaginatedMarginalia>("/marginalia", {
    params,
  });
  return data;
}

export async function fetchMarginalia(id: number): Promise<Marginalia> {
  const { data } = await apiClient.get<Marginalia>(`/marginalia/${id}`);
  return data;
}

export async function createMarginalia(
  payload: MarginaliaFormData,
): Promise<Marginalia> {
  const { data } = await apiClient.post<Marginalia>("/marginalia", {
    ...payload,
    purchase_channel: payload.purchase_channel || null,
    tag_ids: payload.tag_ids || [],
  });
  return data;
}

export async function updateMarginalia(
  id: number,
  payload: MarginaliaFormData,
): Promise<Marginalia> {
  const { data } = await apiClient.put<Marginalia>(`/marginalia/${id}`, {
    ...payload,
    purchase_channel: payload.purchase_channel || null,
    tag_ids: payload.tag_ids || [],
  });
  return data;
}

export async function toggleFavorite(
  id: number,
  isFavorite: boolean,
): Promise<Marginalia> {
  const { data } = await apiClient.patch<Marginalia>(`/marginalia/${id}/favorite`, {
    is_favorite: isFavorite,
  });
  return data;
}

export async function deleteMarginalia(id: number): Promise<void> {
  await apiClient.delete(`/marginalia/${id}`);
}

export async function batchDeleteMarginalia(ids: number[]): Promise<{ deleted_count: number }> {
  const { data } = await apiClient.post<{ deleted_count: number }>("/marginalia/batch-delete", {
    ids,
  });
  return data;
}

export async function exportMarginalia(): Promise<void> {
  const response = await apiClient.get("/marginalia/export", {
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"];
  const filenameMatch = contentDisposition?.match(/filename\*=UTF-8''(.+)/);
  const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : "摘录导出.csv";

  const url = URL.createObjectURL(new Blob([response.data], { type: "text/csv; charset=utf-8-sig" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function fetchTrashList(
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedMarginalia> {
  const { data } = await apiClient.get<PaginatedMarginalia>("/marginalia/trash", {
    params: { page, page_size: pageSize },
  });
  return data;
}

export async function restoreMarginalia(id: number): Promise<Marginalia> {
  const { data } = await apiClient.post<Marginalia>(`/marginalia/${id}/restore`);
  return data;
}

export async function permanentDeleteMarginalia(id: number): Promise<void> {
  await apiClient.delete(`/marginalia/${id}/permanent`);
}
