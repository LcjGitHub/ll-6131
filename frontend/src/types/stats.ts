export interface ChannelStat {
  channel: string;
  count: number;
  percentage: number;
}

export interface StatsSummary {
  total_marginalia: number;
  distinct_book_count: number;
  channel_distribution: ChannelStat[];
}
