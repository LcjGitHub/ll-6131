import type { StatsSummary } from "../types/stats";
import { apiClient } from "./client";

export async function fetchStatsSummary(): Promise<StatsSummary> {
  const { data } = await apiClient.get<StatsSummary>("/stats/summary");
  return data;
}
