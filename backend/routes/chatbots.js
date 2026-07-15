import express from "express";
import pool from "../config/db.js";
import { authenticateToken, requireAuth } from "../middleware/auth.js";
import { generateChatbotApiKey } from "../utils/generateApiKey.js";
import { generateEmbedding } from "../services/embeddingService.js";

const router = express.Router();

// Helper: Format chatbot row to match what the frontend expects (merging JSONB and adding _id/camelCase fields)
function formatChatbot(row) {
  if (!row) return null;
  const data = row.business_data || {};
  return {
    _id: row.id,
    id: row.id,
    user_id: row.user_id,
    userId: row.user_id,
    name: row.name,
    apiKey: row.api_key,
    api_key: row.api_key,
    created_at: row.created_at,
    createdAt: row.created_at,
    
    // business_data fields
    businessName: data.businessName || "",
    websiteUrl: data.websiteUrl || "",
    businessDescription: data.businessDescription || "",
    services: data.services || [],
    faqs: data.faqs || [],
    tone: data.tone || "friendly",
    language: data.language || "en",
    welcomeMessage: data.welcomeMessage || "Hello! How can I help you today?",
    themeColor: data.themeColor || "#8B5CF6",
    position: data.position || "bottom-right",
    contextData: data.contextData || "",
    isEnabled: data.isEnabled !== false,
  };
}

// Create chatbot
router.post("/", authenticateToken, requireAuth, async (req, res) => {
  try {
    const {
      name,
      businessName,
      websiteUrl,
      businessDescription,
      services,
      faqs,
      tone,
      language,
      welcomeMessage,
      themeColor,
      position,
      contextData,
      isEnabled,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Chatbot name is required",
      });
    }

    const chatbotApiKey = generateChatbotApiKey(req.user.email, name);

    const businessData = {
      businessName: businessName || "",
      websiteUrl: websiteUrl || "",
      businessDescription: businessDescription || "",
      services: services || [],
      faqs: faqs || [],
      tone: tone || "friendly",
      language: language || "en",
      welcomeMessage: welcomeMessage || "Hello! How can I help you today?",
      themeColor: themeColor || "#8B5CF6",
      position: position || "bottom-right",
      contextData: contextData || "",
      isEnabled: isEnabled !== false,
    };

  const result = await pool.query(
    `
    INSERT INTO chatbots (
      user_id,
      name,
      api_key,
      business_data
    )
    VALUES ($1,$2,$3,$4)
    RETURNING *;
    `,
    [req.user.id, name, chatbotApiKey, JSON.stringify(businessData)],
  );
  
  const chatbot = result.rows[0];
  
  const knowledge = `
  Business Name: ${businessName}
  
  Website: ${websiteUrl}
  
  Business Description:
  ${businessDescription}
  
  Services:
  ${services?.join(", ")}
  
  FAQs:
  ${JSON.stringify(faqs)}
  
  Context:
  ${contextData}
  `;
  
  const embedding = await generateEmbedding(knowledge);
  
  await pool.query(
    `
    INSERT INTO documents (
      chatbot_id,
      content,
      embedding
    )
    VALUES ($1,$2,$3)
    `,
    [chatbot.id, knowledge, JSON.stringify(embedding)],
  );
  
  res.json({
    chatbot: formatChatbot(chatbot),
  });
  } catch (err) {
    console.error("Create chatbot error:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});

// Get user's chatbots
router.get("/", authenticateToken, requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM chatbots
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      chatbots: result.rows.map(formatChatbot),
    });
  } catch (err) {
    console.error("Get chatbots error:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});

// Get single chatbot
router.get("/:id", authenticateToken, requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM chatbots
      WHERE id = $1
      AND user_id = $2
      `,
      [req.params.id, req.user.id]
    );

    const chatbot = result.rows[0];

    if (!chatbot) {
      return res.status(404).json({
        error: "Chatbot not found",
      });
    }

    res.json({ chatbot: formatChatbot(chatbot) });
  } catch (err) {
    console.error("Get chatbot error:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});

// Update chatbot
router.put("/:id", authenticateToken, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get current chatbot data first to preserve any fields not sent in the request
    const currentResult = await pool.query(
      "SELECT * FROM chatbots WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    const existing = currentResult.rows[0];
    if (!existing) {
      return res.status(404).json({ error: "Chatbot not found" });
    }

    const existingData = existing.business_data || {};

    const {
      name,
      businessName,
      websiteUrl,
      businessDescription,
      services,
      faqs,
      tone,
      language,
      welcomeMessage,
      themeColor,
      position,
      contextData,
      isEnabled,
    } = req.body;

    const newName = name !== undefined ? name : existing.name;

    const businessData = {
      ...existingData,
      businessName: businessName !== undefined ? businessName : (existingData.businessName || ""),
      websiteUrl: websiteUrl !== undefined ? websiteUrl : (existingData.websiteUrl || ""),
      businessDescription: businessDescription !== undefined ? businessDescription : (existingData.businessDescription || ""),
      services: services !== undefined ? services : (existingData.services || []),
      faqs: faqs !== undefined ? faqs : (existingData.faqs || []),
      tone: tone !== undefined ? tone : (existingData.tone || "friendly"),
      language: language !== undefined ? language : (existingData.language || "en"),
      welcomeMessage: welcomeMessage !== undefined ? welcomeMessage : (existingData.welcomeMessage || "Hello! How can I help you today?"),
      themeColor: themeColor !== undefined ? themeColor : (existingData.themeColor || "#8B5CF6"),
      position: position !== undefined ? position : (existingData.position || "bottom-right"),
      contextData: contextData !== undefined ? contextData : (existingData.contextData || ""),
      isEnabled: isEnabled !== undefined ? isEnabled : (existingData.isEnabled !== false),
    };

    const result = await pool.query(
      `
      UPDATE chatbots
      SET name = $1, business_data = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *;
      `,
      [newName, JSON.stringify(businessData), id, userId]
    );

    res.json({ chatbot: formatChatbot(result.rows[0]) });
  } catch (err) {
    console.error("Update chatbot error:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});

// Delete chatbot
router.delete("/:id", authenticateToken, requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM chatbots
      WHERE id = $1
      AND user_id = $2
      RETURNING *;
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Chatbot not found",
      });
    }

    res.json({
      message: "Chatbot deleted successfully",
    });
  } catch (err) {
    console.error("Delete chatbot error:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;
