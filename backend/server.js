const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load the same .env whether we start from the root or the backend folder.
dotenv.config({ path: path.join(__dirname, ".env") });

const { connectDatabase, databaseErrorMessage } = require("./config/database");
const authRoutes = require("./Routes/auth");
const { dataPath, useFileDatabase } = require("./data/userStore");
const User = require("./Models/User");

const app = express();
const port = process.env.PORT || 5000;
const frontendPath = path.join(__dirname, "../frontend/dist");
const production = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  if (useFileDatabase()) {
    return res.json({ status: "ok", database: "local-file" });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database is disconnected.");
    }
    await mongoose.connection.db.admin().ping();
    return res.json({ status: "ok", database: "mongodb" });
  } catch (_error) {
    return res.status(503).json({ status: "unavailable", database: "mongodb" });
  }
});

app.use("/api", (_req, res, next) => {
  if (!useFileDatabase() && mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database is temporarily unavailable. Please try again." });
  }
  return next();
});
app.use("/api/auth", authRoutes);
app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));

// Heroku runs one server: Express serves both the API and the built React app.
app.use(express.static(frontendPath));
app.get("*", (_req, res, next) => {
  if (!fs.existsSync(path.join(frontendPath, "index.html"))) {
    return next();
  }
  return res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((error, _req, res, _next) => {
  const status = error.status === 400 || error.status === 413 ? error.status : 500;
  res.status(status).json({ message: status === 500 ? "Request failed. Please try again." : "Invalid request body." });
});

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Set it in backend/.env or Heroku Config Vars.");
  }

  if (production && (process.env.JWT_SECRET.length < 32 || /replace_with|dev_secret_change/i.test(process.env.JWT_SECRET))) {
    throw new Error("Set JWT_SECRET to a random secret of at least 32 characters for production.");
  }

  const tolerance = Number(process.env.FORMATION_TOLERANCE || 30);
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("FORMATION_TOLERANCE must be a finite, non-negative number.");
  }

  if (production && !fs.existsSync(path.join(frontendPath, "index.html"))) {
    throw new Error("React build is missing. Run npm run build from the project root.");
  }

  if (useFileDatabase()) {
    console.log(`Using emergency local file database at ${dataPath}`);
  } else {
    try {
      await connectDatabase();
      // Wait for the unique email and username indexes before accepting accounts.
      await User.init();
    } catch (error) {
      await mongoose.disconnect();
      throw new Error(databaseErrorMessage(error));
    }
    console.log(`MongoDB connected. Database: ${mongoose.connection.name}`);
  }

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Football auth API running on port ${server.address().port}`);
  });
  return server;
}

if (require.main === module) {
  start().then((server) => {
    // Give in-flight requests time to finish when Heroku restarts the dyno.
    function shutdown() {
      const timeout = setTimeout(() => process.exit(1), 10000);
      timeout.unref();
      server.close(async () => {
        await mongoose.disconnect();
        clearTimeout(timeout);
        process.exit(0);
      });
    }
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { app, start };
