
import jwt from "jsonwebtoken";
import db from "../db/client.js";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function getUserFromToken(req, res, next) {
  try {
    const auth = req.get("Authorization");

    if (!auth) {
      req.user = null;
      return next();
    }

    const [scheme, token] = auth.split(" ");

    if (scheme !== "Bearer" || !token) {
      req.user = null;
      return next();
    }

    const payload = jwt.verify(token, JWT_SECRET);

    const { rows } = await db.query(
      `
        SELECT id, username
        FROM users
        WHERE id = $1;
      `,
      [payload.id]
    );

    req.user = rows[0] || null;
    next();
  } catch (err) {
    
    req.user = null;
    next();
  }
}
