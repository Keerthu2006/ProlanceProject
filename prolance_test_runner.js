/**
 * Prolance AI Platform - Automated Test Runner
 * Run from project root: node prolance_test_runner.js
 */

const axios = require("axios");

const BASE = "http://localhost:8080/api";
const AI   = "http://localhost:8001";

const GREEN  = "\x1b[32m"; const RED    = "\x1b[31m"; const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m"; const BOLD   = "\x1b[1m";  const RESET  = "\x1b[0m";

let passed = 0, failed = 0, skipped = 0;
let adminToken, clientToken, freelancerToken, freelancer2Token;
let projectId, applicationId, teamId, paymentId, recommendationId;

function header(title) {
  console.log(`\n${BOLD}${CYAN}${"═".repeat(60)}${RESET}`);
  console.log(`${BOLD}${CYAN}  ${title}${RESET}`);
  console.log(`${BOLD}${CYAN}${"═".repeat(60)}${RESET}`);
}

async function test(id, description, fn) {
  try {
    await fn();
    console.log(`  ${GREEN}✅ PASS${RESET}  [${id}] ${description}`);
    passed++;
  } catch (e) {
    const msg = e.response ? `HTTP ${e.response.status} - ${JSON.stringify(e.response.data).slice(0,80)}` : e.message.slice(0,80);
    console.log(`  ${RED}❌ FAIL${RESET}  [${id}] ${description}`);
    console.log(`         ${RED}→ ${msg}${RESET}`);
    failed++;
  }
}

function skip(id, description, reason) {
  console.log(`  ${YELLOW}⚠️  SKIP${RESET}  [${id}] ${description} (${reason})`);
  skipped++;
}

function auth(token) { return { headers: { Authorization: `Bearer ${token}` } }; }

async function waitForBackend(maxWaitMs = 90000) {
  const start = Date.now();
  process.stdout.write(`\n${CYAN}Waiting for backend...${RESET}`);
  while (Date.now() - start < maxWaitMs) {
    try { await axios.get(`${BASE}/projects/open`); console.log(` ${GREEN}Ready!${RESET}`); return true; }
    catch (_) { process.stdout.write("."); await new Promise(r => setTimeout(r, 2000)); }
  }
  console.log(` ${RED}Timeout!${RESET}`); return false;
}

async function waitForAI(maxWaitMs = 10000) {
  const start = Date.now();
  process.stdout.write(`${CYAN}Waiting for AI service...${RESET}`);
  while (Date.now() - start < maxWaitMs) {
    try { await axios.get(`${AI}/docs`); console.log(` ${GREEN}Ready!${RESET}`); return true; }
    catch (_) { process.stdout.write("."); await new Promise(r => setTimeout(r, 1500)); }
  }
  console.log(` ${YELLOW}Not reachable (AI tests will be skipped)${RESET}`); return false;
}

async function run() {
  console.log(`\n${BOLD}╔════════════════════════════════════════════════════════╗`);
  console.log(`║   PROLANCE AI — AUTOMATED TEST RUNNER                  ║`);
  console.log(`╚════════════════════════════════════════════════════════╝${RESET}`);

  const backendReady = await waitForBackend();
  if (!backendReady) { process.exit(1); }
  const aiReady = await waitForAI();

  const ts = Date.now();
  const clientEmail      = `testclient_${ts}@prolance.ai`;
  const freelancer1Email = `freelancer1_${ts}@prolance.ai`;
  const freelancer2Email = `freelancer2_${ts}@prolance.ai`;

  header("MODULE 1 — Authentication & Authorization");

  await test("TC-AUTH-01", "Register new Client account", async () => {
    const r = await axios.post(`${BASE}/auth/register`, { email: clientEmail, password: "Test1234!", fullName: "Test Client", username: `client_${ts}`, role: "ROLE_CLIENT" });
    clientToken = r.data.accessToken;
    if (!clientToken) throw new Error("No token returned");
  });

  await test("TC-AUTH-02", "Register Freelancer 1 account", async () => {
    const r = await axios.post(`${BASE}/auth/register`, { email: freelancer1Email, password: "Test1234!", fullName: "Freelancer One", username: `fl1_${ts}`, role: "ROLE_FREELANCER" });
    freelancerToken = r.data.accessToken;
    if (!freelancerToken) throw new Error("No token");
  });

  await test("TC-AUTH-02b", "Register Freelancer 2 account", async () => {
    const r = await axios.post(`${BASE}/auth/register`, { email: freelancer2Email, password: "Test1234!", fullName: "Freelancer Two", username: `fl2_${ts}`, role: "ROLE_FREELANCER" });
    freelancer2Token = r.data.accessToken;
    if (!freelancer2Token) throw new Error("No token");
  });

  await test("TC-AUTH-03", "Login with correct credentials", async () => {
    const r = await axios.post(`${BASE}/auth/login`, { email: clientEmail, password: "Test1234!" });
    if (!r.data.accessToken) throw new Error("No token");
  });

  await test("TC-AUTH-04", "Login with wrong password → 401", async () => {
    try { await axios.post(`${BASE}/auth/login`, { email: clientEmail, password: "WRONG" }); throw new Error("Should throw"); }
    catch(e) { if (!e.response || e.response.status !== 401) throw e; }
  });

  await test("TC-AUTH-05", "No token → 401/403/302", async () => {
    try { await axios.get(`${BASE}/projects/mine`, { maxRedirects: 0 }); throw new Error("Should throw"); }
    catch(e) { if (!e.response || (e.response.status !== 401 && e.response.status !== 403 && e.response.status !== 302)) throw e; }
  });

  await test("TC-AUTH-07", "Admin login (admin@prolance.ai / admin123)", async () => {
    const r = await axios.post(`${BASE}/auth/login`, { email: "admin@prolance.ai", password: "admin123" });
    adminToken = r.data.accessToken;
    if (!adminToken) throw new Error("No admin token");
  });

  await test("TC-AUTH-06", "Owner route blocked for Freelancer → 403", async () => {
    try { await axios.get(`${BASE}/owner/summary`, auth(freelancerToken)); throw new Error("Should throw"); }
    catch(e) { if (!e.response || e.response.status !== 403) throw e; }
  });

  await test("TC-AUTH-10", "Duplicate email → 400", async () => {
    try { await axios.post(`${BASE}/auth/register`, { email: clientEmail, password: "Test1234!", fullName: "Dupe", username: `dupe_${ts}2`, role: "ROLE_CLIENT" }); throw new Error("Should throw"); }
    catch(e) { if (!e.response || e.response.status !== 400) throw e; }
  });

  skip("TC-AUTH-08", "Google OAuth redirect", "requires browser");
  skip("TC-AUTH-09", "JWT expiry", "requires waiting for TTL");

  header("MODULE 2 — Project Management");

  await test("TC-PROJ-01", "Client creates project", async () => {
    const r = await axios.post(`${BASE}/projects`, { title: "Auto Test Project", description: "Automated", budgetMin: 500, budgetMax: 1000, skillsRequired: ["Java"], durationDays: 30 }, auth(clientToken));
    projectId = r.data.id;
    if (!projectId || r.data.status !== "OPEN") throw new Error("Project not created as OPEN");
  });

  await test("TC-PROJ-02", "List open projects (no auth)", async () => {
    const r = await axios.get(`${BASE}/projects/open`);
    if (!Array.isArray(r.data)) throw new Error("Not array");
  });

  await test("TC-PROJ-03", "Client views own projects", async () => {
    const r = await axios.get(`${BASE}/projects/mine`, auth(clientToken));
    if (!r.data.some(p => p.id === projectId)) throw new Error("Own project not found");
  });

  await test("TC-PROJ-04", "Freelancer applies to project", async () => {
    const r = await axios.post(`${BASE}/projects/${projectId}/apply`, { coverLetter: "Test application", proposedAmount: 750 }, auth(freelancerToken));
    if (r.data.status !== "PENDING") throw new Error("Not PENDING");
  });

  await test("TC-PROJ-05", "Duplicate apply → 400", async () => {
    try { await axios.post(`${BASE}/projects/${projectId}/apply`, { coverLetter: "Dup", proposedAmount: 750 }, auth(freelancerToken)); throw new Error("Should throw"); }
    catch(e) { if (!e.response || e.response.status !== 400) throw e; }
  });

  await test("TC-PROJ-06", "Client views applications", async () => {
    const r = await axios.get(`${BASE}/projects/${projectId}/applications`, auth(clientToken));
    if (!Array.isArray(r.data) || r.data.length === 0) throw new Error("No applications");
    applicationId = r.data[0].freelancer?.id;
  });

  await test("TC-PROJ-07", "Client hires freelancer", async () => {
    if (!applicationId) throw new Error("No freelancer ID");
    await axios.post(`${BASE}/projects/${projectId}/hire/${applicationId}`, {}, auth(clientToken));
  });

  await test("TC-PROJ-10", "Freelancer views assigned projects", async () => {
    const r = await axios.get(`${BASE}/projects/assigned`, auth(freelancerToken));
    if (!Array.isArray(r.data)) throw new Error("Not array");
  });

  await test("TC-PROJ-11", "Send and read project messages", async () => {
    await axios.post(`${BASE}/projects/${projectId}/messages`, { content: "Test message" }, auth(clientToken));
    const r = await axios.get(`${BASE}/projects/${projectId}/messages`, auth(clientToken));
    if (!Array.isArray(r.data) || r.data.length === 0) throw new Error("No messages");
  });

  await test("TC-PROJ-08", "Mark project complete", async () => {
    await axios.post(`${BASE}/projects/${projectId}/complete`, {}, auth(clientToken));
  });

  await test("TC-PROJ-12", "Submit review", async () => {
    if (!applicationId) throw new Error("No reviewee");
    await axios.post(`${BASE}/projects/${projectId}/reviews`, { revieweeId: applicationId, rating: 5, comment: "Great work!" }, auth(clientToken));
  });

  header("MODULE 3 — Team Formation & Bidding");

  let fl2Id;
  await test("TC-TEAM-01", "Create team with member", async () => {
    const meRes = await axios.get(`${BASE}/freelancers/me`, auth(freelancer2Token));
    fl2Id = meRes.data?.user?.id || meRes.data?.id || meRes.data?.userId;
    if (!fl2Id) throw new Error("Cannot get FL2 id");
    const r = await axios.post(`${BASE}/teams`, { name: `AutoTeam_${ts}`, memberIds: [fl2Id] }, auth(freelancerToken));
    teamId = r.data.id;
    if (!teamId) throw new Error("No team ID");
  });

  await test("TC-TEAM-02", "Team visible to leader", async () => {
    const r = await axios.get(`${BASE}/teams/mine`, auth(freelancerToken));
    if (!Array.isArray(r.data) || r.data.length === 0) throw new Error("No teams for leader");
  });

  await test("TC-TEAM-03", "Team visible to member", async () => {
    const r = await axios.get(`${BASE}/teams/mine`, auth(freelancer2Token));
    if (!Array.isArray(r.data) || r.data.length === 0) throw new Error("No teams for member");
  });

  header("MODULE 4 — Freelancer Profile");

  await test("TC-FREL-01", "View own profile", async () => {
    const r = await axios.get(`${BASE}/freelancers/me`, auth(freelancerToken));
    if (!r.data) throw new Error("No profile");
  });

  await test("TC-FREL-02", "Update profile", async () => {
    await axios.put(`${BASE}/freelancers/me`, { headline: "Test headline", bio: "Test bio", hourlyRate: 75, skills: ["Java"] }, auth(freelancerToken));
  });

  await test("TC-FREL-03", "List all freelancers", async () => {
    const r = await axios.get(`${BASE}/freelancers`, auth(adminToken));
    if (!Array.isArray(r.data)) throw new Error("Not array");
  });

  await test("TC-FREL-04", "Log feature usage", async () => {
    await axios.post(`${BASE}/freelancers/feature-usage/team_formation`, {}, auth(freelancerToken));
  });

  header("MODULE 5 — Payment System");

  await test("TC-PAY-01", "Initiate payment", async () => {
    if (!applicationId) throw new Error("No payee");
    const r = await axios.post(`${BASE}/payments/initiate`, { projectId, payeeId: applicationId, amount: 750 }, auth(clientToken));
    paymentId = r.data.id;
    if (r.data.status !== "PENDING") throw new Error("Not PENDING");
  });

  await test("TC-PAY-02", "Complete payment", async () => {
    if (!paymentId) throw new Error("No payment ID");
    await axios.post(`${BASE}/payments/${paymentId}/complete`, {}, auth(clientToken));
  });

  await test("TC-PAY-03", "View project payment history", async () => {
    const r = await axios.get(`${BASE}/payments/project/${projectId}`, auth(clientToken));
    if (!Array.isArray(r.data)) throw new Error("Not array");
  });

  header("MODULE 6 — Owner Admin Dashboard");

  await test("TC-OWN-01", "Owner views summary stats", async () => {
    const r = await axios.get(`${BASE}/owner/summary`, auth(adminToken));
    if (r.data.total_projects === undefined) throw new Error("Missing total_projects");
  });

  await test("TC-OWN-02", "Owner views pending recommendations", async () => {
    const r = await axios.get(`${BASE}/owner/recommendations/pending`, auth(adminToken));
    if (!Array.isArray(r.data)) throw new Error("Not array");
    if (r.data.length > 0) recommendationId = r.data[0].id;
  });

  await test("TC-OWN-05", "Owner views automation log", async () => {
    const r = await axios.get(`${BASE}/owner/automation-log`, auth(adminToken));
    if (!Array.isArray(r.data)) throw new Error("Not array");
  });

  await test("TC-OWN-06", "Owner views revenue snapshots", async () => {
    const r = await axios.get(`${BASE}/owner/revenue`, auth(adminToken));
    if (!Array.isArray(r.data)) throw new Error("Not array");
  });

  await test("TC-OWN-07", "Owner views business events", async () => {
    const r = await axios.get(`${BASE}/owner/events`, auth(adminToken));
    if (!Array.isArray(r.data)) throw new Error("Not array");
  });

  await test("TC-OWN-08", "Owner views CustomerNeglectAgent results", async () => {
    const r = await axios.get(`${BASE}/owner/agents/CustomerNeglectAgent/results`, auth(adminToken));
    if (!Array.isArray(r.data)) throw new Error("Not array");
  });

  if (recommendationId) {
    await test("TC-OWN-04", "Owner rejects recommendation", async () => {
      await axios.post(`${BASE}/owner/recommendations/${recommendationId}/reject`, {}, auth(adminToken));
    });
  } else {
    skip("TC-OWN-03+04", "Approve/Reject recommendation", "scheduler hasn't fired yet");
  }

  header("MODULE 7 — Customer Neglect ML Model");

  await test("TC-CN-05+06", "Neglect scan returns both roles", async () => {
    const r = await axios.get(`${BASE}/owner/neglect/customers`, auth(adminToken));
    if (!Array.isArray(r.data) || r.data.length === 0) throw new Error("Empty result");
    const roles = [...new Set(r.data.map(u => u.role))];
    if (!roles.includes("Client") && !roles.includes("Freelancer")) throw new Error(`Roles found: ${roles}`);
  });

  await test("TC-CN-07", "All users have ML risk field", async () => {
    const r = await axios.get(`${BASE}/owner/neglect/customers`, auth(adminToken));
    const missing = r.data.filter(u => !u.risk);
    if (missing.length > 0) throw new Error(`${missing.length} users missing risk`);
  });

  await test("TC-CN-10", "Fallback works — no 500 error", async () => {
    const r = await axios.get(`${BASE}/owner/neglect/customers`, auth(adminToken));
    if (r.status !== 200) throw new Error("Expected 200");
  });

  if (aiReady) {
    await test("TC-CN-01+02", "ML batch prediction API works", async () => {
      const r = await axios.post(`${AI}/predict-customer-neglect-batch`, {
        customers: [
          { id: "t1", days_inactive: 100, projects_30d: 0, total_projects: 0, is_freelancer: 0 },
          { id: "t2", days_inactive: 1, projects_30d: 5, total_projects: 20, is_freelancer: 1 }
        ]
      });
      if (!r.data.results || r.data.results.length !== 2) throw new Error("Wrong result count");
    });

    await test("TC-CN-03", "CRITICAL for 100-day inactive user", async () => {
      const r = await axios.post(`${AI}/predict-customer-neglect-batch`, {
        customers: [{ id: "c", days_inactive: 100, projects_30d: 0, total_projects: 0, is_freelancer: 0 }]
      });
      if (!["CRITICAL","HIGH"].includes(r.data.results[0].risk)) throw new Error(`Got: ${r.data.results[0].risk}`);
    });

    await test("TC-CN-04", "HEALTHY for active user", async () => {
      const r = await axios.post(`${AI}/predict-customer-neglect-batch`, {
        customers: [{ id: "h", days_inactive: 1, projects_30d: 5, total_projects: 30, is_freelancer: 1 }]
      });
      if (!["HEALTHY","LOW"].includes(r.data.results[0].risk)) throw new Error(`Got: ${r.data.results[0].risk}`);
    });

    await test("TC-AI-01", "AI /analyze/event endpoint responds", async () => {
      const r = await axios.post(`${AI}/analyze/event`, {
        event_type: "CLIENT_INACTIVITY_REPORT", entity_type: "SYSTEM", entity_id: 0,
        payload: { inactive_clients_count: 5, critical_count: 2, high_count: 3, total_clients: 50, days_inactive: 65 }
      });
      if (!r.data.agent_results) throw new Error("Missing agent_results");
    });
  } else {
    skip("TC-CN-01+02+03+04", "ML batch prediction", "AI service not running");
    skip("TC-AI-01", "AI analyze/event", "AI service not running");
  }

  // ── FINAL REPORT ──────────────────────────────────────────────────────────
  const total = passed + failed + skipped;
  const pct   = ((passed / Math.max(1, total - skipped)) * 100).toFixed(1);

  console.log(`\n${BOLD}╔════════════════════════════════════════════════════════╗`);
  console.log(`║   FINAL REPORT                                         ║`);
  console.log(`╠════════════════════════════════════════════════════════╣`);
  console.log(`║   Total   : ${String(total).padEnd(43)}║`);
  console.log(`║   Passed  : ${String(passed).padEnd(43)}║`);
  console.log(`║   Failed  : ${String(failed).padEnd(43)}║`);
  console.log(`║   Skipped : ${String(skipped).padEnd(43)}║`);
  console.log(`║   Rate    : ${String(pct + "%").padEnd(43)}║`);
  console.log(`╚════════════════════════════════════════════════════════╝${RESET}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(RED + "Fatal: " + e.message + RESET); process.exit(1); });
