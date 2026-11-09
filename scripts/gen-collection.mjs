/**
 * gen-collection.mjs — the curated collection: /collection/ and /cn/collection/.
 *
 * Four pages in two languages from one table. English is the canonical copy;
 * Chinese is the same entries, rewritten rather than machine-translated (a
 * literal translation of "end more arguments than any Stack Overflow thread"
 * reads like a machine did it).
 *
 * Chrome (nav, footer, language switch, hreflang, canonical asset URLs) is
 * emitted roughly here and corrected by normalize-nav afterwards — the same
 * contract every other generator follows.
 *
 * Run: node scripts/gen-collection.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://plobikit.com';
const SITE = join(process.cwd(), 'public');

const CATEGORIES = [
  {
    slug: 'developer-tools',
    count: 11,
    title: {
      en: 'Best Developer Websites (2026 Hand-Picked List) | Plobi-kit',
      zh: '开发者必备网站精选（2026 手工挑选）| Plobi-kit',
    },
    desc: {
      en: 'Eleven genuinely useful browser-based websites for developers: documentation, compatibility tables, in-browser IDEs, whiteboards, image tools, and security checkers — each with an honest review.',
      zh: '11 个开发者真正用得上的浏览器网站：文档、兼容性查询、浏览器内 IDE、白板、图片工具、安全自查，每一条都附一份诚实的评价。',
    },
    h1: { en: 'Best Developer Websites', zh: '开发者必备网站' },
    intro: {
      en: `Browser-based tools a developer actually keeps pinned. The bar for this list: the free
        tier must be genuinely usable, the site must respect its visitors, and it must still work
        today. Here is what made the cut, in no particular order.`,
      zh: `这些是开发者会一直钉在浏览器上的工具。入选门槛只有三条：免费档必须真能用，站点必须尊重访客，
        而且今天打开还得是好的。下面是过了这道门槛的，排名不分先后。`,
    },
    card: {
      en: 'References, sandboxes, and utilities that live in a developer&#39;s browser: documentation, compatibility tables, in-browser IDEs, whiteboards, and security checkers.',
      zh: '待在开发者浏览器里的参考手册、沙箱和杂物间：文档、兼容性表、浏览器内 IDE、白板、安全自查。',
    },
    note: {
      en: `Found this useful? Our own <a href="/" style="color: var(--success-color);">browser toolbox</a>
        covers Base64, cron expressions, regex, image compression and more — entirely client-side,
        same privacy philosophy as every site on this list. Suggestions for this collection:
        <a href="/contact" style="color: var(--success-color);">get in touch</a>.`,
      zh: `觉得有用？我们自己的<a href="/" style="color: var(--success-color);">浏览器工具箱</a>
        覆盖 Base64、cron 表达式、正则、图片压缩等等，全部在客户端跑完，和这份清单里每个站是同一套隐私原则。
        想推荐网站：<a href="/contact" style="color: var(--success-color);">联系我们</a>。`,
    },
    entries: [
      {
        name: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/',
        blurb: {
          en: `The reference for HTML, CSS, and JavaScript, maintained by Mozilla with the web platform community. When documentation conflicts with reality, MDN is the source that gets corrected first. Its compatibility tables at the bottom of every page end more arguments than any Stack Overflow thread.`,
          zh: `HTML、CSS 和 JavaScript 的参考手册，由 Mozilla 和 Web 平台社区共同维护。文档和现实打架的时候，
            先被修正的总是 MDN。每页底部那张兼容性表格，比任何一个 Stack Overflow 帖子都更能终结争论。`,
        },
        best: {
          en: 'looking up the exact behavior of any web platform API.',
          zh: '查某个 Web API 到底怎么表现。',
        },
      },
      {
        name: 'Can I Use',
        url: 'https://caniuse.com/',
        blurb: {
          en: `Browser support tables for every web feature, with usage-percentage sliders so you can decide whether 92% global support is enough for your audience. The fastest way to answer "can I ship this CSS feature yet?" without reading five blog posts.`,
          zh: `每个 Web 特性的浏览器支持表，带用户占比滑块，让你自己判断 92% 的全球支持率对你这批访客够不够。
            「这个 CSS 特性现在能不能上线」，最快的答案在这里，不用翻五篇博客。`,
        },
        best: {
          en: 'deciding whether a new web feature is safe to use in production.',
          zh: '判断一个新特性能不能安全用在生产环境。',
        },
      },
      {
        name: 'web.dev',
        url: 'https://web.dev/',
        blurb: {
          en: `Google's guidance on building fast, resilient websites: Core Web Vitals explanations, performance patterns, and courses that go deeper than a search result. The measurement tooling (Lighthouse) is documented here alongside the reasoning behind each metric.`,
          zh: `Google 关于「把网站做快、做稳」的指南：Core Web Vitals 的解释、性能模式，还有比搜索结果深得多的课程。
            测量工具（Lighthouse）和每个指标背后的理由，写在同一个地方。`,
        },
        best: {
          en: 'making a slow site fast, with methods that age well.',
          zh: '用经得起时间的方法把慢站点做快。',
        },
      },
      {
        name: 'StackBlitz',
        url: 'https://stackblitz.com/',
        blurb: {
          en: `A full Node.js environment running inside the browser via WebContainers — no servers, no sign-up for quick experiments. Spinning up a React or Vite project takes seconds, which makes it the cleanest way to test a bug report or share a runnable example.`,
          zh: `靠 WebContainers 在浏览器里跑完整的 Node.js 环境，不用服务器，随手试也不用注册。
            开一个 React 或 Vite 项目只要几秒——复现一份 bug 报告、分享一个能跑的示例，这是最干净的路子。`,
        },
        best: {
          en: 'instant sandboxed projects and shareable bug reproductions.',
          zh: '开箱即用的沙箱项目，和能发给别人的 bug 复现。',
        },
      },
      {
        name: 'Excalidraw',
        url: 'https://excalidraw.com/',
        blurb: {
          en: `A virtual whiteboard with a hand-drawn look that makes architecture diagrams approachable instead of intimidating. Nothing to configure: open the page, draw boxes and arrows, export. Scene data stays local unless you choose to share a link.`,
          zh: `手绘风格的白板，让架构图变得好下手，而不是先被吓住。没什么要配置的：打开、画框画箭头、导出。
            场景数据留在本地，除非你自己分享链接。`,
        },
        best: {
          en: "architecture sketches and quick diagrams that won't embarrass you in a PR description.",
          zh: '架构草图和快速示意，贴在 PR 描述里也不丢人。',
        },
      },
      {
        name: 'Squoosh',
        url: 'https://squoosh.app/',
        blurb: {
          en: `Google's open-source image compressor. Drag an image in, compare codecs (WebP, AVIF, MozJPEG) side by side with a draggable before/after slider, and export — all processing happens locally in your browser. The same philosophy we build with: your files never leave the device.`,
          zh: `Google 开源的图片压缩器。拖进图片，用可拖动的对比滑块并排比较 WebP、AVIF、MozJPEG，然后导出——
            全部在浏览器本地完成。这也是我们做东西的原则：文件不离开这台设备。`,
        },
        best: {
          en: 'squeezing an image to its minimum size without uploading it anywhere.',
          zh: '把图片压到最小，同时不上传到任何地方。',
        },
      },
      {
        name: 'Photopea',
        url: 'https://www.photopea.com/',
        blurb: {
          en: `A shockingly complete Photoshop clone that runs in a browser tab and opens PSD, XCF, and Sketch files natively. The ad-supported free tier has no meaningful feature lock — layers, masks, and filters all work. When you're on a machine without design software, this is the answer.`,
          zh: `一个完整得有点离谱的 Photoshop 复刻，跑在浏览器标签页里，能直接打开 PSD、XCF 和 Sketch。
            广告支撑的免费版没有实质功能锁，图层、蒙版、滤镜全都能用。手边这台机器没装设计软件时，答案就是它。`,
        },
        best: {
          en: 'editing PSD files on any computer without installing anything.',
          zh: '在任何一台电脑上改 PSD，不用装东西。',
        },
      },
      {
        name: 'tldraw',
        url: 'https://www.tldraw.com/',
        blurb: {
          en: `An infinite canvas drawing tool with unusually good feel — the snapping, smoothing, and selection ergonomics are the benchmark other whiteboards copy. The free web version is generous, and the SDK is open source if you ever want to embed a canvas in your own product.`,
          zh: `无限画布，手感好得反常——吸附、平滑、选择的顺手程度，已经是别的白板在抄的基准。
            网页免费版很慷慨，SDK 开源，哪天想把画布嵌进自己的产品也行。`,
        },
        best: {
          en: 'freeform brainstorming where precise shapes matter less than speed.',
          zh: '重在快、不重在精确的自由头脑风暴。',
        },
      },
      {
        name: 'Have I Been Pwned?',
        url: 'https://haveibeenpwned.com/',
        blurb: {
          en: `Troy Hunt's breach database: enter an email address and see which known data breaches exposed it. It also offers a password checker that hashes locally (only the first five characters of the SHA-1 hash are sent, never the password itself). If a password you reuse appears here, change it everywhere today.`,
          zh: `Troy Hunt 的泄露数据库：输入邮箱，看哪些已知的泄露事件波及过它。它还带一个在本地做哈希的密码检查
            （只发送 SHA-1 哈希的前五个字符，从不发送密码本身）。如果你复用的某个密码出现在这里，今天就把它全改掉。`,
        },
        best: {
          en: 'checking whether your accounts or passwords are already compromised.',
          zh: '确认账号或密码是不是已经被泄露。',
        },
      },
      {
        name: 'Privacy Guides',
        url: 'https://www.privacyguides.org/',
        blurb: {
          en: `Community-maintained recommendations for private software: browsers, messengers, VPNs, email providers, with the reasoning and trade-offs spelled out rather than just a ranking. It's the reference we point people to when they ask which tools actually respect them.`,
          zh: `社区维护的隐私软件推荐：浏览器、通讯工具、VPN、邮箱服务商。它写清理由和取舍，而不只是给个排名。
            有人问「哪些工具真的尊重用户」，我们就指到这里。`,
        },
        best: {
          en: 'choosing privacy-respecting software without wading through marketing.',
          zh: '不读营销文案，挑出尊重隐私的软件。',
        },
      },
      {
        name: 'Wayback Machine',
        url: 'https://web.archive.org/',
        blurb: {
          en: `The Internet Archive's time machine: billions of saved snapshots of the web, going back decades. A deleted documentation page, a redesigned product's old pricing, a source you cited that vanished — if it existed publicly, there's a good chance a snapshot survives here.`,
          zh: `互联网档案馆的时光机：几十亿份网页快照，往回好几十年。被删掉的文档页、改版前的旧定价、
            你引用过却已经消失的来源——只要它曾经公开存在，这里很可能还留着一份。`,
        },
        best: {
          en: 'recovering dead pages and checking what a website used to look like.',
          zh: '找回死掉的页面，看看一个网站以前长什么样。',
        },
      },
    ],
  },
  {
    slug: 'design-resources',
    count: 8,
    title: {
      en: 'Best Free Design Resources (2026 Hand-Picked List) | Plobi-kit',
      zh: '免费设计资源精选（2026 手工挑选）| Plobi-kit',
    },
    desc: {
      en: "Eight genuinely free design resources worth bookmarking: fonts, icons, stock photos, animation libraries, and inspiration galleries — each reviewed in plain language with who it's best for.",
      zh: '8 份真正免费、值得收藏的设计资源：字体、图标、图库、动效库和灵感画廊，每一条都用平实的语言写清它做什么、适合谁。',
    },
    h1: { en: 'Best Free Design Resources', zh: '免费设计资源' },
    intro: {
      en: `Design resources are where "free" most often means "free until you look closely." Every
        site below offers real professional value without a subscription — either fully free,
        open source, or a free tier that stands on its own. Checked and described by hand.`,
      zh: `设计资源是「免费」最容易被注水的地方。下面每个站点都在不收订阅费的前提下提供真实的专业价值——
        要么完全免费，要么开源，要么免费档自己站得住。逐条人工复核并写清。`,
    },
    card: {
      en: 'Fonts, icons, stock imagery, animation libraries, and inspiration galleries that professional designers keep open all day.',
      zh: '专业设计师整天开着的那些：字体、图标、图库、动效库和灵感画廊。',
    },
    note: {
      en: `Working with colors? Our <a href="/tools/colorpalette" style="color: var(--success-color);">color palette generator</a> and
        <a href="/tools/glassmorphism" style="color: var(--success-color);">glassmorphism generator</a> run
        entirely in your browser — pair them with Realtime Colors for a full design-to-code pass.
        Missing a great resource? <a href="/contact" style="color: var(--success-color);">Tell us</a>.`,
      zh: `正在调颜色？我们自己的<a href="/tools/colorpalette" style="color: var(--success-color);">配色生成器</a>和
        <a href="/tools/glassmorphism" style="color: var(--success-color);">毛玻璃生成器</a>完全跑在浏览器里，
        和 Realtime Colors 配着用，正好走完从设计到代码这一遍。缺了什么好资源？
        <a href="/contact" style="color: var(--success-color);">告诉我们</a>。`,
    },
    entries: [
      {
        name: 'Figma',
        url: 'https://www.figma.com/',
        blurb: {
          en: `The industry-standard interface design tool, running entirely in the browser. The free tier allows three project files and unlimited personal drafts, which covers students, freelancers starting out, and most one-off design work. Real-time collaboration is built in rather than bolted on.`,
          zh: `行业标准的界面设计工具，整个跑在浏览器里。免费版给三个项目文件、个人草稿不限量，
            学生、刚起步的自由职业者、以及大多数一次性的设计活都够用。实时协作是原生功能，不是后来补上去的。`,
        },
        best: {
          en: 'UI design and prototypes with zero installation.',
          zh: '零安装做 UI 设计和原型。',
        },
      },
      {
        name: 'Google Fonts',
        url: 'https://fonts.google.com/',
        blurb: {
          en: `Over a thousand open-source typefaces, all licensed for commercial use with zero attribution required. Pairing suggestions, live type testers, and a one-line CSS embed make it the default first stop for web typography — Inter, the font this site uses, comes from here.`,
          zh: `一千多款开源字体，全部允许商用、不需要署名。搭配建议、在线试排、一行 CSS 引入，
            让它成为网页排版的第一站——本站正文用的 Inter 就来自这里。`,
        },
        best: {
          en: "safe, high-quality web fonts you'll never owe anyone money for.",
          zh: '安全、好看的网页字体，永远不会让你欠谁钱。',
        },
      },
      {
        name: 'Fontshare',
        url: 'https://www.fontshare.com/',
        blurb: {
          en: `The Indian Type Foundry's free font service — professionally designed families (Satoshi, General Sans, Clash Display) that look like paid work, free for commercial use. Quality is noticeably above the average "free font" site, and the catalog is small enough to browse entirely.`,
          zh: `印度字厂（Indian Type Foundry）的免费字体服务：Satoshi、General Sans、Clash Display 这些家族
            看着像付费作品，商用免费。质量明显高于一般的「免费字体站」，目录也小到可以整个看完。`,
        },
        best: {
          en: "display and branding fonts that don't look like everyone else's Google Fonts.",
          zh: '不长得像别人家 Google Fonts 的标题字和品牌字。',
        },
      },
      {
        name: 'Unsplash',
        url: 'https://unsplash.com/',
        blurb: {
          en: `High-resolution photography free for commercial use under a simple license (no selling unaltered copies). The collection is curated, which is what separates it from the keyword-stuffed free-stock sites — searching "workspace" returns photos you'd actually publish.`,
          zh: `高分辨率摄影，按一份简单许可免费商用（不能原样转卖）。它是被策展过的，这一点把它和那些
            堆满关键词的免费图库区分开——搜「workspace」，出来的照片你真的会发出去。`,
        },
        best: {
          en: 'hero images and blog photos without licensing anxiety.',
          zh: '不用为授权操心的大图头和博客配图。',
        },
      },
      {
        name: 'Lucide',
        url: 'https://lucide.dev/',
        blurb: {
          en: `An open-source icon library (a friendly Fork of Feather) with a consistent stroke style and packages for React, Vue, Svelte, and plain SVG. Icons ship as real components with adjustable size and stroke width, which keeps icon usage clean in any framework.`,
          zh: `开源图标库（Feather 的一个友好分支），笔触风格统一，提供 React、Vue、Svelte 和纯 SVG 包。
            图标以真正的组件交付，尺寸和线宽可调，在任何框架里用起来都干净。`,
        },
        best: {
          en: 'interface icons that look coherent across an entire product.',
          zh: '让整个产品看起来风格一致的界面图标。',
        },
      },
      {
        name: 'LottieFiles',
        url: 'https://lottiefiles.com/',
        blurb: {
          en: `The hub for Lottie animations — lightweight JSON-based motion graphics that scale crisply and weigh kilobytes instead of megabytes. Free tier includes thousands of ready-made animations plus a web player to preview and tweak speed and colors before exporting.`,
          zh: `Lottie 动画的集散地——基于 JSON 的轻量动效，放大依然锐利，体积是 KB 而不是 MB。
            免费版包含上千个现成动画，还有个网页播放器可以先预览、调速度和颜色，再导出。`,
        },
        best: {
          en: 'adding polished micro-animations without hiring a motion designer.',
          zh: '不请动效设计师也能加上的精致微动效。',
        },
      },
      {
        name: 'Realtime Colors',
        url: 'https://www.realtimecolors.com/',
        blurb: {
          en: `Preview color palettes and font pairings on a realistic landing page instead of flat swatches. Paste your palette, watch a full demo site recolor live, and export the CSS variables. It catches the "looked good in the swatch, terrible on the page" problem before your users do.`,
          zh: `在真实的落地页上预览配色和字体搭配，而不是看一块块色卡。粘进你的色板，看整个演示站实时换色，
            然后导出 CSS 变量。「色卡上好看、页面上难看」这个问题，能在用户发现之前被抓住。`,
        },
        best: {
          en: 'validating a palette in context within five minutes.',
          zh: '五分钟内验证一套配色在上下文里成不成立。',
        },
      },
      {
        name: 'Awwwards',
        url: 'https://www.awwwards.com/',
        blurb: {
          en: `A juried gallery of the web's most ambitious sites. You're not copying these — you're calibrating your sense of what's possible: motion, typography, and layout ideas that trickle down into mainstream design a year later. Browsing is free; submissions cost money.`,
          zh: `一个评审制的画廊，收的是全网最有野心的站点。你不是在抄它们，而是在校准自己对「能做到什么」的判断：
            动效、排版、布局的想法，一年后会流进主流设计。浏览免费，投稿收费。`,
        },
        best: {
          en: 'inspiration that raises your bar instead of echoing your habits.',
          zh: '抬高你上限的灵感，而不是重复你习惯的灵感。',
        },
      },
    ],
  },
  {
    slug: 'platforms',
    count: 12,
    title: {
      en: 'Best Free Developer Platforms &amp; Hosting (2026 Hand-Picked List) | Plobi-kit',
      zh: '免费开发者平台与托管精选（2026 手工挑选）| Plobi-kit',
    },
    desc: {
      en: 'Twelve mainstream platforms with genuinely free tiers: GitHub, Cloudflare Pages, Vercel, Supabase, Hugging Face and more — where to build, host, and ship without paying. Each entry reviewed in plain language.',
      zh: '12 个免费档真能用的主流平台：GitHub、Cloudflare Pages、Vercel、Supabase、Hugging Face 等等——代码托管在哪、站点发到哪、怎么不花钱把东西发出去。每条都附平实的评价。',
    },
    h1: {
      en: 'Best Free Developer Platforms &amp; Hosting',
      zh: '免费开发者平台与托管',
    },
    intro: {
      en: `The platforms this very site runs on, plus the rest of the mainstream free tier —
        where to host code, ship websites, store data, and share demos without a credit card.
        The bar: the free tier must be genuinely usable for real projects, not a timed trial.
        We run on two of these ourselves, so the reviews come from experience.`,
      zh: `这个网站自己就跑在其中的平台上，加上主流免费档的其余部分——代码托管在哪、站点发到哪、
        数据存在哪、演示怎么分享，全都不用信用卡。门槛是：免费档对真实项目得真的够用，而不是限时试用。
        其中两个我们自己在用，所以评价来自经验。`,
    },
    card: {
      en: 'The mainstream free tier for building anything: GitHub, Cloudflare, Vercel, Supabase and friends — where to host code, ship sites, and store data without a credit card.',
      zh: '想做什么都能用的主流免费档：GitHub、Cloudflare、Vercel、Supabase 这一批——代码放哪、站点发到哪、数据存哪，不用信用卡。',
    },
    note: {
      en: `Building with these? Our <a href="/tools/" style="color: var(--success-color);">browser toolbox</a> pairs well with a
        GitHub + Cloudflare workflow — and our <a href="/deals" style="color: var(--success-color);">Deals</a> page tracks free-tier
        promotions worth grabbing. Know a platform that belongs here? <a href="/contact" style="color: var(--success-color);">Tell us</a>.`,
      zh: `正在用这些搭东西？我们的<a href="/tools/" style="color: var(--success-color);">浏览器工具箱</a>和
        GitHub + Cloudflare 这套流程很搭；<a href="/deals" style="color: var(--success-color);">优惠活动</a>页会盯着
        值得抢的免费额度活动。还知道哪个平台该进来？<a href="/contact" style="color: var(--success-color);">告诉我们</a>。`,
    },
    entries: [
      {
        name: 'GitHub',
        url: 'https://github.com/',
        blurb: {
          en: `The default home of open source and most private code. Unlimited public and private repositories, free Actions CI minutes every month, GitHub Pages for static hosting, and package storage. The ecosystem integrations (Dependabot, code scanning, Projects) make the free tier feel like the product, not a demo.`,
          zh: `开源和大多数私有代码的默认去处。公开与私有仓库不限量，每月有免费的 Actions CI 额度，
            GitHub Pages 做静态托管，还有包存储。Dependabot、代码扫描、Projects 这些生态集成，
            让免费版像产品本身，而不是试用版。`,
        },
        best: {
          en: 'version control, collaboration, CI/CD, and free static hosting via Pages.',
          zh: '版本控制、协作、CI/CD，以及用 Pages 免费托管静态站。',
        },
      },
      {
        name: 'Cloudflare Pages &amp; Workers',
        url: 'https://pages.cloudflare.com/',
        blurb: {
          en: `Static sites and serverless functions on Cloudflare's edge network. The free tier is absurdly generous — unlimited bandwidth on Pages, 100,000 Worker requests per day, free D1 databases, KV, and R2 storage. This website runs on exactly this stack; the review is lived experience.`,
          zh: `在 Cloudflare 的边缘网络上跑静态站点和 Serverless 函数。免费额度大得离谱：Pages 不限带宽，
            Workers 每天 10 万次请求，D1 数据库、KV、R2 存储都免费。这个网站就跑在这套东西上，
            评价来自日常使用，不是看文档写的。`,
        },
        best: {
          en: 'shipping fast sites and full apps on an edge network for free.',
          zh: '在边缘网络上免费上线快站点和完整应用。',
        },
      },
      {
        name: 'Vercel',
        url: 'https://vercel.com/',
        blurb: {
          en: `The smoothest frontend deployment experience: push to Git, get a preview URL for every branch. Excellent Next.js integration (it is Next.js's parent company), free hobby tier with generous bandwidth, and serverless functions included. Fair-use limits apply, but hobby projects rarely touch them.`,
          zh: `最顺的前端部署体验：推到 Git，每个分支给一个预览 URL。Next.js 集成极好（它就是 Next.js 的母公司），
            免费 hobby 档带宽慷慨，还含 Serverless 函数。有合理使用限制，但 hobby 项目基本碰不到。`,
        },
        best: {
          en: 'deploying Next.js and modern frontend apps with zero configuration.',
          zh: '零配置部署 Next.js 和现代前端应用。',
        },
      },
      {
        name: 'Netlify',
        url: 'https://www.netlify.com/',
        blurb: {
          en: `Vercel's closest peer for static and Jamstack hosting: Git-based deploys, instant rollbacks, split testing, and free forms handling on the starter plan. Its build plugins ecosystem and the generous free tier make it a solid second home for frontend projects.`,
          zh: `Vercel 最接近的同侪，做静态和 Jamstack 托管：基于 Git 的部署、即时回滚、分流测试，
            入门档还免费带表单处理。构建插件生态和慷慨的免费额度，让它成为前端项目很稳的第二个家。`,
        },
        best: {
          en: 'Jamstack sites with build previews and form handling.',
          zh: '需要构建预览和表单处理的 Jamstack 站点。',
        },
      },
      {
        name: 'Supabase',
        url: 'https://supabase.com/',
        blurb: {
          en: `An open-source Firebase alternative built on real Postgres: database, authentication, instant APIs, storage, and realtime subscriptions. The free tier includes two projects with 500 MB of database — enough to run a genuine side project, not just a toy.`,
          zh: `基于真 Postgres 的开源 Firebase 替代品：数据库、鉴权、即时 API、存储、实时订阅。
            免费档给两个项目、500MB 数据库——够跑一个真正的副业项目，不只是玩具。`,
        },
        best: {
          en: 'a real backend (Postgres + auth) without managing servers.',
          zh: '不自己管服务器，拿到真正的后端（Postgres + 鉴权）。',
        },
      },
      {
        name: 'CodePen',
        url: 'https://codepen.io/',
        blurb: {
          en: `The social frontend playground: write HTML/CSS/JS in three panes and see results live. Free unlimited public pens, which double as shareable demos and teaching material. The community's "Picked Pens" are also a great way to see what CSS can do.`,
          zh: `社交化的前端游乐场：三个窗格写 HTML/CSS/JS，实时看结果。公开 pen 不限量，
            既是可分享的演示，也是现成的教学素材。社区里的 Picked Pens 也是看 CSS 能做什么的好地方。`,
        },
        best: {
          en: 'quick front-end experiments and shareable demos.',
          zh: '快速的前端试验和能发给别人的演示。',
        },
      },
      {
        name: 'CodeSandbox',
        url: 'https://codesandbox.io/',
        blurb: {
          en: `A full development environment in the browser — not just a playground. Real npm installs, DevServer for React/Vue/etc., and container-based sandboxes that mirror a local setup. Free tier covers public sandboxes with generous hours.`,
          zh: `浏览器里的完整开发环境，不只是游乐场。真的跑 npm install，React、Vue 这些有 DevServer，
            容器沙箱尽量贴近本地环境。免费档覆盖公开沙箱，时长也给得够。`,
        },
        best: {
          en: 'prototyping full framework apps without touching your machine.',
          zh: '不碰本机也能原型一个完整框架应用。',
        },
      },
      {
        name: 'Stack Overflow',
        url: 'https://stackoverflow.com/',
        blurb: {
          en: `Sixteen years of crowdsourced programming answers. Most searches end here before anywhere else, and the voting system usually surfaces the correct answer first. Asking is free; reading is unlimited; the real skill is searching it well (include the error message, not your feelings about it).`,
          zh: `十六年的众包编程答案。大多数搜索在到别处之前就结束在这里，投票机制通常把正确答案顶到最前。
            提问免费，阅读不限量；真正的技巧是搜得好——把报错信息放进去，而不是你对它的情绪。`,
        },
        best: {
          en: 'the fastest route from error message to fix.',
          zh: '从报错信息到修好，最快的一条路。',
        },
      },
      {
        name: 'Hugging Face',
        url: 'https://huggingface.co/',
        blurb: {
          en: `The GitHub of machine learning: hundreds of thousands of open models, datasets, and Spaces (free hosted demos you can deploy from a repo). Free accounts can host models and demo apps — the easiest way to put an AI experiment online.`,
          zh: `机器学习界的 GitHub：几十万个开放模型、数据集和 Spaces（从仓库直接部署的免费托管演示）。
            免费账号就能托管模型和演示应用，是把一个 AI 实验放到线上最省事的办法。`,
        },
        best: {
          en: 'hosting and discovering open AI models with free demo deployment.',
          zh: '发现和托管开放 AI 模型，演示还能免费部署。',
        },
      },
      {
        name: 'jsDelivr',
        url: 'https://www.jsdelivr.com/',
        blurb: {
          en: `A free, production-grade CDN for npm packages and GitHub files — no configuration, no API keys, just a URL. Loads any package version through a global multi-CDN network. Also handy as a permanent hosting trick for files committed to a public GitHub repo.`,
          zh: `给 npm 包和 GitHub 文件用的免费生产级 CDN——不用配置，不用 API key，一个 URL 就够。
            任何包版本都通过全球多 CDN 网络加载。把文件提交到公开 GitHub 仓库再当永久外链用，也很好使。`,
        },
        best: {
          en: 'loading any npm package or GitHub file via a fast global CDN, free forever.',
          zh: '用快速的全球 CDN 加载任意 npm 包或 GitHub 文件，永久免费。',
        },
      },
      {
        name: 'Regex101',
        url: 'https://regex101.com/',
        blurb: {
          en: `The reference regex debugger: live match highlighting, per-token explanation of what every symbol does, and a step-by-step match debugger that shows exactly where backtracking explodes. Supports PCRE, JavaScript, Python, and Go flavors. (We built our own private regex tester too — but Regex101's explanation engine is genuinely excellent.)`,
          zh: `正则调试的参考实现：实时高亮匹配，逐个 token 解释每个符号在做什么，还有单步调试器，
            能看清回溯是在哪一步炸掉的。支持 PCRE、JavaScript、Python 和 Go 方言。
            （我们自己也做了本地正则测试器，但 Regex101 的解释引擎确实出色。）`,
        },
        best: {
          en: 'understanding and debugging a regex token by token.',
          zh: '一个 token 一个 token 地看懂、调通正则。',
        },
      },
      {
        name: 'GitLab',
        url: 'https://about.gitlab.com/',
        blurb: {
          en: `The all-in-one DevOps platform: repos, CI/CD, container registry, and issue tracking in one place. Its free tier is the strongest among code hosts for private automation — 400 CI compute minutes monthly and unlimited private collaborators on the free plan.`,
          zh: `一体化的 DevOps 平台：仓库、CI/CD、容器镜像仓库、issue 跟踪都在一处。在代码托管里，
            它的免费档对私有自动化最友好——每月 400 分钟 CI 计算时长，免费计划里私有协作成员不限。`,
        },
        best: {
          en: 'teams wanting built-in CI/CD without third-party wiring.',
          zh: '想要自带 CI/CD、不接第三方的团队。',
        },
      },
    ],
  },
];

const INDEX = {
  title: {
    en: 'Quality Website Collection — Hand-Picked &amp; Reviewed | Plobi-kit',
    zh: '优质网站精选 — 手工挑选与评测 | Plobi-kit',
  },
  desc: {
    en: 'A hand-picked collection of genuinely useful websites: developer tools, design resources, free platforms &amp; hosting, and utilities that actually deserve a bookmark. Every entry is reviewed and described in plain language.',
    zh: '一份手工维护的优质网站清单：开发者工具、设计资源、免费平台与托管，以及真正值得收藏的小工具。每一条都经过复核，用平实的语言写清它做什么、为什么好。',
  },
  h1: { en: 'Quality Website Collection', zh: '优质网站精选' },
  intro: {
    en: `The internet has millions of tool sites; maybe a hundred deserve a permanent bookmark.
        This collection is our hand-maintained shortlist: websites we actually use, each with an
        honest description of what it does, why it is good, and who it is for. No SEO filler,
        no affiliate rankings — if an entry stops being good, it gets removed.`,
    zh: `互联网上有几百万个工具站，值得永久收藏的大概一百个。这份合集是我们手工维护的短名单：
        真正在用到的网站，每一条都诚实写清它做什么、好在哪、给谁用。没有 SEO 注水，没有联盟排名——
        某一条变差了，就会被删掉。`,
  },
  criteriaTitle: { en: 'What gets in', zh: '什么能进来' },
  criteria: [
    {
      en: '<strong>Works in the browser</strong> — no install required for the core use case.',
      zh: '<strong>在浏览器里能用</strong>——核心用途不需要安装任何东西。',
    },
    {
      en: '<strong>Genuinely useful for free</strong> — the free tier must stand on its own.',
      zh: '<strong>免费就真的够用</strong>——免费档必须自己站得住。',
    },
    {
      en: '<strong>Respectable privacy posture</strong> — no dark patterns, no data resale.',
      zh: '<strong>隐私上说得过去</strong>——没有暗黑模式，不转卖数据。',
    },
    {
      en: '<strong>Actually maintained</strong> — abandoned projects do not survive a re-review.',
      zh: '<strong>还在维护</strong>——弃坑的项目撑不过一次复核。',
    },
  ],
  browseTitle: { en: 'Browse by category', zh: '按类别浏览' },
  countUnit: { en: 'websites', zh: '个站点' },
  noteTitle: { en: 'How this list is maintained:', zh: '这份清单怎么维护：' },
  note: {
    en: `entries are re-checked periodically. When a site
        degrades — paywalls its core feature, adds aggressive tracking, or stops working — it is
        removed with a note. Suggestions are welcome via our
        <a href="/contact" style="color: var(--success-color);">contact page</a>.
        If you like browser-based tools, our own
        <a href="/" style="color: var(--success-color);">toolbox</a> runs 100% locally.`,
    zh: `条目会定期复核。一个站点变差了——把核心功能关进付费墙、加上激进的追踪、或者干脆不能用了——
        就会被移除，并留一句说明。想推荐网站，欢迎来<a href="/contact" style="color: var(--success-color);">联系我们</a>。
        如果你喜欢浏览器里跑的工具，我们自己的<a href="/" style="color: var(--success-color);">工具箱</a> 100% 在本地跑。`,
  },
};

// Language codes: 'en' and 'zh' name the copy in the data above; 'zh' is served
// under the /cn/ URL prefix, so path building maps one to the other.
const T = {
  back: { en: '&larr; Collection', zh: '&larr; 精选合集' },
  bestFor: { en: 'Best for:', zh: '适合：' },
  copyright: { en: 'All rights reserved.', zh: '保留所有权利。' },
};

/**
 * Re-flow an authored multi-line string.
 *
 * English: HTML collapses the newline to one space, so keep the line breaks —
 * the source stays readable instead of one 900-character line per paragraph.
 *
 * Chinese: a newline between two CJK glyphs renders as a real gap, so the lines
 * have to be glued together. Only a boundary that touches ASCII (a Latin word,
 * a number, a closing tag) gets a space, which is also where Chinese typography
 * wants one.
 */
