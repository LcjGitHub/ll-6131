import { apiClient } from "./client";

export interface RestoreSummary {
  tags_created: number;
  tags_updated: number;
  books_created: number;
  books_updated: number;
  marginalia_created: number;
  marginalia_updated: number;
  relations_restored: number;
}

export interface RestoreResponse {
  success: boolean;
  summary: RestoreSummary;
}

export async function exportBackup(): Promise<void> {
  const response = await apiClient.get("/backup/export", {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const disposition = response.headers["content-disposition"];
  let filename = "marginalia-backup.json";
  if (disposition) {
    const match = disposition.match(/filename=(.+)/);
    if (match) {
      filename = match[1];
    }
  }

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function restoreBackup(file: File): Promise<RestoreResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<RestoreResponse>("/backup/restore", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}
