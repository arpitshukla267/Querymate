import express from "express";
import { askAI, AiServiceError } from "../services/aiService.js";
import pool from "../config/db.js";

const router = express.Router();

// Public chat endpoint (trial - no auth required, but limited)
// This is a separate router to ensure no auth middleware interferes
router.post("/", async (req, res) => {
  console.log("🔓 PUBLIC CHAT ENDPOINT HIT");
  console.log("Request method:", req.method);
  console.log("Request path:", req.path);
  console.log("Request url:", req.url);
  
  try {
    // Set CORS headers explicitly - MUST be set before any response
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "false");

    // Handle OPTIONS request
    if (req.method === "OPTIONS") {
      console.log("OPTIONS request - returning 200");
      return res.sendStatus(200);
    }

    const { message } = req.body;
    console.log("Received message:", message);
    
    if (!message) {
      console.log("❌ No message provided");
      return res.status(400).json({ error: "Message is required" });
    }

    // Check if API key provided (for authenticated widget usage)
    const apiKey = req.headers["x-api-key"] || req.body.apiKey;
    console.log("API Key provided:", !!apiKey);
    
    if (apiKey) {
      console.log("🔑 API key detected, checking for chatbot/user...");
      // Check if this is a chatbot API key
      const chatbotResult = await pool.query(
        "SELECT * FROM chatbots WHERE api_key = $1",
        [apiKey]
      );
      const chatbotRaw = chatbotResult.rows[0];

      if (chatbotRaw) {
        const data = chatbotRaw.business_data || {};
        const chatbot = {
          ...chatbotRaw,
          ...data,
          tone: data.tone || "friendly",
          context_data: data.contextData || data.context_data || chatbotRaw.context_data || "",
          is_enabled: data.isEnabled !== false,
        };

        if (chatbot.is_enabled) {
          console.log("✅ Found chatbot:", chatbot.name);
          // Use chatbot's context data
          const toneInstructions = {
            formal: "Use a formal, professional tone.",
            friendly: "Use a friendly, conversational tone.",
            sales: "Use an enthusiastic, sales-oriented tone to promote the business.",
          };

          const prompt = `You are ${chatbot.name || chatbot.business_name || "a helpful assistant"}. ${toneInstructions[chatbot.tone] || toneInstructions.friendly}

Use ONLY the following context to answer questions. If the answer isn't in the context, politely say that you can only help with information about this business.

Context:
${chatbot.context_data || ""}

User question:
${message}`;

          try {
            const reply = await askAI(prompt, 60000);
            return res.json({ reply });
          } catch (err) {
            console.error("AI error in /api/chat/public:", err);
            return res.status(500).json({ error: "AI service error: " + err.message, isAiError: true });
          }
        }
      }

      // Check for user API key (legacy support)
      const userResult = await pool.query(
        "SELECT context_data FROM users WHERE api_key = $1",
        [apiKey]
      );
      const user = userResult.rows[0];

      if (user && user.context_data) {
        console.log("✅ Found user with context data");
        const prompt = `You are QueryMate, a helpful assistant. Use ONLY the following context to answer. If the answer isn't in the context, say "Hmm, that doesn't seem related to what I can help with."\n\nContext:\n${user.context_data}\n\nUser question:\n${message}`;
        try {
          const reply = await askAI(prompt, 60000);
          return res.json({ reply });
        } catch (err) {
          console.error("AI error in /api/chat/public:", err);
          return res.status(500).json({ error: "AI service error: " + err.message, isAiError: true });
        }
      }
    }

    // Public trial - no auth required
    console.log("🔓 Processing as public trial (no API key)");
    console.log("Calling AI...");
    const prompt = `You are QueryMate, a helpful AI assistant. You're providing a free trial of the chatbot service. Answer the user's question in a friendly, informative way. Be concise but thorough.`;

    try {
      const reply = await askAI(`${prompt}\n\nUser question:\n${message}`, 60000);
      console.log("✅ AI response received, length:", reply.length);
      return res.json({ reply });
    } catch (err) {
      console.error("❌ AI error in public chat:", err);
      return res.status(500).json({ error: "AI service error: " + err.message, isAiError: true });
    }
  } catch (err) {
    console.error("❌ ERROR in public chat endpoint:", err);
    console.error("Error stack:", err.stack);
    // Make absolutely sure we never return 401 for public endpoint
    if (err.status === 401 || err.statusCode === 401) {
      console.error("⚠️ WARNING: Attempted to return 401 in public endpoint!");
      return res.status(500).json({ 
        error: "Internal server error. This is a public endpoint and should not require authentication.",
        details: err.message 
      });
    }
    return res.status(500).json({ error: err.message || "Failed to process request" });
  }
});

export default router;
