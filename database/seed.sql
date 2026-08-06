-- ================================================================
--  TriGrowth AI – Demo Seed Data
--  Run AFTER schema.sql
--  Creates realistic demo data for the Tea startup scenario
-- ================================================================

-- ── 1. USERS ─────────────────────────────────────────────────
-- Password for all demo accounts: password123
-- BCrypt hash of "password123"
-- (Generated with: htpasswd -bnBC 10 "" password123 | tr -d ':\n')
DO $$
DECLARE
    hash TEXT := '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
BEGIN

-- Platform Owner (Tea startup founder)
INSERT INTO users (id, email, username, password, full_name, role)
VALUES
    ('00000000-0000-0000-0000-000000000001',
     'owner@tea.com', 'teaowner', hash, 'Arjun Sharma', 'ROLE_OWNER')
ON CONFLICT (email) DO NOTHING;

-- Clients
INSERT INTO users (id, email, username, password, full_name, role) VALUES
    ('00000000-0000-0000-0000-000000000010',
     'client@tea.com', 'teaclient', hash, 'Priya Menon', 'ROLE_CLIENT'),
    ('00000000-0000-0000-0000-000000000011',
     'client2@tea.com', 'teaclient2', hash, 'Rohan Verma', 'ROLE_CLIENT'),
    ('00000000-0000-0000-0000-000000000012',
     'client3@tea.com', 'teaclient3', hash, 'Neha Gupta', 'ROLE_CLIENT')
ON CONFLICT (email) DO NOTHING;

-- Freelancers
INSERT INTO users (id, email, username, password, full_name, role) VALUES
    ('00000000-0000-0000-0000-000000000020',
     'dev@tea.com', 'reactdev', hash, 'Karan Singh', 'ROLE_FREELANCER'),
    ('00000000-0000-0000-0000-000000000021',
     'backend@tea.com', 'javadev', hash, 'Sneha Pillai', 'ROLE_FREELANCER'),
    ('00000000-0000-0000-0000-000000000022',
     'ml@tea.com', 'mlexpert', hash, 'Vikram Nair', 'ROLE_FREELANCER'),
    ('00000000-0000-0000-0000-000000000023',
     'design@tea.com', 'uidesigner', hash, 'Anjali Rao', 'ROLE_FREELANCER'),
    ('00000000-0000-0000-0000-000000000024',
     'mobile@tea.com', 'flutterdev', hash, 'Rahul Kumar', 'ROLE_FREELANCER')
ON CONFLICT (email) DO NOTHING;

END $$;

-- ── 2. FREELANCER PROFILES ────────────────────────────────────
INSERT INTO freelancer_profiles (user_id, headline, bio, hourly_rate, availability, ai_score)
VALUES
    ('00000000-0000-0000-0000-000000000020',
     'Full-Stack React & Node Developer',
     'Experienced full-stack developer specializing in React, Next.js, and Node.js. Delivered 40+ projects.',
     35.00, 'FULL_TIME', 88.5),
    ('00000000-0000-0000-0000-000000000021',
     'Java Spring Boot & Microservices Expert',
     'Backend Java developer with 5 years of Spring Boot, PostgreSQL, and AWS experience.',
     42.00, 'FULL_TIME', 91.2),
    ('00000000-0000-0000-0000-000000000022',
     'Machine Learning & AI Engineer',
     'ML engineer with expertise in Python, TensorFlow, scikit-learn, and NLP.',
     55.00, 'PART_TIME', 79.8),
    ('00000000-0000-0000-0000-000000000023',
     'UI/UX Designer & Figma Expert',
     'Creative designer delivering pixel-perfect designs for web and mobile apps.',
     30.00, 'FULL_TIME', 85.1),
    ('00000000-0000-0000-0000-000000000024',
     'Flutter & React Native Developer',
     'Cross-platform mobile developer with 4 years of Flutter and React Native experience.',
     38.00, 'FULL_TIME', 82.3)
ON CONFLICT (user_id) DO NOTHING;

