import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useState } from "react";
import { compareMarginalia } from "../api/marginalia";
import type { CompareResult } from "../types/marginalia";

function ComparisonCard({ label, item }: { label: string; item: CompareResult["left"] }) {
  return (
    <Box
      flex="1"
      minW="0"
      bg="white"
      borderRadius="md"
      borderWidth="1px"
      p={6}
    >
      <Text fontSize="sm" color="gray.400" mb={4} textAlign="center">
        {label}
      </Text>

      <VStack gap={4} align="stretch">
        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>编号</Text>
          <Text fontWeight="medium">{item.id}</Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>书名</Text>
          <Text fontWeight="medium" fontSize="lg">{item.book_title}</Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>页码</Text>
          <Text>{item.page_number}</Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>原文</Text>
          <Box
            bg="gray.50"
            p={4}
            borderRadius="md"
            borderLeftWidth="3px"
            borderLeftColor="teal.500"
          >
            <Text whiteSpace="pre-wrap">{item.original_text}</Text>
          </Box>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>眉批内容</Text>
          <Box
            bg="yellow.50"
            p={4}
            borderRadius="md"
            borderLeftWidth="3px"
            borderLeftColor="yellow.500"
          >
            <Text whiteSpace="pre-wrap">{item.marginalia_content}</Text>
          </Box>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>标签</Text>
          {item.tags.length > 0 ? (
            <Wrap gap={1}>
              {item.tags.map((tag) => (
                <WrapItem key={tag.id}>
                  <Badge colorPalette="teal" variant="subtle">{tag.name}</Badge>
                </WrapItem>
              ))}
            </Wrap>
          ) : (
            <Text color="gray.400">—</Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

export default function ComparePage() {
  const [id1Input, setId1Input] = useState("");
  const [id2Input, setId2Input] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  const handleCompare = async () => {
    const n1 = Number(id1Input.trim());
    const n2 = Number(id2Input.trim());
    if (!n1 || !n2) {
      setError("请输入有效的摘录编号");
      return;
    }
    if (n1 === n2) {
      setError("两条摘录编号不能相同");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await compareMarginalia(n1, n2);
      setResult(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const detail = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 404 && detail) {
        setError(detail);
      } else {
        setError("比对失败，请确认后端服务已启动（端口 3000）");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleCompare();
    }
  };

  return (
    <Box>
      <Heading size="md" mb={6}>摘录比对</Heading>

      <Box bg="white" p={4} borderRadius="md" borderWidth="1px" mb={6}>
        <HStack gap={3} wrap="wrap">
          <Input
            placeholder="摘录编号 A"
            value={id1Input}
            onChange={(e) => setId1Input(e.target.value)}
            onKeyDown={handleKeyDown}
            maxW="200px"
            type="number"
          />
          <Input
            placeholder="摘录编号 B"
            value={id2Input}
            onChange={(e) => setId2Input(e.target.value)}
            onKeyDown={handleKeyDown}
            maxW="200px"
            type="number"
          />
          <Button
            colorPalette="teal"
            onClick={() => void handleCompare()}
            loading={loading}
            loadingText="比对中…"
          >
            比对
          </Button>
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

      {result && !loading && (
        <HStack gap={6} align="flex-start" flexWrap="wrap">
          <ComparisonCard label={`摘录 A（编号 ${result.left.id}）`} item={result.left} />
          <ComparisonCard label={`摘录 B（编号 ${result.right.id}）`} item={result.right} />
        </HStack>
      )}
    </Box>
  );
}
