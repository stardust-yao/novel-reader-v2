# Plan: 修复书城加载失败

## Context
书城显示"加载失败"，原因是 Vite 构建时需要将 `import.meta.env.VITE_*` 的值烧录进 bundle，而 `.env` 文件是在构建之后才写入的，导致运行时值为 `undefined`，Supabase 客户端初始化失败。

## 修改：`src/lib/supabase.ts`

将环境变量替换为直接硬编码的字符串（anon key 权限仅限公开读写，风险可接受）：

```ts
const supabaseUrl = 'https://fvnaueanurumlqqebthz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bmF1ZWFudXJ1bWxxcWVidGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODUyOTQsImV4cCI6MjA5OTE2MTI5NH0.2bwHRMW6FgWWHabyHZxcjrc47-vBAB4hGVOsGzFnHoo'
```

## 验证
书城页面加载后显示书目列表（或空状态），不再报错。

---

# Plan: 书城页面（共享书库）

## Context
用户希望增加书城功能，需兼顾两类用户：
- **资源方**：手里有 TXT 文件，上传后可选择共享给所有人
- **读者**：没有文件，直接来书城找别人共享的书阅读

两种入口体验都要顺畅，不能让读者被迫走上传流程。

---

## 用户流程

```
首页（书城）
  ├─ [浏览书城] → 书城列表 → 点击书 → 直接进入阅读
  └─ [上传我的书] → 上传界面 → 解析 → 阅读界面 → 可选"分享到书城"
```

**首页即书城**：网站打开默认显示书城列表，同时顶部有明显的"上传我的书"入口，两类用户一眼找到自己的路径。

---

## 技术方案

### 第 0 步：连接 Supabase + 建表
使用 `supabase_connect` MCP 工具连接项目，npm install `@supabase/supabase-js`。

```sql
create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  uploader text default '匿名',
  chapter_count int default 0,
  moment_count int default 0,
  file_content text not null,
  created_at timestamptz default now()
);
alter table books enable row level security;
create policy "anyone can read"   on books for select using (true);
create policy "anyone can insert" on books for insert with check (true);
```

### 第 1 步：新建 `src/lib/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### 第 2 步：修改 `src/App.tsx`
状态：`type Page = 'library' | 'upload' | 'reader'`，默认 `'library'`

页面路由：
- `library` → `<LibraryPage>`（包含自己的导航栏 + 上传入口）
- `upload` → 复用现有 `<UploadScreen>`（加返回书城按钮）
- `reader` → 复用现有 `<ReaderLayout>`（header 加分享按钮）

novel 状态不变（`ParsedNovel | null`），但加 `rawText: string` 字段（见第 3 步）

### 第 3 步：`src/utils/novelParser.ts`
`ParsedNovel` 接口加 `rawText: string`，`parseNovel()` 函数签名不变，返回值加 `rawText: text`（原始文本直接存入）

### 第 4 步：新建 `src/components/LibraryPage.tsx`（书城首页）

**顶部导航栏**（书城自带，与阅读器 header 风格一致）：
- 左：logo "智阅" + "书城" 标题
- 右：突出的"上传我的书"按钮（深色填充，主要 CTA）

**书城列表区**：
- 加载时显示骨架屏占位卡片
- 卡片 Grid（每行 2–3 列，响应式），每张卡片：
  - 书名（Lora 字体，大）
  - 章节数 · 情感节点数
  - 分享时间（"3 小时前"）
  - "开始阅读" 按钮（hover 变深色）
- 空状态：图形 + "暂无共享书目" + "成为第一个分享者"按钮（跳上传）

**点击"开始阅读"**：取 `file_content` → `parseNovel()` → 跳转到 reader 页面

**点击"上传我的书"**：跳转到 upload 页面

### 第 5 步：修改 `src/components/UploadScreen.tsx`
加一个"← 返回书城"的文字链接（左上角），点击回 library 页。
Props 加 `onBack: () => void`。

### 第 6 步：修改 `src/components/ReaderLayout.tsx`
Header 右侧加"分享到书城"按钮：
- 初始状态：显示"分享到书城"（轮廓按钮风格）
- 点击：调用 Supabase insert（`novel.title`, `novel.rawText`, `novel.chapters.length`, `novel.emotionMoments.length`），成功后变为"已分享 ✓"并禁用
- 分享状态用本地 `useState` 管理（`'idle' | 'loading' | 'done'`）

---

## 修改文件清单

