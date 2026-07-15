import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Load environment variables
dotenv.config();

// Import database pool
import pool from "./config/db.js";

// Import routes
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import chatPublicRoutes from "./routes/chatPublic.js"; // Separate router for public endpoint
import chatbotRoutes from "./routes/chatbots.js";
import conversationRoutes from "./routes/conversations.js";
import userRoutes from "./routes/user.js";
import contextSessionRoutes from "./routes/contextSession.js";

// Import middleware
import { authenticateApiKey } from "./middleware/auth.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS setup
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://querymate-lake.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use((req, res, next) => {
  // Allow all origins for public endpoints (widget embedding and trial)
  // Check both path and url in case of route mounting
  // When mounted with app.use("/api/chat/public", chatPublicRoutes), req.path will be "/" for /api/chat/public
  const isPublicEndpoint = 
    req.path === "/api/chat/public" ||
    req.url === "/api/chat/public" ||
    req.path === "/public" ||  // When route is mounted with /api/chat
    req.path === "/" ||  // When route is mounted with /api/chat/public
    req.url.startsWith("/api/chat/public") ||
    req.path === "/api/widget-settings" ||
    req.path === "/widget.js" ||
    req.path === "/api/test-public" ||
    req.url === "/api/test-public" ||
    req.path === "/api/user/widget-settings-public";

  if (isPublicEndpoint) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");
    res.header("Access-Control-Allow-Credentials", "false");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
  } else {
    // Use standard CORS for other endpoints
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
      res.header("Access-Control-Allow-Origin", origin || "*");
    }
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
  }
  next();
});

app.use(express.json());
app.use(express.static("public"));

// Test PostgreSQL connection on startup
pool.query("SELECT NOW()")
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch((err) => console.error("❌ PostgreSQL connection error:", err.message));

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// Test public endpoint (for debugging)
app.post("/api/test-public", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({ message: "Public endpoint works!", timestamp: new Date().toISOString() });
});

// Serve widget.js file
app.get("/widget.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const widgetPath = path.join(__dirname, "public", "widget.js");
  if (fs.existsSync(widgetPath)) {
    res.sendFile(widgetPath);
  } else {
    res.status(404).send("Widget file not found");
  }
});

// Legacy widget settings endpoint (for backward compatibility)
app.get("/api/widget-settings", authenticateApiKey, async (req, res) => {
  const defaultSettings = {
    widgetColor: "#667eea",
    logoColor: "#ffffff",
    chatWindowColor: "#ffffff",
    headerColor: "#667eea",
    headerText: "QueryMate",
  };

  try {
    if (!req.user) {
      return res.json({ widgetSettings: defaultSettings });
    }

    const result = await pool.query(
      "SELECT widget_settings FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = result.rows[0];
    res.json({
      widgetSettings: user?.widget_settings || defaultSettings,
    });
  } catch (err) {
    console.error("Get widget settings error:", err);
    res.json({ widgetSettings: defaultSettings });
  }
});

// API Routes
app.use("/api", authRoutes);

// IMPORTANT: Mount public chat route FIRST with its own router to avoid any auth middleware
app.use("/api/chat/public", chatPublicRoutes);

// Then mount other chat routes (authenticated)
app.use("/api/chat", chatRoutes);

app.use("/api/chatbots", chatbotRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/user", userRoutes);
app.use("/api/context-session", contextSessionRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});
