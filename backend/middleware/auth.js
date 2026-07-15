import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  console.log("AUTH HEADER:", authHeader);

  const token = authHeader && authHeader.split(" ")[1];

  console.log("TOKEN:", token);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    console.log("DECODED:", decoded);

    const result = await pool.query(
      `
      SELECT
        id,
        email,
        context_data,
        api_key,
        created_at
      FROM users
      WHERE id = $1
      `,
      [decoded.userId],
    );

    console.log("USER FOUND:", result.rows[0]);

    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    next();
  }
};

// Middleware to authenticate by API key
export const authenticateApiKey = async (req, res, next) => {
  const userApiKey = req.headers["x-api-key"] || req.body?.apiKey;

  if (!userApiKey) {
    return next();
  }

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        email,
        context_data,
        api_key,
        created_at
      FROM users
      WHERE api_key = $1
      `,
      [userApiKey],
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }

    next();
  } catch (err) {
    console.error("API KEY AUTH ERROR:", err);
    next();
  }
};

// Middleware to require authentication
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  next();
};
