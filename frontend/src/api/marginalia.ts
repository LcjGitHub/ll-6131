import type { Marginalia, MarginaliaFormData } from "../types/marginalia";
import { apiClient } from "./client";

/**
 * 获取摘录列表，可按书名搜索
 * @param bookTitle - 书名关键词
 */
export async function fetchMarginaliaList(
  bookTitle?: string,
): Promise<Marginalia[]> {
  const { data } = await apiClient.get<Marginalia[]>("/marginalia", {
    params: bookTitle ? { book_title: bookTitle } : undefined,
  });
  return data;
}

/**
 * 获取单条摘录
 * @param id - 摘录 ID
 */
export async function fetchMarginalia(id: number): Promise<Marginalia> {
  const { data } = await apiClient.get<Marginalia>(`/marginalia/${id}`);
  return data;
}

/**
 * 新增摘录
 * @param payload - 表单数据
 */
export async function createMarginalia(
  payload: MarginaliaFormData,
): Promise<Marginalia> {
  const { data } = await apiClient.post<Marginalia>("/marginalia", {
    ...payload,
    purchase_channel: payload.purchase_channel || null,
  });
  return data;
}

/**
 * 更新摘录
 * @param id - 摘录 ID
 * @param payload - 表单数据
 */
export async function updateMarginalia(
  id: number,
  payload: MarginaliaFormData,
): Promise<Marginalia> {
  const { data } = await apiClient.put<Marginalia>(`/marginalia/${id}`, {
    ...payload,
    purchase_channel: payload.purchase_channel || null,
  });
  return data;
}

/**
 * 删除摘录
 * @param id - 摘录 ID
 */
export async function deleteMarginalia(id: number): Promise<void> {
  await apiClient.delete(`/marginalia/${id}`);
}
