// NOTE: We intentionally read API keys from process.env at call-time
function getApiKey(envName) {
  return process.env[envName] || "";
}

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// Circuit Breaker for failing/unpaid API providers (prevents wasting 1-2s on every request)
const disabledProviders = new Map(); // providerName -> timestamp

export function isProviderDisabled(name) {
  const until = disabledProviders.get(name);
  if (!until) return false;
  if (Date.now() > until) {
    disabledProviders.delete(name);
    return false;
  }
  return true;
}

export function disableProvider(name, minutes = 10) {
  disabledProviders.set(name, Date.now() + minutes * 60 * 1000);
}

/**
 * Pre-warm Ollama model in RAM so the first user prompt doesn't suffer a 12s cold start.
 * Fire-and-forget: doesn't block server startup.
 */
export function prewarmOllama() {
  console.log("🔥 Pre-warming Ollama model...");
  fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "llama3",
      keep_alive: "60m",
    }),
  })
    .then(() => console.log("✅ Ollama model pre-warmed and pinned in RAM"))
    .catch(() => console.warn("⚠️ Ollama prewarm skipped (not running?)"));
}

/**
 * Ask Groq API (Ultra-fast cloud inference, ~300ms)
 */
export async function askGroq(prompt, timeoutMs = 8000, messages = null, options = {}) {
  const apiKey = getApiKey("GROQ_API_KEY");
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");
  if (isProviderDisabled("groq")) throw new Error("Groq temporarily disabled");

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const messageArray = messages || [{ role: "user", content: prompt }];
    const resp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: messageArray,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        max_tokens: options.maxTokens || 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(id);
    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 402 || resp.status === 429) {
        disableProvider("groq", 10);
      }
      const text = await resp.text().catch(() => "");
      throw new Error(`Groq error: ${resp.status} ${resp.statusText} ${text}`);
    }

    const data = await resp.json().catch(() => null);
    return data?.choices?.[0]?.message?.content || "";
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Groq API timeout");
    throw err;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Ask OpenRouter API (Fast free cloud models)
 */
