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
