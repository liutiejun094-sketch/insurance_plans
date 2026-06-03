# 保险方案对比AI

智能保险方案对比分析工具，支持多方案上传、智能解析、差异对比。

---

## 📦 项目结构

```
insurance_plans/
├── index.html                   # 前端H5页面
├── start-frontend.sh           # 前端快速启动脚本
├── nginx.conf                  # Nginx配置文件
├── .gitignore                  # Git忽略文件
├── prd.md                      # 产品需求文档
├── backend-design.md           # 后端设计文档
├── DEPLOY.md                   # 部署指南
├── README.md                   # 项目说明（本文件）
└── backend/                    # 后端项目
    ├── src/                    # 源代码
    ├── package.json            # 依赖配置
    ├── tsconfig.json           # TypeScript配置
    ├── .env                    # 环境变量
    ├── .env.production         # 生产环境变量模板
    ├── Dockerfile              # Docker镜像构建
    ├── .dockerignore           # Docker忽略文件
    └── docker-compose.yml      # Docker Compose配置
```

---

## 🚀 快速开始

### 方式一：本地开发（推荐）

#### 1. 启动后端

```bash
cd backend
npm install
npm run dev
```

#### 2. 启动前端

**方式A：使用启动脚本**
```bash
chmod +x start-frontend.sh
./start-frontend.sh
```

**方式B：直接使用Python**
```bash
python3 -m http.server 8000
```

#### 3. 访问应用
- 前端：http://localhost:8000
- 后端API：http://localhost:3000
- API文档：http://localhost:3000/api/docs

---

### 方式二：Docker 一键启动

```bash
cd backend
cp .env .env.production
# 编辑 .env.production，填入 DeepSeek API Key
docker-compose up -d
```

然后单独启动前端服务。

---

## ✨ 功能特性

### 前端功能
- ✅ 微信小程序风格H5界面
- ✅ 文本输入 + 文件上传（TXT/PDF）
- ✅ PDF文件自动解析
- ✅ 多方案添加/删除
- ✅ 对比进度可视化
- ✅ 对比表格展示
- ✅ 差异卡片标注
- ✅ 历史记录查看

### 后端功能
- ✅ DeepSeek API 集成
- ✅ 保险条款智能解析
- ✅ 多方案对比分析
- ✅ MongoDB 数据持久化
- ✅ Bull 异步任务队列
- ✅ Swagger API 文档
- ✅ CORS 跨域支持

---

## 📝 配置说明

### 环境变量

编辑 `backend/.env` 文件：

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/insurance
REDIS_HOST=localhost
REDIS_PORT=6379
LLM_PROVIDER=deepseek
LLM_API_KEY=your-deepseek-api-key
LLM_MODEL=deepseek-chat
```

**获取 DeepSeek API Key：** https://platform.deepseek.com/

---

## 📚 文档

- [产品需求文档 (PRD)](prd.md)
- [后端设计文档](backend-design.md)
- [部署指南](DEPLOY.md)
- [API文档](http://localhost:3000/api/docs) (需启动后端)

---

## 🔧 技术栈

### 前端
- HTML5 / CSS3 / JavaScript
- Tailwind CSS (CDN)
- Font Awesome
- PDF.js (PDF解析)

### 后端
- Node.js 18+
- NestJS 10
- TypeScript
- MongoDB + Mongoose
- Redis + Bull
- Swagger/OpenAPI

---

## 🌐 部署到腾讯云

详见 [部署指南](DEPLOY.md)，支持：
- 轻量应用服务器部署
- Docker 容器化部署
- 云函数 Serverless 部署

---

## 📄 测试数据

可使用以下保险条款进行测试（更多测试数据见完整文档）：

```
【平安健康保险】平安e生保2024版
保险公司：平安健康保险
保险类型：百万医疗险
保障期限：1年
等待期：30天
一般医疗保额：200万
重疾医疗保额：400万
```

---

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👥 联系方式

- 项目地址：https://github.com/your-username/insurance-plans
- 问题反馈：提交 Issue

---

## 📈 版本历史

- **v1.0.0** (2026-06-03)
  - ✅ 初始版本发布
  - ✅ 核心功能完整实现
  - ✅ 支持部署到腾讯云

---

**💡 提示：首次使用前请确保已申请 DeepSeek API Key 并配置到环境变量中！**
