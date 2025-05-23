# PMP考试题库系统

## 项目简介
这是一个专门面向PMP（项目管理专业人士）认证考试准备的在线题库系统。该系统旨在帮助考生更好地准备PMP考试，提供全面的练习题和详细的解析。

## 用户需求分析

### 核心用户需求
1. **考试练习需求**
   - 进行模拟考试
   - 随机抽题练习
   - 按知识领域练习
   - 查看答案和解析

2. **学习效果跟踪**
   - 记录做题历史
   - 统计正确率
   - 分析薄弱知识点
   - 生成学习报告

3. **个性化学习**
   - 收藏重点题目
   - 错题重做
   - 自定义题目难度
   - 制定学习计划

4. **考试指导**
   - 考试要点提示
   - 答题技巧指导
   - 时间管理建议
   - 考试策略推荐

## 系统特点

1. **全面的题库资源**
   - 包含180道PMP考试真题
   - 涵盖项目管理各个知识领域
   - 题目类型包括单选题和多选题
   - 每道题目都配有详细解析

2. **智能学习系统**
   - 自适应出题算法
   - 个性化学习路径
   - 实时进度追踪
   - 智能错题分析

3. **用户友好界面**
   - 清晰的题目展示
   - 便捷的答题操作
   - 直观的结果反馈
   - 完善的学习统计

## 技术架构

### 前端技术栈
- **框架**: Next.js 14 (App Router)
- **UI组件**: Shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **类型检查**: TypeScript

### 后端技术栈
- **API路由**: Next.js API Routes
- **数据库**: Neon (PostgreSQL)
- **ORM**: Prisma
- **认证**: NextAuth.js
- **缓存**: Vercel KV (Redis)

### 部署环境
- **平台**: Vercel
- **数据库**: Neon Serverless PostgreSQL
- **域名**: 待定
- **监控**: Vercel Analytics

## 本地开发环境搭建

### 环境要求
- Node.js 18+
- pnpm 8+
- PostgreSQL 15+

### 安装步骤

1. 克隆项目并安装依赖
```bash
git clone <repository-url>
cd pmp-training
pnpm install
```

2. 环境变量配置
```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

3. 初始化数据库
```bash
pnpm prisma generate
pnpm prisma db push
```

4. 启动开发服务器
```bash
pnpm dev
```

### Vercel部署步骤

1. 在Vercel上创建新项目
2. 连接GitHub仓库
3. 配置环境变量：
   - `DATABASE_URL`: Neon数据库连接字符串
   - `NEXTAUTH_SECRET`: 认证密钥
   - `NEXTAUTH_URL`: 生产环境URL

4. 部署命令配置：
```bash
# Build Command
pnpm build

# Install Command
pnpm install
```

## 使用说明

### 安装依赖
```bash
# 安装必要的Python包
pip install -r requirements.txt
```

### 运行系统
```bash
# 启动Web服务
python server.py
```

### 访问系统
在浏览器中访问：`http://localhost:8080`

## 文件说明
- `index.html`: 系统主页面
- `exam.js`: 考试功能实现
- `data.md`: 题库补充说明
- `pmp_questions.json`: 主题库数据
- `parse_pmp_questions.py`: 题库解析脚本

## 后续开发计划
1. 添加更多的题目和解析
2. 实现在线模拟考试功能
3. 添加用户登录和成绩管理
4. 优化学习数据分析功能
5. 增加移动端适配

## 贡献指南
欢迎提交Issue和Pull Request来帮助改进这个项目。

## 许可证
MIT License 