export async function askOpenRouter(prompt, timeoutMs = 8000, messages = null, options = {}) {
  const apiKey = getApiKey("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");
  if (isProviderDisabled("openrouter")) throw new Error("OpenRouter temporarily disabled");

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const messageArray = messages || [{ role: "user", content: prompt }];
    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-lite-001",
        messages: messageArray,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        max_tokens: options.maxTokens || 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(id);
    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 402 || resp.status === 429) {
        disableProvider("openrouter", 10);
      }
      const text = await resp.text().catch(() => "");
      throw new Error(`OpenRouter error: ${resp.status} ${resp.statusText} ${text}`);
    }

    const data = await resp.json().catch(() => null);
    return data?.choices?.[0]?.message?.content || "";
  } catch (err) {
    if (err.name === "AbortError") throw new Error("OpenRouter API timeout");
    throw err;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Ask DeepSeek AI
 */
export async function askDeepseek(prompt, timeoutMs = 5000, messages = null, options = {}) {
  const DEEPSEEK_API_KEY = getApiKey("DEEPSEEK_API_KEY");
  if (!DEEPSEEK_API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");
  if (isProviderDisabled("deepseek")) throw new Error("DeepSeek temporarily disabled (402/insufficient balance)");

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const messageArray = messages || [{ role: "user", content: prompt }];
    const requestBody = {
      model: "deepseek-chat",
      messages: messageArray,
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
      stream: false,
    };
    if (options.maxTokens) requestBody.max_tokens = options.maxTokens;

    const resp = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(id);
    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 402) {
        disableProvider("deepseek", 10);
      }
      const text = await resp.text().catch(() => "");
      throw new Error(`DeepSeek error: ${resp.status} ${resp.statusText} ${text}`);
    }

    const data = await resp.json().catch(() => null);
    return data?.choices?.[0]?.message?.content || data?.result || "";
  } catch (err) {
    if (err.name === "AbortError") throw new Error("DeepSeek API timeout");
    throw err;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Ask Ollama (local LLM) with fast token limits and keep_alive
 */
export async function askOllama(prompt, timeoutMs = 6000, messages = null, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const messageArray = messages || [{ role: "user", content: prompt }];
    const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "llama3",
        messages: messageArray,
        keep_alive: "60m",
        options: {
          num_predict: options.maxTokens || 100, // fast token generation on CPU
          num_ctx: 1024,
          temperature: options.temperature !== undefined ? options.temperature : 0.3,
        },
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(id);
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Ollama error: ${resp.status} ${resp.statusText} ${text}`);
    }

    const data = await resp.json().catch(() => null);
    return data?.message?.content || "";
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Ollama API timeout");
    throw err;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Stream Ollama response via callback
 */
export async function streamOllama(prompt, onChunk, messages = null) {
  const messageArray = messages || [{ role: "user", content: prompt }];
  const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "llama3",
      messages: messageArray,
      keep_alive: "60m",
      options: {
        num_predict: 120,
        num_ctx: 1024,
        temperature: 0.7,
      },
      stream: true,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Ollama stream error: ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        try {
          const json = JSON.parse(line);
          const chunk = json.message?.content;
          if (chunk) onChunk(chunk, false);
          if (json.done) {
            onChunk(null, true);
            return;
          }
        } catch (e) {}
      }
    }
  }
  onChunk(null, true);
}

/**
 * Stream response from DeepSeek AI
 */
export async function streamDeepseek(prompt, onChunk, messages = null) {
  const DEEPSEEK_API_KEY = getApiKey("DEEPSEEK_API_KEY");
  if (!DEEPSEEK_API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");
  if (isProviderDisabled("deepseek")) throw new Error("DeepSeek temporarily disabled");

  try {
    const messageArray = messages || [{ role: "user", content: prompt }];
    const resp = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messageArray,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 402) {
        disableProvider("deepseek", 10);
      }
      const text = await resp.text().catch(() => "");
      throw new Error(`DeepSeek error: ${resp.status} ${resp.statusText} ${text}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            onChunk(null, true);
            return;
          }
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) onChunk(content, false);
          } catch (e) {}
        }
      }
    }

    onChunk(null, true);
  } catch (err) {
    throw err;
  }
}

/**
 * Universal Streaming router: DeepSeek -> Ollama -> Simulated Fast Fallback Stream
 */
export async function streamAI(prompt, onChunk, messages = null) {
  // 1. Try DeepSeek streaming
  if (getApiKey("DEEPSEEK_API_KEY") && !isProviderDisabled("deepseek")) {
    try {
      await streamDeepseek(prompt, onChunk, messages);
      return;
    } catch (err) {
      console.warn("Stream DeepSeek unavailable, falling back to Ollama:", err.message);
    }
  }

  // 2. Try Ollama streaming
  try {
    await streamOllama(prompt, onChunk, messages);
    return;
  } catch (err) {
    console.warn("Stream Ollama unavailable, streaming fast fallback:", err.message);
  }

  // 3. Fallback smooth word-by-word streaming
  const fallbackText = generateFastFallback(prompt, messages);
  const words = fallbackText.split(" ");
  for (let i = 0; i < words.length; i++) {
    onChunk(words[i] + (i === words.length - 1 ? "" : " "), false);
    await new Promise((r) => setTimeout(r, 20));
  }
  onChunk(null, true);
}

/**
 * Custom error class for AI service failures
 */
export class AiServiceError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "AiServiceError";
    this.isAiError = true;
    this.cause = cause;
  }
}

/**
 * Smart Fallback Generator for Q&A and Analysis when AI models are unavailable or timing out
 */
