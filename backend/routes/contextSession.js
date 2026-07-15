import express from "express";
import { authenticateToken, requireAuth } from "../middleware/auth.js";
import pool from "../config/db.js";
import { askAI } from "../services/aiService.js";

const router = express.Router();

// Helper: check if context_sessions table exists
async function contextSessionsTableExists() {
  try {
    const result = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'context_sessions')"
    );
    return result.rows[0].exists;
  } catch {
    return false;
  }
}

// Get or initialize context session
router.get("/", authenticateToken, requireAuth, async (req, res) => {
  try {
    if (!(await contextSessionsTableExists())) {
      // No table yet — check if user has existing context
      const userResult = await pool.query(
        "SELECT context_data FROM users WHERE id = $1",
        [req.user.id]
      );
      const user = userResult.rows[0];

      if (user && user.context_data) {
        return res.json({
          session: {
            collectedData: {},
            stage: "complete",
            hasExistingContext: true,
          },
        });
      }

      // No table, no context — just return a fresh session state
      return res.json({
        session: {
          collectedData: {},
          stage: "collecting",
          lastUpdated: new Date(),
        },
        initialMessage:
          "Hello! I'm QueryMate. Let's gather some information about your business or service. What does your business do?",
      });
    }

    let sessionResult = await pool.query(
      "SELECT * FROM context_sessions WHERE email = $1",
      [req.user.email]
    );
    let session = sessionResult.rows[0];

    // Check if user has existing context
    const userResult = await pool.query(
      "SELECT context_data FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = userResult.rows[0];

    const isNewSession = !session && (!user || !user.context_data);

    if (isNewSession) {
      const insertResult = await pool.query(
        `INSERT INTO context_sessions (email, collected_data, stage)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [req.user.email, JSON.stringify({}), "collecting"]
      );
      session = insertResult.rows[0];

      return res.json({
        session: {
          collectedData: session.collected_data || {},
          stage: session.stage,
          lastUpdated: session.last_updated,
        },
        initialMessage:
          "Hello! I'm QueryMate. Let's gather some information about your business or service. What does your business do?",
      });
    }

    if (session) {
      if (session.stage === "complete") {
        return res.json({
          session: {
            collectedData: session.collected_data || {},
            stage: session.stage,
            lastUpdated: session.last_updated,
          },
        });
      }

      const collectedData = session.collected_data || {};
      return res.json({
        session: {
          collectedData,
          stage: session.stage,
          lastUpdated: session.last_updated,
        },
        initialMessage:
          Object.keys(collectedData).length === 0
            ? "Hello! I'm QueryMate. Let's gather some information about your business or service. What does your business do?"
            : "Let's continue gathering information about your business. What would you like to tell me?",
      });
    }

    res.json({
      session: {
        collectedData: {},
        stage: "complete",
        hasExistingContext: true,
      },
    });
  } catch (err) {
    console.error("Get context session error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Send message to context collection conversation
router.post("/message", authenticateToken, requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    let session = null;
    let collectedData = {};

    if (await contextSessionsTableExists()) {
      const sessionResult = await pool.query(
        "SELECT * FROM context_sessions WHERE email = $1",
        [req.user.email]
      );
      session = sessionResult.rows[0];

      if (!session) {
        const insertResult = await pool.query(
          `INSERT INTO context_sessions (email, collected_data, stage)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [req.user.email, JSON.stringify({}), "collecting"]
        );
        session = insertResult.rows[0];
      }

      if (session.stage === "complete") {
        return res
          .status(400)
          .json({ error: "Context collection is already complete" });
      }

      collectedData = session.collected_data || {};
    }

    const prompt = `You are QueryMate, an intelligent assistant that gathers detailed context information about a business or service.

Your task is to ask smart, natural questions until you have enough information to generate a complete description.

Use what you already know to decide the next question — do not ask irrelevant or repetitive things.

Always collect details such as:
- What the business or service offers
- Target users or customers
- Core features or benefits
- Pricing or availability details
- Contact or support information
- Any additional unique qualities

Once you have enough context, mark the process as complete.

Respond in JSON format only:

{
  "reply": "<your next conversational question or confirmation>",
  "collectedData": {
    "business_name": "...",
    "description": "...",
    "target_audience": "...",
    "features": "...",
    "pricing": "...",
    "support": "...",
    "contact": "...",
    "...": "add dynamically as discovered"
  },
  "done": true or false
}

Current collected data:
${JSON.stringify(collectedData, null, 2)}

Latest user message:
"${message}"`;

    let text;
    try {
      text = await askAI(prompt, 60000);
    } catch (err) {
      console.error("AI error in context-session:", err);
      return res
        .status(500)
        .json({ error: "AI service error: " + err.message, isAiError: true });
    }

    let jsonText = text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/```json\n?/i, "")
        .replace(/```\n?/g, "")
        .trim();
    }

    let geminiResponse = null;
    try {
      geminiResponse = JSON.parse(jsonText);
    } catch (err) {
      const match = jsonText.match(/\{[\s\S]*\}$/);
      if (match) {
        try {
          geminiResponse = JSON.parse(match[0]);
        } catch (e) {
          // fall through
        }
      }
    }

    if (!geminiResponse) {
      console.warn("Failed to parse JSON from LLM response:", text);
      if (session && (await contextSessionsTableExists())) {
        await pool.query(
          "UPDATE context_sessions SET last_updated = NOW() WHERE email = $1",
          [req.user.email]
        );
      }
      return res.json({
        reply:
          "Sorry, I couldn't understand the assistant's response. Could you rephrase?",
        collectedData,
        done: false,
      });
    }

    if (geminiResponse.collectedData) {
      collectedData = {
        ...collectedData,
        ...geminiResponse.collectedData,
      };
    }

    const isDone = geminiResponse.done === true;

    if (session && (await contextSessionsTableExists())) {
      await pool.query(
        "UPDATE context_sessions SET collected_data = $1, stage = $2, last_updated = NOW() WHERE email = $3",
        [JSON.stringify(collectedData), isDone ? "complete" : "collecting", req.user.email]
      );
    }

    res.json({
      reply: geminiResponse.reply || "Thank you for the information!",
      collectedData,
      done: isDone,
    });
  } catch (err) {
    console.error("Context session message error:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to process message" });
  }
});