-- Skills for each profile
DO $$
DECLARE
    p1 BIGINT; p2 BIGINT; p3 BIGINT; p4 BIGINT; p5 BIGINT;
BEGIN
    SELECT id INTO p1 FROM freelancer_profiles WHERE user_id = '00000000-0000-0000-0000-000000000020';
    SELECT id INTO p2 FROM freelancer_profiles WHERE user_id = '00000000-0000-0000-0000-000000000021';
    SELECT id INTO p3 FROM freelancer_profiles WHERE user_id = '00000000-0000-0000-0000-000000000022';
    SELECT id INTO p4 FROM freelancer_profiles WHERE user_id = '00000000-0000-0000-0000-000000000023';
    SELECT id INTO p5 FROM freelancer_profiles WHERE user_id = '00000000-0000-0000-0000-000000000024';

    INSERT INTO freelancer_profile_skills VALUES
        (p1, 'React'), (p1, 'Node.js'), (p1, 'TypeScript'), (p1, 'PostgreSQL'),
        (p2, 'Java'), (p2, 'Spring Boot'), (p2, 'Microservices'), (p2, 'AWS'),
        (p3, 'Python'), (p3, 'Machine Learning'), (p3, 'TensorFlow'), (p3, 'NLP'),
        (p4, 'Figma'), (p4, 'UI/UX'), (p4, 'Wireframing'), (p4, 'Prototyping'),
        (p5, 'Flutter'), (p5, 'React Native'), (p5, 'Dart'), (p5, 'iOS'), (p5, 'Android');
END $$;

-- ── 3. PROJECTS ───────────────────────────────────────────────
INSERT INTO projects (owner_id, client_id, title, description, budget_min, budget_max, status, duration_days, featured)
VALUES
    -- Active / Open projects
    ('00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000010',
     'Tea E-Commerce Website Redesign',
     'Redesign our tea brand website with modern UI, animations, and mobile-first approach. Integrate payment gateway.',
     800, 1500, 'OPEN', 21, TRUE),

    ('00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000010',
     'AI-Powered Product Recommendation Engine',
     'Build a recommendation engine using collaborative filtering for our tea product catalog.',
     1200, 2500, 'OPEN', 30, FALSE),

    ('00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000011',
     'Tea Subscription Mobile App (Flutter)',
     'Cross-platform mobile app for tea subscriptions with QR code scanning and loyalty rewards.',
     1500, 3000, 'OPEN', 45, FALSE),

    -- Stale project (no applications, older) - triggers Customer Neglect Agent
    ('00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000012',
     'Tea Brand Social Media Dashboard',
     'Analytics dashboard tracking Instagram, Twitter engagements for our tea brand campaigns.',
     400, 800, 'OPEN', 14, FALSE),

    -- In Progress
    ('00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000010',
     'Backend API for Inventory Management',
     'REST API with Spring Boot + PostgreSQL for real-time inventory tracking across 12 tea outlets.',
     1000, 2000, 'IN_PROGRESS', 25, FALSE),

    -- Completed
    ('00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000011',
     'Logo & Brand Identity Design',
     'Complete brand identity kit including logo, color palette, typography, and brand guidelines.',
     300, 600, 'COMPLETED', 10, FALSE);

-- Project skills
DO $$
DECLARE
    p1 BIGINT; p2 BIGINT; p3 BIGINT; p4 BIGINT; p5 BIGINT; p6 BIGINT;
BEGIN
    SELECT id INTO p1 FROM projects WHERE title LIKE '%E-Commerce Website%';
    SELECT id INTO p2 FROM projects WHERE title LIKE '%Recommendation Engine%';
    SELECT id INTO p3 FROM projects WHERE title LIKE '%Mobile App%';
    SELECT id INTO p4 FROM projects WHERE title LIKE '%Social Media Dashboard%';
    SELECT id INTO p5 FROM projects WHERE title LIKE '%Inventory Management%';
    SELECT id INTO p6 FROM projects WHERE title LIKE '%Logo%';

    INSERT INTO project_skills VALUES
        (p1, 'React'), (p1, 'UI/UX'), (p1, 'TypeScript'),
        (p2, 'Python'), (p2, 'Machine Learning'), (p2, 'Node.js'),
        (p3, 'Flutter'), (p3, 'Dart'), (p3, 'Mobile'),
        (p4, 'React'), (p4, 'Node.js'), (p4, 'APIs'),
        (p5, 'Java'), (p5, 'Spring Boot'), (p5, 'PostgreSQL'),
        (p6, 'Figma'), (p6, 'UI/UX');
