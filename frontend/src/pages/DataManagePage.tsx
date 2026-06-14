import {
  Box,
  Button,
  Dialog,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { exportBackup, restoreBackup, type RestoreResponse } from "../api/backup";

export default function DataManagePage() {
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);
    try {
      await exportBackup();
      setSuccess("备份文件下载成功！");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const resp = (err as { response?: { data?: { detail?: string } } }).response;
        setError(resp?.data?.detail || "备份失败，请确认后端服务已启动");
      } else {
        setError("备份失败，请确认后端服务已启动");
      }
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith(".json")) {
        setSelectedFile(file);
        setError(null);
        setSuccess(null);
      } else {
        setError("请选择 JSON 格式的备份文件");
        setSelectedFile(null);
      }
    }
  };

  const handleRestoreClick = () => {
    if (!selectedFile) {
      return;
    }
    setConfirmDialogOpen(true);
    setRestoreResult(null);
  };

  const handleCancelRestore = () => {
    setConfirmDialogOpen(false);
  };

  const handleConfirmRestore = async () => {
    if (!selectedFile) {
      return;
    }
    setRestoring(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await restoreBackup(selectedFile);
      setRestoreResult(result);
      setSuccess("数据恢复成功！");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const resp = (err as { response?: { data?: { detail?: string } } }).response;
        setError(resp?.data?.detail || "恢复失败，请确认后端服务已启动");
      } else {
        setError("恢复失败，请确认后端服务已启动");
      }
    } finally {
      setRestoring(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const renderSummary = () => {
    if (!restoreResult) {
      return null;
    }
    const { summary } = restoreResult;
    const items = [
      { label: "新增标签", value: summary.tags_created },
      { label: "更新标签", value: summary.tags_updated },
      { label: "新增书目", value: summary.books_created },
      { label: "更新书目", value: summary.books_updated },
      { label: "新增摘录", value: summary.marginalia_created },
      { label: "更新摘录", value: summary.marginalia_updated },
      { label: "恢复标签关联", value: summary.relations_restored },
    ];
    return (
      <Box p={4} bg="green.50" borderRadius="md" mt={4}>
        <Text fontWeight="medium" color="green.700" mb={3}>
          恢复详情
        </Text>
        <VStack gap={2} align="stretch" fontSize="sm">
          {items.map((item, idx) => (
            <HStack key={idx} justify="space-between">
              <Text color="gray.600">{item.label}：</Text>
              <Text fontWeight="medium" color="green.600">
                {item.value} 条
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    );
  };

  return (
    <Box>
      <Heading size="md" mb={6}>
        数据管理
      </Heading>

      {error && (
        <Box bg="red.50" color="red.700" p={4} borderRadius="md" mb={4}>
          {error}
        </Box>
      )}

      {success && (
        <Box bg="green.50" color="green.700" p={4} borderRadius="md" mb={4}>
          {success}
        </Box>
      )}

      {restoreResult && renderSummary()}

      <VStack gap={6} align="stretch">
        <Box
          bg="white"
          p={6}
          borderRadius="md"
          borderWidth="1px"
        >
          <Heading size="sm" mb={4} color="gray.800">
            一键备份下载
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            将当前数据库中的摘录、书目、标签三张核心表的数据导出为 JSON 格式的备份文件，可用于数据迁移或安全存档。
          </Text>
          <Button
            colorPalette="teal"
            onClick={() => void handleExport()}
            loading={exporting}
            loadingText="备份中…"
          >
            导出备份
          </Button>
        </Box>

        <Box
          bg="white"
          p={6}
          borderRadius="md"
          borderWidth="1px"
        >
          <Heading size="sm" mb={4} color="gray.800">
            选择备份文件上传恢复
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            选择之前导出的 JSON 备份文件，系统将采用合并方式写入数据库：已存在的记录（按 ID）会被更新，不存在的记录会被新增。
          </Text>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />

          <Box
            borderWidth="2px"
            borderStyle="dashed"
            borderColor="gray.200"
            borderRadius="md"
            p={6}
            textAlign="center"
            bg="gray.50"
            _hover={{ borderColor: "teal.400", bg: "gray.100" }}
            transition="all 0.2s"
            onClick={handleFileInputClick}
            cursor="pointer"
            mb={4}
          >
            {selectedFile ? (
              <VStack gap={2}>
                <Text fontWeight="medium">{selectedFile.name}</Text>
                <Text fontSize="sm" color="gray.500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileInputClick();
                  }}
                >
                  重新选择
                </Button>
              </VStack>
            ) : (
              <VStack gap={2}>
                <Text color="gray.500">点击选择文件或拖拽文件到此处</Text>
                <Text fontSize="xs" color="gray.400">支持 .json 格式的备份文件</Text>
              </VStack>
            )}
          </Box>

          <Button
            colorPalette="orange"
            onClick={handleRestoreClick}
            loading={restoring}
            loadingText="恢复中…"
            disabled={!selectedFile}
          >
            开始恢复
          </Button>
        </Box>
      </VStack>

      <Dialog.Root open={confirmDialogOpen} onOpenChange={(e) => !e.open && handleCancelRestore()}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>确认恢复数据</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <Box p={4} bg="orange.50" borderRadius="md">
                  <Text color="orange.700" fontWeight="medium" mb={2}>
                    ⚠️ 请谨慎操作
                  </Text>
                  <Text fontSize="sm" color="orange.600">
                    恢复操作将合并备份文件中的数据到当前数据库：
                  </Text>
                  <VStack gap={1} align="stretch" fontSize="sm" color="orange.600" mt={2} pl={2}>
                    <Text>• 已存在的记录（按 ID）将被更新为备份文件中的内容</Text>
                    <Text>• 不存在的记录将被新增</Text>
                    <Text>• 标签关联关系将被完全替换为备份文件中的关联</Text>
                  </VStack>
                </Box>
                <Text fontSize="sm" color="gray.600">
                  您确定要使用文件 <strong>{selectedFile?.name}</strong> 进行数据恢复吗？
                </Text>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={handleCancelRestore} disabled={restoring}>
                取消
              </Button>
              <Button
                colorPalette="orange"
                onClick={() => void handleConfirmRestore()}
                loading={restoring}
                loadingText="恢复中…"
              >
                确认恢复
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
