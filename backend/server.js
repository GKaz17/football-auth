const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");

dotenv.config();

const authRoutes = require("./Routes/auth");
const { dataPath, useFileDatabase } = require("./data/userStore");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Create backend/.env before starting the server.");
  }

  if (useFileDatabase()) {
    // This is only for local demos when MongoDB Atlas is blocked by the network.
    console.log(`Using emergency local file database at ${dataPath}`);
  } else {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing. Create backend/.env before starting the server.");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  app.listen(port, () => {
    console.log(`Football auth API running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
