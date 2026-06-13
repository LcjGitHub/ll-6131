import {
  Box,
  Grid,
  Heading,
  HStack,
  Progress,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { fetchStatsSummary } from "../api/stats";
import type { StatsSummary } from "../types/stats";

export default function StatsOverviewPage() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStatsSummary();
      setStats(data);
    } catch {
      setError("加载统计数据失败，请确认后端服务已启动（端口 3000）");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <HStack py={10} justify="center">
        <Spinner />
        <Text color="gray.500">加载中…</Text>
      </HStack>
    );
  }

  if (error) {
    return (
      <Box bg="red.50" color="red.700" p={4} borderRadius="md">
        {error}
      </Box>
    );
  }

  if (!stats) return null;

  const maxChannelCount = Math.max(
    ...stats.channel_distribution.map((c) => c.count),
    1,
  );

  return (
    <Box>
      <Heading size="md" mb={6}>
        数据统计概览
      </Heading>

      <Grid templateColumns="repeat(3, 1fr)" gap={6} mb={8}>
        <Box bg="white" p={6} borderRadius="md" borderWidth="1px">
          <Text color="gray.500" fontSize="sm" mb={2}>
            摘录总条数
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="teal.600">
            {stats.total_marginalia}
          </Text>
        </Box>
        <Box bg="white" p={6} borderRadius="md" borderWidth="1px">
          <Text color="gray.500" fontSize="sm" mb={2}>
            不同书名数量
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="teal.600">
            {stats.distinct_book_count}
          </Text>
        </Box>
        <Box bg="white" p={6} borderRadius="md" borderWidth="1px">
          <Text color="gray.500" fontSize="sm" mb={2}>
            购入渠道数
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="teal.600">
            {stats.channel_distribution.length}
          </Text>
        </Box>
      </Grid>

      <Box bg="white" p={6} borderRadius="md" borderWidth="1px">
        <Heading size="sm" mb={4}>
          购入渠道分布
        </Heading>
        {stats.channel_distribution.length === 0 ? (
          <Text color="gray.400">暂无渠道数据</Text>
        ) : (
          <Box>
            {stats.channel_distribution.map((ch) => (
              <Box key={ch.channel} mb={4}>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    {ch.channel}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {ch.count} 条（{ch.percentage}%）
                  </Text>
                </HStack>
                <Progress.Root
                  value={(ch.count / maxChannelCount) * 100}
                  size="sm"
                  colorPalette="teal"
                >
                  <Progress.Track borderRadius="sm">
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
