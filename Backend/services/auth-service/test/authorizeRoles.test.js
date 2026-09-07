"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const authorizeRoles = require("../middleware/authorizeRoles");

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

test("calls next when the user role is allowed", () => {
  const middleware = authorizeRoles("ADMIN", "HR");
  const res = mockRes();
  let called = false;
  middleware({ user: { role: "HR" } }, res, () => {
    called = true;
  });
  assert.equal(called, true);
});

test("returns 403 when the user role is not allowed", () => {
  const middleware = authorizeRoles("ADMIN");
  const res = mockRes();
  middleware({ user: { role: "INTERN" } }, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("returns 403 when no user is present", () => {
  const middleware = authorizeRoles("ADMIN");
  const res = mockRes();
  middleware({}, res, () => {});
  assert.equal(res.statusCode, 403);
});
