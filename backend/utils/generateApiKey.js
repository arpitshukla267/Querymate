import crypto from "crypto";

/**
 * Generate a secure API key
 * @param {string} identifier - Email or other identifier for uniqueness
 * @param {string} prefix - Prefix for the API key (default: "qm")
 * @returns {string} Generated API key
 */
export function generateApiKey(identifier = "", prefix = "qm") {
  const identifierHash = identifier
    ? crypto
        .createHash("md5")
        .update(identifier)
        .digest("hex")
        .substring(0, 8)
    : "";
  const randomBytes = crypto.randomBytes(24).toString("hex");
  return identifierHash
    ? `${prefix}_${identifierHash}_${randomBytes}`
    : `${prefix}_${randomBytes}`;
}

/**
 * Generate chatbot-specific API key
 * @param {string} email - User email
 * @param {string} chatbotName - Chatbot name
 * @returns {string} Generated API key
 */
export function generateChatbotApiKey(email, chatbotName) {
  return generateApiKey(`${email}_${chatbotName}`, "qm_chatbot");
}

