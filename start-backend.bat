@echo off
cd /d "%~dp0backend"

set "PY=python"
where python >nul 2>&1
if errorlevel 1 set "PY=C:\Users\Lily\AppData\Local\Programs\Python\Python312\python.exe"
if not exist "%PY%" (
  echo [错误] 未找到 Python，请先安装 Python 3.10+ 并勾选 "Add to PATH"
  pause
  exit /b 1
)

if not exist .venv (
  echo 正在创建 Python 虚拟环境...
  "%PY%" -m venv .venv
  if errorlevel 1 (
    echo [错误] 创建虚拟环境失败
    pause
    exit /b 1
  )
)

call .venv\Scripts\activate
pip install -r requirements.txt -q
echo.
echo 后端启动中: http://localhost:3000
echo 请保持此窗口运行，另开终端启动前端
echo.
uvicorn main:app --reload --port 3000
