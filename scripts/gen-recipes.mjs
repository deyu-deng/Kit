/**
 * Recipe page generator (Stage 1c — long-tail content cluster).
 *
 * One page answers ONE high-volume question ("cron every 5 minutes",
 * "git undo last commit") with a direct answer, breakdown, variations,
 * FAQ, and a CTA to the paired tool. Flat URLs under /cheatsheets/ to
 * avoid directory/file collisions: cheatsheets/cron-every-5-minutes.html
 *
 * Output is committed static HTML — add a recipe by adding data + rerun.
 *
 * Bilingual: add a slug's Chinese block to scripts/recipes-zh.mjs (title,
 * metaDesc, plain, fields, variations, tables, intro, body, code, faq, tool —
 * anything you have translated; missing pieces fall back to the English text)
 * and the recipe also renders to /cn/cheatsheets/. Slugs absent from that file
 * stay English-only, and the Chinese hubs keep linking to the English page.
 * No template edit is needed to add a translation.
 *
 * Run: node scripts/gen-recipes.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RECIPE_ZH } from './recipes-zh.mjs';

const OUT = join(process.cwd(), 'public', 'cheatsheets');
const OUT_CN = join(process.cwd(), 'public', 'cn', 'cheatsheets');

/* ------------------------------ content ---------------------------------- */

