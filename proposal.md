# Plobi-kit 总体规划 — 最终形态与阶段路线图

> **本文件地位**：项目最高指导文档，取代 2026-06 版 proposal（"WebTools Hub" 方案）。
> 任何开发、内容、变现决策以本文件为准；每完成一个里程碑必须更新"当前状态快照"。
> 部署与运维细节见 [DEPLOY.md](DEPLOY.md)。

---

## 一、愿景与最终形态

**一句话定位**：Plobi-kit 是一个隐私优先的工具与内容生态——"Kit" 既是产品组织方式
（按人群/场景打包的一套东西），也是品牌扩张语法（新增任何业务 = 开一个新 Kit）。

**最终形态 = 四层结构**：

| 层 | 内容 | 状态 |
|---|---|---|
| **工具层** | Dev Kit（17 个本地工具）；大众 Kit（Money/Job/Student 计算器等） | Dev Kit 已有；大众 Kit 规划中 |
| **内容层** | 技术指南；配方页集群（长尾 SEO 矩阵）；优质网站合集；白嫖优惠聚合（Epic/Steam/VPS/AI）；AI 免费档排行榜 | 指南 7 篇已有；其余规划中 |
| **动态层** | 分享链接 + OG 落地页；每日挑战 + 排行榜；Passkey 账户 + 云同步；公共片段库 | 分享已上线；其余规划中 |
| **变现层** | AdSense（保底）；Affiliate（主力）；数字产品；Pro 订阅；API | 全部规划中 |

**不可妥协的原则**：

1. **本地优先**：工具内的一切计算绝不上传；服务端只处理用户显式触发的动作（分享、留言、同步）。
2. **免费档优先**：全站跑在 Cloudflare Workers / D1 / R2 免费额度内；不引入需要运维的服务器（VPS 闲置不用）。
3. **内容质量红线**：不做纯 AI 批量文；每个页面必须有编辑价值；时效性数据（优惠/排行）必须自动更新、过期自动下架。
4. **双语策略**：英文优先（AdSense 变现市场），中文只维护已翻译存量，不做机翻扩张。
5. **品牌诚实**：页面上每一句关于隐私/数据的表述必须与实际行为一致。
6. **门口去身份化**：品牌入口（首页、关于、各 hub 的 meta/hero）只卖结果——快、私密、浏览器里直接用——不限定受众身份；具体工具页按真实用户画像说话（cron 页写服务器管理员是对的）。

---

## 二、当前状态快照（2026-09-06）

**已上线生产（https://plobikit.com）：**

- **生产部署完成**：Cloudflare Workers + D1（id 已配置）+ 自定义域名绑定，
  16 条核心路由全 200，分享闭环（创建/落地/恢复）在生产实测通过
- 阶段 0 全站清理：假广告位（52 处）、MFA 页脚话术（32 处）、破损 HTML、canonical、
  干净 URL sitemap（90 URLs）、robots.txt、sw.js v3
- Worker 后端：`POST /api/share`、`GET /s/:id`（SSR 落地页 + OG 标签）、
  `GET /api/share/:id`、`POST /api/contact`（蜜罐反垃圾）、`GET /api/health`、
  `GET /api/deals` JSON feed；按 IP 限流（D1 计数）、每日 cron 清理 + Epic 抓取
- **阶段 1a**：优质网站合集（`/collection/`，开发者工具 11 + 设计资源 8 +
  平台与托管 12 = 31 条目，手写编辑描述）
- **阶段 1b**：Epic 喜加一管线（官方 API → 每日 cron → D1 → SSR `/deals` + `/deals/games`，
  过期 7 天自动删除）；生产已有真实数据（FREE NOW ×1 + UPCOMING ×2）
- **阶段 1c**：配方页集群 17 篇（cron 11 + git 6），速查表行内链接互通
- **Library 知识库**（原 Guides 板块）：markdown 驱动的双语生成器
  （`content/guides/*.md` → `scripts/gen-guides.mjs`），6 篇文章 + EN/CN hub；
  CN 端无翻译时自动显示提示条 + 英文原文
- **全量国际化**：四级语言判定（localStorage > URL > html lang > 默认 en），
  `data-i18n` 字典系统（`js/i18n-content.js`），全站 90+ 页 nav/footer 可跟随偏好，
  SSR 页面服务端 cookie/Accept-Language 检测；语言切换持久化（localStorage + cookie 镜像）
- **门户首页**（编辑风图纸美学，全矢量图标零 emoji）+ `/tools/` 工具 hub +
  `/cheatsheets/` hub + 8 张速查表；4 个 CSS 模块合并修复跨目录加载
- AdSense 卫生：无假广告位、无 MFA 话术、品牌门口文案去身份化、
  privacy 页如实披露分享/表单数据行为

**未完成（按优先级）：**

- Library 6 篇文章的 `.zh.md` 中文版（当前 CN 端为 stub 提示条）
- 配方页扩展（17 → 50+）；工具支柱页加深（1d）
- Steam / VPS 优惠数据源；AI 免费档排行榜（阶段 2d）
- OG 图片卡（satori）、每日挑战、Passkey 账户、片段库（阶段 2）
- 部署自动化（GitHub Actions push→deploy）；文章翻译 AI 辅助管线

---

## 三、阶段路线图

### 阶段 1（当前）：内容引擎 + 优惠栏目打样

**目标**：实质内容页 40+；跑通第一条"自动更新"数据管线；技术面干净可复审。

