# 保险方案对比AI - 后端开发方案

## 一、整体架构设计

### 1.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      前端层 (H5/小程序)                        │
│  - 方案输入（文本/文件/图片）                                   │
│  - 进度展示                                                    │
│  - 对比结果展示                                                │
│  - 历史记录管理                                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST API
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      后端服务层 (Node.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  API网关   │  │  任务队列   │  │  文件存储   │           │
│  │  Router    │  │  Queue      │  │  COS/OBS   │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                │                │                    │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐           │
│  │ 方案解析    │  │ 差异对比    │  │ 结果存储    │           │
│  │  Service   │  │  Service   │  │  Service   │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
└─────────┼────────────────┼────────────────┼───────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AI服务层                                │
│  ┌─────────────────┐  ┌─────────────────────────┐            │
│  │    OCR服务      │  │       大模型服务         │            │
│  │  (图片识别)     │  │  (条款解析+差异对比)     │            │
│  └─────────────────┘  └─────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       数据存储层                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐    │
│  │   MongoDB      │  │    Redis       │  │   云存储     │    │
│  │  (业务数据)    │  │  (缓存/队列)   │  │ (文件/图片)  │    │
│  └─────────────────┘  └─────────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、技术选型

### 2.1 后端框架

| 分类 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 语言 | TypeScript | 5.x | 类型安全，代码质量高，适合企业级应用 |
| 框架 | NestJS | 10.x | 模块化架构，依赖注入，TypeScript原生支持，生态完善 |
| 数据库 | MongoDB | 7.x | 文档型数据库，适合存储非结构化的保险条款数据 |
| 缓存 | Redis | 7.x | 任务队列、缓存、会话管理 |
| 文件存储 | 阿里云OSS / 腾讯云COS | - | 云存储服务，支持大文件上传和管理 |
| API文档 | Swagger | 7.x | 自动生成API文档，便于前后端协作 |

### 2.2 OCR服务选型

| 服务 | 厂商 | 优势 | 适用场景 |
|------|------|------|----------|
| **阿里云OCR** | 阿里云 | 多语言支持，精度高，价格适中 | 推荐用于生产环境 |
| **腾讯云OCR** | 腾讯云 | 与微信生态无缝集成 | 适合微信小程序场景 |
| **百度智能云OCR** | 百度 | 免费额度高，性价比高 | 适合初创项目 |
| **PaddleOCR** | 开源 | 开源免费，可私有化部署 | 适合有隐私需求的场景 |

**推荐方案**：阿里云OCR + PaddleOCR兜底

### 2.3 大模型选型

| 模型 | 厂商 | 优势 | 适用场景 |
|------|------|------|----------|
| **GPT-4 / GPT-4o** | OpenAI | 理解能力强，专业领域知识丰富 | 保险条款解析、差异对比 |
| **Claude 3** | Anthropic | 上下文窗口大，适合长文档处理 | 长保险条款分析 |
| **通义千问** | 阿里云 | 国内服务，响应快，合规性好 | 国内部署首选 |
| **文心一言** | 百度 | 中文理解强，价格优势 | 性价比之选 |

**推荐方案**：通义千问（国内）+ GPT-4（备用）

---

## 三、核心模块设计

### 3.1 模块划分

| 模块 | 职责 | 关键功能 |
|------|------|----------|
| `app.module` | 应用根模块 | 全局配置，依赖注入 |
| `plan.module` | 方案管理模块 | 方案CRUD、文件上传 |
| `analyze.module` | 分析模块 | OCR识别、条款解析 |
| `compare.module` | 对比模块 | 差异对比分析 |
| `history.module` | 历史模块 | 历史记录管理 |
| `storage.module` | 存储模块 | 文件上传、管理 |

### 3.2 核心数据模型

#### 3.2.1 Plan（保险方案）

```typescript
interface Plan {
  id: string;              // 方案ID
  name: string;            // 方案名称
  inputType: 'text' | 'file' | 'image'; // 输入类型
  content?: string;        // 文本内容
  fileInfo?: FileInfo;     // 文件信息
  images?: string[];       // 图片URL列表
  parsedData?: ParsedInsurance; // 解析后的数据
  createdAt: Date;
  updatedAt: Date;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ParsedInsurance {
  company?: string;        // 保险公司
  productName?: string;    // 产品名称
  insuranceType?: string;   // 保险类型
  coveragePeriod?: string; // 保障期限
  paymentPeriod?: string;  // 缴费期限
  waitingPeriod?: string;  // 等待期
  criticalIllness?: {      // 重疾保障
    types: number;
    payoutRatio: string;
    payoutCount: number;
  };
  mildIllness?: {          // 轻症保障
    payoutRatio: string;
    payoutCount: number;
  };
  middleIllness?: {        // 中症保障
    payoutRatio: string;
    payoutCount: number;
  };
  deathCoverage?: string;  // 身故保障
  premium?: string;        // 保费
  exclusions?: string[];   // 免责条款
}
```

#### 3.2.2 CompareResult（对比结果）

```typescript
interface CompareResult {
  id: string;
  planIds: string[];       // 参与对比的方案ID
  plans: ParsedInsurance[]; // 解析后的方案数据
  differences: Difference[]; // 差异列表
  createdAt: Date;
}

interface Difference {
  field: string;           // 对比字段
  fieldLabel: string;      // 字段标签
  values: DifferenceValue[];
  impact: 'advantage' | 'disadvantage' | 'neutral' | 'same';
  summary?: string;       // 差异说明
}

interface DifferenceValue {
  planId: string;
  planName: string;
  value: string;
}
```

---

## 四、API接口设计

### 4.1 方案管理接口

| API路径 | HTTP方法 | 功能描述 |
|---------|----------|----------|
| `/api/plans` | POST | 创建方案 |
| `/api/plans` | GET | 获取方案列表 |
| `/api/plans/:id` | GET | 获取单个方案 |
| `/api/plans/:id` | PUT | 更新方案 |
| `/api/plans/:id` | DELETE | 删除方案 |

#### POST /api/plans

**请求体**：
```json
{
  "name": "平安福2024",
  "inputType": "text",
  "content": "保险条款内容..."
}
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "id": "plan-xxx",
    "name": "平安福2024",
    "inputType": "text",
    "content": "保险条款内容...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 4.2 分析接口

| API路径 | HTTP方法 | 功能描述 |
|---------|----------|----------|
| `/api/analyze` | POST | 提交分析任务 |
| `/api/analyze/:taskId` | GET | 查询分析进度 |

#### POST /api/analyze

**请求体**：
```json
{
  "planIds": ["plan-xxx", "plan-yyy"]
}
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "taskId": "task-xxx",
    "status": "processing",
    "message": "分析任务已创建"
  }
}
```

#### GET /api/analyze/:taskId

**响应**：
```json
{
  "code": 200,
  "data": {
    "taskId": "task-xxx",
    "status": "completed",
    "progress": 100,
    "result": {
      "planIds": ["plan-xxx", "plan-yyy"],
      "plans": [...],
      "differences": [...]
    }
  }
}
```

### 4.3 对比接口

| API路径 | HTTP方法 | 功能描述 |
|---------|----------|----------|
| `/api/compare` | POST | 执行对比分析 |
| `/api/compare/:taskId` | GET | 获取对比结果 |

### 4.4 历史记录接口

| API路径 | HTTP方法 | 功能描述 |
|---------|----------|----------|
| `/api/history` | GET | 获取历史记录列表 |
| `/api/history/:id` | GET | 获取历史详情 |
| `/api/history/:id` | DELETE | 删除历史记录 |

---

## 五、OCR集成方案

### 5.1 阿里云OCR配置

```typescript
// src/config/ocr.config.ts
export const OCR_CONFIG = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  endpoint: 'https://ocr.cn-hangzhou.aliyuncs.com',
  apiVersion: '2019-12-30'
};
```

### 5.2 OCR服务实现

```typescript
// src/services/ocr.service.ts
@Injectable()
export class OcrService {
  private client: RPCClient;

