import type { Tag, TagFormData } from "../types/tag";
import { apiClient } from "./client";

export async function fetchTagList(): Promise<Tag[]> {
  const { data } = await apiClient.get<Tag[]>("/tags");
  return data;
}

export async function createTag(payload: TagFormData): Promise<Tag> {
  const { data } = await apiClient.post<Tag>("/tags", payload);
  return data;
}

export async function deleteTag(id: number): Promise<void> {
  await apiClient.delete(`/tags/${id}`);
}

export async function bindTag(marginaliaId: number, tagId: number): Promise<void> {
  await apiClient.post(`/marginalia/${marginaliaId}/tags/${tagId}`);
}

export async function unbindTag(marginaliaId: number, tagId: number): Promise<void> {
  await apiClient.delete(`/marginalia/${marginaliaId}/tags/${tagId}`);
}
