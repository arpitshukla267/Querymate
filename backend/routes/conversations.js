import express from "express";
import { authenticateToken, requireAuth } from "../middleware/auth.js";
import pool from "../config/db.js";

const router = express.Router();

// Helper: check if conversations table exists
async function conversationsTableExists() {
  try {
    const result = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations')"
    );
    return result.rows[0].exists;
  } catch {
    return false;
  }
}

// Create new conversation
router.post("/", authenticateToken, requireAuth, async (req, res) => {
  try {
    if (!(await conversationsTableExists())) {
      return res.status(503).json({ error: "Conversations feature is not available yet. Please create the conversations table first." });
    }

    const { title, chatbotId, type } = req.body;
    const result = await pool.query(
      `INSERT INTO conversations (user_id, chatbot_id, title, type, messages)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, chatbotId || null, title || "New Chat", type || "general", JSON.stringify([])]
    );
    res.json({ conversation: result.rows[0] });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user conversations
router.get("/", authenticateToken, requireAuth, async (req, res) => {
  try {
    if (!(await conversationsTableExists())) {
      return res.json({ conversations: [] });
    }

    const { type } = req.query;
    let query = "SELECT id, user_id, chatbot_id, title, type, created_at, updated_at FROM conversations WHERE user_id = $1";
    const params = [req.user.id];

    if (type) {
      query += " AND type = $2";
      params.push(type);
    }

    query += " ORDER BY updated_at DESC LIMIT 50";

    const result = await pool.query(query, params);
    res.json({ conversations: result.rows });
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get single conversation with messages
router.get("/:id", authenticateToken, requireAuth, async (req, res) => {
  try {
    if (!(await conversationsTableExists())) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const result = await pool.query(
      "SELECT * FROM conversations WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ conversation: result.rows[0] });
  } catch (err) {
    console.error("Get conversation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update conversation title
router.patch("/:id", authenticateToken, requireAuth, async (req, res) => {
  try {
    if (!(await conversationsTableExists())) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const { title } = req.body;
    const result = await pool.query(
      "UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *",
      [title, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ conversation: result.rows[0] });
  } catch (err) {
    console.error("Update conversation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete conversation
router.delete("/:id", authenticateToken, requireAuth, async (req, res) => {
  try {
    if (!(await conversationsTableExists())) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const result = await pool.query(
      "DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ message: "Conversation deleted successfully" });
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
