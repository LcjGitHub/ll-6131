import {
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  Spinner,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  createMarginalia,
  fetchMarginalia,
  updateMarginalia,
} from "../api/marginalia";
import type { MarginaliaFormData } from "../types/marginalia";

const defaultValues: MarginaliaFormData = {
  book_title: "",
  page_number: "",
  original_text: "",
  marginalia_content: "",
  purchase_channel: "",
};

/** 新增/编辑摘录表单页 */
export default function FormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MarginaliaFormData>({ defaultValues });

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await fetchMarginalia(Number(id));
        reset({
          book_title: item.book_title,
          page_number: item.page_number,
          original_text: item.original_text,
          marginalia_content: item.marginalia_content,
          purchase_channel: item.purchase_channel ?? "",
        });
      } catch {
        setError("加载摘录失败");
      } finally {
        setLoading(false);
      }
    };

    void loadItem();
  }, [id, reset]);

  const onSubmit = async (data: MarginaliaFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && id) {
        await updateMarginalia(Number(id), data);
      } else {
        await createMarginalia(data);
      }
      navigate("/");
    } catch {
      setError(isEdit ? "更新失败" : "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <HStack py={10} justify="center">
        <Spinner />
        <Box color="gray.500">加载中…</Box>
      </HStack>
    );
  }

  return (
    <Box maxW="640px">
      <Heading size="md" mb={6}>
        {isEdit ? "编辑摘录" : "新增摘录"}
      </Heading>

      {error && (
        <Box bg="red.50" color="red.700" p={4} borderRadius="md" mb={4}>
          {error}
        </Box>
      )}

      <Box
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        bg="white"
        p={6}
        borderRadius="md"
        borderWidth="1px"
      >
        <Field.Root invalid={Boolean(errors.book_title)} mb={4}>
          <Field.Label>书名</Field.Label>
          <Input
            {...register("book_title", { required: "请输入书名" })}
            placeholder="如：红楼梦"
          />
          {errors.book_title && (
            <Field.ErrorText>{errors.book_title.message}</Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={Boolean(errors.page_number)} mb={4}>
          <Field.Label>页码</Field.Label>
          <Input
            {...register("page_number", { required: "请输入页码" })}
            placeholder="如：32"
          />
          {errors.page_number && (
            <Field.ErrorText>{errors.page_number.message}</Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={Boolean(errors.original_text)} mb={4}>
          <Field.Label>原文</Field.Label>
          <Textarea
            {...register("original_text", { required: "请输入原文" })}
            placeholder="页内原文摘录"
            rows={4}
          />
          {errors.original_text && (
            <Field.ErrorText>{errors.original_text.message}</Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={Boolean(errors.marginalia_content)} mb={4}>
          <Field.Label>眉批内容</Field.Label>
          <Textarea
            {...register("marginalia_content", { required: "请输入眉批内容" })}
            placeholder="页眉或眉批文字"
            rows={4}
          />
          {errors.marginalia_content && (
            <Field.ErrorText>
              {errors.marginalia_content.message}
            </Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root mb={6}>
          <Field.Label>购入渠道</Field.Label>
          <Input
            {...register("purchase_channel")}
            placeholder="如：孔夫子旧书网（选填）"
          />
        </Field.Root>

        <HStack gap={3}>
          <Button
            type="submit"
            colorPalette="teal"
            loading={submitting}
          >
            {isEdit ? "保存" : "创建"}
          </Button>
          <Button asChild variant="outline">
            <RouterLink to="/">取消</RouterLink>
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}
