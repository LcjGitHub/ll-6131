# 旧书页眉批摘录库

全栈 MVP：管理旧书页眉批摘录，支持列表浏览、书名搜索与基础 CRUD。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript + Chakra UI v3 |
| 后端 | FastAPI + SQLAlchemy |
| 数据库 | SQLite（`backend/data/marginalia.db`） |

## 目录结构

```
├── backend/          # FastAPI 后端（端口 3000）
├── frontend/         # React 前端（端口 3101）
└── README.md
```

## 启动方式

### 1. 后端

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 3000
```

启动后 API 文档：http://localhost:3000/docs

首次启动会自动建表并写入 **5 条** 示例摘录。

### 2. 前端

另开一个终端：

```bash
cd frontend
npm install
npm run dev
```

浏览器访问：http://localhost:3101

> **注意**：必须同时启动后端和前端。若页面显示「加载失败，请确认后端服务已启动」，说明后端未运行。
>
> Windows 可双击 `start-backend.bat` 与 `start-frontend.bat` 分别启动（需两个终端窗口）。

## 常见问题

| 现象 | 原因 | 解决 |
|------|------|------|
| 页面空白 / 无法连接 | 未运行 `npm run dev` | 在 `frontend/` 执行 `npm run dev` |
| 显示「加载失败…端口 3000」 | 后端未启动 | 在 `backend/` 启动 uvicorn |
| `python` 命令不存在 | 未安装 Python | 安装 [Python 3.12](https://www.python.org/downloads/)，勾选 **Add to PATH** |
| 端口被占用 | 3101/3000 已被占用 | 关闭占用进程或修改端口 |

## 功能

- **摘录列表**：Chakra Table 展示，支持按书名搜索
- **新增/编辑**：表单字段含书名、页码、原文、眉批内容、购入渠道
- **删除**：列表页可删除单条摘录

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/marginalia?book_title=` | 列表（可选书名搜索） |
| GET | `/api/marginalia/{id}` | 单条详情 |
| POST | `/api/marginalia` | 新增 |
| PUT | `/api/marginalia/{id}` | 更新 |
| DELETE | `/api/marginalia/{id}` | 删除 |
