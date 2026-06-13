import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { deleteBook, fetchBookList } from "../api/book";
import type { Book } from "../types/book";

export default function BookListPage() {
  const [items, setItems] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (keyword?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBookList(keyword);
      setItems(data);
    } catch {
      setError("加载失败，请确认后端服务已启动（端口 3000）");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleSearch = () => {
    void loadItems(search.trim() || undefined);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定删除这条书目吗？")) {
      return;
    }
    try {
      await deleteBook(id);
      void loadItems(search.trim() || undefined);
    } catch {
      setError("删除失败");
    }
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="md">书目列表</Heading>
        <Button asChild colorPalette="teal">
          <RouterLink to="/books/new">新增书目</RouterLink>
        </Button>
      </HStack>

      <HStack mb={6} gap={3}>
        <Input
          placeholder="按书名或作者搜索…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
          暂无书目，点击「新增书目」开始录入。
        </Text>
      )}

      {!loading && items.length > 0 && (
        <Box bg="white" borderRadius="md" borderWidth="1px" overflowX="auto">
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>书名</Table.ColumnHeader>
                <Table.ColumnHeader>作者</Table.ColumnHeader>
                <Table.ColumnHeader>版本说明</Table.ColumnHeader>
                <Table.ColumnHeader>册数</Table.ColumnHeader>
                <Table.ColumnHeader>摘录条数</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">操作</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell fontWeight="medium">{item.title}</Table.Cell>
                  <Table.Cell>{item.author}</Table.Cell>
                  <Table.Cell>{item.edition ?? "—"}</Table.Cell>
                  <Table.Cell>{item.volume_count}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={item.marginalia_count > 0 ? "teal" : "gray"}>
                      {item.marginalia_count} 条
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack gap={2} justify="flex-end">
                      <Button asChild size="xs" variant="outline">
                        <RouterLink to={`/books/edit/${item.id}`}>编辑</RouterLink>
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
