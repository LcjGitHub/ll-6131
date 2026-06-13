import {
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  NumberInput,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { createBook, fetchBook, updateBook } from "../api/book";
import type { BookFormData } from "../types/book";

const defaultValues: BookFormData = {
  title: "",
  author: "",
  edition: "",
  volume_count: 1,
};

export default function BookFormPage() {
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookFormData>({ defaultValues });

  const volumeCount = watch("volume_count");

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await fetchBook(Number(id));
        reset({
          title: item.title,
          author: item.author,
          edition: item.edition ?? "",
          volume_count: item.volume_count,
        });
      } catch {
        setError("加载书目失败");
      } finally {
        setLoading(false);
      }
    };

    void loadItem();
  }, [id, reset]);

  const onSubmit = async (data: BookFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && id) {
        await updateBook(Number(id), data);
      } else {
        await createBook(data);
      }
      navigate("/books");
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
        {isEdit ? "编辑书目" : "新增书目"}
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
        <Field.Root invalid={Boolean(errors.title)} mb={4}>
          <Field.Label>书名</Field.Label>
          <Input
            {...register("title", { required: "请输入书名" })}
            placeholder="如：红楼梦"
          />
          {errors.title && (
            <Field.ErrorText>{errors.title.message}</Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={Boolean(errors.author)} mb={4}>
          <Field.Label>作者</Field.Label>
          <Input
            {...register("author", { required: "请输入作者" })}
            placeholder="如：曹雪芹"
          />
          {errors.author && (
            <Field.ErrorText>{errors.author.message}</Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root mb={4}>
          <Field.Label>版本说明</Field.Label>
          <Input
            {...register("edition")}
            placeholder="如：己卯本抄本影印（选填）"
          />
        </Field.Root>

        <Field.Root invalid={Boolean(errors.volume_count)} mb={6}>
          <Field.Label>册数</Field.Label>
          <NumberInput.Root
            value={String(volumeCount)}
            min={1}
            onValueChange={(e) => setValue("volume_count", Number(e.value) || 1)}
          >
            <NumberInput.Control />
            <NumberInput.Input
              {...register("volume_count", {
                required: "请输入册数",
                min: { value: 1, message: "册数至少为 1" },
                valueAsNumber: true,
              })}
            />
          </NumberInput.Root>
          {errors.volume_count && (
            <Field.ErrorText>{errors.volume_count.message}</Field.ErrorText>
          )}
        </Field.Root>

        <HStack gap={3}>
          <Button type="submit" colorPalette="teal" loading={submitting}>
            {isEdit ? "保存" : "创建"}
          </Button>
          <Button asChild variant="outline">
            <RouterLink to="/books">取消</RouterLink>
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}
