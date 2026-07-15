import express from "express";
import { authenticateToken, requireAuth } from "../middleware/auth.js";
import pool from "../config/db.js";
import { generateApiKey } from "../utils/generateApiKey.js";

const router = express.Router();

// Get user profile with stats
router.get("/profile", authenticateToken, requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info
    const userResult = await pool.query(
      "SELECT id, email, created_at FROM users WHERE id = $1",
      [userId]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Count chatbots
    const chatbotsResult = await pool.query(
      "SELECT COUNT(*) FROM chatbots WHERE user_id = $1",
      [userId]
    );
    const chatbotsCount = parseInt(chatbotsResult.rows[0].count, 10);

    // Conversations table may not exist yet — handle gracefully
    let conversationsCount = 0;
    try {
      const convoResult = await pool.query(
        "SELECT COUNT(*) FROM conversations WHERE user_id = $1",
        [userId]
      );
      conversationsCount = parseInt(convoResult.rows[0].count, 10);
    } catch (e) {
      // Table doesn't exist yet — that's fine
    }

    res.json({
      user: {
        email: user.email,
        createdAt: user.created_at,
      },
      stats: {
        chatbotsCount,
        conversationsCount,
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user context data
router.get("/context", authenticateToken, requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT context_data, api_key FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = result.rows[0];
    res.json({
      contextData: user?.context_data || "",
      apiKey: user?.api_key || null,
    });
  } catch (err) {
    console.error("Get context error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update user context data
router.post("/context", authenticateToken, requireAuth, async (req, res) => {
  try {
    const { contextData } = req.body;
    await pool.query(
      "UPDATE users SET context_data = $1 WHERE id = $2",
      [contextData || "", req.user.id]
    );
    res.json({ message: "Context data updated successfully" });
  } catch (err) {
    console.error("Context update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Generate or regenerate API key
router.post("/api-key", authenticateToken, requireAuth, async (req, res) => {
  try {
    const newApiKey = generateApiKey(req.user.email);
    await pool.query(
      "UPDATE users SET api_key = $1 WHERE id = $2",
      [newApiKey, req.user.id]
    );
    res.json({ apiKey: newApiKey, message: "API key generated successfully" });
  } catch (err) {
    console.error("API key generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get API key (without regenerating)
router.get("/api-key", authenticateToken, requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT api_key FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json({ apiKey: result.rows[0]?.api_key || null });
  } catch (err) {
    console.error("Get API key error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get widget settings
router.get("/widget-settings", authenticateToken, requireAuth, async (req, res) => {
  const defaultSettings = {
    widgetColor: "#667eea",
    logoColor: "#ffffff",
    chatWindowColor: "#ffffff",
    headerColor: "#667eea",
    headerText: "QueryMate",
  };

  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT widget_settings FROM users WHERE id = $1",
      [userId]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      widgetSettings: user.widget_settings || defaultSettings,
    });
  } catch (err) {
    console.error("Get widget settings error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update widget settings
router.put("/widget-settings", authenticateToken, requireAuth, async (req, res) => {
  const defaultSettings = {
    widgetColor: "#667eea",
    logoColor: "#ffffff",
    chatWindowColor: "#ffffff",
    headerColor: "#667eea",
    headerText: "QueryMate",
  };

  try {
    const userId = req.user.id;
    const { widgetSettings } = req.body;
    if (!widgetSettings) {
      return res.status(400).json({ error: "Widget settings are required" });
    }

    // Get current settings
    const currentResult = await pool.query(
      "SELECT widget_settings FROM users WHERE id = $1",
      [userId]
    );
    const currentUser = currentResult.rows[0];
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentSettings = currentUser.widget_settings || defaultSettings;

    const newSettings = {
      widgetColor: widgetSettings.widgetColor || currentSettings.widgetColor || "#667eea",
      logoColor: widgetSettings.logoColor || currentSettings.logoColor || "#ffffff",
      chatWindowColor: widgetSettings.chatWindowColor || currentSettings.chatWindowColor || "#ffffff",
      headerColor: widgetSettings.headerColor || currentSettings.headerColor || "#667eea",
      headerText: widgetSettings.headerText || currentSettings.headerText || "QueryMate",
    };

    await pool.query(
      "UPDATE users SET widget_settings = $1 WHERE id = $2",
      [JSON.stringify(newSettings), userId]
    );

    res.json({
      message: "Widget settings updated successfully",
      widgetSettings: newSettings,
    });
  } catch (err) {
    console.error("Update widget settings error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Public widget settings endpoint (for widget embedding)
router.get("/widget-settings-public", async (req, res) => {
  const defaultSettings = {
    widgetColor: "#667eea",
    logoColor: "#ffffff",
    chatWindowColor: "#ffffff",
    headerColor: "#667eea",
    headerText: "QueryMate",
  };

  try {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey;
    if (!apiKey) {
      return res.json({ widgetSettings: defaultSettings });
    }

    // Check user API key
    const userResult = await pool.query(
      "SELECT widget_settings FROM users WHERE api_key = $1",
      [apiKey]
    );
    if (userResult.rows.length > 0 && userResult.rows[0].widget_settings) {
      return res.json({ widgetSettings: userResult.rows[0].widget_settings });
    }

    // Check if it's a chatbot API key
    const chatbotResult = await pool.query(
      "SELECT name, business_data FROM chatbots WHERE api_key = $1",
      [apiKey]
    );
    if (chatbotResult.rows.length > 0) {
      const chatbot = chatbotResult.rows[0];
      const data = chatbot.business_data || {};
      return res.json({
        widgetSettings: {
          widgetColor: data.themeColor || "#8B5CF6",
          logoColor: "#ffffff",
          chatWindowColor: "#ffffff",
          headerColor: data.themeColor || "#8B5CF6",
          headerText: chatbot.name || "QueryMate",
          welcomeMessage: data.welcomeMessage || "Hello! How can I help you today?",
        },
      });
    }

    res.json({ widgetSettings: defaultSettings });
  } catch (err) {
    console.error("Get widget settings error:", err);
    res.json({ widgetSettings: defaultSettings });
  }
});

export default router;
