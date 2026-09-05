/**
 * Recipe page generator (Stage 1c — long-tail content cluster).
 *
 * One page answers ONE high-volume question ("cron every 5 minutes",
 * "git undo last commit") with a direct answer, breakdown, variations,
 * FAQ, and a CTA to the paired tool. Flat URLs under /cheatsheets/ to
 * avoid directory/file collisions: cheatsheets/cron-every-5-minutes.html
 *
 * Output is committed static HTML — add a recipe by adding data + rerun.
 * Run: node scripts/gen-recipes.mjs
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'public', 'cheatsheets');

/* ------------------------------ content ---------------------------------- */

const CRON_RECIPES = [
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
    tool: { href: '../tools/cron.html', label: 'Build it visually in the Cron Editor' },
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
    tool: { href: '../tools/cron.html', label: 'Try this schedule in the Cron Editor' },
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
    tool: { href: '../tools/cron.html', label: 'Try this schedule in the Cron Editor' },
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
    tool: { href: '../tools/cron.html', label: 'Try this schedule in the Cron Editor' },
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
    tool: { href: '../tools/cron.html', label: 'Try this schedule in the Cron Editor' },
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
    tool: { href: '../tools/cron.html', label: 'Try this schedule in the Cron Editor' },
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
    tool: { href: '../tools/cron.html', label: 'Try this schedule in the Cron Editor' },
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
    tool: { href: '../tools/cron.html', label: 'Try this schedule in the Cron Editor' },
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
    tool: { href: '../tools/cron.html', label: 'Try this schedule in the Cron Editor' },
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
    tool: { href: '../tools/cron.html', label: 'Try this schedule in the Cron Editor' },
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
    tool: { href: '../tools/cron.html', label: 'Try schedules in the Cron Editor' },
  },
];

const GIT_RECIPES = [
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
    tool: { href: '../tools/git.html', label: 'Generate the exact command in the Git Builder' },
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
    tool: { href: '../tools/git.html', label: 'Build the discard workflow in the Git Builder' },
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
    tool: { href: '../tools/git.html', label: 'Generate branch commands in the Git Builder' },
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
    tool: { href: '../tools/git.html', label: 'Generate stash commands in the Git Builder' },
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
    tool: { href: '../tools/git.html', label: 'Generate amend & push commands in the Git Builder' },
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
    tool: { href: '../tools/git.html', label: 'Generate revert commands in the Git Builder' },
  },
];

/* ------------------------------ template --------------------------------- */

const W = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICONS = {
  cron: W('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  git: W('<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>'),
};
const ESC = (s) => String(s).replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/</g, '&lt;');

function page(kind, r) {
  const sheetHref = kind === 'cron' ? 'cron.html' : 'git.html';
  const sheetName = kind === 'cron' ? 'Cron Cheat Sheet' : 'Git Cheat Sheet';
  const siblings = (kind === 'cron' ? CRON_RECIPES : GIT_RECIPES).filter((x) => x.slug !== r.slug);

  const main =
    kind === 'cron'
      ? `
      <div class="answer">
        <code class="expr">${r.expr}</code>
        <p class="plain">${r.plain}</p>
      </div>
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">Field by field</h2>
      <table class="ref">
        <thead><tr><th>Field</th><th>Value</th><th>Meaning</th></tr></thead>
        <tbody>${r.fields.map((f) => `<tr><td><code>${f[0]}</code></td><td><code>${ESC(f[1])}</code></td><td>${f[2]}</td></tr>`).join('')}</tbody>
      </table>
      ${r.body.map((p) => `<p class="prose">${p}</p>`).join('\n      ')}
      ${r.code ? `<pre class="cmdbox">${ESC(r.code)}</pre>` : ''}`
      : `
      <div class="answer">
        ${r.tables[0].rows.map((row) => `<code class="expr" style="display:block; margin-bottom:8px;">${ESC(row[0])}</code><p class="plain" style="margin:0 0 6px 0;">${row[1]}</p>`).join('\n        ')}
      </div>
      ${r.tables[0].caption ? `<h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">${r.tables[0].caption}</h2>` : ''}
      <table class="ref">
        <thead><tr>${r.tables[0].headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${r.tables[0].rows.map((row) => `<tr>${row.map((c) => `<td><code>${ESC(c)}</code></td>`).join('')}</tr>`).join('')}</tbody>
      </table>
      ${r.tables[1] ? `<h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">${r.tables[1].caption}</h2>
      <table class="ref">
        <thead><tr>${r.tables[1].headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${r.tables[1].rows.map((row) => `<tr>${row.map((c) => `<td><code>${ESC(c)}</code></td>`).join('')}</tr>`).join('')}</tbody>
      </table>` : ''}
      <p class="prose">${r.intro}</p>`;

  const variations =
    kind === 'cron'
      ? `
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">Related schedules</h2>
      <div class="chips">
        ${r.variations.map(([expr, label, slug]) => `<a class="chip" href="${slug}"><code>${expr}</code> ${label}</a>`).join('\n        ')}
      </div>`
      : `
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">Related Git recipes</h2>
      <div class="chips">
        ${siblings.map((x) => `<a class="chip" href="${x.slug}">${x.title.replace(' — .*', '').replace('Git ', '')}</a>`).join('\n        ')}
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="google-adsense-account" content="ca-pub-5108296372072915">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${r.title} | Plobi-kit</title>
  <meta name="description" content="${r.metaDesc}">
  <link rel="stylesheet" href="../styles.css">
  <link rel="manifest" href="../manifest.json">
  <meta name="theme-color" content="#fafafa">
  <link rel="canonical" href="https://plobikit.com/cheatsheets/${r.slug}">
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
      <p class="crumb"><a href="index.html">Cheat Sheets</a> · <a href="${sheetHref}">${sheetName}</a> · ${r.title}</p>
      <h1>${r.title}</h1>
      ${main}
      ${variations}
      <h2 style="font-size: 18px; color: var(--text-main); margin: 28px 0 12px 0;">FAQ</h2>
      ${r.faq.map(([q, a]) => `<p class="prose"><strong style="color: var(--text-main);">${q}</strong><br>${a}</p>`).join('\n      ')}
      <div style="margin-top: 32px; background: var(--accent-light); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <p style="font-size: 14px; color: var(--text-main); font-weight: 600; margin: 0;">Stop memorizing — build it interactively</p>
        <a class="btn" href="${r.tool.href}" style="text-decoration: none;">${r.tool.label}</a>
      </div>
      <p style="font-size: 12px; color: var(--text-muted); margin-top: 20px;">Full reference: <a href="${sheetHref}" style="color: var(--success-color);">${sheetName}</a></p>
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
  <script type="module" src="../app.js"></script>
</body>
</html>`;
}

let n = 0;
for (const r of CRON_RECIPES) { writeFileSync(join(OUT, `${r.slug}.html`), page('cron', r), 'utf8'); n++; }
for (const r of GIT_RECIPES) { writeFileSync(join(OUT, `${r.slug}.html`), page('git', r), 'utf8'); n++; }
console.log(`${n} recipe page(s) generated.`);