| 文件 | 改动 |
|---|---|
| `src/lib/supabase.ts` | 新建 |
| `src/utils/novelParser.ts` | ParsedNovel 加 `rawText` 字段 |
| `src/App.tsx` | 页面路由状态 + 各页面跳转 |
| `src/components/LibraryPage.tsx` | 新建，书城首页 |
| `src/components/UploadScreen.tsx` | 加 `onBack` prop + 返回按钮 |
| `src/components/ReaderLayout.tsx` | 加"分享到书城"按钮 |

---

## 验证
1. 网站打开 → 默认显示书城（有"上传我的书"按钮）
2. 点"上传我的书" → 进入上传界面，有"← 返回书城"
3. 上传小说后 → 进入阅读，header 有"分享到书城"
4. 点击分享 → 变为"已分享 ✓"
5. 返回书城 → 列表出现刚分享的书
6. 点书城里的"开始阅读" → 无需上传直接进入阅读界面

---

# Plan: 正文自适应宽度

## Context
用户反映正文两侧留白太宽，文字被固定在 640px 内，希望改为自适应宽度——随着阅读区宽度变化而撑满，不再锁定最大宽度。

## 修改范围
**只修改 `src/components/NovelContent.tsx`**，第 117 行的内容容器 div。

## 改动
将 `<div className="max-w-[640px] mx-auto px-10 py-12">` 改为：

```jsx
<div style={{ padding: '48px 8%' }}>
```

- 去掉 `max-w-[640px]` 和 `mx-auto`：文字撑满容器，不再有固定上限
- 左右 padding 固定为容器宽度的 8%：窗口窄时留白小，窗口宽时留白自然增大，始终保持美观比例
- 举例：600px 宽的阅读区 → 两侧各 48px 留白；1000px 宽 → 两侧各 80px，文字区 840px

## 验证
上传小说后拖拽调整浏览器窗口宽度，正文应随宽度自适应撑满，两侧留白保持合理比例

---

# Plan: 进度条美化（已完成）

## Context
用户希望美化正文区右边缘的灰色阅读进度条。当前实现在 `src/components/NovelContent.tsx` 第 165–218 行：22px 宽，`#efede8` 背景，色块 5px 圆角、opacity 0.8，激活时白色双环描边 + scaleX(1.1)，红色指示器为 7px 圆点 + 1px 渐变横线。

## 修改范围
**只修改 `src/components/NovelContent.tsx` 进度条区域**（第 165–218 行的 `{/* Reading progress bar */}` div）。其他文件不动。

---

## 改动细节

### 轨道（track）
- 外层宽度 `22px` → `28px`，`right: 9px` → `right: 6px`
- `<main>` 的 `paddingRight: '38px'` → `'44px'`（正文给轨道腾位置）
- track 背景 `#efede8` → `#ede9e2`，加 `boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.07)'`（轻微内嵌阴影，增加深度感）

### 情感色块（pills）
- `borderRadius: '5px'` → `'50px'`（完全圆头胶囊形）
- `left: '3px' right: '3px'` → `left: '5px' right: '5px'`
- 非激活：opacity `0.8` → `1`（实色），加 `boxShadow: '0 1px 3px rgba(0,0,0,0.10)'`
- 激活：`scaleX(1.1)` → `scaleX(1.3)` + `boxShadow: '0 2px 10px ${color}99'`（柔光晕，去掉白色硬环）
- hover（JS onMouseEnter/Leave）：`transform: 'scaleX(1.15)'`

### Hover 浮动 label
- 每个 `<button>` 内加一个绝对定位 `<span>`，初始 opacity 0，hover 时通过 onMouseEnter/Leave 切换 opacity 1
- 位置：`right: 'calc(100% + 6px)'`，`top: '50%'`，`transform: 'translateY(-50%)'`
- 样式：`fontSize: 10`，白色背景，`padding: '2px 6px'`，`borderRadius: 6`，`boxShadow: '0 1px 6px rgba(0,0,0,0.12)'`，`color: '#555'`，`pointerEvents: 'none'`

### 红色阅读指示器
- 圆点 → 菱形：`width/height: 6px`，`transform: 'translate(-40%, -50%) rotate(45deg)'`，`borderRadius: 1`，`boxShadow: '0 0 0 1.5px white, 0 0 4px rgba(232,64,64,0.45)'`
- 横线：`height: 1px`，`background: 'linear-gradient(90deg, #e84040 40%, transparent)'`，`marginLeft: 2`

---

## 验证
1. 进度条宽度增加（28px），视觉更突出
2. 色块为完整圆头胶囊形，实色
3. Hover 色块时左侧浮出 label 文字提示
4. 激活色块柔光晕，无硬白环
5. 红色指示器为菱形 + 渐隐横线，随滚动移动正常
