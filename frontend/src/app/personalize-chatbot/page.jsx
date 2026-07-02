"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { getBackendUrl, getAuthToken, isAuthenticated } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Copy,
  Check,
  Code,
  Sparkles,
  MessageSquare,
  Bot,
  Loader,
  StopCircle,
  Eye,
  Send,
  Minimize2,
} from "lucide-react";

// Simple toast function
function toastMessage(message, type = "info") {
  const toastDiv = document.createElement("div");
  toastDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === "success"
      ? "bg-green-500 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : "bg-blue-500 text-white"
  }`;
  toastDiv.textContent = message;
  document.body.appendChild(toastDiv);
  setTimeout(() => toastDiv.remove(), 3000);
}

const steps = [
  { id: 1, title: "Start", description: "Let's get started" },
  { id: 2, title: "Questions", description: "Answer questions" },
  { id: 3, title: "Review", description: "Review & customize" },
  { id: 4, title: "Generate", description: "Get your script" },
];

export default function PersonalizeChatbotPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [copied, setCopied] = useState(false);

  // Chatbot preview
  const [createdApiKey, setCreatedApiKey] = useState("");
  const [showChatPreview, setShowChatPreview] = useState(false);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState("");
  const [previewThinking, setPreviewThinking] = useState(false);
  const previewEndRef = useRef(null);

  // Chat-based question gathering
  const [conversationMessages, setConversationMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [collectedData, setCollectedData] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef(null);

  // Final form data
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    websiteUrl: "",
    businessDescription: "",
    services: [],
    faqs: [],
    tone: "friendly",
    language: "en",
    welcomeMessage: "Hello! How can I help you today?",
    themeColor: "#8B5CF6",
    position: "bottom-right",
    contextData: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/personalize-chatbot");
      return;
    }

    // Initialize with first question
    if (currentStep === 2 && conversationMessages.length === 0) {
      initializeQuestions();
    }
  }, [router, currentStep]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeQuestions = async () => {
    setAiThinking(true);
    try {
      const url = getBackendUrl();
      const response = await axios.post(`${url}/api/chat/public`, {
        message: "Hello! I want to create a personalized chatbot. Start by asking me what my business does.",
      });

      if (response.data.reply) {
        const firstQuestion = response.data.reply;
        setCurrentQuestion(firstQuestion);
        setConversationMessages([
          {
            role: "assistant",
            content: firstQuestion,
          },
        ]);
      }
    } catch (err) {
      console.error("Error initializing questions:", err);
      toastMessage("Failed to start. Please try again.", "error");
      setConversationMessages([
        {
          role: "assistant",
          content: "Hello! I'm here to help you create a personalized chatbot. What does your business do?",
        },
      ]);
    } finally {
      setAiThinking(false);
    }
  };

  const sendAnswer = async () => {
    if (!userInput.trim() || aiThinking) return;

    const userMessage = userInput.trim();
    setUserInput("");

    // Add user message
    setConversationMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    setAiThinking(true);

    try {
      const url = getBackendUrl();

      // Build conversation history for context
      const conversationHistory = conversationMessages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

      const prompt = `You are QueryMate, an intelligent assistant helping to gather information to create a personalized chatbot. 

Your task is to ask smart, natural questions (one at a time) to gather:
- Business name
- What the business does (description)
- Services/products offered
- Target audience/customers
- Key features or benefits
- Pricing information
- Common questions customers ask
- Contact information (website, email, phone, etc.)

IMPORTANT: Ask ONE question at a time in a friendly, conversational way. Make it feel natural, not like a form.

Based on the conversation so far:
${conversationHistory}

Latest user response: "${userMessage}"

Analyze what information you've gathered and what's still missing. Ask your next question to gather more information. 

If you have gathered enough information to create a comprehensive chatbot (at least: business name, description, and what they offer), respond with a JSON object:
{
  "done": true,
  "summary": "Brief summary of what you've learned about their business",
  "nextQuestion": null
}

