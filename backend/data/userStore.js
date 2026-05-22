const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const User = require("../Models/User");

const dataPath = path.join(__dirname, "users.json");

function useFileDatabase() {
  return process.env.USE_FILE_DB === "true";
}

async function readFileUsers() {
  try {
    const file = await fs.readFile(dataPath, "utf8");
    return JSON.parse(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeFileUsers(users) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(users, null, 2));
}

async function findByEmailOrUsername(email, username) {
  if (!useFileDatabase()) {
    return User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
  }

  const users = await readFileUsers();
  return users.find((user) => user.email === email.toLowerCase() || user.username === username);
}

async function findByIdentifier(identifier) {
  if (!useFileDatabase()) {
    return User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    });
  }

  const users = await readFileUsers();
  return users.find(
    (user) => user.email === identifier.toLowerCase() || user.username === identifier
  );
}

async function findById(id) {
  if (!useFileDatabase()) {
    return User.findById(id).select("-password -formation");
  }

  const users = await readFileUsers();
  return users.find((user) => user.id === id);
}

async function createUser({ username, email, password, formation }) {
  if (!useFileDatabase()) {
    return User.create({ username, email, password, formation });
  }

  const users = await readFileUsers();
  const user = {
    id: crypto.randomUUID(),
    username,
    email,
    password: await bcrypt.hash(password, 12),
    formation,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeFileUsers(users);

  return user;
}

function getUserId(user) {
  return String(user._id || user.id);
}

function getSafeUser(user) {
  return {
    id: getUserId(user),
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function comparePassword(user, candidatePassword) {
  if (!useFileDatabase()) {
    return user.comparePassword(candidatePassword);
  }

  return bcrypt.compare(candidatePassword, user.password);
}

module.exports = {
  comparePassword,
  createUser,
  dataPath,
  findByEmailOrUsername,
  findById,
  findByIdentifier,
  getSafeUser,
  getUserId,
  useFileDatabase,
};

