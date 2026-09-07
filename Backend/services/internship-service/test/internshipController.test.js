"use strict";

const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const pool = require("../config/database");
const {
  createInternship,
  getInternships,
  getMyInternships,
  getAssignedInternships,
  getInternshipById,
  updateInternship,
  deleteInternship,
} = require("../controllers/internshipController");

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (body) {
    res.body = body;
    return res;
  };
  return res;
}

beforeEach(() => {
  pool.query = async (sql) => {
    throw new Error("pool.query must be stubbed in this test: " + sql);
  };
});

test("createInternship returns 400 when required fields are missing", async () => {
  const res = mockRes();
  await createInternship({ body: {} }, res);
  assert.equal(res.statusCode, 400);
});

test("createInternship returns 400 when end_date precedes start_date", async () => {
  const res = mockRes();
  await createInternship(
    {
      body: {
        intern_id: 10,
        mentor_id: 9,
        company_name: "Test Corp",
        internship_title: "Intern",
        start_date: "2026-12-31",
        end_date: "2026-09-01",
      },
    },
    res,
  );
  assert.equal(res.statusCode, 400);
});

test("createInternship creates an internship and returns 201", async () => {
  pool.query = async () => ({
    rows: [{ internship_id: 1, company_name: "Test Corp" }],
  });
  const res = mockRes();
  await createInternship(
    {
      body: {
        intern_id: 10,
        mentor_id: 9,
        company_name: "Test Corp",
        internship_title: "Full Stack Intern",
        start_date: "2026-09-01",
        end_date: "2026-12-31",
        description: "Build features",
      },
    },
    res,
  );
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.internship.internship_id, 1);
});

test("getInternships returns the internship list", async () => {
  pool.query = async () => ({ rows: [{ internship_id: 1 }] });
  const res = mockRes();
  await getInternships({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.internships.length, 1);
});

test("getMyInternships scopes by the authenticated intern", async () => {
  let params;
  pool.query = async (sql, p) => {
    params = p;
    return { rows: [{ internship_id: 1 }] };
  };
  const res = mockRes();
  await getMyInternships({ user: { user_id: 10 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(params[0], 10);
});

test("getAssignedInternships scopes by the authenticated mentor", async () => {
  let params;
  pool.query = async (sql, p) => {
    params = p;
    return { rows: [{ internship_id: 1 }] };
  };
  const res = mockRes();
  await getAssignedInternships({ user: { user_id: 9 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(params[0], 9);
});

test("getInternshipById returns 404 when the internship is missing", async () => {
  pool.query = async () => ({ rows: [] });
  const res = mockRes();
  await getInternshipById({ params: { id: 99 }, user: { role: "ADMIN" } }, res);
  assert.equal(res.statusCode, 404);
});

test("getInternshipById denies access to an unrelated intern", async () => {
  pool.query = async () => ({
    rows: [{ internship_id: 1, intern_id: 10, mentor_id: 9 }],
  });
  const res = mockRes();
  await getInternshipById(
    { params: { id: 1 }, user: { role: "INTERN", user_id: 5 } },
    res,
  );
  assert.equal(res.statusCode, 403);
});

test("getInternshipById allows the owning intern", async () => {
  pool.query = async () => ({
    rows: [{ internship_id: 1, intern_id: 10, mentor_id: 9 }],
  });
  const res = mockRes();
  await getInternshipById(
    { params: { id: 1 }, user: { role: "INTERN", user_id: 10 } },
    res,
  );
  assert.equal(res.statusCode, 200);
});

test("getInternshipById allows a manager", async () => {
  pool.query = async () => ({
    rows: [{ internship_id: 1, intern_id: 10, mentor_id: 9 }],
  });
  const res = mockRes();
  await getInternshipById(
    { params: { id: 1 }, user: { role: "ADMIN", user_id: 6 } },
    res,
  );
  assert.equal(res.statusCode, 200);
});

test("updateInternship returns 404 when the internship is missing", async () => {
  pool.query = async () => ({ rows: [] });
  const res = mockRes();
  await updateInternship({ params: { id: 99 }, body: {} }, res);
  assert.equal(res.statusCode, 404);
});

test("updateInternship updates the internship and returns 200", async () => {
  pool.query = async () => ({ rows: [{ internship_id: 1, status: "ACTIVE" }] });
  const res = mockRes();
  await updateInternship({ params: { id: 1 }, body: { status: "ACTIVE" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.internship.internship_id, 1);
});

test("deleteInternship returns 404 when the internship is missing", async () => {
  pool.query = async () => ({ rows: [] });
  const res = mockRes();
  await deleteInternship({ params: { id: 99 } }, res);
  assert.equal(res.statusCode, 404);
});

test("deleteInternship deletes the internship and returns 200", async () => {
  pool.query = async () => ({ rows: [{ internship_id: 1 }] });
  const res = mockRes();
  await deleteInternship({ params: { id: 1 } }, res);
  assert.equal(res.statusCode, 200);
});
