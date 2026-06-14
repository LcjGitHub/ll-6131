import {
  Badge,
  Box,
  Button,
  createListCollection,
  Heading,
  HStack,
  Select,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOperationLogList } from "../api/operationLog";
import type { OperationLog, OperationTypeFilter, TargetTypeFilter } from "../types/operationLog";

interface LogQuery {
  operationType: OperationTypeFilter;
  targetType: TargetTypeFilter;
  page: number;
  pageSize: number;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getOperationTypeLabel(type: string): string {
  switch (type) {
    case "create":
      return "新增";
    case "update":
      return "修改";
    case "delete":
      return "删除";
    case "restore":
      return "恢复";
    case "permanent_delete":
      return "彻底删除";
    default:
      return type;
  }
}

function getOperationTypeColor(type: string): string {
  switch (type) {
    case "create":
      return "green";
    case "update":
      return "blue";
    case "delete":
      return "red";
    case "restore":
      return "teal";
    case "permanent_delete":
      return "red";
    default:
      return "gray";
  }
}

function getTargetTypeLabel(type: string): string {
  switch (type) {
    case "book":
      return "书目";
    case "marginalia":
      return "摘录";
    default:
      return type;
  }
}

export default function OperationLogPage() {
  const [items, setItems] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState<LogQuery>({
    operationType: "all",
    targetType: "all",
    page: 1,
    pageSize: 10,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOperationLogList(
        query.operationType === "all" ? undefined : query.operationType,
        query.targetType === "all" ? undefined : query.targetType,
        query.page,
        query.pageSize,
      );
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError("加载失败，请确认后端服务已启动（端口 3000）");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setQuery((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setQuery((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, query.page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const operationTypeCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "all", label: "全部操作" },
          { value: "create", label: "新增" },
          { value: "update", label: "修改" },
          { value: "delete", label: "删除" },
          { value: "restore", label: "恢复" },
          { value: "permanent_delete", label: "彻底删除" },
        ],
      }),
    [],
  );

  const targetTypeCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "all", label: "全部类型" },
          { value: "book", label: "书目" },
          { value: "marginalia", label: "摘录" },
        ],
      }),
    [],
  );

  const pageSizeCollection = useMemo(
    () =>
      createListCollection({
        items: [5, 10, 20, 50, 100].map((size) => ({
          value: String(size),
          label: `${size} 条`,
        })),
      }),
    [],
  );

  const handleOperationTypeChange = (value: string) => {
    setQuery((prev) => ({ ...prev, operationType: value as OperationTypeFilter, page: 1 }));
  };

  const handleTargetTypeChange = (value: string) => {
    setQuery((prev) => ({ ...prev, targetType: value as TargetTypeFilter, page: 1 }));
  };

  const handleReset = () => {
    setQuery({
      operationType: "all",
      targetType: "all",
      page: 1,
      pageSize: query.pageSize,
    });
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="md">操作日志</Heading>
        <Button variant="outline" onClick={handleReset}>
          重置筛选
        </Button>
      </HStack>

      <Box bg="white" p={4} borderRadius="md" borderWidth="1px" mb={4}>
        <HStack gap={3} wrap="wrap">
          <HStack gap={2}>
            <Text fontSize="sm" color="gray.600">操作类型：</Text>
            <Select.Root
              size="sm"
              width="140px"
              collection={operationTypeCollection}
              value={[query.operationType]}
              onValueChange={(e) =>
                handleOperationTypeChange((e.value ?? [])[0] || "all")
              }
              positioning={{ placement: "bottom-start", sameWidth: true }}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {operationTypeCollection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </HStack>

          <HStack gap={2}>
            <Text fontSize="sm" color="gray.600">目标类型：</Text>
            <Select.Root
              size="sm"
              width="140px"
              collection={targetTypeCollection}
              value={[query.targetType]}
              onValueChange={(e) =>
                handleTargetTypeChange((e.value ?? [])[0] || "all")
              }
              positioning={{ placement: "bottom-start", sameWidth: true }}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {targetTypeCollection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </HStack>
        </HStack>
      </Box>

      {loading && (
        <HStack py={10} justify="center">
          <Spinner />
          <Text color="gray.500">加载中…</Text>
        </HStack>
      )}

      {error && (
        <Box bg="red.50" color="red.700" p={4} borderRadius="md" mb={4}>
          {error}
        </Box>
      )}

      {!loading && !error && items.length === 0 && (
        <Text color="gray.500" py={8} textAlign="center">
          暂无操作日志。
        </Text>
      )}

      {!loading && items.length > 0 && (
        <Box bg="white" borderRadius="md" borderWidth="1px" overflowX="auto">
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader width="80px">编号</Table.ColumnHeader>
                <Table.ColumnHeader width="100px">操作类型</Table.ColumnHeader>
                <Table.ColumnHeader width="100px">目标类型</Table.ColumnHeader>
                <Table.ColumnHeader width="100px">目标编号</Table.ColumnHeader>
                <Table.ColumnHeader>操作内容</Table.ColumnHeader>
                <Table.ColumnHeader width="180px">操作时间</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell fontFamily="monospace">{item.id}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      colorPalette={getOperationTypeColor(item.operation_type)}
                      variant="subtle"
                    >
                      {getOperationTypeLabel(item.operation_type)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{getTargetTypeLabel(item.target_type)}</Table.Cell>
                  <Table.Cell fontFamily="monospace">{item.target_id}</Table.Cell>
                  <Table.Cell>{item.summary}</Table.Cell>
                  <Table.Cell fontFamily="monospace" fontSize="xs">
                    {formatDateTime(item.created_at)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {!loading && total > 0 && (
        <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
          <Text fontSize="sm" color="gray.600">
            共 {total} 条记录，第 {query.page} / {totalPages} 页
          </Text>
          <HStack gap={2} flexWrap="wrap">
            <HStack gap={2}>
              <Text fontSize="sm" color="gray.600">
                每页
              </Text>
              <Select.Root
                size="sm"
                width="90px"
                collection={pageSizeCollection}
                value={[String(query.pageSize)]}
                onValueChange={(e) =>
                  handlePageSizeChange(Number((e.value ?? [])[0]) || 10)
                }
                positioning={{ placement: "bottom-start", sameWidth: true }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {pageSizeCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </HStack>
            <HStack gap={1}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(1)}
                disabled={query.page === 1}
              >
                首页
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(query.page - 1)}
                disabled={query.page === 1}
              >
                上一页
              </Button>
              {getPageNumbers().map((num) => (
                <Button
                  key={num}
                  size="sm"
                  variant={num === query.page ? "solid" : "outline"}
                  colorPalette={num === query.page ? "teal" : undefined}
                  onClick={() => handlePageChange(num)}
                >
                  {num}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(query.page + 1)}
                disabled={query.page === totalPages}
              >
                下一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(totalPages)}
                disabled={query.page === totalPages}
              >
                末页
              </Button>
            </HStack>
          </HStack>
        </HStack>
      )}
    </Box>
  );
}
