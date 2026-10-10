const assert = require("node:assert/strict");
const { before, after, test } = require("node:test");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MongoMemoryServer } = require("mongodb-memory-server-core");

// The tests use a real temporary MongoDB process, never the user's Atlas accounts.
process.env.NODE_ENV = "test";
process.env.USE_FILE_DB = "false";
process.env.JWT_SECRET = "test-only-secret-for-football-authentication";
process.env.FORMATION_TOLERANCE = "30";

const { app } = require("../server");
const { connectDatabase } = require("../config/database");
const User = require("../Models/User");

let database;
let server;
let baseUrl;
let token;

const formation = Array.from({ length: 10 }, (_, index) => ({
  x: 100 + (index % 5) * 100,
  y: 100 + Math.floor(index / 5) * 150,
}));
const account = {
  username: "test-player",
  email: "test-player@example.invalid",
  password: "Test-password-2026",
  formation,
};

async function request(route, body, authToken) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  database = await MongoMemoryServer.create({
    binary: { downloadDir: path.join(__dirname, "../node_modules/.cache/mongodb-binaries") },
  });
  process.env.MONGO_URI = database.getUri("football-auth-test");
  await connectDatabase();
  await User.init();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}, { timeout: 180000 });

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (database) await database.stop();
});

test("registration stores a bcrypt hash and ten positions in MongoDB", async () => {
  const result = await request("/api/auth/register", account);
  assert.equal(result.status, 201);
  token = result.body.token;
  assert.ok(token);
  assert.equal(result.body.user.email, account.email);
  assert.equal(result.body.user.password, undefined);
  assert.equal(result.body.user.formation, undefined);
  const saved = await User.findOne({ email: account.email });
  assert.equal(saved.formation.length, 10);
  assert.notEqual(saved.password, account.password);
  assert.equal(await bcrypt.compare(account.password, saved.password), true);
});

test("duplicate registration returns 409", async () => {
  assert.equal((await request("/api/auth/register", account)).status, 409);
  await assert.rejects(User.create({ ...account, username: "other-player" }), { code: 11000 });
});

test("login accepts positions inside tolerance and rejects wrong credentials or formation", async () => {
  const login = { identifier: account.email, password: account.password, formation };
  const near = formation.map((point) => ({ x: point.x + 10, y: point.y + 10 }));
  assert.equal((await request("/api/auth/login", { ...login, formation: near })).status, 200);
  assert.equal((await request("/api/auth/login", { ...login, password: "wrong" })).status, 401);
  const wrong = formation.map((point) => ({ ...point }));
  wrong[0].x += 31;
  assert.equal((await request("/api/auth/login", { ...login, formation: wrong })).status, 401);
});

test("protected profile requires a valid JWT and never returns credentials", async () => {
  assert.equal((await request("/api/auth/me")).status, 401);
  assert.equal((await request("/api/auth/me", undefined, "invalid-token")).status, 401);
  const result = await request("/api/auth/me", undefined, token);
  assert.equal(result.status, 200);
  assert.equal(result.body.user.email, account.email);
  assert.equal(result.body.user.password, undefined);
  assert.equal(result.body.user.formation, undefined);
});

test("database outages return 503 and the saved account works after reconnecting", async () => {
  assert.deepEqual((await request("/health")).body, { status: "ok", database: "mongodb" });
  await mongoose.disconnect();
  assert.equal((await request("/health")).status, 503);
  assert.equal((await request("/api/auth/login", account)).status, 503);
  await connectDatabase();
  assert.equal((await request("/api/auth/login", {
    identifier: account.email,
    password: account.password,
    formation,
  })).status, 200);
  assert.equal((await request("/api/auth/me", undefined, token)).status, 200);
  assert.equal((await request("/api/missing")).status, 404);
});

async function startBackendProcess() {
  const child = spawn(process.execPath, [path.join(__dirname, "../server.js")], {
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  try {
    const url = await new Promise((resolve, reject) => {
      let output = "";
      const timeout = setTimeout(() => reject(new Error("Backend startup timed out.")), 30000);
      child.on("error", (error) => { clearTimeout(timeout); reject(error); });
      child.on("exit", (code) => { clearTimeout(timeout); reject(new Error(`Backend exited with code ${code}.`)); });
      child.stdout.on("data", (chunk) => {
        output += chunk;
        const match = output.match(/running on port (\d+)/);
        if (match) {
          clearTimeout(timeout);
          resolve(`http://127.0.0.1:${match[1]}`);
        }
      });
    });
    return { child, url };
  } catch (error) {
    child.kill();
    await once(child, "exit").catch(() => {});
    throw error;
  }
}

async function stopBackendProcess(child) {
  if (child.exitCode === null) {
    const stopped = once(child, "exit");
    child.kill();
    await stopped;
  }
}

test("the same account and JWT work after a full backend process restart", async () => {
  let running;
  try {
    running = await startBackendProcess();
    let result = await fetch(`${running.url}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(result.status, 200);
    result = await fetch(`${running.url}/`);
    assert.equal(result.status, 200);
    const html = await result.text();
    assert.match(html, /id="root"/);
    const scriptPath = html.match(/src="([^"]+\.js)"/)[1];
    assert.equal((await fetch(`${running.url}${scriptPath}`)).status, 200);
    await stopBackendProcess(running.child);
    running = await startBackendProcess();
    result = await fetch(`${running.url}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: account.email, password: account.password, formation }),
    });
    assert.equal(result.status, 200);
    assert.ok((await result.json()).token);
  } finally {
    if (running) await stopBackendProcess(running.child);
  }
});
