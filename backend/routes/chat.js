import express from "express";
import { authenticateToken, authenticateApiKey, requireAuth } from "../middleware/auth.js";
import { askAI, streamDeepseek, AiServiceError } from "../services/aiService.js";
import pool from "../config/db.js";
import { retrieveContext } from "../services/ragService.js";

const router = express.Router();

// IMPORTANT: Public route must be defined FIRST before any authenticated routes
// Public chat endpoint (trial - no auth required, but limited)
router.post("/public", async (req, res) => {
  console.log("🔓 PUBLIC ENDPOINT HIT: /api/chat/public");
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
    
    if (apiKey) {
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
            const docs = await retrieveContext(chatbot.id, message);
            
            const context = docs.map((doc) => doc.content).join("\n\n");
            
            const prompt = `
            You are ${chatbot.name || "a helpful assistant"}.
            
            Use ONLY the information below.
            
            Context:
            ${context}
            
            Question:
            ${message}
            
            If the answer is not present in the context,
            say that you do not have enough information.
            `;
            
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
    console.error("❌ ERROR in /api/chat/public:", err);
    console.error("Error stack:", err.stack);
    const statusCode = err.status || err.statusCode || 500;
    if (statusCode === 401) {
      console.error("⚠️ WARNING: 401 error in public endpoint - this should not happen!");
      return res.status(500).json({ error: "Internal server error. Please contact support." });
    }
    return res.status(statusCode).json({ error: err.message || "Failed to process request" });
  }
});

// General AI chat (for authenticated users - support chat)
router.post("/", authenticateToken, requireAuth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Build conversation history if conversationId provided
    let conversationMessages = [];
    if (conversationId) {
      try {
        const convoResult = await pool.query(
          "SELECT messages FROM conversations WHERE id = $1 AND user_id = $2",
          [conversationId, req.user.id]
        );
        if (convoResult.rows.length > 0) {
          const msgs = convoResult.rows[0].messages || [];
          conversationMessages = msgs.map(msg => ({
            role: msg.role,
            content: msg.content,
          }));
        }
      } catch (e) {
        // Conversations table may not exist yet
        console.warn("Could not fetch conversation history:", e.message);
      }
    }

    // Add current message
    conversationMessages.push({ role: "user", content: message });

    try {
      const reply = await askAI(
        `You are QueryMate, a helpful AI assistant. Answer the user's question in a friendly, informative way. Be concise but thorough.`,
        60000,
        conversationMessages
      );

      // Save to conversation if conversationId provided
      if (conversationId) {
        try {
          const convoResult = await pool.query(
            "SELECT messages FROM conversations WHERE id = $1 AND user_id = $2",
            [conversationId, req.user.id]
          );
          if (convoResult.rows.length > 0) {
            const currentMessages = convoResult.rows[0].messages || [];
            currentMessages.push({ role: "user", content: message, timestamp: new Date().toISOString() });
            currentMessages.push({ role: "assistant", content: reply, timestamp: new Date().toISOString() });
            await pool.query(
              "UPDATE conversations SET messages = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
              [JSON.stringify(currentMessages), conversationId, req.user.id]
            );
          }
        } catch (e) {
          console.warn("Could not save conversation:", e.message);
        }
      }

      return res.json({ reply });
    } catch (err) {
      console.error("AI error in /api/chat:", err);
      return res.status(500).json({ error: "AI service error: " + err.message, isAiError: true });
    }
  } catch (err) {
    console.error("ERROR in /api/chat:", err);
    res.status(500).json({ error: err.message || "Failed to process request" });
  }
});

// Stream chat endpoint (for real-time streaming)
router.post("/stream", authenticateToken, requireAuth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullReply = "";

    try {
      // Build conversation history
      let conversationMessages = [];
      if (conversationId) {
        try {
          const convoResult = await pool.query(
            "SELECT messages FROM conversations WHERE id = $1 AND user_id = $2",
            [conversationId, req.user.id]
          );
          if (convoResult.rows.length > 0) {
            const msgs = convoResult.rows[0].messages || [];
            conversationMessages = msgs.map(msg => ({
              role: msg.role,
              content: msg.content,
            }));
          }
        } catch (e) {
          console.warn("Could not fetch conversation history:", e.message);
        }
      }

      conversationMessages.push({ role: "user", content: message });

      await streamDeepseek(
        `You are QueryMate, a helpful AI assistant. Answer the user's question in a friendly, informative way.`,
        (chunk, done) => {
          if (done) {
            res.write(`data: [DONE]\n\n`);
            res.end();

            // Save to conversation
            if (conversationId && fullReply) {
              pool.query(
                "SELECT messages FROM conversations WHERE id = $1 AND user_id = $2",
                [conversationId, req.user.id]
              ).then((convoResult) => {
                if (convoResult.rows.length > 0) {
                  const currentMessages = convoResult.rows[0].messages || [];
                  currentMessages.push({ role: "user", content: message, timestamp: new Date().toISOString() });
                  currentMessages.push({ role: "assistant", content: fullReply, timestamp: new Date().toISOString() });
                  pool.query(
                    "UPDATE conversations SET messages = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
                    [JSON.stringify(currentMessages), conversationId, req.user.id]
                  );
                }
              }).catch((e) => {
                console.warn("Could not save stream conversation:", e.message);
              });
            }
          } else if (chunk) {
            fullReply += chunk;
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          }
        },
        conversationMessages
      );
    } catch (err) {
      console.error("Stream error:", err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error("ERROR in /api/chat/stream:", err);
    res.status(500).json({ error: err.message || "Failed to process request" });
  }
});

export default router;