| 任务 | 说明 |
|---|---|
| 1a 优质网站合集 | 人工策展起步（每条目有编辑描述/适合谁/对比），纯静态可先行 |
| 1b 白嫖优惠管线 | Epic 喜加一全自动化：官方 API → Workers Cron → D1 `deals` 表 → `run_worker_first` SSR 页面 `/deals/games`，过期自动下架 |
| 1c 配方页集群 | cron（`every 5 minutes` 等）+ git（`undo last commit` 等），crontab.guru 模式，配交互预览 |
| 1d 工具支柱页加深 | 每工具 1500–2500 字：原理、对比表、常见报错、8–10 FAQ、内链 |

**出口标准**：内容页 40+；Epic 管线无人值守运行 2 周；GSC 收录正常、有真实曝光。

### 阶段 2：留存与账户

| 任务 | 说明 |
|---|---|
| 2a 每日挑战 + 排行榜 | Cron 每日 UTC 零点出题（理财/cron/regex 轮换），服务端 nonce 校验，D1 榜单 |
| 2b Passkey 账户 | `@simplewebauthn/server`，无密码无邮件；解锁云同步 |
| 2c 公共片段库（只读） | 官方策展 cron 配方/正则/配色/计算器预设入库，`/library/*` 页面即 SEO |
| 2d AI 免费档排行榜 | OpenRouter 公开 API 每日快照 → D1；只收有免费档的模型，按免费额度/单价/上下文排序（差异化：白嫖视角，不做 LMArena 复制品） |

**出口标准**：CF Web Analytics 出现真实回访；账户系统上线；AI 排行榜自动运行。

### 阶段 3：变现

| 任务 | 说明 |
|---|---|
| 3a AdSense 复审 | 前提：阶段 1 内容达标 + GSC 真实曝光；重申前删到只剩合规广告位 |
| 3b Affiliate | VPS（Vultr/DO/Hetzner）、AI 工具（20–40% 分成）；植入指南与优惠页；加披露声明页 |
| 3c 数字产品 | 速查表包 / Prompt 库，Gumroad 或 MoR 交付 |
| 3d Pro 订阅 | 去广告、分享永不过期、云同步（登录后）；收款走 LemonSqueezy/Creem（MoR，大陆个人可用） |

**出口标准**：第一笔非 AdSense 收入；AdSense 过审。

### 阶段 4：规模化

- 大众 Kit：Money Kit（复利/贷款/租金 vs 买房）+ Job Kit（薪资谈判/offer 对比）打头
- Steam 优惠（社区源半自动）、VPS 优惠（RSS 解析）
- API + 定价页（cron 解析、JWT 解码等，免费限额 + 付费 key）
- 互动旗舰（regex 填字、每日挑战扩展）——每季度一个
- `npx plobikit` CLI、可嵌入 widget

---

## 四、变现模型总览

| 渠道 | 定位 | 备注 |
|---|---|---|
| Affiliate | **主力** | 开发者/羊毛受众转化率高；一个 VPS 注册 = 数万次广告展示 |
| 数字产品 | 次主力 | 零后端交付，客单 $5–15 |
| Pro 订阅 | 长线 | 依赖账户系统与流量 |
| AdSense | 保底 | 开发者 RPM 低（$1–5）+ adblock 高；内容引擎的副产品 |
| API | 远期 | 有流量后再谈 |

收款：**MoR**（LemonSqueezy / Creem / Paddle，税务全包、可提现大陆）；Stripe 对大陆个人不开放。

---

## 五、技术架构（现状与约定）

```
plobikit.com
├── public/                 # 静态资产（assets 直出，不消耗 Worker 额度）
│   ├── tools/ + cn/tools/  # 17 工具双语页
│   ├── guides/             # 指南
│   ├── js/shareTools.js    # 分享中央注册表（app.js 调用）
│   └── ...（规划：deals/ ai/ library/）
├── worker/index.js         # 动态层：/api/* /s/*（+ 规划 /deals/* /ai/* SSR）
├── db/schema.sql           # D1：shares / contact_messages / rate_counters（+ deals / ai_models / sites）
└── scripts/                # cleanup.mjs / update-sitemap.mjs
```

- **运行时**：Cloudflare Workers 免费档（10 万请求/天）+ D1 + Cron Triggers + R2（规划）
- **前端**：Vanilla JS ES Modules，无构建步骤；分享按钮经 `shareTools.js` 注册表接入
- **SSR 约定**：时效性栏目（deals/ai）用 `run_worker_first` 让 Worker 服务端渲染，保证新鲜度与 SEO
- **明确不用**：VPS、Durable Objects、Queues、自建评论系统、第三方表单/评论嵌入
- **分析**：Cloudflare Web Analytics（免费、无 cookie，符合品牌）

---

## 六、风险与红线

| 风险 | 对策 |
|---|---|
| AdSense 低质判定 | 内容页 40+ 且有真实曝光再复审；无占位广告位；无 MFA 话术 |
| Scaled content 政策 | 配方页可半程序化生成，但介绍段必须人工写、有经验感 |
| 时效内容腐烂 | 优惠/排行必须自动抓取 + 过期自动下架，人工只做精选 |
| 排行榜复制内容嫌疑 | 只做差异化切片（免费档/单价/白嫖视角），注明数据来源 |
| 合规 | affiliate 披露页；隐私政策与实际行为一致（已完成）； giveaways 信息注明来源 |

---

*最后更新：2026-09-04。完成里程碑后请更新第二节快照。*
