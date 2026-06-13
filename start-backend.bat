@echo off
cd /d "%~dp0backend"
if not exist .venv (
  echo 正在创建 Python 虚拟环境...
  python -m venv .venv
  if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.10+ 并勾选 "Add to PATH"
    pause
    exit /b 1
  )
)
call .venv\Scripts\activate
pip install -r requirements.txt -q
echo 后端启动中: http://localhost:3000
uvicorn main:app --reload --port 3000
