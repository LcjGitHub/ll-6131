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
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchTrashList,
  restoreMarginalia,
  permanentDeleteMarginalia,
} from "../api/marginalia";
import type { Marginalia } from "../types/marginalia";

export default function TrashPage() {
  const [items, setItems] = useState<Marginalia[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringIds, setRestoringIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrashList(page, pageSize);
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setError("加载回收站失败，请确认后端服务已启动");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleRestore = async (id: number) => {
    if (!window.confirm("确定恢复这条摘录吗？恢复后将回到摘录列表。")) return;
    setRestoringIds((prev) => new Set(prev).add(id));
    setError(null);
    try {
      await restoreMarginalia(id);
      const newTotal = total - 1;
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = page > maxPage ? maxPage : page;
      if (targetPage !== page) {
        setPage(targetPage);
      } else {
        void loadItems();
      }
    } catch {
      setError("恢复失败");
    } finally {
      setRestoringIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  const handlePermanentDelete = async (id: number) => {
    if (!window.confirm("确定彻底删除这条摘录吗？此操作不可恢复！")) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    setError(null);
    try {
      await permanentDeleteMarginalia(id);
      const newTotal = total - 1;
      const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = page > maxPage ? maxPage : page;
      if (targetPage !== page) {
        setPage(targetPage);
      } else {
        void loadItems();
      }
    } catch {
      setError("彻底删除失败");
    } finally {
      setDeletingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

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

  const formatDeletedAt = (val: string | null) => {
    if (!val) return "—";
    try {
      const d = new Date(val);
      return d.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return val;
    }
  };

  return (
    <Box>
      <Heading size="md" mb={6}>
        回收站
      </Heading>

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
          回收站为空，暂无已删除的摘录。
        </Text>
      )}

      {!loading && items.length > 0 && (
        <Box>
          <Box bg="white" borderRadius="md" borderWidth="1px" overflowX="auto">
            <Table.Root size="sm" striped>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>书名</Table.ColumnHeader>
                  <Table.ColumnHeader>标签</Table.ColumnHeader>
                  <Table.ColumnHeader>页码</Table.ColumnHeader>
                  <Table.ColumnHeader>原文</Table.ColumnHeader>
                  <Table.ColumnHeader>眉批内容</Table.ColumnHeader>
                  <Table.ColumnHeader>删除时间</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">操作</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {items.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell fontWeight="medium">
                      {item.book_title}
                    </Table.Cell>
                    <Table.Cell minW="120px">
                      {item.tags.length > 0 ? (
                        <Wrap gap={1}>
                          {item.tags.map((tag) => (
                            <WrapItem key={tag.id}>
                              <Badge
                                colorPalette="teal"
                                variant="subtle"
                                whiteSpace="nowrap"
                              >
                                {tag.name}
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      ) : (
                        <Text color="gray.400">—</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>{item.page_number}</Table.Cell>
                    <Table.Cell maxW="200px">
                      <Text lineClamp={2}>{item.original_text}</Text>
                    </Table.Cell>
                    <Table.Cell maxW="200px">
                      <Text lineClamp={2}>{item.marginalia_content}</Text>
                    </Table.Cell>
                    <Table.Cell whiteSpace="nowrap">
                      {formatDeletedAt(item.deleted_at)}
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <HStack gap={2} justify="flex-end">
                        <Button
                          size="xs"
                          colorPalette="teal"
                          variant="outline"
                          onClick={() => void handleRestore(item.id)}
                          loading={restoringIds.has(item.id)}
                          loadingText="恢复中…"
                        >
                          恢复
                        </Button>
                        <Button
                          size="xs"
                          colorPalette="red"
                          variant="outline"
                          onClick={() => void handlePermanentDelete(item.id)}
                          loading={deletingIds.has(item.id)}
                          loadingText="删除中…"
                        >
                          彻底删除
                        </Button>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
            <Text fontSize="sm" color="gray.600">
              共 {total} 条记录，第 {page} / {totalPages} 页
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
                  value={[String(pageSize)]}
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
                  disabled={page === 1}
                >
                  首页
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                {getPageNumbers().map((num) => (
                  <Button
                    key={num}
                    size="sm"
                    variant={num === page ? "solid" : "outline"}
                    colorPalette={num === page ? "teal" : undefined}
                    onClick={() => handlePageChange(num)}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  下一页
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                >
                  末页
                </Button>
              </HStack>
            </HStack>
          </HStack>
        </Box>
      )}
    </Box>
  );
}