  constructor() {
    this.client = new RPCClient({
      accessKeyId: OCR_CONFIG.accessKeyId,
      accessKeySecret: OCR_CONFIG.accessKeySecret,
      endpoint: OCR_CONFIG.endpoint,
      apiVersion: OCR_CONFIG.apiVersion
    });
  }

  async recognizeImage(imageUrl: string): Promise<string> {
    const params = {
      ImageUrl: imageUrl,
      RecognizeDirection: true,
      DetectText: true
    };

    const result = await this.client.request('RecognizeDocument', params);
    return result.Data?.Content || '';
  }

  async recognizeImages(imageUrls: string[]): Promise<string> {
    const texts = await Promise.all(
      imageUrls.map(url => this.recognizeImage(url))
    );
    return texts.join('\n\n');
  }
}
```

---

## 六、大模型集成方案

### 6.1 大模型配置

```typescript
// src/config/llm.config.ts
export const LLM_CONFIG = {
  provider: process.env.LLM_PROVIDER || 'tongyi', // tongyi, openai, claude
  apiKey: process.env.LLM_API_KEY,
  model: process.env.LLM_MODEL || 'qwen-plus',
  temperature: 0.1,
  maxTokens: 8192
};
```

### 6.2 保险条款解析提示词

```typescript
const INSURANCE_PARSE_PROMPT = `
请解析以下保险条款文本，提取关键信息并以JSON格式输出：

文本内容：
{content}

请提取以下字段：
- company: 保险公司名称
- productName: 产品名称
- insuranceType: 保险类型（重疾险/百万医疗险/意外险等）
- coveragePeriod: 保障期限（如：终身、至70岁、20年等）
- paymentPeriod: 缴费期限（如：20年、30年等）
- waitingPeriod: 等待期（如：90天、180天等）
- criticalIllness: 重疾保障信息
  - types: 重疾种类数量
  - payoutRatio: 赔付比例
  - payoutCount: 赔付次数
- mildIllness: 轻症保障信息
  - payoutRatio: 赔付比例
  - payoutCount: 赔付次数
- middleIllness: 中症保障信息
  - payoutRatio: 赔付比例
  - payoutCount: 赔付次数
- deathCoverage: 身故保障（如：100%保额）
- premium: 年保费（如：8500元）
- exclusions: 免责条款数量或关键免责内容（数组）

如果某个字段无法从文本中提取，请设为null。
输出必须是纯JSON格式，不要包含其他内容。
`;
```

### 6.3 差异对比提示词

```typescript
const COMPARE_PROMPT = `
请对比以下保险方案，找出关键差异：

方案A:
{planA}

方案B:
{planB}

请按照以下格式输出差异：
1. 重疾种类：方案A(120种) vs 方案B(110种) - 方案A更优
2. 等待期：方案A(90天) vs 方案B(180天) - 方案A更优
3. 轻症赔付：方案A(30%) vs 方案B(20%) - 方案A更优

对于每个差异，请判断对投保人的影响（有利/不利/一般）。
输出语言：中文
`;
```

### 6.4 LLM服务实现

```typescript
// src/services/llm.service.ts
@Injectable()
export class LlmService {
  private client: any;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    switch (LLM_CONFIG.provider) {
      case 'tongyi':
        this.client = new TongYiClient(LLM_CONFIG.apiKey);
        break;
      case 'openai':
        this.client = new OpenAIClient(LLM_CONFIG.apiKey);
        break;
      case 'claude':
        this.client = new ClaudeClient(LLM_CONFIG.apiKey);
        break;
      default:
        throw new Error('Unsupported LLM provider');
    }
  }

  async parseInsurance(text: string): Promise<ParsedInsurance> {
    const prompt = INSURANCE_PARSE_PROMPT.replace('{content}', text);
    const response = await this.client.complete({
      model: LLM_CONFIG.model,
      prompt,
      temperature: LLM_CONFIG.temperature,
      maxTokens: LLM_CONFIG.maxTokens
    });
    return JSON.parse(response.content);
  }

  async comparePlans(plans: ParsedInsurance[]): Promise<Difference[]> {
    let prompt = '请对比以下保险方案：\n\n';
    plans.forEach((plan, index) => {
      prompt += `方案${String.fromCharCode(65 + index)}:\n${JSON.stringify(plan, null, 2)}\n\n`;
    });
    prompt += '请找出关键差异并输出JSON格式结果';

    const response = await this.client.complete({
      model: LLM_CONFIG.model,
      prompt,
      temperature: 0.1,
      maxTokens: 4096
    });
    return JSON.parse(response.content);
  }
}
```

---

## 七、任务队列设计

### 7.1 分析任务流程

```
用户提交 → 创建任务 → OCR识别 → 条款解析 → 差异对比 → 保存结果 → 通知回调
```

### 7.2 任务状态

| 状态 | 说明 |
|------|------|
| `pending` | 等待处理 |
| `processing` | 处理中 |
| `ocr` | OCR识别中 |
| `parsing` | 条款解析中 |
| `comparing` | 差异对比中 |
| `completed` | 完成 |
| `failed` | 失败 |

### 7.3 队列服务

```typescript
// src/services/queue.service.ts
@Injectable()
export class QueueService {
  private queue: Queue;

