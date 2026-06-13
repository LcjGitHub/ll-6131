import type { Marginalia, MarginaliaFormData } from "../types/marginalia";
import { apiClient } from "./client";

export async function fetchMarginaliaList(
  bookTitle?: string,
  contentKeyword?: string,
): Promise<Marginalia[]> {
  const params: Record<string, string> = {};
  if (bookTitle) params.book_title = bookTitle;
  if (contentKeyword) params.content_keyword = contentKeyword;
  const { data } = await apiClient.get<Marginalia[]>("/marginalia", {
    params: Object.keys(params).length > 0 ? params : undefined,
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

export async function deleteMarginalia(id: number): Promise<void> {
  await apiClient.delete(`/marginalia/${id}`);
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