const ASCII_EDGE = /[A-Za-z0-9]/;
const flat = (s, lang) => {
  const lines = String(s).split('\n').map((line) => line.trim()).filter(Boolean);
  if (lang !== 'zh') return lines.join('\n        ');
  return lines.reduce((out, line) => {
    if (!out) return line;
    const a = out[out.length - 1];
    const b = line[0];
    return out + (ASCII_EDGE.test(a) || ASCII_EDGE.test(b) ? ' ' : '') + line;
  }, '');
};

const langPath = (lang, slug) => {
  const prefix = lang === 'zh' ? '/cn' : '';
  return slug === 'index' ? `${prefix}/collection/` : `${prefix}/collection/${slug}`;
};

function shell({ lang, slug, title, desc, main }) {
  const canonical = ORIGIN + langPath(lang, slug);
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta name="google-adsense-account" content="ca-pub-5108296372072915">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="stylesheet" href="/styles.css">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#fafafa">
  <link rel="canonical" href="${canonical}">
  <!-- Google AdSense Verification Code -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5108296372072915" crossorigin="anonymous"></script>
</head>
<body>

  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <div class="logo">
        <span class="logo-icon" style="background:var(--success-color);">P</span>
        <span id="txt-logo-name">Plobi-kit</span>
      </div>
      <nav class="nav-links"></nav>
      <div class="controls"></div>
    </header>

    <!-- Top Ads Banner -->
    <div class="ad-container ad-banner-hub" id="adsense-top-banner">
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-5108296372072915"
           data-ad-slot="7256193048"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>

    <!-- Main Content -->
    <main style="max-width: 800px; margin: 0 auto; margin-bottom: 40px;">
${main}
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-nav"></div>
      <div class="copyright" id="nav-footer-copy">
        &copy; 2026 Plobi. ${T.copyright[lang]}
      </div>
    </footer>
  </div>

  <!-- Register Service Worker for PWA -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Service Worker registered successfully.', reg))
          .catch(err => console.log('Service Worker registration failed.', err));
      });
    }
  </script>
