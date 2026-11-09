/**
 * Cheat-sheet page generator (Stage 1: content engine).
 *
 * The shared page template lives here once; sheet content lives in the
 * SHEETS table below. Output is committed static HTML under
 * public/cheatsheets/ — add a sheet by adding an entry and re-running.
 *
 * Run: node scripts/gen-cheatsheets.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { CRON_RECIPES, GIT_RECIPES } from './gen-recipes.mjs';

const OUT = join(process.cwd(), 'public', 'cheatsheets');
const OUT_CN = join(process.cwd(), 'public', 'cn', 'cheatsheets');
mkdirSync(OUT, { recursive: true });

const SHEETS = [
  {
    slug: 'cron',
    icon: '⏰',
    title: 'Cron Expression Cheat Sheet',
    metaDesc: 'Cron expressions on one page: the five fields, special characters, and the most-copied schedules (every 5 minutes, weekdays at 9am, first of the month). Pairs with our visual cron editor.',
    intro: 'A cron expression has five space-separated fields. Together they define every moment a scheduled job fires.',
    tables: [
      {
        caption: 'The five fields',
        headers: ['Field', 'Allowed values', 'Special characters'],
        rows: [
          ['Minute', '0–59', '* , - /'],
          ['Hour', '0–23', '* , - /'],
          ['Day of month', '1–31', '* , - / ? L W'],
          ['Month', '1–12 or JAN–DEC', '* , - /'],
          ['Day of week', '0–7 (0 and 7 = Sunday) or SUN–SAT', '* , - / ? L #'],
        ],
      },
      {
        caption: 'Special characters',
        headers: ['Char', 'Meaning', 'Example'],
        rows: [
          ['*', 'Every allowed value', '* * * * * — every minute'],
          [',', 'Value list separator', '0 8,20 * * * — 8:00 and 20:00 daily'],
          ['-', 'Range', '0 9 * * 1-5 — 9:00 on weekdays'],
          ['/', 'Step within a range', '*/10 * * * * — every 10 minutes'],
          ['L', 'Last day (of month/week)', '0 0 L * * — last day of the month'],
          ['#', 'Nth weekday of the month', '0 0 * * 1#1 — first Monday of the month'],
        ],
      },
      {
        caption: 'The schedules everyone copies',
        headers: ['Expression', 'Means'],
        rows: [
          ['* * * * *', 'Every minute — <a href="cron-every-minute">recipe</a>'],
          ['*/5 * * * *', 'Every 5 minutes — <a href="cron-every-5-minutes">recipe</a>'],
          ['*/10 * * * *', 'Every 10 minutes — <a href="cron-every-10-minutes">recipe</a>'],
          ['*/15 * * * *', 'Every 15 minutes — <a href="cron-every-15-minutes">recipe</a>'],
          ['*/30 * * * *', 'Every 30 minutes — <a href="cron-every-30-minutes">recipe</a>'],
          ['0 * * * *', 'Every hour, on the hour — <a href="cron-every-hour">recipe</a>'],
          ['0 0 * * *', 'Midnight every day — <a href="cron-daily-midnight">recipe</a>'],
          ['0 9 * * 1-5', '9:00 AM, Monday to Friday — <a href="cron-every-weekday-9am">recipe</a>'],
          ['0 10 * * 6,0', '10:00 AM, weekends only — <a href="cron-weekends-only">recipe</a>'],
          ['0 0 1 * *', 'Midnight on the 1st of every month — <a href="cron-first-day-of-month">recipe</a>'],
          ['59 23 L * *', '23:59 on the last day of the month — <a href="cron-last-day-of-month">recipe</a>'],
          ['30 2 * * 0', '2:30 AM every Sunday'],
          ['0 0 1 1 *', 'Midnight on January 1st (yearly)'],
        ],
      },
    ],
    faq: [
      ['Which timezone does cron use?', 'The system timezone of the machine running crontab — usually UTC on servers. Cloud schedulers (GitHub Actions, Vercel) are UTC unless configured otherwise, which is the single most common cause of "my job ran at the wrong time".'],
      ['Is Sunday 0 or 7?', 'Both, in most implementations. That is why 0 and 7 are listed as valid — but mixing them in ranges (6-7 vs 6-0) produces different days, so pick one convention and stick to it.'],
      ['Why did */5 in the day-of-month field surprise me?', 'Steps restart at the field minimum. */5 in day-of-month fires on the 1st, 6th, 11th… — not "every 5 days from today".'],
    ],
    tool: { href: '../tools/cron.html', label: 'Build it visually in the Cron Expression Editor' },
  },

  {
    slug: 'git',
    icon: '💻',
    title: 'Git Commands Cheat Sheet',
    metaDesc: 'The Git commands you actually use: daily workflow, undoing commits, branches, stash, and history — explained in one line each. Pairs with our interactive Git command builder.',
    intro: 'The commands that cover 95% of real Git usage, grouped by what you are trying to do.',
    tables: [
      {
        caption: 'Everyday workflow',
        headers: ['Command', 'What it does'],
        rows: [
          ['git status', 'Show changed/staged files and branch state'],
          ['git add <file> | .', 'Stage a file (or everything) for the next commit'],
          ['git commit -m "msg"', 'Commit staged changes'],
          ['git pull --rebase', 'Fetch remote and replay your commits on top'],
          ['git push origin <branch>', 'Publish local commits to the remote branch'],
          ['git log --oneline -10', 'Compact history of the last 10 commits'],
          ['git diff --staged', 'Show staged changes not yet committed'],
        ],
      },
      {
        caption: 'Undoing things',
        headers: ['Command', 'What it does'],
        rows: [
          ['git restore <file>', 'Discard uncommitted changes in a file'],
          ['git restore --staged <file>', 'Unstage a file, keep the changes'],
          ['git commit --amend', 'Add staged changes to the last commit (local only!)'],
          ['git reset --soft HEAD~1', 'Undo last commit, keep changes staged'],
          ['git reset --hard HEAD~1', 'Undo last commit and delete its changes (dangerous)'],
          ['git revert <sha>', 'Create a new commit that undoes an old one (safe on shared branches)'],
          ['git clean -fd', 'Delete untracked files and directories (careful)'],
        ],
      },
      {
        caption: 'Branches & stash',
        headers: ['Command', 'What it does'],
        rows: [
          ['git switch -c <branch>', 'Create and switch to a new branch'],
          ['git switch <branch>', 'Switch to an existing branch'],
          ['git merge <branch>', 'Merge a branch into the current one'],
          ['git rebase <branch>', 'Replay current branch commits on top of another branch'],
          ['git branch -d <branch>', 'Delete a merged branch'],
          ['git stash / git stash pop', 'Shelve changes / bring them back'],
          ['git remote -v', 'List configured remotes'],
        ],
      },
      {
        caption: 'Step-by-step recipes',
        headers: ['Guide', 'Covers'],
        rows: [
          ['<a href="git-undo-last-commit">Undo the last commit</a>', 'soft / mixed / hard reset compared, reflog rescue'],
          ['<a href="git-discard-local-changes">Discard local changes</a>', 'restore, clean, dry-runs, what is recoverable'],
          ['<a href="git-delete-branch">Delete a branch</a>', 'local + remote, -d vs -D, pruning stale refs'],
          ['<a href="git-stash-changes">Stash changes</a>', 'park work, untracked files, stacked stashes'],
          ['<a href="git-amend-last-commit">Amend the last commit</a>', 'fix messages, fold in files, force-with-lease'],
          ['<a href="git-revert-pushed-commit">Undo a pushed commit</a>', 'revert vs reset, reverting merges'],
        ],
      },
    ],
    faq: [
      ['git reset vs git revert — which one?', 'reset moves the branch pointer and (optionally) deletes commits — fine for local, unpushed work. revert adds an inverse commit — the only safe way to undo something already pushed to a shared branch.'],
      ['git switch vs git checkout', 'checkout does three jobs (switch branches, create branches, restore files) and is easy to misuse. switch and restore split those jobs up; checkout still works everywhere.'],
      ['I committed to the wrong branch — now what?', 'If unpushed: git reset --soft HEAD~1, switch to the right branch, commit again. If pushed: create the fix on the right branch and revert on the wrong one.'],
    ],
    tool: { href: '../tools/git.html', label: 'Generate the exact command in the Git Command Builder' },
  },

  {
    slug: 'regex',
    icon: '🔍',
    title: 'Regex Syntax Cheat Sheet',
    metaDesc: 'Regular expression syntax on one page: tokens, character classes, quantifiers, groups, lookarounds, and flags — with examples. Pairs with our real-time regex tester.',
    intro: 'Regular expressions match patterns in text. Ninety percent of practical regex is built from the two dozen tokens below.',
    tables: [
      {
        caption: 'Core tokens',
        headers: ['Token', 'Matches', 'Example'],
        rows: [
          ['.', 'Any character except newline', 'a.c → abc, a1c'],
          ['\\d \\D', 'Digit / non-digit', '\\d\\d → 42'],
          ['\\w \\W', 'Word char [A-Za-z0-9_] / non-word', '\\w+ → hello_1'],
          ['\\s \\S', 'Whitespace / non-whitespace', 'a\\sb → a b'],
          ['^ $', 'Start / end of string (or line with m flag)', '^Hi → Hi there'],
          ['\\b', 'Word boundary', '\\bcat\\b → cat, not category'],
        ],
      },
      {
        caption: 'Quantifiers',
        headers: ['Token', 'Meaning', 'Example'],
        rows: [
          ['*', '0 or more', 'ab*c → ac, abc, abbc'],
          ['+', '1 or more', 'ab+c → abc, abbc'],
          ['?', '0 or 1 (optional)', 'colou?r → color, colour'],
          ['{n}', 'Exactly n times', '\\d{4} → 2026'],
          ['{n,} {n,m}', 'n or more / between n and m', '\\d{2,4} → 12, 123, 1234'],
          ['*? +? ??', 'Lazy versions (match as little as possible)', '<.+?> → first tag only'],
        ],
      },
      {
        caption: 'Groups, classes, lookarounds',
        headers: ['Token', 'Meaning', 'Example'],
        rows: [
          ['[abc] [a-z]', 'Character class (any listed char / range)', '[aeiou] → vowels'],
          ['[^abc]', 'Negated class (anything but)', '[^0-9] → non-digits'],
          ['(abc)', 'Capturing group', '(\\d{4})-(\\d{2}) → year, month'],
          ['(?:abc)', 'Non-capturing group', '(?:https?|ftp)://'],
          ['a|b', 'Alternation (or)', 'cat|dog'],
          ['(?=…) (?!…)', 'Lookahead / negative lookahead', '\\d+(?=px) → 16 in "16px"'],
          ['(?<=…) (?<!…)', 'Lookbehind / negative lookbehind', '(?<=\\$)\\d+ → 16 in "$16"'],
        ],
      },
      {
        caption: 'Flags',
        headers: ['Flag', 'Meaning'],
        rows: [
          ['g', 'Global — find all matches, not just the first'],
          ['i', 'Case-insensitive'],
          ['m', '^ and $ match line starts/ends'],
          ['s', 'Dot also matches newlines'],
          ['u', 'Full Unicode support'],
        ],
      },
    ],
    faq: [
      ['Greedy vs lazy — when do I care?', 'Quantifiers are greedy by default: <.+> swallows <b>bold</b> whole. Add ? (<.+?>) to stop at the first closing bracket. Rule of thumb: parsing-ish tasks want lazy quantifiers.'],
      ['Why does my regex match inside longer words?', 'You need boundaries: \\bcat\\b matches "cat" but not "category". Boundaries are zero-width — they assert position without consuming characters.'],
      ['Can regex parse HTML?', 'Badly and briefly. Regex cannot track nesting; anything tree-shaped needs a real parser. Use regex for flat-text validation, extraction, and replacement.'],
    ],
    tool: { href: '../tools/regex.html', label: 'Test it live in the Regex Tester' },
  },

  {
    slug: 'flexgrid',
    icon: '📐',
    title: 'Flexbox & Grid Cheat Sheet',
    metaDesc: 'CSS Flexbox and Grid properties on one page: container and item properties, the justify/align values explained, and when to pick which. Pairs with our visual layout playground.',
    intro: 'Flexbox lays out items along one axis; Grid places them in two dimensions. Same box model, different superpowers.',
    tables: [
      {
        caption: 'Flexbox — container properties',
        headers: ['Property', 'Common values', 'Does'],
        rows: [
          ['display', 'flex', 'Enables flex layout'],
          ['flex-direction', 'row · column · row-reverse', 'Main axis direction'],
          ['justify-content', 'flex-start · center · space-between · space-around', 'Distribution along the main axis'],
          ['align-items', 'stretch · center · flex-start · flex-end', 'Alignment on the cross axis'],
          ['flex-wrap', 'nowrap · wrap', 'Whether items can line-break'],
          ['gap', '12px · 8px 16px', 'Spacing between items (row column)'],
        ],
      },
      {
        caption: 'Flexbox — item properties',
        headers: ['Property', 'Common values', 'Does'],
        rows: [
          ['flex-grow', '0 · 1 · 2', 'How much free space an item absorbs'],
          ['flex-shrink', '1 · 0', 'How willingly an item shrinks'],
          ['flex-basis', 'auto · 200px · 0', 'Initial size before growing/shrinking'],
          ['flex', '1 · 0 auto · 1 1 0', 'Shorthand for grow shrink basis'],
          ['align-self', 'auto · center · flex-end', 'Per-item cross-axis override'],
          ['order', '0 · 1 · -1', 'Visual reordering without touching HTML'],
        ],
      },
      {
        caption: 'Grid — container properties',
        headers: ['Property', 'Common values', 'Does'],
        rows: [
          ['display', 'grid', 'Enables grid layout'],
          ['grid-template-columns', 'repeat(3, 1fr) · 200px 1fr · auto-fill minmax(240px, 1fr)', 'Defines the columns'],
          ['grid-template-rows', 'auto · repeat(2, minmax(0, 1fr))', 'Defines the rows'],
          ['gap', '16px · 8px 24px', 'Gutters between tracks'],
          ['justify-items / align-items', 'start · center · stretch', 'Placement inside each cell'],
          ['place-items', 'center', 'Shorthand for align + justify items'],
        ],
      },
    ],
    faq: [
      ['Flexbox or Grid — how do I choose?', 'One-dimensional (a toolbar, a nav, a card row that should stretch) → Flexbox. Two-dimensional or explicit rows AND columns → Grid. Most real layouts use both.'],
      ['Why do my grid images overflow?', 'Grid tracks default to auto, so wide content expands the track. Use minmax(0, 1fr) instead of 1fr to force tracks to shrink below content size.'],
      ['justify-content vs align-items?', 'justify = main axis, align = cross axis — and the main axis is whichever direction flex-direction points. Flip the direction and the two swap roles.'],
    ],
    tool: { href: '../tools/flexgrid.html', label: 'Preview it visually in the Flexbox & Grid Playground' },
  },

  {
    slug: 'markdown',
    icon: '📝',
    title: 'Markdown Syntax Cheat Sheet',
    metaDesc: 'Markdown syntax on one page: headings, emphasis, links, images, code blocks, lists, quotes, and tables — with rendered results. Pairs with our Markdown converter.',
    intro: 'Markdown turns plain-text punctuation into formatted documents. Everything below works in GitHub, most editors, and this site\'s converter.',
    tables: [
      {
        caption: 'Syntax',
        headers: ['You type', 'You get'],
        rows: [
          ['# H1 · ## H2 · ### H3', 'Headings (descending size)'],
          ['**bold** · *italic* · ~~strike~~', 'bold · italic · strikethrough'],
          ['[text](https://example.com)', 'A hyperlink'],
          ['![alt](image.png)', 'An image'],
          ['`code`', 'Inline code'],
          ['```js\\ncode block\\n```', 'Fenced code block with language hint'],
          ['> quoted text', 'Blockquote'],
          ['- item · * item · 1. item', 'Unordered / ordered lists'],
          ['--- or ***', 'Horizontal rule'],
          ['| a | b |\\n|---|---|\\n| 1 | 2 |', 'A table'],
          ['- [ ] task · - [x] done', 'Task list (GitHub flavored)'],
          ['line ends with two spaces  ⏎', 'Hard line break'],
        ],
      },
    ],
    faq: [
      ['Why is my line break ignored?', 'A single newline renders as a space. End the line with two spaces, use a backslash, or leave a blank line for a new paragraph.'],
      ['How do I nest lists?', 'Indent the nested list by 2–4 spaces under the parent item. Mixing tabs and spaces breaks this in some renderers — pick spaces.'],
      ['Escaping special characters?', 'Prefix with a backslash: \\*not italic\\* renders the asterisks literally.'],
    ],
    tool: { href: '../tools/markdown.html', label: 'Convert it live in the Markdown Converter' },
  },

  {
    slug: 'http-status',
    icon: '🌐',
    title: 'HTTP Status Codes Cheat Sheet',
    metaDesc: 'HTTP status codes explained in plain language: 2xx success, 3xx redirects, 4xx client errors, 5xx server errors — what causes each and what to do about it.',
    intro: 'Every HTTP response carries a three-digit status. The first digit is the family: 1xx informational, 2xx success, 3xx redirect, 4xx you messed up, 5xx the server messed up.',
    tables: [
      {
        caption: '2xx — Success',
        headers: ['Code', 'Name', 'When you see it'],
        rows: [
          ['200', 'OK', 'Standard success — page loaded, GET returned data'],
          ['201', 'Created', 'POST created a resource (new record, uploaded file)'],
          ['204', 'No Content', 'Success with an empty body — common for DELETE'],
        ],
      },
      {
        caption: '3xx — Redirects',
        headers: ['Code', 'Name', 'When you see it'],
        rows: [
          ['301', 'Moved Permanently', 'URL changed for good; browsers and search engines cache it'],
          ['302', 'Found', 'Temporary redirect — do not use for moved content'],
          ['304', 'Not Modified', 'Client cache is still valid; body not resent'],
        ],
      },
      {
        caption: '4xx — Client errors',
        headers: ['Code', 'Name', 'When you see it'],
        rows: [
          ['400', 'Bad Request', 'Malformed syntax — invalid JSON, bad parameters'],
          ['401', 'Unauthorized', 'Not authenticated (no/invalid credentials) — log in first'],
          ['403', 'Forbidden', 'Authenticated but not allowed — do not retry as-is'],
          ['404', 'Not Found', 'No resource at this URL'],
          ['409', 'Conflict', 'Request contradicts current state (duplicate, version clash)'],
          ['422', 'Unprocessable Entity', 'Well-formed but semantically invalid (validation failed)'],
          ['429', 'Too Many Requests', 'Rate limit hit — back off, honor Retry-After'],
        ],
      },
      {
        caption: '5xx — Server errors',
        headers: ['Code', 'Name', 'When you see it'],
        rows: [
          ['500', 'Internal Server Error', 'Unhandled exception on the server — check the logs'],
          ['502', 'Bad Gateway', 'Upstream service returned garbage or died'],
          ['503', 'Service Unavailable', 'Overloaded or in maintenance — usually temporary'],
          ['504', 'Gateway Timeout', 'Upstream took too long to answer'],
        ],
      },
    ],
    faq: [
      ['401 vs 403 — both mean "no", right?', '401 = "who are you?" (missing or invalid authentication). 403 = "I know who you are and you still can\'t". Retrying 403 with the same credentials never helps.'],
      ['301 vs 302 for SEO?', '301 passes ranking signals to the new URL and browsers cache it aggressively. Use 302 only when the move is truly temporary — search engines keep the old URL indexed.'],
      ['I got a 429 — what now?', 'Slow down. Read the Retry-After header if present, add exponential backoff, and batch requests. Hammering a rate-limited endpoint turns 429 into 403.'],
    ],
    tool: null,
  },

  {
    slug: 'html-entities',
    icon: '🔗',
    title: 'HTML Entities Cheat Sheet',
    metaDesc: 'HTML entities and escape characters on one page: reserved characters (&amp; &lt; &gt;), symbols (© ™ →), and whitespace — plus when escaping is required.',
    intro: 'Some characters have special meaning in HTML. To display them as text, write an entity: an ampersand, a name or number, and a semicolon.',
    tables: [
      {
        caption: 'Reserved — must escape in content',
        headers: ['Entity', 'Numeric', 'Renders'],
        rows: [
          ['&amp;lt;', '&amp;#60;', '<'],
          ['&amp;gt;', '&amp;#62;', '>'],
          ['&amp;amp;', '&amp;#38;', '&'],
          ['&amp;quot;', '&amp;#34;', '"'],
          ['&amp;apos;', '&amp;#39;', "'"],
        ],
      },
      {
        caption: 'Symbols & typography',
        headers: ['Entity', 'Renders'],
        rows: [
          ['&amp;nbsp;', 'Non-breaking space'],
          ['&amp;copy; · &amp;reg; · &amp;trade;', '© · ® · ™'],
          ['&amp;mdash; · &amp;ndash; · &amp;hellip;', '— · – · …'],
          ['&amp;larr; · &amp;rarr; · &amp;darr; · &amp;uarr;', '← · → · ↓ · ↑'],
          ['&amp;times; · &amp;divide; · &amp;minus;', '× · ÷ · −'],
          ['&amp;laquo; · &amp;raquo;', '« · »'],
          ['&amp;bull; · &amp;middot;', '• · ·'],
          ['&amp;euro; · &amp;pound; · &amp;yen;', '€ · £ · ¥'],
        ],
      },
    ],
    faq: [
      ['When is escaping actually required?', 'Always escape < and & when they appear as text — < starts a tag the parser will try to execute, and & starts an entity the parser will try to resolve. Quotes matter inside attribute values.'],
      ['Why does &copy; render literally sometimes?', 'A missing semicolon. Browsers repair some entity typos, but only named entities with semicolons are guaranteed — write &amp;copy; not &amp;copy.'],
      ['Entity vs numeric reference?', 'Named (&amp;copy;) is readable; numeric (&amp;#169;) covers every Unicode character, including ones with no named entity. Both are ASCII-safe for emails and old parsers.'],
    ],
    tool: { href: '../tools/url.html', label: 'Escape or unescape strings in the URL Encoder' },
  },

  {
    slug: 'base64',
    icon: '⚡',
    title: 'Base64 Cheat Sheet',
    metaDesc: 'Base64 encoding essentials: the 64-character alphabet, padding rules, why encoded data is 33% larger, URL-safe variants, and the CLI one-liners. Pairs with our local Base64 tool.',
    intro: 'Base64 represents binary data using 64 printable ASCII characters, so anything — text, images, keys — can travel through channels that only tolerate text.',
    tables: [
      {
        caption: 'The essentials',
        headers: ['Fact', 'Detail'],
        rows: [
          ['Alphabet', 'A–Z, a–z, 0–9, + and / (64 characters)'],
          ['Padding', '= pads the output so its length is a multiple of 4'],
          ['Size cost', 'Encoded output is ~33% larger than the input bytes'],
          ['URL-safe variant', 'Uses - and _ instead of + and / (JWTs use this, unpadded)'],
          ['Decodable?', 'Always, by anyone — Base64 is encoding, NOT encryption'],
          ['Typical uses', 'Data URLs, email attachments (MIME), JWT payloads, embedding fonts'],
        ],
      },
      {
        caption: 'CLI one-liners',
        headers: ['Task', 'Command'],
        rows: [
          ['Encode text (macOS/Linux)', 'echo -n "hello" | base64'],
          ['Decode text', 'echo "aGVsbG8=" | base64 -d'],
          ['Encode a file', 'base64 input.png > output.txt'],
          ['Decode a file', 'base64 -d output.txt > input.png'],
          ['URL-safe encode (Node.js)', 'Buffer.from(s).toString("base64url")'],
        ],
      },
    ],
    faq: [
      ['Is Base64 encryption?', 'No. Decoding requires no key — anyone can reverse it instantly. Never "protect" secrets by Base64-encoding them; that is obfuscation, and it fools nobody.'],
      ['Why is the output bigger than the input?', 'Three bytes (24 bits) become four 6-bit groups, each written as a full character (8 bits): a 4/3 ratio, about +33%.'],
      ['Why does my decoded string end in garbage?', 'Almost always trailing whitespace or a lost padding character. Make sure the = padding survived copying, and that URL-safe (-, _) variants are decoded with the right decoder.'],
    ],
    tool: { href: '../tools/base64.html', label: 'Convert it locally in the Base64 Encoder' },
  },
];

