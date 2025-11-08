import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) console.warn("⚠️ Missing GEMINI_API_KEY in .env");

const genAI = new GoogleGenerativeAI(apiKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.join(__dirname, "data", "knecthotel-data.txt");
let domainContext = "";

try {
  if (fs.existsSync(dataFilePath)) {
    domainContext = fs.readFileSync(dataFilePath, "utf-8");
  } else {
    console.warn(`⚠️ Domain data not found at ${dataFilePath}`);
  }
} catch (e) {
  console.warn("⚠️ Failed to load domain data:", e.message);
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are QueryMate, a helpful assistant specialized in KnectHotel. Use ONLY the following context to answer. If the answer isn't in the context, say you am here discuss about knecthotel.\n\nContext:\n${domainContext}\n\nUser question:\n${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error("ERROR in /api/chat:", err);
    res.json({ reply: `Note: live AI unavailable. (Details: ${err.message})` });
  }
});

app.listen(5000, () => console.log("✅ Backend running on http://localhost:5000"));
