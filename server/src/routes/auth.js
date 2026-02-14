const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    createdAt: user.created_at,
  };
}

router.post("/register", async (req, res) => {
  const { name, phone, email, password, pin } = req.body;

  if (!name || (!phone && !email)) {
    return res.status(400).json({ message: "Name and phone/email are required" });
  }
  if (!password && !pin) {
    return res.status(400).json({ message: "Set at least one: password or PIN" });
  }
  if (pin && !/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ message: "PIN must be 4 to 6 digits" });
  }
  if (password && password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE phone = ? OR email = ?")
    .get(phone || null, email || null);
  if (existing) {
    return res.status(409).json({ message: "User already exists with phone/email" });
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const pinHash = pin ? await bcrypt.hash(pin, 10) : null;

  const info = db
    .prepare(
      "INSERT INTO users (name, phone, email, password_hash, pin_hash) VALUES (?, ?, ?, ?, ?)"
    )
    .run(name.trim(), phone || null, email || null, passwordHash, pinHash);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  const token = createToken(user.id);

  return res.status(201).json({
    token,
    user: sanitizeUser(user),
  });
});

router.post("/login", async (req, res) => {
  const { phone, email, password, pin } = req.body;
  if ((!phone && !email) || (!password && !pin)) {
    return res.status(400).json({ message: "Provide phone/email and password or PIN" });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE phone = ? OR email = ?")
    .get(phone || null, email || null);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  let valid = false;
  if (password && user.password_hash) {
    valid = await bcrypt.compare(password, user.password_hash);
  } else if (pin && user.pin_hash) {
    valid = await bcrypt.compare(pin, user.pin_hash);
  }

  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = createToken(user.id);
  return res.json({
    token,
    user: sanitizeUser(user),
  });
});

module.exports = router;