</body>
</html>
`;
}

function indexPage(lang) {
  const cards = CATEGORIES.map((cat) => `        <a href="${langPath(lang, cat.slug)}" style="text-decoration: none;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; height: 100%; display: flex; flex-direction: column;">
            <h4 style="color: var(--text-main); font-size: 17px; margin-bottom: 8px;">${cat.h1[lang]}</h4>
            <p style="font-size: 13px; color: var(--text-muted); line-height: 1.7;">${flat(cat.card[lang], lang)}</p>
            <p style="font-size: 13px; color: var(--success-color); font-weight: 600; margin-top: auto; padding-top: 14px;">${cat.count} ${INDEX.countUnit[lang]} &rarr;</p>
          </div>
        </a>`).join('\n');

  const criteria = INDEX.criteria.map((c) => `        <li>${flat(c[lang], lang)}</li>`).join('\n');

  const main = `      <h1 style="font-size: 28px; margin-bottom: 16px; letter-spacing: -0.5px; color: var(--text-main);">${INDEX.h1[lang]}</h1>
      <p style="font-size: 15px; color: var(--text-muted); line-height: 1.8; margin-bottom: 32px;">
        ${flat(INDEX.intro[lang], lang)}
      </p>

      <h3 style="color: var(--text-main); font-size: 18px; margin: 28px 0 12px 0;">${INDEX.criteriaTitle[lang]}</h3>
      <ul style="padding-left: 20px; margin-bottom: 32px; font-size: 14px; color: var(--text-muted); line-height: 2;">
