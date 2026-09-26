-- Casa 2.0 — database richieste (Cloudflare D1 / SQLite)
-- Applica con:  npx wrangler d1 execute casa2-leads --remote --file=db/schema.sql

CREATE TABLE IF NOT EXISTS leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  form        TEXT    NOT NULL CHECK (form IN ('contatti','valuta')),
  status      TEXT    NOT NULL DEFAULT 'nuovo' CHECK (status IN ('nuovo','in_lavorazione','chiuso')),
  nome        TEXT    NOT NULL,
  cognome     TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  telefono    TEXT,
  messaggio   TEXT,
  newsletter  INTEGER NOT NULL DEFAULT 0,
  -- solo modulo valutazione
  indirizzo   TEXT,
  tipologia   TEXT,
  mq          INTEGER,
  anno        INTEGER,
  locali      INTEGER,
  piano       TEXT,
  stato       TEXT,
  -- tracciabilità (IP salvato solo come hash, GDPR)
  pagina      TEXT,
  ip_hash     TEXT,
  user_agent  TEXT,
  consenso_privacy_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_ip      ON leads (ip_hash, created_at);
