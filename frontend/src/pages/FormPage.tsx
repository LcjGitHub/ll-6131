import {
  Box,
  Button,
  createListCollection,
  Field,
  Heading,
  HStack,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { fetchBookOptions } from "../api/book";
import {
  createMarginalia,
  fetchMarginalia,
  updateMarginalia,
} from "../api/marginalia";
import { fetchTagList } from "../api/tag";
import type { BookOption } from "../types/book";
import type { MarginaliaFormData } from "../types/marginalia";
import type { Tag } from "../types/tag";

const defaultValues: MarginaliaFormData = {
  book_id: 0,
  page_number: "",
  original_text: "",
  marginalia_content: "",
  purchase_channel: "",
  tag_ids: [],
};

export default function FormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [bookOptions, setBookOptions] = useState<BookOption[]>([]);
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MarginaliaFormData>({ defaultValues });

  const bookId = watch("book_id");
  const selectedTagIds = watch("tag_ids");

  const bookCollection = useMemo(
    () =>
      createListCollection({
        items: bookOptions.map((opt) => ({
          value: String(opt.id),
          label: `${opt.title} — ${opt.author}`,
        })),
      }),
    [bookOptions],
  );

  const tagCollection = useMemo(
    () =>
      createListCollection({
        items: tagOptions.map((opt) => ({
          value: String(opt.id),
          label: opt.name,
        })),
      }),
    [tagOptions],
  );

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [books, tags] = await Promise.all([
          fetchBookOptions(),
          fetchTagList(),
        ]);
        setBookOptions(books);
        setTagOptions(tags);
        if (books.length > 0 && !isEdit) {
          setValue("book_id", books[0].id);
        }
      } catch {
        setError("加载选项失败");
      } finally {
        setOptionsLoading(false);
      }
    };
    void loadOptions();
  }, [isEdit, setValue]);

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
          book_id: item.book_id,
          page_number: item.page_number,
          original_text: item.original_text,
          marginalia_content: item.marginalia_content,
          purchase_channel: item.purchase_channel ?? "",
          tag_ids: item.tags.map((t) => t.id),
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
    if (data.book_id <= 0) {
      setError("请选择所属书目");
      return;
    }
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

  if (loading || optionsLoading) {
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
        <Field.Root invalid={Boolean(errors.book_id)} mb={4}>
          <Field.Label>所属书目</Field.Label>
          <Select.Root
            collection={bookCollection}
            value={bookId ? [String(bookId)] : []}
            onValueChange={(e) =>
              setValue("book_id", Number(e.value[0]) || 0)
            }
            positioning={{ placement: "bottom-start", sameWidth: true }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="请选择书目" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {bookCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
          {errors.book_id && (
            <Field.ErrorText>{errors.book_id.message}</Field.ErrorText>
          )}
        </Field.Root>

        <Box position="relative" zIndex={10} mb={4}>
          <Field.Label mb={1}>标签</Field.Label>
          <Select.Root
            collection={tagCollection}
            multiple
            value={(selectedTagIds ?? []).map(String)}
            onValueChange={(e) =>
              setValue(
                "tag_ids",
                e.value.map(Number),
              )
            }
            positioning={{ placement: "bottom-start", sameWidth: true }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="选择标签（可多选）" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {tagCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Box>

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
          <Button type="submit" colorPalette="teal" loading={submitting}>
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
