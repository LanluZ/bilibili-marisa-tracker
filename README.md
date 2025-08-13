# 魔理沙的秘密☆书屋

## 概述

**魔理沙的秘密☆书屋** 是来自 mikufan 的 Web 应用，用于追踪和展示 B站视频的实时数据，包括观看人数、播放量等统计信息

基于React开发，提供优雅的用户界面和强大的数据采集功能

### 核心功能
- **实时数据采集**: 自动爬取 B站视频数据
- **数据可视化**: 精美的卡片式视频展示
- **分页浏览**: 5列网格布局，每页展示15个视频
- **多维排序**: 支持按播放量、观看人数等排序
- **历史数据**: 按日期查看历史爬取数据
- **实时状态**: 显示爬虫运行状态和配置信息
- **响应式设计**: 支持多种屏幕尺寸

## 技术架构

### 整体架构
```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   React 前端    │ ←────────────→ │  FastAPI 后端   │
│   (端口: 3000)  │                │   (端口: 8000)  │
└─────────────────┘                └─────────────────┘
                                           │
                                           ▼
                                   ┌─────────────────┐
                                   │  SQLite 数据库  │
                                   │ bilibili_videos │
                                   └─────────────────┘
                                           ▲
                                           │
                                   ┌─────────────────┐
                                   │ Selenium 爬虫   │
                                   │   + Chrome      │
                                   └─────────────────┘
```

### 技术栈详情

#### 后端技术栈
- **框架**: FastAPI 0.115.0
- **服务器**: Uvicorn (开发) / Gunicorn (生产)
- **数据库**: SQLite 3
- **爬虫引擎**: Selenium 4.28.0 + Chrome WebDriver
- **HTTP 客户端**: HTTPx 0.27.2
- **数据验证**: Pydantic 2.10.1
- **跨域支持**: FastAPI CORS Middleware

#### 前端技术栈
- **框架**: React 19.1.1
- **构建工具**: Vite 7.1.2
- **开发语言**: JavaScript (ES6+)
- **代码检查**: ESLint 9.33.0

## 数据库设计

### videos 表结构
```sql
CREATE TABLE videos (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    bvid                TEXT,                              -- B站视频ID
    aid                 INTEGER,                           -- AV号
    cid                 INTEGER,                           -- 分集ID
    title               TEXT NOT NULL,                     -- 视频标题
    pic                 TEXT,                              -- 封面图片URL
    view_count          INTEGER,                           -- 播放量
    online_count        TEXT,                              -- 当前观看人数(原始字符串)
    max_online_count    INTEGER DEFAULT 0,                -- 最大观看人数
    max_online_time     TIMESTAMP,                         -- 最大观看人数记录时间
    crawl_date          TEXT NOT NULL,                     -- 爬取日期(YYYY-MM-DD)
    crawl_time          TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 爬取时间戳
    UNIQUE(bvid, crawl_date) ON CONFLICT REPLACE           -- 防止重复记录
);
```

### 数据类型说明
- **数值处理**: 支持中文"万"字符和"+"符号的智能解析
- **时间格式**: 使用 ISO 8601 标准时间戳
- **唯一约束**: 基于 BVID + 爬取日期，确保数据一致性

## 🕷️ 爬虫系统设计

### BilibiliSpider 类
```python
class BilibiliSpider:
    def __init__(self,
                 headless: bool = True,           # 无头模式
                 timeout: int = 15,               # 页面超时
                 script_timeout: int = 20,        # 脚本超时
                 page_load_timeout: int = 20,     # 加载超时
                 block_images: bool = True):      # 阻止图片加载
```

### 爬取流程
1. **初始化**: 启动 Chrome 浏览器（无头模式）
2. **主页引导**: 访问 B站首页，建立会话
3. **数据获取**: 执行 JavaScript 获取视频数据
4. **数据解析**: 处理中文数字和特殊字符
5. **数据存储**: 保存到 SQLite 数据库
6. **定时调度**: 支持自定义爬取间隔

### 反爬虫策略
- **User-Agent 伪装**: 模拟真实浏览器
- **请求间隔**: 避免频繁请求
- **会话保持**: 维持浏览器状态
- **错误重试**: 自动重试失败的请求

## 前端架构设计

### 组件结构
```
App.jsx
├── ErrorBoundary (错误边界)
├── Header (页面头部)
│   ├── 标题和副标题
│   ├── 爬虫状态指示器
│   └── 启动爬虫按钮
├── Controls (控制面板)
│   ├── 日期选择器
│   ├── 排序方式选择
│   └── 排序方向选择
├── StatsAndPagination (统计和分页)
│   ├── 视频总数显示
│   ├── 当前页信息
│   └── 分页控件
└── VideoGrid (视频网格)
    └── VideoCard[] (视频卡片数组)
```

