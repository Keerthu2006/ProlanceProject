-- ================================================================
--  TriGrowth AI – Complete Database Schema
--  Run this on a fresh PostgreSQL database named "trigrowth_ai"
--  Includes: all tables + indexes + seed data for demo
-- ================================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fuzzy search on skills

-- ================================================================
-- TABLES
-- ================================================================

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(100) NOT NULL UNIQUE,
    username          VARCHAR(50)  NOT NULL UNIQUE,
    password          VARCHAR(255) NOT NULL,
    full_name         VARCHAR(150) NOT NULL,
    role              VARCHAR(30)  NOT NULL,
    profile_image_url VARCHAR(500),
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);

-- ── FREELANCER PROFILES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id            BIGSERIAL     PRIMARY KEY,
    user_id       UUID          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    headline      VARCHAR(200),
    bio           TEXT,
    hourly_rate   NUMERIC(10,2),
    availability  VARCHAR(30)   DEFAULT 'FULL_TIME',
    ai_score      NUMERIC(5,2)  DEFAULT 0,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS freelancer_profile_skills (
    freelancer_profile_id BIGINT      NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    skill                 VARCHAR(80) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fp_skills ON freelancer_profile_skills (skill);

-- ── PROJECTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id           BIGSERIAL     PRIMARY KEY,
    owner_id     UUID          REFERENCES users(id),
    client_id    UUID          REFERENCES users(id),
    title        VARCHAR(200)  NOT NULL,
    description  TEXT,
    budget_min   NUMERIC(12,2),
    budget_max   NUMERIC(12,2),
    status       VARCHAR(20)   NOT NULL DEFAULT 'OPEN',
    duration_days INT,
    featured     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS project_skills (
    project_id BIGINT      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill      VARCHAR(80) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_client  ON projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status  ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects (featured);

-- ── APPLICATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
    id              BIGSERIAL     PRIMARY KEY,
    project_id      BIGINT        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id   UUID          NOT NULL REFERENCES users(id),
    cover_letter    TEXT,
    proposed_amount NUMERIC(12,2),
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    applied_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, freelancer_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_project    ON applications (project_id);
CREATE INDEX IF NOT EXISTS idx_applications_freelancer ON applications (freelancer_id);

-- ── REVIEWS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id          BIGSERIAL   PRIMARY KEY,
    project_id  BIGINT      REFERENCES projects(id),
    reviewer_id UUID        REFERENCES users(id),
    reviewee_id UUID        REFERENCES users(id),
    rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews (reviewee_id);

-- ── MESSAGES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id          BIGSERIAL   PRIMARY KEY,
    project_id  BIGINT      REFERENCES projects(id) ON DELETE CASCADE,
    sender_id   UUID        REFERENCES users(id),
    content     TEXT        NOT NULL,
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read        BOOLEAN     NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_messages_project ON messages (project_id);

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
CREATE INDEX IF NOT EXISTS idx_payments_project ON payments (project_id);

-- ── TEAMS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    leader_id  UUID         REFERENCES users(id),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

-- ── FEATURE USAGE LOGS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_usage_logs (
    id            BIGSERIAL   PRIMARY KEY,
    freelancer_id UUID        REFERENCES users(id) ON DELETE CASCADE,
    feature_key   VARCHAR(80) NOT NULL,
    used_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feature_usage_key ON feature_usage_logs (feature_key);

-- ── REVENUE SNAPSHOTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenue_snapshots (
    id                 BIGSERIAL     PRIMARY KEY,
    month              VARCHAR(7)    NOT NULL UNIQUE,
    total_revenue      NUMERIC(14,2) NOT NULL DEFAULT 0,
    contract_count     INT           NOT NULL DEFAULT 0,
    avg_contract_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── BUSINESS EVENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_events (
    id           BIGSERIAL   PRIMARY KEY,
    event_type   VARCHAR(80) NOT NULL,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    BIGINT,
    payload_json TEXT,
    processed    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_biz_events_entity ON business_events (entity_id);
CREATE INDEX IF NOT EXISTS idx_biz_events_type   ON business_events (event_type);

-- ── AGENT RESULTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_results (
    id                BIGSERIAL    PRIMARY KEY,
    business_event_id BIGINT       REFERENCES business_events(id) ON DELETE CASCADE,
    agent_name        VARCHAR(100) NOT NULL,
    severity          VARCHAR(20)  NOT NULL,
    score             NUMERIC(5,2) NOT NULL,
    summary           TEXT,
    raw_data_json     TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_results_event  ON agent_results (business_event_id);
CREATE INDEX IF NOT EXISTS idx_agent_results_agent  ON agent_results (agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_results_recent ON agent_results (agent_name, created_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_recommendations_status   ON recommendations (status);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations (priority, created_at DESC);

-- ── AUTOMATION ACTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_actions (
    id                BIGSERIAL   PRIMARY KEY,
    recommendation_id BIGINT      REFERENCES recommendations(id),
    action_type       VARCHAR(80) NOT NULL,
    action_detail     TEXT,
    executed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success           BOOLEAN     NOT NULL DEFAULT FALSE,
    error_message     TEXT
);
CREATE INDEX IF NOT EXISTS idx_auto_actions_rec       ON automation_actions (recommendation_id);
CREATE INDEX IF NOT EXISTS idx_auto_actions_executed  ON automation_actions (executed_at DESC);

-- ================================================================
-- FLYWAY SCHEMA HISTORY (mark as already run to prevent re-run)
-- ================================================================
CREATE TABLE IF NOT EXISTS flyway_schema_history (
    installed_rank INT          NOT NULL,
    version        VARCHAR(50),
    description    VARCHAR(200) NOT NULL,
    type           VARCHAR(20)  NOT NULL,
    script         VARCHAR(1000) NOT NULL,
    checksum       INT,
    installed_by   VARCHAR(100) NOT NULL,
    installed_on   TIMESTAMP    NOT NULL DEFAULT NOW(),
    execution_time INT          NOT NULL,
    success        BOOLEAN      NOT NULL,
    PRIMARY KEY (installed_rank)
);
