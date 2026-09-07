"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

const authMiddleware = require("../middleware/authMiddleware");

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

test("returns 401 when the Authorization header is missing", () => {
  const res = mockRes();
  authMiddleware({ headers: {} }, res, () => {
    throw new Error("next must not be called");
  });
  assert.equal(res.statusCode, 401);
});

test("returns 401 for a non-Bearer scheme", () => {
  const res = mockRes();
  authMiddleware({ headers: { authorization: "Basic abc" } }, res, () => {});
  assert.equal(res.statusCode, 401);
});

test("returns 401 for an invalid token", () => {
  const res = mockRes();
  authMiddleware(
    { headers: { authorization: "Bearer not-a-token" } },
    res,
    () => {},
  );
  assert.equal(res.statusCode, 401);
});

test("attaches the decoded user and calls next for a valid token", () => {
  const token = jwt.sign({ user_id: 10, role: "INTERN" }, "test-secret");
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  let called = false;
  authMiddleware(req, res, () => {
    called = true;
  });
  assert.equal(called, true);
  assert.equal(req.user.user_id, 10);
  assert.equal(req.user.role, "INTERN");
});