export const CRON_RECIPES = [
  {
    slug: 'cron-every-minute',
    title: 'Cron Every Minute — Crontab Example',
    metaDesc: 'How to run a cron job every minute: the expression * * * * *, what each field means, and how to prevent overlapping runs.',
    expr: '* * * * *',
    plain: 'Runs once every minute — 1,440 times a day.',
    fields: [
      ['Minute', '*', 'Every minute (0–59)'],
      ['Hour', '*', 'Every hour'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['*/5 * * * *', 'Every 5 minutes', 'cron-every-5-minutes'],
      ['*/30 * * * *', 'Every 30 minutes', 'cron-every-30-minutes'],
      ['0 * * * *', 'Every hour, on the hour', 'cron-every-hour'],
    ],
    body: [
      'A fully wildcarded expression fires every minute of every day. That is the right choice for queue workers, health-check pings, and cache warmers — anything that should notice new work within seconds.',
      'At this frequency, guard against overlap: if one run takes longer than a minute, the next starts anyway and runs pile up. Wrap the command with <code>flock</code> so a busy run makes the next one skip instead of stacking:',
    ],
    code: '* * * * * flock -n /tmp/myjob.lock /usr/local/bin/myjob.sh',
    faq: [
      ['Is every minute too much?', 'For lightweight idempotent jobs, no — it is the standard polling cadence. Add <code>flock -n</code> (skip if locked) so slow runs never stack. If the work can tolerate delay, step up to <code>*/5</code>.'],
      ['Which timezone does it use?', 'The timezone of the machine running cron — UTC on most servers. Cloud schedulers (GitHub Actions, Vercel Cron, Cloudflare) are also UTC unless configured otherwise.'],
      ['How do I pause it without deleting the line?', 'Comment the line out with <code>#</code> in <code>crontab -e</code>, or add a gate file the script checks at startup.'],
    ],
    tool: { href: '/tools/cron', label: 'Build it visually in the Cron Editor' },
  },

  {
    slug: 'cron-every-5-minutes',
    title: 'Cron Every 5 Minutes — Crontab Example',
    metaDesc: 'Run a cron job every 5 minutes with */5 * * * *. Field-by-field explanation, offsets to avoid load spikes, and common pitfalls.',
    expr: '*/5 * * * *',
    plain: 'Runs every 5 minutes — at minutes 0, 5, 10, 15, and so on.',
    fields: [
      ['Minute', '*/5', 'Every 5th minute (0, 5, 10, … 55)'],
      ['Hour', '*', 'Every hour'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['*/10 * * * *', 'Every 10 minutes', 'cron-every-10-minutes'],
      ['*/15 * * * *', 'Every 15 minutes', 'cron-every-15-minutes'],
      ['* * * * *', 'Every minute', 'cron-every-minute'],
    ],
    body: [
      'This is the most-copied polling interval in cron. The <code>*/5</code> step syntax means "starting at the field minimum, every 5th value" — so runs land exactly on 0, 5, 10, 15 minutes past the hour.',
      'Because every server in the world that copies this expression fires at the same instants, popular APIs see traffic spikes at :00. Offset your runs to a quieter phase with a ranged step: <code>2-57/5 * * * *</code> fires at 2, 7, 12, … and is equivalent in cadence.',
    ],
    code: '*/5 * * * * /usr/local/bin/poll.sh',
    faq: [
      ['Is */5 the same as 0-55/5?', 'Yes — both enumerate 0, 5, 10, … 55. The range before the slash only sets where the step starts and stops.'],
      ['Why did my job also fire at midnight?', 'It fires at :00 of every hour including 00:00 — that is expected. If you want "every 5 minutes but never at midnight exactly", exclude it in the script itself.'],
      ['Does it catch up after downtime?', 'No. Cron has no memory — if the machine was off at 12:05, that run is simply skipped. Use a job queue or anacron-style tooling when catch-up matters.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-10-minutes',
    title: 'Cron Every 10 Minutes — Crontab Example',
    metaDesc: 'The cron expression for every 10 minutes: */10 * * * *. Field breakdown, custom offsets like 3-59/10, and catch-up behavior explained.',
    expr: '*/10 * * * *',
    plain: 'Runs every 10 minutes — at minutes 0, 10, 20, 30, 40, 50.',
    fields: [
      ['Minute', '*/10', 'Every 10th minute (0, 10, … 50)'],
      ['Hour', '*', 'Every hour'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['*/5 * * * *', 'Every 5 minutes', 'cron-every-5-minutes'],
      ['*/15 * * * *', 'Every 15 minutes', 'cron-every-15-minutes'],
      ['*/30 * * * *', 'Every 30 minutes', 'cron-every-30-minutes'],
    ],
    body: [
      'Six runs per hour. If you would rather not align with the rest of the world, start the step from a different base: <code>3-59/10 * * * *</code> fires at 3, 13, 23, 33, 43, 53.',
    ],
    code: '*/10 * * * * /usr/local/bin/sync.sh',
    faq: [
      ['Can I start at an odd minute?', 'Yes — combine a range with a step. <code>3-59/10</code> gives 3, 13, 23… A bare <code>*/10</code> always starts at 0.'],
      ['What happens if a run takes 10+ minutes?', 'Runs can overlap. Serialize with <code>flock -n /tmp/sync.lock cmd</code> or accept idempotent double-processing.'],
      ['Does the day-of-week field matter here?', 'It is *, so no — every day. Restrict it (e.g. <code>1-5</code>) to run only on weekdays.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-15-minutes',
    title: 'Cron Every 15 Minutes — Crontab Example',
    metaDesc: 'Run a cron job every 15 minutes: */15 * * * *. Explanation, the explicit 0,15,30,45 alternative, and overlap protection.',
    expr: '*/15 * * * *',
    plain: 'Runs every 15 minutes — at minutes 0, 15, 30, 45 (quarter hours).',
    fields: [
      ['Minute', '*/15', 'Every 15th minute (0, 15, 30, 45)'],
      ['Hour', '*', 'Every hour'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['*/5 * * * *', 'Every 5 minutes', 'cron-every-5-minutes'],
      ['*/30 * * * *', 'Every 30 minutes', 'cron-every-30-minutes'],
      ['0 * * * *', 'Every hour, on the hour', 'cron-every-hour'],
    ],
    body: [
      'Four runs per hour, aligned to quarter hours. You can spell the same schedule as an explicit list — <code>0,15,30,45 * * * *</code> — which some people find more readable, but <code>*/15</code> is idiomatic.',
    ],
    code: '*/15 * * * * /usr/local/bin/check-alerts.sh',
    faq: [
      ['How do I run at 7, 22, 37, 52 instead?', 'Use a ranged step: <code>7-59/15 * * * *</code>. The step counts from the start of the range, not from 0.'],
      ['Four runs a day skipped during DST change?', 'On DST transition days a local-time cron can fire twice or not at all for one hour. UTC scheduling avoids it entirely.'],
      ['Is this too frequent for an API poller?', '96 calls per day per endpoint is modest. Add jitter via an offset step if you are one of many clients hitting the same vendor.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-30-minutes',
    title: 'Cron Every 30 Minutes — Crontab Example',
    metaDesc: 'The cron expression for every 30 minutes: */30 * * * *. Runs at :00 and :30 — plus how to shift to :05/:35 and what happens on DST days.',
    expr: '*/30 * * * *',
    plain: 'Runs every 30 minutes — at minutes 0 and 30 of every hour.',
    fields: [
      ['Minute', '*/30', 'Minutes 0 and 30'],
      ['Hour', '*', 'Every hour'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['*/15 * * * *', 'Every 15 minutes', 'cron-every-15-minutes'],
      ['0 * * * *', 'Every hour, on the hour', 'cron-every-hour'],
      ['*/10 * * * *', 'Every 10 minutes', 'cron-every-10-minutes'],
    ],
    body: [
      'Half-hourly is the classic metronome for sync jobs and status checks. To shift the pair to :05 and :35, use <code>5-59/30 * * * *</code> — the range moves the step\'s starting point.',
    ],
    code: '*/30 * * * * /usr/local/bin/pull-updates.sh',
    faq: [
      ['Why does my 00:30 run vanish twice a year?', 'Daylight saving. When clocks spring forward, 02:30 local does not exist; fall back, it happens twice. Schedule in UTC to make it deterministic.'],
      ['Is "twice an hour" exactly the same thing?', 'Functionally yes for cron. Some schedulers also accept <code>0,30 * * * *</code> — identical result, written as a list.'],
      ['Can I run it only during business hours?', 'Constrain the hour field: <code>*/30 9-17 * * 1-5</code> runs every half hour, 9:00–17:59, Monday to Friday.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-hour',
    title: 'Cron Every Hour — Crontab Example',
    metaDesc: 'The cron expression for hourly jobs: 0 * * * *. Common mistake explained (0 0 * * * is daily!), offsets, and hour ranges like 9-17.',
    expr: '0 * * * *',
    plain: 'Runs at minute 0 of every hour — once an hour, on the hour.',
    fields: [
      ['Minute', '0', 'Exactly at minute 0'],
      ['Hour', '*', 'Every hour'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['*/30 * * * *', 'Every 30 minutes', 'cron-every-30-minutes'],
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
      ['0 9 * * 1-5', 'Weekdays at 9:00 AM', 'cron-every-weekday-9am'],
    ],
    body: [
      'Hourly jobs anchor the minute field to a single value (<code>0</code>) and leave the hour wildcard. The classic beginner mistake is writing <code>* 0 * * *</code> thinking it means hourly — that actually means "every minute of hour 0", i.e. 60 runs between midnight and 1 AM.',
      'To run at half past every hour instead, change the minute: <code>30 * * * *</code>. For business-hours-only, constrain the hour range: <code>0 9-17 * * 1-5</code> fires on the hour from 9:00 to 17:00 on weekdays.',
    ],
    code: '0 * * * * /usr/local/bin/hourly-rollup.sh',
    faq: [
      ['What is the difference between 0 * * * * and * 0 * * *?', 'First: hourly at minute 0. Second: every minute during the 00:00 hour only. Field order is minute-first — this one trip-up causes most "my cron ran 60 times" support tickets.'],
      ['Is there an @hourly shorthand?', 'Yes — <code>@hourly</code> is equivalent to <code>0 * * * *</code>. Shorthands exist for @daily, @weekly, @monthly, @yearly too.'],
      ['How do I avoid clashing with other hourly jobs?', 'Offset the minute (25 * * * *) or add jitter inside the script. Everything firing at :00 creates thundering-herd load on shared dependencies.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-daily-midnight',
    title: 'Cron Daily at Midnight — Crontab Example',
    metaDesc: 'The cron expression for a daily midnight job: 0 0 * * *. Timezone caveats, the @daily shorthand, and why stagger your backup window.',
    expr: '0 0 * * *',
    plain: 'Runs at 00:00 (midnight) every day.',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '0', 'At hour 0 (midnight)'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 9 * * 1-5', 'Weekdays at 9:00 AM', 'cron-every-weekday-9am'],
      ['0 0 1 * *', 'First day of the month', 'cron-first-day-of-month'],
      ['0 * * * *', 'Every hour, on the hour', 'cron-every-hour'],
    ],
    body: [
      'Midnight daily is where backups, log rotation, and report generation traditionally live. The <code>@daily</code> shorthand is exactly equivalent to this expression.',
      'Two practical notes: first, midnight is server-timezone midnight — a UTC server means 00:00 UTC, which is early morning in most of Europe and evening in the Americas. Second, midnight is also when everyone else\'s heavy jobs run; moving yours to <code>0 3 * * *</code> often makes the same work finish faster.',
    ],
    code: '0 0 * * * /usr/local/bin/backup.sh',
    faq: [
      ['Midnight in which timezone?', 'Whatever the host considers local — typically UTC on cloud servers. Verify with <code>date</code> on the box, and prefer UTC schedules for deterministic behavior.'],
      ['Is @daily exactly the same?', 'Yes: <code>@daily</code> expands to <code>0 0 * * *</code>. Use whichever reads better in your crontab.'],
      ['What if the server is down at midnight?', 'The run is skipped — cron does not catch up. For must-run daily jobs (billing, retention), have the job itself check its last-run timestamp, or use anacron / a scheduler with catch-up semantics.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-weekday-9am',
    title: 'Cron Weekdays at 9 AM — Crontab Example',
    metaDesc: 'Run a cron job at 9:00 AM Monday to Friday: 0 9 * * 1-5. Day-of-week values, holiday limitations, and timezone notes.',
    expr: '0 9 * * 1-5',
    plain: 'Runs at 09:00 every Monday through Friday.',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '9', 'At 9 AM'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '1-5', 'Monday through Friday'],
    ],
    variations: [
      ['0 10 * * 6,0', 'Weekends only at 10:00 AM', 'cron-weekends-only'],
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
      ['0 0 1 * *', 'First day of the month', 'cron-first-day-of-month'],
    ],
    body: [
      'The day-of-week range <code>1-5</code> covers Monday to Friday — 0 is Sunday in standard cron. Most implementations also accept names: <code>0 9 * * MON-FRI</code> is identical and arguably more readable.',
      'Remember that cron has no concept of holidays or company calendars: it will happily page your team at 9 AM on a public holiday. Wrap the command with a holiday-calendar check, or drive the schedule from a service that understands your region\'s calendar.',
    ],
    code: '0 9 * * 1-5 /usr/local/bin/morning-report.sh',
    faq: [
      ['Is Sunday 0 or 7?', 'Both are valid in most implementations (0 = Sunday, 7 = Sunday again). Ranges like 1-5 are unambiguous; avoid mixing 0 and 7 in the same expression.'],
      ['Can I write MON-FRI instead of numbers?', 'Yes in Vixie cron and most modern implementations: <code>0 9 * * MON-FRI</code>. Some minimal cron builds only accept numbers — test on your target system.'],
      ['How do I skip public holidays?', 'Cron alone cannot. Guard the command with a holiday lookup (an API, a calendar file, or a wrapper like <code>skip-holiday.sh</code>) and exit early on non-working days.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-weekends-only',
    title: 'Cron Weekends Only — Crontab Example',
    metaDesc: 'Run a cron job only on Saturdays and Sundays: 0 10 * * 6,0. Includes the day-of-month + day-of-week union trap that surprises everyone.',
    expr: '0 10 * * 6,0',
    plain: 'Runs at 10:00 AM on Saturdays and Sundays only.',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '10', 'At 10 AM'],
      ['Day of month', '*', 'Every day (unrestricted)'],
      ['Month', '*', 'Every month'],
      ['Day of week', '6,0', 'Saturday and Sunday'],
    ],
    variations: [
      ['0 9 * * 1-5', 'Weekdays at 9:00 AM', 'cron-every-weekday-9am'],
      ['0 0 1 * *', 'First day of the month', 'cron-first-day-of-month'],
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
    ],
    body: [
      'Weekend-only schedules come from a comma list in the day-of-week field: <code>6,0</code> (Saturday, Sunday) — order does not matter, <code>0,6</code> is identical.',
      'This is also the page to learn cron\'s most surprising rule: <strong>when both day-of-month and day-of-week are restricted, cron runs when EITHER matches</strong> — a union, not an intersection. <code>0 0 1 * 6,0</code> therefore fires on the 1st of every month AND every Saturday and Sunday. Keep the field you do not care about as <code>*</code>.',
    ],
    code: '0 10 * * 6,0 /usr/local/bin/weekend-maintenance.sh',
    faq: [
      ['Why did my job run on the 15th when I set 6,0 and 15?', 'That is the union trap: day-of-month 15 plus day-of-week weekend means "the 15th, or any weekend day". Restrict only one of the two fields.'],
      ['Saturday = 6, Sunday = 0 — can I write 7?', 'Yes, 7 is also Sunday in most implementations. Within a comma list, 0,6 and 6,7 both mean Sat+Sun — but do not mix 0 and 7 in ranges.'],
      ['Every Sunday specifically?', '<code>0 10 * * 0</code> — a single 0 in day-of-week gives you Sundays only.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-first-day-of-month',
    title: 'Cron First Day of the Month — Crontab Example',
    metaDesc: 'Run a cron job on the 1st of every month: 0 0 1 * *. Includes the @monthly shorthand and what happens when the server is down.',
    expr: '0 0 1 * *',
    plain: 'Runs at 00:00 (midnight) on the 1st of every month.',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '0', 'At midnight'],
      ['Day of month', '1', 'The 1st of the month'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Any day of the week'],
    ],
    variations: [
      ['59 23 L * *', 'Last day of the month', 'cron-last-day-of-month'],
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
      ['0 9 * * 1-5', 'Weekdays at 9:00 AM', 'cron-every-weekday-9am'],
    ],
    body: [
      'Month-start jobs (invoicing, cleanup, reporting cycles) restrict day-of-month to <code>1</code> and leave day-of-week wildcarded. Leaving day-of-week as <code>*</code> matters — the union trap means adding a day-of-week restriction would fire on extra days.',
      'The <code>@monthly</code> shorthand is exactly this expression.',
    ],
    code: '0 0 1 * * /usr/local/bin/monthly-invoice.sh',
    faq: [
      ['Is there an @monthly shorthand?', 'Yes — <code>@monthly</code> equals <code>0 0 1 * * *</code>… more precisely <code>0 0 1 * *</code>: midnight on the 1st.'],
      ['What if the 1st falls while the server is down?', 'The run is skipped for that month. If it must happen, have the job check its last success timestamp and catch up, or run nightly with an "is today the 1st?" guard.'],
      ['Can I run at 6 PM on the 1st instead?', 'Set the hour field: <code>0 18 1 * *</code> — minute 0, hour 18, day 1.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-last-day-of-month',
    title: 'Cron Last Day of the Month — Crontab Example',
    metaDesc: 'How to schedule a cron job on the last day of the month: the L syntax (59 23 L * *), which crons support it, and the portable daily-check fallback.',
    expr: '59 23 L * *',
    plain: 'Runs at 23:59 on the last day of the month (28th–31st, whichever applies).',
    fields: [
      ['Minute', '59', 'At minute 59'],
      ['Hour', '23', 'At 11 PM'],
      ['Day of month', 'L', 'The last day of the month'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Any day of the week'],
    ],
    variations: [
      ['0 0 1 * *', 'First day of the month', 'cron-first-day-of-month'],
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
      ['0 9 * * 1-5', 'Weekdays at 9:00 AM', 'cron-every-weekday-9am'],
    ],
    body: [
      'Cron has no native "last day" number because it varies (28–31). The <code>L</code> character in the day-of-month field solves this — but it is an extension supported by Cronie (most Linux distros), Quartz, and some cloud schedulers, not classic POSIX cron.',
      'The portable fallback is to run nightly and let the script decide whether tomorrow is the 1st:',
    ],
    code: '59 23 * * * [ "$(date -d tomorrow +\\%d)" = "01" ] && /usr/local/bin/month-end.sh',
    faq: [
      ['My cron rejected the L — why?', 'Your implementation predates the L extension. Check <code>man 5 crontab</code> for a "L" or "last" mention; if absent, use the daily-guard fallback shown above.'],
      ['Why is % doubled in the crontab line?', 'In crontab, a raw % starts the STDIN section of the command. Escape it as \\% whenever date/format strings need a literal percent sign.'],
      ['Is 23:59 chosen for a reason?', 'It keeps the run inside the last day. Midnight-plus-one (00:00) technically fires on the FIRST day of the next month — which breaks "last day" semantics for anything reading the date.'],
    ],
    tool: { href: '/tools/cron', label: 'Try schedules in the Cron Editor' },
  },

  {
    slug: 'cron-every-2-hours',
    title: 'Cron Every 2 Hours — Crontab Example',
    metaDesc: 'Run a cron job every 2 hours with 0 */2 * * *. Explanation, odd-hour offsets like 0 1-23/2, and how to avoid midnight spikes.',
    expr: '0 */2 * * *',
    plain: 'Runs at minute 0 of every 2nd hour (00:00, 02:00, 04:00, …).',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '*/2', 'Every 2nd hour (0, 2, 4, … 22)'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 * * * *', 'Every hour', 'cron-every-hour'],
      ['0 */3 * * *', 'Every 3 hours', 'cron-every-3-hours'],
      ['0 */6 * * *', 'Every 6 hours', 'cron-every-6-hours'],
    ],
    body: [
      'Every 2 hours is ideal for periodic cache refreshing, warmups, and intermediate database rollups. The step <code>*/2</code> in the hour field starts at 0, firing at 00:00, 02:00, 04:00, and so on.',
      'To fire on odd hours instead (01:00, 03:00, 05:00…), set a range before the step: <code>0 1-23/2 * * *</code>.',
    ],
    code: '0 */2 * * * /usr/local/bin/sync-cache.sh',
    faq: [
      ['How do I run on odd hours instead of even hours?', 'Use a range: <code>0 1-23/2 * * *</code> starts counting from 1 instead of 0.'],
      ['Does it run at midnight?', 'Yes, hour 0 is midnight. If you want to skip midnight, use an explicit list like <code>0 2,4,6,8,10,12,14,16,18,20,22 * * *</code>.'],
      ['Why minute 0 instead of *?', 'Writing <code>* */2 * * *</code> means every minute during those hours (60 runs per active hour). Always fix the minute field for hourly cadences.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-3-hours',
    title: 'Cron Every 3 Hours — Crontab Example',
    metaDesc: 'Schedule a cron job every 3 hours: 0 */3 * * *. Breakdown of the 8 daily execution times and offset options.',
    expr: '0 */3 * * *',
    plain: 'Runs at minute 0 every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00).',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '*/3', 'Every 3rd hour (0, 3, 6, 9, 12, 15, 18, 21)'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 */2 * * *', 'Every 2 hours', 'cron-every-2-hours'],
      ['0 */6 * * *', 'Every 6 hours', 'cron-every-6-hours'],
      ['0 */4 * * *', 'Every 4 hours', 'cron-every-4-hours'],
    ],
    body: [
      'Dividing the 24-hour day into 8 equal windows gives you runs at 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, and 21:00. This is popular for batch feeds and analytics checkpoints.',
    ],
    code: '0 */3 * * * /usr/local/bin/batch-check.sh',
    faq: [
      ['How do I offset by 15 minutes?', 'Change the minute field: <code>15 */3 * * *</code> fires at 00:15, 03:15, 06:15… avoiding :00 congestion.'],
      ['Can I run only during daytime?', 'Use an explicit range or list: <code>0 9-18/3 * * *</code> runs at 09:00, 12:00, 15:00, and 18:00.'],
      ['Is 0,3,6,9,12,15,18,21 the same as */3?', 'Yes, exactly identical. The step syntax <code>*/3</code> is the concise shorthand.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-4-hours',
    title: 'Cron Every 4 Hours — Crontab Example',
    metaDesc: 'Run a cron job every 4 hours: 0 */4 * * *. The 6 daily runs (00:00, 04:00, 08:00, 12:00, 16:00, 20:00) explained.',
    expr: '0 */4 * * *',
    plain: 'Runs 6 times a day — at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00.',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '*/4', 'Every 4th hour (0, 4, 8, 12, 16, 20)'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 */2 * * *', 'Every 2 hours', 'cron-every-2-hours'],
      ['0 */6 * * *', 'Every 6 hours', 'cron-every-6-hours'],
      ['0 */12 * * *', 'Every 12 hours', 'cron-every-12-hours'],
    ],
    body: [
      'A 4-hour cadence evenly splits a 24-hour day into 6 windows. It is standard for data synchronization, search index updates, and SSL certificate expiration checks.',
    ],
    code: '0 */4 * * * /usr/local/bin/refresh-feed.sh',
    faq: [
      ['Can I start at 02:00 instead of 00:00?', 'Yes — use <code>0 2-23/4 * * *</code> to fire at 02:00, 06:00, 10:00, 14:00, 18:00, 22:00.'],
      ['Does cron handle daylight saving changes here?', 'If your server runs on local time, DST transition days may duplicate or skip one run. Always use UTC on server infrastructure.'],
      ['How do I log output?', 'Append <code>>> /var/log/myjob.log 2>&1</code> to redirect both standard output and error output.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-6-hours',
    title: 'Cron Every 6 Hours — Crontab Example',
    metaDesc: 'The cron expression for every 6 hours: 0 */6 * * *. Runs 4 times a day at 00:00, 06:00, 12:00, 18:00.',
    expr: '0 */6 * * *',
    plain: 'Runs 4 times a day — at 00:00, 06:00, 12:00, 18:00.',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '*/6', 'Every 6th hour (0, 6, 12, 18)'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 */4 * * *', 'Every 4 hours', 'cron-every-4-hours'],
      ['0 */12 * * *', 'Every 12 hours', 'cron-every-12-hours'],
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
    ],
    body: [
      'Running 4 times daily (midnight, 6 AM, noon, 6 PM), this expression provides a steady pulse for heavy ETL jobs, anti-virus definition updates, and snapshot backups.',
    ],
    code: '0 */6 * * * /usr/local/bin/db-snapshot.sh',
    faq: [
      ['Can I run at 03:00, 09:00, 15:00, 21:00?', 'Yes: use <code>0 3-23/6 * * *</code> to shift the entire schedule by 3 hours.'],
      ['Is this expression supported on all Linux distros?', 'Yes. The step syntax */6 is supported by Vixie cron, Cronie, systemd timers, and modern cloud schedulers.'],
      ['What if a run takes 7 hours?', 'A second instance will launch. Protect against overlapping runs using <code>flock -n /tmp/job.lock</code>.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-12-hours',
    title: 'Cron Every 12 Hours — Crontab Example',
    metaDesc: 'Schedule a cron job twice a day: 0 */12 * * *. Runs at 00:00 and 12:00 (midnight and noon).',
    expr: '0 */12 * * *',
    plain: 'Runs twice a day — at 00:00 (midnight) and 12:00 (noon).',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '*/12', 'Hours 0 and 12'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 0,12 * * *', 'Explicit list syntax (identical)', 'cron-daily-at-midnight-and-noon'],
      ['0 */6 * * *', 'Every 6 hours', 'cron-every-6-hours'],
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
    ],
    body: [
      'Twice-daily schedules divide day and night cleanly. The expressions <code>0 */12 * * *</code> and <code>0 0,12 * * *</code> are completely equivalent.',
      'If you prefer to align with business hours (such as 9 AM and 6 PM), use an explicit list: <code>0 9,18 * * *</code>.',
    ],
    code: '0 */12 * * * /usr/local/bin/sync-external.sh',
    faq: [
      ['Is 0 */12 * * * identical to 0 0,12 * * *?', 'Yes, both fire at 00:00 and 12:00.'],
      ['How to run at 6 AM and 6 PM instead?', 'Write <code>0 6,18 * * *</code>.'],
      ['Does it run on weekends?', 'Yes, the day-of-week field is wildcarded (*). To run only on weekdays, change the last field to 1-5.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-2-minutes',
    title: 'Cron Every 2 Minutes — Crontab Example',
    metaDesc: 'Run a cron job every 2 minutes with */2 * * * *. Explanation of 30 runs per hour and overlap safety.',
    expr: '*/2 * * * *',
    plain: 'Runs every 2 minutes — at minutes 0, 2, 4, 6, … 58 of every hour.',
    fields: [
      ['Minute', '*/2', 'Every 2nd minute (0, 2, 4, … 58)'],
      ['Hour', '*', 'Every hour'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['* * * * *', 'Every minute', 'cron-every-minute'],
      ['*/5 * * * *', 'Every 5 minutes', 'cron-every-5-minutes'],
      ['*/10 * * * *', 'Every 10 minutes', 'cron-every-10-minutes'],
    ],
    body: [
      'Frequent 2-minute polling is suitable for payment webhooks, queue dispatching, or critical server telemetry checks. It runs 720 times per day.',
    ],
    code: '*/2 * * * * flock -n /tmp/poll.lock /usr/local/bin/queue-worker.sh',
    faq: [
      ['Can I run on odd minutes (1, 3, 5…)?', 'Yes — specify a range: <code>1-59/2 * * * *</code>.'],
      ['Is flock mandatory?', 'Highly recommended. If any task takes longer than 120 seconds, flock ensures the next invocation exits immediately rather than accumulating duplicate processes.'],
      ['How many times does this run daily?', 'Exactly 720 times (30 runs per hour × 24 hours).'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-20-minutes',
    title: 'Cron Every 20 Minutes — Crontab Example',
    metaDesc: 'The cron expression for every 20 minutes: */20 * * * *. Fires at :00, :20, and :40 past every hour.',
    expr: '*/20 * * * *',
    plain: 'Runs every 20 minutes — at minutes 0, 20, and 40 of every hour.',
    fields: [
      ['Minute', '*/20', 'Minutes 0, 20, 40'],
      ['Hour', '*', 'Every hour'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['*/10 * * * *', 'Every 10 minutes', 'cron-every-10-minutes'],
      ['*/15 * * * *', 'Every 15 minutes', 'cron-every-15-minutes'],
      ['*/30 * * * *', 'Every 30 minutes', 'cron-every-30-minutes'],
    ],
    body: [
      'Firing 3 times per hour, the 20-minute interval is a sweet spot between aggressive 5-minute polling and slow hourly sweeps. It is often used for feed aggregators and status checks.',
    ],
    code: '*/20 * * * * /usr/local/bin/sync-feeds.sh',
    faq: [
      ['Is 0,20,40 * * * * equivalent?', 'Yes, the comma-separated list and */20 yield the exact same 3 execution times per hour.'],
      ['How do I run at :10, :30, :50?', 'Use a ranged step: <code>10-59/20 * * * *</code>.'],
      ['Can I restrict to working hours?', 'Yes: <code>*/20 9-17 * * 1-5</code> runs every 20 minutes between 9 AM and 5:59 PM on weekdays.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-twice-a-day',
    title: 'Cron Twice a Day — 9 AM & 6 PM Schedule',
    metaDesc: 'How to run a cron job twice daily at specific business hours like 9 AM and 6 PM using 0 9,18 * * *.',
    expr: '0 9,18 * * *',
    plain: 'Runs twice a day — at 09:00 (morning) and 18:00 (evening).',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '9,18', 'At 9 AM and 6 PM (18:00)'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 */12 * * *', 'Every 12 hours (00:00 & 12:00)', 'cron-every-12-hours'],
      ['0 0,12 * * *', 'Midnight and noon', 'cron-daily-at-midnight-and-noon'],
      ['0 9 * * 1-5', 'Weekdays at 9 AM', 'cron-every-weekday-9am'],
    ],
    body: [
      'While <code>*/12</code> splits the clock at midnight and noon, most human-centric workflows need morning and evening syncs. Using a comma-separated list in the hour field (<code>9,18</code>) lets you target specific business hours.',
    ],
    code: '0 9,18 * * * /usr/local/bin/daily-digest.sh',
    faq: [
      ['Can I pick different hours like 8 AM and 5 PM?', 'Yes: simply change the hour field to <code>8,17</code>.'],
      ['How do I run this only on weekdays?', 'Change day-of-week to 1-5: <code>0 9,18 * * 1-5</code>.'],
      ['Does cron support AM/PM syntax?', 'No, standard cron requires 24-hour notation (0 to 23). 6 PM must be written as 18.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-daily-at-1am',
    title: 'Cron Daily at 1 AM — Crontab Example',
    metaDesc: 'Schedule a cron job daily at 1:00 AM: 0 1 * * *. Why 1 AM is preferred over midnight for heavy database backups.',
    expr: '0 1 * * *',
    plain: 'Runs once every day at 01:00 AM.',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '1', 'At 1 AM'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
      ['0 8 * * *', 'Daily at 8 AM', 'cron-daily-at-8am'],
      ['0 9 * * 1-5', 'Weekdays at 9 AM', 'cron-every-weekday-9am'],
    ],
    body: [
      'System administrators frequently choose 01:00 AM over midnight (00:00) because midnight is crowded with log rotation, billing rollups, and default system maintenance jobs. Shifting your backup window to 1 AM drastically reduces I/O contention.',
    ],
    code: '0 1 * * * /usr/local/bin/nightly-backup.sh',
    faq: [
      ['Why schedule backups at 1 AM instead of midnight?', 'Midnight is the default for automated OS tasks. Staggering your task to 1 AM gives lower CPU and disk load.'],
      ['What happens during daylight saving time (fall back)?', 'On fall-back day, 01:00 AM may occur twice in local timezones. Running your server in UTC eliminates this issue.'],
      ['How do I run at 1:30 AM instead?', 'Change the minute field: <code>30 1 * * *</code>.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-daily-at-8am',
    title: 'Cron Daily at 8 AM — Crontab Example',
    metaDesc: 'Run a cron job every morning at 8:00 AM: 0 8 * * *. Perfect for daily briefings, health reports, and morning syncs.',
    expr: '0 8 * * *',
    plain: 'Runs every morning at 08:00 AM.',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '8', 'At 8 AM'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 9 * * 1-5', 'Weekdays at 9 AM', 'cron-every-weekday-9am'],
      ['0 12 * * *', 'Daily at noon', 'cron-daily-at-noon'],
      ['0 1 * * *', 'Daily at 1 AM', 'cron-daily-at-1am'],
    ],
    body: [
      'An 8 AM trigger prepares reports, notification digests, and system warmups before standard office hours begin. It ensures data is ready when teams log in.',
    ],
    code: '0 8 * * * /usr/local/bin/morning-prep.sh',
    faq: [
      ['Can I run only Monday through Friday?', 'Yes: replace the final field with <code>1-5</code> (i.e. <code>0 8 * * 1-5</code>).'],
      ['How to run at 8:15 AM?', 'Set minute to 15: <code>15 8 * * *</code>.'],
      ['How to make sure the script ran successfully?', 'Check system mail or redirect output to a webhook (e.g. Slack/Discord) upon completion.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-daily-at-noon',
    title: 'Cron Daily at Noon — Crontab Example',
    metaDesc: 'The cron expression for daily at noon: 0 12 * * *. Explanation, lunch-hour syncs, and timezone configuration.',
    expr: '0 12 * * *',
    plain: 'Runs once every day at 12:00 PM (midday).',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '12', 'At 12 PM (noon)'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
      ['0 0,12 * * *', 'Midnight and noon', 'cron-daily-at-midnight-and-noon'],
      ['0 8 * * *', 'Daily at 8 AM', 'cron-daily-at-8am'],
    ],
    body: [
      'Running at 12:00 PM every day provides a midday synchronization point for teams, daily stock tickers, and mid-shift reports.',
    ],
    code: '0 12 * * * /usr/local/bin/midday-sync.sh',
    faq: [
      ['Is 12 in cron noon or midnight?', '12 is noon (12:00 PM). Hour 0 is midnight (00:00).'],
      ['How to run at 12:30 PM?', 'Set minute to 30: <code>30 12 * * *</code>.'],
      ['Does it run on weekends too?', 'Yes, the day-of-week field is *. Use <code>0 12 * * 1-5</code> for weekdays only.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-daily-at-midnight-and-noon',
    title: 'Cron Midnight and Noon — Crontab Example',
    metaDesc: 'Run a cron job twice daily at 00:00 and 12:00: 0 0,12 * * *. Explicit list format explained.',
    expr: '0 0,12 * * *',
    plain: 'Runs twice daily — at 00:00 (midnight) and 12:00 (noon).',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '0,12', 'At 00:00 and 12:00'],
      ['Day of month', '*', 'Every day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Every day of the week'],
    ],
    variations: [
      ['0 */12 * * *', 'Step syntax (identical)', 'cron-every-12-hours'],
      ['0 9,18 * * *', 'Twice a day (9 AM & 6 PM)', 'cron-twice-a-day'],
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
    ],
    body: [
      'The expression <code>0 0,12 * * *</code> clearly states both target hours in a list. It is identical in execution to <code>0 */12 * * *</code> but many engineers prefer the explicit hour listing for readability.',
    ],
    code: '0 0,12 * * * /usr/local/bin/half-day-rollup.sh',
    faq: [
      ['Why use 0,12 instead of */12?', 'Both work identically. Writing 0,12 makes the exact hours immediately obvious without mental step calculation.'],
      ['Can I add a third time, like 6 PM?', 'Yes: simply write <code>0 0,12,18 * * *</code>.'],
      ['Can I offset the minutes?', 'Yes: <code>15 0,12 * * *</code> fires at 00:15 and 12:15.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-sunday-midnight',
    title: 'Cron Every Sunday at Midnight — Crontab Example',
    metaDesc: 'Schedule a weekly job on Sunday at midnight: 0 0 * * 0. Equivalent to @weekly and ideal for weekly maintenance.',
    expr: '0 0 * * 0',
    plain: 'Runs once a week on Sunday at 00:00 (midnight).',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '0', 'At midnight (00:00)'],
      ['Day of month', '*', 'Every day of the month'],
      ['Month', '*', 'Every month'],
      ['Day of week', '0', 'Sunday only'],
    ],
    variations: [
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
      ['0 9 * * 1', 'Every Monday at 9 AM', 'cron-every-monday-9am'],
      ['0 10 * * 6,0', 'Weekends at 10 AM', 'cron-weekends-only'],
    ],
    body: [
      'Sunday midnight is the standard timestamp for weekly rollups, log archives, and database vacuuming. The shorthand <code>@weekly</code> expands to this exact schedule.',
    ],
    code: '0 0 * * 0 /usr/local/bin/weekly-maintenance.sh',
    faq: [
      ['Is 0 0 * * 7 the same as 0 0 * * 0?', 'Yes, in most implementations both 0 and 7 represent Sunday. However, 0 is the POSIX standard.'],
      ['Is @weekly identical to 0 0 * * 0?', 'Yes, @weekly is the standardized shorthand.'],
      ['What if I want Sunday at 11 PM?', 'Write <code>0 23 * * 0</code>.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-monday-9am',
    title: 'Cron Every Monday at 9 AM — Crontab Example',
    metaDesc: 'Run a cron job every Monday morning at 9:00 AM: 0 9 * * 1. Perfect for weekly team digests and planning triggers.',
    expr: '0 9 * * 1',
    plain: 'Runs once a week on Monday at 09:00 AM.',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '9', 'At 9 AM'],
      ['Day of month', '*', 'Every day of the month'],
      ['Month', '*', 'Every month'],
      ['Day of week', '1', 'Monday only'],
    ],
    variations: [
      ['0 9 * * 1-5', 'Weekdays at 9 AM', 'cron-every-weekday-9am'],
      ['0 0 * * 0', 'Sunday at midnight', 'cron-every-sunday-midnight'],
      ['0 17 * * 5', 'Friday at 5 PM', 'cron-every-friday-5pm'],
    ],
    body: [
      'Kickstart the work week with an automated Monday 9:00 AM trigger. It is widely used to send weekly task digests, generate sprint planning metrics, or wake up staging servers.',
    ],
    code: '0 9 * * 1 /usr/local/bin/weekly-kickoff.sh',
    faq: [
      ['Can I write MON instead of 1?', 'Yes in Vixie cron and Cronie: <code>0 9 * * MON</code>.'],
      ['How do I run on Monday and Wednesday?', 'Use a list in the day-of-week field: <code>0 9 * * 1,3</code>.'],
      ['What if Monday is a public holiday?', 'Cron does not check holidays. Use an internal script guard to skip execution on bank holidays.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-friday-5pm',
    title: 'Cron Every Friday at 5 PM — Crontab Example',
    metaDesc: 'Schedule a cron job every Friday at 5:00 PM: 0 17 * * 5. End-of-week reports, timesheet reminders, and weekly summaries.',
    expr: '0 17 * * 5',
    plain: 'Runs once a week on Friday at 17:00 (5:00 PM).',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '17', 'At 5 PM (17:00)'],
      ['Day of month', '*', 'Every day of the month'],
      ['Month', '*', 'Every month'],
      ['Day of week', '5', 'Friday only'],
    ],
    variations: [
      ['0 9 * * 1', 'Monday at 9 AM', 'cron-every-monday-9am'],
      ['0 9 * * 1-5', 'Weekdays at 9 AM', 'cron-every-weekday-9am'],
      ['0 0 * * 0', 'Sunday at midnight', 'cron-every-sunday-midnight'],
    ],
    body: [
      'Friday 5:00 PM (17:00 in 24-hour time) is the classic end-of-week trigger for timesheet reminders, weekly sprint summaries, and staging server shutdown scripts.',
    ],
    code: '0 17 * * 5 /usr/local/bin/friday-summary.sh',
    faq: [
      ['Why 17 instead of 5?', 'Cron uses 24-hour format (0 to 23). Writing 5 would mean 5:00 AM in the morning.'],
      ['Can I write FRI instead of 5?', 'Yes, most modern crons accept <code>0 17 * * FRI</code>.'],
      ['How to run at 4:30 PM on Friday?', 'Set minute to 30 and hour to 16: <code>30 16 * * 5</code>.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-every-month-on-the-15th',
    title: 'Cron on the 15th of Every Month — Crontab Example',
    metaDesc: 'Schedule a cron job on the 15th of each month at midnight: 0 0 15 * *. Ideal for mid-month billing and payroll checks.',
    expr: '0 0 15 * *',
    plain: 'Runs at 00:00 (midnight) on the 15th day of every month.',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '0', 'At midnight (00:00)'],
      ['Day of month', '15', 'On the 15th day'],
      ['Month', '*', 'Every month'],
      ['Day of week', '*', 'Any day of the week'],
    ],
    variations: [
      ['0 0 1 * *', '1st day of the month', 'cron-first-day-of-month'],
      ['59 23 L * *', 'Last day of the month', 'cron-last-day-of-month'],
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
    ],
    body: [
      'Mid-month billing cycles, bi-weekly payroll reconciliations, and intermediate audits frequently anchor on the 15th day of the month. Keep day-of-week wildcarded (*) to avoid the union trap.',
    ],
    code: '0 0 15 * * /usr/local/bin/midmonth-payroll.sh',
    faq: [
      ['Can I run on the 1st and the 15th?', 'Yes: use a comma list in the day-of-month field: <code>0 0 1,15 * *</code>.'],
      ['What if the 15th falls on a weekend?', 'Standard cron runs regardless of whether it is a weekend. If you want the nearest weekday, add a check inside your shell script.'],
      ['How do I run at noon on the 15th?', 'Set the hour to 12: <code>0 12 15 * *</code>.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-quarterly',
    title: 'Cron Quarterly (Every 3 Months) — Crontab Example',
    metaDesc: 'Schedule a quarterly cron job: 0 0 1 1,4,7,10 *. Runs on the 1st of January, April, July, and October at midnight.',
    expr: '0 0 1 1,4,7,10 *',
    plain: 'Runs on the 1st of January, April, July, and October at 00:00 (midnight).',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '0', 'At midnight (00:00)'],
      ['Day of month', '1', '1st day of the month'],
      ['Month', '1,4,7,10', 'January, April, July, October (Q1, Q2, Q3, Q4)'],
      ['Day of week', '*', 'Any day of the week'],
    ],
    variations: [
      ['0 0 1 * *', 'Every month on the 1st', 'cron-first-day-of-month'],
      ['0 0 1 1 *', 'Yearly on Jan 1st', 'cron-yearly-jan-1st'],
      ['0 0 * * 0', 'Weekly on Sunday', 'cron-every-sunday-midnight'],
    ],
    body: [
      'Quarterly cycles (financial quarters Q1, Q2, Q3, Q4) start on January 1, April 1, July 1, and October 1. Listing months <code>1,4,7,10</code> or writing <code>1-12/3</code> gives you this clean 4-times-a-year trigger.',
    ],
    code: '0 0 1 1,4,7,10 * /usr/local/bin/quarterly-tax-report.sh',
    faq: [
      ['Is 1,4,7,10 the same as 1-12/3?', 'Yes, 1-12/3 starts at month 1 and steps every 3 months (1, 4, 7, 10). Both are valid.'],
      ['Can I run at the end of each quarter instead?', 'End-of-quarter months are March (31), June (30), September (30), and December (31). Because day counts differ, run on the 1st of the following quarter or use a script check.'],
      ['Does cron have an @quarterly shorthand?', 'No standard @quarterly shorthand exists in POSIX cron; use the explicit expression.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },

  {
    slug: 'cron-yearly-jan-1st',
    title: 'Cron Yearly on January 1st — Crontab Example',
    metaDesc: 'Run an annual cron job on January 1st at midnight: 0 0 1 1 *. Equivalent to @yearly or @annually.',
    expr: '0 0 1 1 *',
    plain: 'Runs once a year on January 1st at 00:00 (midnight).',
    fields: [
      ['Minute', '0', 'At minute 0'],
      ['Hour', '0', 'At midnight (00:00)'],
      ['Day of month', '1', '1st day'],
      ['Month', '1', 'January only'],
      ['Day of week', '*', 'Any day of the week'],
    ],
    variations: [
      ['0 0 1 1,4,7,10 *', 'Quarterly schedule', 'cron-quarterly'],
      ['0 0 1 * *', 'Monthly on the 1st', 'cron-first-day-of-month'],
      ['0 0 * * *', 'Daily at midnight', 'cron-daily-midnight'],
    ],
    body: [
      'Annual tasks like archival partitions, copyright year updates, and yearly summary generation execute on January 1st at midnight. The shorthands <code>@yearly</code> and <code>@annually</code> represent this exact expression.',
    ],
    code: '0 0 1 1 * /usr/local/bin/annual-archive.sh',
    faq: [
      ['Are @yearly and @annually identical?', 'Yes, both shorthands expand to <code>0 0 1 1 *</code>.'],
      ['What if the server is offline at Jan 1 00:00?', 'The job will not run until the next year unless you use anacron or an internal catch-up check.'],
      ['How do I run on December 31 at 23:59 instead?', 'Write <code>59 23 31 12 *</code>.'],
    ],
    tool: { href: '/tools/cron', label: 'Try this schedule in the Cron Editor' },
  },
];

export const GIT_RECIPES = [
  {
    slug: 'git-undo-last-commit',
    title: 'Git Undo Last Commit — 3 Safe Ways',
    metaDesc: 'Undo your last Git commit without losing work: git reset --soft/--mixed/--hard compared, when amend is better, and how reflog saves you from mistakes.',
    intro: 'Undoing the last commit has three flavors — the difference is what happens to your changes. Pick by how much you want to keep.',
    tables: [
      {
        caption: 'The three resets',
        headers: ['Command', 'Changes in the commit', 'Use when'],
        rows: [
          ['git reset --soft HEAD~1', 'Kept, still staged', 'You want to re-commit with a different message or grouping'],
          ['git reset HEAD~1', 'Kept, unstaged', 'You want to re-stage selectively'],
          ['git reset --hard HEAD~1', 'Deleted', 'The commit was garbage and so is its content'],
        ],
      },
      {
        caption: 'Related moves',
        headers: ['Command', 'Does'],
        rows: [
          ['git commit --amend -m "better message"', 'Rewrite the last commit instead of undoing it'],
          ['git reflog', 'Time machine — find any commit HEAD has ever pointed to'],
          ['git revert <sha>', 'Undo a commit that was already pushed (safe on shared branches)'],
        ],
      },
    ],
    faq: [
      ['I ran --hard by mistake — is my work gone?', 'Probably not. <code>git reflog</code> lists every position HEAD has held; find the commit before the reset and <code>git reset --hard HEAD@{n}</code> back to it. Reflog entries live for ~90 days.'],
      ['Can I undo a pushed commit with reset?', 'Do not. Rewriting shared history forces everyone to fix their clones. Use <code>git revert <sha></code> — it creates a new commit that undoes the old one cleanly.'],
      ['reset vs revert in one line?', 'reset rewrites history (local work only); revert adds new history (safe to share).'],
    ],
    tool: { href: '/tools/git', label: 'Generate the exact command in the Git Builder' },
  },

  {
    slug: 'git-discard-local-changes',
    title: 'Git Discard Local Changes — Safely and Completely',
    metaDesc: 'Discard uncommitted changes in Git: git restore for tracked files, git clean for untracked files, dry-run flags first, and what is actually recoverable.',
    intro: 'Throwing away uncommitted work is the one Git action with no built-in undo — so it pays to know exactly which command throws away what.',
    tables: [
      {
        caption: 'Tracked files (modified but not committed)',
        headers: ['Command', 'Effect'],
        rows: [
          ['git restore <file>', 'Discard changes in one file'],
          ['git restore .', 'Discard changes in the entire working tree'],
          ['git restore --staged <file>', 'Keep changes, just unstage them'],
        ],
      },
      {
        caption: 'Untracked files (new files Git is not watching)',
        headers: ['Command', 'Effect'],
        rows: [
          ['git clean -n', 'DRY RUN — list what would be deleted (always start here)'],
          ['git clean -fd', 'Delete untracked files and directories'],
          ['git clean -fdx', 'Also delete ignored files (node_modules, .env…) — extra careful'],
        ],
      },
    ],
    faq: [
      ['restore vs the old checkout -- ?', 'Same effect; restore arrived in Git 2.23 to split checkout\'s overloaded jobs. checkout still works but restore is clearer.'],
      ['Can I recover discarded changes?', 'Tracked-file discards: sometimes, via <code>git fsck --lost-found</code> (dangling blobs) or your IDE\'s local history. Untracked files removed by clean: gone, unless your editor kept copies.'],
      ['How do I discard only SOME changes in a file?', '<code>git restore -p <file></code> walks you through hunk by hunk, y/n per change.'],
    ],
    tool: { href: '/tools/git', label: 'Build the discard workflow in the Git Builder' },
  },

  {
    slug: 'git-delete-branch',
    title: 'Git Delete a Branch — Local and Remote',
    metaDesc: 'Delete Git branches safely: -d vs -D, removing remote branches, pruning stale references, and why merged branches are the only easy deletes.',
    intro: 'Deleting a branch removes a pointer, not (usually) commits — Git garbage-collects commits only when they become unreachable.',
    tables: [
      {
        caption: 'Local branches',
        headers: ['Command', 'Effect'],
        rows: [
          ['git branch -d <name>', 'Delete — refuses if the branch has unmerged work'],
          ['git branch -D <name>', 'Force delete — even with unmerged work (the work becomes unreachable)'],
          ['git branch -a', 'List all branches, local and remote-tracking'],
        ],
      },
      {
        caption: 'Remote branches',
        headers: ['Command', 'Effect'],
        rows: [
          ['git push origin --delete <name>', 'Delete the branch on the remote'],
          ['git fetch --prune', 'Clean up local references to remote branches that were deleted elsewhere'],
        ],
      },
    ],
    faq: [
      ['-d refused my delete — why?', 'The branch contains commits not merged anywhere. If you are certain they are worthless, -D overrides; otherwise merge or rebase first.'],
      ['The branch still shows after deletion — why?', 'Your local remote-tracking reference is stale. <code>git fetch --prune</code> (or <code>git remote prune origin</code>) syncs the list.'],
      ['Can I delete main/master?', 'Git will refuse the branch you are on; the remote side is usually protected by the host. Feature branches are the ones meant to be deleted.'],
    ],
    tool: { href: '/tools/git', label: 'Generate branch commands in the Git Builder' },
  },

  {
    slug: 'git-stash-changes',
    title: 'Git Stash — Park Changes Without Committing',
    metaDesc: 'Use git stash to park uncommitted work: stash, pop, apply, list, drop, untracked files with -u, and stacking multiple stashes.',
    intro: 'Stash shelves your uncommitted changes and gives you a clean working tree — perfect for "I need to fix something else first".',
    tables: [
      {
        caption: 'Core stash workflow',
        headers: ['Command', 'Effect'],
        rows: [
          ['git stash', 'Park all tracked-file changes; working tree becomes clean'],
          ['git stash pop', 'Bring the latest stash back and remove it from the stack'],
          ['git stash apply', 'Bring it back but keep a copy in the stack'],
          ['git stash list', 'Show parked stashes (stash@{0} is newest)'],
          ['git stash drop stash@{1}', 'Delete a specific stash entry'],
        ],
      },
      {
        caption: 'Useful options',
        headers: ['Command', 'Effect'],
        rows: [
          ['git stash -u', 'Include untracked files (ignored files need -a)'],
          ['git stash push -m "wip: login bug"', 'Give the stash a memorable name'],
          ['git stash pop stash@{2}', 'Restore a specific (older) stash'],
        ],
      },
    ],
    faq: [
      ['Does stash include new (untracked) files?', 'Not by default — stash only touches tracked files. Add <code>-u</code> to include untracked files, <code>-a</code> to include ignored ones too.'],
      ['Can I stash on one branch and pop on another?', 'Yes — a stash is branch-agnostic. Pop it wherever the changes belong; conflicts are resolved like a merge.'],
      ['Stash or branch?', 'Stash for minutes-to-hours parking; a real branch for anything that might survive past today. Stashes are easy to forget and painfully easy to drop.'],
    ],
    tool: { href: '/tools/git', label: 'Generate stash commands in the Git Builder' },
  },

  {
    slug: 'git-amend-last-commit',
    title: 'Git Amend the Last Commit',
    metaDesc: 'Fix the last commit with git commit --amend: change the message, add forgotten files, keep the author date, and the force-with-lease rule for pushed commits.',
    intro: 'Amend replaces the last commit with a corrected version — same changes plus whatever you fix up. It is the tidy alternative to "oops" commits.',
    tables: [
      {
        caption: 'Amend patterns',
        headers: ['Command', 'Effect'],
        rows: [
          ['git commit --amend -m "new message"', 'Rewrite just the message'],
          ['git add forgotten.txt && git commit --amend --no-edit', 'Fold a forgotten file into the commit, keep the message'],
          ['git commit --amend --reset-author', 'Update the author timestamp/name to now'],
        ],
      },
      {
        caption: 'If the commit was already pushed',
        headers: ['Command', 'Effect'],
        rows: [
          ['git push --force-with-lease', 'Force-push, but abort if someone else pushed in between (safer than --force)'],
          ['git push', 'Rejected — a rewritten commit has a different SHA, the remote wants a force'],
        ],
      },
    ],
    faq: [
      ['I amended a pushed commit — now what?', 'You rewrote history: push with <code>--force-with-lease</code> (never bare --force) and warn collaborators to rebase their local copies. On protected branches, prefer a follow-up fix commit.'],
      ['Does amend change the commit date?', 'The author date is kept by default; the committer date becomes now. Add --reset-author if you want both refreshed.'],
      ['Amend vs fixup?', '--amend fixes the TOP commit interactively. For older commits, use <code>git rebase -i</code> and mark commits as fixup/squash.'],
    ],
    tool: { href: '/tools/git', label: 'Generate amend & push commands in the Git Builder' },
  },

  {
    slug: 'git-revert-pushed-commit',
    title: 'Undo a Pushed Commit — The Safe Way (git revert)',
    metaDesc: 'Safely undo a commit that was already pushed: git revert creates an inverse commit instead of rewriting history — plus reverting merges and multi-commit ranges.',
    intro: 'Once a commit is on a shared branch, do not rewrite history — add history. <code>git revert</code> computes the exact opposite of a commit and commits that, so nobody\'s clone breaks.',
    tables: [
      {
        caption: 'Revert patterns',
        headers: ['Command', 'Effect'],
        rows: [
          ['git revert <sha>', 'Create a new commit undoing exactly that commit'],
          ['git revert <old>..<new>', 'Revert a range of commits, oldest first'],
          ['git revert -m 1 <merge-sha>', 'Undo a merge commit (1 = keep the branch you merged INTO)'],
          ['git push', 'Share the revert like any normal commit — no force needed'],
        ],
      },
    ],
    faq: [
      ['revert vs reset — the decision rule?', 'Unpushed and private: reset is fine. Pushed or shared: revert, always. Resetting shared branches forces every collaborator to untangle their copies.'],
      ['Why does reverting a merge need -m 1?', 'A merge has two parents; Git needs to know which line of history to keep. -m 1 keeps the branch you were on (usually main) and undoes the merged-in side.'],
      ['What if I revert and then want the change back?', 'Revert the revert — or cherry-pick the original commit again. History stays additive either way.'],
    ],
    tool: { href: '/tools/git', label: 'Generate revert commands in the Git Builder' },
  },

  {
    slug: 'git-rename-local-branch',
    title: 'Git Rename Local Branch — Safely & Quickly',
    metaDesc: 'How to rename a local Git branch: git branch -m for current branch and renaming other branches without checking them out.',
    intro: 'Renaming a local branch changes its pointer in .git/refs/heads. It is safe, instant, and does not touch your commit history.',
    tables: [
      {
        caption: 'Rename commands',
        headers: ['Command', 'Effect'],
        rows: [
          ['git branch -m <new-name>', 'Rename the branch you are currently on'],
          ['git branch -m <old-name> <new-name>', 'Rename any branch without switching to it first'],
          ['git branch -M <new-name>', 'Force rename — even if new-name already exists'],
        ],
      },
    ],
    faq: [
      ['Does renaming a local branch affect the remote?', 'No. Renaming locally only changes your local ref. To update GitHub/GitLab, push the new name and delete the old remote branch.'],
      ['What if -m fails with "already exists"?', 'If you are certain you want to overwrite an existing branch, use capital <code>-M</code>.'],
      ['How do I verify the rename worked?', 'Run <code>git branch --show-current</code> to inspect your active branch name.'],
    ],
    tool: { href: '/tools/git', label: 'Build branch commands in the Git Builder' },
  },

  {
    slug: 'git-rename-remote-branch',
    title: 'Git Rename Remote Branch — Complete 3-Step Process',
    metaDesc: 'How to rename a remote Git branch: push the new branch, delete the old remote branch, and reset tracking references.',
    intro: 'Git has no direct "remote rename" command. The standard workflow is pushing the new branch name, setting upstream tracking, and deleting the old remote branch.',
    tables: [
      {
        caption: 'Complete 3-step remote rename workflow',
        headers: ['Command', 'Step Description'],
        rows: [
          ['git branch -m <old> <new>', '1. Rename the branch locally'],
          ['git push origin -u <new>', '2. Push new branch and reset upstream tracking'],
          ['git push origin --delete <old>', '3. Delete old branch on remote repository'],
        ],
      },
    ],
    faq: [
      ['Will this close existing Pull Requests?', 'Yes. If a PR was opened against the old branch name, renaming or deleting it closes or breaks the PR. Merge or update PR target first.'],
      ['What should teammates do after a remote rename?', 'Collaborators should run: <code>git fetch --prune</code> and <code>git checkout -b <new> origin/<new></code>.'],
      ['Can I rename the default branch (main/master)?', 'Yes, but change the default branch setting in your GitHub/GitLab repository settings first before deleting the old one.'],
    ],
    tool: { href: '/tools/git', label: 'Generate remote branch commands in the Git Builder' },
  },

  {
    slug: 'git-cherry-pick-commit',
    title: 'Git Cherry Pick — Apply a Specific Commit Elsewhere',
    metaDesc: 'How to use git cherry-pick: copy a single commit or range onto your current branch, resolve conflicts, and skip unwanted commits.',
    intro: 'Cherry-picking copies the diff introduced by a specific commit from one branch and commits it directly onto your current branch with a new SHA.',
    tables: [
      {
        caption: 'Cherry pick commands',
        headers: ['Command', 'Effect'],
        rows: [
          ['git cherry-pick <sha>', 'Apply a single commit onto current branch'],
          ['git cherry-pick <sha-1> <sha-2>', 'Apply multiple specific commits in sequence'],
          ['git cherry-pick <old>..<new>', 'Apply a range of commits (exclusive of old)'],
          ['git cherry-pick -n <sha>', 'Apply diff into working tree without committing (-n / --no-commit)'],
        ],
      },
      {
        caption: 'Handling conflicts during cherry pick',
        headers: ['Command', 'Action'],
        rows: [
          ['git cherry-pick --continue', 'Resume cherry-pick after resolving conflicts and staging files'],
          ['git cherry-pick --abort', 'Cancel cherry-pick and restore branch to pre-pick state'],
          ['git cherry-pick --skip', 'Skip the current problematic commit in a multi-commit pick'],
        ],
      },
    ],
    faq: [
      ['Does cherry-pick delete the commit from the original branch?', 'No. Cherry-pick duplicates the changes. The original commit stays completely untouched on its source branch.'],
      ['Why does cherry-pick give a new commit SHA?', 'Because commit SHAs are hashes of their tree, message, timestamp, AND parent commit. Changing parents means a new SHA.'],
      ['What if I cherry-pick an already merged commit?', 'Git detects an empty patch and prompts you to skip it with <code>git cherry-pick --skip</code>.'],
    ],
    tool: { href: '/tools/git', label: 'Try cherry-pick in the Git Builder' },
  },

  {
    slug: 'git-squash-last-n-commits',
    title: 'Git Squash Last N Commits — Combine Multiple Commits',
    metaDesc: 'How to squash the last N commits in Git: using git reset --soft HEAD~N or interactive rebase git rebase -i HEAD~N.',
    intro: 'Squashing combines messy "wip", "typo", and "fix" commits into a single clean commit before merging into main or opening a pull request.',
    tables: [
      {
        caption: 'Two approaches to squashing',
        headers: ['Approach', 'Commands', 'Best For'],
        rows: [
          ['Soft Reset', 'git reset --soft HEAD~N && git commit -m "feat: clean message"', 'Quickly squashing the top N commits into one'],
          ['Interactive Rebase', 'git rebase -i HEAD~N (mark top as pick, others as squash)', 'Selective squashing, reordering, or editing messages'],
        ],
      },
    ],
    faq: [
      ['What is the difference between soft reset and rebase -i for squashing?', 'Soft reset collapses everything in one step without prompts. Interactive rebase gives you full control to reorder, squash, or drop individual commits.'],
      ['Can I squash commits that were already pushed?', 'Only on private feature branches. If pushed, you must push with <code>--force-with-lease</code>. Never squash on shared branches.'],
      ['How to squash all commits on a feature branch against main?', 'Run <code>git reset $(git merge-base main HEAD)</code> and commit.'],
    ],
    tool: { href: '/tools/git', label: 'Build squash workflows in the Git Builder' },
  },

  {
    slug: 'git-sync-fork',
    title: 'Git Sync Fork with Upstream — Step-by-Step',
    metaDesc: 'How to sync a forked GitHub repository with upstream: configure upstream remote, fetch changes, and rebase or merge into main.',
    intro: 'Keeping a fork updated prevents merge conflicts when you submit pull requests to the original open-source repository.',
    tables: [
      {
        caption: 'Complete fork sync sequence',
        headers: ['Command', 'Step'],
        rows: [
          ['git remote add upstream <original-repo-url>', '1. Add upstream remote (one-time setup)'],
          ['git fetch upstream', '2. Fetch latest commits and branches from upstream'],
          ['git checkout main && git merge upstream/main', '3. Fast-forward your local main branch'],
          ['git push origin main', '4. Push synchronized changes to your GitHub fork'],
        ],
      },
    ],
    faq: [
      ['How do I verify if upstream is configured?', 'Run <code>git remote -v</code>. You should see both <code>origin</code> (your fork) and <code>upstream</code> (original repo).'],
      ['Should I merge or rebase against upstream?', 'For main, merge (or fast-forward) is standard. For your feature branches, rebase against upstream/main to keep clean linear history.'],
      ['Can I use the GitHub UI "Sync fork" button?', 'Yes, the GitHub UI button does the same fast-forward merge on the remote side. Afterwards, run <code>git pull</code> locally.'],
    ],
    tool: { href: '/tools/git', label: 'Build remote workflows in the Git Builder' },
  },

  {
    slug: 'git-delete-remote-tag',
    title: 'Git Delete Remote Tag — Local and Remote',
    metaDesc: 'How to delete a Git tag locally and on the remote: git tag -d and git push origin --delete <tagname>.',
    intro: 'When a release tag was created on the wrong commit or with a typo, delete it from both your local repository and the remote server.',
    tables: [
      {
        caption: 'Tag deletion commands',
        headers: ['Target', 'Command', 'Effect'],
        rows: [
          ['Local', 'git tag -d <tagname>', 'Delete tag reference from local repository'],
          ['Remote', 'git push origin --delete <tagname>', 'Delete tag on remote repository (modern syntax)'],
          ['Remote (Legacy)', 'git push origin :refs/tags/<tagname>', 'Old refspec syntax (same effect)'],
        ],
      },
    ],
    faq: [
      ['Why does the tag reappear after git fetch?', 'If teammates still have the tag locally and push with <code>git push --tags</code>, it will be recreated. Ask collaborators to delete it locally as well.'],
      ['How do I list all existing tags?', 'Run <code>git tag -l</code> or <code>git tag -n</code> to see tags with their annotations.'],
      ['How do I delete all local tags that do not exist on remote?', 'Run <code>git tag -l | xargs git tag -d && git fetch --tags</code>.'],
    ],
    tool: { href: '/tools/git', label: 'Try tag commands in the Git Builder' },
  },

  {
    slug: 'git-change-commit-author',
    title: 'Git Change Commit Author — Email & Name',
    metaDesc: 'How to change the author name and email on a Git commit: git commit --amend --author, git config, and updating multiple commits.',
    intro: 'Fix accidental personal email or wrong author name on your commits before pushing to public repositories.',
    tables: [
      {
        caption: 'Author correction patterns',
        headers: ['Scope', 'Command', 'Use Case'],
        rows: [
          ['Latest Commit', 'git commit --amend --author="Name <email@example.com>" --no-edit', 'Update author on top commit without changing message'],
          ['Future Commits', 'git config user.email "email@example.com"', 'Fix email for all future commits in current repository'],
          ['Global Default', 'git config --global user.name "Name"', 'Set default identity across your entire system'],
        ],
      },
    ],
    faq: [
      ['Does changing author rewrite the commit SHA?', 'Yes. Any modification to author, email, timestamp, or message produces a new commit SHA.'],
      ['Can I change author on older pushed commits?', 'Yes, via interactive rebase or <code>git-filter-repo</code>, but it rewrites history. Use caution on shared branches.'],
      ['What is the difference between author and committer?', 'Author wrote the code; committer applied the commit (e.g. cherry-pick or rebase). --amend updates author; committer becomes the current user.'],
    ],
    tool: { href: '/tools/git', label: 'Try author commands in the Git Builder' },
  },

  {
    slug: 'git-unstage-file',
    title: 'Git Unstage File — Remove from Staging Area',
    metaDesc: 'How to unstage a file in Git without losing changes: git restore --staged <file> vs git reset HEAD <file>.',
    intro: 'Accidentally ran git add on the wrong file? Unstaging removes the file from the index (staging area) while preserving all your edits in the working directory.',
    tables: [
      {
        caption: 'Unstaging commands',
        headers: ['Command', 'Git Version', 'Effect'],
        rows: [
          ['git restore --staged <file>', '>= 2.23 (Modern)', 'Unstage specific file; keep local changes intact'],
          ['git restore --staged .', '>= 2.23 (Modern)', 'Unstage all staged files at once'],
          ['git reset HEAD <file>', '< 2.23 (Legacy)', 'Classic command for unstaging; identical effect'],
        ],
      },
    ],
    faq: [
      ['Will unstaging delete my edits?', 'No! Unstaging only removes the file from the upcoming commit. Your working tree edits remain 100% intact.'],
      ['How do I discard the edits entirely?', 'Run <code>git restore <file></code> (without --staged) to revert working directory changes to HEAD.'],
      ['What is the difference between git restore --staged and git rm --cached?', '<code>restore --staged</code> keeps the file tracked in Git. <code>rm --cached</code> stages the file for complete removal from Git tracking.'],
    ],
    tool: { href: '/tools/git', label: 'Build staging workflows in the Git Builder' },
  },

  {
    slug: 'git-view-commit-history-graph',
    title: 'Git Log Graph — Visual Commit History in Terminal',
    metaDesc: 'How to view a visual branch and commit tree in terminal with git log --oneline --graph --decorate --all.',
    intro: 'Turn the plain git log output into an ASCII branch graph showing merges, branch divergences, and commit tags right in your CLI.',
    tables: [
      {
        caption: 'Log graph variations',
        headers: ['Command', 'Features'],
        rows: [
          ['git log --oneline --graph --all', 'Compact single-line graph for all branches and tags'],
          ['git log --graph --decorate --oneline -n 15', 'Show the last 15 commits with branch labels'],
          ['git log --graph --pretty=format:"%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset"', 'Colorful custom formatted log with relative dates and authors'],
        ],
      },
    ],
    faq: [
      ['How do I create a permanent alias for this?', 'Run: <code>git config --global alias.lg "log --oneline --graph --all"</code>. Then you can just type <code>git lg</code>.'],
      ['Why is --all important?', 'Without <code>--all</code>, git log only shows commits reachable from the current branch. --all includes all local and remote branches.'],
      ['How to search commit messages in the log?', 'Use <code>git log --grep="search term"</code>.'],
    ],
    tool: { href: '/tools/git', label: 'Try log options in the Git Builder' },
  },

  {
    slug: 'git-clean-untracked-files',
    title: 'Git Clean Untracked Files — Remove Clutter Safely',
    metaDesc: 'Safely delete untracked files and directories with git clean: dry-run (-n), force (-f), directories (-d), and ignored files (-x).',
    intro: 'Clean up build artifacts, temp files, and untracked junk from your working tree. Always start with a dry run to avoid deleting wanted files.',
    tables: [
      {
        caption: 'Git clean commands',
        headers: ['Command', 'Safety', 'Effect'],
        rows: [
          ['git clean -n', 'Safe (Dry run)', 'List files that would be removed without deleting anything'],
          ['git clean -fd', 'Destructive', 'Force delete untracked files and directories'],
          ['git clean -fdx', 'Very Destructive', 'Also delete ignored files (e.g. node_modules, .env, build/)'],
        ],
      },
    ],
    faq: [
      ['Can I recover files deleted by git clean?', 'No! Because untracked files were never committed to Git, Git has no copy in its object database. Always dry-run with -n first.'],
      ['What does the -d flag mean?', 'It instructs clean to remove untracked whole directories in addition to individual files.'],
      ['How to clean only a specific subdirectory?', 'Pass the path: <code>git clean -fd ./dist</code>.'],
    ],
    tool: { href: '/tools/git', label: 'Try clean commands in the Git Builder' },
  },

  {
    slug: 'git-switch-branch',
    title: 'Git Switch Branch — Modern Branch Navigation',
    metaDesc: 'How to switch branches in Git: git switch vs git checkout, creating new branches with -c, and detaching HEAD.',
    intro: 'Introduced in Git 2.23, git switch replaces git checkout for branch switching, eliminating the confusion of mixing file restoration with branch checkout.',
    tables: [
      {
        caption: 'Switch branch patterns',
        headers: ['Command', 'Action'],
        rows: [
          ['git switch <branch>', 'Switch to an existing local branch'],
          ['git switch -c <new-branch>', 'Create and switch to a new branch (replaces checkout -b)'],
          ['git switch -', 'Switch back to the previous branch you were on'],
          ['git switch --detach <sha>', 'Switch to a specific commit in detached HEAD state'],
        ],
      },
    ],
    faq: [
      ['Why was git switch introduced?', 'git checkout handled both branch navigation AND file reverting. Git 2.23 split these into <code>git switch</code> (branches) and <code>git restore</code> (files).'],
      ['What does git switch - do?', 'The hyphen <code>-</code> switches to whatever branch you were on previously — exactly like <code>cd -</code> in bash.'],
      ['What if I have uncommitted changes?', 'If your changes do not conflict with the target branch, Git carries them over. If there are conflicts, Git halts and asks you to stash or commit first.'],
    ],
    tool: { href: '/tools/git', label: 'Build branch workflows in the Git Builder' },
  },

  {
    slug: 'git-create-branch-from-commit',
    title: 'Git Create Branch from Commit — Branch Off History',
    metaDesc: 'How to start a new branch from an older commit or tag: git switch -c <branch> <sha> or git checkout -b <branch> <sha>.',
    intro: 'Need to experiment from an earlier release or fix a bug from a specific point in time? Create a new branch originating from any historical commit SHA.',
    tables: [
      {
        caption: 'Create branch from history',
        headers: ['Command', 'Description'],
        rows: [
          ['git switch -c <new-branch> <sha>', 'Modern syntax: create and switch to new branch starting at <sha>'],
          ['git checkout -b <new-branch> <sha>', 'Classic syntax: create and checkout new branch at <sha>'],
          ['git branch <new-branch> <sha>', 'Create branch at <sha> without switching to it'],
        ],
      },
    ],
    faq: [
      ['Can I branch off a tag instead of a commit SHA?', 'Yes! <code>git switch -c hotfix-v1.0 v1.0.0</code> works identically with tags.'],
      ['What happens to commits after that SHA?', 'They remain on their original branches. Your new branch diverges from the specified commit.'],
      ['How do I find the commit SHA to branch from?', 'Use <code>git log --oneline</code> to locate the 7-character hash of the desired commit.'],
    ],
    tool: { href: '/tools/git', label: 'Build history branches in the Git Builder' },
  },

  {
    slug: 'git-stash-include-untracked',
    title: 'Git Stash Untracked Files (-u and -a Flags)',
    metaDesc: 'How to stash new and untracked files in Git: git stash -u (include untracked) vs git stash -a (include ignored).',
    intro: 'By default, git stash ignores new files that have not been staged. Use the -u flag to stash new files alongside your tracked changes.',
    tables: [
      {
        caption: 'Stash scope comparison',
        headers: ['Command', 'Tracked Modified', 'Untracked New', 'Ignored (.gitignore)'],
        rows: [
          ['git stash', 'Yes', 'No', 'No'],
          ['git stash -u (--include-untracked)', 'Yes', 'Yes', 'No'],
          ['git stash -a (--all)', 'Yes', 'Yes', 'Yes'],
        ],
      },
    ],
    faq: [
      ['Why didn\'t plain git stash save my new files?', 'Plain git stash only tracks files Git is already monitoring. Always use <code>git stash -u</code> when working with new files.'],
      ['When should I use -a instead of -u?', 'Only when you want to stash files listed in .gitignore (like node_modules or .env). Usually -u is what you want.'],
      ['How to name a stash with untracked files?', 'Combine options: <code>git stash push -u -m "wip: new components"</code>.'],
    ],
    tool: { href: '/tools/git', label: 'Try stash options in the Git Builder' },
  },

  {
    slug: 'git-pull-overwrite-local',
    title: 'Git Force Pull — Overwrite Local Changes with Remote',
    metaDesc: 'How to force git pull and completely overwrite local changes with the remote branch: git fetch && git reset --hard origin/main.',
    intro: 'When your local branch is hopelessly messed up or you want an exact mirror of the remote repository, reset hard to origin.',
    tables: [
      {
        caption: 'Force pull sequence',
        headers: ['Command', 'Step'],
        rows: [
          ['git fetch origin', '1. Download all latest commits from remote without merging'],
          ['git reset --hard origin/main', '2. Force local main branch pointer to match origin/main exactly'],
          ['git clean -fd', '3. (Optional) Remove any new untracked local files'],
        ],
      },
    ],
    faq: [
      ['Why doesn\'t git pull --force exist?', 'git pull is fetch + merge. Merging cannot simply overwrite uncommitted or divergent work without conflict. Fetch + reset --hard is the explicit solution.'],
      ['Are my local commits lost?', 'Unpushed local commits are removed from the branch pointer. You can still recover them via <code>git reflog</code> for up to 90 days.'],
      ['Can I save my uncommitted work before force pulling?', 'Yes: run <code>git stash -u</code> before resetting, then apply it later if needed.'],
    ],
    tool: { href: '/tools/git', label: 'Build force sync in the Git Builder' },
  },

  {
    slug: 'git-resolve-merge-conflict',
    title: 'Git Resolve Merge Conflict — Complete Workflow',
    metaDesc: 'How to resolve Git merge conflicts step by step: understand conflict markers (<<<<<<<, =======, >>>>>>>), stage resolved files, and complete the merge.',
    intro: 'Merge conflicts occur when two branches modify the same lines of a file. Git pauses and inserts conflict markers so you can decide which version to keep.',
    tables: [
      {
        caption: 'Conflict resolution workflow',
        headers: ['Step', 'Command', 'Description'],
        rows: [
          ['1. Check status', 'git status', 'Identify all files marked "both modified"'],
          ['2. Edit files', 'Manual / IDE', 'Open files, choose content, remove <<<<<<<, =======, >>>>>>> markers'],
          ['3. Stage resolved', 'git add <file>', 'Mark conflict as resolved in Git index'],
          ['4. Complete merge', 'git commit', 'Finalize merge commit with default message'],
          ['Abort if needed', 'git merge --abort', 'Cancel merge and revert to pre-merge state'],
        ],
      },
    ],
    faq: [
      ['What does <<<<<<< HEAD mean?', 'HEAD marks the code currently on your active branch. The code after ======= and before >>>>>>> comes from the branch you are merging in.'],
      ['How do I abort a conflict during a rebase?', 'Run <code>git rebase --abort</code>.'],
      ['Can I choose one branch\'s version entirely?', 'Yes: <code>git checkout --ours <file></code> keeps current branch, <code>git checkout --theirs <file></code> accepts incoming branch.'],
    ],
    tool: { href: '/tools/git', label: 'Try conflict resolution in the Git Builder' },
  },

  {
    slug: 'git-show-commit-diff',
    title: 'Git Show Commit — Inspect Changes in a Commit',
    metaDesc: 'How to view changes in a specific commit with git show: file stats, colorized diffs, and inspecting specific files inside a commit.',
    intro: 'git show displays the author, date, commit message, and full patch diff for any commit hash, tag, or branch head.',
    tables: [
      {
        caption: 'Git show patterns',
        headers: ['Command', 'What it displays'],
        rows: [
          ['git show <sha>', 'Full commit metadata and unified diff of all changed files'],
          ['git show --stat <sha>', 'Summary list of changed files with inserted/deleted line counts'],
          ['git show <sha>:<file-path>', 'View the entire file content as it existed at that commit'],
          ['git show <sha> -- <file-path>', 'Show diff only for that specific file in the commit'],
        ],
      },
    ],
    faq: [
      ['How do I view the diff of the latest commit?', 'Run <code>git show HEAD</code> (or just <code>git show</code>).'],
      ['How to view the parent of a commit?', 'Use <code>git show <sha>^</code>.'],
      ['Can I see just the commit message without the diff?', 'Yes: <code>git show -s <sha></code> (--no-patch).'],
    ],
    tool: { href: '/tools/git', label: 'Try git show in the Git Builder' },
  },

  {
    slug: 'git-tag-release',
    title: 'Git Tag a Release — Lightweight & Annotated Tags',
    metaDesc: 'How to create, push, and verify Git release tags: annotated tags (git tag -a v1.0.0 -m), pushing tags with git push origin --tags.',
    intro: 'Tags point to specific points in Git history, typically marking release versions (e.g. v1.0.0, v2.1.3) in semantic versioning.',
    tables: [
      {
        caption: 'Tag creation and push commands',
        headers: ['Command', 'Type', 'Description'],
        rows: [
          ['git tag -a v1.0.0 -m "Release v1.0.0"', 'Annotated (Recommended)', 'Includes tagger name, email, date, and message'],
          ['git tag v1.0.0', 'Lightweight', 'Simple bookmark pointer to current commit (no metadata)'],
          ['git push origin v1.0.0', 'Push Single Tag', 'Push specific tag to remote repository'],
          ['git push origin --tags', 'Push All Tags', 'Push all local tags to remote at once'],
        ],
      },
    ],
    faq: [
      ['Why prefer annotated tags over lightweight tags?', 'Annotated tags are full Git objects with cryptographic verification, author name, timestamp, and release notes. They are standard for releases.'],
      ['Can I tag an older historical commit?', 'Yes: append the commit SHA: <code>git tag -a v1.0.0 <sha> -m "Release v1.0.0"</code>.'],
      ['How to check out a tag?', 'Run <code>git checkout v1.0.0</code> (puts you in detached HEAD) or <code>git switch -c release-1.0 v1.0.0</code> to start a branch from the tag.'],
    ],
    tool: { href: '/tools/git', label: 'Build tag workflows in the Git Builder' },
  },
];

/* Chinese bodies are data, kept in recipes-zh.mjs and keyed by slug. A recipe
   joins the /cn/ tree as soon as its block exists there; a block whose slug is
   gone fails the build, so translations cannot rot silently. */
for (const list of [CRON_RECIPES, GIT_RECIPES]) {
  for (const r of list) if (RECIPE_ZH[r.slug]) r.zh = RECIPE_ZH[r.slug];
}
const knownSlugs = new Set([...CRON_RECIPES, ...GIT_RECIPES].map((r) => r.slug));
const staleSlugs = Object.keys(RECIPE_ZH).filter((s) => !knownSlugs.has(s));
if (staleSlugs.length) {
  throw new Error(`recipes-zh.mjs translates unknown slug(s): ${staleSlugs.join(', ')}`);
}

/* ------------------------------ template --------------------------------- */

const bySlug = {
  cron: Object.fromEntries(CRON_RECIPES.map((r) => [r.slug, r])),
  git: Object.fromEntries(GIT_RECIPES.map((r) => [r.slug, r])),
};

const W = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICONS = {
  cron: W('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  git: W('<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'),
};
const ESC = (s) => String(s).replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/</g, '&lt;');

/* Strings the template itself owns. Recipe text comes from the data; anything
   not present in r.zh falls back to the English field, per field. */
const UI = {
  en: {
    crumb: 'Cheat Sheets', sheet: { cron: 'Cron Cheat Sheet', git: 'Git Cheat Sheet' },
    fields: 'Field by field', thField: 'Field', thValue: 'Value', thMeaning: 'Meaning',
    related: { cron: 'Related schedules', git: 'Related Git recipes' },
    faq: 'FAQ', cta: 'Stop memorizing — build it interactively', fullRef: 'Full reference: ',
  },
  cn: {
    crumb: '速查表', sheet: { cron: 'Cron 速查表', git: 'Git 速查表' },
    fields: '逐字段解释', thField: '字段', thValue: '值', thMeaning: '含义',
    related: { cron: '相关调度', git: '相关 Git 配方' },
    faq: '常见问题', cta: '别死记语法 — 用可视化生成器', fullRef: '完整速查表：',
  },
};

/**
 * A recipe page. lang 'cn' is only rendered for recipes that carry r.zh; the
 * Chinese tree lives at /cn/cheatsheets/ and links back to the English sheets
 * and to whichever siblings are already translated.
 */
function page(kind, r, lang = 'en') {
  const U = UI[lang];
  const Z = (lang === 'cn' && r.zh) || {};
  const text = (key) => (Z[key] !== undefined ? Z[key] : r[key]);
  // an English page always links English siblings (hreflang carries the CN pair);
  // a Chinese page links CN where it exists and falls back to English otherwise
  const at = (slug) => (lang === 'cn' && (slug === r.slug || bySlug[kind][slug]?.zh) ? 'cn' : 'en');
  const href = (slug) => (at(slug) === 'cn' ? `/cn/cheatsheets/${slug}` : `/cheatsheets/${slug}`);
  const self = `https://plobikit.com/${lang === 'cn' ? 'cn/' : ''}cheatsheets/${r.slug}`;
  const hubHref = lang === 'cn' ? '/cn/cheatsheets/' : '/cheatsheets/';
  // the paired tool keeps its English URL unless the translation overrides it
  const tool = { ...r.tool, ...(Z.tool ?? {}) };
  const sheetHref = `/cheatsheets/${kind}`;
  const sheetName = U.sheet[kind];
  const siblings = (kind === 'cron' ? CRON_RECIPES : GIT_RECIPES).filter((x) => x.slug !== r.slug);

  const main =
    kind === 'cron'
      ? `
      <div class="answer">
        <code class="expr">${r.expr}</code>
        <p class="plain">${text('plain')}</p>
      </div>
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">${U.fields}</h2>
      <table class="ref">
        <thead><tr><th>${U.thField}</th><th>${U.thValue}</th><th>${U.thMeaning}</th></tr></thead>
        <tbody>${text('fields').map((f) => `<tr><td><code>${f[0]}</code></td><td><code>${ESC(f[1])}</code></td><td>${f[2]}</td></tr>`).join('')}</tbody>
      </table>
      ${text('body').map((p) => `<p class="prose">${p}</p>`).join('\n      ')}
      ${text('code') ? `<pre class="cmdbox">${ESC(text('code'))}</pre>` : ''}`
      : `
      <div class="answer">
        ${text('tables')[0].rows.map((row) => `<code class="expr" style="display:block; margin-bottom:8px;">${ESC(row[0])}</code><p class="plain" style="margin:0 0 6px 0;">${row[1]}</p>`).join('\n        ')}
      </div>
      ${text('tables')[0].caption ? `<h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">${text('tables')[0].caption}</h2>` : ''}
      <table class="ref">
        <thead><tr>${text('tables')[0].headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${text('tables')[0].rows.map((row) => `<tr>${row.map((c) => `<td><code>${ESC(c)}</code></td>`).join('')}</tr>`).join('')}</tbody>
      </table>
      ${text('tables')[1] ? `<h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">${text('tables')[1].caption}</h2>
      <table class="ref">
        <thead><tr>${text('tables')[1].headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${text('tables')[1].rows.map((row) => `<tr>${row.map((c) => `<td><code>${ESC(c)}</code></td>`).join('')}</tr>`).join('')}</tbody>
      </table>` : ''}
      <p class="prose">${text('intro')}</p>`;

  const chipLabel = (x) => ((lang === 'cn' && x.zh?.title) ? x.zh.title : x.title).replace('Git ', '');

  const variations =
    kind === 'cron'
      ? `
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">${U.related.cron}</h2>
      <div class="chips">
        ${text('variations').map(([expr, label, slug]) => `<a class="chip" href="${href(slug)}"><code>${expr}</code> ${label}</a>`).join('\n        ')}
      </div>`
      : `
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">${U.related.git}</h2>
      <div class="chips">
        ${siblings.map((x) => `<a class="chip" href="${href(x.slug)}">${chipLabel(x)}</a>`).join('\n        ')}
      </div>`;

  const alts = lang === 'en'
    ? (r.zh ? `\n  <link rel="alternate" hreflang="en" href="${self}">\n  <link rel="alternate" hreflang="zh" href="https://plobikit.com/cn/cheatsheets/${r.slug}">` : '')
    : `\n  <link rel="alternate" hreflang="en" href="https://plobikit.com/cheatsheets/${r.slug}">\n  <link rel="alternate" hreflang="zh" href="${self}"`;

  return `<!DOCTYPE html>
<html lang="${lang === 'cn' ? 'zh' : 'en'}">
<head>
  <meta name="google-adsense-account" content="ca-pub-5108296372072915">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${text('title')} | Plobi-kit</title>
  <meta name="description" content="${text('metaDesc')}">
  <link rel="stylesheet" href="/styles.css">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#fafafa">
  <link rel="canonical" href="${self}">${alts}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5108296372072915" crossorigin="anonymous"></script>
  <style>
    .answer { background: var(--bg-card); border: 1px solid var(--border-color); border-left: 3px solid var(--success-color); border-radius: var(--radius-md); padding: 22px 24px; margin: 8px 0 8px 0; }
    .expr { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 20px; font-weight: 700; color: var(--text-main); word-break: break-all; }
    .plain { font-size: 14px; color: var(--text-muted); margin: 8px 0 0 0; }
    table.ref { width: 100%; border-collapse: collapse; font-size: 14px; background: var(--bg-card); margin-bottom: 8px; }
    table.ref th { text-align: left; padding: 10px 12px; border: 1px solid var(--border-color); background: var(--accent-light); color: var(--text-main); }
    table.ref td { padding: 9px 12px; border: 1px solid var(--border-color); color: var(--text-muted); line-height: 1.6; }
    table.ref td code { color: var(--text-main); }
    .prose { font-size: 14.5px; color: var(--text-muted); line-height: 1.85; margin: 14px 0; }
    .cmdbox { background: #111; color: #e8e8e8; border-radius: var(--radius-sm); padding: 16px 18px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; overflow-x: auto; line-height: 1.7; }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; }
    a.chip { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-main); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 999px; padding: 8px 14px; text-decoration: none; transition: var(--transition); }
    a.chip:hover { border-color: var(--success-color); color: var(--success-color); }
    a.chip code { color: var(--success-color); font-weight: 600; }
    .crumb { font-size: 13px; color: var(--text-muted); margin-bottom: 10px; }
    .crumb a { color: var(--success-color); text-decoration: none; }
    h1 { font-size: 28px; margin-bottom: 12px; letter-spacing: -0.5px; color: var(--text-main); }
  </style>
</head>
<body>

  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <a href="../index.html" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;">
          <span class="logo-icon" style="background:var(--success-color);">P</span>
          <span id="txt-logo-name">Plobi-kit</span>
        </a>
      </div>
      <nav class="nav-links">
        <a href="../tools/index.html" id="nav-tools">Tools</a>
        <a href="index.html" class="active" id="nav-cheatsheets">Cheat Sheets</a>
        <a href="../guides/index.html" id="nav-guides">Guides</a>
        <a href="../deals" id="nav-deals">Deals</a>
        <a href="../collection/index.html" id="nav-collection">Collection</a>
        <a href="../about.html" id="nav-about">About</a>
      </nav>
      <div class="controls">
        <button class="lang-btn" id="lang-btn">CN</button>
      </div>
    </header>

    <main style="max-width: 860px; margin: 0 auto; margin-bottom: 40px;">
      <p class="crumb"><a href="${hubHref}">${U.crumb}</a> · <a href="${sheetHref}">${sheetName}</a> · ${text('title')}</p>
      <h1>${text('title')}</h1>
      ${main}
      ${variations}
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">${U.faq}</h2>
      ${text('faq').map(([q, a]) => `<p class="prose"><strong style="color: var(--text-main);">${q}</strong><br>${a}</p>`).join('\n      ')}
      <div style="margin-top: 32px; background: var(--accent-light); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <p style="font-size: 14px; color: var(--text-main); font-weight: 600; margin: 0;">${U.cta}</p>
        <a class="btn" href="${tool.href}" style="text-decoration: none;">${tool.label}</a>
      </div>
      <p style="font-size: 12px; color: var(--text-muted); margin-top: 20px;">${U.fullRef}<a href="${sheetHref}" style="color: var(--success-color);">${sheetName}</a></p>
    </main>

    <footer class="app-footer">
      <div class="footer-nav">
        <a href="../privacy.html" id="nav-footer-privacy">Privacy Policy</a>
        <a href="../terms.html" id="nav-footer-terms">Terms</a>
        <a href="../about.html" id="nav-footer-about">About</a>
        <a href="../contact.html" id="nav-footer-contact">Contact</a>
      </div>
      <div class="copyright" id="nav-footer-copy">
        &copy; 2026 Plobi. All rights reserved.
      </div>
    </footer>
  </div>

  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Service Worker registered successfully.', reg))
          .catch(err => console.log('Service Worker registration failed.', err));
      });
    }
  </script>
  <script type="module" src="/app.js"></script>
</body>
</html>`;
}

function writePages() {
  let en = 0;
  let cn = 0;
  mkdirSync(OUT_CN, { recursive: true });
  for (const [kind, list] of [['cron', CRON_RECIPES], ['git', GIT_RECIPES]]) {
    for (const r of list) {
      writeFileSync(join(OUT, `${r.slug}.html`), page(kind, r, 'en'), 'utf8');
      en++;
      // a recipe joins the Chinese tree as soon as its data carries a zh block —
      // translating is a data change, never a template change
      if (r.zh) {
        writeFileSync(join(OUT_CN, `${r.slug}.html`), page(kind, r, 'cn'), 'utf8');
        cn++;
      }
    }
  }
  console.log(`${en} recipe page(s) generated, ${cn} in Chinese.`);
}

// gen-cheatsheets imports the recipe list to build the Chinese hub's recipe
// section; importing must not rewrite pages
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) writePages();