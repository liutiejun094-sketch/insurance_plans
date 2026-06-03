# 部署指南 - 保险方案对比AI

本文档介绍如何将项目部署到腾讯云轻量应用服务器。

---

## 一、本地快速部署（Docker）

### 1.1 使用 Docker Compose 一键启动

```bash
cd backend
cp .env .env.production
# 编辑 .env.production，填入你的 DeepSeek API Key
docker-compose up -d
```

### 1.2 访问服务
- 前端：http://localhost:8000 （需单独启动静态服务器）
- 后端API：http://localhost:3000
- API文档：http://localhost:3000/api/docs

---

## 二、腾讯云轻量应用服务器部署

### 2.1 购买服务器
1. 登录腾讯云控制台
2. 购买轻量应用服务器
3. 选择系统：Ubuntu 22.04 LTS
4. 配置：建议 2核4G 及以上

### 2.2 基础环境配置

```bash
# 1. 更新系统
apt update && apt upgrade -y

# 2. 安装 Node.js (18.x)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 3. 安装 MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb.gpg] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb.list
apt update && apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 4. 安装 Redis
apt install -y redis-server
systemctl start redis
systemctl enable redis

# 5. 安装 Nginx
apt install -y nginx

# 6. 安装 PM2 (进程管理)
npm install -g pm2
```

### 2.3 部署后端服务

```bash
# 1. 上传代码到服务器
# 可以使用 scp 或 git clone

# 2. 安装依赖
cd /path/to/backend
npm ci --only=production

# 3. 构建项目
npm run build

# 4. 配置环境变量
cp .env.production .env
# 编辑 .env，填入正确的配置
# MONGO_URI=mongodb://localhost:27017/insurance
# REDIS_HOST=localhost
# LLM_API_KEY=your-deepseek-key

# 5. 使用 PM2 启动服务
pm2 start dist/main.js --name insurance-backend
pm2 save
pm2 startup
```

### 2.4 部署前端

```bash
# 1. 创建静态文件目录
mkdir -p /var/www/html

# 2. 上传 index.html 到 /var/www/html

# 3. 配置 Nginx
cp /path/to/nginx.conf /etc/nginx/sites-available/insurance
ln -s /etc/nginx/sites-available/insurance /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# 4. 测试并重启 Nginx
nginx -t
systemctl restart nginx
```

### 2.5 配置域名和SSL（可选）

```bash
# 1. 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 2. 申请证书
certbot --nginx -d your-domain.com

# 3. 自动续期
certbot renew --dry-run
```

---

## 三、腾讯云容器服务(TKE)部署（可选）

### 3.1 构建并上传镜像

```bash
# 1. 构建镜像
cd backend
docker build -t insurance-backend:v1.0.0 .

# 2. 推送到腾讯云容器镜像服务(CCR)
docker tag insurance-backend:v1.0.0 ccr.ccs.tencentyun.com/your-namespace/insurance-backend:v1.0.0
docker push ccr.ccs.tencentyun.com/your-namespace/insurance-backend:v1.0.0
```

### 3.2 使用云数据库

- MongoDB：使用腾讯云 MongoDB
- Redis：使用腾讯云 Redis

修改 `.env.production` 中的连接地址。

---

## 四、健康检查

### 4.1 检查服务状态

```bash
# 后端服务
pm2 status

# MongoDB
systemctl status mongod

# Redis
systemctl status redis

# Nginx
systemctl status nginx
```

### 4.2 测试API

```bash
curl http://localhost:3000/api/health
```

---

## 五、常见问题

### 5.1 端口被占用

```bash
# 查看端口占用
lsof -ti:3000
# 杀掉占用进程
kill -9 <PID>
```

### 5.2 MongoDB 连接失败

```bash
# 检查 MongoDB 状态
systemctl status mongod

# 查看日志
tail -f /var/log/mongodb/mongod.log
```

### 5.3 日志查看

```bash
# PM2 日志
pm2 logs insurance-backend

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 六、备份与恢复

### 6.1 数据备份

```bash
# MongoDB 备份
mongodump --db insurance --out /backup/$(date +%Y%m%d)

# 定时备份（添加到 crontab）
crontab -e
# 每天凌晨2点备份
0 2 * * * mongodump --db insurance --out /backup/$(date +\%Y\%m\%d)
```

---

## 七、性能优化建议

1. 启用 MongoDB 索引
2. 配置 Redis 持久化
3. 启用 Nginx Gzip 压缩
4. 配置 CDN 加速静态资源
5. 使用 PM2 集群模式：`pm2 start dist/main.js -i max`

---

## 八、安全建议

1. 配置防火墙只开放必要端口（22, 80, 443）
2. 修改 SSH 端口
3. 禁用 root 远程登录
4. 配置 Fail2ban 防止暴力破解
5. 定期更新系统和依赖包
6. 使用 .env 管理敏感信息，不要提交到代码仓库

---

**技术支持：如有问题，请检查日志文件或联系开发团队**
