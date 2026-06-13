import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { fetchMarginalia } from "../api/marginalia";
import type { Marginalia } from "../types/marginalia";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "#eab308" : "none"}
      stroke={filled ? "#eab308" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: "-2px", marginRight: "4px" }}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

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
        <HStack mb={4} justify="space-between">
          <Box>
            <Text fontSize="sm" color="gray.500" mb={1}>
              编号
            </Text>
            <Text fontSize="lg" fontWeight="medium">
              {item.id}
            </Text>
          </Box>
          {item.is_favorite && (
            <Badge colorPalette="yellow" variant="subtle" px={3} py={1}>
              <StarIcon filled={true} />
              已收藏
            </Badge>
          )}
        </HStack>

        <Box mb={4}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            书名
          </Text>
          <Text fontSize="lg" fontWeight="medium">
            {item.book_title}
          </Text>
        </Box>

        {item.tags.length > 0 && (
          <Box mb={4}>
            <Text fontSize="sm" color="gray.500" mb={1}>
              标签
            </Text>
            <Wrap gap={1}>
              {item.tags.map((tag) => (
                <WrapItem key={tag.id}>
                  <Badge colorPalette="teal" variant="subtle">
                    {tag.name}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}

        <Box mb={4}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            页码
          </Text>
          <Text>{item.page_number}</Text>
        </Box>

        <Box mb={4}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            录入日期
          </Text>
          <Text>{item.entry_date}</Text>
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
