import {
  Badge,
  Box,
  Button,
  Checkbox,
  createListCollection,
  Heading,
  HStack,
  IconButton,
  Input,
  Link,
  Select,
  Spinner,
  Switch,
  Table,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  batchDeleteMarginalia,
  deleteMarginalia,
  exportMarginalia,
  fetchMarginaliaList,
  toggleFavorite,
  type SortBy,
} from "../api/marginalia";
import type { Marginalia } from "../types/marginalia";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "#eab308" : "none"}
      stroke={filled ? "#eab308" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SortIcon({ sortBy }: { sortBy: SortBy }) {
  if (sortBy === "page_asc") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 4 20 18 4 18" />
      </svg>
    );
  }
  if (sortBy === "page_desc") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 20 4 6 20 6" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
      <path d="M7 4v16" />
      <path d="M17 4v16" />
      <path d="M3 8h8" />
      <path d="M13 16h8" />
    </svg>
  );
}

interface ListQuery {
  bookTitle: string | undefined;
  contentKeyword: string | undefined;
  isFavorite: boolean | undefined;
  sortBy: SortBy;
  page: number;
  pageSize: number;
}

/** 摘录列表页：Chakra Table + 书名搜索 + 分页 */
export default function ListPage() {
  const [items, setItems] = useState<Marginalia[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [contentSearchInput, setContentSearchInput] = useState("");
  const [onlyFavoritesInput, setOnlyFavoritesInput] = useState(false);

  const [query, setQuery] = useState<ListQuery>({
    bookTitle: undefined,
    contentKeyword: undefined,
    isFavorite: undefined,
    sortBy: "default",
    page: 1,
    pageSize: 10,
  });

  const reqSeqRef = useRef(0);

  const loadItems = useCallback(async () => {
    const mySeq = ++reqSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMarginaliaList(
        query.bookTitle,
        query.contentKeyword,
        query.isFavorite,
        query.sortBy,
        query.page,
        query.pageSize,
      );
      if (reqSeqRef.current !== mySeq) return;
      setItems(data.items);
      setTotal(data.total);
    } catch {
      if (reqSeqRef.current !== mySeq) return;
      setError("加载失败，请确认后端服务已启动（端口 3000）");
    } finally {
      if (reqSeqRef.current === mySeq) {
        setLoading(false);
      }
    }
  }, [query]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleSearch = () => {
    setSelectedIds(new Set());
    setQuery((prev) => ({
      ...prev,
      bookTitle: searchInput.trim() || undefined,
      contentKeyword: contentSearchInput.trim() || undefined,
      isFavorite: onlyFavoritesInput ? true : undefined,
      page: 1,
    }));
  };

  const handleSortToggle = () => {
    setSelectedIds(new Set());
    setQuery((prev) => {
      let nextSort: SortBy;
      if (prev.sortBy === "default") {
        nextSort = "page_asc";
      } else if (prev.sortBy === "page_asc") {
        nextSort = "page_desc";
      } else {
        nextSort = "default";
      }
      return { ...prev, sortBy: nextSort, page: 1 };
    });
  };

  const getSortLabel = (sort: SortBy): string => {
    if (sort === "page_asc") return "页码升序";
    if (sort === "page_desc") return "页码降序";
    return "默认排序";
  };

  const handleToggleFavoriteFilter = (checked: boolean) => {
    setOnlyFavoritesInput(checked);
    setSelectedIds(new Set());
    setQuery((prev) => ({
      ...prev,
      isFavorite: checked ? true : undefined,
      page: 1,
    }));
  };

  const handleToggleFavorite = async (item: Marginalia) => {
    if (togglingIds.has(item.id)) return;
    const nextFavorite = !item.is_favorite;
    setTogglingIds((prev) => new Set(prev).add(item.id));
    try {
      await toggleFavorite(item.id, nextFavorite);

      if (query.isFavorite && !nextFavorite) {
        const newTotal = total - 1;
        const remaining = items.filter((i) => i.id !== item.id);
        setTotal(newTotal);
        setItems(remaining);

        if (remaining.length === 0 && query.page > 1) {
          const targetPage = query.page - 1;
          setQuery((prev) => ({ ...prev, page: targetPage }));
        }
      } else if (!query.isFavorite) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, is_favorite: nextFavorite } : i,
          ),
        );
      }
    } catch {
      setError("切换收藏失败");
    } finally {
      setTogglingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定将这条摘录移入回收站吗？可在回收站中恢复。")) {
      return;
    }
    try {
      await deleteMarginalia(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const newTotal = total - 1;
      const maxPage = Math.max(1, Math.ceil(newTotal / query.pageSize));
      const targetPage = query.page > maxPage ? maxPage : query.page;
      setQuery((prev) => ({ ...prev, page: targetPage }));
    } catch {
      setError("删除失败");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确定将选中的 ${selectedIds.size} 条摘录移入回收站吗？可在回收站中恢复。`)) {
      return;
    }
    setBatchDeleting(true);
    setError(null);
    try {
      await batchDeleteMarginalia(Array.from(selectedIds));
      setSelectedIds(new Set());
      const deletedCount = selectedIds.size;
      const newTotal = total - deletedCount;
      const maxPage = Math.max(1, Math.ceil(newTotal / query.pageSize));
      const targetPage = query.page > maxPage ? maxPage : query.page;
      setQuery((prev) => ({ ...prev, page: targetPage }));
    } catch {
      setError("批量删除失败");
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleToggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await exportMarginalia();
    } catch {
      setError("导出失败，请确认后端服务已启动（端口 3000）");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setSelectedIds(new Set());
    setQuery((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setSelectedIds(new Set());
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

  const handleReset = () => {
    setSearchInput("");
    setContentSearchInput("");
    setOnlyFavoritesInput(false);
    setSelectedIds(new Set());
    setQuery({
      bookTitle: undefined,
      contentKeyword: undefined,
      isFavorite: undefined,
      sortBy: "default",
      page: 1,
      pageSize: query.pageSize,
    });
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <HStack gap={4}>
          <Heading size="md">摘录列表</Heading>
          <Button
            variant="outline"
            onClick={() => void handleExport()}
            loading={exporting}
            loadingText="导出中…"
          >
            导出
          </Button>
        </HStack>
        <Button asChild colorPalette="teal">
          <RouterLink to="/new">新增摘录</RouterLink>
        </Button>
      </HStack>

      <Box
        bg="white"
        p={4}
        borderRadius="md"
        borderWidth="1px"
        mb={4}
      >
        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          cursor="pointer"
          userSelect="none"
          onClick={() => handleToggleFavoriteFilter(!onlyFavoritesInput)}
          paddingX={2}
          paddingY={1}
          borderRadius="md"
          _hover={{ bg: "gray.50" }}
        >
          <Text fontSize="sm" color="gray.600" marginRight={3} pointerEvents="none">
            仅看收藏
          </Text>
          <Switch.Root
            checked={onlyFavoritesInput}
            onCheckedChange={(e: { checked: boolean }) => handleToggleFavoriteFilter(e.checked)}
            colorPalette="yellow"
            padding={2}
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </Box>
      </Box>

      <HStack mb={6} gap={3} wrap="wrap">
        <Input
          placeholder="按书名搜索…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          maxW="320px"
          bg="white"
        />
        <Input
          placeholder="按眉批内容搜索…"
          value={contentSearchInput}
          onChange={(e) => setContentSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          maxW="320px"
          bg="white"
        />
        <Button colorPalette="teal" variant="outline" onClick={handleSearch}>
          搜索
        </Button>
        <Button variant="ghost" onClick={handleReset}>
          重置
        </Button>
      </HStack>

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
          暂无摘录，点击「新增摘录」开始记录。
        </Text>
      )}

      {!loading && items.length > 0 && (
        <Box>
          <HStack mb={2}>
            <Button
              colorPalette="red"
              onClick={() => void handleBatchDelete()}
              loading={batchDeleting}
              loadingText="删除中…"
              disabled={selectedIds.size === 0}
              _disabled={{
                bg: "gray.200",
                color: "gray.500",
                cursor: "not-allowed",
                opacity: 1,
                _hover: { bg: "gray.200" },
              }}
            >
              批量删除 {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </HStack>
          <Box bg="white" borderRadius="md" borderWidth="1px" overflowX="auto">
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader width="50px" textAlign="center">
                  <Checkbox.Root
                    checked={items.length > 0 && items.every((item) => selectedIds.has(item.id))}
                    onCheckedChange={(e) => handleToggleSelectAll(Boolean(e.checked))}
                    disabled={items.length === 0}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader width="50px" textAlign="center">
                  收藏
                </Table.ColumnHeader>
                <Table.ColumnHeader>书名</Table.ColumnHeader>
                <Table.ColumnHeader>标签</Table.ColumnHeader>
                <Table.ColumnHeader>
                  <HStack
                    gap={1}
                    cursor="pointer"
                    onClick={handleSortToggle}
                    userSelect="none"
                    _hover={{ color: "teal.600" }}
                    transition="color 0.15s"
                    color={query.sortBy !== "default" ? "teal.600" : "inherit"}
                    title={`点击切换排序：${getSortLabel(query.sortBy)}`}
                  >
                    <span>页码</span>
                    <SortIcon sortBy={query.sortBy} />
                    {query.sortBy !== "default" && (
                      <Text
                        as="span"
                        fontSize="xs"
                        fontWeight="normal"
                        bg="teal.50"
                        color="teal.700"
                        px={1.5}
                        py={0.5}
                        borderRadius="sm"
                        lineHeight="1"
                      >
                        {query.sortBy === "page_asc" ? "升序" : "降序"}
                      </Text>
                    )}
                  </HStack>
                </Table.ColumnHeader>
                <Table.ColumnHeader>原文</Table.ColumnHeader>
                <Table.ColumnHeader>眉批内容</Table.ColumnHeader>
                <Table.ColumnHeader>购入渠道</Table.ColumnHeader>
                <Table.ColumnHeader>录入日期</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">操作</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell textAlign="center">
                    <Checkbox.Root
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={(e) => handleToggleSelect(item.id, Boolean(e.checked))}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <IconButton
                      variant="ghost"
                      size="xs"
                      aria-label={
                        item.is_favorite ? "取消收藏" : "加入收藏"
                      }
                      loading={togglingIds.has(item.id)}
                      onClick={() => void handleToggleFavorite(item)}
                      color={item.is_favorite ? "yellow.500" : "gray.400"}
                      _hover={{
                        color: item.is_favorite ? "yellow.600" : "yellow.500",
                      }}
                    >
                      <StarIcon filled={item.is_favorite} />
                    </IconButton>
                  </Table.Cell>
                  <Table.Cell fontWeight="medium">
                    <Link
                      asChild
                      color="teal.600"
                      textDecoration="underline"
                      _hover={{ color: "teal.700" }}
                    >
                      <RouterLink to={`/detail/${item.id}`}>
                        {item.book_title}
                      </RouterLink>
                    </Link>
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
                  <Table.Cell>{item.purchase_channel ?? "—"}</Table.Cell>
                  <Table.Cell>{item.entry_date}</Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack gap={2} justify="flex-end">
                      <Button asChild size="xs" variant="outline">
                        <RouterLink to={`/edit/${item.id}`}>编辑</RouterLink>
                      </Button>
                      <Button
                        size="xs"
                        colorPalette="red"
                        variant="outline"
                        onClick={() => void handleDelete(item.id)}
                      >
                        删除
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
          </Box>
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