END $$;

-- ── 4. APPLICATIONS ───────────────────────────────────────────
DO $$
DECLARE
    pr1 BIGINT; pr2 BIGINT; pr5 BIGINT;
BEGIN
    SELECT id INTO pr1 FROM projects WHERE title LIKE '%E-Commerce Website%';
    SELECT id INTO pr2 FROM projects WHERE title LIKE '%Recommendation Engine%';
    SELECT id INTO pr5 FROM projects WHERE title LIKE '%Inventory Management%';

    INSERT INTO applications (project_id, freelancer_id, cover_letter, proposed_amount, status) VALUES
        (pr1, '00000000-0000-0000-0000-000000000020',
         'I have redesigned 5 e-commerce sites this year. Confident in delivering a stunning, conversion-optimised design.',
         1200.00, 'PENDING'),
        (pr1, '00000000-0000-0000-0000-000000000023',
         'Expert UI/UX designer with a focus on tea and beverage brands. Let me make your brand shine.',
         1100.00, 'PENDING'),
        (pr2, '00000000-0000-0000-0000-000000000022',
         'I have built recommendation engines using collaborative filtering + content-based hybrid models.',
         2000.00, 'PENDING'),
        (pr5, '00000000-0000-0000-0000-000000000021',
         'Spring Boot + PostgreSQL is my bread and butter. Ready to start immediately.',
         1800.00, 'ACCEPTED');
END $$;

-- ── 5. REVIEWS ────────────────────────────────────────────────
DO $$
DECLARE
    pr6 BIGINT;
BEGIN
    SELECT id INTO pr6 FROM projects WHERE title LIKE '%Logo%';
    INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment) VALUES
        (pr6, '00000000-0000-0000-0000-000000000011',
         '00000000-0000-0000-0000-000000000023',
         5, 'Anjali delivered stunning work! The brand kit was professional and modern. Highly recommend!'),
        (pr6, '00000000-0000-0000-0000-000000000011',
         '00000000-0000-0000-0000-000000000023',
         5, 'Second review – great communication and delivered on time.');
END $$;

-- ── 6. MESSAGES ───────────────────────────────────────────────
DO $$
DECLARE
    pr1 BIGINT;
BEGIN
    SELECT id INTO pr1 FROM projects WHERE title LIKE '%E-Commerce Website%';
    INSERT INTO messages (project_id, sender_id, content, sent_at) VALUES
        (pr1, '00000000-0000-0000-0000-000000000010',
         'Hi Karan! Thanks for applying. Can you share your portfolio link?',
         NOW() - INTERVAL '2 hours'),
        (pr1, '00000000-0000-0000-0000-000000000020',
         'Sure! Here''s my portfolio: https://karan.dev – I''ve also attached a rough wireframe.',
         NOW() - INTERVAL '1 hour 45 minutes'),
        (pr1, '00000000-0000-0000-0000-000000000010',
         'Looks great! Let''s schedule a call tomorrow at 10am IST?',
         NOW() - INTERVAL '1 hour');
END $$;

-- ── 7. PAYMENTS ───────────────────────────────────────────────
DO $$
DECLARE
    pr5 BIGINT; pr6 BIGINT;