/* ------------------------------ template --------------------------------- */

const tableHTML = (t) => `
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">${t.caption}</h2>
      <div style="overflow-x: auto; margin-bottom: 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: var(--bg-card);">
          <thead>
            <tr>${t.headers.map((h) => `<th style="text-align: left; padding: 10px 12px; border: 1px solid var(--border-color); background: var(--accent-light); color: var(--text-main);">${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${t.rows.map((r) => `<tr>${r.map((c) => `<td style="padding: 9px 12px; border: 1px solid var(--border-color); color: var(--text-muted); line-height: 1.6;">${c}</td>`).join('')}</tr>`).join('\n            ')}
          </tbody>
        </table>
      </div>`;

const faqHTML = (faq) => `
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">FAQ</h2>
      ${faq.map(([q, a]) => `<p style="font-size: 14px; color: var(--text-muted); line-height: 1.8; margin-bottom: 14px;"><strong style="color: var(--text-main);">${q}</strong><br>${a}</p>`).join('\n      ')}`;


/* Chinese layer for the sheet pages: titles, intros, captions and table
   headers are translated; command/term rows stay in their original form
   because that is what people copy. Anything missing falls back to English. */
const SHEET_ZH = {
  cron: {
    title: 'Cron 表达式速查表',
    metaDesc: '一页看完 cron：五个字段、特殊字符，以及最常被抄的调度写法（每 5 分钟、工作日 9 点、每月 1 号）。',
    intro: '一条 cron 表达式由五个用空格分隔的字段组成，合起来定义任务触发的每一个时刻。',
    captions: ['五个字段', '特殊字符', '大家最常抄的调度'],
    headers: [['字段', '允许值', '特殊字符'], ['字符', '含义', '示例'], ['表达式', '含义']],
  },
  git: {
    title: 'Git 命令速查表',
    metaDesc: '覆盖日常 95% 场景的 Git 命令，按你想做的事分组：日常流程、撤销、分支与 stash、分步配方。',
    intro: '覆盖真实使用中 95% 场景的 Git 命令，按你想做的事情分组。',
    captions: ['日常流程', '撤销操作', '分支与 stash', '分步配方'],
    headers: [['命令', '作用'], ['命令', '作用'], ['命令', '作用'], ['指南', '涵盖']],
  },
  regex: {
    title: '正则语法速查表',
    metaDesc: '正则用两打符号解决大部分文本匹配：核心符号、量词、分组与断言、标志位。',
    intro: '正则表达式用来匹配文本中的模式。实际使用中九成的正则，都由下面这两打符号构成。',
    captions: ['核心符号', '量词', '分组、字符类与断言', '标志位'],
    headers: [['符号', '匹配', '示例'], ['符号', '含义', '示例'], ['符号', '含义', '示例'], ['标志', '含义']],
  },
  flexgrid: {
    title: 'Flexbox 与 Grid 速查表',
    metaDesc: 'Flexbox 沿一个轴排列，Grid 在二维网格里布局：容器属性、项目属性与常用值对照。',
    intro: 'Flexbox 沿一个轴排列项目，Grid 在二维平面里摆放。同一套盒模型，不同的能力。',
    captions: ['Flexbox — 容器属性', 'Flexbox — 项目属性', 'Grid — 容器属性'],
    headers: [['属性', '常用值', '作用'], ['属性', '常用值', '作用'], ['属性', '常用值', '作用']],
  },
  markdown: {
    title: 'Markdown 语法速查表',
    metaDesc: 'Markdown 用纯文本标点生成格式化文档：标题、列表、链接、代码块、表格的写法对照。',
    intro: 'Markdown 把纯文本里的标点变成格式。下面这些在 GitHub、大多数编辑器和本站都能用。',
    captions: ['语法'],
    headers: [['你输入', '你得到']],
  },
  'http-status': {
    title: 'HTTP 状态码速查表',
    metaDesc: '每个 HTTP 响应都带三位状态码，第一位是类别：1xx 信息、2xx 成功、3xx 重定向、4xx 客户端错、5xx 服务端错。',
    intro: '每个 HTTP 响应都带一个三位状态码。第一位表示类别：1xx 信息、2xx 成功、3xx 重定向、4xx 你这边出错、5xx 服务器出错。',
    captions: ['2xx — 成功', '3xx — 重定向', '4xx — 客户端错误', '5xx — 服务端错误'],
    headers: [['状态码', '名称', '什么时候见到'], ['状态码', '名称', '什么时候见到'], ['状态码', '名称', '什么时候见到'], ['状态码', '名称', '什么时候见到']],
  },
  'html-entities': {
    title: 'HTML 实体速查表',
    metaDesc: 'HTML 里有些字符有特殊含义，要显示它们本身就得写实体：&、名称或编号、分号。',
    intro: '有些字符在 HTML 里有特殊含义。想把它们当作文本显示，就要写实体：一个 &、名称或编号、一个分号。',
    captions: ['保留字符 — 内容里必须转义', '符号与排版'],
    headers: [['实体', '数字形式', '渲染结果'], ['实体', '渲染结果']],
  },
  base64: {
    title: 'Base64 速查表',
    metaDesc: 'Base64 用 64 个可打印 ASCII 字符表示二进制数据，让文本、图片、密钥能通过只支持文本的通道传输。',
    intro: 'Base64 用 64 个可打印的 ASCII 字符表示二进制数据，于是任何东西——文本、图片、密钥——都能通过只接受文本的通道传输。',
    captions: ['核心事实', '命令行一行搞定'],
    headers: [['事实', '说明'], ['任务', '命令']],
  },
};

const SHEET_UI = {
  en: { lang: 'en', back: '&larr; Cheat Sheets', faq: 'FAQ', cta: 'Try it instead of memorizing it', prefix: '' },
  cn: { lang: 'zh', back: '&larr; 速查表', faq: '常见问题', cta: '别死记，直接用工具', prefix: 'cn/' },
};

function sheetPage(sheet, lang) {
  const U = SHEET_UI[lang];
  const Z = (lang === 'cn' && SHEET_ZH[sheet.slug]) || {};
  const title = Z.title || sheet.title;
  const metaDesc = Z.metaDesc || sheet.metaDesc;
  const intro = Z.intro || sheet.intro;
  const tables = sheet.tables.map((t, i) => ({
    ...t,
    caption: (Z.captions && Z.captions[i]) || t.caption,
    headers: (Z.headers && Z.headers[i]) || t.headers,
  }));
  // Tool links are relative (../tools/x.html) and the /cn/ tree mirrors the
  // English one, so the same href already resolves to /cn/tools/x.html from a
  // Chinese sheet. Rewriting it here would emit /cn/cn/tools/... .
  const toolHref = sheet.tool ? sheet.tool.href : '';
  return `<!DOCTYPE html>
<html lang="${U.lang}">
<head>
  <meta name="google-adsense-account" content="ca-pub-5108296372072915">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Plobi-kit</title>
  <meta name="description" content="${metaDesc}">
  <link rel="stylesheet" href="/styles.css">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#fafafa">
  <link rel="canonical" href="https://plobikit.com/${U.prefix}cheatsheets/${sheet.slug}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5108296372072915" crossorigin="anonymous"></script>
</head>
<body>

  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <span class="logo-icon" style="background:var(--success-color);">P</span>
        <span id="txt-logo-name">Plobi-kit</span>
      </div>
      <nav class="nav-links"></nav>
      <div class="controls"></div>
    </header>

    <main style="max-width: 900px; margin: 0 auto; margin-bottom: 40px;">
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;"><a href="/${U.prefix}cheatsheets/" style="color: var(--accent-hover);">${U.back}</a></p>
      <h1 style="font-size: 32px; margin-bottom: 12px; letter-spacing: -0.02em; color: var(--text-main);">${title}</h1>
      <p style="font-size: 15px; color: var(--text-muted); line-height: 1.8; margin-bottom: 24px;">${intro}</p>
${tables.map(tableHTML).join('\n')}
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">${U.faq}</h2>
      ${sheet.faq.map(([q, a]) => `<p style="font-size: 14px; color: var(--text-muted); line-height: 1.8; margin-bottom: 14px;"><strong style="color: var(--text-main);">${q}</strong><br>${a}</p>`).join('\n      ')}
      ${sheet.tool ? `
      <div style="margin-top: 32px; background: var(--accent-light); border: 1px solid var(--border-color); border-radius: 3px; padding: 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <p style="font-size: 14px; color: var(--text-main); font-weight: 600; margin: 0;">${U.cta}</p>
        <a class="btn" href="${toolHref}" style="text-decoration: none;">${sheet.tool.label}</a>
      </div>` : ''}
    </main>

    <footer class="app-footer">
      <div class="footer-nav"></div>
      <div class="copyright" id="nav-footer-copy">&copy; 2026 Plobi.</div>
    </footer>
  </div>

  <script type="module" src="/app.js"></script>
</body>
</html>`;
}

for (const sheet of SHEETS) {
  writeFileSync(join(OUT, `${sheet.slug}.html`), sheetPage(sheet, 'en'), 'utf8');
  console.log(`generated: cheatsheets/${sheet.slug}.html`);
  if (SHEET_ZH[sheet.slug]) {
    mkdirSync(OUT_CN, { recursive: true });
    writeFileSync(join(OUT_CN, `${sheet.slug}.html`), sheetPage(sheet, 'cn'), 'utf8');
    console.log(`generated: cn/cheatsheets/${sheet.slug}.html`);
  }
}
console.log(`\n${SHEETS.length} sheet(s) generated (${Object.keys(SHEET_ZH).length} with Chinese).`);
