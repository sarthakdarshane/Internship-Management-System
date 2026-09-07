"use strict";

const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

const pool = require("../config/database");
const {
  register,
  login,
  getProfile,
  getUsers,
  getUserById,
  updateUserRole,
} = require("../controllers/authController");

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

test("register returns 400 when required fields are missing", async () => {
  const res = mockRes();
  await register({ body: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "All fields are required");
});

test("register returns 400 for an invalid email or short password", async () => {
  const res = mockRes();
  await register(
    { body: { full_name: "Jane", email: "not-an-email", password: "short" } },
    res,
  );
  assert.equal(res.statusCode, 400);
});

test("register returns 409 when the email already exists", async () => {
  pool.query = async (sql) => {
    if (sql.includes("SELECT * FROM users WHERE email")) {
      return { rows: [{ user_id: 1 }] };
    }
    throw new Error("Unexpected query: " + sql);
  };

  const res = mockRes();
  await register(
    {
      body: {
        full_name: "Jane Doe",
        email: "jane@example.com",
        password: "Password123",
      },
    },
    res,
  );
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.message, "Email already registered");
});

test("register creates an INTERN and returns 201", async () => {
  pool.query = async (sql) => {
    if (sql.includes("SELECT * FROM users WHERE email")) return { rows: [] };
    if (sql.includes("INSERT INTO users")) {
      return {
        rows: [
          {
            user_id: 12,
            full_name: "Jane Doe",
            email: "jane@example.com",
            role: "INTERN",
          },
        ],
      };
    }
    throw new Error("Unexpected query: " + sql);
  };

  const res = mockRes();
  await register(
    {
      body: {
        full_name: "Jane Doe",
        email: "  JANE@Example.COM  ",
        password: "Password123",
      },
    },
    res,
  );
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.user.email, "jane@example.com");
  assert.equal(res.body.user.role, "INTERN");
});

test("login returns 400 when email or password is missing", async () => {
  const res = mockRes();
  await login({ body: {} }, res);
  assert.equal(res.statusCode, 400);
});

test("login returns 401 when the user does not exist", async () => {
  pool.query = async () => ({ rows: [] });
  const res = mockRes();
  await login(
    { body: { email: "ghost@example.com", password: "Password123" } },
    res,
  );
  assert.equal(res.statusCode, 401);
});

test("login returns 401 when the password is wrong", async () => {
  const hash = await bcrypt.hash("Password123", 10);
  pool.query = async () => ({
    rows: [
      {
        user_id: 1,
        full_name: "Jane",
        email: "jane@example.com",
        role: "INTERN",
        password: hash,
      },
    ],
  });

  const res = mockRes();
  await login(
    { body: { email: "jane@example.com", password: "WrongPass1" } },
    res,
  );
  assert.equal(res.statusCode, 401);
});

test("login returns a JWT and user on success", async () => {
  const hash = await bcrypt.hash("Password123", 10);
  pool.query = async () => ({
    rows: [
      {
        user_id: 1,
        full_name: "Jane",
        email: "jane@example.com",
        role: "INTERN",
        password: hash,
      },
    ],
  });

  const res = mockRes();
  await login(
    { body: { email: "  JANE@example.com ", password: "Password123" } },
    res,
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.role, "INTERN");
  const decoded = jwt.verify(res.body.token, "test-secret");
  assert.equal(decoded.user_id, 1);
  assert.equal(decoded.role, "INTERN");
});

test("getProfile returns 404 when the user is not found", async () => {
  pool.query = async () => ({ rows: [] });
  const res = mockRes();
  await getProfile({ user: { user_id: 99 } }, res);
  assert.equal(res.statusCode, 404);
});

test("getProfile returns the user", async () => {
  pool.query = async () => ({
    rows: [
      { user_id: 1, full_name: "Jane", email: "jane@example.com", role: "INTERN" },
    ],
  });
  const res = mockRes();
  await getProfile({ user: { user_id: 1 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.user_id, 1);
});

test("getUsers lists users without a role filter", async () => {
  pool.query = async (sql) => {
    if (sql.includes("COUNT")) return { rows: [{ total: 2 }] };
    return { rows: [{ user_id: 1 }, { user_id: 2 }] };
  };
  const res = mockRes();
  await getUsers({ query: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.users.length, 2);
  assert.deepEqual(res.body.pagination, { page: 1, limit: 20, total: 2 });
});

test("getUsers filters by role", async () => {
  let usersParams;
  pool.query = async (sql, params) => {
    if (sql.includes("COUNT")) return { rows: [{ total: 1 }] };
    usersParams = params;
    return { rows: [{ user_id: 10, role: "INTERN" }] };
  };
  const res = mockRes();
  await getUsers({ query: { role: "intern" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.users.length, 1);
  assert.equal(usersParams[0], "INTERN");
});

test("getUserById returns 404 when the user is missing", async () => {
  pool.query = async () => ({ rows: [] });
  const res = mockRes();
  await getUserById({ params: { userId: 99 } }, res);
  assert.equal(res.statusCode, 404);
});

test("getUserById returns the user", async () => {
  pool.query = async () => ({ rows: [{ user_id: 5, role: "ADMIN" }] });
  const res = mockRes();
  await getUserById({ params: { userId: 5 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.role, "ADMIN");
});

test("updateUserRole rejects an invalid role", async () => {
  const res = mockRes();
  await updateUserRole(
    { params: { userId: 5 }, body: { role: "SUPERUSER" } },
    res,
  );
  assert.equal(res.statusCode, 400);
});

test("updateUserRole returns 404 when the user is missing", async () => {
  pool.query = async () => ({ rows: [] });
  const res = mockRes();
  await updateUserRole(
    { params: { userId: 99 }, body: { role: "MENTOR" } },
    res,
  );
  assert.equal(res.statusCode, 404);
});

test("updateUserRole updates the role", async () => {
  pool.query = async () => ({
    rows: [{ user_id: 5, full_name: "Jane", email: "jane@example.com", role: "MENTOR" }],
  });
  const res = mockRes();
  await updateUserRole(
    { params: { userId: 5 }, body: { role: "mentor" } },
    res,
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.role, "MENTOR");
});