Otherwise, if you need more information, respond with:
{
  "done": false,
  "nextQuestion": "Your next friendly, conversational question to gather missing information"
}

CRITICAL: You MUST respond ONLY with valid JSON. No other text before or after.`;

      const response = await axios.post(`${url}/api/chat/public`, {
        message: prompt,
      });

      if (response.data.reply) {
        try {
          // Try to parse JSON response
          let replyText = response.data.reply.trim();
          
          // Remove markdown code blocks if present
          if (replyText.startsWith("```json")) {
            replyText = replyText.replace(/```json\n?/i, "").replace(/```\n?/g, "").trim();
          } else if (replyText.startsWith("```")) {
            replyText = replyText.replace(/```\n?/g, "").trim();
          }

          // Try to extract JSON from response
          const jsonMatch = replyText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            if (parsed.done === true) {
              // Questions complete - extract data from conversation
              extractDataFromConversation();
              setConversationMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: "Great! I have enough information. Let me prepare your chatbot configuration. Click 'Next' to review and customize.",
                },
              ]);
              setIsComplete(true);
            } else if (parsed.nextQuestion) {
              setCurrentQuestion(parsed.nextQuestion);
              setConversationMessages((prev) => [
                ...prev,
                { role: "assistant", content: parsed.nextQuestion },
              ]);
            } else {
              // Fallback to regular reply
              setConversationMessages((prev) => [
                ...prev,
                { role: "assistant", content: response.data.reply },
              ]);
            }
          } else {
            // Not JSON, use as regular reply
            setConversationMessages((prev) => [
              ...prev,
              { role: "assistant", content: response.data.reply },
            ]);
          }
        } catch (parseError) {
          // If parsing fails, use the reply as-is
          setConversationMessages((prev) => [
            ...prev,
            { role: "assistant", content: response.data.reply },
          ]);
        }
      }
    } catch (err) {
      console.error("Error sending answer:", err);
      setConversationMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
      toastMessage("Failed to send message", "error");
    } finally {
      setAiThinking(false);
    }
  };

  const extractDataFromConversation = () => {
    // Only use user messages for the description — exclude assistant questions
    const userMessages = conversationMessages
      .filter((msg) => msg.role === "user")
      .map((msg) => msg.content)
      .join("\n");

    const conversationText = conversationMessages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    // Build context data from full conversation (for the AI to use later)
    let contextData = "Based on our conversation:\n\n" + conversationText;

    setFormData((prev) => ({
      ...prev,
      businessDescription: userMessages,
      contextData: contextData,
    }));
  };

  const handleEndAndAnalyze = async () => {
    if (conversationMessages.length < 2) {
      toastMessage("Please answer at least one question before ending.", "error");
      return;
    }

    setIsAnalyzing(true);
    setAiThinking(true);

    const conversationText = conversationMessages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    try {
      const url = getBackendUrl();

      const extractionPrompt = `You are an expert data extraction assistant. Analyze the following conversation between an assistant and a user, and extract ONLY the user's business information. Ignore all assistant messages — they are just questions.

Conversation:
${conversationText}

RULES:
- "businessName" must be ONLY the short company/business name (e.g. "TechNova Solutions"), nothing else. No descriptions, no extra text.
- "businessDescription" must be a clean, well-written paragraph describing what the business does, its products/services, and target audience. Do NOT include any conversation text, assistant questions, or prefixes like "User:" or "Assistant:".
- "services" should be a clean array of individual service/product names.
- "faqs" should contain realistic frequently asked questions a customer might ask this business, with helpful answers based on the information provided.
- "contextData" should be a comprehensive, well-structured summary of ALL business information the user shared. Write it as clean reference material, NOT as conversation text.
- "welcomeMessage" should be a short, friendly greeting suitable for a chatbot widget on this business's website.
- "tone" must be exactly one of: "friendly", "formal", or "sales".
- If a field was not mentioned, use an empty string (or empty array for arrays).

Respond with ONLY this JSON structure. No markdown, no explanation, no code fences.

{
  "businessName": "",
  "businessDescription": "",
  "websiteUrl": "",
  "services": [],
  "faqs": [{"question": "", "answer": ""}],
  "tone": "friendly",
  "welcomeMessage": "",
  "contextData": ""
}`;

      const response = await axios.post(`${url}/api/chat/public`, {
        message: extractionPrompt,
      });

      if (response.data.reply) {
        let replyText = response.data.reply.trim();

        // Remove markdown code blocks if present
        if (replyText.startsWith("```json")) {
          replyText = replyText.replace(/```json\n?/i, "").replace(/```\n?/g, "").trim();
        } else if (replyText.startsWith("```")) {
          replyText = replyText.replace(/```\n?/g, "").trim();
        }

        const jsonMatch = replyText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);

          // Post-process: ensure businessName is just the short name
          let cleanBusinessName = (extracted.businessName || "").trim();
          // If the AI returned a name with extra description after it, take only the first part
          // e.g. "TechNova Solutions - A full-service..." → "TechNova Solutions"
          if (cleanBusinessName.includes(" - ")) {
            cleanBusinessName = cleanBusinessName.split(" - ")[0].trim();
          }
          if (cleanBusinessName.includes(": ")) {
            cleanBusinessName = cleanBusinessName.split(": ")[0].trim();
          }
          // Remove any trailing descriptions that start with common connectors
          cleanBusinessName = cleanBusinessName.replace(/\s+(Business Overview|Overview|Description|is a|which is|that is|–|—).*$/i, "").trim();

          setFormData((prev) => ({
            ...prev,
            businessName: cleanBusinessName || prev.businessName,
            businessDescription: extracted.businessDescription || prev.businessDescription,
            websiteUrl: extracted.websiteUrl || prev.websiteUrl,
            services: extracted.services?.length ? extracted.services : prev.services,
            faqs: extracted.faqs?.length ? extracted.faqs : prev.faqs,
            tone: ["friendly", "formal", "sales"].includes(extracted.tone) ? extracted.tone : prev.tone,
            welcomeMessage: extracted.welcomeMessage || prev.welcomeMessage,
            contextData: extracted.contextData || `Based on our conversation:\n\n${conversationText}`,
          }));

          setConversationMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Got it! I've analyzed all your answers and prepared your chatbot profile. Moving to the review step now...",
            },
          ]);

          setIsComplete(true);
          toastMessage("Conversation analyzed successfully!", "success");
          // Small delay for the user to see the success message before transitioning
          setTimeout(() => {
            setCurrentStep(3);
          }, 600);
          return;
        }
      }

      // Fallback if JSON extraction failed
      throw new Error("Could not parse AI response");
    } catch (err) {
      console.error("Error during AI extraction, using fallback:", err);
      // Fallback: use regex-based extraction
      extractDataFromConversation();
      setIsComplete(true);
      toastMessage("Conversation ended. Moving to review...", "info");
      setTimeout(() => {
        setCurrentStep(3);
      }, 600);
    } finally {
      setIsAnalyzing(false);
      setAiThinking(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 2 && !isComplete) {
      toastMessage("Please complete the conversation first", "error");
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      // Build final context from conversation and form data
      const finalContextData = formData.contextData || 
        `Business: ${formData.businessName}\n\n${formData.businessDescription}`;

      const response = await axios.post(
        `${url}/api/chatbots`,
        {
          name: formData.name || formData.businessName || "My Chatbot",
          businessName: formData.businessName,
          websiteUrl: formData.websiteUrl,
          businessDescription: formData.businessDescription || finalContextData,
          services: formData.services,
          faqs: formData.faqs,
          tone: formData.tone,
          language: formData.language,
          welcomeMessage: formData.welcomeMessage,
          themeColor: formData.themeColor,
          position: formData.position,
          contextData: finalContextData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.chatbot) {
        const apiKey = response.data.chatbot.apiKey;
        const backendUrl = getBackendUrl();
        const script = `<script src="${backendUrl}/widget.js" data-api-key="${apiKey}"></script>`;
        setGeneratedScript(script);
        setCreatedApiKey(apiKey);
        setShowScriptModal(true);
        toastMessage("Chatbot created successfully!", "success");
      }
    } catch (err) {
      console.error("Error creating chatbot:", err);
      toastMessage(
        err.response?.data?.error || "Failed to create chatbot",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      toastMessage("Script copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toastMessage("Failed to copy script", "error");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };

  // --- Chatbot Preview ---
  const openChatPreview = () => {
    setShowChatPreview(true);
    setPreviewMessages([
      {
        role: "assistant",
        content: formData.welcomeMessage || "Hello! How can I help you today?",
      },
    ]);
    setPreviewInput("");
  };

  const sendPreviewMessage = async () => {
    if (!previewInput.trim() || previewThinking) return;

    const userMsg = previewInput.trim();
    setPreviewInput("");
    setPreviewMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setPreviewThinking(true);

    try {
      const url = getBackendUrl();
      const response = await axios.post(
        `${url}/api/chat/public`,
        { message: userMsg },
        { headers: { "X-API-Key": createdApiKey } }
      );

      if (response.data.reply) {
        setPreviewMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.data.reply },
        ]);
      }
    } catch (err) {
      console.error("Preview chat error:", err);
      setPreviewMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setPreviewThinking(false);
    }
  };

  const handlePreviewKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPreviewMessage();
    }
  };

  // Scroll preview to bottom
  useEffect(() => {
    previewEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [previewMessages, previewThinking]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
          Personalize Your Chatbot
        </h1>
        <p className="text-[rgb(var(--color-text-secondary))]">
          Let our AI ask you questions to gather information and create your personalized chatbot.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep >= step.id
                    ? "bg-[rgb(var(--color-primary))] text-white"
                    : "bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))]"
                }`}
              >
                {currentStep > step.id ? "✓" : step.id}
              </div>
              <p
                className={`text-xs mt-2 text-center ${
                  currentStep >= step.id
                    ? "text-[rgb(var(--color-primary))] font-semibold"
                    : "text-[rgb(var(--color-text-secondary))]"
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 rounded ${
                  currentStep > step.id
                    ? "bg-[rgb(var(--color-primary))]"
                    : "bg-[rgb(var(--color-border))]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Start */}
      {currentStep === 1 && (
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[rgb(var(--color-primary))]/10 flex items-center justify-center mx-auto">
              <Bot className="w-10 h-10 text-[rgb(var(--color-primary))]" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-text-primary))]">
                Welcome to Personalize Chatbot
              </h2>
              <p className="text-[rgb(var(--color-text-secondary))] mb-6 max-w-2xl mx-auto">
                Our AI will ask you questions about your business to gather all the information needed 
                to create a personalized chatbot. Just answer naturally, and we'll handle the rest!
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Input
                label="Chatbot Name (Optional)"
                placeholder="My Support Bot"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: AI Questions */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Answer Questions</CardTitle>
            <CardDescription>
              Our AI is asking questions to learn about your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Chat Interface */}
            <div className="relative space-y-4">
              <div className="h-96 overflow-y-auto p-4 bg-[rgb(var(--color-surface))] rounded-lg border border-[rgb(var(--color-border))] space-y-4">
                {conversationMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-6 h-6 animate-spin text-[rgb(var(--color-primary))]" />
                  </div>
                ) : (
                  conversationMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-[rgb(var(--color-primary))] text-white"
                            : "bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-primary))] border border-[rgb(var(--color-border))]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}

                {aiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border))] rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Loader className="w-4 h-4 animate-spin text-[rgb(var(--color-primary))]" />
                        <span className="text-sm text-[rgb(var(--color-text-secondary))]">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Analyzing Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[rgb(var(--color-surface))]/80 backdrop-blur-sm rounded-lg">
                  <div className="flex flex-col items-center space-y-4 p-8">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-[rgb(var(--color-primary))]/20 border-t-[rgb(var(--color-primary))] animate-spin" />
                      <Sparkles className="w-6 h-6 text-[rgb(var(--color-primary))] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sm font-medium text-[rgb(var(--color-text-primary))] text-center">
                      Analyzing your answers and building your custom chatbot profile...
                    </p>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="flex space-x-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer..."
                  disabled={aiThinking || isAnalyzing}
                  className="flex-1"
                />
                <Button
                  onClick={sendAnswer}
                  disabled={!userInput.trim() || aiThinking || isAnalyzing}
                  variant="primary"
                >
                  {aiThinking && !isAnalyzing ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* End & Analyze Button */}
              {!isComplete && !isAnalyzing && conversationMessages.length >= 2 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border))]">
                  <p className="text-xs text-[rgb(var(--color-text-secondary))]">
                    Answered enough? End the conversation and we'll analyze your data.
                  </p>
                  <Button
                    onClick={handleEndAndAnalyze}
                    disabled={aiThinking}
                    variant="outline"
                    size="sm"
                    className="ml-3 shrink-0"
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    End & Analyze
                  </Button>
                </div>
              )}

              {isComplete && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Great! We have enough information. Click "Next" to review and customize your chatbot.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Customize */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Customize</CardTitle>
            <CardDescription>
              Review the information we gathered and customize your chatbot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Chatbot Name"
              value={formData.name || formData.businessName || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />

            <Input
              label="Business Name"
              value={formData.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
            />

            <Input
              label="Website URL"
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
            />

            <Textarea
              label="Business Description"
              value={formData.businessDescription}
              onChange={(e) => handleInputChange("businessDescription", e.target.value)}
              rows={6}
            />

            <Select
              label="Tone"
              options={[
                { value: "formal", label: "Formal" },
                { value: "friendly", label: "Friendly" },
                { value: "sales", label: "Sales-Oriented" },
              ]}
              value={formData.tone}
              onChange={(e) => handleInputChange("tone", e.target.value)}
            />

            <Input
              label="Welcome Message"
              value={formData.welcomeMessage}
              onChange={(e) => handleInputChange("welcomeMessage", e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-text-primary))]">
                Theme Color
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) => handleInputChange("themeColor", e.target.value)}
                  className="w-16 h-10 rounded border border-[rgb(var(--color-border))] cursor-pointer"
                />
                <Input
                  value={formData.themeColor}
                  onChange={(e) => handleInputChange("themeColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <Select
              label="Position"
              options={[
                { value: "bottom-right", label: "Bottom Right" },
                { value: "bottom-left", label: "Bottom Left" },
              ]}
              value={formData.position}
              onChange={(e) => handleInputChange("position", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 4: Generate */}
      {currentStep === 4 && (
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-text-primary))]">
                Ready to Generate!
              </h2>
              <p className="text-[rgb(var(--color-text-secondary))] mb-6">
                Review your settings and generate your chatbot embed script.
              </p>
            </div>

            <div className="text-left space-y-2 p-4 rounded-lg bg-[rgb(var(--color-surface))]">
              <p className="font-semibold text-[rgb(var(--color-text-primary))]">
                Chatbot Name: {formData.name || formData.businessName || "My Chatbot"}
              </p>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                Tone: {formData.tone} • Position: {formData.position}
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              size="lg"
              variant="primary"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Code className="w-5 h-5 mr-2" />
                  Generate Embed Script
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[rgb(var(--color-border))]">
        <Button
          onClick={prevStep}
          disabled={currentStep === 1}
          variant="outline"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={nextStep} variant="primary" disabled={currentStep === 2 && !isComplete}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} variant="primary">
            {loading ? "Creating..." : "Create Chatbot"}
          </Button>
        )}
      </div>

      {/* Script Modal */}
      <Modal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        title="Your Embed Script"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-[rgb(var(--color-text-secondary))]">
            Copy this script and paste it before the closing{" "}
            <code className="bg-[rgb(var(--color-surface))] px-2 py-1 rounded">
              &lt;/body&gt;
            </code>{" "}
            tag on your website.
          </p>

          <div className="relative">
            <pre className="bg-[rgb(var(--color-surface))] p-4 rounded-lg overflow-x-auto border border-[rgb(var(--color-border))]">
              <code className="text-sm text-[rgb(var(--color-text-primary))]">
                {generatedScript}
              </code>
            </pre>
            <Button
              onClick={copyScript}
              variant="primary"
              size="sm"
              className="absolute top-2 right-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Try Your Chatbot Button */}
          <Button
            onClick={openChatPreview}
            variant="secondary"
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            Try Your Chatbot
          </Button>

          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setShowScriptModal(false);
                router.push("/chatbots");
              }}
              variant="primary"
              className="flex-1"
            >
              Go to My Chatbots
            </Button>
            <Button
              onClick={() => {
                setShowScriptModal(false);
                setCurrentStep(1);
                setConversationMessages([]);
                setFormData({
                  name: "",
                  businessName: "",
                  websiteUrl: "",
                  businessDescription: "",
                  services: [],
                  faqs: [],
                  tone: "friendly",
                  language: "en",
                  welcomeMessage: "Hello! How can I help you today?",
                  themeColor: "#8B5CF6",
                  position: "bottom-right",
                  contextData: "",
                });
                setIsComplete(false);
              }}
              variant="outline"
              className="flex-1"
            >
              Create Another
            </Button>
          </div>
        </div>
      </Modal>

      {/* Chatbot Preview Panel */}
      {showChatPreview && (
        <div
          className="fixed z-50 animate-fade-in"
          style={{
            bottom: "24px",
            right: formData.position === "bottom-left" ? "auto" : "24px",
            left: formData.position === "bottom-left" ? "24px" : "auto",
            width: "380px",
            maxHeight: "560px",
          }}
        >
          <div
            className="flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-[rgb(var(--color-border))]"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ backgroundColor: formData.themeColor }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {formData.name || formData.businessName || "My Chatbot"}
                  </p>
                  <p className="text-xs text-white/70">Online</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatPreview(false)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[rgb(var(--color-surface))]">
              {previewMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "rounded-br-md text-white"
                        : "rounded-bl-md bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-primary))] border border-[rgb(var(--color-border))]"
                    }`}
                    style={
                      msg.role === "user" ? { backgroundColor: formData.themeColor } : {}
                    }
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {previewThinking && (
                <div className="flex justify-start">
                  <div className="bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border))] rounded-2xl rounded-bl-md px-4 py-2.5">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: formData.themeColor, animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: formData.themeColor, animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: formData.themeColor, animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={previewEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] shrink-0">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={previewInput}
                  onChange={(e) => setPreviewInput(e.target.value)}
                  onKeyPress={handlePreviewKeyPress}
                  placeholder="Type a message..."
                  disabled={previewThinking}
                  className="flex-1 bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-primary))] text-sm rounded-full px-4 py-2.5 border border-[rgb(var(--color-border))] focus:outline-none focus:ring-2 disabled:opacity-50 placeholder:text-[rgb(var(--color-text-secondary))]"
                  style={{ focusRingColor: formData.themeColor }}
                />
                <button
                  onClick={sendPreviewMessage}
                  disabled={!previewInput.trim() || previewThinking}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 hover:opacity-90 shrink-0"
                  style={{ backgroundColor: formData.themeColor }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