export function generateFastFallback(prompt, messages) {
  const fullContent = (prompt + " " + (messages ? JSON.stringify(messages) : "")).toLowerCase();
  
  // If request is asking for extraction JSON
  if (fullContent.includes("extract") || fullContent.includes("json structure") || fullContent.includes("businessname")) {
    const rawUserText = messages 
      ? messages.filter(m => m.role === "user").map(m => m.content).join("\n") 
      : (prompt.includes("User:") ? prompt.split("User:").pop() : prompt);

    const cleanText = (rawUserText || "").replace(/Analyze the following conversation.*?:/gi, "").trim();
    const lines = cleanText.split("\n").map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || "My Business";
    const nameMatch = firstLine.match(/(?:my business is|we are|called|name is)?\s*([A-Za-z0-9\s&]+)/i);
    const busName = (nameMatch ? nameMatch[1].trim() : "My Business").replace(/Analyze standard.*$/i, "My Business");

    return JSON.stringify({
      businessName: busName.slice(0, 35) || "My Business",
      businessDescription: cleanText || "Business details and services as discussed.",
      websiteUrl: "",
      services: lines.slice(1, 4),
      faqs: [
        { question: "What services do you offer?", answer: lines.slice(1, 3).join(", ") || "We offer custom services for our clients." },
        { question: "How can I contact support?", answer: "Contact us directly through our website or support chat." }
      ],
      tone: "friendly",
      welcomeMessage: `Hello! Welcome to ${busName || "our business"}. How can I assist you today?`,
      contextData: `Business Name: ${busName}\n\nDescription:\n${cleanText}`
    });
  }

  // If request is asking for next question JSON
  if (fullContent.includes("nextquestion") || fullContent.includes("one concise, natural question")) {
    const questionOptions = [
      "What are the main services or products your business offers?",
      "Who is your target audience or primary customer base?",
      "What pricing models or plans do you offer?",
      "What are the most common questions your customers ask?"
    ];
    const userMsgCount = messages ? messages.filter(m => m.role === "user").length : 1;
    const isDone = userMsgCount >= 4;
    const nextQ = questionOptions[userMsgCount % questionOptions.length];

    return JSON.stringify({
      done: isDone,
      summary: "Business information gathered successfully.",
      nextQuestion: isDone ? null : nextQ
    });
  }

  return "Thank you! Could you please provide a few more details about your business and services?";
}

/**
 * Primary AI router: tries Groq -> OpenRouter -> DeepSeek -> Ollama -> Fast Fallback
 * Optimized for low latency (<1-2s typical response)
 */
export async function askAI(prompt, timeoutMs = 6000, messages = null, options = {}) {
  const errors = [];

  // 1. Try Groq if key exists
  if (getApiKey("GROQ_API_KEY") && !isProviderDisabled("groq")) {
    try {
      return await askGroq(prompt, Math.min(timeoutMs, 4000), messages, options);
    } catch (err) {
      errors.push(`Groq: ${err.message}`);
    }
  }

  // 2. Try OpenRouter if key exists
  if (getApiKey("OPENROUTER_API_KEY") && !isProviderDisabled("openrouter")) {
    try {
      return await askOpenRouter(prompt, Math.min(timeoutMs, 5000), messages, options);
    } catch (err) {
      errors.push(`OpenRouter: ${err.message}`);
    }
  }

  // 3. Try DeepSeek if key exists and not disabled
  if (getApiKey("DEEPSEEK_API_KEY") && !isProviderDisabled("deepseek")) {
    try {
      return await askDeepseek(prompt, Math.min(timeoutMs, 4000), messages, options);
    } catch (err) {
      errors.push(`DeepSeek: ${err.message}`);
    }
  }

  // 4. Try Ollama local (fast timeout to keep UI snappy)
  try {
    const reply = await askOllama(prompt, Math.min(timeoutMs, 5000), messages, options);
    if (reply && reply.trim()) return reply;
  } catch (err) {
    errors.push(`Ollama: ${err.message}`);
  }

  // 5. If all fail, return fast fallback instantly (<1ms) instead of erroring or hanging
  console.warn("⚠️ All AI providers slow/unavailable, using fast fallback. Details:", errors.join(" | "));
  return generateFastFallback(prompt, messages);
}
