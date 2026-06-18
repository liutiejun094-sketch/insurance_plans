#!/bin/bash
#===============================================================================
# 保险方案对比小程序 - 腾讯云一键部署脚本
# 使用方式: bash deploy.sh
#===============================================================================

set -e  # 遇到错误立即退出

# 配置
PROJECT_DIR="/home/projects/insurance_plans"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"
NGINX_WEB_ROOT="/var/www/html"
API_PORT=3000

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "=========================================="
echo "  保险方案对比小程序 - 腾讯云部署"
echo "=========================================="

#------------------------------------------------------------------------------
# 1. 检查运行环境
#------------------------------------------------------------------------------
log_info "检查运行环境..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    log_warn "建议使用 sudo 运行本脚本，或确保有足够的系统权限"
fi

# 检查必要的命令
command -v node >/dev/null 2>&1 || { log_error "Node.js 未安装"; exit 1; }
command -v npm >/dev/null 2>&1 || { log_error "npm 未安装"; exit 1; }
command -v git >/dev/null 2>&1 || { log_error "git 未安装"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { log_error "PM2 未安装，请先运行: npm install -g pm2"; exit 1; }

log_info "环境检查通过"

#------------------------------------------------------------------------------
# 2. 更新代码（从 GitHub 拉取）
#------------------------------------------------------------------------------
log_info "从 GitHub 拉取最新代码..."

cd "$PROJECT_DIR"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    log_warn "检测到未提交的更改，将尝试 stash..."
    git stash || true
fi

# 尝试 git pull，如果失败则提示用户
if git pull origin main; then
    log_info "代码更新成功"
else
    log_error "git pull 失败，请检查网络连接或 GitHub 配置"
    log_info "提示：可以手动执行 cd $PROJECT_DIR && git pull"
fi

#------------------------------------------------------------------------------
# 3. 安装后端依赖
#------------------------------------------------------------------------------
log_info "安装后端依赖..."

cd "$BACKEND_DIR"
npm install --production 2>&1 | tail -5

log_info "后端依赖安装完成"

#------------------------------------------------------------------------------
# 4. 编译后端 TypeScript
#------------------------------------------------------------------------------
log_info "编译后端 TypeScript..."

npm run build 2>&1 | tail -10

if [ $? -ne 0 ]; then
    log_error "后端编译失败，请检查代码错误"
    exit 1
fi

log_info "后端编译成功"

#------------------------------------------------------------------------------
# 5. 重启后端服务 (PM2)
#------------------------------------------------------------------------------
log_info "重启后端服务..."

# 停止旧进程（如果存在）
pm2 stop insurance-backend 2>/dev/null || true
pm2 delete insurance-backend 2>/dev/null || true

# 启动新进程
cd "$BACKEND_DIR"
NODE_ENV=production pm2 start dist/main.js --name insurance-backend

# 保存 PM2 进程列表
pm2 save

# 设置开机自启
pm2 startup 2>/dev/null || log_warn "PM2 开机自启配置可能需要手动设置"
pm2 install ubuntu-serverlifecycle 2>/dev/null || true

log_info "后端服务启动成功"

# 等待服务启动
sleep 2

# 检查服务状态
if curl -s http://localhost:$API_PORT/api/plans > /dev/null 2>&1; then
    log_info "后端 API 服务正常运行"
else
    log_warn "后端 API 服务可能未正常启动，请检查: pm2 logs insurance-backend"
fi

#------------------------------------------------------------------------------
# 6. 部署前端页面
#------------------------------------------------------------------------------
log_info "部署前端页面..."

# 检查 Nginx 是否安装
if command -v nginx >/dev/null 2>&1; then
    # 复制 index.html 到 Nginx web 根目录
    cp "$FRONTEND_DIR/index.html" "$NGINX_WEB_ROOT/index.html"
    
    # 测试 Nginx 配置
    nginx -t 2>&1 || log_warn "Nginx 配置可能有问题"
    
    # 重载 Nginx
    systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || nginx -s reload 2>/dev/null || true
    
    log_info "前端页面部署完成 (Nginx)"
else
    log_warn "Nginx 未安装，前端页面未部署"
fi

#------------------------------------------------------------------------------
# 7. 最终检查
#------------------------------------------------------------------------------
echo ""
echo "=========================================="
log_info "部署完成！"
echo "=========================================="
echo ""
echo "服务状态:"
echo "  - 后端 API: http://localhost:$API_PORT"
echo "  - 前端页面: http://localhost (Nginx)"
echo "  - API 文档: http://localhost:$API_PORT/api/docs"
echo ""
echo "常用命令:"
echo "  - 查看后端日志: pm2 logs insurance-backend"
echo "  - 重启后端: pm2 restart insurance-backend"
echo "  - 查看服务状态: pm2 status"
echo "  - 查看 Nginx 日志: tail -f /var/log/nginx/error.log"
echo ""
echo "配置文件位置:"
echo "  - 后端环境变量: $BACKEND_DIR/.env"
echo "  - Nginx 配置: /etc/nginx/sites-available/default"
echo "  - 项目目录: $PROJECT_DIR"
echo ""

# 显示 PM2 状态
pm2 status
