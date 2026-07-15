// NOTE: We intentionally read the API key from process.env at call-time
// instead of capturing it once at module load, because dotenv.config()
// is called in server.js and may run after this file is imported.
function getDeepseekApiKey() {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    console.warn("⚠️ Missing DEEPSEEK_API_KEY in backend .env");
  }
  return key;
}

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

/**
 * Ask Ollama (local LLM - llama3)
 * @param {string} prompt - The prompt to send
 * @param {number} timeoutMs - Timeout in milliseconds (default: 60000)
 * @param {Array} messages - Optional conversation messages array
 * @returns {Promise<string>} Reply text
 */
export async function askOllama(prompt, timeoutMs = 60000, messages = null) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const messageArray = messages || [{ role: "user", content: prompt }];

    const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "llama3",
        messages: messageArray,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(
        `Ollama error: ${resp.status} ${resp.statusText} ${text}`
      );
    }

    const data = await resp.json().catch(() => null);
    const reply = data?.message?.content || "";
    return reply;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Ollama API timeout");
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
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
 * Ask AI - tries Ollama first, falls back to DeepSeek
 * @param {string} prompt - The prompt to send
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
 * @param {Array} messages - Optional conversation messages array
 * @returns {Promise<string>} Reply text
 */
export async function askAI(prompt, timeoutMs = 30000, messages = null) {
  let ollamaError = null;
  let deepseekError = null;

  // Try Ollama first
  try {
    const reply = await askOllama(prompt, timeoutMs, messages);
    if (reply) return reply;
  } catch (err) {
    ollamaError = err;
    console.warn("Ollama not available, falling back to DeepSeek:", err.message);
  }

  // Fall back to DeepSeek
  try {
    return await askDeepseek(prompt, timeoutMs, messages);
  } catch (err) {
    deepseekError = err;
    console.error("DeepSeek also failed:", err.message);
  }

  // Both providers failed
  const combinedMsg = `AI service unavailable. Ollama: ${ollamaError?.message || "no response"}. DeepSeek: ${deepseekError?.message || "no response"}.`;
  throw new AiServiceError(combinedMsg, { ollamaError, deepseekError });
}

/**
 * Ask DeepSeek AI
 * @param {string} prompt - The prompt to send
 * @param {number} timeoutMs - Timeout in milliseconds (default: 20000)
 * @param {Array} messages - Optional conversation messages array
 * @returns {Promise<string>} Reply text
 */
export async function askDeepseek(prompt, timeoutMs = 20000, messages = null) {
  const DEEPSEEK_API_KEY = getDeepseekApiKey();
  if (!DEEPSEEK_API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // If messages array provided, use it; otherwise use single prompt
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
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(
        `DeepSeek error: ${resp.status} ${resp.statusText} ${text}`
      );
    }

    const data = await resp.json().catch(() => null);
    const reply = data?.choices?.[0]?.message?.content || data?.result || "";
    return reply;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("DeepSeek API timeout");
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Stream response from DeepSeek AI
 * @param {string} prompt - The prompt to send
 * @param {Function} onChunk - Callback for each chunk
 * @param {Array} messages - Optional conversation messages array
 * @returns {Promise<void>}
 */
export async function streamDeepseek(prompt, onChunk, messages = null) {
  const DEEPSEEK_API_KEY = getDeepseekApiKey();
  if (!DEEPSEEK_API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");

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
            onChunk(null, true); // Signal completion
            return;
          }

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content, false);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    onChunk(null, true); // Signal completion
  } catch (err) {
    throw err;
  }
}