  constructor() {
    this.queue = new Queue('insurance-analyze', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.queue.process(this.processAnalyzeTask.bind(this));
  }

  async addTask(planIds: string[]): Promise<string> {
    const job = await this.queue.add({ planIds });
    return job.id;
  }

  async getTaskStatus(taskId: string): Promise<Job> {
    const job = await this.queue.getJob(taskId);
    return job;
  }

  private async processAnalyzeTask(job: Job) {
    const { planIds } = job.data;
    
    // 1. 获取方案数据
    const plans = await this.planService.findByIds(planIds);
    
    // 2. OCR识别（如果是图片输入）
    for (const plan of plans) {
      if (plan.inputType === 'image' && plan.images) {
        plan.content = await this.ocrService.recognizeImages(plan.images);
      } else if (plan.inputType === 'file') {
        // 文件解析逻辑
      }
    }
    
    // 3. 条款解析
    const parsedPlans = await Promise.all(
      plans.map(plan => this.llmService.parseInsurance(plan.content || ''))
    );
    
    // 4. 差异对比
    const differences = await this.llmService.comparePlans(parsedPlans);
    
    // 5. 保存结果
    const result = await this.compareService.saveResult({
      planIds,
      plans: parsedPlans,
      differences
    });
    
    return result;
  }
}
```

---

## 八、部署方案

### 8.1 环境配置

| 环境 | MongoDB | Redis | OCR | LLM |
|------|---------|-------|-----|-----|
| 开发 | 本地 | 本地 | 阿里云测试 | 通义千问测试 |
| 测试 | MongoDB Atlas | Redis Cloud | 阿里云正式 | 通义千问正式 |
| 生产 | 阿里云MongoDB | 阿里云Redis | 阿里云正式 | 通义千问正式 |

### 8.2 Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/insurance
      - REDIS_URL=redis://redis:6379
      - ALIYUN_ACCESS_KEY_ID=${ALIYUN_ACCESS_KEY_ID}
      - ALIYUN_ACCESS_KEY_SECRET=${ALIYUN_ACCESS_KEY_SECRET}
      - LLM_API_KEY=${LLM_API_KEY}
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7.0
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7.0
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

---

## 九、安全与合规

### 9.1 数据安全

- HTTPS加密传输
- 敏感数据加密存储（AES-256）
- API接口签名验证
- 定期数据备份

### 9.2 隐私合规

- 用户数据脱敏处理
- 隐私政策告知
- 数据留存期限管理
- 第三方服务数据处理协议

### 9.3 风控措施

- 请求频率限制
- 文件大小限制（单文件≤20MB）
- 内容安全检测
- 异常行为监控

---

## 十、后续迭代计划

| 阶段 | 功能 | 时间 |
|------|------|------|
| MVP | 基础对比功能 | 1-2周 |
| V1.1 | 更多险种支持 | 2周 |
| V1.2 | 智能问答 | 2周 |
| V1.3 | 条款定位 | 2周 |

---

## 附录：环境变量

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/insurance

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 阿里云OCR
ALIYUN_ACCESS_KEY_ID=your-access-key
ALIYUN_ACCESS_KEY_SECRET=your-secret-key

# 大模型
LLM_PROVIDER=tongyi
LLM_API_KEY=your-llm-key
LLM_MODEL=qwen-plus

# 文件存储
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BUCKET=insurance-plans
```