BEGIN
    SELECT id INTO pr5 FROM projects WHERE title LIKE '%Inventory Management%';
    SELECT id INTO pr6 FROM projects WHERE title LIKE '%Logo%';

    INSERT INTO payments (project_id, payer_id, payee_id, amount, status, completed_at) VALUES
        (pr6, '00000000-0000-0000-0000-000000000011',
         '00000000-0000-0000-0000-000000000023',
         550.00, 'COMPLETED', NOW() - INTERVAL '3 days'),
        (pr5, '00000000-0000-0000-0000-000000000010',
         '00000000-0000-0000-0000-000000000021',
         900.00, 'PENDING', NULL);  -- first milestone pending
END $$;

-- ── 8. REVENUE SNAPSHOTS ──────────────────────────────────────
INSERT INTO revenue_snapshots (month, total_revenue, contract_count, avg_contract_value) VALUES
    ('2026-01', 1200.00, 3, 400.00),
    ('2026-02', 1850.00, 4, 462.50),
    ('2026-03', 2400.00, 5, 480.00),
    ('2026-04', 1900.00, 4, 475.00),
    ('2026-05', 3100.00, 6, 516.67),
    ('2026-06', 2750.00, 5, 550.00),
    ('2026-07', 550.00,  1, 550.00)  -- current month (partial)
ON CONFLICT (month) DO NOTHING;

-- ── 9. BUSINESS EVENTS (simulated AI monitoring history) ──────
INSERT INTO business_events (event_type, entity_type, entity_id, payload_json, processed)
VALUES
    ('CLIENT_INACTIVE', 'PROJECT', 4,
     '{"hours_since_posted": 52, "application_count": 0, "budget_max": 800, "client_email": "client3@tea.com"}',
     TRUE),
    ('FEATURE_UNUSED', 'PLATFORM', 0,
     '{"feature_key": "TEAM_CREATION", "adoption_rate": 0.06, "total_freelancers": 5, "feature_usage_count": 0}',
     TRUE),
    ('REVENUE_DROP', 'PLATFORM', 0,
     '{"monthly_revenue": 2750.00, "prev_month_revenue": 3100.00, "pending_payments_count": 1}',
     TRUE);

-- ── 10. AGENT RESULTS (from simulated AI analysis) ────────────
DO $$
DECLARE
    ev1 BIGINT; ev2 BIGINT; ev3 BIGINT;
