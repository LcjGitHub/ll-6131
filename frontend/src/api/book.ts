import type { Book, BookFormData } from "../types/book";
import { apiClient } from "./client";

export async function fetchBookList(keyword?: string): Promise<Book[]> {
  const { data } = await apiClient.get<Book[]>("/books", {
    params: keyword ? { keyword } : undefined,
  });
  return data;
}

export async function fetchBook(id: number): Promise<Book> {
  const { data } = await apiClient.get<Book>(`/books/${id}`);
  return data;
}

export async function createBook(payload: BookFormData): Promise<Book> {
  const { data } = await apiClient.post<Book>("/books", {
    ...payload,
    edition: payload.edition || null,
  });
  return data;
}

export async function updateBook(
  id: number,
  payload: BookFormData,
): Promise<Book> {
  const { data } = await apiClient.put<Book>(`/books/${id}`, {
    ...payload,
    edition: payload.edition || null,
  });
  return data;
}

export async function deleteBook(id: number): Promise<void> {
  await apiClient.delete(`/books/${id}`);
}
