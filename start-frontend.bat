@echo off
cd /d "%~dp0frontend"
if not exist node_modules (
  echo 正在安装前端依赖...
  call npm install
)
echo 前端启动中: http://localhost:3101
call npm run dev
