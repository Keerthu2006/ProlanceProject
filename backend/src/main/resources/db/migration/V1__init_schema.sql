-- ================================================================
--  V1__init_schema.sql
--  Initial database schema for TriGrowth AI
--  Managed by Flyway – do NOT edit once applied.
-- ================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email            VARCHAR(100)  NOT NULL UNIQUE,
    username         VARCHAR(50)   NOT NULL UNIQUE,
    password         VARCHAR(255)  NOT NULL,
    full_name        VARCHAR(150)  NOT NULL,
    role             VARCHAR(30)   NOT NULL,
    profile_image_url VARCHAR(500),
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ
);

CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role     ON users (role);

-- ── FREELANCER PROFILES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    headline        VARCHAR(200),
    bio             TEXT,
    hourly_rate     NUMERIC(10,2),
    availability    VARCHAR(30),   -- FULL_TIME | PART_TIME | NOT_AVAILABLE
    ai_score        NUMERIC(5,2),  -- AI-computed score 0-100
    skills          TEXT[],
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);

-- ── PROJECTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID        NOT NULL REFERENCES users(id),
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    budget_min      NUMERIC(12,2),
    budget_max      NUMERIC(12,2),
    status          VARCHAR(30) NOT NULL DEFAULT 'OPEN',  -- OPEN | IN_PROGRESS | COMPLETED | CANCELLED
    skills_required TEXT[],
    deadline        DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);

CREATE INDEX idx_projects_owner  ON projects (owner_id);
CREATE INDEX idx_projects_status ON projects (status);

-- ── BIDS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bids (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id   UUID          NOT NULL REFERENCES users(id),
    amount          NUMERIC(12,2) NOT NULL,
    cover_letter    TEXT,
    status          VARCHAR(30)   NOT NULL DEFAULT 'PENDING',  -- PENDING | ACCEPTED | REJECTED | WITHDRAWN
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, freelancer_id)
);

-- ── CONTRACTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID          NOT NULL REFERENCES projects(id),
    client_id       UUID          NOT NULL REFERENCES users(id),
    freelancer_id   UUID          NOT NULL REFERENCES users(id),
    amount          NUMERIC(12,2) NOT NULL,
    status          VARCHAR(30)   NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | COMPLETED | DISPUTED | CANCELLED
    started_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- ── MESSAGES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID        NOT NULL REFERENCES users(id),
    receiver_id UUID        NOT NULL REFERENCES users(id),
    content     TEXT        NOT NULL,
    is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_sender   ON messages (sender_id);
CREATE INDEX idx_messages_receiver ON messages (receiver_id);
