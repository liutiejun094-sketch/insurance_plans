#!/bin/bash
#===============================================================================
# 保险方案对比小程序 - 腾讯云一键部署脚本
# 使用方式: sudo bash deploy.sh [选项]
# 选项:
#   -f 强制重新部署（忽略缓存）
#   -h 显示帮助
#===============================================================================

set -e

# 配置
PROJECT_DIR="/home/projects/insurance_plans"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"
NGINX_WEB_ROOT="/var/www/html"
API_PORT=3000
GIT_REPO="https://github.com/liutiejun094-sketch/insurance_plans.git"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

usage() {
    echo "保险方案对比小程序 - 腾讯云一键部署脚本"
    echo "用法: sudo bash deploy.sh [选项]"
    echo "选项:"
    echo "  -f 强制重新部署（忽略缓存）"
    echo "  -h 显示帮助"
    exit 0
}

# 解析参数
FORCE=false
while getopts "fh" opt; do
    case $opt in
        f) FORCE=true ;;
        h) usage ;;
        \?) log_error "无效选项: -$OPTARG"; exit 1 ;;
    esac
done

echo "=========================================="
echo "  保险方案对比小程序 - 一键部署"
echo "=========================================="
echo "日期: $(date '+%Y-%m-%d %H:%M:%S')"
echo "项目目录: $PROJECT_DIR"
echo "=========================================="

#------------------------------------------------------------------------------
# 1. 检查运行环境
#------------------------------------------------------------------------------
log_info "【步骤1/6】检查运行环境..."

if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 运行本脚本"
    echo "示例: sudo bash deploy.sh"
    exit 1
fi

# 检查必要命令
REQUIRED_CMDS=("node" "npm" "git" "pm2" "nginx")
for cmd in "${REQUIRED_CMDS[@]}"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        log_error "$cmd 未安装"
        case $cmd in
            pm2) log_info "安装命令: npm install -g pm2" ;;
            nginx) log_info "安装命令: apt install nginx" ;;
        esac
        exit 1
    fi
done

log_info "环境检查通过"

#------------------------------------------------------------------------------
# 2. 创建目录并拉取代码
#------------------------------------------------------------------------------
log_info "【步骤2/6】获取最新代码..."

# 创建项目目录
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# 如果目录为空，先克隆
if [ ! -d ".git" ] || [ "$FORCE" = true ]; then
    log_info "首次部署或强制模式，克隆仓库..."
    rm -rf ./* 2>/dev/null || true
    if git clone "$GIT_REPO" .; then
        log_info "代码克隆成功"
    else
        log_error "git clone 失败，尝试手动下载..."
        # 备选方案：使用 curl/wget 下载
        if command -v curl >/dev/null 2>&1; then
            curl -sL https://github.com/liutiejun094-sketch/insurance_plans/archive/refs/heads/main.tar.gz | tar -xz --strip-components=1
            log_info "代码下载成功"
        else
            log_error "无法获取代码，请手动上传或检查网络"
            exit 1
        fi
    fi
else
    # 尝试 git pull
    log_info "尝试从 GitHub 拉取最新代码..."
    if git pull origin main; then
        log_info "代码更新成功"
    else
        log_warn "git pull 失败，使用本地代码继续部署..."
        # 保留本地代码继续部署
    fi
fi

#------------------------------------------------------------------------------
# 3. 安装后端依赖
#------------------------------------------------------------------------------
log_info "【步骤3/6】安装后端依赖..."

cd "$BACKEND_DIR"

# 检查 package-lock.json 是否存在
if [ ! -f "package-lock.json" ] || [ "$FORCE" = true ]; then
    log_info "重新安装依赖..."
    rm -rf node_modules package-lock.json
    npm install 2>&1 | tail -5
else
    log_info "使用缓存依赖，跳过安装..."
fi

log_info "后端依赖安装完成"

#------------------------------------------------------------------------------
# 4. 编译后端代码
#------------------------------------------------------------------------------
log_info "【步骤4/6】编译后端代码..."

cd "$BACKEND_DIR"
npm run build 2>&1 | tail -10

if [ $? -ne 0 ]; then
    log_error "后端编译失败"
    exit 1
fi

log_info "后端编译成功"

#------------------------------------------------------------------------------
# 5. 启动后端服务
#------------------------------------------------------------------------------
log_info "【步骤5/6】启动后端服务..."

# 停止旧进程
pm2 stop insurance-backend 2>/dev/null || true
pm2 delete insurance-backend 2>/dev/null || true

# 启动新进程
cd "$BACKEND_DIR"
NODE_ENV=production pm2 start dist/main.js --name insurance-backend --wait-ready --listen-timeout 10000

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

log_info "后端服务启动成功"

# 等待服务启动
sleep 3

# 检查服务状态
if curl -s --connect-timeout 5 "http://localhost:$API_PORT/api/plans" > /dev/null; then
    log_info "✅ 后端 API 服务正常"
else
    log_warn "⚠ 后端 API 服务可能未正常启动"
    log_info "查看日志: pm2 logs insurance-backend"
fi

#------------------------------------------------------------------------------
# 6. 部署前端页面
#------------------------------------------------------------------------------
log_info "【步骤6/6】部署前端页面..."

# 复制前端文件
cp "$FRONTEND_DIR/index.html" "$NGINX_WEB_ROOT/index.html"

# 检查 Nginx 配置
if ! nginx -t 2>/dev/null; then
    log_warn "Nginx 配置检查失败"
fi

# 重载 Nginx
systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || nginx -s reload 2>/dev/null || true

log_info "前端页面部署完成"

#------------------------------------------------------------------------------
# 完成
#------------------------------------------------------------------------------
echo ""
echo "=========================================="
log_info "✅ 部署完成！"
echo "=========================================="
echo ""
echo "📋 服务状态:"
echo "  ├── 后端 API:    http://localhost:$API_PORT"
echo "  ├── 前端页面:   http://localhost"
echo "  └── API 文档:    http://localhost:$API_PORT/api/docs"
echo ""
echo "🔧 常用命令:"
echo "  pm2 logs insurance-backend  # 查看后端日志"
echo "  pm2 restart insurance-backend  # 重启后端"
echo "  pm2 status  # 查看 PM2 状态"
echo "  systemctl status nginx  # 查看 Nginx 状态"
echo ""
echo "📁 文件路径:"
echo "  项目目录:      $PROJECT_DIR"
echo "  后端代码:      $BACKEND_DIR"
echo "  前端页面:      $NGINX_WEB_ROOT/index.html"
echo "  环境配置:      $BACKEND_DIR/.env"
echo ""

# 显示 PM2 状态
pm2 status
