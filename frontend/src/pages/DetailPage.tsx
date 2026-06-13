import {
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Text,
} from "@chakra-ui/react";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { fetchMarginalia } from "../api/marginalia";
import type { Marginalia } from "../types/marginalia";

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Marginalia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadItem = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const data = await fetchMarginalia(Number(id));
        setItem(data);
      } catch (err) {
        const axiosErr = err as AxiosError;
        if (axiosErr.response?.status === 404) {
          setNotFound(true);
        } else {
          setError("加载摘录失败，请确认后端服务已启动（端口 3000）");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadItem();
  }, [id]);

  const handleBack = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <HStack py={10} justify="center">
        <Spinner />
        <Text color="gray.500">加载中…</Text>
      </HStack>
    );
  }

  if (notFound) {
    return (
      <Box>
        <Box bg="yellow.50" color="yellow.700" p={4} borderRadius="md" mb={4}>
          摘录不存在
        </Box>
        <Button variant="outline" onClick={handleBack}>
          返回列表
        </Button>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Box bg="red.50" color="red.700" p={4} borderRadius="md" mb={4}>
          {error}
        </Box>
        <Button variant="outline" onClick={handleBack}>
          返回列表
        </Button>
      </Box>
    );
  }

  if (!item) {
    return (
      <Box>
        <Text color="gray.500" py={8} textAlign="center">
          摘录不存在
        </Text>
        <Button variant="outline" onClick={handleBack}>
          返回列表
        </Button>
      </Box>
    );
  }

  return (
    <Box maxW="720px">
      <HStack justify="space-between" mb={6}>
        <Heading size="md">摘录详情</Heading>
      </HStack>

      <Box bg="white" borderRadius="md" borderWidth="1px" p={6} mb={6}>
        <Box mb={4}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            编号
          </Text>
          <Text fontSize="lg" fontWeight="medium">
            {item.id}
          </Text>
        </Box>

        <Box mb={4}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            书名
          </Text>
          <Text fontSize="lg" fontWeight="medium">
            {item.book_title}
          </Text>
        </Box>

        <Box mb={4}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            页码
          </Text>
          <Text>{item.page_number}</Text>
        </Box>

        <Box mb={4}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            原文
          </Text>
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

        <Box mb={4}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            眉批内容
          </Text>
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
          <Text fontSize="sm" color="gray.500" mb={1}>
            购入渠道
          </Text>
          <Text>{item.purchase_channel ?? "—"}</Text>
        </Box>
      </Box>

      <HStack gap={3}>
        <Button variant="outline" onClick={handleBack}>
          返回列表
        </Button>
        <Button asChild colorPalette="teal">
          <RouterLink to={`/edit/${item.id}`}>跳转编辑</RouterLink>
        </Button>
      </HStack>
    </Box>
  );
}
