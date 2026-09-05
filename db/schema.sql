-- Plobi-kit D1 schema
-- Apply remotely: npm run db:remote
-- Apply locally (wrangler dev): npm run db:local

CREATE TABLE IF NOT EXISTS shares (
  id          TEXT PRIMARY KEY,
  tool        TEXT NOT NULL,
  lang        TEXT NOT NULL DEFAULT 'en',
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  state       TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shares_expires ON shares (expires_at);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  ip         TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_counters (
  k TEXT NOT NULL,
  w INTEGER NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (k, w)
);

-- Deal aggregations (Epic free games first; categories: games/ai/servers/software)
CREATE TABLE IF NOT EXISTS deals (
  id             TEXT PRIMARY KEY,        -- e.g. 'epic:<slug>'
  source         TEXT NOT NULL,
  category       TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  url            TEXT NOT NULL,
  image_url      TEXT,
  original_price TEXT,                    -- display string, e.g. '$39.99'
  starts_at      INTEGER,                 -- unix seconds
  ends_at        INTEGER,
  updated_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deals_cat_ends ON deals (category, ends_at);