BEGIN
    SELECT id INTO ev1 FROM business_events WHERE event_type = 'CLIENT_INACTIVE' LIMIT 1;
    SELECT id INTO ev2 FROM business_events WHERE event_type = 'FEATURE_UNUSED' LIMIT 1;
    SELECT id INTO ev3 FROM business_events WHERE event_type = 'REVENUE_DROP' LIMIT 1;

    INSERT INTO agent_results (business_event_id, agent_name, severity, score, summary, raw_data_json)
    VALUES
        (ev1, 'CustomerNeglectAgent', 'HIGH', 65.0,
         'Project open for 52h with 0 applications. Client client3@tea.com may churn.',
         '{"hours_open": 52, "application_count": 0, "budget_max": 800}'),
        (ev2, 'ProductNeglectAgent', 'HIGH', 70.0,
         'Feature TEAM_CREATION adopted by only 6% of freelancers (0/5 users). Product engagement risk.',
         '{"feature_key": "TEAM_CREATION", "adoption_rate": 0.06}'),
        (ev3, 'FinancialNeglectAgent', 'MEDIUM', 42.0,
         'Revenue trend: -11.3% vs last month. 1 pending payment(s). Conversion: 83.3%.',
         '{"monthly_revenue": 2750, "prev_month_revenue": 3100, "pending_payments": 1}');

    -- ── 11. RECOMMENDATIONS ──────────────────────────────────
    INSERT INTO recommendations (agent_result_id, priority, status, problem, reason, prediction,
                                  recommended_action, expected_improvement, confidence,
                                  automation_plan_json, updated_at)
    VALUES
        ((SELECT id FROM agent_results WHERE agent_name='CustomerNeglectAgent' LIMIT 1),
         2, 'PENDING',
         'A client project has received 0 applications in 52 hours.',
         'The project budget (₹800) is below market rate and lacks visibility.',
         'Client Neha Gupta will abandon the platform within 24 hours without intervention.',
         'Feature the project on homepage and notify all freelancers with React & Node.js skills.',
         '70% chance of first application within 6 hours.',
         72.0,
         '[{"action_type":"FEATURE_PROJECT","action_detail":"Feature Social Media Dashboard project for 48h"},{"action_type":"NOTIFY_FREELANCERS","action_detail":"Notify React and API freelancers"},{"action_type":"EMAIL_CLIENT","action_detail":"Send reassurance email to Neha Gupta"}]',
         NOW()),

        ((SELECT id FROM agent_results WHERE agent_name='ProductNeglectAgent' LIMIT 1),
         3, 'PENDING',
         'Teams feature has near-zero adoption (6%) among freelancers.',
         'Freelancers are unaware of the Teams collaboration feature.',
         'Platform loses competitive edge against Fiverr and Upwork within 60 days.',
         'Launch targeted email campaign showcasing team collaboration benefits with real examples.',
         'Projected 25% adoption increase in 2 weeks.',
         65.0,
         '[{"action_type":"DRAFT_EMAIL_CAMPAIGN","action_detail":"Draft Teams feature launch email for all freelancers"},{"action_type":"DRAFT_SOCIAL_POST","action_detail":"Post about Teams on LinkedIn & Twitter"}]',
         NOW()),

        ((SELECT id FROM agent_results WHERE agent_name='FinancialNeglectAgent' LIMIT 1),
         3, 'APPROVED',
         'Monthly revenue declined 11.3% vs previous month.',
         'Fewer completed contracts and 1 pending payment outstanding.',
         'Cash flow issues may emerge if trend continues for another month.',
         'Send payment follow-up to client and offer 5% completion bonus to freelancers.',
         'Recover pending payment within 7 days and stabilise revenue.',
         68.0,
         '[{"action_type":"EMAIL_OWNER_REPORT","action_detail":"Send monthly revenue risk report"},{"action_type":"SCHEDULE_FOLLOWUP","action_detail":"Schedule payment follow-up for pending ₹900 payment"}]',
         NOW());
END $$;

-- ── 12. AUTOMATION ACTIONS (executed from approved rec) ───────
DO $$
DECLARE
    rec_id BIGINT;
BEGIN
    SELECT id INTO rec_id FROM recommendations WHERE status = 'APPROVED' LIMIT 1;
    INSERT INTO automation_actions (recommendation_id, action_type, action_detail, success)
    VALUES
        (rec_id, 'EMAIL_OWNER_REPORT',
         'Financial risk report emailed to owner@tea.com. Revenue decline of 11.3% flagged.',
         TRUE),
        (rec_id, 'SCHEDULE_FOLLOWUP',
         'Follow-up scheduled for 2026-07-17. Pending payment: ₹900 from client Priya Menon.',
         TRUE);
END $$;

-- ── 13. FEATURE USAGE LOGS ────────────────────────────────────
-- Only Karan has used profile completion feature
INSERT INTO feature_usage_logs (freelancer_id, feature_key, used_at) VALUES
    ('00000000-0000-0000-0000-000000000020', 'PROFILE_COMPLETION', NOW() - INTERVAL '5 days'),
    ('00000000-0000-0000-0000-000000000021', 'PROFILE_COMPLETION', NOW() - INTERVAL '3 days');
-- Note: TEAM_CREATION has 0 usage – triggers ProductNeglectAgent

-- ── 14. TEAMS ─────────────────────────────────────────────────
-- (Empty – to demonstrate Product Neglect Agent triggering on zero team usage)

-- ================================================================
-- VERIFICATION QUERIES – Run these to confirm seed data
-- ================================================================
-- SELECT role, COUNT(*) FROM users GROUP BY role;
-- SELECT status, COUNT(*) FROM projects GROUP BY status;
-- SELECT agent_name, severity, score FROM agent_results ORDER BY score DESC;
-- SELECT priority, status, problem FROM recommendations ORDER BY priority;
-- SELECT month, total_revenue, contract_count FROM revenue_snapshots ORDER BY month;
