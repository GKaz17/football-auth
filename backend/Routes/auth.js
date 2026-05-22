const express = require("express");
const jwt = require("jsonwebtoken");

const userStore = require("../data/userStore");
const requireAuth = require("../middleware/auth");
const {
  compareFormations,
  normaliseFormation,
  validateFormation,
} = require("../utils/formation");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: userStore.getUserId(user),
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, formation } = req.body;
    const cleanUsername = String(username || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !password) {
      return res.status(400).json({ message: "Username, email, and password are required." });
    }

    const formationCheck = validateFormation(formation);
    if (!formationCheck.valid) {
      return res.status(400).json({ message: formationCheck.message });
    }

    const existingUser = await userStore.findByEmailOrUsername(cleanEmail, cleanUsername);

    if (existingUser) {
      return res.status(409).json({ message: "A user with that email or username already exists." });
    }

    const user = await userStore.createUser({
      username: cleanUsername,
      email: cleanEmail,
      password,
      formation: normaliseFormation(formation),
    });

    return res.status(201).json({
      token: signToken(user),
      user: userStore.getSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, email, username, password, formation } = req.body;
    const loginIdentifier = String(identifier || email || username || "").trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: "Username/email and password are required." });
    }

    const formationCheck = validateFormation(formation);
    if (!formationCheck.valid) {
      return res.status(400).json({ message: formationCheck.message });
    }

    const user = await userStore.findByIdentifier(loginIdentifier);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials or formation." });
    }

    const passwordMatches = await userStore.comparePassword(user, password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials or formation." });
    }

    const tolerance = Number(process.env.FORMATION_TOLERANCE || 30);
    const formationMatches = compareFormations(user.formation, normaliseFormation(formation), tolerance);

    if (!formationMatches) {
      return res.status(401).json({ message: "Invalid credentials or formation." });
    }

    return res.json({
      token: signToken(user),
      user: userStore.getSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await userStore.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({ user: userStore.getSafeUser(user) });
});

module.exports = router;
