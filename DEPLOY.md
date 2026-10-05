# Plobi-kit — Worker 后端部署指南

静态资产 + 一个 Worker + 一个 D1 数据库。静态页面由 Cloudflare 资产层直接服务
（不消耗 Worker 请求额度），只有 `/api/*` 和 `/s/*` 会进入 Worker。

## 一次性设置

```bash
# 1. 安装依赖（wrangler CLI）
npm install

# 2. 登录 Cloudflare
npx wrangler login

# 3. 创建 D1 数据库，把输出的 database_id 填进 wrangler.jsonc 的
#    d1_databases[0].database_id（替换 REPLACE_WITH_YOUR_D1_DATABASE_ID）
npx wrangler d1 create plobikit

# 4. 在远程数据库建表
npm run db:remote

# 5. 部署
npm run deploy
```

## 本地开发

```bash
npm run db:local   # 本地 D1 建表（首次运行 + schema 变更后）
npm run dev        # http://localhost:8787
```

## 构建与校验

```bash
npm run build          # 重新生成 public/ 的全部静态页
npm run check:sitemap  # sitemap 与磁盘页面是否一一对应
node scripts/check-links.mjs  # 内链与 canonical 自检
```

`scripts/build.mjs` 是唯一正确的顺序，顺序错了就会退化（历史上就退化过一次：
52 个配方页掉了 i18n 启动脚本，中文界面在那些页面上完全不生效）：

1. `gen-cheatsheets` / `gen-recipes` / `gen-guides` / `gen-tool-hub` — 由数据生成页面
2. `cleanup` — 全站卫生检查（假广告位、坏标题、缺失 canonical）
3. `normalize-nav` — 外壳契约：导航、页脚、logo、语言按钮、资源路径、
   内链规范化、i18n 启动脚本，**每次构建都会重写所有页面**
4. `update-sitemap` — 刷新 lastmod，并把新增页面补进 sitemap

页面分两类：

| 类别 | 位置 | 能不能手改 |
|---|---|---|
| 生成页 | `cheatsheets/`（含两个速查表 hub）、`cn/cheatsheets/`、`tools/index.html`、`cn/tools/index.html`、`guides/`、`cn/guides/` | 改数据或模板，改了要重跑 `npm run build` |
| 手写页 | `index.html`、`cn/index.html`、`about/contact/privacy/terms` 及其 `cn/` 版、`collection/` | 直接改；第 3 步仍会统一它们的外壳 |

中英双语：**加译文是改数据，不是改代码。**

- 教程：`content/guides/<slug>.md` 旁边放 `<slug>.zh.md`，自动生成 `/cn/guides/<slug>`
- 配方：在 `scripts/recipes-zh.mjs` 里按 slug 补一块中文（`title / metaDesc / plain /
  fields / variations / tables / intro / body / code / faq / tool`，能给多少给多少，
  缺的字段自动回退英文），自动生成 `/cn/cheatsheets/<slug>` 并出现在中文速查表 hub；
  没给的配方保持纯英文。那里的 slug 若在上游已删除，构建会直接报错，译文不会烂在库里
- 导航不需要维护"哪些栏目有中文"这张表：`normalize-nav` 按 `public/` 里实际存在的
  页面决定链接目标

`deploy.yml` 在部署前设三道闸，任一失败就不发布：

1. 构建产物与提交内容必须一致（说明有人改了数据没重跑构建）
2. sitemap 与磁盘页面一一对应、URL 全为规范形式
3. 站内链接无死链、无 `.html` / `index.html` 这类要多跳一次 307 的写法

`scripts/` 里原先的四个一次性迁移（`restructure-home.mjs`、`reposition-copy.mjs`、
`add-nav.mjs`、`fix-logo-hrefs.py`）已删除：它们的效果要么已经固化进手写页（手写页是
源文件，不是构建产物），要么已由 `normalize-nav` 每次重建，留着只会误导人重跑。

## 路由一览

| 路由 | 方法 | 说明 |
|---|---|---|
| `/api/share` | POST | 创建分享链接。body: `{tool, lang, title, description?, state}` |
| `/api/share/:id` | GET | 分享数据（JSON），工具页 `?share=` 参数恢复状态用 |
| `/s/:id` | GET | 服务端渲染的分享落地页（带 OG meta，社交分享友好） |
| `/api/contact` | POST | contact 表单。body: `{name, email, message, company?}`，`company` 为蜜罐字段 |
| `/deals` | GET | 优惠栏目 hub（SSR，worker-first） |
| `/deals/games` | GET | Epic 喜加一页面（SSR，每日 cron 自动更新，过期自动下架） |
| `/api/deals` | GET | 优惠 JSON feed，`?category=games` |
| `/api/health` | GET | 存活探测 |

优惠抓取随每日 cron（`triggers.crons`）自动运行；本地手动触发：
`curl "http://127.0.0.1:8787/cdn-cgi/local/scheduled"`（需先 `npm run dev`）。

## 运维

```bash
# 查看收到的联系消息（远程）
npx wrangler d1 execute plobikit --remote \
  --command "SELECT id, name, email, message, datetime(created_at, 'unixepoch') AS at FROM contact_messages ORDER BY id DESC LIMIT 20"

# 查看分享链接统计
npx wrangler d1 execute plobikit --remote \
  --command "SELECT tool, COUNT(*) AS n FROM shares WHERE expires_at > strftime('%s','now') GROUP BY tool ORDER BY n DESC"

# 手动清理过期数据（平时由每日 cron 自动做）
npx wrangler d1 execute plobikit --remote \
  --command "DELETE FROM shares WHERE expires_at < strftime('%s','now'); DELETE FROM rate_counters WHERE w < strftime('%s','now')/60 - 10;"
```

## 限额与防滥用（免费档核算）

- Worker 免费档 10 万请求/天——只有动态路由计数，静态资产不计。
- D1 免费档：10 万行写入/天。每次 API 调用消耗：1 次限流计数写入 + 1 次业务写入。
- 限流（按 IP，60 秒窗口）：share 10 次/分钟，contact 3 次/分钟。
- 分享 state 上限 12KB，body 上限 16KB，匿名链接 30 天过期（每日 cron 清理）。

## 前端接入分享按钮

分享按钮由中央注册表 `public/js/shareTools.js` 统一管理，`app.js` 在每个工具页调用
`initShareTools()`。它根据页面 `.tool-panel` 的 id 识别当前工具并注入 Share 按钮，
**无需修改工具页 HTML**。

新增工具的接入方式：在 `shareTools.js` 的 `CONFIGS` 里加一条：

```js
mytool: {
  title: () => ...,         // 分享标题（返回空串则回退到页面标题）
  description: () => ...,   // 可选
  state: () => ({ ... }),   // 可序列化的工具状态（≤12KB）
  restore: (s) => { ... },  // 从分享恢复状态（setField 等辅助函数在文件顶部）
},
```

工具的白名单同时在 `worker/index.js` 的 `TOOLS` 常量里（用于落地页显示工具名，
以及拒绝未知工具）。image（本地文件）和 colorpalette（纯随机生成）没有可恢复
状态，未接入。

## 路线图钩子（尚未实现）

- OG 分享卡图片（satori + resvg + Cache API）
- 每日挑战 + 排行榜（Cron + D1）
- Passkey 账户 + 云同步（D1）
- 支付 webhook + Pro 权益（MoR + D1）
