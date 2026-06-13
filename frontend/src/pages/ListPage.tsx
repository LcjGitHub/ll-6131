import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  IconButton,
  Input,
  Link,
  Spinner,
  Switch,
  Table,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  deleteMarginalia,
  exportMarginalia,
  fetchMarginaliaList,
  toggleFavorite,
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

/** 摘录列表页：Chakra Table + 书名搜索 */
export default function ListPage() {
  const [items, setItems] = useState<Marginalia[]>([]);
  const [search, setSearch] = useState("");
  const [contentSearch, setContentSearch] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const loadItems = useCallback(
    async (
      bookTitle?: string,
      contentKeyword?: string,
      isFavorite?: boolean,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMarginaliaList(
          bookTitle,
          contentKeyword,
          isFavorite,
        );
        setItems(data);
      } catch {
        setError("加载失败，请确认后端服务已启动（端口 3000）");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleSearch = () => {
    void loadItems(
      search.trim() || undefined,
      contentSearch.trim() || undefined,
      onlyFavorites ? true : undefined,
    );
  };

  const handleToggleFavoriteFilter = (checked: boolean) => {
    setOnlyFavorites(checked);
    void loadItems(
      search.trim() || undefined,
      contentSearch.trim() || undefined,
      checked ? true : undefined,
    );
  };

  const handleToggleFavorite = async (item: Marginalia) => {
    if (togglingIds.has(item.id)) return;
    const nextFavorite = !item.is_favorite;
    setTogglingIds((prev) => new Set(prev).add(item.id));
    try {
      await toggleFavorite(item.id, nextFavorite);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_favorite: nextFavorite } : i,
        ),
      );
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
    if (!window.confirm("确定删除这条摘录吗？")) {
      return;
    }
    try {
      await deleteMarginalia(id);
      void loadItems(
        search.trim() || undefined,
        contentSearch.trim() || undefined,
        onlyFavorites ? true : undefined,
      );
    } catch {
      setError("删除失败");
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
        <HStack justify="flex-end" align="center">
          <Text fontSize="sm" color="gray.600">
            仅看收藏
          </Text>
          <Switch.Root
            checked={onlyFavorites}
            onCheckedChange={(e: { checked: boolean }) => handleToggleFavoriteFilter(e.checked)}
            colorPalette="yellow"
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
      </Box>

      <HStack mb={6} gap={3} wrap="wrap">
        <Input
          placeholder="按书名搜索…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          maxW="320px"
          bg="white"
        />
        <Input
          placeholder="按眉批内容搜索…"
          value={contentSearch}
          onChange={(e) => setContentSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          maxW="320px"
          bg="white"
        />
        <Button colorPalette="teal" variant="outline" onClick={handleSearch}>
          搜索
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setSearch("");
            setContentSearch("");
            setOnlyFavorites(false);
            void loadItems();
          }}
        >
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
        <Box bg="white" borderRadius="md" borderWidth="1px" overflowX="auto">
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader width="50px" textAlign="center">
                  收藏
                </Table.ColumnHeader>
                <Table.ColumnHeader>书名</Table.ColumnHeader>
                <Table.ColumnHeader>标签</Table.ColumnHeader>
                <Table.ColumnHeader>页码</Table.ColumnHeader>
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
      )}
    </Box>
  );
}
