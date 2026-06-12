import {
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
import { deleteMarginalia, fetchMarginaliaList } from "../api/marginalia";
import type { Marginalia } from "../types/marginalia";

/** 摘录列表页：Chakra Table + 书名搜索 */
export default function ListPage() {
  const [items, setItems] = useState<Marginalia[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (bookTitle?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMarginaliaList(bookTitle);
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
    if (!window.confirm("确定删除这条摘录吗？")) {
      return;
    }
    try {
      await deleteMarginalia(id);
      void loadItems(search.trim() || undefined);
    } catch {
      setError("删除失败");
    }
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="md">摘录列表</Heading>
        <Button asChild colorPalette="teal">
          <RouterLink to="/new">新增摘录</RouterLink>
        </Button>
      </HStack>

      <HStack mb={6} gap={3}>
        <Input
          placeholder="按书名搜索…"
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
          暂无摘录，点击「新增摘录」开始记录。
        </Text>
      )}

      {!loading && items.length > 0 && (
        <Box bg="white" borderRadius="md" borderWidth="1px" overflowX="auto">
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>书名</Table.ColumnHeader>
                <Table.ColumnHeader>页码</Table.ColumnHeader>
                <Table.ColumnHeader>原文</Table.ColumnHeader>
                <Table.ColumnHeader>眉批内容</Table.ColumnHeader>
                <Table.ColumnHeader>购入渠道</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">操作</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell fontWeight="medium">{item.book_title}</Table.Cell>
                  <Table.Cell>{item.page_number}</Table.Cell>
                  <Table.Cell maxW="200px">
                    <Text lineClamp={2}>{item.original_text}</Text>
                  </Table.Cell>
                  <Table.Cell maxW="200px">
                    <Text lineClamp={2}>{item.marginalia_content}</Text>
                  </Table.Cell>
                  <Table.Cell>{item.purchase_channel ?? "—"}</Table.Cell>
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