${criteria}
      </ul>

      <h3 style="color: var(--text-main); font-size: 18px; margin: 28px 0 12px 0;">${INDEX.browseTitle[lang]}</h3>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 40px;">
${cards}
      </div>

      <div style="font-size: 13px; color: var(--text-muted); background: var(--accent-light); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px 20px; line-height: 1.8;">
        <strong>${INDEX.noteTitle[lang]}</strong>${lang === 'zh' ? '' : ' '}${flat(INDEX.note[lang], lang)}
      </div>`;

  return shell({
    lang,
    slug: 'index',
    title: INDEX.title[lang],
    desc: INDEX.desc[lang],
    main,
  });
}

function categoryPage(cat, lang) {
  const articles = cat.entries.map((entry) => `      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 20px; color: var(--text-main); margin-bottom: 8px;"><a href="${entry.url}" target="_blank" rel="noopener" style="color: var(--success-color);">${entry.name}</a></h2>
        <p style="font-size: 14px; color: var(--text-muted); line-height: 1.8;">${flat(entry.blurb[lang], lang)}</p>
        <p style="font-size: 13px; color: var(--text-muted);"><strong>${T.bestFor[lang]}</strong>${lang === 'zh' ? '' : ' '}${flat(entry.best[lang], lang)}</p>
      </article>`).join('\n\n');

  const main = `      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;"><a href="${langPath(lang, 'index')}" style="color: var(--success-color);">${T.back[lang]}</a></p>
      <h1 style="font-size: 28px; margin-bottom: 16px; letter-spacing: -0.5px; color: var(--text-main);">${cat.h1[lang]}</h1>
      <p style="font-size: 15px; color: var(--text-muted); line-height: 1.8; margin-bottom: 32px;">
        ${flat(cat.intro[lang], lang)}
      </p>

${articles}

      <div style="font-size: 13px; color: var(--text-muted); background: var(--accent-light); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px 20px; line-height: 1.8;">
        ${flat(cat.note[lang], lang)}
      </div>`;

  return shell({
    lang,
    slug: cat.slug,
    title: cat.title[lang],
    desc: cat.desc[lang],
    main,
  });
}

const targets = [];
for (const lang of ['en', 'zh']) {
  const dir = lang === 'zh' ? join(SITE, 'cn', 'collection') : join(SITE, 'collection');
  mkdirSync(dir, { recursive: true });
  targets.push([join(dir, 'index.html'), indexPage(lang)]);
  for (const cat of CATEGORIES) {
    targets.push([join(dir, `${cat.slug}.html`), categoryPage(cat, lang)]);
  }
}

for (const [file, html] of targets) writeFileSync(file, html, 'utf8');

console.log(`collection: ${targets.length} page(s) generated (${CATEGORIES.length * 2} category pages + 2 hubs, en + zh)`);
