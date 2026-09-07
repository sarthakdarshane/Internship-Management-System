/* Comprehensive endpoint test for the Internship Management backend.
   Run: node scripts/test-endpoints.js (from the Backend directory)
   Tests every major endpoint for every role. */
const BASE = {
  auth: "http://localhost:5001/api/auth",
  internship: "http://localhost:5002/api/internships",
  task: "http://localhost:5003/api/tasks",
  sentiment: "http://localhost:5004/api/sentiment",
  evaluation: "http://localhost:5005/api/evaluations",
  report: "http://localhost:5006/api/reports",
};

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
}
async function req(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

async function login(email, password) {
  const r = await req("POST", BASE.auth + "/login", null, { email, password });
  return r.json?.token;
}

async function main() {
  // 1. Auth endpoints
  const adminToken = await login("admin@test.com", "Password123");
  record("POST /auth/login (admin)", Boolean(adminToken));

  const hrToken = await login("hr@test.com", "Password123");
  record("POST /auth/login (hr)", Boolean(hrToken));

  const mentorToken = await login("mentor@test.com", "Password123");
  record("POST /auth/login (mentor)", Boolean(mentorToken));

  const internToken = await login("intern1@test.com", "Password123");
  record("POST /auth/login (intern)", Boolean(internToken));

  let r = await req("GET", BASE.auth + "/profile", internToken);
  record("GET /auth/profile", r.status === 200 && r.json?.user, r.status + "");

  r = await req("GET", BASE.auth + "/users", adminToken);
  record("GET /auth/users (admin)", r.status === 200 && Array.isArray(r.json?.users), r.status + "");

  r = await req("GET", BASE.auth + "/users?role=INTERN", hrToken);
  record("GET /auth/users?role=INTERN (hr)", r.status === 200 && Array.isArray(r.json?.users), r.status + "");

  r = await req("PATCH", BASE.auth + "/users/10/role", adminToken, { role: "INTERN" });
  record("PATCH /auth/users/:id/role (admin)", r.status === 200, r.status + "");

  // 2. Internship endpoints
  r = await req("POST", BASE.internship, adminToken, {
    intern_id: 10, mentor_id: 9, company_name: "Test Corp",
    internship_title: "Full Stack Intern", start_date: "2026-09-01",
    end_date: "2026-12-31", description: "Build features end-to-end",
  });
  const internshipId = r.json?.internship?.internship_id;
  record("POST /internships (admin)", r.status === 201 && internshipId, r.status + "");

  r = await req("GET", BASE.internship, adminToken);
  record("GET /internships (admin)", r.status === 200 && Array.isArray(r.json?.internships), r.status + "");

  r = await req("GET", BASE.internship + "/mine", internToken);
  record("GET /internships/mine (intern)", r.status === 200 && Array.isArray(r.json?.internships), r.status + "");

  r = await req("GET", BASE.internship + "/assigned", mentorToken);
  record("GET /internships/assigned (mentor)", r.status === 200 && Array.isArray(r.json?.internships), r.status + "");

  r = await req("GET", BASE.internship + "/" + internshipId, internToken);
  record("GET /internships/:id (intern owner)", r.status === 200 && r.json?.internship, r.status + "");

  r = await req("PUT", BASE.internship + "/" + internshipId, adminToken, {
    mentor_id: 9, company_name: "Test Corp Updated", internship_title: "Full Stack Intern",
    start_date: "2026-09-01", end_date: "2026-12-31", status: "ACTIVE",
    description: "Updated description",
  });
  record("PUT /internships/:id (admin)", r.status === 200, r.status + "");

  // 3. Task endpoints
  r = await req("POST", BASE.task, mentorToken, {
    internship_id: internshipId, intern_id: 10, mentor_id: 9,
    title: "Build login page", description: "Implement the login UI", due_date: "2026-10-01",
  });
  const taskId = r.json?.task?.task_id;
  record("POST /tasks (mentor)", r.status === 201 && taskId, r.status + "");

  r = await req("GET", BASE.task + "/mine", internToken);
  record("GET /tasks/mine (intern)", r.status === 200 && Array.isArray(r.json?.tasks), r.status + "");

  r = await req("GET", BASE.task + "/assigned", mentorToken);
  record("GET /tasks/assigned (mentor)", r.status === 200 && Array.isArray(r.json?.tasks), r.status + "");

  r = await req("GET", BASE.task, adminToken);
  record("GET /tasks (admin)", r.status === 200 && Array.isArray(r.json?.tasks), r.status + "");

  r = await req("PATCH", BASE.task + "/" + taskId, mentorToken, { status: "IN_PROGRESS" });
  record("PATCH /tasks/:id status (mentor)", r.status === 200, r.status + "");

  r = await req("POST", BASE.task + "/" + taskId + "/updates", internToken, {
    reflection: "I had a great day building the login page and learned a lot.",
    hours_worked: 6, update_date: "2026-09-15",
  });
  const updateId = r.json?.update?.update_id;
  record("POST /tasks/:id/updates (intern)", r.status === 201 && updateId, r.status + "");

  r = await req("GET", BASE.task + "/" + taskId + "/updates", mentorToken);
  record("GET /tasks/:id/updates (mentor)", r.status === 200 && Array.isArray(r.json?.updates), r.status + "");

  r = await req("PATCH", BASE.task + "/" + taskId, internToken, { status: "COMPLETED" });
  record("PATCH /tasks/:id status (intern)", r.status === 200, r.status + "");

  // 4. Sentiment endpoints (triggered indirectly; verify mine)
  await new Promise((res) => setTimeout(res, 300)); // allow async sentiment write via task service
  r = await req("GET", BASE.sentiment + "/mine", internToken);
  record("GET /sentiment/mine (intern)", r.status === 200 && Array.isArray(r.json?.analyses), r.status + "");

  r = await req("POST", BASE.sentiment + "/analyze", internToken, {
    update_id: updateId, intern_id: 10, text_content: "Feeling confident and productive today.",
  });
  record("POST /sentiment/analyze (intern)", r.status === 201, r.status + "");

  r = await req("GET", BASE.sentiment, adminToken);
  record("GET /sentiment (admin)", r.status === 200 && Array.isArray(r.json?.analyses), r.status + "");

  // 5. Evaluation endpoints
  r = await req("POST", BASE.evaluation, mentorToken, {
    internship_id: internshipId, intern_id: 10, mentor_id: 9,
    comments: "Great progress and clean code.",
    task_completion: 90, work_quality: 85, technical_skills: 88,
    communication: 92, problem_solving: 86, punctuality: 95,
  });
  record("POST /evaluations (mentor)", r.status === 201, r.status + "");

  r = await req("GET", BASE.evaluation + "/mine", internToken);
  record("GET /evaluations/mine (intern)", r.status === 200 && Array.isArray(r.json?.evaluations), r.status + "");

  r = await req("GET", BASE.evaluation + "/assigned", mentorToken);
  record("GET /evaluations/assigned (mentor)", r.status === 200 && Array.isArray(r.json?.evaluations), r.status + "");

  r = await req("GET", BASE.evaluation, hrToken);
  record("GET /evaluations (hr)", r.status === 200 && Array.isArray(r.json?.evaluations), r.status + "");

  // 6. Report endpoints
  r = await req("POST", BASE.report + "/generate", internToken, {
    intern_id: 10, internship_id: internshipId, month: "2026-09",
  });
  record("POST /reports/generate (intern)", r.status === 201 && r.json?.report, r.status + "");

  r = await req("GET", BASE.report + "/mine", internToken);
  record("GET /reports/mine (intern)", r.status === 200 && Array.isArray(r.json?.reports), r.status + "");

  r = await req("GET", BASE.report, adminToken);
  record("GET /reports (admin)", r.status === 200 && Array.isArray(r.json?.reports), r.status + "");

  const passed = results.filter((x) => x.ok).length;
  const failed = results.filter((x) => !x.ok).length;
  console.log("\n================ ENDPOINT TEST RESULTS ================");
  for (const row of results) {
    console.log(`${row.ok ? "PASS" : "FAIL"}  ${row.name}  ${row.detail}`);
  }
  console.log(`\n${passed} passed, ${failed} failed, ${results.length} total`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});