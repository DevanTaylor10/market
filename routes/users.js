import express from "express";
import db from "../db/client.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .send({ error: "username and password are required" });
    }

    const {
      rows: [existingUser],
    } = await db.query("SELECT * FROM users WHERE username = $1;", [username]);

    if (existingUser) {
      return res.status(400).send({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const {
      rows: [user],
    } = await db.query(
      `
      INSERT INTO users (username, password)
      VALUES ($1, $2)
      RETURNING id, username;
      `,
      [username, hashedPassword]
    );

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET
    );

    res.send({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .send({ error: "username and password are required" });
    }

    const {
      rows: [user],
    } = await db.query("SELECT * FROM users WHERE username = $1;", [username]);

    if (!user) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET
    );

    delete user.password;

    res.send({ token, user });
  } catch (err) {
    next(err);
  }
});
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT id, username FROM users");
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
