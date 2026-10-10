const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("dotenv").config({ path: path.join(__dirname, "../.env") });
const User = require("../Models/User");
const { connectDatabase, databaseErrorMessage } = require("../config/database");

const testId = crypto.randomUUID();
const account = {
  username: `atlas-check-${testId}`,
  email: `atlas-check-${testId}@example.invalid`,
  password: crypto.randomBytes(24).toString("hex"),
  formation: Array.from({ length: 10 }, (_, index) => ({
    x: 100 + (index % 5) * 100,
    y: 100 + Math.floor(index / 5) * 150,
  })),
};
const secret = crypto.randomBytes(48).toString("hex");
let running;
let accountId;

async function stopBackend() {
  if (running && running.child.exitCode === null) {
    const stopped = once(running.child, "exit");
    running.child.kill();
    await stopped;
  }
  running = null;
}

async function startBackend() {
  const child = spawn(process.execPath, ["--use-system-ca", path.join(__dirname, "../server.js")], {
    env: { ...process.env, NODE_ENV: "production", USE_FILE_DB: "false", PORT: "0", JWT_SECRET: secret },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  running = { child };
  running.url = await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error("Backend startup timed out.")), 45000);
    child.on("error", (error) => { clearTimeout(timeout); reject(error); });
    child.on("exit", () => { clearTimeout(timeout); reject(new Error("Backend could not start.")); });
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/running on port (\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });
  });
}

async function request(route, body, token) {
  const response = await fetch(`${running.url}${route}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  return { status: response.status, body: await response.json() };
}

async function verifyAtlas() {
  try {
    await connectDatabase();
    await startBackend();
    assert.deepEqual((await request("/health")).body, { status: "ok", database: "mongodb" });
    const registration = await request("/api/auth/register", account);
    assert.equal(registration.status, 201, "Atlas registration failed.");
    accountId = registration.body.user.id;
    const token = registration.body.token;
    const saved = await User.findById(accountId);
    assert.equal(await bcrypt.compare(account.password, saved.password), true);
    assert.equal(saved.formation.length, 10);
    assert.equal(registration.body.user.password, undefined);
    console.log("PASS: registration stores a hashed password and ten positions in Atlas.");
    const login = { identifier: account.email, password: account.password, formation: account.formation };
    assert.equal((await request("/api/auth/login", login)).status, 200);
    const wrong = account.formation.map((point) => ({ ...point }));
    wrong[0].x += 100;
    assert.equal((await request("/api/auth/login", { ...login, formation: wrong })).status, 401);
    assert.equal((await request("/api/auth/me", undefined, token)).status, 200);
    console.log("PASS: login, incorrect formation rejection and JWT verification work.");
    await stopBackend();
    await startBackend();
    assert.equal((await request("/api/auth/login", login)).status, 200);
    assert.equal((await request("/api/auth/me", undefined, token)).status, 200);
    console.log("PASS: the account and JWT still work after a full backend restart.");
  } catch (error) {
    console.error(error.name === "AssertionError" ? error.message : databaseErrorMessage(error));
    process.exitCode = 1;
  } finally {
    await stopBackend();
    // Only remove this run's generated account; preserve every existing account.
    if (mongoose.connection.readyState === 1) {
      await User.deleteOne({ email: account.email, ...(accountId ? { _id: accountId } : {}) });
    }
    await mongoose.disconnect();
    console.log("Temporary Atlas test account cleaned up.");
  }
}

verifyAtlas();
