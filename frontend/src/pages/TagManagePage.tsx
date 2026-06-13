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
import { createTag, deleteTag, fetchTagList } from "../api/tag";
import type { Tag } from "../types/tag";

export default function TagManagePage() {
  const [items, setItems] = useState<Tag[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTagList();
      setItems(data);
    } catch {
      setError("加载标签列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createTag({ name });
      setNewName("");
      void loadItems();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const resp = (err as { response?: { data?: { detail?: string } } }).response;
        setError(resp?.data?.detail || "创建失败");
      } else {
        setError("创建失败");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定删除这个标签吗？关联的摘录将自动解除绑定。")) {
      return;
    }
    try {
      await deleteTag(id);
      void loadItems();
    } catch {
      setError("删除失败");
    }
  };

  return (
    <Box>
      <Heading size="md" mb={6}>
        标签管理
      </Heading>

      {error && (
        <Box bg="red.50" color="red.700" p={4} borderRadius="md" mb={4}>
          {error}
        </Box>
      )}

      <HStack mb={6} gap={3}>
        <Input
          placeholder="输入新标签名称…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
          maxW="320px"
          bg="white"
        />
        <Button
          colorPalette="teal"
          onClick={() => void handleCreate()}
          loading={submitting}
          disabled={!newName.trim()}
        >
          新增标签
        </Button>
      </HStack>

      {loading && (
        <HStack py={10} justify="center">
          <Spinner />
          <Text color="gray.500">加载中…</Text>
        </HStack>
      )}

      {!loading && items.length === 0 && (
        <Text color="gray.500" py={8} textAlign="center">
          暂无标签，点击「新增标签」开始创建。
        </Text>
      )}

      {!loading && items.length > 0 && (
        <Box bg="white" borderRadius="md" borderWidth="1px" overflowX="auto">
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>标签名称</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">操作</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>{item.id}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="teal" variant="subtle">
                      {item.name}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <Button
                      size="xs"
                      colorPalette="red"
                      variant="outline"
                      onClick={() => void handleDelete(item.id)}
                    >
                      删除
                    </Button>
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
