import { Box, Container, Heading, HStack, Link } from "@chakra-ui/react";
import { Link as RouterLink, Route, Routes } from "react-router-dom";
import FormPage from "./pages/FormPage";
import ListPage from "./pages/ListPage";

/** 应用根组件：布局 + 路由 */
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
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" pb={10}>
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/new" element={<FormPage />} />
          <Route path="/edit/:id" element={<FormPage />} />
        </Routes>
      </Container>
    </Box>
  );
}