// Complete context session and save to User contextData
router.post("/complete", authenticateToken, requireAuth, async (req, res) => {
  try {
    const { finalContext } = req.body;

    let collectedData = {};

    if (await contextSessionsTableExists()) {
      const sessionResult = await pool.query(
        "SELECT * FROM context_sessions WHERE email = $1",
        [req.user.email]
      );
      const session = sessionResult.rows[0];

      if (!session || session.stage !== "complete") {
        return res
          .status(400)
          .json({ error: "Session not found or not complete" });
      }
      collectedData = session.collected_data || {};
    }

    let contextData;
    if (finalContext) {
      contextData = finalContext;
    } else {
      const data = collectedData;
      let formattedContext = "";

      if (data.business_name) {
        formattedContext += `Business Name: ${data.business_name}\n\n`;
      }
      if (data.description) {
        formattedContext += `Description:\n${data.description}\n\n`;
      }
      if (data.target_audience) {
        formattedContext += `Target Audience: ${data.target_audience}\n\n`;
      }
      if (data.features) {
        formattedContext += `Features:\n${data.features}\n\n`;
      }
      if (data.pricing) {
        formattedContext += `Pricing: ${data.pricing}\n\n`;
      }
      if (data.support) {
        formattedContext += `Support: ${data.support}\n\n`;
      }
      if (data.contact) {
        formattedContext += `Contact: ${data.contact}\n\n`;
      }

      Object.keys(data).forEach((key) => {
        if (
          ![
            "business_name",
            "description",
            "target_audience",
            "features",
            "pricing",
            "support",
            "contact",
          ].includes(key)
        ) {
          formattedContext += `${key}: ${data[key]}\n\n`;
        }
      });

      contextData =
        formattedContext.trim() ||
        JSON.stringify(collectedData, null, 2);
    }

    await pool.query(
      "UPDATE users SET context_data = $1 WHERE id = $2",
      [contextData, req.user.id]
    );

    res.json({
      message: "Context data saved successfully!",
      contextData,
    });
  } catch (err) {
    console.error("Complete context session error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete/Reset context session
router.delete("/", authenticateToken, requireAuth, async (req, res) => {
  try {
    if (await contextSessionsTableExists()) {
      await pool.query(
        "DELETE FROM context_sessions WHERE email = $1",
        [req.user.email]
      );
    }
    res.json({
      message: "Context session reset successfully",
    });
  } catch (err) {
    console.error("Delete context session error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
