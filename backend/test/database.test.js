const assert = require("node:assert/strict");
const { test } = require("node:test");

const { databaseErrorMessage } = require("../config/database");
const { useFileDatabase } = require("../data/userStore");

test("production cannot use the temporary JSON database", () => {
  const previousMode = process.env.NODE_ENV;
  const previousFallback = process.env.USE_FILE_DB;
  try {
    process.env.NODE_ENV = "production";
    process.env.USE_FILE_DB = "true";
    assert.throws(() => useFileDatabase(), /disabled in production/);
    process.env.USE_FILE_DB = "false";
    assert.equal(useFileDatabase(), false);
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
    if (previousFallback === undefined) delete process.env.USE_FILE_DB;
    else process.env.USE_FILE_DB = previousFallback;
  }
});

test("connection errors explain the likely cause without exposing credentials", () => {
  assert.match(databaseErrorMessage(new Error("querySrv ENOTFOUND _mongodb._tcp.example")), /DNS lookup failed/);
  assert.match(databaseErrorMessage({ code: 18, message: "Authentication failed" }), /authentication failed/);
  assert.match(databaseErrorMessage({ name: "MongooseServerSelectionError" }), /IP access list/);
  assert.doesNotMatch(databaseErrorMessage(new Error("mongodb://user:secret@host")), /secret/);
});