### 状态管理
```javascript
// 核心状态
const [videos, setVideos] = useState([])           // 视频数据
const [dates, setDates] = useState([])             // 可用日期
const [selectedDate, setSelectedDate] = useState('')  // 选中日期
const [sortBy, setSortBy] = useState('view_count') // 排序字段
const [sortOrder, setSortOrder] = useState('desc') // 排序方向
const [loading, setLoading] = useState(false)      // 加载状态
const [crawlStatus, setCrawlStatus] = useState({}) // 爬虫状态

// 分页状态
const [currentPage, setCurrentPage] = useState(1)  // 当前页
const [totalVideos, setTotalVideos] = useState(0)  // 总视频数
const videosPerPage = 15                           // 每页视频数
```

### 布局系统
- **网格布局**: CSS Grid，5列 × 3行 = 15个视频/页
- **响应式设计**: 
  - 1200px+: 5列
  - 992px-1200px: 4列
  - 768px-992px: 3列
  - <768px: 1列
- **卡片设计**: 毛玻璃效果 + 阴影 + 悬停动画

## UI/UX 设计特色

### 视觉设计
- **主题色彩**: 渐变粉色系（#ff6b9d → #c44569 → #f8b500）
- **背景系统**: 双层背景（自定义图片 + 动态渐变）
- **毛玻璃效果**: backdrop-filter + 半透明背景
- **动画系统**: 页面加载、卡片悬停、状态切换动画

### 交互设计
- **平滑过渡**: 0.3s-0.4s 缓动动画
- **悬停反馈**: 3D 旋转 + 阴影增强
- **状态指示**: 实时爬虫状态 + 脉冲动画
- **错误处理**: 优雅的错误边界 + 重试机制

### 数据展示
- **视频卡片**: 封面图 + 标题 + 统计数据
- **统计信息**: 播放量、当前观看人数、峰值观看人数
- **时间信息**: 爬取时间 + 峰值记录时间
- **分页控件**: 页码指示器 + 前后翻页按钮

## 部署架构

### 开发环境
```bash
# 后端启动
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 前端启动
cd frontend
npm install
npm run dev  # 默认端口 5173
```

### 生产环境
```bash
# 一键部署
chmod +x deploy.sh
./deploy.sh

# 服务管理
./status.sh    # 检查状态
./stop.sh      # 停止服务
./restart.sh   # 重启服务
```

### 系统要求
- **操作系统**: Linux (Ubuntu/CentOS/Fedora)
- **Python**: 3.8+
- **Node.js**: 16+
- **浏览器**: Chrome/Chromium + ChromeDriver
- **内存**: 推荐 2GB+
- **存储**: 推荐 10GB+

## 性能优化

### 后端优化
- **数据库索引**: BVID + crawl_date 复合索引
- **连接池**: SQLite 连接复用
- **异步处理**: FastAPI 异步框架
- **图片代理**: 减少前端跨域请求

### 前端优化
- **代码分割**: Vite 自动代码分割
- **图片懒加载**: 视频封面延迟加载
- **状态缓存**: 减少不必要的 API 调用
- **CSS 优化**: 利用 GPU 加速的动画

### 爬虫优化
- **无头模式**: 减少资源消耗
- **图片屏蔽**: 禁用图片加载
- **智能重试**: 失败自动重试机制
- **内存管理**: 定期重启浏览器实例

## 🔧 配置管理

### 环境变量
```bash
# 可选环境变量
CRAWL_INTERVAL=60          # 爬取间隔（分钟）
MAX_VIDEOS=100            # 每次爬取视频数
HEADLESS=true             # 无头模式
DEBUG=false               # 调试模式
```

### 配置文件
- **后端配置**: 通过 API 动态调整
- **前端配置**: 编译时配置（vite.config.js）
- **数据库配置**: 自动初始化表结构

### 数据安全
- **SQL 注入防护**: 参数化查询
- **XSS 防护**: 数据转义和验证
- **CORS 配置**: 生产环境限制域名

### 爬虫道德
- **请求频率**: 避免过度请求
- **用户协议**: 遵守网站使用条款
- **数据使用**: 仅用于学习和展示

## API 文档

FastAPI 自动生成的 API 文档：
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 常见问题

1. **ChromeDriver 版本不匹配**
   ```bash
   # 检查 Chrome 版本
   google-chrome --version
   # 下载对应版本的 ChromeDriver
   ```

2. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -tlnp | grep :8000
   # 杀死进程
   kill -9 <PID>
   ```

3. **数据库锁定**
   ```bash
   # 检查数据库文件权限
   ls -la backend/bilibili_videos.db
   # 重启应用
   ./restart.sh
   ```

### 日志分析
```bash
# 查看实时日志
tail -f backend.log
tail -f frontend.log

# 查看错误日志
grep -i error backend.log
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！
