import { Box, Container, Heading, HStack, Link } from "@chakra-ui/react";
import { Link as RouterLink, Route, Routes } from "react-router-dom";
import BookFormPage from "./pages/BookFormPage";
import BookListPage from "./pages/BookListPage";
import DetailPage from "./pages/DetailPage";
import FormPage from "./pages/FormPage";
import ListPage from "./pages/ListPage";
import OperationLogPage from "./pages/OperationLogPage";
import StatsOverviewPage from "./pages/StatsOverviewPage";
import TagManagePage from "./pages/TagManagePage";
import TrashPage from "./pages/TrashPage";

export default function App() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Box as="header" bg="white" borderBottomWidth="1px" py={4} mb={6}>
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <Heading size="lg" color="gray.800">
              旧书页眉批摘录库
            </Heading>
            <HStack gap={4}>
              <Link asChild color="teal.600" fontWeight="medium">
                <RouterLink to="/">摘录列表</RouterLink>
              </Link>
              <Link asChild color="teal.600" fontWeight="medium">
                <RouterLink to="/new">新增摘录</RouterLink>
              </Link>
              <Link asChild color="teal.600" fontWeight="medium">
                <RouterLink to="/tags">标签管理</RouterLink>
              </Link>
              <Link asChild color="teal.600" fontWeight="medium">
                <RouterLink to="/books">书目管理</RouterLink>
              </Link>
              <Link asChild color="teal.600" fontWeight="medium">
                <RouterLink to="/stats">统计概览</RouterLink>
              </Link>
              <Link asChild color="teal.600" fontWeight="medium">
                <RouterLink to="/logs">操作日志</RouterLink>
              </Link>
              <Link asChild color="teal.600" fontWeight="medium">
                <RouterLink to="/trash">回收站</RouterLink>
              </Link>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" pb={10}>
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/new" element={<FormPage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/edit/:id" element={<FormPage />} />
          <Route path="/tags" element={<TagManagePage />} />
          <Route path="/books" element={<BookListPage />} />
          <Route path="/books/new" element={<BookFormPage />} />
          <Route path="/books/edit/:id" element={<BookFormPage />} />
          <Route path="/stats" element={<StatsOverviewPage />} />
          <Route path="/logs" element={<OperationLogPage />} />
          <Route path="/trash" element={<TrashPage />} />
        </Routes>
      </Container>
    </Box>
  );
}
