import type { Marginalia, MarginaliaFormData } from "../types/marginalia";
import { apiClient } from "./client";

export async function fetchMarginaliaList(
  bookTitle?: string,
): Promise<Marginalia[]> {
  const { data } = await apiClient.get<Marginalia[]>("/marginalia", {
    params: bookTitle ? { book_title: bookTitle } : undefined,
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
