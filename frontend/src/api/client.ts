import axios from "axios";

/** API 客户端，开发环境走 Vite 代理，避免跨域问题 */
export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});
