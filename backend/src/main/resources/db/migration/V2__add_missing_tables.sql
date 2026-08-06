-- ================================================================
--  V2__add_missing_tables.sql
--  Adds agent_results, recommendations, automation_actions,
--  revenue_snapshots, feature_usage_logs, payments, teams tables.
-- ================================================================

-- ── AGENT RESULTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_results (
    id               BIGSERIAL     PRIMARY KEY,
    business_event_id BIGINT       REFERENCES business_events(id) ON DELETE CASCADE,
    agent_name       VARCHAR(100)  NOT NULL,
    severity         VARCHAR(20)   NOT NULL,
    score            NUMERIC(5,2)  NOT NULL,
    summary          TEXT,
    raw_data_json    TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_agent_results_event  ON agent_results (business_event_id);
CREATE INDEX idx_agent_results_agent  ON agent_results (agent_name);

-- ── RECOMMENDATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendations (
    id                   BIGSERIAL    PRIMARY KEY,
    agent_result_id      BIGINT       REFERENCES agent_results(id),
    priority             INT          NOT NULL DEFAULT 4,
    status               VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    problem              TEXT,
    reason               TEXT,
    prediction           TEXT,
    recommended_action   TEXT,
    expected_improvement VARCHAR(300),
    confidence           NUMERIC(5,2),
    automation_plan_json TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ
);
CREATE INDEX idx_recommendations_status ON recommendations (status);

-- ── AUTOMATION ACTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_actions (
    id                BIGSERIAL    PRIMARY KEY,
    recommendation_id BIGINT       REFERENCES recommendations(id),
    action_type       VARCHAR(80)  NOT NULL,
    action_detail     TEXT,
    executed_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    success           BOOLEAN      NOT NULL DEFAULT FALSE,
    error_message     TEXT
);
CREATE INDEX idx_auto_actions_rec ON automation_actions (recommendation_id);

-- ── REVENUE SNAPSHOTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenue_snapshots (
    id                BIGSERIAL     PRIMARY KEY,
    month             VARCHAR(7)    NOT NULL UNIQUE,   -- e.g. '2024-07'
    total_revenue     NUMERIC(14,2) NOT NULL DEFAULT 0,
    contract_count    INT           NOT NULL DEFAULT 0,
    avg_contract_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── FEATURE USAGE LOGS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_usage_logs (
    id             BIGSERIAL    PRIMARY KEY,
    freelancer_id  UUID         REFERENCES users(id) ON DELETE CASCADE,
    feature_key    VARCHAR(80)  NOT NULL,
    used_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_feature_usage_key ON feature_usage_logs (feature_key);

-- ── PAYMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id           BIGSERIAL     PRIMARY KEY,
    project_id   BIGINT        REFERENCES projects(id),
    payer_id     UUID          REFERENCES users(id),
    payee_id     UUID          REFERENCES users(id),
    amount       NUMERIC(12,2) NOT NULL,
    status       VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_payments_project ON payments (project_id);

-- ── TEAMS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    leader_id  UUID         REFERENCES users(id),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

-- ── BUSINESS EVENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_events (
    id           BIGSERIAL    PRIMARY KEY,
    event_type   VARCHAR(80)  NOT NULL,
    entity_type  VARCHAR(50)  NOT NULL,
    entity_id    BIGINT,
    payload_json TEXT,
    processed    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_biz_events_entity ON business_events (entity_id);
CREATE INDEX idx_biz_events_type   ON business_events (event_type);

-- ── Add featured column to projects if missing ───────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
