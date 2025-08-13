#!/usr/bin/env bash

# 部署脚本: 部署 FastAPI 后端和 React 前端
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取脚本所在目录
APP_DIR="$(dirname "$(readlink -f "$0")")"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

log_info "开始部署 Bilibili 魔理沙秘密书屋..."
log_info "应用目录: $APP_DIR"

# 检查操作系统并安装必要依赖
log_info "检查系统依赖..."
if command -v apt-get &> /dev/null; then
    log_info "检测到 Debian/Ubuntu 系统"
    sudo apt update
    sudo apt install -y python3 python3-venv python3-pip nodejs npm git wget unzip chromium-browser
elif command -v yum &> /dev/null; then
    log_info "检测到 CentOS/RHEL 系统"
    sudo yum install -y python3 python3-venv python3-pip nodejs npm git wget unzip chromium
elif command -v dnf &> /dev/null; then
    log_info "检测到 Fedora 系统"
    sudo dnf install -y python3 python3-venv python3-pip nodejs npm git wget unzip chromium
else
    log_error "不支持当前操作系统，请手动安装 Python3, Node.js, Git, Chromium"
    exit 1
fi

# 安装 ChromeDriver
log_info "安装 ChromeDriver..."
CHROME_DRIVER_VERSION=$(curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE)
wget -N https://chromedriver.storage.googleapis.com/$CHROME_DRIVER_VERSION/chromedriver_linux64.zip -P /tmp/
sudo unzip -o /tmp/chromedriver_linux64.zip -d /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver

# 拉取或更新代码
log_info "更新代码..."
cd "$APP_DIR"
if [ ! -d .git ]; then
    log_warn "未发现 Git 仓库，跳过代码更新"
else
    git fetch origin
    git reset --hard origin/main
    log_info "代码更新完成"
fi

# 停止现有进程
log_info "停止现有服务..."
pkill -f "uvicorn main:app" || true
pkill -f "serve -s" || true

# 后端部署
log_info "部署后端..."
cd "$BACKEND_DIR"

# 创建虚拟环境
if [ ! -d "venv" ]; then
    log_info "创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
source venv/bin/activate
pip install --upgrade pip

if [ -f requirements.txt ]; then
    log_info "安装 Python 依赖..."
    pip install -r requirements.txt
else
    log_error "未找到 requirements.txt 文件"
    exit 1
fi

# 前端构建
log_info "构建前端..."
cd "$FRONTEND_DIR"

# 检查 Node.js 版本
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "16" ]; then
    log_error "Node.js 版本过低，需要 16 以上版本"
    exit 1
fi

# 安装前端依赖
log_info "安装前端依赖..."
npm install

# 构建前端
log_info "构建前端静态文件..."
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    log_error "前端构建失败，未找到 dist 目录"
    exit 1
fi

# 启动后端服务
log_info "启动后端服务..."
cd "$BACKEND_DIR"
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > "$APP_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$APP_DIR/backend.pid"

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ! curl -s http://localhost:8000 > /dev/null; then
    log_error "后端启动失败，请检查日志: $APP_DIR/backend.log"
    exit 1
fi

# 启动前端静态服务 (使用 npx serve)
log_info "启动前端服务..."
cd "$FRONTEND_DIR"

# 如果没有安装 serve，则安装
if ! command -v serve &> /dev/null; then
    npm install -g serve
fi

cd dist
nohup npx serve -s . -l 3000 > "$APP_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$APP_DIR/frontend.pid"

# 等待前端启动
sleep 2

# 检查前端是否启动成功
if ! curl -s http://localhost:3000 > /dev/null; then
    log_error "前端启动失败，请检查日志: $APP_DIR/frontend.log"
    exit 1
fi

# 创建停止脚本
cat > "$APP_DIR/stop.sh" << 'EOF'
#!/bin/bash
APP_DIR="$(dirname "$(readlink -f "$0")")"

if [ -f "$APP_DIR/backend.pid" ]; then
    kill $(cat "$APP_DIR/backend.pid") 2>/dev/null || true
    rm -f "$APP_DIR/backend.pid"
fi

if [ -f "$APP_DIR/frontend.pid" ]; then
    kill $(cat "$APP_DIR/frontend.pid") 2>/dev/null || true
    rm -f "$APP_DIR/frontend.pid"
fi

pkill -f "uvicorn main:app" || true
pkill -f "serve -s" || true

echo "服务已停止"
EOF

chmod +x "$APP_DIR/stop.sh"

# 创建重启脚本
cat > "$APP_DIR/restart.sh" << 'EOF'
#!/bin/bash
APP_DIR="$(dirname "$(readlink -f "$0")")"
"$APP_DIR/stop.sh"
sleep 2
"$APP_DIR/deploy.sh"
EOF

chmod +x "$APP_DIR/restart.sh"

# 创建状态检查脚本
cat > "$APP_DIR/status.sh" << 'EOF'
#!/bin/bash
echo "=== 服务状态检查 ==="

echo "后端服务 (端口 8000):"
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务未运行"
fi

echo "前端服务 (端口 3000):"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务运行正常"
else
    echo "❌ 前端服务未运行"
fi

echo "进程信息:"
ps aux | grep -E "(uvicorn|serve)" | grep -v grep
EOF

chmod +x "$APP_DIR/status.sh"

log_info "部署完成！"
log_info "后端服务: http://localhost:8000"
log_info "前端服务: http://localhost:3000"
log_info "日志文件: $APP_DIR/backend.log, $APP_DIR/frontend.log"
log_info "管理命令: ./stop.sh (停止), ./restart.sh (重启), ./status.sh (状态检查)"
